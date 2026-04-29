/*
 * fbposix — SDL2 video driver bootstrap + display + window callbacks.
 *
 * Single full-screen window over /dev/fb0. CreateWindowFramebuffer /
 * UpdateWindowFramebuffer in SDL_fbposixframebuffer.c is the actual
 * pixel-delivery path.
 */
#include "../../SDL_internal.h"

#if SDL_VIDEO_DRIVER_FBPOSIX

#include <fcntl.h>
#include <linux/fb.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <termios.h>
#include <unistd.h>

#include "../SDL_sysvideo.h"
#include "../SDL_pixels_c.h"

#include "SDL_fbposixvideo.h"
#include "SDL_fbposixevents.h"
#include "SDL_fbposixframebuffer.h"

#define FBPOSIX_DRIVER_NAME "fbposix"

/* Forward declarations of static driver callbacks. */
static int  FBPOSIX_VideoInit(_THIS);
static void FBPOSIX_VideoQuit(_THIS);
static int  FBPOSIX_GetDisplayBounds(_THIS, SDL_VideoDisplay *display, SDL_Rect *rect);
static void FBPOSIX_GetDisplayModes(_THIS, SDL_VideoDisplay *display);
static int  FBPOSIX_SetDisplayMode(_THIS, SDL_VideoDisplay *display, SDL_DisplayMode *mode);
static int  FBPOSIX_CreateSDLWindow(_THIS, SDL_Window *window);
static void FBPOSIX_SetWindowTitle(_THIS, SDL_Window *window);
static void FBPOSIX_SetWindowPosition(_THIS, SDL_Window *window);
static void FBPOSIX_SetWindowSize(_THIS, SDL_Window *window);
static void FBPOSIX_ShowWindow(_THIS, SDL_Window *window);
static void FBPOSIX_HideWindow(_THIS, SDL_Window *window);
static void FBPOSIX_RaiseWindow(_THIS, SDL_Window *window);
static void FBPOSIX_DestroyWindow(_THIS, SDL_Window *window);

static int FBPOSIX_Available(void)
{
    int fd = open(FBPOSIX_FB_DEVICE, O_RDWR);
    if (fd < 0) {
        return 0;
    }
    close(fd);
    return 1;
}

static void FBPOSIX_DeleteDevice(SDL_VideoDevice *device)
{
    if (device->driverdata) {
        SDL_free(device->driverdata);
    }
    SDL_free(device);
}

static SDL_VideoDevice *FBPOSIX_CreateDevice(int devindex)
{
    SDL_VideoDevice *device;
    FBPOSIX_Device *fb;

    (void)devindex;

    device = (SDL_VideoDevice *)SDL_calloc(1, sizeof(*device));
    if (!device) {
        SDL_OutOfMemory();
        return NULL;
    }

    fb = (FBPOSIX_Device *)SDL_calloc(1, sizeof(*fb));
    if (!fb) {
        SDL_free(device);
        SDL_OutOfMemory();
        return NULL;
    }
    fb->fb_fd = -1;
    fb->mice_fd = -1;
    device->driverdata = fb;

    /* Bootstrap. */
    device->VideoInit = FBPOSIX_VideoInit;
    device->VideoQuit = FBPOSIX_VideoQuit;

    /* Display. */
    device->GetDisplayBounds = FBPOSIX_GetDisplayBounds;
    device->GetDisplayModes  = FBPOSIX_GetDisplayModes;
    device->SetDisplayMode   = FBPOSIX_SetDisplayMode;

    /* Window lifecycle. */
    device->CreateSDLWindow   = FBPOSIX_CreateSDLWindow;
    device->SetWindowTitle    = FBPOSIX_SetWindowTitle;
    device->SetWindowPosition = FBPOSIX_SetWindowPosition;
    device->SetWindowSize     = FBPOSIX_SetWindowSize;
    device->ShowWindow        = FBPOSIX_ShowWindow;
    device->HideWindow        = FBPOSIX_HideWindow;
    device->RaiseWindow       = FBPOSIX_RaiseWindow;
    device->DestroyWindow     = FBPOSIX_DestroyWindow;

    /* Per-window framebuffer (software rendering path). */
    device->CreateWindowFramebuffer  = FBPOSIX_CreateWindowFramebuffer;
    device->UpdateWindowFramebuffer  = FBPOSIX_UpdateWindowFramebuffer;
    device->DestroyWindowFramebuffer = FBPOSIX_DestroyWindowFramebuffer;

    /* Event pump. */
    device->PumpEvents = FBPOSIX_PumpEvents;

    device->free = FBPOSIX_DeleteDevice;
    device->quirk_flags = VIDEO_DEVICE_QUIRK_FULLSCREEN_ONLY_USABLE_FOR_SRT;

    return device;
}

VideoBootStrap FBPOSIX_bootstrap = {
    FBPOSIX_DRIVER_NAME,
    "Linux fbdev (wasm-posix-kernel)",
    FBPOSIX_CreateDevice,
    NULL /* ShowMessageBox — not supported */
};

static int FBPOSIX_VideoInit(_THIS)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    SDL_VideoDisplay display;
    SDL_DisplayMode mode;
    struct fb_var_screeninfo vinfo;
    struct fb_fix_screeninfo finfo;

    fb->fb_fd = open(FBPOSIX_FB_DEVICE, O_RDWR);
    if (fb->fb_fd < 0) {
        return SDL_SetError("fbposix: open(%s) failed: %s",
                            FBPOSIX_FB_DEVICE, strerror(errno));
    }

    if (ioctl(fb->fb_fd, FBIOGET_VSCREENINFO, &vinfo) < 0) {
        close(fb->fb_fd);
        fb->fb_fd = -1;
        return SDL_SetError("fbposix: FBIOGET_VSCREENINFO: %s", strerror(errno));
    }
    if (ioctl(fb->fb_fd, FBIOGET_FSCREENINFO, &finfo) < 0) {
        close(fb->fb_fd);
        fb->fb_fd = -1;
        return SDL_SetError("fbposix: FBIOGET_FSCREENINFO: %s", strerror(errno));
    }

    fb->fb_size   = (int)finfo.smem_len;
    fb->fb_pixels = mmap(NULL, fb->fb_size, PROT_READ | PROT_WRITE,
                         MAP_SHARED, fb->fb_fd, 0);
    if (fb->fb_pixels == MAP_FAILED) {
        fb->fb_pixels = NULL;
        close(fb->fb_fd);
        fb->fb_fd = -1;
        return SDL_SetError("fbposix: mmap: %s", strerror(errno));
    }

    /* The kernel hands us a fixed 640x400 BGRA32 surface; if anything
     * else comes back, fail cleanly rather than silently mis-renders. */
    if (vinfo.xres != FBPOSIX_FB_W || vinfo.yres != FBPOSIX_FB_H ||
        vinfo.bits_per_pixel != FBPOSIX_FB_BPP) {
        munmap(fb->fb_pixels, fb->fb_size);
        close(fb->fb_fd);
        fb->fb_pixels = NULL;
        fb->fb_fd = -1;
        return SDL_SetError("fbposix: unexpected geometry %ux%u@%ubpp",
                            vinfo.xres, vinfo.yres, vinfo.bits_per_pixel);
    }

    SDL_zero(mode);
    mode.format       = SDL_PIXELFORMAT_BGRA8888;
    mode.w            = FBPOSIX_FB_W;
    mode.h            = FBPOSIX_FB_H;
    mode.refresh_rate = 60;

    SDL_zero(display);
    display.desktop_mode = mode;
    display.current_mode = mode;
    if (SDL_AddVideoDisplay(&display, SDL_FALSE) < 0) {
        munmap(fb->fb_pixels, fb->fb_size);
        close(fb->fb_fd);
        fb->fb_pixels = NULL;
        fb->fb_fd = -1;
        return -1;
    }

    if (FBPOSIX_InitInput(_this) < 0) {
        /* Already-registered display will be torn down by VideoQuit. */
        return -1;
    }
    fb->mouse_x = FBPOSIX_FB_W / 2;
    fb->mouse_y = FBPOSIX_FB_H / 2;

    return 0;
}

static void FBPOSIX_VideoQuit(_THIS)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;

    FBPOSIX_QuitInput(_this);

    if (fb->fb_pixels && fb->fb_pixels != MAP_FAILED) {
        munmap(fb->fb_pixels, fb->fb_size);
        fb->fb_pixels = NULL;
    }
    if (fb->fb_fd >= 0) {
        close(fb->fb_fd);
        fb->fb_fd = -1;
    }
}

static int FBPOSIX_GetDisplayBounds(_THIS, SDL_VideoDisplay *display, SDL_Rect *rect)
{
    (void)_this;
    (void)display;
    rect->x = 0;
    rect->y = 0;
    rect->w = FBPOSIX_FB_W;
    rect->h = FBPOSIX_FB_H;
    return 0;
}

static void FBPOSIX_GetDisplayModes(_THIS, SDL_VideoDisplay *display)
{
    SDL_DisplayMode mode;

    (void)_this;

    SDL_zero(mode);
    mode.format       = SDL_PIXELFORMAT_BGRA8888;
    mode.w            = FBPOSIX_FB_W;
    mode.h            = FBPOSIX_FB_H;
    mode.refresh_rate = 60;
    SDL_AddDisplayMode(display, &mode);
}

static int FBPOSIX_SetDisplayMode(_THIS, SDL_VideoDisplay *display, SDL_DisplayMode *mode)
{
    (void)_this;
    (void)display;
    if (mode->w != FBPOSIX_FB_W || mode->h != FBPOSIX_FB_H) {
        return SDL_SetError("fbposix: unsupported mode %dx%d (only %dx%d)",
                            mode->w, mode->h, FBPOSIX_FB_W, FBPOSIX_FB_H);
    }
    return 0;
}

static int FBPOSIX_CreateSDLWindow(_THIS, SDL_Window *window)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    FBPOSIX_WindowData *wd;

    if (fb->window) {
        return SDL_SetError("fbposix: only one window supported");
    }

    wd = (FBPOSIX_WindowData *)SDL_calloc(1, sizeof(*wd));
    if (!wd) {
        return SDL_OutOfMemory();
    }
    window->driverdata = wd;
    fb->window = window;

    /* Pin window position to (0, 0) and size to the framebuffer. SDL2
     * software renderer is fine with any logical size; the framebuffer
     * callback path scales as needed. */
    return 0;
}

static void FBPOSIX_SetWindowTitle(_THIS, SDL_Window *window)
{
    (void)_this;
    (void)window;
}

static void FBPOSIX_SetWindowPosition(_THIS, SDL_Window *window)
{
    (void)_this;
    (void)window;
}

static void FBPOSIX_SetWindowSize(_THIS, SDL_Window *window)
{
    /* SDL_RecreateWindow may resize between window create and surface
     * acquisition. We accept the new size; the framebuffer callbacks
     * pick the right path on the next CreateWindowFramebuffer. */
    (void)_this;
    (void)window;
}

static void FBPOSIX_ShowWindow(_THIS, SDL_Window *window)
{
    (void)_this;
    (void)window;
}
static void FBPOSIX_HideWindow(_THIS, SDL_Window *window)
{
    (void)_this;
    (void)window;
}
static void FBPOSIX_RaiseWindow(_THIS, SDL_Window *window)
{
    (void)_this;
    (void)window;
}

static void FBPOSIX_DestroyWindow(_THIS, SDL_Window *window)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    FBPOSIX_WindowData *wd = (FBPOSIX_WindowData *)window->driverdata;

    if (wd) {
        if (wd->backing) {
            SDL_free(wd->backing);
        }
        SDL_free(wd);
        window->driverdata = NULL;
    }
    if (fb->window == window) {
        fb->window = NULL;
    }
}

#endif /* SDL_VIDEO_DRIVER_FBPOSIX */
