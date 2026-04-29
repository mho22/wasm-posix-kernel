/*
 * sdl2-smoke — boots SDL2 with the fbposix driver, opens a 640×400
 * window, fills it red, calls UpdateWindowSurface to land BGRA pixels
 * in /dev/fb0, then exits. Used by host/test/sdl2-smoke.test.ts to
 * verify the whole SDL2 → fbdev → kernel framebuffer pipe.
 */
#include <SDL.h>
#include <stdio.h>
#include <unistd.h>

int main(void)
{
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        fprintf(stderr, "SDL_Init: %s\n", SDL_GetError());
        return 1;
    }
    SDL_Window *w = SDL_CreateWindow("smoke",
        SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,
        640, 400, 0);
    if (!w) {
        fprintf(stderr, "SDL_CreateWindow: %s\n", SDL_GetError());
        return 1;
    }
    SDL_Surface *s = SDL_GetWindowSurface(w);
    if (!s) {
        fprintf(stderr, "SDL_GetWindowSurface: %s\n", SDL_GetError());
        return 1;
    }
    SDL_FillRect(s, NULL, SDL_MapRGB(s->format, 255, 0, 0));  /* red */
    SDL_UpdateWindowSurface(w);

    write(1, "ok\n", 3);
    SDL_Delay(50);

    SDL_DestroyWindow(w);
    SDL_Quit();
    return 0;
}
