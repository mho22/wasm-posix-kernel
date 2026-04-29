# Go (`GOOS=wasip1`) on the kernel — Phase 1 Scope Finding

Date: 2026-04-29
Branch: `emdash/explore-go-wasm-shim-export-memory`
Companion to: [`2026-04-29-go-wasm-design.md`](./2026-04-29-go-wasm-design.md), [`2026-04-29-go-wasm-plan.md`](./2026-04-29-go-wasm-plan.md), [`2026-04-29-go-wasm-phase0-verification.md`](./2026-04-29-go-wasm-phase0-verification.md)

## §1. Summary

The plan's Phase 1 description ("relax WASI shim memory constraint, ~30 LoC") was correct in spirit but underestimated the work. The shim's existing implementation does not cleanly distinguish *channel memory* (the shared-SAB scratch area used to dispatch syscalls and ferry small structs to/from the kernel) from *user memory* (where user-program-supplied pointers live). For C programs that import `env.memory`, both are the same `WebAssembly.Memory`, so the existing `this.memory.buffer` references work in both roles. For Go programs that export their own memory, the two memories are different, and the existing shim is incorrect across **all 45 import handlers**, not just the worker-main rejection at `worker-main.ts:540`.

This document records the finding, classifies the affected sites, and proposes an updated Phase 1 scope. It does not modify any code; it captures what the next implementation pass needs to do.

## §2. The actual problem

Three categories of memory access exist inside `WasiShim`:

**A. Channel-only access.** `doSyscall` writes the syscall number and 6 i64 args at `channelOffset + CH_*` and reads the return value / errno from the same area. These addresses live in the shared-SAB memory the kernel and worker share. **Always channel.**

```ts
// host/src/wasi-shim.ts:441–472 (doSyscall body)
const view = new DataView(this.memory.buffer);
view.setInt32(base + CH_SYSCALL, syscallNum, true);
view.setBigInt64(base + CH_ARGS + 0 * CH_ARG_SIZE, BigInt(a0), true);
// ...
const i32 = new Int32Array(this.memory.buffer);
Atomics.store(i32, statusIdx, CH_PENDING);  // SAB-only
Atomics.notify(i32, statusIdx, 1);
```

**B. User-pointer access (no syscall, or after syscall).** Imports like `args_get`, `environ_get`, `fd_prestat_dir_name`, `clock_time_get` (writing `timeOut`), `fd_fdstat_get` (writing `fdstatPtr`), `random_get` (writing `buf`), and many others write structs to a user-supplied pointer. **Always user memory.**

```ts
// host/src/wasi-shim.ts:613–625 (args_get, no syscall)
const view = new DataView(this.memory.buffer);
const mem = new Uint8Array(this.memory.buffer);
let bufOffset = argvBuf;
for (let i = 0; i < this.argv.length; i++) {
  view.setUint32(argvPtrs + i * 4, bufOffset, true);
  // ...
  mem.set(encoded, bufOffset);
}
// argvPtrs and argvBuf are user pointers; this.memory must be userMemory here.
```

**C. Hybrid: marshal user data through the channel data area, then call the kernel.** Imports like `fd_write`, `fd_read`, `path_open`, `path_filestat_get`, `fd_readdir`, `poll_oneoff`, `sock_send`, `sock_recv` take user-pointer arguments that the **kernel** dereferences. The kernel only knows about shared memory, so the shim must:

1. Read user data from `userMemory` at the user pointer.
2. Copy it into `channelMemory` at `channelOffset + CH_DATA + offset`.
3. Pass the channel-area address to the kernel as the syscall argument.
4. After the syscall returns, if the kernel wrote back into the channel data area, copy the result into `userMemory` at the user's output pointer.

For example, `fd_write(fd, iovsPtr, iovsLen, nwrittenOut)`:
- `iovsPtr` is a Go-memory pointer to an array of `(iov_base, iov_len)` pairs where each `iov_base` is itself a Go-memory pointer.
- The current shim calls `doSyscall(SYS_WRITEV, fd, iovsPtr, iovsLen)` — passing the Go-memory pointer to the kernel. **The kernel cannot dereference Go's memory.**
- Correct behavior: shim reads each iovec from `userMemory`, copies the referenced bytes into the channel data area, builds a fresh iovec array in the channel data area pointing at the copied bytes, and calls `SYS_WRITEV` with the channel-area iovec address.

This is the **same pattern** the shim already implements for `sock_send` (lines 1409–1432) and `sock_recv` (lines 1373–1407), where the data flows through `this.dataArea` between user iovecs and the syscall. Those two methods accidentally do the right thing for Go *if* `this.memory` for the user-pointer reads were `userMemory` — but they currently aren't, because everything aliases to a single `this.memory`.

## §3. Affected sites — classification

By skim of `host/src/wasi-shim.ts` (46 occurrences of `this.memory.buffer`):

| Line range | Method | Access | Needs `userMemory`? | Marshal user data through channel? |
|---|---|---|---|---|
| 419–432 | `init` (open `/`) | A + write to channel data area | n/a (channel only) | n/a |
| 441–472 | `doSyscall` | A | no | no |
| 480–518 | string helpers (`writeStringToData`, `resolvePath`) | mixed: read user path, write to channel data area | **yes** for read | yes (already partially done; uses `this.dataArea` for write) |
| 527 (translateStat) | B | yes | no |
| 613–625 | `args_get` | B | yes | no |
| 627–636 | `args_sizes_get` | B | yes | no |
| 638–649 | `environ_get` | B | yes | no |
| 652–660 | `environ_sizes_get` | B | yes | no |
| 665–671 | `fd_prestat_get` | B | yes | no |
| 674–681 | `fd_prestat_dir_name` | B | yes | no |
| 692–700 | `fd_read` | C — user iovec | yes | **yes** |
| 702–708 | `fd_write` | C — user iovec | yes | **yes** |
| 710–746 | `fd_pread`/`fd_pwrite` | C | yes | yes |
| 774–793 | `fd_seek`/`fd_tell` | B (write `newOffsetOut`) | yes | no |
| 805–826 | `fd_fdstat_get` | mixed: syscall scratch in channel, then write user `fdstatPtr` | **yes** for write | no (scratch is already in channel) |
| 841–846 | `fd_filestat_get` | mixed | yes for write | no |
| 853–898 | `fd_filestat_set_times` | A (timespec in channel data area, no user mem) | no | n/a |
| 911–985 | `fd_readdir` | C — kernel writes Linux dirent into channel; shim copies into user `buf` | **yes** for `buf` writes | yes |
| 1006–1085 | `path_*` | mixed: user path → channel via `resolvePath`; channel-area → kernel | yes for path read | yes (already partially done) |
| 1087–1124 | `path_open` | C + write user `fdOut` | yes for `fdOut` | yes (already done for path) |
| 1126–1175 | `path_filestat_*` | mixed | yes | yes |
| 1179–1207 | `random_get`, `clock_time_get` | C — kernel writes to channel scratch, copy to user | **yes** for user buffer write | yes |
| 1220–1236 | `proc_exit`, `proc_raise`, `sched_yield` | A | no | no |
| 1240–1369 | `poll_oneoff` | C — read subscriptions from user, write events to user, marshal pollfds in channel | **yes** for both | yes (already partially marshals pollfds in `this.dataArea`) |
| 1371–1443 | `sock_*` | C (correctly marshalled today through `this.dataArea`, but reads/writes user mem via `this.memory` which becomes wrong) | **yes** | already does marshalling pattern |

**Counts:**

- **0 sites** are pure-channel only (`doSyscall`, `proc_exit`, etc. are in §A but don't even touch `this.memory.buffer`).
- **~14 sites** are pure user-memory (§B): args/env/prestat/seek/fstat-write/fdstat-write/random-write/clock-write etc. These need `this.memory` → `this.userMemory` only.
- **~10 sites** are hybrid (§C) with user-pointer args that the kernel dereferences. These need both:
  - User reads/writes via `this.userMemory`
  - **New marshalling code** that copies user data into `this.dataArea` before the syscall and copies back after.

The ~10 hybrid sites (`fd_read`, `fd_write`, `fd_pread`, `fd_pwrite`, `fd_readdir`, `path_open`, `path_filestat_get`, `path_filestat_set_times`, `random_get`, `poll_oneoff`) are where Phase 1's real work concentrates. **Most of them already use `this.dataArea` as a scratch area today**, but they pass user-supplied pointers (e.g., `iovsPtr`) directly to the kernel rather than marshalling the data the user pointer references. For C programs both paths happen to work because all pointers refer to addresses inside the same shared memory; for Go they fork.

## §4. Concrete example — `fd_write`

Today (incorrect for Go):

```ts
fd_write(fd, iovsPtr, iovsLen, nwrittenOut) {
  const { result, errno } = this.doSyscall(SYS_WRITEV, fd, iovsPtr, iovsLen);
  // ↑ kernel reads iovec at `iovsPtr` IN SHARED MEMORY. For Go: undefined data.
  if (errno) return translateLinuxErrno(errno);
  const view = new DataView(this.memory.buffer);
  view.setUint32(nwrittenOut, result, true);
  // ↑ writes to shared memory; for Go, nwrittenOut is in Go memory — silent miss.
  return WASI_ESUCCESS;
}
```

Correct shape (works for both C and Go):

```ts
fd_write(fd, iovsPtr, iovsLen, nwrittenOut) {
  // Read iovec entries from user memory.
  const uView = new DataView(this.userMemory.buffer);
  const uMem  = new Uint8Array(this.userMemory.buffer);

  // Build a fresh iovec array + concatenated data in channel data area.
  const cView = new DataView(this.channelMemory.buffer);
  const cMem  = new Uint8Array(this.channelMemory.buffer);
  const ivecArr = this.dataArea;
  let dataPtr  = ivecArr + iovsLen * 8;

  for (let i = 0; i < iovsLen; i++) {
    const userBase = uView.getUint32(iovsPtr + i * 8 + 0, true);
    const userLen  = uView.getUint32(iovsPtr + i * 8 + 4, true);
    if (dataPtr + userLen > this.dataArea + CH_DATA_SIZE) break; // truncate
    cMem.set(uMem.subarray(userBase, userBase + userLen), dataPtr);
    cView.setUint32(ivecArr + i * 8 + 0, dataPtr, true);
    cView.setUint32(ivecArr + i * 8 + 4, userLen,  true);
    dataPtr += userLen;
  }

  const { result, errno } = this.doSyscall(SYS_WRITEV, fd, ivecArr, iovsLen);
  if (errno) return translateLinuxErrno(errno);

  // Write nwrittenOut into USER memory.
  new DataView(this.userMemory.buffer).setUint32(nwrittenOut, result, true);
  return WASI_ESUCCESS;
}
```

For C programs (`userMemory === channelMemory`) this is logically identical to today — same data ends up in the same iovec area, with one extra copy that's negligible at hello-world sizes. A small fast-path for the identical-memory case can avoid that copy entirely:

```ts
if (this.userMemory === this.channelMemory) {
  const { result, errno } = this.doSyscall(SYS_WRITEV, fd, iovsPtr, iovsLen);
  // ... existing fast path
  return ...;
}
// else: marshalling path above
```

## §5. Updated Phase 1 scope

The plan's Phase 1 description (`feat(wasi): allow WASI modules with exported memory`) becomes a substantively bigger refactor. Two options:

**Option 1 — One big Phase 1 PR.**

- Memory split: rename `private memory` → `private channelMemory`; add `private userMemory: WebAssembly.Memory` defaulting to `channelMemory`; add `bindUserMemory(mem)` setter.
- Audit every `this.memory.buffer` access against the §3 table; replace with `this.channelMemory.buffer` or `this.userMemory.buffer`.
- For each §C site, implement marshalling: copy user data to `this.dataArea` before syscall, copy results back to user memory after.
- Fast-path: when `userMemory === channelMemory`, skip the copy.
- `worker-main.ts:540` change: drop the `wasiModuleDefinesMemory` rejection; after instantiation, if module exports memory, call `wasiShim.bindUserMemory(instance.exports.memory)`.
- Tests: existing two cases (imported memory) keep passing under the fast path. New fixture `wasi-export-memory.wat` defines+exports memory and writes via `fd_write` — verifies the marshalling path.

Estimate: ~300–500 LoC of TypeScript change, all in `host/src/wasi-shim.ts` + a few lines in `worker-main.ts`. Fully unblocks Phases 2–6.

**Option 2 — Phased shim refactor.**

- Phase 1a: memory split + the §B sites (no marshalling, no syscalls). Adds `bindUserMemory`. Existing tests continue to pass; new export-memory test only validates `args_get`.
- Phase 1b: marshalling for `fd_write` (sufficient for Go hello-world).
- Phase 1c: marshalling for `fd_read`, `path_open`, `random_get`, `clock_time_get`, `poll_oneoff` (sufficient for Go file I/O + goroutines + time).
- Phase 1d: marshalling for `fd_readdir`, `path_filestat_*`, `fd_pread`/`fd_pwrite` (sufficient for Go dirwalk).
- Phase 1e: marshalling for `sock_*` (preempts the v2 networking design).

Estimate: ~5 PRs, 50–150 LoC each. More review-friendly but slower in calendar time.

**Recommendation: Option 1.** The change is structurally a single refactor — splitting one memory reference into two — and a parallel pattern (the marshalling) applied to ~10 sites. Splitting it into 5 PRs adds review overhead without reducing per-PR complexity (each marshalling site is mostly independent and could be reviewed inline in one big PR). Brandon's recent style (cf. PR #205 itself, which added the entire shim in one shot) supports the bigger-PR call.

## §6. Why this finding wasn't caught in Phase 0

Phase 0's verification ran `wasm-objdump` on `hi.wasm` and checked the imports and memory configuration. That established the surface gap (memory exported, not imported) but did not run a Go binary against the shim. Doing so would have required Phase 1 already.

The original design's "30 LoC memory rebind" assumption was based on reading `WasiShim`'s class structure and noting that `this.memory` was a single field. Once you actually look at the import handler bodies — every one of them rebuilds `new DataView(this.memory.buffer)` — the bug is obvious: every handler's "is this user or channel memory" decision was effectively delegated to "whatever `this.memory` happens to be." Those decisions have to be made explicitly.

This is the kind of finding Phase 0 was meant to surface. It surfaced; the cost is one more iteration before code lands.

## §7. Decision

Update the plan's Phase 1 entry to reference Option 1 above. Subsequent phases (2–7) are unchanged.

The Phase 1 PR replacing the original "30 LoC" sketch should:

- [ ] Land memory split: `channelMemory` + `userMemory`, default-aliased, with `bindUserMemory` setter.
- [ ] Audit all 46 `this.memory.buffer` sites; replace per §3 classification.
- [ ] Implement marshalling for the ~10 §C sites.
- [ ] `worker-main.ts:540` removal; bind user memory after instantiation.
- [ ] One new test fixture (`wasi-export-memory.wat`) exercising the marshalling path on `fd_write`.
- [ ] Existing `wasi-shim.test.ts` cases (imported memory) keep passing.
- [ ] Verification gauntlet on every PR.

This work is the gating prerequisite for Phase 2 (`feat(go): port skeleton — wasm32posix-go SDK wrapper + hello world`). Without it, even hello-world cannot run.

## §8. Status

This branch (`emdash/explore-go-wasm-shim-export-memory`) currently contains only this finding doc. The actual shim refactor is not yet implemented; the next session should pick it up using §3 as the audit checklist and §4 as the marshalling template.
