# SDL2 + ScummVM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Implement this plan task-by-task. TDD where the task touches verifiable behaviour.

**Goal:** Build SDL2 (2.30.x) for the wasm-posix-kernel toolchain with a custom `fbposix` video driver targeting `/dev/fb0`, then build ScummVM (2.8.x) against it, then ship a browser demo at `examples/browser/pages/scummvm/` that boots an unmodified ScummVM, plays a freely-redistributable game (Beneath a Steel Sky / Day of the Tentacle demo), and is interactive with mouse + keyboard. Audio composes when the concurrent `/dev/dsp` task lands.

**Architecture:** Pure user-space. Zero new kernel surface. SDL2 video driver `fbposix` lives in `examples/libs/sdl2/fbposix/`, copied into the SDL2 source tree at build time and registered via a single in-tree patch. SDL2 builds to a static `libSDL2.a` installed under `local-binaries/`. ScummVM links against it. Companion design doc: `docs/plans/2026-04-29-sdl2-scummvm-design.md`.

**Tech stack:** C11 (SDL2 + ScummVM), `wasm32posix-cc`, autoconf cross-build via `wasm32posix-configure`, software renderer only, OSS audio against `/dev/dsp` (audio-task device), `/dev/input/mice` (already shipped), stdin raw termios for keyboard.

**Three stacked PRs on the user's fork (`mho22/wasm-posix-kernel`)**, none merged until Phase C's manual browser verification passes and Brandon confirms. Each PR's base is the prior branch in the stack.

| PR | Branch | Base | Scope |
|----|--------|------|-------|
| #1 — Design | `emdash/sdl-2-design` | `emdash/explore-sdl-2-wasm-2tadz` | Design doc only. **Already opened.** |
| #2 — Plan | `emdash/sdl-2-plan` | `emdash/sdl-2-design` | This plan doc only. |
| #3 — Implementation | `emdash/sdl-2-implementation` | `emdash/sdl-2-plan` | All code, tests, demo, doc updates. |

**Verification gauntlet** (CLAUDE.md): all of these must pass with zero regressions before any PR is opened, and re-run before any merge:

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

`XFAIL` / `TIME` are acceptable; `FAIL` that isn't pre-existing is a regression.

---

## Phase A — SDL2 build with fbposix video driver (PR #3, part 1)

This phase produces `local-binaries/lib/libSDL2.a` and a verifiable smoke-test program. No ScummVM yet; the goal is to prove the SDL2 stack works end-to-end with a tiny C program.

### Task A1 — Vendor fbposix driver source

**Files:**
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixvideo.h`
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixvideo.c`
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixevents.h`
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixevents.c`
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixframebuffer.h`
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixframebuffer.c`
- Create: `examples/libs/sdl2/fbposix/SDL_fbposixmouse.c`

**Step 1: Outline the four files** following the SDL2 driver-author conventions used by `src/video/offscreen/` (closest existing model).

`SDL_fbposixvideo.c`:
- `static SDL_VideoDevice* FBPOSIX_CreateDevice(int devindex)` — allocate `SDL_VideoDevice`, populate function pointers (VideoInit, VideoQuit, GetDisplayBounds, GetDisplayModes, SetDisplayMode, CreateSDLWindow, ShowWindow, HideWindow, RaiseWindow, SetWindowSize, DestroyWindow, PumpEvents, CreateWindowFramebuffer, UpdateWindowFramebuffer, DestroyWindowFramebuffer, GetWindowWMInfo).
- `int FBPOSIX_VideoInit(_THIS)` — open `/dev/fb0`, ioctl `FBIOGET_VSCREENINFO` + `FBIOGET_FSCREENINFO`, `mmap` the buffer, build a single `SDL_DisplayMode {640, 400, BGRA8888, 60}`, call `SDL_AddBasicVideoDisplay(&mode)`. Stash fb_fd, fb_pixels, fb_size on the device's `driverdata`.
- `void FBPOSIX_VideoQuit(_THIS)` — `munmap`, close fd, free driverdata.
- Stub callbacks (CreateWindow, Show/Hide/Raise/SetSize, DestroyWindow) — full-screen single window: ignore size requests, always return 640×400. Track the active window pointer on driverdata.
- `VideoBootStrap FBPOSIX_bootstrap = { "fbposix", "Linux fbdev (wasm-posix-kernel)", FBPOSIX_Available, FBPOSIX_CreateDevice }`.
- `static int FBPOSIX_Available(void)` — `open("/dev/fb0", O_RDWR)`; close on success; return 1 / 0.

`SDL_fbposixevents.c`:
- `void FBPOSIX_PumpEvents(_THIS)`:
  1. Read up to 64 bytes from `STDIN_FILENO` non-blocking. Decode with a stateful escape-sequence machine (handles `\e[A`, `\e[B`, `\e[C`, `\e[D`, `\e[1~`, `\e[H`, `\eOP`–`\eOS` for F1–F4, etc.). For each decoded scancode, emit `SDL_KEYDOWN` then immediately `SDL_KEYUP`. For printable ASCII, also emit `SDL_TEXTINPUT`.
  2. Read up to 12 bytes from `/dev/input/mice` non-blocking. Each 3-byte PS/2 frame: decode buttons + dx/dy (positive-up, so negate dy for SDL2). Update synthetic `(x,y)`. Emit `SDL_MOUSEMOTION`. For changed button bits, emit `SDL_MOUSEBUTTONDOWN` / `SDL_MOUSEBUTTONUP`.
- `int FBPOSIX_InitEvents(_THIS)` — set stdin to `O_NONBLOCK`; open `/dev/input/mice` `O_NONBLOCK | O_RDONLY`; stash the mice fd on driverdata. Configure stdin to raw termios (echo off, canon off, ISIG off) — the demo page enables this via the kernel's `tcsetattr` like fbDOOM does.
- `void FBPOSIX_QuitEvents(_THIS)` — restore termios, close mice fd.
- Scancode table: 80 entries mapping ASCII / CSI → `SDL_Scancode` + `SDL_Keycode` pairs.

`SDL_fbposixframebuffer.c`:
- `int FBPOSIX_CreateWindowFramebuffer(_THIS, SDL_Window *w, Uint32 *format, void **pixels, int *pitch)`:
  - `*format = SDL_PIXELFORMAT_BGRA8888;`
  - `*pitch = w->w * 4;`
  - If `w->w == 640 && w->h == 400`: `*pixels = device->fb_mmap;` (zero-copy).
  - Else: malloc `w->h * w->w * 4`, store on window driverdata, `*pixels = backing;`.
- `int FBPOSIX_UpdateWindowFramebuffer(_THIS, SDL_Window *w, const SDL_Rect *rects, int numrects)`:
  - Same-size: no-op (data already in mmap). Optionally `ioctl(fb_fd, FBIOPAN_DISPLAY, &v)` for clarity.
  - Different-size: nearest-neighbor scale full window from backing into mmap (640×400 dest). Numrects ignored; we always do the whole frame for ScummVM (it issues full-screen presents anyway).
- `void FBPOSIX_DestroyWindowFramebuffer(_THIS, SDL_Window *w)`: free backing buffer if any.

`SDL_fbposixmouse.c`:
- `static SDL_Cursor* FBPOSIX_CreateDefaultCursor(void)` — return SDL2's stock 11×16 arrow cursor data (copied from `src/cursor/default_cursor.h` upstream — already in tree, just reference).
- `static int FBPOSIX_ShowCursor(SDL_Cursor *)` — toggle compositing flag on driverdata; SDL2 itself does the blitting.
- `static void FBPOSIX_WarpMouse(SDL_Window *, int x, int y)` — update synthetic mouse state.
- `static int FBPOSIX_SetRelativeMouseMode(SDL_bool enabled)` — toggle a flag; PumpEvents inverts coord reporting accordingly.
- `void FBPOSIX_InitMouse(_THIS)` — wire the above into `SDL_GetMouse()`.

**Step 2: Build the files into a single tarball candidate**

The four files compile to roughly 600 LoC of plain C, no SDL-private-API tricks beyond the public driver-author surface. They will be copied into `SRC/src/video/fbposix/` at build time by `build-sdl2.sh`. Don't try to compile them yet — they need SDL2's internal headers, which are only available after the upstream tarball is unpacked.

**Step 3: Commit**

```bash
git add examples/libs/sdl2/fbposix/
git commit -m "examples(sdl2): vendored fbposix video driver source"
```

---

### Task A2 — SDL2 registration patch

**Files:**
- Create: `examples/libs/sdl2/patches/0001-register-fbposix-video-driver.patch`

**Step 1: Author the patch**

Two edit sites:

```diff
--- a/src/video/SDL_video.c
+++ b/src/video/SDL_video.c
@@ -65,6 +65,9 @@ static VideoBootStrap *bootstrap[] = {
 #if SDL_VIDEO_DRIVER_OFFSCREEN
     &OFFSCREEN_bootstrap,
 #endif
+#if SDL_VIDEO_DRIVER_FBPOSIX
+    &FBPOSIX_bootstrap,
+#endif
 #if SDL_VIDEO_DRIVER_DUMMY
     &DUMMY_bootstrap,
 #endif

--- a/configure.ac
+++ b/configure.ac
@@ -2890,6 +2890,18 @@ CheckRPI()
     fi
 }

+dnl Check whether to enable the fbposix (wasm-posix-kernel) video driver
+CheckFBPosix()
+{
+    AC_ARG_ENABLE(video-fbposix,
+AS_HELP_STRING([--enable-video-fbposix], [enable fbposix /dev/fb0 video driver [default=no]]),
+                  , enable_video_fbposix=no)
+    if test x$enable_video_fbposix = xyes; then
+        AC_DEFINE(SDL_VIDEO_DRIVER_FBPOSIX, 1, [ ])
+        SOURCES="$SOURCES $srcdir/src/video/fbposix/*.c"
+        have_video=yes
+    fi
+}
+
 dnl See what dynamic loader is needed
 CheckDLOPEN()
 {
@@ -3360,6 +3372,7 @@ case "$host" in
         CheckOpenGLES
         CheckEGL
         CheckRPI
+        CheckFBPosix
         CheckOSS
```

The patch only adds — never modifies — upstream code. Tested on fresh extracts with `git apply --check` to ensure idempotency (same pattern as `examples/libs/fbdoom/build-fbdoom.sh`).

**Step 2: Verify the patch applies cleanly**

```bash
mkdir -p /tmp/sdl2-verify && cd /tmp/sdl2-verify
curl -fsSL https://www.libsdl.org/release/SDL2-2.30.7.tar.gz | tar -xz
cd SDL2-2.30.7
git init -q && git add -A && git commit -q -m base
git apply --check "$REPO_ROOT/examples/libs/sdl2/patches/0001-register-fbposix-video-driver.patch"
```

Expected: exit 0.

**Step 3: Commit**

```bash
git add examples/libs/sdl2/patches/0001-register-fbposix-video-driver.patch
git commit -m "examples(sdl2): patch — register fbposix in SDL_video bootstrap + configure.ac"
```

---

### Task A3 — `build-sdl2.sh`

**Files:**
- Create: `examples/libs/sdl2/build-sdl2.sh`
- Create: `examples/libs/sdl2/.gitignore` (ignore `SDL-*/`, `build/`, `install/`, `*.log`)

**Step 1: Write the script**

Pattern modelled on `examples/libs/fbdoom/build-fbdoom.sh`, with autoconf cross-build via `wasm32posix-configure` (mirroring `examples/libs/openssl/build-openssl.sh`).

```bash
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
source "$REPO_ROOT/sdk/activate.sh"

SDL_VERSION=2.30.7
SRC="$HERE/SDL-${SDL_VERSION}"

if [ ! -d "$SRC" ]; then
    curl -fsSL "https://www.libsdl.org/release/SDL2-${SDL_VERSION}.tar.gz" \
        | tar -xz -C "$HERE"
    mv "$HERE/SDL2-${SDL_VERSION}" "$SRC"
fi

# Apply patches idempotently — same pattern as fbdoom's build script.
for p in "$HERE/patches/"*.patch; do
    [ -f "$p" ] || continue
    if (cd "$SRC" && git apply --check "$p" 2>/dev/null); then
        (cd "$SRC" && git apply "$p")
    fi
done

# Drop the fbposix driver source into the SDL tree before configure.
rm -rf "$SRC/src/video/fbposix"
cp -R "$HERE/fbposix" "$SRC/src/video/fbposix"

mkdir -p "$HERE/build" && cd "$HERE/build"

# Cross-compile-friendly configure cache. SDL2's configure runs many
# AC_TRY_RUN feature checks that fail under cross-build; pin the
# answers explicitly. Most of these are taken from how SDL2 is
# packaged for buildroot / Yocto.
CACHE="
ac_cv_func_clock_gettime=yes
ac_cv_func_nanosleep=yes
ac_cv_func_pthread_create=yes
ac_cv_func_mmap=yes
ac_cv_func_munmap=yes
ac_cv_have_dev_dsp=yes
ac_cv_func_feenableexcept=no
ac_cv_func_sched_setaffinity=no
sdl_cv_lazymem=yes
"
eval "$CACHE" \
"$SRC/configure" \
    --host=wasm32-unknown-none \
    --prefix=/usr/local \
    CC=wasm32posix-cc \
    AR=wasm32posix-ar \
    RANLIB=wasm32posix-ranlib \
    PKG_CONFIG=wasm32posix-pkg-config \
    --disable-shared --enable-static \
    --disable-video-x11 --disable-video-wayland --disable-video-kmsdrm \
    --disable-video-cocoa --disable-video-vivante --disable-video-rpi \
    --disable-video-offscreen --disable-video-vulkan --disable-video-opengl \
    --disable-video-opengles --disable-video-opengles2 \
    --disable-video-directfb --disable-video-vivante \
    --disable-video-dummy \
    --enable-video-fbposix \
    --disable-audio-pulseaudio --disable-audio-pipewire --disable-audio-jack \
    --disable-audio-alsa --enable-audio-oss --enable-audio-dummy \
    --disable-joystick --disable-haptic --disable-sensor \
    --enable-threads --enable-timers \
    --disable-loadso \
    --disable-render-d3d --disable-render-metal \
    --enable-render-software \
    --disable-power --disable-filesystem --enable-file

make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu)"
make install DESTDIR="$HERE/install"

source "$REPO_ROOT/scripts/install-local-binary.sh"
install_local_lib SDL2 "$HERE/install/usr/local/lib/libSDL2.a"
mkdir -p "$REPO_ROOT/local-binaries/include/SDL2"
cp -R "$HERE/install/usr/local/include/SDL2/." \
      "$REPO_ROOT/local-binaries/include/SDL2/"
mkdir -p "$REPO_ROOT/local-binaries/lib/pkgconfig"
cp "$HERE/install/usr/local/lib/pkgconfig/sdl2.pc" \
   "$REPO_ROOT/local-binaries/lib/pkgconfig/sdl2.pc"

ls -la "$REPO_ROOT/local-binaries/lib/libSDL2.a"
echo "==> SDL2 ${SDL_VERSION} built and installed."
```

**Step 2: Run it**

```bash
chmod +x examples/libs/sdl2/build-sdl2.sh
bash examples/libs/sdl2/build-sdl2.sh 2>&1 | tail -40
```

Expected pitfalls (handle whichever surfaces):
- Configure failing on `AC_TRY_RUN` for thread features — extend the cache block.
- `<linux/fb.h>` not found from the fbposix driver — already covered by `musl-overlay/include/linux/fb.h` shipped by the framebuffer PR. Verify with `wasm32posix-cc -E -include linux/fb.h /dev/null`.
- `<sys/soundcard.h>` for OSS audio — if missing, add a minimal stub under `musl-overlay/include/sys/soundcard.h` covering the `SNDCTL_DSP_*` constants and the `audio_buf_info` struct from §4 of the design doc.
- `pthread.h` thread-storage feature checks — already shipped in the kernel.

If a configure check returns the wrong host answer (it tests against macOS / Linux libc rather than our wasm sysroot — see CLAUDE.md), pin the `ac_cv_*` variable in the cache block.

**Step 3: Smoke-test the static archive**

```bash
wasm32posix-nm "$REPO_ROOT/local-binaries/lib/libSDL2.a" 2>&1 | head -20
wasm32posix-nm "$REPO_ROOT/local-binaries/lib/libSDL2.a" 2>&1 | grep -c FBPOSIX_
```

Expected: ≥10 `FBPOSIX_*` symbols (CreateDevice, VideoInit, PumpEvents, CreateWindowFramebuffer, etc.).

**Step 4: Commit**

```bash
git add examples/libs/sdl2/build-sdl2.sh examples/libs/sdl2/.gitignore
git commit -m "examples(sdl2): cross-compile script — libSDL2.a with fbposix driver"
```

---

### Task A4 — `programs/sdl2-smoke.c` + integration test

**Files:**
- Create: `programs/sdl2-smoke.c`
- Modify: `scripts/build-programs.sh` (add sdl2-smoke to the test-program loop)
- Create: `host/test/sdl2-smoke.test.ts`

**Step 1: Write the smoke program**

```c
// programs/sdl2-smoke.c — boots SDL2, opens 640x400 window, fills red, presents.
#include <SDL.h>
#include <stdio.h>
#include <unistd.h>

int main(void) {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        fprintf(stderr, "SDL_Init: %s\n", SDL_GetError());
        return 1;
    }
    SDL_Window* w = SDL_CreateWindow("smoke",
        SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,
        640, 400, 0);
    if (!w) { fprintf(stderr, "SDL_CreateWindow: %s\n", SDL_GetError()); return 1; }

    SDL_Surface* s = SDL_GetWindowSurface(w);
    SDL_FillRect(s, NULL, SDL_MapRGB(s->format, 255, 0, 0));  // red
    SDL_UpdateWindowSurface(w);

    write(1, "ok\n", 3);
    SDL_Delay(50);

    SDL_DestroyWindow(w);
    SDL_Quit();
    return 0;
}
```

**Step 2: Wire into build-programs.sh**

Append to the test-program build loop:

```bash
# sdl2-smoke depends on libSDL2.a — only build if SDL2 is installed.
if [ -f "$REPO_ROOT/local-binaries/lib/libSDL2.a" ]; then
    wasm32posix-cc -O2 \
        $(wasm32posix-pkg-config --cflags sdl2) \
        "$REPO_ROOT/programs/sdl2-smoke.c" \
        $(wasm32posix-pkg-config --libs sdl2) \
        -o "$REPO_ROOT/host/wasm/sdl2-smoke.wasm"
fi
```

**Step 3: Run the build**

```bash
bash examples/libs/sdl2/build-sdl2.sh
bash scripts/build-programs.sh
ls -la host/wasm/sdl2-smoke.wasm
```

**Step 4: Vitest integration test**

```ts
// host/test/sdl2-smoke.test.ts
import { describe, expect, it } from 'vitest';
import { runProgram } from './centralized-test-helper.js';
import { existsSync } from 'fs';

const SDL2_BUILT = existsSync('host/wasm/sdl2-smoke.wasm');

describe.skipIf(!SDL2_BUILT)('SDL2 smoke', () => {
  it('creates a window, fills red, surfaces pixels through /dev/fb0', async () => {
    const { kernel, pid, stdout } = await runProgram('host/wasm/sdl2-smoke.wasm');
    await stdout.waitFor('ok\n', 5000);
    const b = kernel.framebuffers.get(pid);
    expect(b).toBeDefined();
    expect(b!.w).toBe(640);
    expect(b!.h).toBe(400);
    const sab = kernel.getProcessMemorySab(pid);
    const view = new DataView(sab, b!.addr, b!.len);
    // Red in BGRA8888 = blue=0, green=0, red=0xFF, alpha=0xFF → 0xFFFF0000 LE
    // (byte order: B=0x00, G=0x00, R=0xFF, A=0xFF, little-endian u32 = 0xFFFF0000)
    const off = (100 * 640 + 100) * 4;
    expect(view.getUint32(off, true)).toBe(0xFFFF0000);
    await kernel.killProcess(pid, 15);
  });
});
```

**Step 5: Run**

```bash
(cd host && npx vitest run sdl2-smoke)
```

Expected: pass.

**Step 6: Commit**

```bash
git add programs/sdl2-smoke.c scripts/build-programs.sh host/test/sdl2-smoke.test.ts
git commit -m "test(sdl2): smoke — SDL2 fills /dev/fb0 with red and surfaces pixels"
```

---

### Task A5 — Mouse event integration test

**Files:**
- Create: `programs/sdl2-event.c`
- Modify: `scripts/build-programs.sh` (add sdl2-event)
- Create: `host/test/sdl2-event.test.ts`

**Step 1: Write the event program**

```c
// programs/sdl2-event.c — pumps SDL2 events for 200ms, prints button + delta.
#include <SDL.h>
#include <stdio.h>

int main(void) {
    SDL_Init(SDL_INIT_VIDEO);
    SDL_Window* w = SDL_CreateWindow("ev", 0, 0, 640, 400, 0);
    Uint32 t0 = SDL_GetTicks();
    int btn_down_seen = 0, motion_dx = 0, motion_dy = 0;
    while (SDL_GetTicks() - t0 < 200) {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_MOUSEBUTTONDOWN) btn_down_seen = 1;
            if (e.type == SDL_MOUSEMOTION) {
                motion_dx += e.motion.xrel;
                motion_dy += e.motion.yrel;
            }
        }
        SDL_Delay(10);
    }
    printf("btn=%d dx=%d dy=%d\n", btn_down_seen, motion_dx, motion_dy);
    fflush(stdout);
    SDL_Quit();
    return 0;
}
```

**Step 2: Add to build-programs.sh** (same pattern as A4).

**Step 3: Vitest test**

```ts
// host/test/sdl2-event.test.ts
import { describe, expect, it } from 'vitest';
import { runProgram } from './centralized-test-helper.js';

describe('SDL2 events', () => {
  it('translates injected PS/2 events into SDL_MOUSEMOTION + SDL_MOUSEBUTTONDOWN', async () => {
    const { kernel, pid, stdout } = await runProgram('host/wasm/sdl2-event.wasm');
    // Wait for SDL_Init to settle and /dev/input/mice to open
    await new Promise(r => setTimeout(r, 50));
    kernel.injectMouseEvent(pid, 10, -5, 0b001);  // dx=10, dy=-5 (positive-up), left-down
    await new Promise(r => setTimeout(r, 20));
    kernel.injectMouseEvent(pid, 0, 0, 0);        // release
    const out = await stdout.collectUntilExit();
    // PS/2 dy is positive-up; SDL2 reports positive-down. -5 PS/2 → +5 SDL2.
    expect(out).toMatch(/btn=1 dx=10 dy=5/);
  });
});
```

**Step 4: Run**

```bash
(cd host && npx vitest run sdl2-event)
```

**Step 5: Commit**

```bash
git add programs/sdl2-event.c scripts/build-programs.sh host/test/sdl2-event.test.ts
git commit -m "test(sdl2): event — injected mouse events surface as SDL_MOUSE* events"
```

---

### Task A6 — Phase A gauntlet

**Files:** none (verification only)

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Expected: zero new failures vs the branch baseline. ABI snapshot: no drift (SDL2 is pure user-space).

If anything regresses, fix before moving on.

---

## Phase B — ScummVM build (PR #3, part 2)

### Task B1 — `build-scummvm.sh`

**Files:**
- Create: `examples/libs/scummvm/build-scummvm.sh`
- Create: `examples/libs/scummvm/.gitignore`

**Step 1: Write the script**

```bash
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
source "$REPO_ROOT/sdk/activate.sh"

SCUMMVM_VERSION=2.8.1
SRC="$HERE/scummvm-${SCUMMVM_VERSION}"

if [ ! -d "$SRC" ]; then
    curl -fsSL "https://github.com/scummvm/scummvm/archive/refs/tags/v${SCUMMVM_VERSION}.tar.gz" \
        | tar -xz -C "$HERE"
fi

# Apply patches idempotently if any.
for p in "$HERE/patches/"*.patch; do
    [ -f "$p" ] || continue
    if (cd "$SRC" && git apply --check "$p" 2>/dev/null); then
        (cd "$SRC" && git apply "$p")
    fi
done

cd "$SRC"

# ScummVM's configure is hand-rolled (not autoconf). It already supports
# --host= and --prefix=. We disable everything that needs heavier
# dependencies; the demos in scope only need the sky and scumm engines.
./configure \
    --host=wasm32 \
    --prefix=/usr/local \
    --backend=sdl \
    --enable-static \
    --disable-debug \
    --with-sdl-prefix="$REPO_ROOT/local-binaries" \
    --disable-mt32emu --disable-fluidsynth --disable-sndio --disable-alsa \
    --disable-flac --disable-vorbis --disable-mad \
    --enable-zlib \
    --disable-mpeg2 --disable-faad --disable-fribidi \
    --disable-libcurl --disable-sdlnet \
    --disable-tts \
    --disable-engine=all \
    --enable-engine=sky --enable-engine=scumm \
    CC=wasm32posix-cc \
    CXX=wasm32posix-c++ \
    AR=wasm32posix-ar \
    RANLIB=wasm32posix-ranlib

make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu)"

cp scummvm "$HERE/scummvm.wasm"
"$REPO_ROOT/tools/bin/wasm-fork-instrument" scummvm "$HERE/scummvm.wasm" || true

source "$REPO_ROOT/scripts/install-local-binary.sh"
install_local_binary scummvm "$HERE/scummvm.wasm"

ls -la "$HERE/scummvm.wasm"
echo "==> ScummVM ${SCUMMVM_VERSION} built."
```

**Step 2: Run it**

```bash
chmod +x examples/libs/scummvm/build-scummvm.sh
bash examples/libs/scummvm/build-scummvm.sh 2>&1 | tail -60
```

Expected pitfalls:
- ScummVM's `configure` may complain that `wasm32posix-c++` produces no executable — the SDK's c++ wrapper should already inject the right runtime support; if not, add `LDFLAGS="$LDFLAGS -lc++abi"` (mirroring how `examples/libs/mariadb/build-mariadb.sh` handles libc++ exception support).
- `<sys/wait.h>` / `waitpid` quirks — already covered by the kernel.
- "your compiler doesn't support LTO" — disable LTO in the configure flags if it autodetects on (`--disable-lto` if available).
- Missing `<endian.h>` — the kernel sysroot ships it; verify with `wasm32posix-cc -E -include endian.h /dev/null`.

**Step 3: Smoke-test the binary in Node**

A tiny driver that runs `scummvm --version` against the kernel is sufficient — it touches video init only briefly (or not at all if `--version` exits before SDL_Init):

```bash
node -e "
const { runProgram } = await import('./host/test/centralized-test-helper.js');
const { stdout } = await runProgram('examples/libs/scummvm/scummvm.wasm', {
    argv: ['scummvm', '--version']
});
console.log(await stdout.collectUntilExit());
"
```

Expected: prints "ScummVM 2.8.1 ...".

**Step 4: Commit**

```bash
git add examples/libs/scummvm/build-scummvm.sh examples/libs/scummvm/.gitignore
git commit -m "examples(scummvm): cross-compile script for ScummVM 2.8.1"
```

---

### Task B2 — Bundle game data

**Files:**
- Create: `examples/browser/public/assets/scummvm/.gitignore` (track only `.gitkeep`)
- Create: `examples/browser/public/assets/scummvm/README.md` (describe what the demo expects + how to populate the dirs from official mirrors)
- Create: `examples/libs/scummvm/fetch-demos.sh` (script that downloads the demo data from official ScummVM mirrors with sha256 pins)

**Step 1: Write fetch-demos.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
DEST="$REPO_ROOT/examples/browser/public/assets/scummvm"

# Beneath a Steel Sky — full game, freeware, hosted by ScummVM
SKY_URL="https://downloads.scummvm.org/frs/extras/Beneath%20a%20Steel%20Sky/bass-cd-1.2.zip"
SKY_SHA256="<pin-after-first-fetch>"

# DOTT demo — a few MB
TENTACLE_URL="https://downloads.scummvm.org/frs/demos/scumm/tentacle-pc-demo-en.zip"

# Monkey Island demo
MONKEY_URL="https://downloads.scummvm.org/frs/demos/scumm/monkey-pc-demo-en.zip"

mkdir -p "$DEST"

fetch_and_unzip () {
    local url="$1" dest="$2"
    local file="$DEST/.cache/$(basename "$url")"
    mkdir -p "$DEST/.cache"
    [ -f "$file" ] || curl -fsSL "$url" -o "$file"
    mkdir -p "$dest"
    unzip -qo "$file" -d "$dest"
}

fetch_and_unzip "$SKY_URL"      "$DEST/sky"
fetch_and_unzip "$TENTACLE_URL" "$DEST/tentacle-demo"
fetch_and_unzip "$MONKEY_URL"   "$DEST/monkey-demo"

ls -la "$DEST"
```

**Step 2: Add SHA256 pins after first run** — second pass through the script after the URLs are validated.

**Step 3: Commit**

```bash
git add examples/libs/scummvm/fetch-demos.sh examples/browser/public/assets/scummvm/
git commit -m "examples(scummvm): fetch script for freely-redistributable demo data"
```

---

### Task B3 — Phase B gauntlet

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Plus a Node smoke test that runs `scummvm --version` (defined in Task B1 step 3) — assert exit 0 and version banner.

---

## Phase C — Browser demo (PR #3, part 3)

### Task C1 — Demo page wiring

**Files:**
- Create: `examples/browser/pages/scummvm/index.html`
- Create: `examples/browser/pages/scummvm/main.ts`
- Modify: `examples/browser/vite.config.ts` (register the new page)
- Modify: `examples/browser/lib/sidebar.ts` (add ScummVM link)

**Step 1: HTML**

```html
<!-- examples/browser/pages/scummvm/index.html -->
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>ScummVM (wasm-posix-kernel)</title>
  <style>
    body { background: #111; color: #ccc; font-family: monospace; margin: 0; padding: 20px; }
    canvas { image-rendering: pixelated; width: 1280px; height: 800px;
             display: block; outline: none; background: #000; cursor: none; }
    .games { display: flex; gap: 12px; margin: 8px 0; }
    .games button { padding: 8px 12px; }
    #status { margin-top: 8px; }
  </style>
</head>
<body>
  <h1>ScummVM</h1>
  <div class="games">
    <button data-game="sky">Beneath a Steel Sky</button>
    <button data-game="tentacle-demo">Day of the Tentacle (demo)</button>
    <button data-game="monkey-demo">Monkey Island (demo)</button>
  </div>
  <canvas id="fb" tabindex="0" width="640" height="400"></canvas>
  <div id="status">Pick a game.</div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

**Step 2: TypeScript**

```ts
// examples/browser/pages/scummvm/main.ts
import { BrowserKernel } from '../../lib/browser-kernel.js';
import { attachCanvas } from '../../../host/src/framebuffer/canvas-renderer.js';

const canvas = document.getElementById('fb') as HTMLCanvasElement;
const status = document.getElementById('status')!;

document.querySelectorAll<HTMLButtonElement>('.games button').forEach(btn => {
  btn.addEventListener('click', () => start(btn.dataset.game!));
});

async function start(game: string) {
  status.textContent = `Booting ${game}...`;
  const kernel = await BrowserKernel.create();

  // Lazy-register the game directory and the SDL2 / ScummVM binary.
  for (const ext of ['', '/'] /* sentinel for dir registration */) {
    void ext;
  }
  await kernel.fs.registerLazyDirectory(
    `/usr/local/share/scummvm/${game}`,
    `/assets/scummvm/${game}`,
  );
  kernel.fs.mkdirRecursive('/home/scummvm');

  const wasmBytes = await fetch('/assets/scummvm/scummvm.wasm').then(r => r.arrayBuffer());
  const pid = await kernel.spawn(new Uint8Array(wasmBytes), {
    argv: ['scummvm', '--path', `/usr/local/share/scummvm/${game}`,
           '--auto-detect', '--no-fullscreen'],
    env: ['HOME=/home/scummvm', 'TERM=linux'],
    cwd: '/home/scummvm',
  });

  attachCanvas(canvas, kernel.framebuffers, pid, {
    getProcessMemorySab: p => kernel.getProcessMemorySab(p),
  });

  // Keyboard — same wiring as fbDOOM.
  const KEY_MAP: Record<string, number[]> = {
    'ArrowUp':    [0x1b, 0x5b, 0x41],
    'ArrowDown':  [0x1b, 0x5b, 0x42],
    'ArrowRight': [0x1b, 0x5b, 0x43],
    'ArrowLeft':  [0x1b, 0x5b, 0x44],
    'Enter':      [0x0d],
    'Escape':     [0x1b],
    'Space':      [0x20],
    'F5':         [0x1b, 0x4f, 0x35], // ScummVM main menu
  };
  canvas.focus();
  canvas.addEventListener('keydown', e => {
    const bytes = KEY_MAP[e.code]
      ?? (e.key.length === 1 ? [e.key.charCodeAt(0)] : null);
    if (bytes) {
      kernel.appendStdinData(pid, new Uint8Array(bytes));
      e.preventDefault();
    }
  });
  canvas.addEventListener('click', () => {
    canvas.focus();
    canvas.requestPointerLock?.();
  });

  // Mouse — pointer-lock + injectMouseEvent (from mouse PR).
  canvas.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) {
      kernel.injectMouseEvent(pid, e.movementX, -e.movementY, mouseButtons);
    }
  });
  let mouseButtons = 0;
  canvas.addEventListener('mousedown', e => {
    mouseButtons |= (1 << e.button);
    kernel.injectMouseEvent(pid, 0, 0, mouseButtons);
  });
  canvas.addEventListener('mouseup', e => {
    mouseButtons &= ~(1 << e.button);
    kernel.injectMouseEvent(pid, 0, 0, mouseButtons);
  });

  // Audio — wired by the audio-task. Until that lands, ScummVM detects
  // /dev/dsp absent and runs silently. Hook stub:
  // const audioWorklet = await kernel.audio?.attach(canvas.parentElement!, pid);

  status.textContent = `${game} running. Click canvas → pointer lock for mouse.`;
}
```

**Step 3: Wire into vite.config.ts**

Mirror how the DOOM page is registered. One-line `pages/scummvm/index.html` add.

**Step 4: Add sidebar entry** — pattern from `bb7ff65f demo(browser): add DOOM link to every demo sidebar`.

**Step 5: Run dev server, verify boot**

```bash
cd examples/browser && npm run dev
# Open the printed URL → /scummvm/, click "Beneath a Steel Sky".
```

Acceptable outcome: the launcher / first frame of the game renders. Mouse moves. Keyboard shortcuts work.

**Step 6: Commit**

```bash
git add examples/browser/pages/scummvm/ examples/browser/vite.config.ts examples/browser/lib/sidebar.ts
git commit -m "examples(scummvm): browser demo page — kernel + canvas + mouse + keyboard"
```

---

### Task C2 — Manual browser verification (the gate)

**Files:** none (manual)

Per CLAUDE.md "for UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete."

**Run through the success criteria from the design doc**:

1. `scummvm --version` (Node smoke test, Phase B) prints the banner.
2. The launcher renders within ~5 s of clicking a game button.
3. Day of the Tentacle demo (or Beneath a Steel Sky) opens the title screen, mouse moves the in-game cursor, clicking advances dialogue.
4. A session save (F5 → Save) survives quit-and-restart of the process within the same tab.
5. With audio-task device present: title music plays. Without: silent but otherwise unaffected.

**If any step fails**: identify whether the gap is (a) an unimplemented kernel surface (none expected), (b) an SDL2 driver bug in fbposix, (c) a build / sysroot issue, (d) a ScummVM expectation we didn't model. Fix the root cause; do not `#ifdef` around. Add a regression test where mechanically possible.

**If all succeed**: take a screenshot of the launcher and a screenshot of the in-game title, save locally, and let the user upload them to the PR.

---

### Task C3 — Playwright smoke test

**Files:**
- Create: `examples/browser/test/scummvm.spec.ts`

**Step 1: Author the test**

```ts
// examples/browser/test/scummvm.spec.ts
import { expect, test } from '@playwright/test';

test('@slow scummvm — DOTT demo title screen renders', async ({ page }) => {
  await page.goto('/scummvm/');
  await page.click('button[data-game="tentacle-demo"]');
  // Wait for SDL_Init + window create + first present
  const canvas = page.locator('#fb');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(8000);

  // Sample a 64x64 region near the centre and assert non-zero entropy.
  const entropy = await canvas.evaluate((cv: HTMLCanvasElement) => {
    const ctx = cv.getContext('2d')!;
    const id = ctx.getImageData(cv.width / 2 - 32, cv.height / 2 - 32, 64, 64);
    const seen = new Set<number>();
    for (let i = 0; i < id.data.length; i += 4)
      seen.add(id.data[i] | (id.data[i + 1] << 8) | (id.data[i + 2] << 16));
    return seen.size;
  });
  expect(entropy).toBeGreaterThan(8);  // any non-trivial colour content
});
```

**Step 2: Run**

```bash
cd examples/browser && npx playwright test scummvm.spec.ts
```

**Step 3: Commit**

```bash
git add examples/browser/test/scummvm.spec.ts
git commit -m "test(scummvm): Playwright smoke — DOTT demo title screen renders"
```

---

### Task C4 — Doc updates

**Files:**
- Modify: `docs/posix-status.md` — add SDL2 + ScummVM under "Software ported" with links.
- Modify: `docs/architecture.md` — short subsection: "SDL2 video — fbposix over /dev/fb0".
- Modify: `docs/porting-guide.md` — pattern for adding a new SDL2 video driver (this work) vs adding a new kernel device.
- Modify: `docs/browser-support.md` — note pointer-lock + AudioWorklet capability for ScummVM.
- Modify: `README.md` — add SDL2 + ScummVM to the "Software ported" list with a link to the demo page.

**Step 1: Edit each doc following the existing patterns.**

**Step 2: Commit**

```bash
git add docs/ README.md
git commit -m "docs(scummvm): document SDL2 + ScummVM port and fbposix driver"
```

---

### Task C5 — Phase C gauntlet + push for review

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Then:

```bash
git push -u origin emdash/sdl-2-implementation
gh pr create --repo mho22/wasm-posix-kernel \
  --base emdash/sdl-2-plan \
  --head emdash/sdl-2-implementation \
  --title "examples(sdl2/scummvm): SDL2 + ScummVM browser demo" \
  --body "..."
```

PR body: link to design + plan, summary of what landed, **manual browser verification screenshots**, note this is part 3/3 of a coordinated stack on the user's fork. **Do not merge** until Brandon confirms.

---

## Final coordinated review

When Brandon validates the implementation PR:

1. The user opens upstream PRs (one per branch, in order: design → plan → implementation) against `brandonpayton/wasm-posix-kernel:main`.
2. Each merges only with explicit Brandon approval. The "merge" verb is reserved for upstream; on the user's fork these PRs serve as a review staging area.

After upstream merge, on `main` of upstream:

```bash
git checkout main && git pull upstream main
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Confirm the merged state matches the validated state.
