/*
 * fbposix event pump.
 *
 *   Keyboard — STDIN_FILENO in raw termios. Each PumpEvents drains up
 *   to 64 bytes non-blocking. Escape sequences are accumulated across
 *   calls until the terminator arrives. Each decoded scancode emits an
 *   immediate KEYDOWN+KEYUP pair (stdin doesn't carry release events;
 *   matches fbcon-style behaviour). Printable ASCII also emits
 *   SDL_TEXTINPUT.
 *
 *   Mouse — /dev/input/mice in PS/2 3-byte frames. Buttons, dx, dy
 *   (positive-up; we negate for SDL2). Synthetic absolute (x, y) is
 *   clamped to the framebuffer.
 */
#include "../../SDL_internal.h"

#if SDL_VIDEO_DRIVER_FBPOSIX

#include <errno.h>
#include <fcntl.h>
#include <stdint.h>
#include <string.h>
#include <termios.h>
#include <unistd.h>

#include "../../events/SDL_events_c.h"
#include "../../events/SDL_keyboard_c.h"
#include "../../events/SDL_mouse_c.h"
#include "../SDL_sysvideo.h"

#include "SDL_fbposixvideo.h"
#include "SDL_fbposixevents.h"

/* Set fd to non-blocking; returns 0 / -1. */
static int set_nonblock(int fd)
{
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags < 0) return -1;
    return fcntl(fd, F_SETFL, flags | O_NONBLOCK);
}

int FBPOSIX_InitInput(_THIS)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    struct termios raw;

    /* Save stdin termios and switch to raw so SDL_TEXTINPUT delivery
     * isn't double-echoed and Ctrl-C reaches the application as a
     * byte rather than a SIGINT. ScummVM expects raw stdin. */
    if (tcgetattr(STDIN_FILENO, &fb->saved_termios) == 0) {
        fb->saved_termios_valid = 1;
        raw = fb->saved_termios;
        cfmakeraw(&raw);
        tcsetattr(STDIN_FILENO, TCSANOW, &raw);
    }
    set_nonblock(STDIN_FILENO);

    fb->mice_fd = open(FBPOSIX_MICE_DEVICE, O_RDONLY | O_NONBLOCK);
    /* Mouse is optional — SDL2 still operates with keyboard-only if
     * /dev/input/mice isn't present in this kernel. ScummVM's launcher
     * accepts keyboard navigation. */

    return 0;
}

void FBPOSIX_QuitInput(_THIS)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;

    if (fb->mice_fd >= 0) {
        close(fb->mice_fd);
        fb->mice_fd = -1;
    }
    if (fb->saved_termios_valid) {
        tcsetattr(STDIN_FILENO, TCSANOW, &fb->saved_termios);
        fb->saved_termios_valid = 0;
    }
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                           */
/* ------------------------------------------------------------------ */

static void key_press(SDL_Scancode sc, SDL_Keycode kc, int textinput, char ascii)
{
    SDL_SendKeyboardKey(SDL_PRESSED, sc);
    if (textinput && ascii > 0) {
        char buf[2] = { ascii, 0 };
        SDL_SendKeyboardText(buf);
    }
    SDL_SendKeyboardKey(SDL_RELEASED, sc);
    (void)kc;
}

/* Decode CSI sequence body (after "\e["). Returns SDL_SCANCODE_UNKNOWN
 * if we don't recognise it. */
static SDL_Scancode decode_csi(const char *body)
{
    /* Single-letter terminators. */
    switch (body[0]) {
        case 'A': return SDL_SCANCODE_UP;
        case 'B': return SDL_SCANCODE_DOWN;
        case 'C': return SDL_SCANCODE_RIGHT;
        case 'D': return SDL_SCANCODE_LEFT;
        case 'H': return SDL_SCANCODE_HOME;
        case 'F': return SDL_SCANCODE_END;
    }
    /* Numeric tilde sequences. */
    if (strcmp(body, "1~") == 0 || strcmp(body, "7~") == 0) return SDL_SCANCODE_HOME;
    if (strcmp(body, "4~") == 0 || strcmp(body, "8~") == 0) return SDL_SCANCODE_END;
    if (strcmp(body, "2~") == 0) return SDL_SCANCODE_INSERT;
    if (strcmp(body, "3~") == 0) return SDL_SCANCODE_DELETE;
    if (strcmp(body, "5~") == 0) return SDL_SCANCODE_PAGEUP;
    if (strcmp(body, "6~") == 0) return SDL_SCANCODE_PAGEDOWN;
    if (strcmp(body, "11~") == 0 || strcmp(body, "P") == 0) return SDL_SCANCODE_F1;
    if (strcmp(body, "12~") == 0 || strcmp(body, "Q") == 0) return SDL_SCANCODE_F2;
    if (strcmp(body, "13~") == 0 || strcmp(body, "R") == 0) return SDL_SCANCODE_F3;
    if (strcmp(body, "14~") == 0 || strcmp(body, "S") == 0) return SDL_SCANCODE_F4;
    if (strcmp(body, "15~") == 0) return SDL_SCANCODE_F5;
    if (strcmp(body, "17~") == 0) return SDL_SCANCODE_F6;
    if (strcmp(body, "18~") == 0) return SDL_SCANCODE_F7;
    if (strcmp(body, "19~") == 0) return SDL_SCANCODE_F8;
    if (strcmp(body, "20~") == 0) return SDL_SCANCODE_F9;
    if (strcmp(body, "21~") == 0) return SDL_SCANCODE_F10;
    if (strcmp(body, "23~") == 0) return SDL_SCANCODE_F11;
    if (strcmp(body, "24~") == 0) return SDL_SCANCODE_F12;
    return SDL_SCANCODE_UNKNOWN;
}

static SDL_Scancode ascii_scancode(char c)
{
    if (c >= 'a' && c <= 'z') return (SDL_Scancode)(SDL_SCANCODE_A + (c - 'a'));
    if (c >= 'A' && c <= 'Z') return (SDL_Scancode)(SDL_SCANCODE_A + (c - 'A'));
    if (c >= '1' && c <= '9') return (SDL_Scancode)(SDL_SCANCODE_1 + (c - '1'));
    if (c == '0') return SDL_SCANCODE_0;
    switch (c) {
        case ' ':  return SDL_SCANCODE_SPACE;
        case '\r':
        case '\n': return SDL_SCANCODE_RETURN;
        case '\t': return SDL_SCANCODE_TAB;
        case 0x7f:
        case 0x08: return SDL_SCANCODE_BACKSPACE;
        case 0x1b: return SDL_SCANCODE_ESCAPE;
    }
    return SDL_SCANCODE_UNKNOWN;
}

static void pump_keyboard(_THIS)
{
    static char esc_buf[16];
    static int  esc_len = 0;
    static int  in_esc  = 0;

    char buf[64];
    ssize_t n;

    (void)_this;
    n = read(STDIN_FILENO, buf, sizeof(buf));
    if (n <= 0) {
        return;
    }

    for (ssize_t i = 0; i < n; i++) {
        unsigned char c = (unsigned char)buf[i];

        if (in_esc) {
            if (esc_len < (int)sizeof(esc_buf) - 1) {
                esc_buf[esc_len++] = (char)c;
            }
            esc_buf[esc_len] = 0;

            /* CSI: \e[ ... <terminator> where terminator ∈ [@-~]. */
            if (esc_buf[0] == '[' && esc_len >= 2) {
                char term = esc_buf[esc_len - 1];
                if ((term >= '@' && term <= '~') && term != '[') {
                    SDL_Scancode sc = decode_csi(esc_buf + 1);
                    if (sc != SDL_SCANCODE_UNKNOWN) {
                        key_press(sc, 0, 0, 0);
                    }
                    in_esc = 0;
                    esc_len = 0;
                }
            } else if (esc_buf[0] == 'O' && esc_len >= 2) {
                /* SS3 — \eOP / \eOQ / \eOR / \eOS = F1..F4 */
                SDL_Scancode sc = SDL_SCANCODE_UNKNOWN;
                switch (esc_buf[1]) {
                    case 'P': sc = SDL_SCANCODE_F1; break;
                    case 'Q': sc = SDL_SCANCODE_F2; break;
                    case 'R': sc = SDL_SCANCODE_F3; break;
                    case 'S': sc = SDL_SCANCODE_F4; break;
                    case 'H': sc = SDL_SCANCODE_HOME; break;
                    case 'F': sc = SDL_SCANCODE_END; break;
                }
                if (sc != SDL_SCANCODE_UNKNOWN) {
                    key_press(sc, 0, 0, 0);
                }
                in_esc = 0;
                esc_len = 0;
            } else if (esc_len == 1 && esc_buf[0] != '[' && esc_buf[0] != 'O') {
                /* Bare \e<x> — treat as Escape followed by x. */
                key_press(SDL_SCANCODE_ESCAPE, 0, 0, 0);
                /* Re-feed the byte through normal path. */
                in_esc = 0;
                esc_len = 0;
                /* NB: drop through to printable-char handling below. */
                c = (unsigned char)esc_buf[0];
            } else {
                /* Continue accumulating. */
                continue;
            }
        }

        if (c == 0x1b) {
            in_esc = 1;
            esc_len = 0;
            continue;
        }

        {
            SDL_Scancode sc = ascii_scancode((char)c);
            int textinput = (c >= 0x20 && c < 0x7f);
            if (sc != SDL_SCANCODE_UNKNOWN) {
                key_press(sc, 0, textinput, (char)c);
            } else if (textinput) {
                /* Symbols we didn't map — still surface as TEXTINPUT. */
                char s[2] = { (char)c, 0 };
                SDL_SendKeyboardText(s);
            }
        }
    }
}

/* ------------------------------------------------------------------ */
/* Mouse                                                              */
/* ------------------------------------------------------------------ */

static void emit_mouse_motion(FBPOSIX_Device *fb, int dx, int dy)
{
    SDL_Window *win = fb->window;

    if (fb->relative_mode) {
        SDL_SendMouseMotion(win, 0, 1, dx, dy);
        return;
    }

    fb->mouse_x += dx;
    fb->mouse_y += dy;
    if (fb->mouse_x < 0) fb->mouse_x = 0;
    if (fb->mouse_y < 0) fb->mouse_y = 0;
    if (fb->mouse_x >= FBPOSIX_FB_W) fb->mouse_x = FBPOSIX_FB_W - 1;
    if (fb->mouse_y >= FBPOSIX_FB_H) fb->mouse_y = FBPOSIX_FB_H - 1;
    SDL_SendMouseMotion(win, 0, 0, fb->mouse_x, fb->mouse_y);
}

static void decode_ps2_frame(FBPOSIX_Device *fb, const Uint8 *p)
{
    /* PS/2 byte 0:
     *   bit 0 = left button, bit 1 = right, bit 2 = middle
     *   bit 3 = always 1
     *   bit 4 = X sign, bit 5 = Y sign
     *   bit 6 = X overflow, bit 7 = Y overflow
     * bytes 1, 2 = signed dx, dy (positive-up).
     */
    Uint8 b0 = p[0];
    int dx = (int)(int8_t)p[1];
    int dy = (int)(int8_t)p[2];

    /* Convert PS/2 positive-up to SDL2 positive-down. */
    dy = -dy;

    if (dx != 0 || dy != 0) {
        emit_mouse_motion(fb, dx, dy);
    }

    /* Buttons. SDL2 button numbering: 1=left, 2=middle, 3=right. */
    Uint8 sdl_buttons = 0;
    if (b0 & 0x01) sdl_buttons |= SDL_BUTTON(SDL_BUTTON_LEFT);
    if (b0 & 0x02) sdl_buttons |= SDL_BUTTON(SDL_BUTTON_RIGHT);
    if (b0 & 0x04) sdl_buttons |= SDL_BUTTON(SDL_BUTTON_MIDDLE);

    if (sdl_buttons != fb->mouse_buttons) {
        const struct { Uint8 mask; Uint8 button; } map[] = {
            { SDL_BUTTON(SDL_BUTTON_LEFT),   SDL_BUTTON_LEFT },
            { SDL_BUTTON(SDL_BUTTON_MIDDLE), SDL_BUTTON_MIDDLE },
            { SDL_BUTTON(SDL_BUTTON_RIGHT),  SDL_BUTTON_RIGHT },
        };
        for (int i = 0; i < 3; i++) {
            int was = (fb->mouse_buttons & map[i].mask) != 0;
            int now = (sdl_buttons      & map[i].mask) != 0;
            if (was != now) {
                SDL_SendMouseButton(fb->window, 0,
                                    now ? SDL_PRESSED : SDL_RELEASED,
                                    map[i].button);
            }
        }
        fb->mouse_buttons = sdl_buttons;
    }
}

static void pump_mouse(_THIS)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    Uint8 buf[24];
    ssize_t n;

    if (fb->mice_fd < 0) return;

    n = read(fb->mice_fd, buf, sizeof(buf));
    if (n <= 0) return;

    /* Combine partial-frame remainder + new bytes. */
    Uint8 stream[24 + 3];
    int stream_len = 0;
    for (int i = 0; i < fb->mice_partial_len; i++) {
        stream[stream_len++] = fb->mice_partial[i];
    }
    for (ssize_t i = 0; i < n; i++) {
        stream[stream_len++] = buf[i];
    }

    int off = 0;
    while (stream_len - off >= 3) {
        decode_ps2_frame(fb, stream + off);
        off += 3;
    }

    fb->mice_partial_len = stream_len - off;
    for (int i = 0; i < fb->mice_partial_len; i++) {
        fb->mice_partial[i] = stream[off + i];
    }
}

/* ------------------------------------------------------------------ */
/* Pump                                                               */
/* ------------------------------------------------------------------ */

void FBPOSIX_PumpEvents(_THIS)
{
    pump_keyboard(_this);
    pump_mouse(_this);
}

#endif /* SDL_VIDEO_DRIVER_FBPOSIX */
