# ScummVM Browser Demo — Implementation Plan

Date: 2026-04-29
Branch: `emdash/scummvm-plan-6d08` (based on `emdash/explore-scummvm-wasm-wfpi9`)
Companion design: [`docs/plans/2026-04-29-scummvm-design.md`](./2026-04-29-scummvm-design.md)

## Purpose

This plan turns the ScummVM design into ordered, independently-reviewable PRs on the `mho22` fork. It does **not** restate the design — read the design first. This document answers: *in what order do we build it, what does each step do, and how do we know each step is done?*

## Prerequisites — block on these first

ScummVM is the consumer at the top of a stack. It cannot land before the layers underneath it. The blocking-prerequisite set is:

| # | Prerequisite | Owner | Definition of "ready" |
|---|---|---|---|
| P1 | `/dev/dsp` virtual device + host audio sink | sibling task | A C program calling `open("/dev/dsp")`, `write(pcm_samples)` produces audible output in the browser demo and silent-but-non-erroring behavior on Node. Vitest covers the binding. |
| P2 | `/dev/input/mice` PS/2 mouse + host injector | `add-fbdoom-mouse-support` PRs | A C program reading 3-byte PS/2 frames from `/dev/input/mice` receives them when the browser sends pointer-lock movement. fbDOOM's mouse demo proves the full path. |
| P3 | SDL2 cross-built for `wasm32`, with `wasmposix` video, `oss` audio, `mice`+termios input drivers, plus `examples/libs/sdl2/` package | sibling SDL2 task | SDL2's `testdraw2`, `testaudio`, `testkeys` programs run in a smoke-test browser page and produce expected output. `sdl2-config` is on the SDK's `pkg-config` path. |

This ScummVM plan **does not start** until P1, P2, P3 are reviewed by Brandon and merged into upstream `main`, OR until their branches are stable enough that we can rebase ScummVM onto a point that includes them. The plan PR is written and reviewable now; the implementation PRs (Phase 1, 2) wait.

## Phase ordering

```
P1 /dev/dsp ─┐
P2 mice    ──┤
P3 SDL2    ──┴─► Phase 1 (freetype) ─► Phase 2 (ScummVM + demo) ─► merge train
```

Two phases. We resist splitting Phase 2 further: the ScummVM port and the demo page are tightly coupled (the build emits the binary the page consumes), and shipping one without the other is a half-state with no validation gate. The freetype dependency is split out only because it has standalone reviewable value (any future text-rendering port reuses it).

## Phase 1 — `examples(libs/freetype)`: freetype port

**Branch**: `emdash/scummvm-impl-freetype-<rand>` based on `emdash/scummvm-plan-6d08`.

**Why first**: ScummVM links freetype for in-engine GUI text. Freetype has zero dependencies beyond zlib + libpng (already shipped). It's a clean ~30-minute port-at-most given prior libpng/openssl precedent. Splitting it lets ScummVM's PR review focus on the consumer wiring, not on a new library landing alongside.

### What lands

```
examples/libs/freetype/
├── build-freetype.sh
├── deps.toml
└── (no patches expected)
```

`build-freetype.sh` follows the libpng pattern (autoconf-style cross-compile, `--host=wasm32-unknown-linux-musl`, no autoconf-cache overrides expected — freetype's configure is well-behaved on cross targets). Pinned to freetype 2.13.2 (latest stable at planning time).

`deps.toml`:

```toml
kind = "library"
name = "freetype"
version = "2.13.2"
revision = 1
depends_on = ["zlib@1.3.1", "libpng@1.6.43"]
arches = ["wasm32"]

[source]
url = "https://download.savannah.gnu.org/releases/freetype/freetype-2.13.2.tar.xz"
sha256 = "<filled at build>"

[license]
spdx = "FTL OR GPL-2.0-only"
url = "https://gitlab.freedesktop.org/freetype/freetype/-/blob/master/LICENSE.TXT"

[outputs]
libs = ["lib/libfreetype.a"]
headers = ["include/freetype2"]
pkgconfig = ["lib/pkgconfig/freetype2.pc"]

[binary.wasm32]
archive_url = "<published after build>"
archive_sha256 = "<filled at publish>"
```

### Steps

1. `git checkout -b emdash/scummvm-impl-freetype-<rand>` from this plan branch.
2. Author `examples/libs/freetype/build-freetype.sh` mirroring `examples/libs/libpng/build-libpng.sh` line by line.
3. Author `examples/libs/freetype/deps.toml`.
4. Run `bash examples/libs/freetype/build-freetype.sh` — confirm `libfreetype.a` lands in the sysroot.
5. Build a tiny C smoke (in `examples/test-programs/`) that calls `FT_Init_FreeType` + `FT_Done_FreeType` and exits 0. Run it. (Smoke is committed.)
6. Run the full project gauntlet (suites 1–5 from `CLAUDE.md`).
7. Commit. Push to fork. Open PR `mho22:emdash/scummvm-impl-freetype-…` → `mho22:main`. Draft until Brandon reviews.

### Gates

- `libfreetype.a` builds cleanly with no warnings beyond what libpng has at the same `-W` level.
- `pkg-config --cflags --libs freetype2` from the SDK shell prints sensible paths.
- Smoke program returns 0 from `FT_Init_FreeType` round-trip.
- All 5 test suites pass with zero regressions vs `main`.
- No ABI snapshot drift (no kernel changes).

### Rollback

If freetype's configure/build fights the cross-compile, abort the phase, document the obstacle in this plan's "Risks" section, and fall back to `--disable-freetype2` in ScummVM's configure (one-line change in Phase 2). ScummVM still builds and runs without freetype — only the in-engine GUI text uses bitmap fonts, which is the legacy path.

## Phase 2 — `examples(scummvm)`: ScummVM port + browser demo

**Branch**: `emdash/scummvm-impl-port-<rand>` based on `emdash/scummvm-impl-freetype-<rand>`.

**Why this is one PR not two**: the build and the demo are two halves of the same gate. Manual browser verification is the only thing that proves the port works (per design §8). A "build PR" without the demo gives no signal; a "demo PR" without the build is non-functional.

### What lands

```
examples/libs/scummvm/
├── build-scummvm.sh
├── fetch-bass.sh                 # downloads + verifies BASS freeware bundle
├── deps.toml
└── patches/
    └── 0001-cross-compile-fixes.patch  (only if needed; aim to ship empty)

examples/browser/pages/scummvm/
├── index.html
├── main.ts
├── style.css                     # canvas sizing, control panel, status colors
└── (canvas + pointer-lock + audio wiring inline in main.ts)

examples/browser/public/assets/bass/
└── (BASS files, ~10 MB, fetched by fetch-bass.sh, gitignored — reproducible
   from the script + sha256)

examples/test-programs/
├── scummvm-list-engines.sh        # smoke harness invoking the binary
└── scummvm-detect.sh              # synthetic-fixture detection smoke

host/test/
└── scummvm.test.ts                # Vitest smoke (--list-engines, --detect)

docs/
├── architecture.md                # +subsection: SDL2-stack consumer
├── browser-support.md             # +note: WebAudio + pointer-lock required
├── porting-guide.md               # +section: porting an SDL2 application
└── README.md (root)               # +entry: ScummVM under "Software ported"
```

### Steps

1. `git checkout -b emdash/scummvm-impl-port-<rand>` from the freetype branch (or from `main` if freetype is already merged into the fork's main by then).
2. Author `examples/libs/scummvm/build-scummvm.sh` per design §4.4 verbatim. Pin tag `v2.8.0`.
3. Author `examples/libs/scummvm/deps.toml` per design §4.6.
4. Author `examples/libs/scummvm/fetch-bass.sh` — fetches `bass-cd-1.2.tbz2` from `downloads.scummvm.org/frs/extras/Beneath%20a%20Steel%20Sky/`, verifies sha256, extracts to `examples/browser/public/assets/bass/`. Gitignore the asset directory; the script is the source of truth.
5. First build attempt: `bash examples/libs/scummvm/build-scummvm.sh`. **Expect failures** — this is where the iteration happens. Likely candidates:
   - C++ feature-detection autoconf running against host. Add `ac_cv_*=no` overrides as discovered.
   - SDL2's `sdl2-config` not on path → confirm SDK activation; widen the search if needed.
   - C++17 features that musl-on-wasm32 doesn't expose. Patch ScummVM only to fix a cross-compile bug (`patches/0001-cross-compile-fixes.patch`), never to change behavior.
   - Engine-internal asm or platform-specific ifdefs. Triage: is this a kernel/SDL2 gap (fix there), or a portability bug ScummVM should accept upstream (patch + send-upstream note in the patch header)?
   - Strong rule: **no `--disable-engine=…` to escape a build error**. We disabled what we disabled in design §4.3 with reasons. New disables require a design-doc amendment.
6. Once `scummvm.wasm` builds: run `scummvm.wasm --list-engines` from a Node-host harness. Assert `sky`, `queen`, `lure` show up.
7. Run `scummvm.wasm --detect --path=<bass-fixture>` against a synthetic fixture (10 stub files matching the BASS file-list manifest). Assert "Found game: sky".
8. Wire the Vitest test (`host/test/scummvm.test.ts`) around steps 6 and 7.
9. Author `examples/browser/pages/scummvm/index.html` — canvas + start button + control hints panel + status pane. Pattern lifted from `pages/doom/index.html`.
10. Author `examples/browser/pages/scummvm/main.ts` — kernel boot, lazy-register BASS files, spawn ScummVM, attach canvas/audio/mouse/keyboard. Pattern lifted from `pages/doom/main.ts`. Anticipate the audio attach API name from the `/dev/dsp` task; if it's still under design, leave a single-line `attachAudio(...)` call commented with a `TODO(audio-task)` and wire it once the audio task lands.
11. Run `./run.sh browser` → navigate to `/scummvm/`. Iterate until the manual-verification checklist (design §8) passes:
    - BASS title screen renders.
    - Intro music + voice audible.
    - Click-walk works (pointer-lock).
    - F5 save → exit → reload → F7 load round-trip.
12. Update `docs/architecture.md`, `docs/browser-support.md`, `docs/porting-guide.md`, `README.md` per design §9.
13. Run the full project gauntlet (suites 1–5).
14. Commit. Push. Open PR `mho22:emdash/scummvm-impl-port-…` → `mho22:main`. Draft.
15. Loop: Brandon reviews → fix feedback → un-draft when both PRs (#1 freetype, #2 ScummVM) are ready to land together.

### Gates (all must hold before exiting draft)

**Build gates**:
- [ ] `scummvm.wasm` builds with the design's configure flags. No `--disable-engine` additions beyond `sky`/`queen`/`lure`.
- [ ] Binary size ≤ 12 MB (design predicted ~6 MB; budget 2× for safety).
- [ ] `--list-engines` emits exactly `sky`, `queen`, `lure`.

**Test gates**:
- [ ] Vitest `scummvm.test.ts` passes on Node host.
- [ ] All 5 suites pass with zero regressions.
- [ ] No ABI snapshot drift (no kernel changes).

**Browser gates** (manual, recorded in PR body):
- [ ] BASS title screen within ~10 s of clicking Start in Chrome.
- [ ] Music + voice audible during intro, no audio glitches.
- [ ] Mouse click-walk works (pointer-lock).
- [ ] F5 save → exit → relaunch → F7 load resumes mid-scene.
- [ ] Frame rate ≥ 25 fps eyeball.
- [ ] Same 5-step run passes in Firefox and Safari (or documented limitation in the PR body).

**Doc gates**:
- [ ] All four doc files in design §9 updated.
- [ ] PR body links to the design doc (PR #21 on this fork).

### Rollback

If the manual browser verification reveals a bug in a prerequisite (`/dev/dsp` glitches, SDL2 driver flicker, mouse drift), the bug fix lands in the prerequisite's repo/branch — not patched-around in ScummVM. The ScummVM PR sits in draft until the fix lands.

If a ScummVM-internal cross-compile issue cannot be resolved within ~2–3 evenings of work, the fallback is to bisect by re-enabling engines one-by-one starting with `lure` (smallest) and stopping at the smallest failure-free set. This is a documented escape hatch, not a default.

## Branching summary

```
main
└── emdash/explore-scummvm-wasm-wfpi9         (design — PR #21)
    └── emdash/scummvm-plan-6d08              (this plan — PR #?)
        └── emdash/scummvm-impl-freetype-…    (Phase 1 — PR)
            └── emdash/scummvm-impl-port-…    (Phase 2 — PR)
```

Per the user's branching rule: every new branch is based on the previous, and exploration branches are the one exception (the `explore-scummvm-…` branch is itself the exception, branching from `main`). All branches in this stack live on `mho22/wasm-posix-kernel`. Nothing is pushed or merged to `brandonpayton/wasm-posix-kernel` until Brandon validates the full stack end-to-end.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| `/dev/dsp` task slips → ScummVM port has no audio | medium | Phase 2 cannot start until P1 lands. Plan PR exists earlier so the design is reviewable in parallel. |
| SDL2's video driver patch list balloons → freetype + ScummVM gate on it | medium-high | The ScummVM design intentionally puts SDL2 in its own task with its own gates so escalations there don't bleed in here. |
| BASS asset hosting (CDN, copyright) | low | ScummVM's own download server is the canonical mirror; we point the fetch script there and verify sha256. If the URL ever 404s, fall back to mirror-of-mirror or change the demo game to Lure. |
| Save persistence missing across reload feels broken to users | low (documented) | Status panel says "Saves persist while this tab is open." Future enhancement is its own design. |
| ScummVM 2.8.0 cross-compile is harder than expected | medium | Patch budget is `patches/` directory. If the patch count exceeds 5, halt and reconsider — possibly drop to ScummVM 2.7.x. |
| Frame rate too low to play | low | BASS is 320×200 at original 35 fps; even at 5× CPU overhead from wasm, headroom is large. If hit, profile, optimize the `wasmposix` SDL2 video driver before patching ScummVM. |

## Out of scope (do not creep)

- A second game (Lure, Queen) shipped in the same demo. One game, one demo.
- An OPFS save backend. Future design.
- Multi-player or networked engines.
- A ScummVM "launcher pages" UI in our HTML wrapper. ScummVM's own launcher is the UI.
- Engine ports for non-freeware games (DOTT, MI1, Sam & Max). Cannot legally bundle.
- Any kernel changes. Any host changes outside the demo page wiring.

## Test plan to execute at the end of Phase 2

1. `cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib` — expect zero regressions vs `main` (we touch no kernel code).
2. `cd host && npx vitest run` — passes including the new `scummvm.test.ts`.
3. `scripts/run-libc-tests.sh` — zero unexpected failures.
4. `scripts/run-posix-tests.sh` — zero `FAIL`.
5. `bash scripts/check-abi-version.sh` — exit 0, no ABI bump needed.
6. Manual browser verification per design §8.

If any of suites 1, 3, 4, 5 regress, we have a bug somewhere in the prerequisites that this PR has surfaced. Stop and fix before merging.
