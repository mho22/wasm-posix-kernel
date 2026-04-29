# ScummVM Browser Demo — Design

Date: 2026-04-29
Branch: `emdash/explore-scummvm-wasm-wfpi9`
Author: contributed via the `mho22` fork; targets Brandon Payton's `wasm-posix-kernel`.

## §1. Goals & non-goals

**Goal.** An unmodified [ScummVM](https://github.com/scummvm/scummvm) build runs in `examples/browser/pages/scummvm/` and is playable end-to-end with one freeware adventure game. The intro plays, the player can click hotspots, hear voice/music/sfx, save mid-game, quit, and reload from the in-memory VFS. ScummVM links against the project's SDL2 (separate task) and uses three already-tracked kernel devices: `/dev/fb0` (shipped), `/dev/dsp` (separate task, in flight), `/dev/input/mice` (separate task, staged on `add-fbdoom-mouse-support`).

**Non-goals (v1).**

- Multiple games selectable at runtime — one bundled game, one demo page. The launcher UI is ScummVM's own; we only ship one game's data.
- All ScummVM engines — minimal engine subset only (`sky`, `queen`, `lure`). Disabling 70+ engines we cannot legally ship games for keeps the binary <8 MB and the configure run tractable.
- MIDI synthesis via `libfluidsynth` — too heavy for v1, and the three target engines synthesize their own AdLib/MT-32 output internally.
- Cloud sync, Discord rich presence, taskbar integration, libcurl networking — all `--disable`d.
- Native-speed JIT for any engine that has one — ScummVM doesn't ship JITs anyway, but `--disable-engine=lua` and similar are explicit safety.
- OPFS / IndexedDB save persistence — saves live in the in-memory VFS for the session and survive process restarts within a tab; reloading the page wipes them. Documented limitation, future enhancement.
- Node.js display — kernel-side runs end-to-end on Node for tests, but no pixels appear (consistent with the fbDOOM design's Node stub).
- Audio recording (microphone), gamepad, joystick — input is keyboard + mouse only.
- ScummVM-on-ScummVM "engine of engines" exotica.

**Constraint.** Per `CLAUDE.md` "never compromise hosted software." ScummVM gets vendored and patched **only** for cross-compilation hygiene (toolchain triplet handling, `configure` autodetect overrides, missing-host-feature stubs). Any patch that disables a ScummVM behavior to work around a kernel gap is a bug — fix the gap instead. Same rule applies to SDL2 in its own task.

**Success criteria.** Beneath a Steel Sky (BASS, freeware floppy version) launches in the browser demo. The intro animation runs at audible+visible playback speed, voice samples and music are clearly heard, the player can click through the opening dialogue, save in slot 1, exit to launcher, restart the binary, and load slot 1.

## §2. Architecture & where this fits

```
   ┌─ ScummVM (user wasm32, C++17) ─────────────┐
   │  Engine: sky / queen / lure                 │
   │  OSystem  ──►  backends/platform/sdl/       │
   │              ↓                              │
   │           libSDL2.a (statically linked)     │
   │                                             │
   │  SDL2 video driver  → writes /dev/fb0       │
   │  SDL2 audio driver  → writes /dev/dsp       │
   │  SDL2 input driver  → reads /dev/input/mice │
   │                       reads stdin (raw      │
   │                       termios for keys)     │
   └────────────┬────────────────────────────────┘
                │ syscalls via channel
   ┌────────────▼────────────────────────────────┐
   │ kernel (wasm64):                            │
   │   /dev/fb0           — fbdev               (shipped)│
   │   /dev/dsp           — OSS PCM             (separate task)│
   │   /dev/input/mice    — PS/2 mouse          (separate task)│
   └────────────┬────────────────────────────────┘
                │ HostIO callbacks (existing pattern)
   ┌────────────▼────────────────────────────────┐
   │ host (TypeScript, browser):                 │
   │   FramebufferRegistry → <canvas>            │
   │   AudioRegistry       → AudioWorklet        │
   │   MouseInjector       ← pointer-lock events │
   │   appendStdinData     ← keyboard events     │
   └─────────────────────────────────────────────┘
```

**This task owns**: ScummVM build script, engine subset, demo page, asset bundling, save-game wiring, `deps.toml`, browser smoke verification.

**This task does NOT own**: kernel device internals, SDL2 driver internals, ABI bumps for those devices. Each prerequisite is its own PR family in its own task.

**Why no kernel changes here.** Every device ScummVM needs already has (or will have) a `/dev/...` entry from a sibling task. ScummVM is a pure userland consumer. If a kernel gap surfaces during integration (e.g., SDL2 needs `getloadavg`), the fix lands in the relevant kernel PR, not here.

## §3. Prerequisites — what must be true before this lands

| Capability | Owner | State on 2026-04-29 |
|---|---|---|
| `/dev/fb0` (BGRA32, ioctls, mmap binding) | shipped (#349/#350/#351) | ✅ in `main` |
| `/dev/dsp` (OSS PCM out) | separate `/dev/dsp` task | 🔄 in flight |
| `/dev/input/mice` (PS/2 3-byte protocol) | `add-fbdoom-mouse-support` PRs | 🔄 staged, not merged |
| SDL2 with `wasmposix` video, `oss` audio, `evdev/mice` input | dedicated SDL2 task | 🔄 in flight |
| Audio sink in browser (AudioWorklet) | comes with `/dev/dsp` host work | 🔄 in flight |
| Mouse injector in browser (pointer-lock) | comes with mouse host work | 🔄 staged |
| C++17 toolchain (`wasm32posix-c++` + libc++) | already used by MariaDB | ✅ in `main` |

**This design assumes all four 🔄 rows land first.** The ScummVM implementation branch will be based on the latest of those branches at implementation start (or on `main` once they're merged). The plan PR will spell out the exact base.

**Fallback if a prerequisite stalls.** If SDL2 or `/dev/dsp` is not ready when implementation starts, ScummVM cannot land — there is no bypass. We do **not** patch ScummVM to skip audio or to render via something other than SDL2; that would compromise hosted software. We park the branch and resume.

## §4. ScummVM port

### 4.1 Source & version

- Upstream: `https://github.com/scummvm/scummvm`
- Target tag: latest stable at implementation time (≥ 2.8.0). Freeze on a tag, not `master`, for reproducibility.
- License: GPL-3.0-or-later. Compatible with this project's licensing posture (other GPL ports already shipped: bash, mariadb, perl, ruby).

### 4.2 Engine subset

Three engines, all serving freeware-redistributable adventure games:

| Engine | Game | Disk size (floppy) | Why |
|---|---|---|---|
| `sky` | Beneath a Steel Sky | ~10 MB | The canonical "ScummVM mascot" demo. Voice acting, music, full intro. |
| `queen` | Flight of the Amazon Queen | ~30 MB | Classic LucasArts-style point-and-click, full speech. |
| `lure` | Lure of the Temptress | ~3 MB | Smallest freeware ScummVM game; fast first-load demo fallback. |

Configure flags:

```
--disable-all-engines
--enable-engine=sky
--enable-engine=queen
--enable-engine=lure
```

This drops ~70 engine-`.a` files from the link, cuts the binary from ~40 MB to ~6 MB, and avoids dragging in `lua`, `mt32emu`, and other large optional deps that only specific engines need.

### 4.3 Disabled features

```
--backend=sdl                  # the only backend that exists for our targets
--enable-static                # everything statically linked into one wasm
--disable-debug
--disable-mt32emu
--disable-fluidsynth           # AdLib/PCspeaker is enough for the three engines
--disable-libcurl              # no cloud sync
--disable-cloud
--disable-libsmpeg             # video codec; not used by the three engines
--disable-mpeg2
--disable-theoradec            # not used by the three engines
--disable-faad
--disable-mad                  # MP3; floppy releases don't need it
--disable-flac
--disable-vorbis               # would only matter for re-encoded HD assets
--disable-jpeg
--disable-libunity             # Linux desktop integration; we have no DE
--disable-taskbar
--disable-discord
--disable-tts
--disable-eventrecorder
--disable-readline             # we have stdin, not a tty; ScummVM doesn't need it
--disable-update-checking
--disable-detection-static     # use dynamic detection module
```

Enabled (small wins worth the link cost):

```
--enable-zlib                  # already in libs, used for compressed savegames
--enable-png                   # already in libs, used for screenshots
--enable-freetype2             # used for in-engine GUI text rendering
```

### 4.4 Build script

`examples/libs/scummvm/build-scummvm.sh` — mirrors the MariaDB script's structure (C++ cross-compile, configure-with-overrides, autoconf-cache `ac_cv_*=no` for host-only autodetects):

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

REPO_ROOT="$(git rev-parse --show-toplevel)"
source "$REPO_ROOT/sdk/activate.sh"

SRC=scummvm-src
TAG=v2.8.0   # pinned; updated explicitly with deps.toml sha bump

[ -d "$SRC" ] || git clone --depth 1 --branch "$TAG" \
                   https://github.com/scummvm/scummvm "$SRC"

# Apply project-local cross-compile patches idempotently (the fbdoom pattern).
for p in patches/*.patch; do
  (cd "$SRC" && git apply --check "$REPO_ROOT/examples/libs/scummvm/$p" 2>/dev/null \
                && git apply "$REPO_ROOT/examples/libs/scummvm/$p")
done

cd "$SRC"

# Block configure from probing host system for things that exist on macOS/Linux
# but not in our musl wasm32 sysroot (autoconf cache vars, see CLAUDE.md).
ac_cv_func_feenableexcept=no \
ac_cv_func_clock_getres=yes \
./configure \
    --host=wasm32-unknown-linux-musl \
    --backend=sdl \
    --enable-static \
    --disable-all-engines \
    --enable-engine=sky \
    --enable-engine=queen \
    --enable-engine=lure \
    --disable-debug \
    --disable-mt32emu --disable-fluidsynth \
    --disable-libcurl --disable-cloud \
    --disable-libsmpeg --disable-mpeg2 --disable-theoradec \
    --disable-faad --disable-mad --disable-flac --disable-vorbis --disable-jpeg \
    --disable-libunity --disable-taskbar --disable-discord --disable-tts \
    --disable-eventrecorder --disable-readline --disable-update-checking \
    --enable-zlib --enable-png --enable-freetype2

make -j"$(nproc)"

# Per-project convention: every binary goes through wasm-fork-instrument.
# ScummVM doesn't fork, but the convention catches accidental regressions.
"$REPO_ROOT/tools/bin/wasm-fork-instrument" scummvm scummvm.wasm
```

### 4.5 Library dependencies

| Lib | Status | Notes |
|---|---|---|
| `libSDL2` | separate task | Provided by the SDL2 task; consumed via `sdl2-config`. |
| `libz` (zlib) | shipped | Already in `examples/libs/zlib/`. |
| `libpng` | shipped | Already in `examples/libs/libpng/`. |
| `libfreetype` | **new lib package** | Needs its own `examples/libs/freetype/` with `deps.toml`. Pure C, no exotic deps (just zlib + libpng). Modest port. |
| `libstdc++` (libc++) | already built | MariaDB uses it; same `scripts/build-libcxx.sh`. |

Adding `freetype` is the only new library port introduced by this task. Its build is straightforward (autoconf + cross-compile) and it has independent value for any future text-rendering port.

### 4.6 deps.toml

```toml
kind = "program"
name = "scummvm"
version = "2.8.0"
revision = 1
depends_on = ["zlib@1.3.1", "libpng@1.6.43", "freetype@2.13.2", "sdl2@2.30.x"]
arches = ["wasm32"]   # wasm64 deferred; ScummVM has int-pointer assumptions worth a separate audit

[source]
url = "https://github.com/scummvm/scummvm/archive/refs/tags/v2.8.0.tar.gz"
sha256 = "<filled by build-and-publish step>"

[license]
spdx = "GPL-3.0-or-later"
url = "https://github.com/scummvm/scummvm/blob/master/COPYING"

[[outputs]]
name = "scummvm"
wasm = "scummvm.wasm"

[binary.wasm32]
archive_url = "https://github.com/mho22/wasm-posix-kernel-binaries/releases/download/binaries-abi-v6-2026-XX-XX/scummvm-2.8.0-rev1-abi6-wasm32-*.tar.zst"
archive_sha256 = "<filled at publish>"
```

(Binary-archive URLs follow the pattern from `mariadb/deps.toml` and `fbdoom/deps.toml`. Per the package management v2 system in PR #365, the pre-built archive is what users actually fetch; the build script is the reproducibility receipt.)

## §5. Demo page

**Path**: `examples/browser/pages/scummvm/`

**Contents**:

```
index.html      # canvas + start button + status panel + control hints
main.ts         # boot kernel, lazy-register game data, spawn scummvm
public/
  bass/         # Beneath a Steel Sky game data (lazy-loaded, see §6)
```

**`main.ts` skeleton** (~120 lines, pattern lifted from `pages/doom/main.ts`):

```ts
const kernel = new BrowserKernel({ /* default config */ });
await kernel.init(kernelBytes);

// Lazy-register BASS files. ScummVM auto-detects them via Common::FSNode.
kernel.registerLazyFiles([
  { path: '/usr/local/games/bass/sky.cpt', url: '/assets/bass/sky.cpt', size: 73996 },
  { path: '/usr/local/games/bass/sky.dnr', url: '/assets/bass/sky.dnr', size: 178 },
  { path: '/usr/local/games/bass/sky.dsk', url: '/assets/bass/sky.dsk', size: 7847468 },
  { path: '/usr/local/games/bass/sky.exe', url: '/assets/bass/sky.exe', size: 304624 },
  // … remaining files; full manifest in §6 ↓
]);

// Writable home for savegames + scummvm.ini.
kernel.mkdir('/home/scummvm', 0o755);

const pid = await kernel.spawn(scummvmBytes, [
  'scummvm',
  '--path=/usr/local/games/bass',
  '--savepath=/home/scummvm/saves',
  '--fullscreen',
  'sky',                      // auto-launch the BASS engine
], {
  env: { HOME: '/home/scummvm', SDL_VIDEODRIVER: 'wasmposix',
         SDL_AUDIODRIVER: 'oss' },
  cwd: '/home/scummvm',
});

// Display.
attachCanvas(canvas, kernel.framebuffers, pid, { getProcessMemory });

// Audio: from the /dev/dsp host work — registry is per-pid, same shape as fb.
attachAudio(audioContext, kernel.audio, pid, { getProcessMemory });

// Mouse: pointer-lock + injectMouseEvent (from mouse host work).
canvas.addEventListener('click', () => canvas.requestPointerLock());
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas) {
    kernel.injectMouseEvent(pid, e.movementX, e.movementY, mouseButtons);
  }
});

// Keyboard: same termios-stdin pattern as DOOM (Esc, F2/F5 save, F7 load, …).
canvas.addEventListener('keydown', e => {
  const bytes = mapKeyEvent(e);
  if (bytes) kernel.appendStdinData(pid, bytes);
});
```

**Canvas size**: ScummVM in BASS mode renders 320×200 (or 320×240 with subtitle area). We size the canvas to 640×400 logical, `image-rendering: pixelated`, and let SDL2's `wasmposix` driver write into the framebuffer at native res with an integer scale-up. (SDL2 in our port presents at the framebuffer's geometry, which we leave at the existing 640×400 BGRA32 — the `wasmposix` SDL2 video driver does the 2× nearest-neighbor scale.)

**Control hints panel**: BASS uses left-click=walk-to/use, right-click=examine, F5=menu (save/load/quit). We surface these as a static panel below the canvas — adventure games are unintuitive without them.

## §6. Game-asset strategy

**Game**: Beneath a Steel Sky, freeware floppy version, total ~10 MB across 11 files.

**Hosting**: assets ship in `examples/browser/public/assets/bass/`, fetched from the project's existing static-assets path. Build-time script `examples/libs/scummvm/fetch-bass.sh` downloads from ScummVM's `downloads.scummvm.org/frs/extras/Beneath a Steel Sky/bass-cd-1.2.tbz2`, verifies sha256, extracts to `public/assets/bass/`.

**Loading**: `kernel.registerLazyFiles([...])` for every file. The VFS fetches each on first read (mirroring fbDOOM's WAD pattern from PR #206). ScummVM scans `--path=/usr/local/games/bass`, opens the files lazily as it needs them. First-frame time: WAD-like — only `sky.dnr` (178 B header) and `sky.cpt` (~74 KB) on launcher startup; rest streams in as game advances.

**Why floppy not CD**: CD version (~70 MB) carries pre-encoded MP3 voices we don't decode (we disabled `mad`). Floppy version's voice samples are PCM-in-engine. The freeware redistribution is the floppy/CD bundled tarball; we ship the floppy half.

**Why BASS not Lure**: Lure is smaller (~3 MB) but text-only — no voice, no music to demo audio. BASS is the audio integration smoke test as much as the rendering one. If asset size becomes a problem (CDN cost, page load), the fallback is documented: switch the manifest to Lure with no engine-config change, since `lure` is also enabled.

## §7. Save game persistence

**Behavior**: saves go to `/home/scummvm/saves/` in the in-memory VFS. They survive:

- Quit-and-relaunch within a tab (the kernel's VFS persists across process exits).
- F5 menu round-trip within one play session.

They **do not** survive:

- Page reload (VFS is process-memory-backed).
- Browser tab close.

**Why this is acceptable for v1**: matches fbDOOM's documented save behavior. The integration cost of OPFS or IndexedDB persistence is non-trivial and orthogonal to "does ScummVM run." Future enhancement, gets its own design doc.

**User-facing copy** in the demo page: "Saves persist while this tab is open. Reload = fresh start."

## §8. Testing strategy

Three layers, each catching what its layer should catch.

**Cargo unit tests**: none added by this task. ScummVM is pure userland; all kernel-side coverage is already in the prerequisite tasks (`/dev/fb0`, `/dev/dsp`, `/dev/input/mice`).

**Vitest integration test** (`host/test/scummvm.test.ts`):

A tiny C++ smoke harness — `examples/test-programs/sdl2-smoke.cpp` — built with the SDL2 we'll be linking:

```cpp
#include <SDL.h>
int main() {
  if (SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO) != 0) return 1;
  SDL_Window* w = SDL_CreateWindow("smoke", 0, 0, 320, 200, 0);
  if (!w) return 2;
  SDL_AudioSpec want{}, have{};
  want.freq = 22050; want.format = AUDIO_S16; want.channels = 2;
  want.samples = 1024;
  if (SDL_OpenAudio(&want, &have) != 0) return 3;
  // Open a single fb mmap, paint a known color, blit, present.
  SDL_Surface* s = SDL_GetWindowSurface(w);
  SDL_FillRect(s, NULL, SDL_MapRGB(s->format, 0xAB, 0xCD, 0xEF));
  SDL_UpdateWindowSurface(w);
  write(1, "ok\n", 3);
  return 0;
}
```

This program is *not* a ScummVM test — it's an SDL2 smoke that validates the SDL2-on-our-kernel path. It will be contributed by the SDL2 task. Listed here because the ScummVM Vitest test depends on it passing.

The ScummVM-specific Vitest test:

1. Spawn `scummvm.wasm` with `--list-engines` (a no-IO command).
2. Assert it prints `sky`, `queen`, `lure` and exits 0.
3. Spawn it again with `--detect --path=<bass-fixture>`.
4. Assert it prints `Found game: sky` and exits 0.

The fixture is a tiny synthetic directory with stub `sky.dnr` etc. — we are not running BASS in CI. No graphics, no audio, no mouse — those are validated manually in the browser.

**Manual browser verification** (the actual demo, the only test that proves the integration):

Per `CLAUDE.md` "for UI or frontend changes, start the dev server and use the feature in a browser before reporting the task as complete." Concretely:

1. `./run.sh browser` → navigate to `/scummvm/`.
2. Click Start. Within ~10 s, the ScummVM logo and BASS title screen render.
3. Intro animation plays end-to-end. Music is audible. The voice acting on the first dialogue line is audibly clear (not stuttering).
4. Click-walk to the prison door. Right-click to examine. Both work via pointer-lock + `/dev/input/mice`.
5. F5 → save in slot 1 → exit to launcher → re-select sky → load slot 1 → game resumes mid-scene.
6. Frame rate is "playable" (eyeball ≥ 25 fps for cinematic intro, ≥ 30 fps for gameplay).
7. No console errors during a 5-minute play session.

No Playwright pixel test for the same reasons fbDOOM has none: the engine is non-deterministic (animation timing, RNG-seeded NPCs), and a pixel-perfect test would be brittle. Vitest covers the wiring; the demo session covers the integration.

**Full project test gauntlet** per `CLAUDE.md` — all suites must pass with zero regressions vs `main`:

1. `cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib`
2. `cd host && npx vitest run`
3. `scripts/run-libc-tests.sh`
4. `scripts/run-posix-tests.sh`
5. `bash scripts/check-abi-version.sh`

Expected: zero changes to suites 1, 3, 4, 5 from this PR family alone (we touch no kernel code). Suite 2 gains the ScummVM Vitest test. If suite 5 trips, something is wrong — investigate before continuing.

## §9. ABI & rollout

**ABI surface added by this task**: **none**. Kernel surface, host trait surface, and channel layout are all untouched. ScummVM is a pure userland binary and a pure browser-page demo. ABI version stays at whatever the current value is when implementation lands.

**Documentation deltas** (per `CLAUDE.md` "every PR that adds user-facing features must include corresponding documentation updates"):

- `docs/architecture.md` — short subsection: "ScummVM demo, the SDL2-stack consumer."
- `docs/posix-status.md` — no new syscalls; nothing to add.
- `docs/browser-support.md` — note that the demo requires WebAudio + pointer-lock APIs.
- `README.md` — ScummVM in the "Software ported" list.
- `docs/porting-guide.md` — small section: "porting an SDL2 application" referencing this work.

**Rollout sequencing** — opened on the `mho22` fork only; no upstream merge until Brandon validates the demo manually.

The work splits into one or two PRs depending on how the freetype port lands:

1. **PR #1 — `examples(libs/freetype)`: vendored freetype build + deps.toml.** Pure library port, no kernel changes, no consumer yet. Standalone reviewable: it builds, its `.a` and headers populate the sysroot, no other package in the tree depends on it yet.

2. **PR #2 — `examples(scummvm)`: ScummVM port + browser demo.** Depends on PR #1 plus the prerequisite tasks (SDL2, `/dev/dsp`, `/dev/input/mice`). Brings build-scummvm.sh, deps.toml, demo page, BASS asset bundling, smoke Vitest, doc deltas.

Both PRs are opened on `https://github.com/mho22/wasm-posix-kernel`, **not on Brandon's repo**, per the project's contribution rules. We do not merge — even on the fork — until the manual browser session in §8 passes and Brandon has reviewed both PRs. Branches stack: PR #2 is based on PR #1's branch, which is based on the design branch, which is based on `main`.

**What gets validated together at the end**:

- BASS plays from intro to first save/load round-trip in Chrome, Safari, Firefox.
- All five test suites pass on `main`-merged-in.
- ABI snapshot is unchanged.
- The whole tree compiles fresh on a clean checkout (`./run.sh browser` from a fresh clone).

If any of those fail, we don't merge. We fix or park.
