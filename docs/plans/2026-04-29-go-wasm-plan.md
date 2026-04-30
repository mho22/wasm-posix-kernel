# Go (`GOOS=wasip1`) on the kernel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Companion to:** [`docs/plans/2026-04-29-go-wasm-design.md`](./2026-04-29-go-wasm-design.md). Read the design first; this plan is the executable counterpart.

**Goal.** Run upstream-compiled Go programs (`GOOS=wasip1 GOARCH=wasm`) on the kernel via the existing WASI Preview 1 shim in `host/src/wasi-shim.ts` (PR #205). End-state is a `examples/libs/go/` port producing five canonical example binaries (hello, fileio, goroutines, dirwalk, time), each with a passing integration test under `host/test/go-wasip1.test.ts`. No fork of Go; no kernel changes expected.

**Architecture (recap from design §5):**

```
   Go user program (.wasm, GOOS=wasip1 GOARCH=wasm)
        │  imports wasi_snapshot_preview1.{...}
        ▼
   centralizedWorkerMain  (host/src/worker-main.ts:539)
        │  branches on isWasiModule(module)
        ▼
   WasiShim                (host/src/wasi-shim.ts — PR #205, in tree)
        │  fd_*/path_*/poll_oneoff/clock/random/proc_exit/args/environ
        │  → kernel channel syscall
        ▼
   kernel (existing): VFS, processes, devices, signals
```

The shim already exists and translates ~45 WASI imports to channel syscalls. Go programs are just another consumer of that shim. The bridge is integration: **build a Go binary, feed it to the existing shim, fix any gaps Go exercises that the existing tests don't.**

**Tech stack:**
- Host Go toolchain (1.24.x release tarball, fetched at build time)
- TypeScript host runtime (vitest integration tests)
- Existing WASI shim (no rewrite, possibly one constraint relaxation in Phase 1)
- No C, no autoconf, no `wasm32posix-cc` — Go has its own build system

**PR series (target order, each stacked on the previous):**

| # | Phase | Title (matches existing commit style) |
|---|-------|---------------------------------------|
| 0 | Verify | `docs(plan): Go wasip1 — Phase 0 toolchain verification` |
| 1 | Shim   | `feat(wasi): allow WASI modules with exported memory` |
| 2 | Skeleton | `feat(go): port skeleton — wasm32posix-go SDK wrapper + hello world` |
| 3 | FileIO | `feat(go): file I/O smoke — os.ReadFile / os.WriteFile` |
| 4 | Goroutines | `feat(go): cooperative scheduler smoke — 100 goroutines` |
| 5 | Dirwalk | `feat(go): directory walk — filepath.WalkDir` |
| 6 | Time   | `feat(go): time smoke — Sleep, Now, monotonic clock` |
| 7 | Docs   | `docs(go): port status, build instructions, known limitations` |

**Branching convention.** All branches in this track are prefixed `emdash/explore-go-wasm-` and **stack on the previous branch in the series**, never on `main`. Nothing in this track lands on `main` — each PR is reviewed against its predecessor, and final merge into Brandon's `wasm-posix-kernel` happens only after the entire series is validated.

```
main (origin = mho22/wasm-posix-kernel)
  └── emdash/explore-go-wasm-ism77                      (Design — PR #13)
        └── emdash/explore-go-wasm-plan                 (Plan — this PR)
              └── emdash/explore-go-wasm-phase0-verify
                    └── emdash/explore-go-wasm-shim-export-memory   (Phase 1)
                          └── emdash/explore-go-wasm-skeleton       (Phase 2)
                                └── emdash/explore-go-wasm-fileio   (Phase 3)
                                      └── emdash/explore-go-wasm-goroutines  (Phase 4)
                                            └── emdash/explore-go-wasm-dirwalk     (Phase 5)
                                                  └── emdash/explore-go-wasm-time  (Phase 6)
                                                        └── emdash/explore-go-wasm-docs  (Phase 7)
```

Each PR's GitHub base is the predecessor branch (not `main`). PRs target `mho22/wasm-posix-kernel`. Brandon's upstream is reached only after the whole series validates.

**Verification gauntlet (CLAUDE.md, applies to every PR):**

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib    # 539+ pass, 0 fail
(cd host && npx vitest run)                                            # all files pass
scripts/run-libc-tests.sh                                              # 0 unexpected FAIL
scripts/run-posix-tests.sh                                             # 0 FAIL
bash scripts/check-abi-version.sh                                      # exit 0
```

`XFAIL` / `TIME` are tolerated; any new `FAIL` is a regression that must be fixed in a focused predecessor PR. ABI snapshot regen + `ABI_VERSION` bump if any kernel/shared/struct surface moves (none expected — see design §5.7).

---

## Phase 0 — Toolchain verification

Phase 0 is **all observation, no code** except a single output document. Establishes the baseline before touching anything: confirm tree builds, confirm existing tests pass, confirm Go produces a working `.wasm` outside our kernel, inspect what it imports.

**Branch:** `emdash/explore-go-wasm-phase0-verify` (off `emdash/explore-go-wasm-plan`).

**Output document:** `docs/plans/2026-04-29-go-wasm-phase0-verification.md`.

### Task 0.1 — Confirm baseline build & tests pass on this branch

```bash
bash build.sh
cd host && npx vitest run
cd ..
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Record exit codes and `wasi-shim.test.ts` summary in the output doc. If any FAIL, **stop** — fix in a predecessor PR before Phase 0 proceeds. The Go work is downstream of a healthy baseline.

### Task 0.2 — Install host Go toolchain

Pick `1.24.x` (latest stable as of 2026-04-29). Per-host:

```bash
# darwin-arm64
GO_VERSION=1.24.2
mkdir -p sdk/go-host
curl -fsSL "https://go.dev/dl/go${GO_VERSION}.darwin-arm64.tar.gz" \
  | tar -xz -C sdk/go-host --strip-components=1
sdk/go-host/bin/go version
```

Verify SHA-256 against `https://go.dev/dl/?mode=json` (record the hash for the eventual `deps.toml`). The download is ~70 MB; tarball lives in `.gitignore`d `sdk/go-host/`.

### Task 0.3 — Compile a minimal Go program outside the kernel

```bash
cat > /tmp/hi.go <<'EOF'
package main
import "fmt"
func main() { fmt.Println("hi") }
EOF
GOOS=wasip1 GOARCH=wasm CGO_ENABLED=0 \
  sdk/go-host/bin/go build -ldflags="-s -w" -o /tmp/hi.wasm /tmp/hi.go
ls -la /tmp/hi.wasm   # ~2 MB
```

Optional sanity: install `wasmtime` and run it.

```bash
brew install wasmtime
wasmtime /tmp/hi.wasm   # prints "hi"
```

If wasmtime is unavailable, skip — we are not using it for tests. The point is to confirm the upstream toolchain produces a runnable WASI binary.

### Task 0.4 — Inspect imports

```bash
brew install wasm-tools  # if not present
wasm-tools dump /tmp/hi.wasm | grep -E "^\s*import" | head -50
```

Record the import set in the output doc. Cross-reference against the design's §4 table. **Expected imports** for a hello-world: `args_get`, `args_sizes_get`, `clock_time_get`, `environ_get`, `environ_sizes_get`, `fd_close`, `fd_fdstat_get`, `fd_fdstat_set_flags`, `fd_filestat_get`, `fd_pread`, `fd_prestat_dir_name`, `fd_prestat_get`, `fd_pwrite`, `fd_read`, `fd_seek`, `fd_write`, `path_open`, `poll_oneoff`, `proc_exit`, `random_get`. (Go pulls in more than the bare minimum because `runtime` initializes broadly.)

If the import set diverges from §4 — surfaces something we did not plan for — flag it in the output doc; it may shift Phase 1 scope.

### Task 0.5 — Inspect memory configuration

```bash
wasm-tools dump /tmp/hi.wasm | grep -E "(memory|export)" | head -20
```

Confirm the design's claim: Go's wasip1 linker emits `(memory ... )` and exports it; it does **not** import memory. This validates the need for Phase 1.

### Task 0.6 — Write the Phase 0 output document

Save as `docs/plans/2026-04-29-go-wasm-phase0-verification.md`:

- Toolchain version observed (`go1.24.2 darwin/arm64`).
- Tarball SHA-256 (for deps.toml in Phase 2).
- Hello-world `.wasm` size (stripped & unstripped).
- Full import set, one per line.
- Memory configuration (defines+exports vs. imports).
- Any baseline gauntlet failures and their resolutions.

Commit:

```bash
git add docs/plans/2026-04-29-go-wasm-phase0-verification.md
git commit -m "docs(plan): Go wasip1 — Phase 0 toolchain verification

Verified upstream Go 1.24.2 produces a runnable wasip1 .wasm.
Recorded the import set Go pulls in for hello-world (20 imports)
and confirmed all are implemented by host/src/wasi-shim.ts.
Confirmed Go's linker exports (does not import) memory — Phase 1
will relax the shim's imported-memory rejection."
```

Push and open PR against `emdash/explore-go-wasm-plan`.

**No code under `host/`, `crates/`, `examples/`, or `sdk/` changes in Phase 0.**

---

## Phase 1 — Relax WASI shim memory constraint

The existing shim rejects modules that define their own memory (`worker-main.ts:540`). Stock Go's wasip1 linker emits exactly such a module. Relax the constraint without breaking the existing C-program path.

**Branch:** `emdash/explore-go-wasm-shim-export-memory` (off Phase 0).

**Files:**
- Modify: `host/src/worker-main.ts` (the `wasiModuleDefinesMemory` rejection at line 540)
- Modify: `host/src/wasi-shim.ts` (allow late re-binding of memory)
- Add: `host/test/fixtures/wasi-export-memory.wat`
- Add (or amend): `host/test/wasi-shim.test.ts` (one new `it` case)

### Task 1.1 — Write the failing test first

Create `host/test/fixtures/wasi-export-memory.wat`:

```wat
(module
  ;; Emulates Go's linker output: defines + exports memory, does not import
  (memory (export "memory") 1)
  (import "wasi_snapshot_preview1" "fd_write"
    (func $fd_write (param i32 i32 i32 i32) (result i32)))
  (import "wasi_snapshot_preview1" "proc_exit"
    (func $proc_exit (param i32)))

  (data (i32.const 100) "Hello from exported memory\n")

  (func (export "_start")
    (i32.store (i32.const 0) (i32.const 100))   ;; iov.iov_base
    (i32.store (i32.const 4) (i32.const 27))    ;; iov.iov_len
    (call $fd_write
      (i32.const 1)        ;; stdout
      (i32.const 0)        ;; iovs ptr
      (i32.const 1)        ;; iovs_len
      (i32.const 200))     ;; nwritten out (discard)
    drop
    (call $proc_exit (i32.const 0))))
```

Build the binary:

```bash
brew install wabt   # provides wat2wasm
wat2wasm host/test/fixtures/wasi-export-memory.wat \
  -o host/test/fixtures/wasi-export-memory.wasm
```

Add to `host/test/wasi-shim.test.ts`:

```ts
it("hello world via fd_write with exported memory", async () => {
  const result = await runCentralizedProgram({
    programPath: join(fixturesDir, "wasi-export-memory.wasm"),
    timeout: 10_000,
  });
  expect(result.stdout).toBe("Hello from exported memory\n");
  expect(result.exitCode).toBe(0);
});
```

Run; it must FAIL on `main` of this branch (Phase 0 baseline) with the existing rejection error:

```
Error: WASI module defines its own memory. Only modules that import
memory (compiled with --import-memory) are supported.
```

Record the failure in the commit message later.

### Task 1.2 — Identify the WasiShim's actual memory dependency

Read `host/src/wasi-shim.ts:393–560` (the `WasiShim` class constructor and field initialization). Confirm: the shim stores `memory: WebAssembly.Memory` and uses it solely for reading/writing buffers in import handlers — it never shares memory with another worker on the WASI path. (Multi-process workers share via `SharedArrayBuffer`-backed `Memory`, but each Go instance lives in its own worker.)

This grounds the change: re-binding memory after instantiation is safe; nothing fans out from the WASI shim's memory reference.

### Task 1.3 — Make `WasiShim.memory` settable post-construction

In `host/src/wasi-shim.ts`:

- Allow `memory` to be replaced after construction via a method `bindMemory(memory: WebAssembly.Memory): void`.
- All places the shim reads `this.memory` continue to dereference the field; no caching of `this.memory.buffer` across calls (verify — if any caching exists, drop it or invalidate on rebind). The buffer can grow on `memory.grow`; the shim must read the fresh `.buffer` each call already.

Sketch:

```ts
class WasiShim {
  private memory: WebAssembly.Memory;
  // ...
  bindMemory(memory: WebAssembly.Memory): void {
    this.memory = memory;
  }
}
```

### Task 1.4 — Update worker-main.ts to handle exported memory

Replace the rejection at `host/src/worker-main.ts:540`:

```ts
if (isWasiModule(module)) {
  const wasiShim = new WasiShim(memory, channelOffset, argv, env);
  const wasiImports = wasiShim.getImports();

  const importObject: WebAssembly.Imports = {
    wasi_snapshot_preview1: wasiImports as Record<string, WebAssembly.ExportValue>,
    env: { memory },                                 // harmless if module doesn't import env.memory
  };

  // Stub remaining env imports the module needs
  // ... (existing logic)

  const instance = await WebAssembly.instantiate(module, importObject);

  // If the module exports its own memory (Go's wasip1), re-bind the shim to it.
  // This branch is taken by stock-Go binaries; the existing C-program path
  // (which imports env.memory and does not export memory) is unaffected.
  const exportedMemory = instance.exports.memory as WebAssembly.Memory | undefined;
  if (exportedMemory && exportedMemory !== memory) {
    wasiShim.bindMemory(exportedMemory);
  }

  wasiShim.init();
  // ... (existing _start invocation, postMessage, etc.)
}
```

Notes:

- `env.memory` is provided unconditionally; if the module declares its own memory and doesn't import `env.memory`, the entry on the import object is unused (Wasm instantiation does not error on unused-but-provided imports).
- If the module both imports `env.memory` and exports a `memory` named export pointing at it (existing C programs do this since `--import-memory --export-memory`), the `exportedMemory !== memory` check skips the rebind. Test in Task 1.5.

### Task 1.5 — Verify existing tests continue to pass

```bash
cd host && npx vitest run test/wasi-shim.test.ts
```

Expected:

- `hello world via fd_write` (existing, imports memory) — PASS
- `args_get passes argv to the program` (existing, imports memory) — PASS
- `hello world via fd_write with exported memory` (new, exports memory) — PASS

Run the full vitest suite:

```bash
cd host && npx vitest run
```

All files green.

### Task 1.6 — Verification gauntlet

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
cd host && npx vitest run; cd ..
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Expected: all green; ABI snapshot unchanged (host-only change).

### Task 1.7 — Commit & PR

```bash
git add host/src/wasi-shim.ts \
        host/src/worker-main.ts \
        host/test/fixtures/wasi-export-memory.wat \
        host/test/fixtures/wasi-export-memory.wasm \
        host/test/wasi-shim.test.ts
git commit -m "feat(wasi): allow WASI modules with exported memory

Stock Go's wasip1 linker emits a module that defines and exports memory
rather than importing it. The WASI shim's previous rejection of
self-defined memory was a leftover assumption from C programs that
share memory with multi-process workers via --import-memory. WASI
modules don't share memory cross-worker, so the constraint is
unnecessary.

Adds WasiShim.bindMemory() and a worker-main.ts branch that re-binds
the shim to instance.exports.memory when the module defines its own.
Existing C-program path (imports env.memory, exports it back) is
unaffected — tests confirm.

New fixture wasi-export-memory.wat models Go's memory layout in 27
lines of WAT. Lays the groundwork for examples/libs/go/ in subsequent
PRs without depending on a host Go toolchain in this PR."
```

Open PR with base `emdash/explore-go-wasm-phase0-verify`.

---

## Phase 2 — Go port skeleton + hello world

First end-to-end Go binary running on the kernel. SDK wrapper, build script, deps.toml, one example program, one passing integration test.

**Branch:** `emdash/explore-go-wasm-skeleton` (off Phase 1).

**Files added:**
- `sdk/bin/wasm32posix-go` (bash launcher mirroring `wasm32posix-cc`)
- `sdk/src/bin/go.ts` (TS counterpart)
- `examples/libs/go/deps.toml`
- `examples/libs/go/build-go.sh`
- `examples/libs/go/programs/hello/main.go`
- `examples/libs/go/programs/hello/go.mod`
- `host/test/go-wasip1.test.ts`
- `examples/libs/go/.gitignore` (ignore `bin/` and `host-build/`)

### Task 2.1 — SDK wrapper `wasm32posix-go`

Read `sdk/bin/wasm32posix-cc` and `sdk/src/bin/cc.ts` for the pattern. Create `sdk/bin/wasm32posix-go`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SDK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "$SDK_DIR/dist/bin/go.js" "$@"
```

`chmod +x sdk/bin/wasm32posix-go`.

`sdk/src/bin/go.ts`:

```ts
#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

function findGo(): string {
  if (process.env.GOROOT) {
    const candidate = join(process.env.GOROOT, "bin", "go");
    if (existsSync(candidate)) return candidate;
  }
  const sdkDir = resolve(__dirname, "..", "..");
  const local = join(sdkDir, "go-host", "bin", "go");
  if (existsSync(local)) return local;
  const which = spawnSync("which", ["go"], { encoding: "utf8" });
  const found = which.stdout.trim();
  if (found) return found;
  console.error(
    "wasm32posix-go: no host Go toolchain found.\n" +
    "Run examples/libs/go/build-go.sh to install one under sdk/go-host/, " +
    "or set GOROOT, or add `go` to PATH."
  );
  process.exit(127);
}

const go = findGo();
const result = spawnSync(go, process.argv.slice(2), {
  stdio: "inherit",
  env: {
    ...process.env,
    GOOS: "wasip1",
    GOARCH: "wasm",
    CGO_ENABLED: "0",
  },
});
process.exit(result.status ?? 1);
```

Update the SDK's `package.json` `bin` field if the existing `cc`/`ld`/etc. binaries are there; emit `dist/bin/go.js` via the existing TS build pipeline.

### Task 2.2 — Build script

`examples/libs/go/build-go.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# shellcheck source=/dev/null
. "$WORKTREE_ROOT/sdk/activate.sh"

GO_VERSION="${GO_VERSION:-1.24.2}"
GO_HOME="$WORKTREE_ROOT/sdk/go-host"
GO="$GO_HOME/bin/go"

# Detect host arch
HOST_OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
HOST_ARCH="$(uname -m)"
case "$HOST_ARCH" in
  arm64|aarch64) GO_ARCH=arm64 ;;
  x86_64|amd64)  GO_ARCH=amd64 ;;
  *) echo "Unsupported host arch: $HOST_ARCH" >&2; exit 1 ;;
esac
case "$HOST_OS" in
  darwin) GO_OS=darwin ;;
  linux)  GO_OS=linux ;;
  *) echo "Unsupported host OS: $HOST_OS" >&2; exit 1 ;;
esac

GO_TARBALL="go${GO_VERSION}.${GO_OS}-${GO_ARCH}.tar.gz"
GO_URL="https://go.dev/dl/${GO_TARBALL}"

if [[ ! -x "$GO" ]]; then
  echo ">> Installing host Go ${GO_VERSION} into $GO_HOME"
  mkdir -p "$GO_HOME"
  curl -fsSL "$GO_URL" | tar -xz -C "$GO_HOME" --strip-components=1
fi

echo ">> Host Go: $($GO version)"

OUT="$SCRIPT_DIR/bin"
mkdir -p "$OUT"

PROGRAMS=(hello)   # extended in subsequent phases
for prog in "${PROGRAMS[@]}"; do
  echo ">> Building go-${prog}.wasm"
  (
    cd "$SCRIPT_DIR/programs/$prog"
    GOOS=wasip1 GOARCH=wasm CGO_ENABLED=0 \
      "$GO" build -ldflags="-s -w" -o "$OUT/go-${prog}.wasm" .
  )
  ls -la "$OUT/go-${prog}.wasm"
done

echo ">> Done. Binaries in $OUT."
```

`chmod +x examples/libs/go/build-go.sh`.

`examples/libs/go/.gitignore`:
```
bin/
host-build/   # if any go modules cache appears
```

### Task 2.3 — `deps.toml`

`examples/libs/go/deps.toml`:

```toml
kind = "program"
name = "go"
version = "1.24.2"
revision = 1
arches = ["wasm32"]

[source]
url = "https://go.dev/dl/go1.24.2.darwin-arm64.tar.gz"   # per-host fallback; build script picks the right one
sha256 = "<filled in from Phase 0 Task 0.6>"

[license]
spdx = "BSD-3-Clause"
url = "https://go.googlesource.com/go/+/refs/heads/master/LICENSE"

[[outputs]]
name = "go-hello"
wasm = "go-hello.wasm"
```

### Task 2.4 — Hello program

`examples/libs/go/programs/hello/go.mod`:
```
module wasm-posix-kernel/examples/go/hello

go 1.24
```

`examples/libs/go/programs/hello/main.go`:
```go
package main

import "fmt"

func main() {
	fmt.Println("Hello from Go on wasm-posix-kernel")
}
```

### Task 2.5 — Build the binary

```bash
bash examples/libs/go/build-go.sh
```

Expected output:
```
>> Host Go: go version go1.24.2 darwin/arm64
>> Building go-hello.wasm
-rw-r--r--  ...  ~1.8M  examples/libs/go/bin/go-hello.wasm
>> Done.
```

### Task 2.6 — Integration test

`host/test/go-wasip1.test.ts`:

```ts
/**
 * Go wasip1 integration tests.
 *
 * Runs Go-compiled WASI binaries from examples/libs/go/bin/ through
 * CentralizedKernelWorker via the existing WASI shim (PR #205) +
 * Phase 1 exported-memory relaxation.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runCentralizedProgram } from "./centralized-test-helper";

const __dirname = dirname(fileURLToPath(import.meta.url));
const binDir = join(__dirname, "..", "..", "examples", "libs", "go", "bin");
const helloPath = join(binDir, "go-hello.wasm");
const hasGoBinaries = existsSync(helloPath);

describe.skipIf(!hasGoBinaries)("Go wasip1", () => {
  it("hello world", async () => {
    const result = await runCentralizedProgram({
      programPath: helloPath,
      timeout: 30_000,
    });
    expect(result.stdout).toBe("Hello from Go on wasm-posix-kernel\n");
    expect(result.exitCode).toBe(0);
  });
});
```

### Task 2.7 — Run the integration test

```bash
cd host && npx vitest run test/go-wasip1.test.ts
```

Expected: 1 test, 1 pass.

If the test fails — investigate. Most likely culprits, in order:

1. **Phase 1 not landed / merged into this branch.** Confirm `git log --oneline | grep "exported memory"` shows the Phase 1 commit.
2. **`fd_fdstat_get` shape mismatch.** Go probes stdin/stdout/stderr at startup; if the shim's `fdstat` struct disagrees with Go's `syscall.Fdstat`, Go's runtime aborts with a vague error. Inspect `host/src/wasi-shim.ts` `fd_fdstat_get` impl; cross-check against Go's `src/syscall/fs_wasip1.go` `FdStat` struct (24 bytes: `(fs_filetype: u8, fs_flags: u16, fs_rights_base: u64, fs_rights_inheriting: u64)` with padding).
3. **Process worker not surfacing stdout.** Verify the test helper drains stdout from a fd (1) write through the kernel — same path the args/hello WAT fixtures use; should be fine.

Each fix is a focused commit on this branch. Do **not** roll into a separate PR — the skeleton must work end-to-end before claiming Phase 2 done.

### Task 2.8 — Verification gauntlet & commit

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
cd host && npx vitest run; cd ..
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

```bash
git add sdk/bin/wasm32posix-go \
        sdk/src/bin/go.ts \
        examples/libs/go/ \
        host/test/go-wasip1.test.ts
git commit -m "feat(go): port skeleton — wasm32posix-go SDK wrapper + hello world

First Go program running on the kernel via the existing WASI shim
(host/src/wasi-shim.ts, PR #205) + Phase 1 exported-memory relaxation.

Adds:
  * sdk/bin/wasm32posix-go — thin wrapper that locates a host Go
    (GOROOT, sdk/go-host/, then PATH) and invokes it with
    GOOS=wasip1 GOARCH=wasm CGO_ENABLED=0 forced.
  * examples/libs/go/build-go.sh — downloads host Go 1.24.2 if missing,
    cross-compiles example programs into examples/libs/go/bin/.
  * examples/libs/go/programs/hello — minimal fmt.Println program.
  * host/test/go-wasip1.test.ts — vitest integration test, skipped
    when bin/go-hello.wasm is absent (no host-toolchain CI dependency).

No kernel changes; no ABI bump. The path to runnable Go programs on
the kernel is now end-to-end."
```

Open PR with base `emdash/explore-go-wasm-shim-export-memory`.

---

## Phase 3 — File I/O smoke

Validates the shim's `path_open` / `fd_read` / `fd_write` / `fd_close` / `path_filestat_get` against Go's actual call patterns.

**Branch:** `emdash/explore-go-wasm-fileio` (off Phase 2).

**Files added:**
- `examples/libs/go/programs/fileio/main.go`
- `examples/libs/go/programs/fileio/go.mod`

**Files modified:**
- `examples/libs/go/build-go.sh` (extend `PROGRAMS=` to include `fileio`)
- `examples/libs/go/deps.toml` (add `[[outputs]]` entry for `go-fileio`)
- `host/test/go-wasip1.test.ts` (one new `it` case)

### Task 3.1 — Program

`examples/libs/go/programs/fileio/main.go`:

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	const path = "/tmp/go-fileio-test"
	const want = "round-trip-ok"

	if err := os.WriteFile(path, []byte(want), 0o644); err != nil {
		fmt.Println("WRITE_ERR:", err)
		os.Exit(1)
	}

	got, err := os.ReadFile(path)
	if err != nil {
		fmt.Println("READ_ERR:", err)
		os.Exit(1)
	}

	if string(got) != want {
		fmt.Printf("MISMATCH: want=%q got=%q\n", want, string(got))
		os.Exit(1)
	}

	fi, err := os.Stat(path)
	if err != nil {
		fmt.Println("STAT_ERR:", err)
		os.Exit(1)
	}
	if fi.Size() != int64(len(want)) {
		fmt.Printf("SIZE_MISMATCH: want=%d got=%d\n", len(want), fi.Size())
		os.Exit(1)
	}

	if err := os.Remove(path); err != nil {
		fmt.Println("REMOVE_ERR:", err)
		os.Exit(1)
	}

	fmt.Println("OK")
}
```

### Task 3.2 — Test

In `host/test/go-wasip1.test.ts`, add:

```ts
it("file I/O round-trip", async () => {
  const result = await runCentralizedProgram({
    programPath: join(binDir, "go-fileio.wasm"),
    timeout: 30_000,
  });
  expect(result.stdout).toBe("OK\n");
  expect(result.exitCode).toBe(0);
});
```

### Task 3.3 — Build & run

```bash
bash examples/libs/go/build-go.sh    # PROGRAMS now includes fileio
cd host && npx vitest run test/go-wasip1.test.ts
```

Expected: 2 tests, 2 pass.

### Task 3.4 — Surface and fix any shim gaps

If `OK` is not printed, locate which step failed (`MISMATCH`, `STAT_ERR`, etc.) and inspect the corresponding shim handler.

Likely surfacing: `path_filestat_get` size field. The shim writes a 64-byte filestat struct; Go's `syscall.Stat_t` for wasip1 expects an exact byte layout (`dev: u64, ino: u64, filetype: u8, _padding: 7, nlink: u64, size: u64, atim: u64, mtim: u64, ctim: u64`). Verify byte-for-byte against `host/src/wasi-shim.ts:path_filestat_get`. Fix any drift in this PR; add a unit test in `wasi-shim.test.ts` that explicitly asserts the layout.

Likely surfacing: `O_CREAT | O_WRONLY | O_TRUNC` flag combination. Cross-check translation in `wasiOflagsToPosix` (`host/src/wasi-shim.ts:359`). Compare against Go's emitted oflags (it sets `OFLAGS_CREAT | OFLAGS_TRUNC` for `os.WriteFile` and provides `RIGHTS_FD_WRITE` in `fs_rights_base`).

### Task 3.5 — Verification gauntlet & commit

Standard gauntlet. Commit:

```bash
git add examples/libs/go/programs/fileio/ \
        examples/libs/go/build-go.sh \
        examples/libs/go/deps.toml \
        host/test/go-wasip1.test.ts
git commit -m "feat(go): file I/O smoke — os.ReadFile / os.WriteFile

Round-trips a known string through path_open / fd_write / fd_read /
fd_close, then checks os.Stat size, then os.Remove. Exercises the
oflags translation (O_CREAT|O_WRONLY|O_TRUNC) and filestat layout
that hello-world doesn't.

No shim changes were necessary — Go's calls match the existing
wasi-shim.ts implementations at the byte level."
```

(If shim changes _were_ necessary, expand the commit message accordingly.)

---

## Phase 4 — Goroutines smoke

Confirms Go's cooperative scheduler runs end-to-end inside our worker; surfaces any `poll_oneoff` (`runtime.usleep`) issue under realistic scheduler pressure.

**Branch:** `emdash/explore-go-wasm-goroutines` (off Phase 3).

**Program:** `examples/libs/go/programs/goroutines/main.go`:

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	const n = 100
	var sum atomic.Int64
	var wg sync.WaitGroup

	wg.Add(n)
	for i := 1; i <= n; i++ {
		go func(i int) {
			defer wg.Done()
			sum.Add(int64(i))
		}(i)
	}
	wg.Wait()

	want := int64(n * (n + 1) / 2) // 5050
	got := sum.Load()
	if got != want {
		fmt.Printf("MISMATCH: want=%d got=%d\n", want, got)
		return
	}
	fmt.Printf("OK %d\n", got)
}
```

**Test:**

```ts
it("goroutines aggregate", async () => {
  const result = await runCentralizedProgram({
    programPath: join(binDir, "go-goroutines.wasm"),
    timeout: 30_000,
  });
  expect(result.stdout).toBe("OK 5050\n");
  expect(result.exitCode).toBe(0);
});
```

Build, run, fix any gaps. Most likely surface: `poll_oneoff` with timeout-only subscription. Verify `host/src/wasi-shim.ts:poll_oneoff` correctly handles the case `subscriptions.len == 1, subscriptions[0].u.tag == EVENTTYPE_CLOCK`.

Commit:

```
feat(go): cooperative scheduler smoke — 100 goroutines

100 goroutines, each adding their index to a shared atomic, joined
via sync.WaitGroup. Verifies Go's wasm scheduler runs end-to-end
on a single OS thread inside our worker, and that poll_oneoff with
a timeout-only subscription does not stall the runtime.
```

---

## Phase 5 — Directory walk (RISK PHASE)

`fd_readdir` is the highest-risk surface per design §4. Layout errors are silent corruption, not crashes. Approach: write the layout test first, in `wasi-shim.test.ts`, before touching the Go side.

**Branch:** `emdash/explore-go-wasm-dirwalk` (off Phase 4).

### Task 5.1 — Pre-flight: write a `fd_readdir` layout unit test

Add to `host/test/wasi-shim.test.ts` a fixture that:

- Pre-populates the kernel VFS with a known directory containing 3 entries (`a`, `b`, `c.txt`).
- Calls `fd_readdir(dirfd, buf, buflen, cookie=0)` via a hand-written WAT fixture or via direct `WasiShim` instantiation against a mock memory.
- Asserts the buffer bytes exactly match the WASI dirent layout: for each entry, `(d_next: u64, d_ino: u64, d_namlen: u32, d_type: u8)` (24 bytes header, padded to alignment) followed by the name bytes (no NUL terminator), then the next entry.

Reference: WASI Preview 1 dirent layout — `wasi_unstable.h` from the WASI SDK; cross-check against Go's `src/syscall/fs_wasip1.go` `direntReadDirent`.

If the shim's emitted bytes diverge, fix in this PR. Make this test the regression guard.

### Task 5.2 — Program

`examples/libs/go/programs/dirwalk/main.go`:

```go
package main

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
)

func main() {
	root := "/etc"
	var names []string
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		names = append(names, path)
		return nil
	})
	if err != nil {
		fmt.Println("WALK_ERR:", err)
		return
	}
	sort.Strings(names)
	for _, n := range names {
		fmt.Println(n)
	}
}
```

### Task 5.3 — Test

The expected output depends on what's in `/etc` for the test process. Use a kernel image fragment with a known `/etc` (e.g., the dinit demo's image, or set up a small VFS prefix in the test helper). Assert each path appears.

If the test helper doesn't populate `/etc`, add a setup step that creates a small known directory (`/tmp/dirwalk-fixture/{a,b,c.txt}`) and walk that instead; deterministic and self-contained.

```ts
it("WalkDir over /tmp/dirwalk-fixture", async () => {
  // Setup is part of the program: it creates the fixture before walking.
  const result = await runCentralizedProgram({
    programPath: join(binDir, "go-dirwalk.wasm"),
    timeout: 30_000,
  });
  expect(result.exitCode).toBe(0);
  // Check expected entries are in stdout (order-stable due to sort)
  expect(result.stdout).toContain("/tmp/dirwalk-fixture\n");
  expect(result.stdout).toContain("/tmp/dirwalk-fixture/a\n");
  expect(result.stdout).toContain("/tmp/dirwalk-fixture/b\n");
  expect(result.stdout).toContain("/tmp/dirwalk-fixture/c.txt\n");
});
```

Adjust the Go program to set up the fixture (`os.MkdirAll`, `os.Create`) before walking, so the test is self-contained.

### Task 5.4 — Fix any drift

If Go reports zero entries, or wrong entries, return to Task 5.1 and harden the dirent layout test. Common bugs:

- `d_namlen` written as `u16` instead of `u32` — Go reads 4 bytes, gets garbage.
- Missing alignment padding between entries — Go's reader skips by `24 + d_namlen`, ours emits with implicit padding.
- `d_type` mapped from kernel filetype incorrectly (`DT_REG` vs. WASI's `FILETYPE_REGULAR_FILE`).

Each fix lands in `host/src/wasi-shim.ts` with a complementary assertion in `wasi-shim.test.ts`.

### Task 5.5 — Commit

```
feat(go): directory walk — filepath.WalkDir

Validates the shim's fd_readdir against Go's specific dirent reader
in src/syscall/fs_wasip1.go. Adds a byte-level layout test in
wasi-shim.test.ts to regression-guard the layout against future
shim changes. Walks a self-populated /tmp/dirwalk-fixture, asserts
all entries surface in sort order.
```

---

## Phase 6 — Time / sleep / monotonic clock

Smoke for `clock_time_get(REALTIME)`, `clock_time_get(MONOTONIC)`, and `poll_oneoff` with one CLOCK subscription used by `time.Sleep`.

**Branch:** `emdash/explore-go-wasm-time` (off Phase 5).

**Program:**

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	start := time.Now()
	for i := 0; i < 5; i++ {
		time.Sleep(10 * time.Millisecond)
	}
	elapsed := time.Since(start)

	if elapsed < 50*time.Millisecond {
		fmt.Printf("TOO_FAST: %v\n", elapsed)
		return
	}
	if elapsed > 5*time.Second {
		fmt.Printf("TOO_SLOW: %v\n", elapsed)
		return
	}
	fmt.Println("OK")
}
```

The 5-second upper bound is generous so a slow CI runner doesn't fail spuriously. The lower bound enforces that `time.Sleep` actually sleeps (vs. returning immediately).

**Test:**

```ts
it("time.Sleep advances monotonic clock", async () => {
  const result = await runCentralizedProgram({
    programPath: join(binDir, "go-time.wasm"),
    timeout: 30_000,
  });
  expect(result.stdout).toBe("OK\n");
  expect(result.exitCode).toBe(0);
});
```

Commit:

```
feat(go): time smoke — Sleep, Now, monotonic clock

5x time.Sleep(10ms); asserts elapsed in [50ms, 5s]. Exercises
clock_time_get(REALTIME), clock_time_get(MONOTONIC), and the
poll_oneoff CLOCK-subscription path.
```

---

## Phase 7 — Documentation

**Branch:** `emdash/explore-go-wasm-docs` (off Phase 6).

### Task 7.1 — `docs/posix-status.md`

Add a "Go (`GOOS=wasip1`)" subsection: what works (file I/O, time, goroutines, dirwalk), what doesn't (networking, `os/exec`, CGo, threads), and a pointer to the design doc.

### Task 7.2 — `docs/porting-guide.md`

Add a Go subsection: how to build, what `wasm32posix-go` does, where artifacts land, how to add a new Go example program.

### Task 7.3 — `README.md`

Update the "Ported software" or equivalent list to include Go alongside CPython, PHP, Erlang, Ruby, Perl, etc. Note v1 limitations.

### Task 7.4 — `examples/libs/go/README.md`

A one-pager: build instructions, list of example programs, known limitations, "how to add your own Go program" steps.

### Task 7.5 — Optional: register in `run-example.ts` if applicable

If the kernel has a runnable-demo registry (`run.sh examples`, etc.), add `go-hello`/etc. so they appear as runnable demos.

Commit:

```
docs(go): port status, build instructions, known limitations

Documents the Go wasip1 port across docs/posix-status.md,
docs/porting-guide.md, README.md, and a port-local README.
Captures v1 limitations (no networking, no os/exec, no CGo,
single-threaded scheduler) so users hit them at "before they
write the program," not at "their program crashes at runtime."
```

---

## Phase 8+ — Decision point (post-merge)

After Phase 7 lands and the series passes Brandon's review, evaluate:

1. **Networking from Go.** Cost of `dispatchrun/net` (a Go module that wraps additional WASI host imports we'd implement) vs. patching Go's runtime. Likely a v2 design doc on its own; not in this scope.
2. **TinyGo support.** Reuse the same shim, build path, and test harness. Small standalone effort; v3.
3. **`GOOS=wasip2` once Go ships native support.** Track upstream golang/go#65333 + #77141. Requires the kernel to add a host adapter for component-model Wasm.
4. **Pre-bake popular Go programs into a demo VFS image.** gopls (without networking), hugo (without networking), syft, etc. — separate v2 design.

None of these are blockers for the current series. Each becomes its own design+plan+implementation track on the same `emdash/explore-go-wasm-` branch family.

---

## Post-series checklist

Before requesting Brandon's review for the full series:

- [ ] All seven phases land on their respective branches.
- [ ] Each PR's verification gauntlet passes locally.
- [ ] No `ABI_VERSION` change; `abi/snapshot.json` unchanged.
- [ ] `examples/libs/go/build-go.sh` runs clean from a fresh worktree without manual setup (modulo the host-Go download).
- [ ] `cd host && npx vitest run test/go-wasip1.test.ts` reports 5/5 pass.
- [ ] `cd host && npx vitest run test/wasi-shim.test.ts` reports 4/4 pass (existing 2 + Phase 1 new + Phase 5 dirent layout).
- [ ] `docs/plans/2026-04-29-go-wasm-design.md` and this plan are referenced from the README or porting guide so a future contributor can find them.
- [ ] The full series is rebased onto the latest `main` cleanly (no merge conflicts).

Once green: open the umbrella PR (squash-merge candidate) against `brandonpayton/wasm-posix-kernel:main` for Brandon's review. Per the workflow: **no merge into upstream main without Brandon's explicit approval**.
