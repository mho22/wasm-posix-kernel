/*
 * fbposix event pump — keyboard from stdin (raw termios), mouse from
 * /dev/input/mice (PS/2). See SDL_fbposixvideo.h for design notes.
 */
#ifndef SDL_fbposixevents_h_
#define SDL_fbposixevents_h_

#include "../../SDL_internal.h"

#if SDL_VIDEO_DRIVER_FBPOSIX

#include "../SDL_sysvideo.h"

extern int  FBPOSIX_InitInput(_THIS);
extern void FBPOSIX_QuitInput(_THIS);
extern void FBPOSIX_PumpEvents(_THIS);

#endif /* SDL_VIDEO_DRIVER_FBPOSIX */

#endif /* SDL_fbposixevents_h_ */
