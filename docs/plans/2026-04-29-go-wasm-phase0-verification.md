# Go (`GOOS=wasip1`) on the kernel — Phase 0 Verification

Date: 2026-04-29
Branch: `emdash/explore-go-wasm-phase0-verify`
Companion to: [`2026-04-29-go-wasm-design.md`](./2026-04-29-go-wasm-design.md), [`2026-04-29-go-wasm-plan.md`](./2026-04-29-go-wasm-plan.md)

## §1. Outcome

**Go-toolchain side: green.** Stock Go 1.24.2 cross-compiles `hello.go` to `wasip1`. Every WASI import the resulting binary uses (16 imports, 15 distinct functions) is implemented by `host/src/wasi-shim.ts`. Memory layout matches the design's prediction: Go exports memory rather than importing it, requiring the Phase 1 shim relaxation but no other shim changes.

**Baseline gauntlet side: deferred.** `scripts/fetch-binaries.sh` against the lockfile pinned by `a13a6879` (`binaries-abi-v6-2026-04-29`) hit a sha256 mismatch on `manifest.json` that is reproducible across `--force`. Documented in §5 below as a pre-existing environment issue distinct from the Go work; subsequent phases will run the gauntlet via `bash build.sh` (build kernel from source) instead of pre-built fetch.

## §2. Host Go toolchain

```
$ uname -sm
Darwin arm64

$ ls /tmp/go.tar.gz   # downloaded from go.dev/dl/go1.24.2.darwin-arm64.tar.gz
go.tar.gz

$ shasum -a 256 /tmp/go.tar.gz
b70f8b3c5b4ccb0ad4ffa5ee91cd38075df20fdbd953a1daedd47f50fbcff47a  /tmp/go.tar.gz

$ sdk/go-host/bin/go version
go version go1.24.2 darwin/arm64
```

This SHA-256 is the value that goes into `examples/libs/go/deps.toml` `[source].sha256` in Phase 2 for the `darwin-arm64` host. (Linux/amd64 will get its own per-host hash; the build script picks the right tarball.)

`sdk/go-host/` is `.gitignored` — host toolchain is never committed. Total install size is ~340 MB (typical Go release).

## §3. Hello world cross-compilation

```bash
cat > /tmp/hi.go <<'EOF'
package main
import "fmt"
func main() { fmt.Println("hi") }
EOF

GOOS=wasip1 GOARCH=wasm CGO_ENABLED=0 \
  sdk/go-host/bin/go build -ldflags="-s -w" -o /tmp/hi.wasm /tmp/hi.go
```

Result:

| Artifact | Size |
|---|---|
| `hi.wasm` (stripped, `-ldflags="-s -w"`) | 2,386,810 bytes (~2.3 MB) |
| `hi-unstripped.wasm` (default ldflags) | 2,432,840 bytes (~2.4 MB) |

Strip savings are modest (~46 KB / 2%). Confirms the design's choice to strip by default: minor size win, zero runtime cost. Override-able via `-ldflags=""` from the user's invocation.

## §4. Import set

Captured via `wasm-objdump -x -j Import /tmp/hi.wasm`:

| # | WASI import | Sig | Implemented in `wasi-shim.ts` |
|---|---|---|---|
| 0 | `sched_yield` | `() → i32` | line 602 / 1233 |
| 1 | `proc_exit` | `(i32) → ()` | line 600 |
| 2 | `args_get` | `(i32 i32) → i32` | line 562 |
| 3 | `args_sizes_get` | `(i32 i32) → i32` | line 563 |
| 4 | `clock_time_get` | `(i32 i64 i32) → i32` | line 598 |
| 5 | `environ_get` | `(i32 i32) → i32` | line 564 |
| 6 | `environ_sizes_get` | `(i32 i32) → i32` | line 565 |
| 7 | `fd_write` | `(i32 i32 i32 i32) → i32` | line 570 |
| 8 | `random_get` | `(i32 i32) → i32` | line 597 |
| 9 | `poll_oneoff` | `(i32 i32 i32 i32) → i32` | line 603 |
| 10 | `fd_close` | `(i32) → i32` | line 568 |
| 11 | `fd_write` *(second binding)* | `(i32 i32 i32 i32) → i32` | line 570 |
| 12 | `fd_fdstat_get` | `(i32 i32) → i32` | line 577 |
| 13 | `fd_fdstat_set_flags` | `(i32 i32) → i32` | line 578 |
| 14 | `fd_prestat_get` | `(i32 i32) → i32` | line 566 |
| 15 | `fd_prestat_dir_name` | `(i32 i32 i32) → i32` | line 567 |

**Coverage: 16/16 imports resolved by the shim. No new shim functions required for hello-world.**

Two bindings of `fd_write` is a Go-toolchain artifact (the runtime imports it once for `print`/panic, the `os` package imports it again via `internal/poll`). Both resolve to the same shim method; no special handling needed.

The set is a strict subset of the ~45 imports the shim provides. None of the shim's "unused-by-Go" imports (`fd_renumber`, `fd_advise`, `path_link`, `proc_raise`, `sock_*`) are referenced. Go-stdlib programs that use file I/O, time, or directories will pull in additional imports beyond this hello-world set; phases 3–6 surface those.

## §5. Memory configuration

```
$ wasm-objdump -x -j Memory /tmp/hi.wasm
Memory[1]:
 - memory[0] pages: initial=36

$ wasm-objdump -x -j Export /tmp/hi.wasm
Export[2]:
 - func[1293] <_start> -> "_start"
 - memory[0] -> "memory"
```

**Confirms the design's central claim:**

- Go's wasip1 linker emits **one** memory.
- That memory is **defined** by the module (no `Import` section entry for `memory`).
- That memory is **exported** as `"memory"` — making it accessible to the host post-instantiation.
- Initial size: 36 pages = 2,359,296 bytes (~2.25 MB).

Stock Go does **not** import `env.memory`. The current shim's rejection at `host/src/worker-main.ts:540` is the only structural blocker — Phase 1 is necessary and sufficient on this dimension. Re-binding `WasiShim` to `instance.exports.memory` post-instantiation is the right shape.

## §6. Baseline gauntlet — deferred

The plan's Task 0.1 calls for running the full CLAUDE.md verification gauntlet on the current branch as a baseline. Two of the five suites need pre-built kernel binaries fetched via `scripts/fetch-binaries.sh`:

```
$ scripts/fetch-binaries.sh
fetch-binaries: release=binaries-abi-v6-2026-04-29 abi=6
  downloading manifest.json...
ERROR: sha256 mismatch for binaries/objects/ae54cf9fa708d00...json.partial
  expected: ae54cf9fa708d00680e10fb516e146c020b6aa594a940feb60c3a5421b6cd156
  got:      64a939d052b8e3baaf96ce9e834c8b789b17aca2b3ef3050be0d2ed4ff7fe631

$ scripts/fetch-binaries.sh --force
[same mismatch, reproducible]
```

The `manifest.json` returned by the GitHub release matches a different content hash than the one pinned in `binaries.lock`. This is **not** a Go-port issue:

- `binaries.lock` was last updated by `a13a6879` (`chore(binaries): bump lockfile to binaries-abi-v6-2026-04-29 (#372)`), the most recent commit on `main`.
- This branch (`emdash/explore-go-wasm-phase0-verify`) is a docs-only descendant of `main` via `emdash/explore-go-wasm-ism77` and `emdash/explore-go-wasm-plan`. It cannot have changed `binaries.lock`.
- The discrepancy is between the lockfile and the GitHub release — likely a re-published manifest with different contents, or a transient mirror inconsistency.

**Decision.** Subsequent phases run the gauntlet by **building the kernel from source** (`bash build.sh`) rather than fetching pre-built binaries. This is the path Brandon's CI takes anyway. The `fetch-binaries.sh` discrepancy is reported separately (out of scope of this design); it does not block Go-port progress because:

- Tests that require `kernel.wasm` resolve via `local-binaries/kernel.wasm` first (per `binary-resolver.ts:80`), and `bash build.sh` populates `local-binaries/` from a source build.
- Vitest tests that don't touch the kernel (e.g. the shim layout unit tests added in Phase 5) can run independently.

Phases 1+ will gate test execution behind `bash build.sh` as the baseline-availability gate.

## §7. Risks confirmed by Phase 0

- **Phase 1 is necessary.** Confirmed — Go exports memory; the shim rejects exported-memory modules. (Already in the plan.)
- **No other shim shape changes required for hello-world.** Confirmed — all 16 imports resolve. Subsequent phases (3–6) will exercise additional imports (`path_open`, `fd_read`, `fd_readdir`, `path_filestat_get`) whose correctness can only be assessed at runtime against real Go calls; that's why each gets its own focused phase.
- **Binary size as predicted.** ~2.3 MB stripped; matches Go's known wasip1 baseline. No size optimization work is in scope.
- **Toolchain pinned to 1.24.2.** Newer 1.25.x releases may shift the import set (Go has historically added/removed imports at minor versions — e.g. `fd_pread`/`fd_pwrite` were added in 1.21). Pin in `deps.toml`; bump explicitly when we want to.

## §8. Decision: proceed to Phase 1

Phase 0's question — *"is the existing shim enough for Go, or are we building shim infrastructure?"* — is answered: **the existing shim is enough modulo the imported-memory constraint.** Phase 1 (relax that constraint) is small (~30 LoC TypeScript) and self-contained. Phase 2 (skeleton) is unblocked once Phase 1 lands.

No design adjustments needed. Proceed.
