---
name: kandelo-engineering
description: How to engineer in wasm-posix-kernel — Brandon Payton's design→plan→implementation 3-PR workflow, conventional-commit + Co-author-Claude discipline, POSIX-first decision rule, the 6-suite test gauntlet, never-compromise-hosted-software, ABI versioning, and devil's-advocate self-review before push. Invoke at the start of every interaction in this repo.
---

# Kandelo engineering — how this project is built

This repo (wasm-posix-kernel) is built by Brandon Payton (`brandonpayton` on GitHub, `brandon@happycode.net`). It is a centralized POSIX kernel that runs as Wasm in Node and the browser, hosting unmodified C/C++ software (DOOM, PHP, MariaDB, Erlang, …). Every choice is downstream of one priority: **make real software run unmodified**. The workflow below exists to keep that promise across many PRs and many contributors.

When you are working in this repo, **do not improvise the workflow**. Use this skill.

## When to invoke

Every interaction. The first action in every session in this repo is to load this skill. CLAUDE.md mandates it; do not skip it.

If the user asks for something that contradicts this skill, surface the contradiction and ask. Do not silently abandon the workflow.

## Project ethos — non-negotiable

1. **POSIX-first; Unix-like fallback.** When implementing or fixing kernel/syscall surface:
   1. POSIX defines it → match POSIX. Cite POSIX.1-2017 §<section> in the design doc and at the implementation site.
   2. POSIX silent, Linux defines → match Linux. Cite `man 2 <name>` or the kernel header.
   3. Linux silent, BSD defines → match BSD with rationale.
   4. All silent → simplest sensible behavior, documented in the design doc *and* `docs/posix-status.md`.
   When deviating for a host constraint (browser SAB, lack of real fork, …), comment the deviation at the call site naming the constraint.

2. **Never compromise hosted software.** If DOOM/MariaDB/PHP fails to build, the answer is to add the missing syscall or sysroot symbol, *not* to `#ifdef` it out of upstream. Cross-compile patches are allowed only for cross-compile hygiene (linker flags, build-system gunk), never to paper over platform gaps. Litmus test: "would this patch be needed on real Linux?" If no, it is a platform-gap workaround — fix the platform.

3. **The 6-suite test gauntlet gates every PR.** See CLAUDE.md "Test Verification". All six suites must pass with zero regressions before opening a PR and again before merging:
   ```bash
   cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
   (cd host && npx vitest run)
   scripts/run-libc-tests.sh
   scripts/run-posix-tests.sh
   scripts/run-sortix-tests.sh --all
   bash scripts/check-abi-version.sh
   ```
   `XFAIL` / `TIME` / `UNRES` / `SKIP` are acceptable when they predate your change. Any new `FAIL` is a regression.

4. **Tests are not negotiable.** Forbidden as workarounds to make a suite "pass": `#[ignore]`, `should_panic` absorbing a real bug, `it.skip`, `it.todo`, reclassifying a real failure as `XFAIL`, commenting out an assertion, deleting a test you couldn't fix. If a test fails, fix the code. New `XFAIL` is acceptable only when it documents a real platform gap with a rationale comment *and* a corresponding entry in `docs/posix-status.md`.

5. **ABI discipline.** Channel layout, syscall numbers, marshalled `repr(C)` structs, asyncify slots, kernel-wasm exports — all are kernel↔user-space ABI. Any change requires bumping `ABI_VERSION` in `crates/shared/src/lib.rs` and regenerating `abi/snapshot.json` in the same commit. Always run `bash scripts/check-abi-version.sh update` and inspect `git diff abi/snapshot.json` after touching any of those surfaces. See [docs/abi-versioning.md](../../../docs/abi-versioning.md).

6. **Documentation parity.** Every user-visible change updates one or more of: `docs/architecture.md`, `docs/posix-status.md`, `docs/sdk-guide.md`, `docs/porting-guide.md`, `docs/browser-support.md`, `README.md`. Code without docs is incomplete.

## The 3-step feature workflow

For any non-trivial new feature or fix, ship it as **three stacked PRs**: design, plan, implementation. Each step has its own PR. Each next branch is created off the previous branch (not off main), so the stack is reviewable and revertable in order.

```
main ──► <feature>-design ──► <feature>-plan ──► <feature>
          (PR #1: design.md)   (PR #2: plan.md)   (PR #3: code + docs)
```

### Branch naming

Descriptive kebab-case. **No tool prefixes** (no `emdash/...`), no `feature/`, no `fix/`. The base name describes the work in 3–6 words. Examples already in the repo: `wasi-shim-lazy-import`, `nix-flake-setup-for-multi-target-project-builds`, `add-dinit-package-binary`, `fix-lockfile-manifest-sha`, `serialize-tests`, `kernel-processes-writing-to-framebuffer`.

For the 3-step stack, the suffixes are:
- Design: `<base>-design`
- Plan: `<base>-plan`
- Implementation: `<base>` (bare — the implementation is the canonical name)

### When the 3 steps are mandatory vs optional

- **Mandatory (3 PRs):** new syscall, new device, new host subsystem, new ported software, new ABI surface, anything spanning kernel + host, anything that changes user-visible behavior.
- **Optional (single PR off main is fine):** lockfile / dependency bumps, typo fixes, internal-comment edits, build-script hygiene, isolated test additions that don't change behavior. Examples already in the repo: `chore(binaries): refresh lockfile sha`, `docs(xfails): reclassify pthread_create-oom`.

When in doubt, do the 3-step.

### Step 1 — Design (PR #1)

Branch off `main`. Write `docs/plans/YYYY-MM-DD-<feature>-design.md` and nothing else. The design doc is the contract; the plan and implementation refer back to it.

**Design template** — mirror `docs/plans/2026-04-26-framebuffer-fbdoom-design.md`:

```markdown
# <Feature> — Design

Date: YYYY-MM-DD
Branch: `<feature>-design`

## §1. Goals & non-goals

**Goal.** <one paragraph: what works at the end of this feature.>

**Non-goals (v1).**
- <bullets — explicit cuts.>

**Constraint.** <CLAUDE.md or repo invariants this respects, e.g. "never compromise hosted software".>

**Success criteria.** <observable behavior; ideally something a reviewer can run.>

## §2. Architecture

<ASCII diagram for cross-process / cross-component flows; otherwise a labelled call graph. Show kernel ↔ host ↔ user-process flows where relevant.>

### Trade-offs

<why this approach beats the alternatives; cite what was considered and rejected and why.>

## §3. Kernel components

<crates/kernel/* changes — types, syscalls, devfs entries, OFD variants, ABI surface added.>

## §4. Host components

<host/src/* changes — new modules, integration points, registry/state.>

## §5. <Subject port or external surface> — optional

<if porting external software, the upstream URL, expected gotchas, what gets patched (cross-compile hygiene only) vs what gets implemented in the kernel.>

## §6. Testing strategy

<which layer catches what: cargo unit / vitest integration / libc-test / POSIX / Sortix / manual browser. Give one concrete test per layer.>

## §7. ABI & rollout

<ABI surface added (or "none"); whether `ABI_VERSION` will bump; PR sequencing for the implementation phase; doc updates required.>
```

Commit, push, open the PR (Draft is fine while the user is reviewing). PR title and body conventions below.

### Step 2 — Plan (PR #2)

Branch off the design branch (not main). Write `docs/plans/YYYY-MM-DD-<feature>-plan.md`. The plan decomposes the design into TDD-style tasks, each one commit. Implementation does not deviate from the plan without amending the plan first.

**Plan template** — mirror `docs/plans/2026-04-26-framebuffer-fbdoom-plan.md`:

```markdown
# <Feature> Implementation Plan

**Goal:** <restated from design §1.>

**Architecture:** <one-paragraph summary of design §2.> Companion design doc: `docs/plans/YYYY-MM-DD-<feature>-design.md`.

**Tech stack:** <Rust kernel / TypeScript host / C user programs / external software.>

**N PRs, single coordinated merge.** Each task is committed as a single commit. PR boundaries are marked. Hold-for-merge gate: <e.g. "Phase C manual browser verification + user confirmation">.

**Verification gauntlet** (CLAUDE.md): all of the below must pass with zero regressions before any PR is opened, and re-run before the final merge:

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
scripts/run-sortix-tests.sh --all
bash scripts/check-abi-version.sh
```

`XFAIL` / `TIME` are acceptable; new `FAIL` is a regression.

---

## Phase A — <subject> (PR #1)

### Task A1: <subject>

**Files:**
- Modify: `<path>`
- Create: `<path>`

**Step 1: Failing test**

\`\`\`rust
// exact snippet, copy-pastable
\`\`\`

**Step 2: Run, observe failure**

\`\`\`bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib <test_name>
\`\`\`

Expected: <compile error / assertion failure / specific message>.

**Step 3: Implement**

\`\`\`rust
// exact code, copy-pastable
\`\`\`

**Step 4: Pass**

\`\`\`bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib <test_name>
\`\`\`

Expected: pass.

**Step 5: Commit**

\`\`\`bash
git add <files>
git commit -m "scope(area): one-line summary"
\`\`\`

---

### Task A2 … An: <full gauntlet + open PR #N>
<verification only; pushes the branch and opens the PR.>

## Phase B — <subject> (PR #2)
<same shape>

## Phase C — <subject> (PR #3)
<same shape; for browser-touching features, this phase ends with manual browser verification per CLAUDE.md.>

## Final coordinated merge

When the user confirms, merge in order PR#1 → PR#2 → PR#3, then run the full gauntlet on `main` to confirm the merged state.
```

Tasks follow strict TDD: failing test → run → implement → pass → commit. Each task is one commit. Each Phase ends with a "full gauntlet + open PR" task that runs all six suites and pushes the draft PR.

### Step 3 — Implementation (PR #3)

Branch off the plan branch. Execute the plan task-by-task, in order. Do not skip ahead. If a task turns out to be wrong, **stop and amend the plan first** (a follow-up commit on the plan branch is the right move; the impl branch then rebases). Don't silently deviate.

When the implementation phase touches the browser, follow CLAUDE.md: `./run.sh browser`, manually verify, screenshot.

When the impl is complete, run the full 6-suite gauntlet, update docs (see "Documentation parity"), then go to "Devil's-advocate review" below before pushing.

## Commit conventions

Strict conventional commits. Title: `type(scope): short description`, under ~70 characters, lowercase scope, no trailing period.

Types: `feat | fix | refactor | chore | docs | build | test`. Subsystem-as-type is also accepted in this repo when the change is area-scoped without a clear functional verb — e.g. `kernel(fbdev): …`, `host(fbdev): …`, `examples(fbdoom): …` (real titles from the framebuffer plan).

Scopes (use the narrowest accurate one): `kernel | host | pthread | pshared | binaries | nix | browser | pipe | sdk | examples | docs | abi | fbdev | mqueue | …`.

Body: multi-paragraph when non-trivial. Explain *why* and trade-offs, not what. Reference upstream issues, POSIX section numbers, prior PRs where relevant.

**Trailer — every commit you author in this repo:**

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Use HEREDOC to preserve formatting (matches CLAUDE.md and the existing commit history):

```bash
git commit -m "$(cat <<'EOF'
feat(kernel): per-thread signal routing — close pthread_kill XFAILs

Body paragraph: what was wrong, why this fix is correct, what it
unblocks. Reference POSIX.1-2017 §2.4.3 if you cite the spec.

Body paragraph: trade-offs you considered and rejected.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Representative titles already in the repo (mirror their shape):
- `feat(pthread): deferred cancellation — close 5 XFAILs`
- `fix(kernel): AF_UNIX bind() creates filesystem inode (POSIX compliance)`
- `refactor(host): lazy-import WasiShim so non-WASI workers don't pay its cost`
- `chore(binaries): refresh lockfile sha after archive_sha256 repair`
- `build(nix): add flake providing reproducible dev shell`
- `docs(xfails): reclassify pthread_create-oom as not-a-kernel-gap`

## PR conventions

**Title:** matches the lead commit's conventional-commit format.

**Body skeleton** — mirror PR #376 (`build(nix): add flake providing reproducible dev shell`):

```markdown
## Summary

<1–2 paragraphs: the problem solved and why it matters. Backticks for code,
em-dashes for pacing. State which CLAUDE.md invariants it respects.>

## What was done   (or "## How it works")

<numbered or bulleted, detailed enough that a reviewer can match items to the
diff. For a 3-PR stack, also list "## What this PR is" and link the design /
plan / sibling PRs explicitly. For Phase B/C of a stack, open with
"**Phase B of 3** — stacked on PR #N" so reviewers know the order.>

## Test plan

- [ ] <reviewer-runnable check 1, exact command + expected output>
- [ ] <reviewer-runnable check 2>
- [ ] Full gauntlet: `cargo test … --lib`, `(cd host && npx vitest run)`, `scripts/run-libc-tests.sh`, `scripts/run-posix-tests.sh`, `scripts/run-sortix-tests.sh --all`, `bash scripts/check-abi-version.sh` — zero new regressions.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

For 3-PR stacks: open PRs #1 and #2 as **Draft**, with an explicit "Holds for merge until Phase C verifies and the user confirms — see plan." line in the body. Mark Ready only when the gating phase passes.

Use `gh pr create` with a HEREDOC body, exactly as CLAUDE.md's Bash section describes.

## Devil's-advocate review — before every push

This is the gate between local work and public artifact. Before `git push` on any branch (design, plan, impl), do this in order:

1. **Read the full diff.** `git diff main...HEAD` (or `git diff <previous-branch>...HEAD` for stacked branches). Read every line. Don't skim.

2. **For every new line — variable, function, comment, test, file, character — ask:**
   *"Is this necessary to deliver this task, or is it an artifact of one of my previous attempts?"*

   Specific things to hunt for and remove:
   - Stale `// TODO` / `// FIXME` left from a different solution path.
   - Defensive checks for impossible cases (internal callers, framework guarantees).
   - Comments that restate what the code obviously does.
   - Half-removed code — variables declared but unused, imports for deleted symbols, dead branches, abandoned helpers.
   - "Future-proofing" abstractions for hypothetical needs (CLAUDE.md system prompt: three similar lines beats a premature abstraction).
   - Renamed `_var` placeholders for things you removed but kept "just in case".
   - Re-exports of types nothing imports.
   - Test code that "covers" a path that was never reachable.

3. **Delete what isn't necessary. Re-run the relevant test suite.** If anything breaks, the line was load-bearing — restore it and add a test that documents *why* the line is required.

4. **Confirm the test gauntlet still passes.** No skipping. No `#[ignore]`. No new `XFAIL` without rationale + `docs/posix-status.md` entry.

5. **Confirm doc parity.** Every user-visible change has a corresponding doc update. If not, add it before pushing.

6. **Confirm ABI snapshot matches the implementation.** If `bash scripts/check-abi-version.sh` is dirty, commit the snapshot regeneration and version bump in the same commit as the source change.

7. **Only after every character is justified, push.**

This step is mandatory. Pushing makes work public; sloppy pushes consume reviewer attention and project credibility. The cost of one extra read-through is negligible compared to a reviewer round-trip.

## Anti-patterns explicitly forbidden by CLAUDE.md (the easy-to-forget ones)

- Do **not** micro-optimize the syscall hot path (`kernel-worker.ts` argument tables, classification sets, cached `DataView`/`Int32Array`). Already benchmarked, already worse, already documented as a regression source.
- Do **not** instantiate `CentralizedKernelWorker` on the main thread on any platform. Kernel runs in a dedicated worker thread always.
- For UI / browser-demo changes: run the dev server and verify in a browser. Code reasoning is not sufficient — service workers, RAF timing, SAB behavior must be observed.
- For cross-compile builds: do not trust autoconf's host-feature detection. Use `ac_cv_func_<name>=no` overrides for anything not in our wasm sysroot.

## Tooling pointers

- The `Skill` tool: use it. This skill, plus `just-build-it` for execution discipline, plus `claude-code-guide` when the user asks about Claude Code itself.
- The `Agent` tool: use Explore agents (`subagent_type=Explore`) for codebase searches that span more than 3 queries. Keeps your main context lean for the design / plan / impl artifacts.
- The `gh` CLI: PR creation and review. Always use HEREDOC for PR bodies.
