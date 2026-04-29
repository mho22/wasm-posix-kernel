/*
 * sdl2-event — pumps SDL2 events for ~250 ms and prints the deltas.
 *
 * Used by host/test/sdl2-event.test.ts: the host injects PS/2 mouse
 * frames via kernel.injectMouseEvent(...), this program reads them via
 * /dev/input/mice through fbposix's PumpEvents, and we assert the SDL
 * delta accounting matches.
 */
#include <SDL.h>
#include <stdio.h>

int main(void)
{
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        fprintf(stderr, "SDL_Init: %s\n", SDL_GetError());
        return 1;
    }
    SDL_Window *w = SDL_CreateWindow("ev", 0, 0, 640, 400, 0);
    if (!w) {
        fprintf(stderr, "SDL_CreateWindow: %s\n", SDL_GetError());
        return 1;
    }

    /* Signal readiness — the host test waits on this before injecting. */
    write(1, "ready\n", 6);
    fflush(stdout);

    Uint32 t0 = SDL_GetTicks();
    int btn_down = 0, motion_dx = 0, motion_dy = 0;
    while (SDL_GetTicks() - t0 < 250) {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_MOUSEBUTTONDOWN) {
                btn_down = 1;
            } else if (e.type == SDL_MOUSEMOTION) {
                motion_dx += e.motion.xrel;
                motion_dy += e.motion.yrel;
            }
        }
        SDL_Delay(10);
    }
    printf("btn=%d dx=%d dy=%d\n", btn_down, motion_dx, motion_dy);
    fflush(stdout);

    SDL_DestroyWindow(w);
    SDL_Quit();
    return 0;
}
