/*
 * fbposix — SDL2 video driver targeting /dev/fb0 on the wasm-posix-kernel.
 *
 * The driver also owns the event pump (SDL_fbposixevents.c) — it reads
 * keyboard from STDIN_FILENO in raw termios and mouse from
 * /dev/input/mice in PS/2 packet form. Single full-screen window only.
 * Fixed 640x400 BGRA32 surface; non-matching window sizes are scaled
 * by SDL_fbposixframebuffer.c.
 *
 * Lives at src/video/fbposix/ inside the SDL2 source tree (copied in
 * by examples/libs/sdl2/build-sdl2.sh before configure).
 */
#ifndef SDL_fbposixvideo_h_
#define SDL_fbposixvideo_h_

#include "../../SDL_internal.h"

#if SDL_VIDEO_DRIVER_FBPOSIX

#include "../SDL_sysvideo.h"

#define FBPOSIX_FB_DEVICE   "/dev/fb0"
#define FBPOSIX_MICE_DEVICE "/dev/input/mice"

/* Fixed framebuffer geometry — must match the kernel's /dev/fb0. */
#define FBPOSIX_FB_W      640
#define FBPOSIX_FB_H      400
#define FBPOSIX_FB_BPP    32
#define FBPOSIX_FB_PITCH  (FBPOSIX_FB_W * 4)
#define FBPOSIX_FB_SIZE   (FBPOSIX_FB_PITCH * FBPOSIX_FB_H)

typedef struct {
    int fb_fd;
    void *fb_pixels;     /* mmap'd /dev/fb0 — BGRA32 */
    int  fb_size;

    int mice_fd;         /* /dev/input/mice, O_NONBLOCK */
    Uint8 mice_partial[3];
    int   mice_partial_len;

    /* Synthetic mouse state. PS/2 deltas accumulate into this; SDL
     * absolute coords are clamped to [0, FB_W) × [0, FB_H). */
    int  mouse_x, mouse_y;
    Uint8 mouse_buttons;   /* SDL button bitmap */
    SDL_bool relative_mode;

    /* Stdin termios save/restore so we can put it in raw mode for
     * SDL_TEXTINPUT delivery. The original termios is captured on
     * VideoInit and restored on VideoQuit. */
    struct termios saved_termios;
    int saved_termios_valid;

    /* Active SDL_Window — single-window driver. NULL if no window. */
    SDL_Window *window;
} FBPOSIX_Device;

typedef struct {
    /* Per-window backing for non-native-size windows. NULL for the
     * 640x400 fast path (the framebuffer mmap is handed back directly). */
    void *backing;
    int   backing_w, backing_h;
} FBPOSIX_WindowData;

extern VideoBootStrap FBPOSIX_bootstrap;

#endif /* SDL_VIDEO_DRIVER_FBPOSIX */

#endif /* SDL_fbposixvideo_h_ */
