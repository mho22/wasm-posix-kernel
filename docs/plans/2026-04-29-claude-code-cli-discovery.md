# Claude Code Phase B — Build/Test Verification Discovery

Date: 2026-04-29
Branch: `emdash/build-claude-code-wasm-phase-b`
Worktree: `emdash/worktrees/kandelo/wasm-posix-kernel/emdash/add-claude-code-wasm-tzdid/`

## TL;DR

The crypto bridge in this branch (`qjs-crypto-bridge.c` + `bootstrap.js`
crypto rewrite + 8 vitest cases) is **code-complete and links cleanly**.
Verification — running the new tests — is blocked by a pre-existing
runtime regression that surfaces only after cherry-picking PRs **#5**
(host worker error surfacing) and **#7** (toolchain unpin + ABI v7) onto
this branch's base, per the user's instruction to "implement
[#7] and [#5], we will get rid of merge conflicts later."

## What was tested and what landed

1. `bash build.sh` — **passes** at ABI v7 with the unpinned nightly
   toolchain after applying #7. Produces `kernel.wasm` (wasm64) and
   `sysroot/lib/libc.a`.
2. `bash examples/libs/quickjs/build-quickjs.sh` — **passes**. Resolves
   OpenSSL via `xtask build-deps resolve openssl`, links `libcrypto.a`
   and `libssl.a` into `node.wasm`. Produces a 5,136,699-byte
   `node.wasm` at `local-binaries/programs/wasm32/quickjs/node.wasm`.
3. `(cd host && npx vitest run node-compat -t "evaluates a simple")` —
   **fails** with `Maximum call stack size exceeded` *during* QuickJS
   bootstrap evaluation. Stdout empty, exit code 1.

The same failure reproduces with a fully-reverted `bootstrap.js` (back
to `git show 3729f6fe^:.../bootstrap.js`) and with the
`qjs_init_module_crypto_bridge` call disabled in `node-main.c`. So:
**neither this PR's crypto bridge nor its `bootstrap.js` rewrite is the
cause.** The failure surfaces after applying #5+#7 to a tree that has
never been built+tested with that combination upstream.

## Hypothesis

`crates/kernel/src/wasm_api.rs` and the host worker boot path now route
new errors that PR #5 specifically uplifted from "silent hang" to
"surfaced exception." Combined with PR #7's lld memory-import semantic
shift, QuickJS's `js_check_stack_overflow` may be triggering on a
shadow-stack base that wraps `uintptr_t` — exactly the failure mode the
existing comment in `node-main.c:222` warns about:

```c
/* Note: do NOT call JS_SetMaxStackSize on wasm32. The shadow stack
   starts at a low address (~64KB), so subtracting any large stack_size
   wraps the uintptr_t stack_limit to a huge value, causing every
   js_check_stack_overflow to return true. ... */
```

Plausible: the new lld places the shadow stack differently, or the
default `stack_size=0` no longer reads as "unlimited" with the new
toolchain, and every QuickJS stack check now returns true, producing
the overflow on the first non-trivial frame.

## What this branch contributes anyway

The crypto bridge is reviewable as code:

- `examples/libs/quickjs/qjs-crypto-bridge.c` (~370 LoC) — EVP digest +
  HMAC + RAND_bytes wrapped as a `qjs:crypto-bridge` ESM module.
- `examples/libs/quickjs/node-main.c` — registers the bridge and stashes
  the exports onto `globalThis.__cryptoBridge` (per-context init), so
  `bootstrap.js` can read them synchronously. The original
  top-level `await import('qjs:crypto-bridge')` approach overflowed
  QuickJS's stack at bytecode-eval time (independent of the cherry-pick
  issue above; reproduced before applying #5+#7); the global
  indirection was the right shape regardless.
- `examples/libs/quickjs/build-quickjs.sh` — links libssl + libcrypto
  resolved via `xtask build-deps resolve openssl`, with libssl staged
  ahead of libcrypto so the link line is stable for Phase C's
  `qjs-tls.c` bridge addition.
- `examples/libs/quickjs/node-compat/bootstrap.js` — `crypto` module
  wraps the bridge with Node-style chaining, Buffer-typed digest output,
  `randomUUID` v4 from CSPRNG, `timingSafeEqual`, with a feature-flag
  fallback to the legacy weak impl so `qjs.wasm` (no libcrypto link)
  still boots.
- `host/test/node-compat.test.ts` — 8 vitest cases: SHA-256 RFC 6234
  vector, SHA-1 FIPS 180-1 vector, chained `update`, RFC 4231
  HMAC-SHA-256 case 4, UUID v4 shape regex, `randomBytes` length,
  Buffer-typed digest, `timingSafeEqual` ±.

## Path forward — three options

**Option A. Investigate the stack overflow on this branch.** Treat the
combined #5+#7+Phase-B state as the integration test. Pull
`crates/kernel/src/wasm_api.rs` and `host/src/worker-main.ts` into a
debug session, log shadow-stack base + `__stack_pointer` global at
context-create time, and find where the wraparound happens. ETA: a
couple of focused hours assuming the hypothesis is correct.

**Option B. Wait for #5+#7 to settle on `mho22/main`.** Both PRs are
draft-stacked with conflicts vs upstream. When they reach a stable
mergeable state — or are merged into `wasm-posix-kernel/main` —
re-cherry-pick onto this Phase B branch and re-run the gauntlet.

**Option C. Continue building Phase B/C/D/E surface area without test
verification.** The `tty.setRawMode`, `child_process.spawn`,
`worker_threads`, `qjs-tls.c`, `claude-code` package, and `rg.wasm`
work all stack on top of an already-broken-at-startup `node.wasm`. This
is the lowest-trust path; defects ride along undetected until A or B
unblocks the test loop.

The user's directive "we will get rid of merge conflicts later"
suggests A or B; not C. Recommendation: **option A** — diagnose the
stack overflow root cause as the next concrete unit of work, then
resume Phase B with verification possible. Option A is *not* part of
the Claude Code initiative — it's a runtime regression in the toolchain
unpin — and is properly a follow-up to PR #7 itself, not Phase B.

## Files that demonstrate the discovery

- `host/test/node-compat.test.ts` — temporarily had a `DEBUG stderr` log
  block that printed `Maximum call stack size exceeded`, removed before
  commit. Test-helper itself captures stderr via `runCentralizedProgram`,
  so the failure mode is permanently observable by setting a breakpoint
  or reading `result.stderr` on a failed assertion.
- The bisect on `bootstrap.js`: revert to base, fail. Disable bridge
  call, fail. Drop libssl from link, fail. Establishes the failure is
  upstream of this branch's content.

## What stays committed

The cherry-picks (`a6b736c8`, `50089570`, `5a27ac20`) and the crypto
bridge commit (`3729f6fe`) plus this discovery doc. The Phase B PR
description gets updated to point at this doc as the verification gate.
