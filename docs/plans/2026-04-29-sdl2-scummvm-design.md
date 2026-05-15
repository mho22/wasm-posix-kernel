# SDL2 + ScummVM Browser Demo — Design

Date: 2026-04-29
Branch: `emdash/sdl-2-design`
Worktree: `emdash/worktrees/kandelo/wasm-posix-kernel/emdash/flat-jokes-think-9jtlz/`

## §1. Goals & non-goals

**Goal.** Build SDL2 (2.30.x) for the wasm-posix-kernel toolchain so that an unmodified ScummVM (2.8.x) binary boots, opens its launcher, plays a game (Day of the Tentacle / Monkey Island / Beneath a Steel Sky from the freely-redistributable demo set), and is interactive in the browser. Video lands on `/dev/fb0`, audio on `/dev/dsp`, mouse on `/dev/input/mice`, keyboard on stdin in raw termios. The browser demo lives at `examples/browser/pages/scummvm/`.

**Non-goals (v1).**

- OpenGL / GLES rendering (`SDL_RENDERER_ACCELERATED`) — software renderer only. The WebGL/GLES2 work is a separate effort (see `docs/plans/2026-04-28-webgl-gles2-design.md`); SDL2 here uses the software renderer over `/dev/fb0`.
- Mode-set / multiple resolutions — `/dev/fb0` is a fixed 640×400 BGRA32 surface (per the framebuffer design). SDL2 advertises 640×400 native; ScummVM (320×200 internal) is upscaled 2× by SDL2's own software scaler.
- Multi-window — `SDL_CreateWindow` is single-window. Second create returns `SDL_WINDOWPOS_UNDEFINED` and shares the framebuffer with documented degradation.
- Joystick / game controller (`SDL_INIT_JOYSTICK`, `SDL_INIT_GAMECONTROLLER`) — `SDL_Init` accepts the flag and returns success, but no devices are enumerated. ScummVM doesn't require it.
- Touch events, IME, clipboard, drag-and-drop — return clean failures or no-op success matching what an embedded fbcon target would do.
- Vulkan, Metal — N/A.
- Threaded audio callback worker — SDL2's pthread-backed audio thread is reused as-is on top of our existing pthread implementation.
- Vsync — `SDL_RENDERER_PRESENTVSYNC` is a no-op-success. The framebuffer host-renderer already drives `requestAnimationFrame`; SDL2's present is a memcpy + `FBIOPAN_DISPLAY` (also a no-op).
- Hardware cursor — software cursor only. SDL2's software cursor is composited into the surface before present.
- ScummVM's MT-32 / FluidSynth MIDI — software OPL only (Adlib emulation). MT-32 needs ROMs we won't ship.
- Save-file persistence beyond the tab session — saves go to the in-memory VFS like fbDOOM. OPFS persistence is a future add-on.

**Constraint.** Per CLAUDE.md "never compromise hosted software." SDL2 and ScummVM are both vendored unmodified except for surgical patches that count as cross-compile hygiene (e.g. forcing the build system off the host, registering a new video driver in `SDL_bootstrap`). Patches that work around platform gaps (e.g. `#ifdef`-ing out a syscall we don't yet implement) are forbidden — implement the gap.

**Success criteria.**

1. `scummvm --version` prints the banner.
2. The ScummVM launcher renders, mouse pointer moves, you can click "Add Game…" and pick the demo data directory.
3. Day of the Tentacle demo (or Beneath a Steel Sky freeware) loads, plays the title screen with sound, and accepts mouse + keyboard input.
4. A session save survives a quit-and-restart of the process within the same tab.

## §2. Stack overview

```
   ┌─ ScummVM (wasm32) ────────────────────────────────────┐
   │ unmodified upstream — SDL2 backend, software renderer │
   └────────┬──────────────────────────────────────────────┘
            │ links libSDL2.a
   ┌────────▼──────────────────────────────────────────────┐
   │ libSDL2.a (vendored, three custom drivers added)      │
   │   src/video/fbposix/    — new — /dev/fb0 + events     │
   │   src/audio/dsp/        — upstream — /dev/dsp         │
   │   src/thread/pthread/   — upstream — pthreads         │
   │   src/timer/unix/       — upstream — clock_gettime    │
   │   src/loadso/dlopen/    — disabled — no plugins       │
   └────────┬───────────────┬──────────────────┬───────────┘
            │ open/mmap     │ open/write       │ read
   ┌────────▼───┐  ┌────────▼─────┐  ┌─────────▼──────────┐
   │ /dev/fb0   │  │ /dev/dsp     │  │ /dev/input/mice    │
   │ (shipped)  │  │ (audio task) │  │ + stdin (shipped)  │
   └────────────┘  └──────────────┘  └────────────────────┘
            │              │                  │
            └──────────────┴──────────────────┘
                           │
                  ┌────────▼─────────┐
                  │ kernel (wasm64)  │
                  │ + host (TS)      │
                  └──────────────────┘
```

Three concurrent worker tasks deliver the three input/output devices:

1. **Mouse** (`/dev/input/mice`) — *already in flight on `emdash/add-fbdoom-mouse-support-6jd0p`*. PS/2 3-byte frames, kernel exports `kernel_inject_mouse_event`. SDL2's fbposix driver `read()`s the device when `SDL_PumpEvents` runs, parses the PS/2 frame, emits `SDL_MOUSEMOTION` / `SDL_MOUSEBUTTONDOWN` / `SDL_MOUSEBUTTONUP`.

2. **Audio** (`/dev/dsp`) — *separate concurrent task, owned by another worker*. SDL2 uses upstream `src/audio/dsp/SDL_dspaudio.c` unmodified. The audio task's deliverable is an OSS-compatible character device that responds to:
   - `SNDCTL_DSP_SETFMT` (0xC0045005, AFMT_S16_LE)
   - `SNDCTL_DSP_CHANNELS` (0xC0045006, 1 or 2)
   - `SNDCTL_DSP_SPEED` (0xC0045002, 11025–48000)
   - `SNDCTL_DSP_GETOSPACE` (0x4004500C)
   - `write(fd, samples, len)` accepting interleaved PCM and applying back-pressure (block on full).

   This design *publishes the contract*; if the audio task lands ALSA instead, an extra `src/audio/alsa/` driver gets enabled and the design absorbs that with no kernel change. Until the device exists, `SDL_INIT_AUDIO` returns a clean error and ScummVM degrades to silent — verified during integration.

3. **SDL2 video + keyboard + mouse pump** (`/dev/fb0` + stdin + `/dev/input/mice`) — **this work**. A new SDL2 video driver `fbposix` (~600 LoC across 4 files in `src/video/fbposix/`) handles all three. Adopting one driver for video+input is the SDL2-canonical pattern (see `kmsdrm`, `rpi`, `vivante`, `offscreen`).

The browser demo at `examples/browser/pages/scummvm/` reuses the existing fbDOOM page wiring almost verbatim: `attachCanvas`, `kernel.framebuffers`, keyboard event listener that calls `appendStdinData`, mouse listener that calls `kernel.injectMouseEvent`. Audio output is the audio task's responsibility (likely an `AudioWorkletNode` attached to the same canvas page).

## §3. The hard part — SDL2 video driver `fbposix`

SDL2's video-driver model is private but consistent across the in-tree drivers. A driver registers a `VideoBootStrap` with a name, an `available()` probe, and a `create(deviceindex)` that returns a `SDL_VideoDevice*` filled with ~30 callback pointers. The driver also owns the *event pump* (`PumpEvents`), display enumeration (`GetDisplayBounds`, `GetDisplayModes`), window lifecycle (`CreateSDLWindow`, `DestroyWindow`, `ShowWindow`, etc.), and **framebuffer-mode rendering** via `CreateWindowFramebuffer` / `UpdateWindowFramebuffer` / `DestroyWindowFramebuffer`. The framebuffer mode is exactly the path SDL2's software renderer (`SDL_RENDER_SOFTWARE`) takes — it asks the video driver for a CPU-writable surface, blits into it, then calls `UpdateWindowFramebuffer` to flush.

This is the path we want — no GL, no acceleration. The fbposix driver can be very small.

### §3.1 File layout

```
SDL2-2.30.x/src/video/fbposix/
├── SDL_fbposixvideo.c     — driver bootstrap + window/display callbacks (~280 LoC)
├── SDL_fbposixvideo.h     — internal types
├── SDL_fbposixevents.c    — PumpEvents: stdin keyboard + /dev/input/mice  (~220 LoC)
├── SDL_fbposixevents.h
├── SDL_fbposixframebuffer.c — Create/Update/DestroyWindowFramebuffer    (~120 LoC)
├── SDL_fbposixframebuffer.h
└── SDL_fbposixmouse.c     — cursor show/hide/warp                        (~60 LoC)
```

Plus a one-line registration in `SDL2-2.30.x/src/video/SDL_video.c`:

```c
#if SDL_VIDEO_DRIVER_FBPOSIX
    &FBPOSIX_bootstrap,
#endif
```

and a CMake guard in `SDL2-2.30.x/CMakeLists.txt`:

```cmake
if(SDL_FBPOSIX)
    set(SDL_VIDEO_DRIVER_FBPOSIX 1)
    file(GLOB FBPOSIX_SOURCES ${SDL2_SOURCE_DIR}/src/video/fbposix/*.c)
    set(SOURCE_FILES ${SOURCE_FILES} ${FBPOSIX_SOURCES})
endif()
```

Both edits land as a single patch under `examples/libs/sdl2/patches/0001-add-fbposix-video-driver.patch`. The body of the new driver lives entirely under `src/video/fbposix/` — no upstream file is touched beyond the two registration sites.

### §3.2 Bootstrap & display

`SDL_fbposixvideo.c` registers:

```c
VideoBootStrap FBPOSIX_bootstrap = {
    "fbposix", "Linux fbdev (wasm-posix-kernel)",
    FBPOSIX_Available, FBPOSIX_CreateDevice
};

static int FBPOSIX_Available(void) {
    int fd = open("/dev/fb0", O_RDWR);
    if (fd < 0) return 0;
    close(fd);
    return 1;
}
```

`FBPOSIX_VideoInit` opens `/dev/fb0`, runs `FBIOGET_VSCREENINFO` + `FBIOGET_FSCREENINFO`, mmaps the pixel buffer, then publishes a single display mode:

```c
SDL_DisplayMode mode = {
    .format = SDL_PIXELFORMAT_BGRA8888,  // BGRA32, blue at offset 0
    .w = 640, .h = 400,
    .refresh_rate = 60,
};
SDL_AddBasicVideoDisplay(&mode);
```

`GetDisplayBounds` returns `(0,0,640,400)`. `GetDisplayModes` returns the single mode. `SetDisplayMode` accepts only the matching mode and returns `SDL_SetError` for anything else — software written for *this* fbdev SDL build will pick the only available mode; ScummVM does so via `SDL_DisplayMode` enumeration.

### §3.3 Window framebuffer path

`CreateWindowFramebuffer(window, &format, &pixels, &pitch)`:

- For a 640×400 window: hand back the mmap pointer directly. Zero-copy. `*pixels = fbposix.fb_mmap; *pitch = 640*4;`
- For any other size: allocate a software backing buffer of `w*h*4`, hand it back, remember it on the window. `UpdateWindowFramebuffer` software-scales it onto the mmap. ScummVM's launcher and all in-engine surfaces are 320×200 / 320×240 — they'll go through this path with a hot-loop nearest-neighbor 2× scale (≈250 KB per frame, trivial).

`UpdateWindowFramebuffer(window, rects, numrects)`:

- If the window is the same size as the fb: `*nothing*` — pixels already landed in the mmap. Optionally call `ioctl(fb_fd, FBIOPAN_DISPLAY, &v)` for clarity (kernel returns 0 unconditionally; the host RAF loop is what actually presents).
- Else: scale the dirty rects from the backing buffer into the mmap. We always scale the whole window for correctness; per-rect scaling is a future optimisation that ScummVM doesn't need (it issues full-screen presents).

`DestroyWindowFramebuffer`: free the backing buffer (if any). Don't unmap the fb until `VideoQuit`.

### §3.4 PumpEvents — keyboard + mouse polling

SDL2 expects `PumpEvents` to be cheap and called every frame. Per call:

1. **Keyboard.** `read(STDIN_FILENO, buf, 64)` non-blocking. For each byte:
   - 0x1b … (escape sequences) — buffer up; on completion, decode to `SDL_KEYDOWN` (followed by an immediate `SDL_KEYUP` since stdin doesn't deliver release events; same compromise fbDOOM made and ScummVM is fine with it because it polls keyboard *state* via `SDL_GetKeyboardState`, which we synthesise from the synthetic key-up cadence).
   - Printable ASCII / control chars — emit `SDL_KEYDOWN` + `SDL_TEXTINPUT` + `SDL_KEYUP`.
   - Translation table covers: arrows, Enter, Escape, Space, F1–F12 (CSI sequences from xterm), Backspace, Tab, Home/End/PgUp/PgDn, the printable ASCII range. Roughly 80 entries.

2. **Mouse.** `read("/dev/input/mice", buf, 12)` non-blocking, where 12 = 4 PS/2 frames (3 bytes each). Per frame:
   - Decode 3-byte PS/2 packet (bits 0–2 of byte 0 = buttons; bytes 1–2 = signed dx/dy with positive-up dy).
   - Maintain a synthetic `(x, y)` state clamped to `[0, w) × [0, h)`. `dy` is *positive-up* per PS/2; we negate for SDL2 (positive-down).
   - Diff against last-known state. Emit `SDL_MOUSEMOTION` (xrel, yrel + new x, y), `SDL_MOUSEBUTTONDOWN` / `SDL_MOUSEBUTTONUP` for changed button bits.

3. **Synthetic key-up sweeper.** SDL2 `SDL_GetKeyboardState` reads from a per-key-down array our PumpEvents maintains. Since we synthesise key-ups immediately after key-downs, the state always reads "no key currently held". For ScummVM this is acceptable — its keyboard-shortcut handling is event-driven, not state-polled. *Documented* as a fbcon-style limitation; not worked around.

The driver does NOT rely on `select` / `poll` to multiplex stdin and mice. Both reads are non-blocking. The kernel's `read()` on either device returns 0 (or `-EAGAIN`) on empty without blocking the calling thread.

### §3.5 Cursor

SDL2's "default" cursor (a small arrow) is software-composited *by SDL2 itself* into the surface before `UpdateWindowFramebuffer` if the driver returns `SDL_TRUE` from `SDL_VideoDevice::ShowCursor` and provides a `SDL_GetCursorImage`. fbposix returns the upstream-provided default cursor data and lets SDL2 do the compositing. `SDL_WarpMouseInWindow` updates the synthetic mouse state. `SDL_SetRelativeMouseMode` toggles whether `SDL_MOUSEMOTION` carries absolute or relative coords — fbposix supports both: in relative mode, x/y are pinned to the window centre and only xrel/yrel are reported. Same model as SDL2's evdev driver.

### §3.6 Why this carves cleanly off existing kernel surface

| SDL2 expectation | fbposix uses | Provider |
|---|---|---|
| Open a CPU-writable framebuffer | mmap `/dev/fb0` | shipped (#349) |
| Present a frame | already in process Memory; host RAF presents | shipped (#350) |
| Read keyboard | `read(STDIN_FILENO)` (raw termios) | shipped |
| Read mouse | `read("/dev/input/mice")` PS/2 | shipped on `add-fbdoom-mouse-support` |
| Poll without blocking | `O_NONBLOCK` on both | shipped |
| Sleep / clock | `clock_gettime`, `nanosleep`, `usleep` | shipped |
| Threads | `pthread_create` / `pthread_mutex_*` / cond vars | shipped |
| Audio | `open/ioctl/write /dev/dsp` (OSS) | audio-task — *external dependency* |
| Dynamic loader | `dlopen` (for plugins) | disabled; SDL2 built without `SDL_LOADSO` |

There is **zero new kernel surface** for SDL2 video + input. The only kernel work is whatever the audio task ships for `/dev/dsp`. This matches Brandon's pattern: ports compose over the existing POSIX surface; we add a kernel device only when no Unix-like primitive already covers the case (here, the framebuffer and mouse devices already covered it).

## §4. SDL2 audio — `/dev/dsp` contract for the audio task

SDL2's `src/audio/dsp/SDL_dspaudio.c` (upstream, unmodified) opens `/dev/dsp` with `O_WRONLY | O_NONBLOCK | O_CLOEXEC`, falls back to `O_WRONLY`, then issues these ioctls in order. The audio task should make the device respond to *exactly* these — anything else SDL2 wants is configuration metadata that follows from these.

| ioctl | direction | meaning | minimal viable behaviour |
|---|---|---|---|
| `SNDCTL_DSP_RESET` (0x5000) | none | flush pending samples | drop queued bytes, return 0 |
| `SNDCTL_DSP_SETFMT` (0xC0045005) | rw int | accept one of `AFMT_S16_LE` (0x10), `AFMT_S16_NE`, `AFMT_U8` (0x08); write back actual chosen format | accept `AFMT_S16_LE`; write 0x10 back; reject others with `EINVAL` |
| `SNDCTL_DSP_CHANNELS` (0xC0045006) | rw int | 1 or 2 | accept both; write back the chosen value |
| `SNDCTL_DSP_SPEED` (0xC0045002) | rw int | sample rate; clamp to device range | accept 11025–48000; clamp; write actual rate |
| `SNDCTL_DSP_GETOSPACE` (0x4004500C) | r struct | `audio_buf_info { fragments, fragstotal, fragsize, bytes }` — bytes available to write | report `bytes = current ring-buffer free space` |
| `SNDCTL_DSP_GETBLKSIZE` (0xC0045004) | r int | preferred fragment size in bytes | report 4096 |
| `SNDCTL_DSP_SETFRAGMENT` (0xC004500A) | rw int | (frag_count<<16)|frag_size_log2 | accept and store; can be best-effort |
| `write(fd, buf, len)` | n/a | enqueue PCM | write up to free space; if blocking + queue full, suspend until drain; if `O_NONBLOCK`, return `EAGAIN` after partial |
| `close(fd)` | n/a | drain & release | flush, release the device single-owner if you implement it |

This list is the *contract this design pins down* so the audio worker's design and ours converge without rework. Any divergence (e.g. ALSA pcm-file path) would replace the SDL2 driver selection at `configure --enable-alsa` time, not the SDL2 source — also clean.

## §5. SDL2 build

### §5.1 Cross-compile via SDK

```bash
# examples/libs/sdl2/build-sdl2.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
source "$REPO_ROOT/sdk/activate.sh"

SDL_VERSION=2.30.7
SRC="$HERE/SDL-${SDL_VERSION}"
[ -d "$SRC" ] || {
    curl -fsSL "https://www.libsdl.org/release/SDL2-${SDL_VERSION}.tar.gz" \
        | tar -xz -C "$HERE"
    mv "$HERE/SDL2-${SDL_VERSION}" "$SRC"
    for p in "$HERE/patches/"*.patch; do
        [ -f "$p" ] || continue
        (cd "$SRC" && git apply --check "$p" 2>/dev/null && git apply "$p" || true)
    done
    cp -R "$HERE/fbposix" "$SRC/src/video/fbposix"
}

mkdir -p "$HERE/build" && cd "$HERE/build"

wasm32posix-configure "$SRC" \
    --disable-shared --enable-static \
    --disable-video-x11 --disable-video-wayland --disable-video-kmsdrm \
    --disable-video-cocoa --disable-video-vivante --disable-video-rpi \
    --disable-video-offscreen --disable-video-vulkan --disable-video-opengl \
    --disable-video-opengles --disable-video-opengles2 \
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
install_local_pkgconfig SDL2 "$HERE/install/usr/local/lib/pkgconfig/sdl2.pc"
```

`autoconf`'s `configure` macro for new video drivers is invoked from `configure.ac` — we register `--enable-video-fbposix` with a tiny `m4` block in the same patch that adds the driver source. CMake is the alternative; SDL2 supports both, and the project's other ports use autoconf, so we follow.

### §5.2 What gets disabled and why

| Disabled | Why |
|---|---|
| video-x11, wayland, kmsdrm, cocoa | platform doesn't have these |
| video-offscreen | redundant with fbposix |
| video-opengl, opengles | software renderer only for v1; webgl gles2 work is separate |
| video-vulkan, render-d3d, render-metal | N/A |
| audio-pulseaudio, pipewire, jack, alsa | OSS dsp is the design contract |
| joystick, haptic, sensor | not needed for ScummVM, no kernel surface |
| loadso (dlopen plugins) | we don't ship dynamic libraries; SDL2 plugins not used |
| filesystem | SDL2 prefers `getpref/getbase` paths through this; we route through `getenv("HOME")` instead |
| power | no battery API |

### §5.3 Outputs

- `local-binaries/lib/libSDL2.a`
- `local-binaries/include/SDL2/*.h` (~80 headers, upstream)
- `local-binaries/lib/pkgconfig/sdl2.pc`

Consumers `wasm32posix-pkg-config --cflags --libs sdl2` returns the right flags. ScummVM's autoconf reaches it via `--with-sdl-prefix=$(pkg-config --variable=prefix sdl2)`.

### §5.4 ABI snapshot

SDL2 is purely user-space. No kernel ABI surface added. `scripts/check-abi-version.sh` should report no drift. The audio-task PR (separate) is the one that would bump ABI for `/dev/dsp` ioctls.

## §6. ScummVM port

### §6.1 Build

```bash
# examples/libs/scummvm/build-scummvm.sh
SCUMMVM_VERSION=2.8.1
# clone, then:
cd "$SRC"
emconfigure_passthrough \
    "$SRC/configure" \
    --host=wasm32-unknown-none \
    --backend=sdl --enable-static --disable-debug \
    --with-sdl-prefix="$REPO_ROOT/local-binaries" \
    --disable-mt32emu --disable-fluidsynth \
    --disable-sndio --disable-alsa \
    --disable-flac --disable-vorbis --disable-mad \
    --enable-zlib \
    --disable-mpeg2 --disable-faad --disable-fribidi \
    --enable-engine=sky,scumm \
    --disable-all-engines && true   # selective enable
make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu)"
"$REPO_ROOT/tools/bin/wasm-fork-instrument" scummvm "$HERE/scummvm.wasm"
```

Engines:
- `sky` — Beneath a Steel Sky (freely redistributable, full game)
- `scumm` — covers Day of the Tentacle and Monkey Island demos (freely redistributable)

ScummVM's MT-32 / FluidSynth need ROMs we won't ship; disable. MAD/Vorbis/FLAC: the demo data we bundle is all uncompressed; disable. zlib stays on (already shipped on the kernel).

### §6.2 Game data bundling

```
examples/browser/public/assets/scummvm/
├── sky/                  — Beneath a Steel Sky, freeware (~70 MB)
├── tentacle-demo/        — DOTT demo (~3 MB)
└── monkey-demo/          — Monkey Island demo (~1 MB)
```

Lazy-loaded via the existing `MemoryFileSystem.registerLazyFile()` infrastructure. The 70 MB BASS data is the largest; it loads on demand chunk-by-chunk through the existing range-fetch path.

### §6.3 Demo page

`examples/browser/pages/scummvm/`:

```
index.html — <canvas> + game-picker buttons
main.ts    — wires:
              1. kernel boot
              2. lazy-register game directories
              3. attachCanvas(canvas, kernel.framebuffers, scummvmPid)
              4. canvas.addEventListener('keydown') → appendStdinData
              5. pointerlock + mousemove → kernel.injectMouseEvent
              6. AudioWorkletNode wired to /dev/dsp by audio-task
              7. spawn scummvm.wasm with --path=<demo-dir>
```

Reuses `attachCanvas` from `host/src/framebuffer/canvas-renderer.ts` and `injectMouseEvent` from the mouse PR. The audio plumbing is the audio-task's deliverable — this design only assumes its existence at the device boundary.

## §7. Testing strategy

Three layers, scoped to what each catches.

**SDL2 unit fixtures** in `programs/sdl2-smoke.c`:

```c
SDL_Init(SDL_INIT_VIDEO);
SDL_Window* w = SDL_CreateWindow("smoke", 0, 0, 640, 400, 0);
SDL_Surface* s = SDL_GetWindowSurface(w);
SDL_FillRect(s, NULL, SDL_MapRGB(s->format, 255, 0, 0));  // red
SDL_UpdateWindowSurface(w);
write(1, "ok\n", 3);
SDL_Delay(100);
SDL_DestroyWindow(w);
SDL_Quit();
return 0;
```

- Cargo test (kernel side): no new tests — kernel surface unchanged. Existing fb0 / mice / stdin tests cover everything fbposix touches.
- Vitest (`host/test/sdl2-smoke.test.ts`): runs `programs/sdl2-smoke.wasm`, awaits "ok\n", asserts `kernel.framebuffers.get(pid)` is bound, samples four pixels and asserts the BGRA bytes are `(0x00, 0x00, 0xFF, 0xFF)` (red in BGRA = blue=0, green=0, red=255, alpha=255).
- Vitest (`host/test/sdl2-event.test.ts`): a second tiny program calls `SDL_PollEvent` in a loop after we `kernel.injectMouseEvent(pid, dx=10, dy=-5, btns=1)`; assert it observes one `SDL_MOUSEBUTTONDOWN` and one `SDL_MOUSEMOTION` with the right deltas.

**Browser smoke tests** for ScummVM via Playwright (`examples/browser/test/scummvm.spec.ts`):

- `@slow` test that boots the demo, picks Day of the Tentacle demo, waits ~5 s for the title screen, samples a known pixel region, asserts non-zero entropy (LucasArts logo is colourful), and clicks once on the canvas to confirm the engine responds (mouse cursor moves on the next frame).

Per CLAUDE.md "for UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete." Manual verification is the gate: launcher renders → game picks → game plays → audio is audible (gated on audio-task).

**Full project gauntlet** per CLAUDE.md before any PR opens or is updated:

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

## §8. ABI & rollout

**ABI surface added by *this* effort**: none. SDL2 + ScummVM are user-space; they consume existing ioctl numbers, syscall numbers, devfs entries.

**Cross-stack ABI dependency**: the audio-task PR will add `/dev/dsp` + a few `SNDCTL_DSP_*` ioctl numbers, and likely a `bind_audio` HostIO callback for AudioWorklet integration. That bumps `ABI_VERSION` (8 → 9 if mouse landed at 7). Our SDL2 build *does not* compile-time depend on those numbers — `<sys/soundcard.h>` is a musl-overlay header — so we're sequencing-independent: SDL2 + ScummVM can ship ahead of audio (silent ScummVM still demos the engine), and audio-task can ship ahead of SDL2 (no `/dev/dsp` consumer until SDL2 lands).

**Rollout — three stacked PRs on the user's fork (`mho22/wasm-posix-kernel`)**, none merged until manual browser ScummVM verification passes and Brandon confirms:

1. **PR #1 — Design (this doc).** `docs/plans/2026-04-29-sdl2-scummvm-design.md`. Branch `emdash/sdl-2-design` off `emdash/explore-sdl-2-wasm-2tadz`. Single commit.
2. **PR #2 — Plan.** `docs/plans/2026-04-29-sdl2-scummvm-plan.md`. Branch `emdash/sdl-2-plan` off `emdash/sdl-2-design`. Single commit.
3. **PR #3 — Implementation.** Branch `emdash/sdl-2-implementation` off `emdash/sdl-2-plan`. Multiple commits per the plan's task split. Includes:
   - `examples/libs/sdl2/` (build script, fbposix driver source, patches)
   - `examples/libs/scummvm/` (build script)
   - `examples/browser/pages/scummvm/` (demo page)
   - `programs/sdl2-smoke.c` (test fixture)
   - `host/test/sdl2-*.test.ts` (integration tests)
   - `examples/browser/test/scummvm.spec.ts` (Playwright smoke)
   - Doc updates: `docs/posix-status.md`, `docs/architecture.md`, `docs/porting-guide.md`, `README.md`.

Each PR opens with base = the prior branch (so the diffs are clean and reviewable). Once Brandon validates, the order is design → plan → implementation upstream. The user's fork is the staging area.

**Doc updates** per CLAUDE.md:

- `docs/posix-status.md` — note SDL2/ScummVM in "Software ported", and reference `/dev/dsp` (audio-task placeholder until that lands).
- `docs/architecture.md` — short subsection: SDL2 video driver `fbposix` over `/dev/fb0`, audio over `/dev/dsp`.
- `docs/porting-guide.md` — pattern for adding a new SDL2 video driver vs writing a new kernel device.
- `docs/browser-support.md` — note pointer-lock + AudioWorklet capability for ScummVM.
- `README.md` — SDL2 + ScummVM under "Software ported".

## §9. Trade-offs and what defers to v2

| Trade-off | Why accepted | Upgrade path |
|---|---|---|
| Single resolution (640×400) | Matches fbdev contract, scaler covers ScummVM's 320×200 native | Kernel-side resizable fb (FBIOPUT_VSCREENINFO with real mode-set), or `/dev/fb1` for higher resolutions |
| Synthetic key-up (no real release events) | stdin can't carry release; matches fbcon behaviour | `/dev/input/eventN` evdev device that delivers real key events with separate up/down — already on the roadmap implied by mouse design |
| OSS audio not ALSA | Simplest POSIX-flavoured device; fewest dependencies | Add `--enable-audio-alsa` with libasound port if audio-task ships ALSA |
| Software renderer only | No GLES2 yet | Wire SDL2's GLES2 renderer to `/dev/dri/renderD128` once the WebGL/GLES2 effort lands; SDL2 already has `SDL_RENDER_OPENGLES2` paths |
| Single-window | fb is single-owner per kernel design | Multi-window requires kernel fb sharing (compositor) — out of scope |
| No vsync pacing | Host RAF drives presentation already | Implement vsync via wakeup on `FBIOPAN_DISPLAY` if a benchmark shows tearing artefacts |
| MIDI / MT-32 disabled | Needs ROMs we can't ship | Software OPL is sufficient for the demos in scope |

## §10. Why this stack composes well with concurrent work

- **Mouse work** (`emdash/add-fbdoom-mouse-support-6jd0p`): SDL2 fbposix's `PumpEvents` reads the same `/dev/input/mice` device that mouse PR landed. No coordination beyond consuming the API.
- **Audio work** (concurrent task): SDL2's upstream `dsp` driver is the consumer. The contract in §4 is the alignment surface. Either side can land first; SDL2 degrades cleanly to silent if `/dev/dsp` is missing.
- **WebGL/GLES2 work** (`docs/plans/2026-04-28-webgl-gles2-design.md`): SDL2's GLES2 backend is *not* enabled in v1. When that work lands, the SDL2 build script flips on `--enable-video-opengles2` and points it at `/dev/dri/renderD128`. The fbposix driver stays as the *fallback / non-GL* path, mirroring how real Linux SDL2 builds keep both kmsdrm-software and kmsdrm-gles paths.

The pattern is: every device a port needs maps to a `/dev/*` node already (or about to be) in the kernel; SDL2 is glue, not a kernel feature.
