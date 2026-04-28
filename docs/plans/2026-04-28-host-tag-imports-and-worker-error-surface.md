# Host: WebAssembly.Tag Imports + Worker Error-Surface Fix

> **For Claude (next session):** This is part 1 of a two-part effort. Part 2 is the rust-nightly toolchain fix on a sibling worktree (branch hint: `solve-nightly-issue-49ofl`). Part 2 needs the host fixes from this branch to actually verify the kernel-side suites end-to-end.

**Branch:** `emdash/fix-host-tag-imports-and-worker-error-surface-19gb1`
**Date opened:** 2026-04-28

---

## Goal

Two host-runtime bugs compounded into a silent host hang for any wasm program compiled with `-mexception-handling` (PHP, OpenSSL, libxml2, anything using `setjmp`/`longjmp`). Land both fixes, plus a regression guard, plus the symmetric fix in the main-thread test helper.

## Bugs

### Bug 1 — Missing `WebAssembly.Tag` for `__c_longjmp`
The SDK compiles every program with `-mexception-handling` (`sdk/src/lib/flags.ts:9`). The `setjmp`/`longjmp` lowering (`musl-overlay/src/setjmp/wasm32/rt.c` calling `__builtin_wasm_throw`) emits a tag import `env.__c_longjmp` with signature `(i32) -> nil`. `buildImportObject` in `host/src/worker-main.ts` only iterated function/global imports — tag imports fell through, so `WebAssembly.instantiate` died with `LinkError: tag import requires a WebAssembly.Tag`.

### Bug 2 — Silent hang on process-worker init failure
`centralizedWorkerMain` in `host/src/worker-main.ts` (~line 805) catches its own throws — including ABI-mismatch and instantiation errors — and posts `{type:"error", pid, message}` to its parent rather than re-throwing. `handleSpawn` in `host/src/node-kernel-worker-entry.ts` only wired `worker.on("error")`, never `worker.on("message")`, so those error payloads were silently dropped, the process never exited as far as the kernel-worker was concerned, and `NodeKernelHost.spawn()` waited forever on its `exitResolvers` map.

Bug 2 *masks* Bug 1: the `LinkError` was perfectly informative, but `on("error")` never saw it because the worker swallowed-and-posted instead of throwing. With Bug 2 fixed alone, you'd see Bug 1's clear `LinkError` and could chase it.

---

## What landed (status)

| File | Change | Status |
|------|--------|--------|
| `host/src/worker-main.ts` | Synthesize `WebAssembly.Tag` for `kind === "tag"` imports before the function-import stub loop. Hardcoded sigs `__c_longjmp:["i32"]`, `__cpp_exception:["i32"]`. | ✅ |
| `host/src/node-kernel-worker-entry.ts` | `failProcess(reason)` helper in `handleSpawn`. Replaces bare `worker.on("error")`. Adds `worker.on("message")` catching `type:"error"` payloads. Cleans up state and posts `{type:"exit", status:-1}` so `spawn()` resolves. | ✅ |
| `host/test/centralized-test-helper.ts` | Mirror fix on fork (~line 263), exec (~line 310), main-spawn (~line 424). Currently *also* does extra cleanup beyond the original `on("error")` paths — see Critical Review below. | ⚠ needs trim |
| `host/test/dylink.test.ts` | Replace hardcoded `/opt/homebrew/opt/llvm@21/bin/clang` with discovery (LLVM_BIN env → `brew --prefix llvm` → `/opt/homebrew/opt/llvm@<N>` fallback → PATH `clang`). Mirrors `scripts/build-programs.sh`'s `find_llvm_bin`. | ✅ |
| `examples/setjmp_test.c` | New: minimal C program exercising `setjmp`/`longjmp`. Smallest possible reproducer for both bugs. | ✅ |
| `host/test/setjmp.test.ts` | New: vitest. `existsSync` skip if binary not built. Asserts `before` → `after=42` → `DONE`. | ✅ |

---

## Critical review (devil's advocate — to do next session)

The user's directive: *every new character has to be needed*. Re-read each diff and prune.

### 1. `centralized-test-helper.ts` — likely over-reaches
- **fork (line ~263):** original `on("error")` did `kernelWorker.unregisterProcess(childPid); workers.delete(childPid)`. My `failChild()` *also* deletes from `processProgramBytes`. That is a behavior change to the existing `on("error")` path, not just adding the missing `on("message")` plumbing. **Trim:** keep original `on("error")` body literally as-was; add a separate `on("message")` handler that does the same minimum cleanup. No helper extraction.
- **exec (line ~310):** original `on("error")` was `console.error(...)` only. My `failExec()` adds `unregisterProcess + workers.delete + processProgramBytes.delete`. Same critique. **Trim:** revert original `on("error")` to its single `console.error` line; add new `on("message")` handler that performs cleanup.
- **main-spawn (line ~424):** my add — `on("message")` mirroring the `on("error")` behavior (`clearTimeout(timer); rejectExit(...)`). This one is load-bearing — without it, an instantiation failure in main-thread mode hangs `runOnMainThread` until vitest timeout. **Keep, but verify it's minimal.**

### 2. `node-kernel-worker-entry.ts` — type casts are sloppy
`WorkerToHostMessage` is a discriminated union with `{type:"error", pid:number, message:string}`. My casts `(w as { type?: string }).type === "error"` and `(w as { message?: string }).message` are unnecessary. **Simplify:**
```ts
worker.on("message", (m: WorkerToHostMessage) => {
  if (m?.type === "error") {
    failProcess(m.message ?? "process worker reported error");
  }
});
```

### 3. `worker-main.ts` — `as never` is honest but awkward
`envImports` is typed `Record<string, WebAssembly.ExportValue>`. `WebAssembly.Tag` isn't in this lib.dom.d.ts, so the cast is real. `as never` works because never is the bottom type, but `as unknown as WebAssembly.ExportValue` reads better. **Stylistic only — defer unless you're already touching the file.**

### 4. `dylink.test.ts` — the fallback list
`[21, 20, 19, 18, 17, 16, 15]` mirrors `scripts/build-programs.sh`. Reasonable. **Keep.**

### 5. The setjmp regression test
`examples/setjmp_test.c` and `host/test/setjmp.test.ts` are both ~30 lines, no slop. **Keep verbatim.**

---

## Verification tracker — CLAUDE.md gauntlet

| # | Suite | Command | Status |
|---|-------|---------|--------|
| 1 | Cargo unit tests | `cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib` | ❌ SIGABRT — gated on part-2 (rust nightly) |
| 2 | Vitest | `cd host && npx vitest run` | ✅ all pass after global-setup rebuilds putenv/getaddrinfo wasms (dylink fixed by my discovery patch) |
| 2b | PHP CLI suite | `cd host && npx vitest run --testTimeout=60000 ../examples/libs/php/test/php-hello.test.ts` | ✅ **15/15 in 2.46s** — the canonical reproducer for both bugs |
| 2c | Canonical runner | `npx tsx examples/run-example.ts examples/libs/php/bin/php.wasm -r 'echo "ok\n";'` | ✅ prints `ok` |
| 2d | setjmp regression | `cd host && npx vitest run test/setjmp.test.ts` | ✅ 1/1 in 212ms |
| 3 | musl libc-test | `scripts/run-libc-tests.sh` | ❌ gated on kernel build (part-2) |
| 4 | Open POSIX Test Suite | `scripts/run-posix-tests.sh` | ❌ gated on kernel build (part-2) |
| 5 | ABI snapshot | `bash scripts/check-abi-version.sh` | ❌ gated on kernel build (part-2). No-op expected — these changes don't touch any kernel ABI surface (channel headers, syscall numbers, marshalled structs, exports). |

**Not verified:** browser host. Same fixes should hold (the worker-main code is shared between Node and browser process workers), but it should be confirmed in part-2's gauntlet.

---

## How to actually build PHP from this worktree

The `examples/libs/php/build-php.sh` script needs:
- `$REPO_ROOT/sysroot` — symlinked from `../explore-node-wasm-rwoav/sysroot` (kernel ABI v6, compatible).
- Prebuilt zlib + openssl from the same sibling: `examples/libs/{zlib,openssl}/<name>-install` symlinks.
- sqlite + libxml2 build from scratch (~1 min total).
- PHP itself (~3 min).

After the build, `examples/libs/php/config.cache` will have been overwritten by the autoconf cache regenerator. **`git checkout -- examples/libs/php/config.cache`** to restore the curated upstream copy before committing. Likewise remove the temporary symlinks (`sysroot`, `examples/libs/{zlib,openssl}/*-install`) before staging.

---

## Brandon-style commit + PR plan

Commit title (one of two — split or single, both fine since the bugs are intertwined):

> `fix(host): plumb WebAssembly.Tag imports + surface process-worker init errors`

PR title: same.

PR body skeleton:

```
## What lands

### Bug 1 — `env.__c_longjmp` tag import (`host/src/worker-main.ts`)
[3-4 lines on the `-mexception-handling` flow]

### Bug 2 — silent spawn() hang on init failure (`host/src/node-kernel-worker-entry.ts`)
[3-4 lines: catch-and-post in worker, no on("message") in parent, exitResolvers waits forever]

### Symmetric fix in main-thread test mode (`host/test/centralized-test-helper.ts`)
fork / exec / main-spawn paths — vitest hides the hang behind its own timeout, so for symmetry only.

### Toolchain-discovery patch (`host/test/dylink.test.ts`)
LLVM_BIN env / brew --prefix / llvm@<N> fallback. Same logic as scripts/build-programs.sh.

### Regression guard
`examples/setjmp_test.c` + `host/test/setjmp.test.ts`. Both bugs fail this test if either regresses.

## Test gauntlet
[fill from the table above. State explicitly which suites are gated on part-2's nightly fix.]

## Why both bugs ship together
Bug 2 masks Bug 1. Either fix alone leaves the project in a confusing state.
```

The repo follows POSIX-compliance-first commit titles. Wasm Exception Handling isn't POSIX, so the title is `fix(host): …` rather than `(POSIX compliance)`. If we ever add a POSIX-shaped behavior change in this commit, retitle accordingly.

---

## Next-session checklist

1. Apply the Critical Review trims (items 1 and 2). Re-run vitest to confirm no regression.
2. Confirm the dylink test discovery still picks up `brew --prefix llvm` on this machine after the trim.
3. Coordinate with part-2: once that branch lands the rust-nightly fix, run gauntlet items 1, 3, 4, 5 here.
4. Stage commit. Push. Open draft PR using the body skeleton above. Do not mark ready until part-2 is merged or rebased over.
5. Update memory: mark this initiative as **landed** with the merge SHA and a note on the `__c_longjmp` tag-import precedent (this is the first place the host had to synthesize a `WebAssembly.Tag` — future tag imports follow the same pattern).
