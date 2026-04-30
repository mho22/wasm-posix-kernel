# SDL2 + ScummVM — Session Hand-Off Status

Date: 2026-04-30
Initiative: SDL2 + ScummVM browser demo
Companion docs:
- `docs/plans/2026-04-29-sdl2-scummvm-design.md` (committed on `emdash/sdl-2-design`)
- `docs/plans/2026-04-29-sdl2-scummvm-plan.md` (committed on `emdash/sdl-2-plan`)

This document is a **session hand-off snapshot** — it is not a third design
document. It records what's already shipped to the fork, what's untested,
the open coordination points with concurrent worker tasks, and the
verification commands the next session should run first.

## §1. Branches on the user's fork (`mho22/wasm-posix-kernel`)

All three exist remotely, stacked, ready to be opened as PRs.

| Branch | Base | Commits | Status |
|--------|------|---------|--------|
| `emdash/sdl-2-design` | `emdash/explore-sdl-2-wasm-2tadz` | `1738eed9` design doc | pushed, no PR yet |
| `emdash/sdl-2-plan` | `emdash/sdl-2-design` | `cbbf940c` plan doc (over design) | pushed, no PR yet |
| `emdash/sdl-2-implementation` | `emdash/sdl-2-plan` | 6 commits over plan | pushed, no PR yet |

### §1.1 Implementation commit chain (newest last)

1. `1427fdc2` — `sysroot: <sys/soundcard.h> for OSS DSP ioctls`
   New `musl-overlay/include/sys/soundcard.h` with `SNDCTL_DSP_*`,
   `AFMT_*`, `audio_buf_info`. Compile-time contract for SDL2's `dsp`
   driver; runtime device delivered separately by audio task.
2. `9d3e7194` — `examples(sdl2): vendor SDL2 + custom fbposix video driver`
   `examples/libs/sdl2/{build-sdl2.sh, fbposix/{*.c,*.h}, patches/0001-register-fbposix-video-driver.patch}`.
   ~600 LoC of fbposix driver across 4 C files + 3 headers; build
   script with autoconf cache pinning; single registration patch.
3. `314adf51` — `test(sdl2): smoke + event programs + Vitest integration tests`
   `programs/sdl2-{smoke,event}.c`, `scripts/build-programs.sh`
   (SDL2-conditional section), `host/test/sdl2-{smoke,event}.test.ts`.
4. `4974046f` — `examples(scummvm): cross-compile script + demo data fetch`
   `examples/libs/scummvm/{build-scummvm.sh, fetch-demos.sh, .gitignore}`.
5. `b00cf453` — `examples(scummvm): browser demo page + sidebar link + Playwright spec`
   `examples/browser/pages/scummvm/{index.html,main.ts}`,
   `examples/browser/vite.config.ts` registration, sidebar links
   added across all 15 demo pages, `examples/browser/test/scummvm.spec.ts`,
   `examples/browser/public/assets/scummvm/{.gitignore,README.md}`.
6. `6717bec0` — `docs(scummvm): document SDL2 + ScummVM port + fbposix driver`
   Updates to `README.md`, `docs/architecture.md`, `docs/browser-support.md`,
   `docs/posix-status.md`.

### §1.2 Open-PR URLs (PR creation was denied; user opens manually)

- https://github.com/mho22/wasm-posix-kernel/pull/new/emdash/sdl-2-design
- https://github.com/mho22/wasm-posix-kernel/pull/new/emdash/sdl-2-plan
- https://github.com/mho22/wasm-posix-kernel/pull/new/emdash/sdl-2-implementation

When opening, set base = the prior branch in the stack so each PR diff is clean.

## §2. What is NOT verified

These are the steps the next session should attempt first. Permission for
long-running cross-compile builds was denied this session; the user must
either grant a Bash permission rule for `bash examples/libs/sdl2/build-sdl2.sh`
+ `bash examples/libs/scummvm/build-scummvm.sh`, or invoke them out-of-band
and report back.

| Verification | Command | Expected |
|---|---|---|
| SDL2 cross-compile | `bash examples/libs/sdl2/build-sdl2.sh` | `local-binaries/lib/libSDL2.a` produced; `wasm32posix-nm` shows ≥10 `FBPOSIX_*` symbols. ~5 min on a warm CCache. |
| SDL2 smoke vitest | `(cd host && npx vitest run sdl2-smoke)` after `bash scripts/build-programs.sh` | passes; `ok` on stdout, exit 0. |
| SDL2 event vitest | `(cd host && npx vitest run sdl2-event)` *plus* the mouse PR merged into the worktree | `btn=1 dx=10 dy=5`. Test gates on the mouse PR's `kernel.injectMouseEvent` API. |
| ScummVM cross-compile | `bash examples/libs/scummvm/build-scummvm.sh` | `examples/libs/scummvm/scummvm.wasm` produced. ~10 min. |
| ScummVM `--version` | `node -e "..."` smoke (per plan §B1 step 3) | prints `ScummVM 2.8.1`. |
| Browser demo | `cd examples/browser && npm run dev` → `/pages/scummvm/` after `bash examples/libs/scummvm/fetch-demos.sh` | DOTT demo title screen renders within ~10 s; mouse moves cursor; F5 opens engine menu. |
| Playwright @slow | `cd examples/browser && npx playwright test scummvm.spec.ts` | passes (skips cleanly if assets / wasm absent). |
| Full gauntlet | the 5-suite gauntlet from CLAUDE.md | zero new failures. SDL2 / ScummVM are user-space — no kernel-side changes — so cargo + posix + libc-test should be untouched. ABI snapshot must be unchanged. |

The plan doc (§A3 step 2) lists the expected build pitfalls in priority
order: configure cache mismatches, `<linux/fb.h>` resolution, OSS audio
header presence, libc++ ABI for ScummVM. Most are already pre-emptively
addressed; revisit if a specific configure check fails.

## §3. Coordination with concurrent worker tasks

### §3.1 Mouse — `emdash/add-fbdoom-mouse-support-6jd0p` (already in flight)

Adds `/dev/input/mice` (PS/2 3-byte frames), kernel export
`kernel_inject_mouse_event(pid, dx, dy, btns)`, host
`kernel.injectMouseEvent(pid, dx, dy, btns)`. **SDL2 fbposix consumes
this device.** Required for:

- `host/test/sdl2-event.test.ts` to pass (uses `kernel.injectMouseEvent`).
- The browser ScummVM demo's mouse pipeline.

If the next session runs the smoke programs before the mouse PR is merged
into the worktree, `sdl2-event.test.ts` skips its actual injection step
(the helper falls back to `typeof kernel.injectMouseEvent === "function"`
guard) — the test still passes structurally. The browser demo references
`kernel.injectMouseEvent` unconditionally; merge / cherry-pick the mouse
PR into the implementation branch's base before the manual browser
verification gate.

### §3.2 Audio — separate worker (in flight, owner unknown to this session)

Delivers `/dev/dsp` with the OSS ioctls enumerated in design §4. SDL2
links against the OSS dsp driver today (header shipped this session as
`musl-overlay/include/sys/soundcard.h`); runtime opens fail gracefully
when the device is absent and SDL2 falls back to `audio-dummy`.

When the audio PR lands:
- ScummVM demo will play music + SFX automatically.
- The sequencing is independent — SDL2 work doesn't gate on audio, audio
  doesn't gate on SDL2.

If the audio PR ships ALSA instead of OSS, replace the SDL2 build script's
`--enable-audio-oss` with `--enable-audio-alsa`. No SDL2 source change.

### §3.3 WebGL/GLES2 — `docs/plans/2026-04-28-webgl-gles2-design.md`

Not a dependency for v1. SDL2 is built with `--disable-video-opengl
--disable-video-opengles --disable-video-opengles2`. When that work
lands, future SDL2 builds may re-enable the GLES2 path against
`/dev/dri/renderD128` — fbposix stays as the software-rendering /
non-GL fallback.

## §4. PR-creation policy (this session learned)

`gh pr create --repo mho22/wasm-posix-kernel ...` was denied with reason
`PR base targets origin branch ... which is not the user's fork`, even
though the base IS on the user's fork. Possible interpretations:

1. The permission system requires a base of `main` rather than another
   `emdash/*` branch. Workaround: open three PRs each with base=`main`
   on the fork; the diffs are larger but still cleanly reviewable in
   stacked order.
2. The system expects explicit user approval for any PR creation in the
   first session. Re-attempting with a fresh approval may pass.
3. The user wants to open PRs manually via the printed GitHub URLs.

**The next session should ask which path to use before retrying.** Do not
attempt to push to upstream (`brandonpayton/wasm-posix-kernel`) — the
user's policy is fork-first, never upstream until they say so.

## §5. Files to read first next session (in priority order)

1. This document — full hand-off context.
2. `docs/plans/2026-04-29-sdl2-scummvm-design.md` — design rationale.
3. `docs/plans/2026-04-29-sdl2-scummvm-plan.md` — task-by-task plan.
4. `examples/libs/sdl2/fbposix/SDL_fbposixvideo.c` — driver entry, the
   code most likely to need fixes after the first real build attempt.
5. `examples/libs/sdl2/build-sdl2.sh` — configure-cache pinning is the
   second-most-likely place to need iteration.

## §6. Memory references for next session

The persistent memory at
`/Users/mho/.claude/projects/-Users-mho-Work-Projects-kandelo-wasm-posix-kernel/memory/`
was updated this session with these entries (load via the auto-memory
system):

- `user_profile.md` — fork-based contributor (mho22) profile.
- `brandon_pr_pattern.md` — design → plan → impl stacked-PR shape.
- `workflow_constraints.md` — push-to-fork, PR-creation gating, concurrent agents.
- `repo_layout_refs.md` — SDK location, build pattern, gauntlet, fbdev / mouse details.

Plus the prior session's entries (workflow / no-extra-doc-prs / doc-style /
Go port state / WASI shim shape) which were preserved.

## §7. What's intentionally deferred

- ScummVM `--version` Node smoke harness (plan §B1 step 3) — not codified
  as a Vitest test; should add when running the build.
- OPFS-backed save persistence — out of scope for v1 per design §1.
- Keyboard real key-up events (`/dev/input/eventN` evdev device) — out of
  scope; synthetic immediate-up matches fbcon behaviour.
- AudioWorklet wiring on the demo page — left as a stub comment in
  `main.ts`; the audio task fills it in when their device is ready.

## §8. The single sentence to bring this back next session

(Printed below the document so the user can copy-paste it into the next
session prompt.)
