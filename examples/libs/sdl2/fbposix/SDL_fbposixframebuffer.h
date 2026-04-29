/*
 * fbposix per-window framebuffer callbacks. SDL2's software renderer
 * asks the driver for a CPU-writable buffer (CreateWindowFramebuffer),
 * blits into it, then calls UpdateWindowFramebuffer to flush.
 *
 * For 640x400 windows we hand back the mmap directly — zero copy.
 * For other sizes we allocate a backing buffer and scale on update.
 */
#ifndef SDL_fbposixframebuffer_h_
#define SDL_fbposixframebuffer_h_

#include "../../SDL_internal.h"

#if SDL_VIDEO_DRIVER_FBPOSIX

#include "../SDL_sysvideo.h"

extern int FBPOSIX_CreateWindowFramebuffer(_THIS, SDL_Window *window,
                                           Uint32 *format, void **pixels,
                                           int *pitch);
extern int FBPOSIX_UpdateWindowFramebuffer(_THIS, SDL_Window *window,
                                           const SDL_Rect *rects, int numrects);
extern void FBPOSIX_DestroyWindowFramebuffer(_THIS, SDL_Window *window);

#endif /* SDL_VIDEO_DRIVER_FBPOSIX */

#endif /* SDL_fbposixframebuffer_h_ */
