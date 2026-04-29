/*
 * fbposix per-window framebuffer — software-renderer pixel delivery.
 *
 *   - 640x400 windows: hand back the /dev/fb0 mmap directly. Zero-copy.
 *   - Other sizes: allocate a per-window backing buffer and nearest-
 *     neighbor scale onto the mmap on update.
 */
#include "../../SDL_internal.h"

#if SDL_VIDEO_DRIVER_FBPOSIX

#include "../SDL_sysvideo.h"
#include "SDL_fbposixvideo.h"
#include "SDL_fbposixframebuffer.h"

int FBPOSIX_CreateWindowFramebuffer(_THIS, SDL_Window *window,
                                    Uint32 *format, void **pixels, int *pitch)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    FBPOSIX_WindowData *wd = (FBPOSIX_WindowData *)window->driverdata;
    int w = window->w;
    int h = window->h;

    *format = SDL_PIXELFORMAT_BGRA8888;
    *pitch  = w * 4;

    if (w == FBPOSIX_FB_W && h == FBPOSIX_FB_H) {
        /* Native size — zero copy. */
        if (wd->backing) {
            SDL_free(wd->backing);
            wd->backing = NULL;
        }
        wd->backing_w = 0;
        wd->backing_h = 0;
        *pixels = fb->fb_pixels;
        return 0;
    }

    /* Reuse existing backing if size matches. */
    if (wd->backing && wd->backing_w == w && wd->backing_h == h) {
        *pixels = wd->backing;
        return 0;
    }

    if (wd->backing) {
        SDL_free(wd->backing);
        wd->backing = NULL;
    }
    wd->backing = SDL_calloc(1, (size_t)w * (size_t)h * 4);
    if (!wd->backing) {
        return SDL_OutOfMemory();
    }
    wd->backing_w = w;
    wd->backing_h = h;
    *pixels = wd->backing;
    return 0;
}

int FBPOSIX_UpdateWindowFramebuffer(_THIS, SDL_Window *window,
                                    const SDL_Rect *rects, int numrects)
{
    FBPOSIX_Device *fb = (FBPOSIX_Device *)_this->driverdata;
    FBPOSIX_WindowData *wd = (FBPOSIX_WindowData *)window->driverdata;

    (void)rects;
    (void)numrects;

    if (!wd->backing) {
        /* Native-size path — pixels already in the mmap. */
        return 0;
    }

    /* Nearest-neighbor scale wd->backing → fb->fb_pixels. ScummVM
     * presents at 320x200 (2x in either axis), so the inner loop is
     * dominated by a 256k-pixel sweep at ~30 FPS — trivial. */
    {
        const Uint32 *src = (const Uint32 *)wd->backing;
        Uint32       *dst = (Uint32 *)fb->fb_pixels;
        const int sw = wd->backing_w;
        const int sh = wd->backing_h;
        const int dw = FBPOSIX_FB_W;
        const int dh = FBPOSIX_FB_H;
        int dy;

        for (dy = 0; dy < dh; dy++) {
            int sy = (dy * sh) / dh;
            const Uint32 *sline = src + sy * sw;
            Uint32       *dline = dst + dy * dw;
            int dx;
            for (dx = 0; dx < dw; dx++) {
                int sx = (dx * sw) / dw;
                dline[dx] = sline[sx];
            }
        }
    }

    /* No-op success: kernel side ignores FBIOPAN_DISPLAY, host RAF
     * presents continuously. */
    return 0;
}

void FBPOSIX_DestroyWindowFramebuffer(_THIS, SDL_Window *window)
{
    FBPOSIX_WindowData *wd = (FBPOSIX_WindowData *)window->driverdata;
    (void)_this;
    if (wd && wd->backing) {
        SDL_free(wd->backing);
        wd->backing = NULL;
        wd->backing_w = 0;
        wd->backing_h = 0;
    }
}

#endif /* SDL_VIDEO_DRIVER_FBPOSIX */
