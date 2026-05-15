# Go (`GOOS=wasip1`) on the wasm-posix-kernel — Design

Date: 2026-04-29
Branch: `emdash/explore-go-wasm-ism77`
Worktree: `emdash/worktrees/kandelo/wasm-posix-kernel/emdash/explore-go-wasm-ism77/`

## §1. Goals & non-goals

**Goal.** Run programs written in Go on the kernel, using the **stock upstream Go toolchain** (`GOOS=wasip1 GOARCH=wasm`), with no fork of the Go compiler or runtime. Output binaries are real `.wasm` files that import `wasi_snapshot_preview1` and run inside a regular kernel process worker, alongside CPython, PHP, Ruby, Erlang, etc.

Success criteria, in order:

1. `go.wasm hello` — a hello-world Go program prints to stdout, exits 0, observed in the existing centralized-program test harness.
2. `go.wasm fileio` — a Go program does `os.Open` / `os.ReadFile` / `os.WriteFile` against the kernel VFS; round-trips bytes; sees correct `os.Stat` results.
3. `go.wasm goroutines` — a Go program spawns 100 goroutines, joins them via `sync.WaitGroup`, prints aggregate work; verifies the cooperative scheduler runs end-to-end inside our process.
4. `go.wasm dirwalk` — a Go program does `filepath.WalkDir` over a populated VFS subtree; lists entries, types, sizes match what `dash`/`ls` would print.
5. `go.wasm time` — `time.Now()` advances monotonically across `time.Sleep(10 * time.Millisecond)`; `time.Since(...)` returns sane durations.
6. A reproducible build artifact at `examples/libs/go/`, a `deps.toml`, a `build-go.sh`, and integration tests under `host/test/` that run on every CI.

**Non-goals (v1).**

- **Networking from Go (`net.Dial`, `net.Listen`, `net/http`).** Go's `wasip1` runtime returns `ENOSYS` from `net.Dial` regardless of the host because the WASI snapshot does not expose `socket()`/`connect()`. Reaching the kernel's existing AF_INET stack from Go means either patching the Go runtime or shipping a `go:wasmimport`-based extension package (cf. `dispatchrun/net`, `stealthrocket/net`). Defer to v2.
- **`os/exec` / `syscall.ForkExec` from Go.** Same constraint — Go's wasip1 returns `ENOSYS` for fork-style calls; the runtime never calls our kernel's `fork()`/`exec()` syscalls. A Go program cannot start a subprocess on the kernel in v1. (The kernel can still start *the Go program itself* normally — what's missing is Go *itself* calling fork.)
- **`runtime.LockOSThread` / true OS threads.** Go's wasip1 runtime is single-threaded; goroutines are cooperatively scheduled inside one wasm instance. No `clone()` is invoked; the kernel's pthread/clone subsystem is irrelevant from Go.
- **CGo.** `CGO_ENABLED=0` is forced for `wasip1`; the toolchain does not know how to invoke a wasm32 C cross-compiler from Go's cgo driver. No path to call into our musl sysroot or the `channel_syscall.c` glue from Go code.
- **TinyGo.** A separate, smaller-scope effort. TinyGo's wasi target works on the same shim but its stdlib subset, GC model, and binary layout diverge enough to warrant its own design.
- **Building Go itself for wasm.** Go is bootstrapped on the host (a host Go binary cross-compiles to `wasip1`). We do **not** compile the Go compiler to wasm; that is wasted work for v1 and adds no capability. The host Go toolchain is a build-time dependency, like the host Python or host Erlang used by other ports.
- **`GOOS=wasip2` / `GOOS=wasip3`.** Go does not yet ship a native `wasip2` port (component-model adapter only); `wasip3` is a January-2026 proposal (golang/go#77141), not released. Track upstream and re-evaluate when one of them lands.
- **Ship a VFS image preloaded with Go programs / stdlib.** Go binaries are statically linked — there is no Go stdlib on disk to ship. A v2 demo can pre-bake user binaries into a `.vfs`; not in scope here.

**Constraint.** Keep the kernel sandbox load-bearing. No "external host Go process" shortcut. Every Go execution path stays inside the kernel/VFS/syscall boundary — the existing WASI shim is exactly that boundary, and we use it as-is.

## §2. Why this approach, not the others

Three paths were on the table.

**Path A — Custom Go port (`GOOS=emdash GOARCH=wasm`).** Add a new GOOS to the Go runtime that emits our channel-syscall ABI directly via `go:wasmimport` instead of WASI imports. Mechanical (~3–5 KLoC of Go in `src/runtime`, `src/syscall`, `src/internal/poll`, `src/os` mirroring the wasip1 files) but heavy: forks the Go runtime, must be maintained against every Go release forever. **Rejected.** Go's wasm runtime is single-threaded regardless of the host's threading model, so a custom port buys no concurrency. The `fork()`/`clone()`/`exec()` features of our kernel that would justify a custom port are unreachable from Go's runtime model — Go never calls them, even on Linux it uses `clone(CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SIGHAND | CLONE_THREAD)` for goroutine M's, not the POSIX `fork()`. The cost is high and the benefit is zero.

**Path B — TinyGo only.** Cross-compile with TinyGo, target `wasi`, accept the stdlib subset. **Rejected as v1.** TinyGo is the right tool for plugins and embedded targets; it is the wrong tool for "run real Go programs that depend on the standard library." Most of the interesting Go ecosystem (caddy, hugo, gopls, kubectl) uses stdlib features TinyGo does not implement. v1 should target the gc compiler so the bar is "any pure-Go program from the ecosystem"; TinyGo can be a v3 follow-up that reuses the same WASI shim.

**Path C (this design) — Stock Go `GOOS=wasip1` on the existing WASI shim.** Use the upstream `go` tool with `GOOS=wasip1 GOARCH=wasm`. The output is a `.wasm` whose only import namespace is `wasi_snapshot_preview1`. Our kernel **already has a WASI Preview 1 shim** in `host/src/wasi-shim.ts` (PR #205, merged 2026-04-09; ~1471 lines, ~45 imports translated to channel syscalls). Worker process detection at `host/src/worker-main.ts:539` already routes WASI modules through the shim. **The bridge is integration: build a Go binary, feed it to the existing shim, fix any gaps Go exercises that the existing tests don't.**

The choice is forced by the cost ratio. Path A is a fork. Path B is an ecosystem subset. Path C reuses 1471 lines of already-merged, already-tested code. The risk in Path C is concentrated in a narrow, testable surface: the imports Go calls that the existing two `.wat` fixtures do not.

## §3. Prior art — what's in the tree today

### §3.1 WASI shim (PR #205, merged 2026-04-09)

`host/src/wasi-shim.ts` — `WasiShim` class translates `wasi_snapshot_preview1` calls into channel syscalls (the exact same channel ABI used by all other user processes). Verified set of imports it provides (from `WasiShim.getImports()` at `host/src/wasi-shim.ts:560–608`):

| Group | Imports |
|---|---|
| Args/env | `args_get`, `args_sizes_get`, `environ_get`, `environ_sizes_get` |
| Preopens | `fd_prestat_get`, `fd_prestat_dir_name` |
| File ops | `fd_close`, `fd_read`, `fd_write`, `fd_pread`, `fd_pwrite`, `fd_seek`, `fd_tell`, `fd_sync`, `fd_datasync`, `fd_fdstat_get`, `fd_fdstat_set_flags`, `fd_fdstat_set_rights`, `fd_filestat_get`, `fd_filestat_set_size`, `fd_filestat_set_times`, `fd_allocate`, `fd_advise`, `fd_readdir`, `fd_renumber` |
| Path ops | `path_create_directory`, `path_unlink_file`, `path_remove_directory`, `path_rename`, `path_symlink`, `path_readlink`, `path_link`, `path_open`, `path_filestat_get`, `path_filestat_set_times` |
| System | `random_get`, `clock_time_get`, `clock_res_get`, `proc_exit`, `proc_raise`, `poll_oneoff` |
| Sockets (stubs) | `sock_recv`, `sock_send`, `sock_shutdown`, `sock_accept` |

The shim translates struct layouts (WASI `filestat` ↔ kernel `WasmStat`), errno values (Linux ↔ WASI), and oflags/whence enumerations. Stdio (fds 0/1/2) and one preopen (`/`) are wired up at `WasiShim.init()`.

### §3.2 Worker integration (`host/src/worker-main.ts:539`)

`centralizedWorkerMain` already branches on `isWasiModule(module)`:

```ts
if (isWasiModule(module)) {
  const wasiShim = new WasiShim(memory, channelOffset, argv, env);
  const wasiImports = wasiShim.getImports();
  const importObject = {
    wasi_snapshot_preview1: wasiImports,
    env: { memory },
  };
  const instance = await WebAssembly.instantiate(module, importObject);
  wasiShim.init();
  port.postMessage({ type: "ready", pid });
  const start = instance.exports._start as (() => void) | undefined;
  if (start) start();
  port.postMessage({ type: "exit", pid, status: exitCode });
}
```

The worker already postMessages `ready`/`exit` to the host correctly, catches `WasiExit`, and stubs unimplemented `env` imports. Go binaries do not import anything outside `wasi_snapshot_preview1` (and an imported memory), so they fall straight through this path.

### §3.3 Existing tests (`host/test/wasi-shim.test.ts`)

Two cases, both passing as of `a13a6879`:

- `hello world via fd_write` — fixture `wasi-hello.wasm` (hand-written WAT) → expects `"Hello from WASI\n"` on stdout.
- `args_get passes argv to the program` — fixture `wasi-args.wasm` → echoes `argv[1]`.

These exercise `fd_write`, `args_get`, `args_sizes_get`, `proc_exit` — the smallest possible WASI surface. Real Go programs exercise far more (`clock_time_get`, `random_get`, `fd_fdstat_get`, `path_open`, `fd_readdir`, `poll_oneoff`, plus many fd-introspection calls during runtime startup). The shim *implements* all of them; the question is whether the implementations are correct under Go's specific call patterns. See §4.

### §3.4 Constraint inherited from the shim

The shim assumes the user module **imports** memory (`--import-memory`). Modules that define their own memory are rejected at `worker-main.ts:540`. Stock Go's `wasip1` linker emits a module that **defines and exports** memory (`(memory (export "memory") ...)`). **This is the first concrete gap the design must address.** See §5.2.

## §4. Gap analysis — Go's wasip1 imports vs. the shim

Go's `wasip1` runtime calls a fixed subset of WASI imports, encoded in `src/runtime/os_wasip1.go`, `src/syscall/fs_wasip1.go`, `src/internal/poll/fd_wasip1.go`, `src/runtime/timestub.go`, and `src/runtime/rand_wasip1.go`.

| Go runtime call | WASI import | Shim status | Risk |
|---|---|---|---|
| `runtime.walltime` | `clock_time_get(REALTIME)` | implemented | low — straightforward `clock_gettime` translation |
| `runtime.nanotime` | `clock_time_get(MONOTONIC)` | implemented | low |
| `runtime.usleep` | `poll_oneoff` (one timeout subscription) | implemented | medium — Go calls this on every scheduler tick that has no work; needs to be cheap |
| `runtime.getRandomData` | `random_get` | implemented | low |
| `print` / `os.Stderr.Write` | `fd_write` | implemented | low — covered by hello-world test |
| `os.Open` (read) | `path_open(O_RDONLY)` then `fd_read` | implemented | low — covered conceptually, untested with Go |
| `os.Create` / `os.WriteFile` | `path_open(O_WRONLY \| O_CREAT \| O_TRUNC)` then `fd_write` | implemented | medium — Go-specific oflags combinations |
| `os.Stat` / `os.Lstat` | `path_filestat_get` | implemented | medium — filestat layout (64-bit ino/size, file_type enum) must match Go's `syscall.Stat_t` for wasip1, which has its own fixed layout |
| `os.ReadDir` | `fd_readdir` | implemented | **high** — directory enumeration is the most fragile WASI call. Go iterates with a cookie and expects the host to return entries in a specific dirent layout (24-byte header + name). Hand-rolled fixtures don't exercise this; Go does, on every directory walk. |
| `os.Remove` | `path_unlink_file` / `path_remove_directory` | implemented | low |
| `os.Mkdir` | `path_create_directory` | implemented | low |
| `os.Rename` | `path_rename` | implemented | low |
| `os.Symlink` / `os.Readlink` | `path_symlink` / `path_readlink` | implemented | low |
| `os.Chtimes` | `path_filestat_set_times` | implemented | medium — fstflags bitmap |
| `time.Sleep` | `poll_oneoff` (single CLOCK subscription) | implemented | low — same path as `runtime.usleep` |
| `os.Args` / `os.Environ` | `args_get` / `environ_get` | implemented | low — covered by args test |
| `os.Exit` | `proc_exit` | implemented | low |
| panic / `runtime.throw` | `proc_exit(non-zero)` | implemented | low |
| internal/poll readiness | `poll_oneoff` (multiple subscriptions, FD_READ/FD_WRITE) | implemented | **medium** — for stdin pipes / reading from regular files when not in non-blocking mode. The current shim's `poll_oneoff` was written for the args/hello fixtures, which never poll an fd. |

**Imports Go calls that the shim does not implement:** none expected. Go does not call `sock_*` from pure-stdlib programs (it's wired through `internal/poll`'s wasip1 stub, which returns `ENOSYS` to `net.Dial` directly without ever going to the host). All other 41 imports the shim provides cover Go's runtime needs.

**Imports the shim implements that Go never calls:** `fd_renumber`, `fd_advise`, `path_link`, `proc_raise`, `sock_*`. Dead code from Go's perspective; harmless.

The two **highest risk** items, ranked by how often they're called and how rarely they're tested:

1. **`fd_readdir`.** Any Go program touching a directory. Layout error → silent corruption (Go re-uses the buffer, so a wrong size leaks into the next entry).
2. **`poll_oneoff` with multiple subscriptions and CLOCK + FD subscriptions mixed.** Any Go program doing any I/O against a pipe or non-regular file. Wrong subscription parsing → infinite hang.

The plan in §6 phases these two as their own validation steps with focused test programs.

## §5. Design

### §5.1 Architecture

```
   ┌─ Go user program (compiled GOOS=wasip1 GOARCH=wasm) ──┐
   │ println("hi"); os.ReadDir("/etc"); time.Sleep(10ms)  │
   │   ↓ imports wasi_snapshot_preview1.{...}             │
   └──────┬───────────────────────────────────────────────┘
          │ resolved by the host
   ┌──────▼───────────────────────────────────────────────┐
   │ centralizedWorkerMain (host/src/worker-main.ts)      │
   │ if (isWasiModule(module)) {                          │
   │   wasiShim = new WasiShim(memory, channelOffset,...) │
   │   instantiate(module, { wasi_snapshot_preview1: ...,│
   │                         env: { memory } })           │
   │   wasiShim.init(); _start();                         │
   │ }                                                    │
   └──────┬───────────────────────────────────────────────┘
          │ wasiShim methods marshall and call
   ┌──────▼───────────────────────────────────────────────┐
   │ WasiShim (host/src/wasi-shim.ts)                     │
   │ fd_write → SYS_WRITEV     path_open → SYS_OPENAT     │
   │ fd_read  → SYS_READV      fd_readdir → SYS_GETDENTS64│
   │ poll_oneoff → SYS_POLL    clock_time_get → SYS_CLOCK_GETTIME│
   │ random_get → SYS_GETRANDOM   proc_exit → SYS_EXIT    │
   │  …all 45 imports defined and translated…             │
   └──────┬───────────────────────────────────────────────┘
          │ channel syscall via SAB+Atomics
   ┌──────▼───────────────────────────────────────────────┐
   │ kernel (existing): VFS, processes, signals, devices  │
   └──────────────────────────────────────────────────────┘
```

No new component is added on the data path. The Go program is just another user program; the WASI shim is just another importer of the kernel channel.

### §5.2 The one structural blocker — imported memory

The shim demands modules **import** memory. Stock Go's wasip1 linker emits a module that **exports** memory. Three options:

- **Option 1 — patch the binary post-link with `wasm-tools`.** Strip the local memory and rewrite to import. Cheap, mechanical, but introduces a build-step dependency on `wasm-tools` and a per-binary postprocess. (This is the standard trick used by `wasi-libc` for Go wasm components.)
- **Option 2 — relax the shim to also accept exported memory.** When the module exports memory, instantiate without an env memory, then read the export and re-bind the shim to that memory (the shim uses `memory` only for buffer reads/writes, not for sharing with another worker on the data path). Touches `WasiShim` constructor + `worker-main.ts:540`.
- **Option 3 — write a thin `wat`-level wrapper.** A wrapper module that imports memory and re-exports the Go module's `_start`. Defeats the build pipeline goal of "stock Go produces a runnable artifact."

**Choice: Option 2.** The shim has no architectural reason to require imported memory — that was a leftover assumption from the original C-program use case (where `--import-memory` is the SDK default for sharing with multi-process workers). Go programs are single-instance, and the shim never shares memory across workers on the WASI path. Relaxing the constraint is ~30 lines of TypeScript and avoids a permanent post-link rewrite step. Document the relaxation; it costs nothing for the existing C-program path because their modules already import memory.

A side note: if we ever want **multi-process Go on the kernel** (multiple Go programs running concurrently, each in its own worker), Option 2 is also the right answer because each Go instance would have its own memory anyway — we never want to share Go's heap across processes (it would corrupt Go's GC state).

### §5.3 SDK wrapper — `wasm32posix-go`

Add `sdk/bin/wasm32posix-go` (and a TS counterpart `sdk/src/bin/go.ts`) — a thin wrapper that:

- Locates the host Go toolchain (env var `GOROOT`, then `which go`, then `$WORKTREE/sdk/go/bin/go`).
- Exports `GOOS=wasip1 GOARCH=wasm CGO_ENABLED=0`.
- Forwards arguments to `go build`, `go test`, `go run`.
- Inserts a `--ldflags="-s -w"` default for binary-size hygiene (override-able).

This mirrors `wasm32posix-cc` / `wasm32posix-c++`. A user's `build-go.sh` invokes `wasm32posix-go build -o hello.wasm hello.go` and gets a kernel-runnable artifact.

The wrapper does **not** post-process the binary — Option 2 in §5.2 makes that unnecessary. Stock Go output is the artifact.

### §5.4 Port skeleton — `examples/libs/go/`

Mirror the layout of `examples/libs/cpython/` and `examples/libs/perl/`:

```
examples/libs/go/
├── deps.toml              # name=go, kind=program, version=1.24.x, no depends_on
├── build-go.sh            # downloads host Go if needed; cross-compiles the example programs
├── programs/              # canonical example sources
│   ├── hello/main.go
│   ├── fileio/main.go
│   ├── goroutines/main.go
│   ├── dirwalk/main.go
│   └── time/main.go
└── README.md              # one-pager: what works, what doesn't, how to run
```

`deps.toml` records the Go upstream version (e.g. `1.24.2`) and source URL of the host toolchain tarball. The artifact this port produces is **not** a single `.wasm`; it is a directory of compiled example programs. The `[[outputs]]` table lists each:

```toml
kind = "program"
name = "go"
version = "1.24.2"

[source]
url = "https://go.dev/dl/go1.24.2.darwin-arm64.tar.gz"  # (per-host, see build script)
sha256 = "..."

[[outputs]]
name = "go-hello"
wasm = "go-hello.wasm"

[[outputs]]
name = "go-fileio"
wasm = "go-fileio.wasm"
# ...
```

Pre-built archives are published to `binaries-abi-v6-2026-04-29` per the existing pattern.

### §5.5 Build script (`build-go.sh`)

Two-stage, like the other language ports:

1. **Acquire host Go.** If `GOROOT` is unset and `go` is not on PATH, download a release tarball matching the host (`darwin-arm64`, `linux-amd64`) into `sdk/go/`. Verify sha256. Add `sdk/go/bin/` to PATH. (`sdk/activate.sh` is the existing pattern.)
2. **Cross-compile each example.**
   ```bash
   for prog in hello fileio goroutines dirwalk time; do
     GOOS=wasip1 GOARCH=wasm CGO_ENABLED=0 \
       "$GO" build -ldflags="-s -w" \
       -o "$OUT/go-${prog}.wasm" "./programs/${prog}"
   done
   ```

No `configure`, no `config.site`, no autoconf cache. Go has its own build system. This is the simplest port in the tree by a wide margin.

### §5.6 Tests

Add `host/test/go-wasip1.test.ts`. One `describe("Go wasip1")` block, one `it` per example program, each invoking `runCentralizedProgram({ programPath: "examples/libs/go/go-hello.wasm", argv: [...], env: [...] })` and asserting on `stdout` / `exitCode`.

The tests gate with `describe.skipIf(!hasGoBinaries)` — if the build script hasn't produced the binaries (e.g. on a CI runner without internet access to fetch the host Go toolchain), the tests skip gracefully, mirroring the PHP/MariaDB pattern.

Each example program does one specific thing and asserts a specific output. No "exercise everything" mega-test; each gap discovered in §4 gets its own focused fixture so a regression points at a single line.

### §5.7 ABI & rollout

**No kernel changes are expected.** All translation happens host-side in `WasiShim`. Therefore no `ABI_VERSION` bump, no `abi/snapshot.json` change.

**If §5.2 Option 2 (relax memory constraint) discovers it must touch shared types** — unlikely; the change is local to host TypeScript — bump per CLAUDE.md.

**If §4 gaps in `fd_readdir` or `poll_oneoff` require new kernel behavior** — possible if the shim's existing `SYS_GETDENTS64` translation needs the kernel to support a new flag or mode. In that case: bump `ABI_VERSION`, regenerate `abi/snapshot.json`, document in the same commit, ship in `binaries-abi-v6-2026-04-29` (if pre-cut date) or roll the next release.

### §5.8 What the user-visible output looks like

After this lands, a Go developer can do:

```bash
$ source sdk/activate.sh
$ cat > /tmp/hi.go <<'EOF'
package main
import "fmt"
func main() { fmt.Println("hi from go on the kernel") }
EOF
$ wasm32posix-go build -o /tmp/hi.wasm /tmp/hi.go
$ npx tsx scripts/run-program.ts /tmp/hi.wasm   # or via node-kernel-host
hi from go on the kernel
$ echo $?
0
```

That's the goal-state of the v1 port.

## §6. Phasing

Each phase is its own PR, stacked on the previous. Match the existing `area(scope): subject` commit style. Verification gauntlet runs on every PR per CLAUDE.md.

### Phase 0 — Verification & toolchain bring-up (½–1 day)

- Confirm tree builds clean on this branch (`bash build.sh`, `cd host && npx vitest run`, the existing libc-test and POSIX gauntlet).
- Confirm the existing `wasi-shim.test.ts` passes against current `main`.
- Install host Go toolchain (~70 MB tarball, tagged release). Compile `hello.go` to `.wasm` outside our kernel; confirm `wasmtime` runs it. This validates the upstream toolchain end-to-end before we add it to the build pipeline.
- Inspect Go's `_start` and import set (`wasm-tools dump hello.wasm | head -100`); confirm the import set matches §4's expectation.
- **Output:** `docs/plans/2026-04-29-go-wasm-phase0-verification.md` with the import list, binary size, and any toolchain-version note.

### Phase 1 — Relax WASI shim memory constraint (1 day)

PR title: `feat(wasi): allow WASI modules with exported memory`

- Remove the `wasiModuleDefinesMemory(module)` rejection in `worker-main.ts:540`.
- After `WebAssembly.instantiate`, if `instance.exports.memory` exists, re-bind `wasiShim` to that memory before `init()`.
- Existing two `wasi-shim.test.ts` cases continue to pass (they use imported memory; that path is unchanged).
- Add one new test case: a hand-written `wasi-export-memory.wat` fixture that defines/exports memory; round-trips a `fd_write`. Sanity-checks the new code path without depending on Go.

Acceptance: existing tests green; new fixture green; no kernel changes.

### Phase 2 — Go port skeleton (1–2 days)

PR title: `feat(go): port skeleton — wasm32posix-go SDK wrapper + hello world`

- Add `sdk/bin/wasm32posix-go`, `sdk/src/bin/go.ts`. Resolves host Go (env, PATH, `sdk/go/bin/`).
- Add `examples/libs/go/build-go.sh` — downloads host Go if missing, builds `programs/hello/main.go`.
- Add `examples/libs/go/programs/hello/main.go` (`fmt.Println("Hello from Go on wasm-posix-kernel")`).
- Add `examples/libs/go/deps.toml` (revision 1, no `depends_on`).
- Add `host/test/go-wasip1.test.ts` with one `it("hello world")` case, gated `skipIf(!hasGoBinaries)`.

Acceptance: `bash examples/libs/go/build-go.sh` produces `examples/libs/go/bin/go-hello.wasm`; the test prints `"Hello from Go on wasm-posix-kernel\n"` with exit 0. **This proves the integration end-to-end.**

### Phase 3 — File I/O smoke (1 day)

PR title: `feat(go): file I/O smoke — os.ReadFile / os.WriteFile`

- Add `programs/fileio/main.go` — writes a known string to `/tmp/go-test`, reads it back, prints round-trip result.
- Add test case asserting expected output.

Acceptance: round-trip succeeds; covers `path_open(O_RDONLY)`, `path_open(O_WRONLY|O_CREAT|O_TRUNC)`, `fd_read`, `fd_write`, `fd_close`. If `path_filestat_get` shape mismatches, this is where it surfaces.

### Phase 4 — Goroutines smoke (½ day)

PR title: `feat(go): cooperative scheduler smoke — 100 goroutines`

- Add `programs/goroutines/main.go` — spawns 100 goroutines, each computes a small sum, joins via `sync.WaitGroup`, prints aggregate.
- Add test case.

Acceptance: aggregate sum is correct; verifies Go's runtime scheduler runs end-to-end on a single OS thread inside our worker; verifies `runtime.usleep` (`poll_oneoff` with timeout-only) is not taken on idle in a way that slows the program down to test-timeout.

### Phase 5 — Directory walk (1–2 days) — RISK PHASE

PR title: `feat(go): directory walk — filepath.WalkDir`

- Add `programs/dirwalk/main.go` — walks `/etc` (or another VFS subtree the kernel populates) with `filepath.WalkDir`, prints names + types.
- Add test case asserting expected entry list.

This phase exercises `fd_readdir`, the §4-flagged highest-risk surface. If the shim's dirent layout disagrees with Go's expectation, fix in this PR (add a unit test in `wasi-shim.test.ts` first, then the fix). If kernel `SYS_GETDENTS64` returns a layout the shim has to massage, fold the massage into the shim, not the kernel.

Acceptance: `WalkDir("/etc")` returns the same entries as `dash -c "ls -la /etc"` on the same kernel image.

### Phase 6 — Time / sleep / monotonic clock (½ day)

PR title: `feat(go): time smoke — Sleep, Now, monotonic clock`

- Add `programs/time/main.go` — measures `time.Since` across `time.Sleep(10ms)` × 5; asserts elapsed is >= 50ms and <= 500ms.
- Add test case.

Exercises `clock_time_get(REALTIME)`, `clock_time_get(MONOTONIC)`, `poll_oneoff` with one CLOCK subscription.

### Phase 7 — Documentation & port registration (½ day)

PR title: `docs(go): port status, build instructions, known limitations`

- Update `docs/posix-status.md` with a "Go (wasip1)" section.
- Update `docs/porting-guide.md` with a Go subsection.
- Update `README.md` "Ported software" list.
- Register `go-hello` (and others) in `run-example.ts` if appropriate so they appear as runnable demos.

Acceptance: a fresh reader can find the Go port in the README, follow the build instructions, and run a Go program.

### Phase 8+ — Decision point

Re-evaluate after Phase 7:

- Networking from Go (`net.Dial`) — cost of pulling in `dispatchrun/net` vs. patching Go's runtime. Defer to a v2 design doc; not in this scope.
- TinyGo support — separate v3 design.
- `GOOS=wasip2` once Go ships native support — separate.
- Pre-bake popular Go programs (gopls, hugo, caddy with networking removed) into a demo VFS — separate v2.

## §7. Risks

- **`fd_readdir` layout mismatch (high).** Go's wasip1 `fd_readdir` expects a specific dirent buffer layout (`(d_next: u64, d_ino: u64, d_namlen: u32, d_type: u8)` then `name`). The shim translates `getdents64` output; if any byte is off, Go silently mis-reads. Phase 5 includes a unit test in `wasi-shim.test.ts` that hand-rolls the expected output and checks the shim emits exactly that. Mitigation: write the dirent layout test before touching anything.
- **`poll_oneoff` infinite hang on goroutine idle (medium).** Go's scheduler calls `poll_oneoff` from `runtime.usleep`. If the timeout subscription is parsed wrong, the program hangs forever instead of resuming after the timeout. Phase 4's goroutines test surfaces this within 30 seconds of test-timeout.
- **Memory layout assumption (low — addressed in Phase 1).** The "imported vs. exported memory" gap is a one-time fix.
- **Host Go toolchain availability (low).** Build script downloads Go from `go.dev/dl` over HTTPS; in a CI environment without outbound internet the build fails. Mitigation: `skipIf(!hasGoBinaries)` in tests; CI configuration documents the host-toolchain dependency.
- **Binary size (low).** A Go hello-world is ~2 MB stripped. Compared to a C hello-world (a few KB) this is large but uninteresting — no `.vfs` budget pressure since these are loaded as standalone programs. Document; do not optimize.
- **Async-blocking calls stall all goroutines (intrinsic).** `poll_oneoff` blocks the wasm instance, which blocks every goroutine. This is a property of Go's wasm runtime, not our shim. Document in `docs/posix-status.md`. Out of scope to fix.

## §8. Open questions

- Should `wasm32posix-go` strip debug info by default (`-ldflags="-s -w"`)? Pro: smaller binaries, faster compile. Con: stack traces less useful when Go programs crash. Probably yes-by-default with an override; revisit after Phase 2.
- Should `examples/libs/go/` ship multiple example programs (hello, fileio, goroutines, dirwalk, time) as five separate `.wasm` files, or one fat binary that takes a subcommand? Five separate is the existing pattern (cf. PHP's `php` and `php-fpm` as separate outputs). Default to five.
- Where does the host Go toolchain live on disk? Following `sdk/activate.sh` logic, candidate is `sdk/go/`. Confirm in Phase 0 — if `sdk/` is not the right place for a >70 MB toolchain, revisit. (CPython and Erlang have the same issue and put their host bootstraps in `examples/libs/<lang>/host-build/`; that pattern may be cleaner.)
- Should we contribute the relaxed `wasiModuleDefinesMemory` check upstream (i.e. into the original PR #205 as a follow-up) or keep it as a Go-port-local change? Lean upstream — it's a strictly more permissive shim with no behavior change for existing users.
