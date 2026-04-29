# Claude Code CLI on `node.wasm` — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task.

**Goal:** Run `@anthropic-ai/claude-code@^1.0.x` (the pure-JS `cli.js`
line) against the existing `node.wasm` (QuickJS-NG + bootstrap.js) inside
this kernel, with the Bash/Read/Edit/Grep tools functional and prompts
streaming back from `api.anthropic.com` over HTTPS+SSE.

**Architecture:** No kernel changes. Extend `bootstrap.js` to fill in the
Node API gaps Claude Code touches (tty raw mode, real `child_process`,
real crypto, real https/fetch, fake worker_threads). Port OpenSSL 3.x as
a userspace library so the TLS / hash / HMAC bridges have something to
link against. Vendor `cli.js` + `sdk.mjs` + a Mozilla CA bundle into a
`claude-code` package; install at `/usr/lib/claude/` with a `dash`
wrapper at `/usr/local/bin/claude`. Companion design doc:
`docs/plans/2026-04-29-claude-code-cli-design.md`.

**Tech stack:** TypeScript + Vitest (host integration tests),
QuickJS-NG / `bootstrap.js` (runtime), C with `wasm32posix-cc` (TLS +
crypto bridges, OpenSSL build), Rust with `cargo` cross-compile (ripgrep,
last PR), shell (build orchestration).

**Five PRs, single coordinated merge.** Each task is committed as a
single commit. Five PR boundaries are marked. **None merge** until PR
#4's integration test passes AND Brandon validates. Per the user's
durable instruction: "we won't merge any PR before validation of
Brandon."

**Verification gauntlet** (CLAUDE.md): all six must pass with zero
regressions before any PR is opened, and re-run after each PR's commits
land:

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
# manual: browser-demo verification only required if a phase changes
# anything browser-shaped — none of phases A–E do.
```

`XFAIL` / `TIME` are acceptable; `FAIL` that isn't pre-existing is a
regression.

**ABI expectation: zero bumps.** No phase below changes channel layout,
syscall numbers, marshalled structs, asyncify slots, or kernel-wasm
exports. If `check-abi-version.sh` reports drift after any task — stop,
audit, do not bump and proceed.

**Branch model** (per the user's durable instructions):

- `emdash/explore-claude-code-wasm-jdq9w` — design PR (already open at
  https://github.com/mho22/wasm-posix-kernel/pull/11)
- `emdash/plan-claude-code-wasm` — this PR (plan doc)
- `emdash/build-claude-code-wasm-phase-a` — Phase A (OpenSSL)
- `emdash/build-claude-code-wasm-phase-b` — Phase B (bootstrap shims)
- `emdash/build-claude-code-wasm-phase-c` — Phase C (https + fetch)
- `emdash/build-claude-code-wasm-phase-d` — Phase D (claude-code pkg)
- `emdash/build-claude-code-wasm-phase-e` — Phase E (ripgrep)

Each phase branches off the previous. PRs target `mho22/main` (the
user's fork) first. Brandon merges into upstream `wasm-posix-kernel/main`
when satisfied; we never merge upstream ourselves.

---

## Phase A — OpenSSL 3.x library port (PR #1)

> **Discovery on first inspection (2026-04-29):** OpenSSL 3.3.2 is
> **already** in tree at `examples/libs/openssl/` — manifest, build
> script, smoke C test (`ssl_basic.c`), HTTPS GET test (`https_get.c`),
> and a `binaries-abi-v6` release archive at
> `https://github.com/brandonpayton/wasm-posix-kernel/releases/download/binaries-abi-v6/openssl-3.3.2-rev1-abi6-wasm32-07647f0c.tar.zst`.
> `curl.wasm` 8.11.1 is also shipped, which means **real HTTPS through
> the kernel already works end-to-end**. Phase A reduces from "build
> OpenSSL" to "validate the existing build is still usable for the TLS
> bridge in Phase C, run the gauntlet, document." The original task
> spec below is preserved for archival reasons; tasks A1/A2 collapse to
> a no-op gauntlet pass.

The TLS + crypto bridges in Phases B/C link against `libssl.a` and
`libcrypto.a`. Both are already built and shipped.

### Task A1: Vendor OpenSSL source

**Files:**
- Create: `examples/libs/openssl/build-openssl.sh`
- Create: `examples/libs/openssl/deps.toml`

**Step 1: Manifest**

```toml
# examples/libs/openssl/deps.toml
kind = "library"
name = "openssl"
version = "3.3.0"
revision = 1
depends_on = []

[source]
url = "https://www.openssl.org/source/openssl-3.3.0.tar.gz"
sha256 = "53e66b043322a606abf0087e7699a0e033a37fa13feb9742df35c3a33b18fb02"

[license]
spdx = "Apache-2.0"
url = "https://www.openssl.org/source/license-openssl-ssleay.txt"

[build]
script = "build-openssl.sh"

[[outputs]]
name = "libssl"
path = "lib/libssl.a"

[[outputs]]
name = "libcrypto"
path = "lib/libcrypto.a"
```

**Step 2: Build script**

```bash
#!/usr/bin/env bash
# examples/libs/openssl/build-openssl.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
SRC="$HERE/openssl-src"
BUILD="$HERE/build"
SYSROOT="$REPO/sysroot"

[ -d "$SRC" ] || (
  curl -fsSLO https://www.openssl.org/source/openssl-3.3.0.tar.gz
  tar xf openssl-3.3.0.tar.gz
  mv openssl-3.3.0 "$SRC"
)

mkdir -p "$BUILD" "$HERE/lib" "$HERE/include"
cd "$BUILD"

CC=wasm32posix-cc \
AR=wasm32posix-ar \
RANLIB=wasm32posix-ranlib \
"$SRC/Configure" \
  no-asm no-threads no-dso no-engine no-dynamic-engine \
  no-tests no-apps no-shared no-quic no-uplink \
  no-aria no-bf no-camellia no-cast no-idea no-mdc2 \
  no-rc2 no-rc4 no-seed no-sm2 no-sm3 no-sm4 \
  --prefix="$HERE" \
  --openssldir="$HERE/openssl" \
  --cross-compile-prefix="" \
  linux-generic32

make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu)" build_libs
make install_dev

# Install headers into sysroot for downstream consumers
mkdir -p "$SYSROOT/include/openssl"
cp -R "$HERE/include/openssl/." "$SYSROOT/include/openssl/"

# Smoke
[ -f "$HERE/lib/libssl.a" ] || { echo "libssl.a missing"; exit 1; }
[ -f "$HERE/lib/libcrypto.a" ] || { echo "libcrypto.a missing"; exit 1; }

echo "OpenSSL libs built: $(wc -c < "$HERE/lib/libssl.a") B libssl, $(wc -c < "$HERE/lib/libcrypto.a") B libcrypto"

source "$REPO/scripts/install-local-binary.sh"
install_local_library openssl "$HERE/lib/libssl.a" libssl.a
install_local_library openssl "$HERE/lib/libcrypto.a" libcrypto.a
```

The `linux-generic32` config is the closest stock Configure target to
wasm32: 32-bit pointers, no asm. `no-threads` is required (kernel
pthread support is for user-space; OpenSSL's internal threading layer
brings in `<pthread.h>` calls our musl provides but that QuickJS won't
exercise). `no-dso`/`no-dynamic-engine` rule out `dlopen` paths we
don't need. The full no-list is borrowed from
`docs/plans/2026-03-14-openssl-plan.md`.

**Step 3: Run**

```bash
bash examples/libs/openssl/build-openssl.sh
ls -la examples/libs/openssl/lib/
```

Expected: `libssl.a` and `libcrypto.a` exist, ~3-5 MB each.

**Step 4: Pitfalls (handle if surfaced, not pre-emptively)**

- **`ARCH=` autodetection picks the host.** Force `--cross-compile-prefix=""` (Configure won't shell-prefix tools then) and rely on `CC=wasm32posix-cc` taking control. If Configure still tries to pick `linux-x86_64`, hand-edit `configdata.pm` to write `KERNEL_BITS=32`.
- **`<sys/random.h>` missing.** OpenSSL's RNG seeder probes for `getentropy()` / `getrandom()` / `/dev/urandom`. The kernel exposes `/dev/urandom`; OpenSSL's fallback path uses it. Verify by `nm libcrypto.a | grep getrandom` after build — if the symbol is unresolved at the bridge link in Phase B/C, replace with `RAND_bytes(...)` calls that internally read `/dev/urandom`.
- **`<setjmp.h>`.** musl-overlay already provides it; no action.
- **`<sys/socket.h>`.** Already in sysroot.

**Step 5: Commit**

```bash
git add examples/libs/openssl/
git commit -m "openssl(libs): cross-compile OpenSSL 3.3.0 libssl/libcrypto for wasm32"
```

---

### Task A2: OpenSSL smoke test (TLS handshake against localhost)

**Files:**
- Create: `tools/openssl-smoke.c`
- Modify: `host/test/openssl-smoke.test.ts`

**Step 1: C smoke**

```c
// tools/openssl-smoke.c — minimal TLS client smoke test
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <openssl/ssl.h>
#include <openssl/err.h>

int main(int argc, char** argv) {
    if (argc != 3) { fprintf(stderr, "usage: %s host port\n", argv[0]); return 2; }
    const char* host = argv[1];
    int port = atoi(argv[2]);

    SSL_library_init();
    SSL_load_error_strings();
    SSL_CTX* ctx = SSL_CTX_new(TLS_client_method());
    if (!ctx) { ERR_print_errors_fp(stderr); return 1; }
    SSL_CTX_set_default_verify_paths(ctx);

    int fd = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in sin = { .sin_family = AF_INET, .sin_port = htons(port) };
    inet_aton(host, &sin.sin_addr);
    if (connect(fd, (void*)&sin, sizeof sin) < 0) { perror("connect"); return 1; }

    SSL* ssl = SSL_new(ctx);
    SSL_set_fd(ssl, fd);
    SSL_set_tlsext_host_name(ssl, host);
    if (SSL_connect(ssl) != 1) { ERR_print_errors_fp(stderr); return 1; }

    const char req[] = "GET / HTTP/1.0\r\nHost: example.com\r\n\r\n";
    SSL_write(ssl, req, sizeof req - 1);

    char buf[1024]; int n = SSL_read(ssl, buf, sizeof buf - 1);
    if (n > 0) { buf[n] = 0; printf("%.40s\n", buf); }

    SSL_shutdown(ssl); SSL_free(ssl); close(fd); SSL_CTX_free(ctx);
    return n > 0 ? 0 : 1;
}
```

Add to `scripts/build-programs.sh` so it produces
`build/test-programs/openssl-smoke.wasm`. Compile flags pull
`libssl.a -lcrypto`:

```bash
$CC -O2 tools/openssl-smoke.c \
    "$REPO/examples/libs/openssl/lib/libssl.a" \
    "$REPO/examples/libs/openssl/lib/libcrypto.a" \
    -o build/test-programs/openssl-smoke.wasm
```

**Step 2: Vitest helper that talks to a real localhost TLS endpoint**

```ts
// host/test/openssl-smoke.test.ts
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createServer } from 'node:tls';
import { runProgram } from './centralized-test-helper.js';
import { generateSelfSignedCertSync } from './tls-cert-fixture.js';

let server: any;
let port: number;
beforeAll(async () => {
  const { key, cert } = generateSelfSignedCertSync('127.0.0.1');
  server = createServer({ key, cert }, (sock) => {
    sock.write('HTTP/1.0 200 OK\r\n\r\nhello-tls\n');
    sock.end();
  });
  port = await new Promise<number>(r => server.listen(0, () => r(server.address().port)));
});
afterAll(() => server.close());

describe('openssl smoke', () => {
  it('completes a TLS handshake to localhost and reads the response', async () => {
    const { stdout, code } = await runProgram(
      'build/test-programs/openssl-smoke.wasm',
      ['127.0.0.1', String(port)],
      { env: ['SSL_CERT_FILE=' + selfSignedCertPath()] },
    );
    expect(code).toBe(0);
    expect(stdout).toMatch(/HTTP\/1\.0 200/);
  });
});
```

`generateSelfSignedCertSync` uses Node's `node-forge` or
`selfsigned` to make a 1-day cert; `selfSignedCertPath()` writes
the cert to a tmpfile so the kernel-side process can verify against
it via `SSL_CERT_FILE`.

**Step 3: Run**

```bash
(cd host && npx vitest run openssl-smoke)
```

Expected: pass. If TLS fails: trace `ERR_print_errors_fp` output —
most likely `cert verify failed`, fix by ensuring `SSL_CERT_FILE`
points at the self-signed CA the test fixture serves.

**Step 4: Commit**

```bash
git add tools/openssl-smoke.c scripts/build-programs.sh \
        host/test/openssl-smoke.test.ts host/test/tls-cert-fixture.ts
git commit -m "openssl(smoke): TLS handshake test — wasm program → host TLS server"
```

---

### Task A3: Phase A — gauntlet + open PR #1

**Files:** none (verification only)

**Step 1:** run all six suites listed at the top of this file.

**Step 2:** push and open PR

```bash
git push -u origin emdash/build-claude-code-wasm-phase-a
gh pr create --repo mho22/wasm-posix-kernel --base main \
  --head emdash/build-claude-code-wasm-phase-a --draft \
  --title "openssl(libs): OpenSSL 3.3.0 cross-compile + TLS smoke test" \
  --body "..."
```

PR body: link to design + plan, summarise what landed, note this is part 1/5 of the Claude Code stack. Mark the PR Draft, hold for Brandon's review.

---

## Phase B — bootstrap.js: TTY + child_process + crypto + worker_threads (PR #2)

This phase rebuilds `node.wasm` against an extended `bootstrap.js` plus a
new C bridge module. No new wasm dependency yet — the crypto bridge
links against the Phase A `libcrypto.a`. After this phase, `node` can:
flip TTY raw mode, fork+exec subprocesses with live pipes, hash
`sha256` content, generate UUIDs.

### Task B1: New branch from Phase A

```bash
git checkout emdash/build-claude-code-wasm-phase-a
git checkout -b emdash/build-claude-code-wasm-phase-b
```

(All Phase B tasks below commit on this branch.)

---

### Task B2: `tty.setRawMode` + termios save/restore

**Files:**
- Modify: `examples/libs/quickjs/node-compat/bootstrap.js` (the `tty`
  module section near line 2280–2300)

**Step 1: Failing test**

Append to `host/test/claude-code-bootstrap.test.ts` (create if absent):

```ts
import { describe, it, expect } from 'vitest';
import { runProgram } from './centralized-test-helper.js';

describe('bootstrap: tty', () => {
  it('setRawMode flips ICANON/ECHO and restores them', async () => {
    const { code, stdout } = await runProgram('/usr/local/bin/node', ['-e', `
      const tty = require('tty');
      const orig = process.stdin.isRaw;
      process.stdin.setRawMode(true);
      console.log('raw:', process.stdin.isRaw);
      process.stdin.setRawMode(false);
      console.log('restored:', process.stdin.isRaw);
    `], { withPty: true });
    expect(code).toBe(0);
    expect(stdout).toMatch(/raw: true/);
    expect(stdout).toMatch(/restored: false/);
  });
});
```

`withPty: true` makes the test helper allocate a pty so `isatty(0)` is
true; otherwise `setRawMode` no-ops on non-TTYs (correct behavior).

**Step 2: Run, observe failure**

```bash
(cd host && npx vitest run claude-code-bootstrap)
```

Expected: fails because today's `setRawMode` is a no-op stub.

**Step 3: Implement**

In `bootstrap.js`, locate the tty section (currently `// tty` near
line 2280) and replace the stubs. The implementation references
`os.ioctl(fd, TCGETS|TCSETS, buf)` — QuickJS-NG's `qjs:os` exposes
`ioctl` via `os.ioctl`; the wire format for termios is the kernel's
`Termios` struct (60 B on wasm32, see `crates/shared/src/termios.rs`).
Use a shared marshalling helper.

Sketch:

```js
// constants: pull from <termios.h> values the kernel uses
const TCGETS = 0x5401, TCSETS = 0x5402;
const ICANON = 0o0000002, ECHO = 0o0000010, ISIG = 0o0000001, IEXTEN = 0o0100000;
const IXON = 0o0002000, ICRNL = 0o0000400, INPCK = 0o0000020, ISTRIP = 0o0000040, BRKINT = 0o0000002;
const OPOST = 0o0000001;
const VMIN = 6, VTIME = 5;

function _tcgetattr(fd) {
  const buf = new Uint8Array(60);
  const rc = os.ioctl(fd, TCGETS, buf);
  if (rc < 0) throw _makeNodeError('tcgetattr', 'EIO', -rc, 'ioctl');
  return _parseTermios(buf);
}
function _tcsetattr(fd, when, t) {
  const buf = _serializeTermios(t);
  const rc = os.ioctl(fd, TCSETS, buf);
  if (rc < 0) throw _makeNodeError('tcsetattr', 'EIO', -rc, 'ioctl');
}

class TtyReadStream extends ReadStream {
  setRawMode(mode) {
    if (!this.isTTY) return this;
    if (!this._savedTermios) this._savedTermios = _tcgetattr(this._fd);
    if (mode) {
      const t = { ...this._savedTermios };
      t.c_lflag &= ~(ICANON | ECHO | ISIG | IEXTEN);
      t.c_iflag &= ~(IXON | ICRNL | INPCK | ISTRIP | BRKINT);
      t.c_oflag &= ~OPOST;
      t.c_cc[VMIN] = 1; t.c_cc[VTIME] = 0;
      _tcsetattr(this._fd, 0, t);
    } else {
      _tcsetattr(this._fd, 0, this._savedTermios);
    }
    this.isRaw = !!mode;
    return this;
  }
}

// Wire process.stdin to TtyReadStream when fd 0 is a TTY:
const _stdinTty = os.isatty(0);
process.stdin = _stdinTty ? new TtyReadStream(0) : new ReadStream(0);
```

Defensive cleanup on exit:

```js
process.on('exit', () => {
  if (process.stdin._savedTermios && process.stdin.isRaw) {
    try { _tcsetattr(0, 0, process.stdin._savedTermios); } catch {}
  }
});
['SIGINT','SIGTERM','SIGHUP'].forEach(sig => process.on(sig, () => {
  if (process.stdin._savedTermios && process.stdin.isRaw) {
    try { _tcsetattr(0, 0, process.stdin._savedTermios); } catch {}
  }
  process.exit(128 + (sig==='SIGINT'?2:sig==='SIGTERM'?15:1));
}));
```

**Step 4: Rebuild node.wasm + test**

```bash
bash examples/libs/quickjs/build-quickjs.sh
(cd host && npx vitest run claude-code-bootstrap)
```

Expected: green.

**Step 5: Commit**

```bash
git add examples/libs/quickjs/node-compat/bootstrap.js \
        host/test/claude-code-bootstrap.test.ts
git commit -m "node(tty): setRawMode wires to tcsetattr; restore on exit/signal"
```

---

### Task B3: `child_process.spawn` — real fork + execve + live pipes

**Files:**
- Modify: `examples/libs/quickjs/node-compat/bootstrap.js` (child_process
  section near line 2008)

**Step 1: Failing tests**

```ts
describe('bootstrap: child_process', () => {
  it('spawn echo emits stdout chunks asynchronously', async () => {
    const { code, stdout } = await runProgram('/usr/local/bin/node', ['-e', `
      const cp = require('child_process');
      const c = cp.spawn('/usr/bin/echo', ['hello']);
      c.stdout.on('data', d => process.stdout.write('data:' + d));
      c.on('exit', code => process.stdout.write('exit:' + code + '\\n'));
    `]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/data:hello/);
    expect(stdout).toMatch(/exit:0/);
  });

  it('spawn cat with piped stdin', async () => {
    const { code, stdout } = await runProgram('/usr/local/bin/node', ['-e', `
      const cp = require('child_process');
      const c = cp.spawn('/usr/bin/cat', [], { stdio: ['pipe','pipe','pipe'] });
      let out = '';
      c.stdout.on('data', d => out += d);
      c.on('exit', () => process.stdout.write(out));
      c.stdin.write('round-trip\\n');
      c.stdin.end();
    `]);
    expect(code).toBe(0);
    expect(stdout).toMatch(/round-trip/);
  });

  it('killing a spawned child emits exit with signal', async () => {
    // ... spawn sleep, kill SIGTERM, assert .signal === 'SIGTERM'
  });
});
```

**Step 2: Run, observe failure** (current impl uses `std.popen` and
emits everything at once after sync completion)

**Step 3: Implement**

In `bootstrap.js`, replace the `child_process` body. Key pieces:

```js
class ChildProcess extends EventEmitter {
  constructor(pid, stdinFd, stdoutFd, stderrFd) {
    super();
    this.pid = pid;
    this.stdin  = stdinFd  != null ? new Writable({ write: (c, _e, cb) => { os.write(stdinFd, _bufToAB(c)); cb(); }, final: cb => { os.close(stdinFd); cb(); }}) : null;
    this.stdout = stdoutFd != null ? _readableFromFd(stdoutFd) : null;
    this.stderr = stderrFd != null ? _readableFromFd(stderrFd) : null;
    this._waitTimer = setInterval(() => this._reap(), 25);
  }
  _reap() {
    const [rc, status] = os.waitpid(this.pid, os.WNOHANG);
    if (rc === 0) return;
    clearInterval(this._waitTimer);
    if (os.WIFEXITED(status)) { this.exitCode = os.WEXITSTATUS(status); this.emit('exit', this.exitCode, null); }
    else if (os.WIFSIGNALED(status)) { this.signalCode = _signoToName(os.WTERMSIG(status)); this.emit('exit', null, this.signalCode); }
    this.emit('close', this.exitCode ?? null, this.signalCode ?? null);
  }
  kill(signal) {
    const sig = typeof signal === 'string' ? _signoFromName(signal) : (signal ?? 15);
    return os.kill(this.pid, sig) === 0;
  }
}

function _readableFromFd(fd) {
  const r = new Readable({ read() {} });
  // Non-blocking poll loop. Stop when EOF.
  os.fcntl(fd, os.F_SETFL, os.fcntl(fd, os.F_GETFL) | os.O_NONBLOCK);
  const tick = () => {
    const buf = new Uint8Array(4096);
    const n = os.read(fd, buf.buffer, 0, buf.length);
    if (n > 0) r.push(Buffer.from(buf.subarray(0, n)));
    else if (n === 0) { r.push(null); os.close(fd); return; }
    // n < 0 EAGAIN — try again next tick
    setTimeout(tick, 8);
  };
  setTimeout(tick, 0);
  return r;
}

function spawn(command, args = [], options = {}) {
  const stdio = options.stdio ?? ['pipe','pipe','pipe'];
  const inP  = stdio[0] === 'pipe' ? os.pipe() : null;
  const outP = stdio[1] === 'pipe' ? os.pipe() : null;
  const errP = stdio[2] === 'pipe' ? os.pipe() : null;
  const pid = os.fork();
  if (pid === 0) {
    if (inP)  { os.dup2(inP[0], 0); os.close(inP[0]); os.close(inP[1]); }
    if (outP) { os.dup2(outP[1], 1); os.close(outP[0]); os.close(outP[1]); }
    if (errP) { os.dup2(errP[1], 2); os.close(errP[0]); os.close(errP[1]); }
    if (options.cwd) os.chdir(options.cwd);
    const env = options.env ? Object.entries(options.env).map(([k,v]) => `${k}=${v}`) : null;
    if (env) {
      // QuickJS os.execvp doesn't take envp explicitly; clear+set process.env
      Object.keys(process.env).forEach(k => { delete process.env[k]; });
      Object.assign(process.env, options.env);
    }
    os.execvp(command, [command, ...args]);
    os._exit(127);  // exec failed
  }
  if (inP)  os.close(inP[0]);
  if (outP) os.close(outP[1]);
  if (errP) os.close(errP[1]);
  return new ChildProcess(pid, inP?.[1], outP?.[0], errP?.[0]);
}

function execFile(file, args, opts, cb) {
  if (typeof args === 'function') { cb = args; args = []; opts = {}; }
  if (typeof opts === 'function') { cb = opts; opts = {}; }
  const c = spawn(file, args, opts);
  let out = '', err = '';
  c.stdout?.on('data', d => out += d);
  c.stderr?.on('data', d => err += d);
  c.on('exit', code => cb && cb(code === 0 ? null : new Error(`exit ${code}`), out, err));
  return c;
}

function exec(cmd, opts, cb) { return execFile('/bin/sh', ['-c', cmd], opts, cb); }
function execSync(cmd, opts) {
  // Keep the existing std.popen impl for back-compat; it's strictly
  // synchronous and returns Buffer/string. Some callers depend on it.
  // Don't change.
}
```

`os.fork`, `os.execvp`, `os.pipe`, `os.dup2`, `os.waitpid`,
`os.WNOHANG`, `os.WIFEXITED`, `os.WEXITSTATUS`, `os.WIFSIGNALED`,
`os.WTERMSIG`, `os.kill`, `os.O_NONBLOCK`, `os.F_GETFL`, `os.F_SETFL`,
`os.fcntl`, `os._exit` — verify each is in QuickJS-NG `qjs:os`.
`os.execvp` is recent; if missing, expose via the existing
qjs-libc patch path (search `quickjs-libc.c` for `js_os_exec`).

**Step 4: Rebuild + test**

```bash
bash examples/libs/quickjs/build-quickjs.sh
(cd host && npx vitest run claude-code-bootstrap)
```

**Step 5: Commit**

```bash
git add examples/libs/quickjs/node-compat/bootstrap.js \
        host/test/claude-code-bootstrap.test.ts
git commit -m "node(child_process): real fork+exec spawn with live pipes and waitpid reap"
```

---

### Task B4: Crypto bridge module (`qjs-crypto-bridge.c`)

**Files:**
- Create: `examples/libs/quickjs/qjs-crypto-bridge.c`
- Modify: `examples/libs/quickjs/build-quickjs.sh` (link libcrypto.a)
- Modify: `examples/libs/quickjs/node-compat/bootstrap.js` (rewrite
  `crypto` module section near line 1373)

**Step 1: Failing tests**

```ts
it('crypto.createHash sha256 matches known hex', async () => {
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const c = require('crypto');
    process.stdout.write(c.createHash('sha256').update('abc').digest('hex'));
  `]);
  expect(stdout).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

it('crypto.createHmac sha256 matches known hex', async () => {
  // RFC 4231 test case 1: key="key", data="The quick brown fox jumps over the lazy dog"
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const c = require('crypto');
    const h = c.createHmac('sha256', 'key').update('The quick brown fox jumps over the lazy dog').digest('hex');
    process.stdout.write(h);
  `]);
  expect(stdout).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
});

it('crypto.randomUUID returns a valid v4 uuid', async () => {
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const c = require('crypto');
    process.stdout.write(c.randomUUID());
  `]);
  expect(stdout).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
```

**Step 2: Run, observe failure**

**Step 3: Implement bridge**

```c
// examples/libs/quickjs/qjs-crypto-bridge.c
#include "quickjs.h"
#include <openssl/evp.h>
#include <openssl/hmac.h>
#include <openssl/rand.h>
#include <string.h>

static JSClassID hash_class_id;
typedef struct { EVP_MD_CTX* ctx; } HashState;

static void hash_finalizer(JSRuntime* rt, JSValue val) {
    HashState* h = JS_GetOpaque(val, hash_class_id);
    if (h) { if (h->ctx) EVP_MD_CTX_free(h->ctx); js_free_rt(rt, h); }
}
static JSClassDef hash_class = { "Hash", .finalizer = hash_finalizer };

static JSValue js_create_hash(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
    const char* alg = JS_ToCString(ctx, argv[0]);
    if (!alg) return JS_EXCEPTION;
    const EVP_MD* md = EVP_get_digestbyname(alg);
    JS_FreeCString(ctx, alg);
    if (!md) return JS_ThrowTypeError(ctx, "unknown digest");
    HashState* h = js_mallocz(ctx, sizeof *h);
    h->ctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(h->ctx, md, NULL);
    JSValue obj = JS_NewObjectClass(ctx, hash_class_id);
    JS_SetOpaque(obj, h);
    return obj;
}
static JSValue js_hash_update(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
    HashState* h = JS_GetOpaque(this_val, hash_class_id);
    if (!h || !h->ctx) return JS_ThrowInternalError(ctx, "hash finalized");
    size_t len; uint8_t* buf;
    if (JS_IsString(argv[0])) {
        const char* s = JS_ToCStringLen(ctx, &len, argv[0]);
        EVP_DigestUpdate(h->ctx, s, len);
        JS_FreeCString(ctx, s);
    } else {
        buf = JS_GetArrayBuffer(ctx, &len, argv[0]);
        if (!buf) return JS_EXCEPTION;
        EVP_DigestUpdate(h->ctx, buf, len);
    }
    return JS_DupValue(ctx, this_val);  // chainable
}
static JSValue js_hash_digest(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
    HashState* h = JS_GetOpaque(this_val, hash_class_id);
    if (!h || !h->ctx) return JS_ThrowInternalError(ctx, "hash finalized");
    uint8_t out[EVP_MAX_MD_SIZE]; unsigned outlen;
    EVP_DigestFinal_ex(h->ctx, out, &outlen);
    EVP_MD_CTX_free(h->ctx); h->ctx = NULL;
    if (argc > 0 && JS_IsString(argv[0])) {
        const char* enc = JS_ToCString(ctx, argv[0]); JSValue ret;
        if (!strcmp(enc, "hex")) {
            char hex[2 * EVP_MAX_MD_SIZE + 1];
            for (unsigned i = 0; i < outlen; i++) sprintf(hex + 2*i, "%02x", out[i]);
            hex[2*outlen] = 0;
            ret = JS_NewString(ctx, hex);
        } else if (!strcmp(enc, "base64")) {
            // ... EVP_EncodeBlock
            ret = JS_UNDEFINED;
        } else ret = JS_ThrowTypeError(ctx, "unsupported encoding");
        JS_FreeCString(ctx, enc); return ret;
    }
    return JS_NewArrayBufferCopy(ctx, out, outlen);
}

// js_create_hmac, js_hmac_update, js_hmac_digest — same shape using HMAC_CTX*
// js_random_bytes, js_random_uuid — wrap RAND_bytes / format v4 UUID

// ... module init wires functions into qjs:crypto-bridge
```

`bootstrap.js` `crypto` module then becomes a thin JS wrapper around
`qjs:crypto-bridge` exposing the Node API surface (`createHash`,
`createHmac`, `randomBytes`, `randomUUID`, `timingSafeEqual`).

**Step 4: Wire into build**

In `build-quickjs.sh`, after the existing core compile:

```bash
$CC "${CFLAGS[@]}" -c "$SCRIPT_DIR/qjs-crypto-bridge.c" -o "$BIN_DIR/qjs-crypto-bridge.o"
NODE_OBJS+=("$BIN_DIR/qjs-crypto-bridge.o")
```

And in the link line, append:

```bash
"$REPO/examples/libs/openssl/lib/libcrypto.a"
```

The bridge's `qjs_init_module_crypto_bridge` is called from
`JS_NewNodeContext` in `node-main.c` (1 line addition).

**Step 5: Rebuild + test**

```bash
bash examples/libs/quickjs/build-quickjs.sh
(cd host && npx vitest run claude-code-bootstrap)
```

**Step 6: Commit**

```bash
git add examples/libs/quickjs/qjs-crypto-bridge.c \
        examples/libs/quickjs/build-quickjs.sh \
        examples/libs/quickjs/node-compat/bootstrap.js \
        examples/libs/quickjs/node-main.c \
        host/test/claude-code-bootstrap.test.ts
git commit -m "node(crypto): libcrypto-backed createHash/createHmac/randomUUID"
```

---

### Task B5: `worker_threads` inline-on-main

**Files:**
- Modify: `examples/libs/quickjs/node-compat/bootstrap.js` (worker_threads
  section near line 2333)

**Step 1: Failing test**

```ts
it('Worker round-trips a message via parentPort', async () => {
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const { Worker, isMainThread, parentPort } = require('worker_threads');
    if (isMainThread) {
      const w = new Worker(__filename);
      w.on('message', m => process.stdout.write('got:' + m + '\\n'));
      w.postMessage('ping');
    } else {
      parentPort.on('message', m => parentPort.postMessage(m + '-pong'));
    }
  `]);
  expect(stdout).toMatch(/got:ping-pong/);
});
```

**Step 2: Implement**

Replace the `worker_threads` stub:

```js
class MessagePort extends EventEmitter {
  constructor() { super(); this._peer = null; }
  postMessage(msg) {
    if (this._peer) {
      // Schedule on next microtask so listeners can attach first.
      Promise.resolve().then(() => this._peer.emit('message', _structuredClone(msg)));
    }
  }
  close() { this._peer = null; }
}
class MessageChannel {
  constructor() {
    this.port1 = new MessagePort(); this.port2 = new MessagePort();
    this.port1._peer = this.port2; this.port2._peer = this.port1;
  }
}
class Worker extends EventEmitter {
  constructor(scriptPath, opts = {}) {
    super();
    this._channel = new MessageChannel();
    this._channel.port1.on('message', m => this.emit('message', m));
    this._scope = {
      isMainThread: false,
      parentPort: this._channel.port2,
      workerData: opts.workerData ?? null,
    };
    // Defer: load the script the first time `postMessage` is called.
    this._scriptPath = scriptPath;
    this._loaded = false;
  }
  postMessage(msg) {
    if (!this._loaded) this._load();
    this._channel.port1.postMessage(msg);
  }
  _load() {
    const code = std.loadFile(this._scriptPath);
    // Snapshot main-thread require / module / __filename context, then
    // override worker_threads exports for the duration of the load.
    const wtPrev = require.cache.worker_threads;
    require.cache.worker_threads = this._scope;
    try { (new Function('require', 'module', 'exports', '__dirname', '__filename', code))(
      require, { exports: {} }, {}, _dirname(this._scriptPath), this._scriptPath
    ); } finally {
      if (wtPrev) require.cache.worker_threads = wtPrev;
      else delete require.cache.worker_threads;
    }
    this._loaded = true;
  }
  terminate() { this._channel.port1.close(); }
}

const _isMain = !process.env.WORKER_DATA_FD;
modules.worker_threads = {
  isMainThread: _isMain,
  parentPort: _isMain ? null : /* set by Worker._load */ null,
  workerData: null,
  Worker, MessagePort, MessageChannel,
};
```

`_structuredClone` is a JSON round-trip for v1 (sufficient for Claude
Code's worker payloads — strings + arrays + plain objects). Document the
limitation: no `SharedArrayBuffer` cross-worker (main-thread inline by
construction; everything *is* shared).

**Step 3: Rebuild + test**

**Step 4: Commit**

```bash
git commit -m "node(worker_threads): inline-on-main implementation w/ MessageChannel"
```

---

### Task B6: Phase B — gauntlet + open PR #2

```bash
git push -u origin emdash/build-claude-code-wasm-phase-b
gh pr create --repo mho22/wasm-posix-kernel --base main \
  --head emdash/build-claude-code-wasm-phase-b --draft \
  --title "node(bootstrap): real tty/spawn/crypto + inline worker_threads" \
  --body "..."
```

Body: link to design + plan, summarise shims, note 2/5.

---

## Phase C — bootstrap.js: https + fetch + zlib (PR #3)

The TLS-shaped bridge module + `https.request` + `fetch` polyfill, plus
zlib wired to the existing libz. After this phase, `node` can issue
real HTTPS requests (including SSE streams) to api.anthropic.com.

### Task C1: Branch from Phase B

```bash
git checkout emdash/build-claude-code-wasm-phase-b
git checkout -b emdash/build-claude-code-wasm-phase-c
```

### Task C2: TLS bridge module (`qjs-tls.c`)

**Files:**
- Create: `examples/libs/quickjs/qjs-tls.c`
- Modify: `examples/libs/quickjs/build-quickjs.sh` (link libssl.a)
- Modify: `examples/libs/quickjs/node-main.c` (call init_module)

**Step 1: Failing test**

```ts
it('qjs:tls module connects to localhost TLS server', async () => {
  // ... uses self-signed fixture from Phase A
  const { code, stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const tls = require('qjs:tls');  // raw bridge
    const h = tls.connect('127.0.0.1', PORT);
    tls.write(h, 'GET / HTTP/1.0\\r\\n\\r\\n');
    process.stdout.write(tls.read(h, 200));
    tls.close(h);
  `]);
  expect(stdout).toMatch(/HTTP\/1\.0 200/);
});
```

**Step 2: Implement bridge**

```c
// examples/libs/quickjs/qjs-tls.c
#include "quickjs.h"
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <openssl/x509v3.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <string.h>

static SSL_CTX* g_ctx = NULL;
static void ensure_ctx(void) {
    if (g_ctx) return;
    SSL_library_init();
    SSL_load_error_strings();
    g_ctx = SSL_CTX_new(TLS_client_method());
    SSL_CTX_set_default_verify_paths(g_ctx);
    // SSL_CTX_load_verify_locations(g_ctx, "/etc/ssl/certs/ca-certificates.crt", NULL);
}

typedef struct { int fd; SSL* ssl; } TlsConn;
static JSClassID tls_class_id;

static void tls_finalizer(JSRuntime* rt, JSValue val) {
    TlsConn* c = JS_GetOpaque(val, tls_class_id);
    if (!c) return;
    if (c->ssl) { SSL_shutdown(c->ssl); SSL_free(c->ssl); }
    if (c->fd >= 0) close(c->fd);
    js_free_rt(rt, c);
}

static JSValue js_tls_connect(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
    ensure_ctx();
    const char* host = JS_ToCString(ctx, argv[0]);
    int32_t port; JS_ToInt32(ctx, &port, argv[1]);
    if (!host) return JS_EXCEPTION;

    struct addrinfo hints = { .ai_family = AF_INET, .ai_socktype = SOCK_STREAM };
    char ports[8]; snprintf(ports, sizeof ports, "%d", port);
    struct addrinfo* res = NULL;
    int rc = getaddrinfo(host, ports, &hints, &res);
    if (rc != 0 || !res) { JS_FreeCString(ctx, host); return JS_ThrowTypeError(ctx, "getaddrinfo: %s", gai_strerror(rc)); }
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (connect(fd, res->ai_addr, res->ai_addrlen) < 0) { close(fd); freeaddrinfo(res); JS_FreeCString(ctx, host); return JS_ThrowTypeError(ctx, "connect failed"); }
    freeaddrinfo(res);

    SSL* ssl = SSL_new(g_ctx);
    SSL_set_fd(ssl, fd);
    SSL_set_tlsext_host_name(ssl, host);
    if (SSL_connect(ssl) != 1) {
        unsigned long e = ERR_get_error();
        char buf[256]; ERR_error_string_n(e, buf, sizeof buf);
        SSL_free(ssl); close(fd); JS_FreeCString(ctx, host);
        return JS_ThrowTypeError(ctx, "SSL_connect: %s", buf);
    }
    JS_FreeCString(ctx, host);
    TlsConn* c = js_mallocz(ctx, sizeof *c);
    c->fd = fd; c->ssl = ssl;
    JSValue obj = JS_NewObjectClass(ctx, tls_class_id);
    JS_SetOpaque(obj, c);
    return obj;
}

static JSValue js_tls_write(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
    TlsConn* c = JS_GetOpaque(argv[0], tls_class_id);
    if (!c) return JS_ThrowTypeError(ctx, "not a TlsConn");
    size_t len; uint8_t* buf;
    if (JS_IsString(argv[1])) {
        const char* s = JS_ToCStringLen(ctx, &len, argv[1]);
        int n = SSL_write(c->ssl, s, len);
        JS_FreeCString(ctx, s);
        return JS_NewInt32(ctx, n);
    }
    buf = JS_GetArrayBuffer(ctx, &len, argv[1]);
    if (!buf) return JS_EXCEPTION;
    return JS_NewInt32(ctx, SSL_write(c->ssl, buf, len));
}

static JSValue js_tls_read(JSContext* ctx, JSValueConst this_val, int argc, JSValueConst* argv) {
    TlsConn* c = JS_GetOpaque(argv[0], tls_class_id);
    if (!c) return JS_ThrowTypeError(ctx, "not a TlsConn");
    int32_t maxlen; JS_ToInt32(ctx, &maxlen, argv[1]);
    uint8_t* buf = js_malloc(ctx, maxlen);
    int n = SSL_read(c->ssl, buf, maxlen);
    if (n <= 0) { js_free(ctx, buf); return JS_NULL; }
    JSValue ab = JS_NewArrayBufferCopy(ctx, buf, n);
    js_free(ctx, buf);
    return ab;
}

// + js_tls_close, js_init_module_tls registering "qjs:tls"
```

**Step 3: Wire build** — same shape as crypto bridge: add the .c to
the link list with `libssl.a libcrypto.a`. Order matters: `libssl`
before `libcrypto` (libssl depends on libcrypto).

**Step 4: Rebuild + test**

```bash
bash examples/libs/openssl/build-openssl.sh   # if not already built
bash examples/libs/quickjs/build-quickjs.sh
(cd host && npx vitest run claude-code-bootstrap)
```

**Step 5: Commit**

```bash
git commit -m "node(tls): qjs:tls bridge — connect/read/write/close via libssl"
```

---

### Task C3: `net.Socket` — real AF_INET on top of `qjs:os`

**Files:**
- Modify: `bootstrap.js` (net section near line 2151)

Replace the empty `net` stub with a real `Socket` class wrapping
`os.socket(AF_INET, SOCK_STREAM)` + `os.connect`. Same pattern as
`_readableFromFd` from Task B3 (non-blocking read poll) plus a
`Writable` for outbound.

**Test:**

```ts
it('net.connect to localhost echo server', async () => {
  // ... start a Node net echo server, run a kernel-side node script:
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const net = require('net');
    const s = net.connect(PORT, '127.0.0.1');
    s.on('data', d => { process.stdout.write(d); s.end(); });
    s.write('hello\\n');
  `]);
  expect(stdout).toMatch(/hello/);
});
```

**Commit:**

```bash
git commit -m "node(net): real AF_INET Socket via qjs:os.socket+connect"
```

---

### Task C4: `http.request` + `https.request` + IncomingMessage

**Files:**
- Modify: `bootstrap.js` (http/https sections near lines 2173–2280)

Replace stubs with implementations on top of `net.Socket` (http) and
`qjs:tls` (https).

```js
function requestImpl(opts, cb, useTls) {
  const host = opts.host || opts.hostname;
  const port = opts.port || (useTls ? 443 : 80);
  const method = opts.method || 'GET';
  const path = opts.path || '/';
  const headers = { Host: host, ...opts.headers };

  const conn = useTls ? tlsBridge.connect(host, port) : netBridge.connect(host, port);

  const req = new ClientRequest(conn);
  req._writeHead(method, path, headers);

  // Body collection from req.write(...) → req.end(body) → conn.write
  // Response parsing: HTTP/1.x status line + headers + body.
  // Stream body bytes to res via res.push(chunk).
  return req;
}

const https = { request: (o, cb) => requestImpl(o, cb, true), get: ... };
const http  = { request: (o, cb) => requestImpl(o, cb, false), get: ... };
```

`ClientRequest` is a `Writable`; `IncomingMessage` is a `Readable`.
Header parsing is line-based (`split('\r\n')`, then split on first
`:`). Chunked transfer-encoding: implement (Anthropic uses chunked
for streamed responses; not optional). `Content-Length` path is
trivial.

**Tests:**

```ts
it('https.request to api.github.com /zen returns 200', async () => {
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    const https = require('https');
    https.get('https://api.github.com/zen', res => {
      console.log('status:', res.statusCode);
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => console.log('body:', body.slice(0, 30)));
    });
  `]);
  expect(stdout).toMatch(/status: 200/);
  expect(stdout).toMatch(/body: .{1,30}/);
});

it('http.request to localhost echo returns body', async () => { /* ... */ });

it('chunked transfer-encoding streams chunks', async () => { /* ... */ });

it('SSE: data: lines arrive as separate chunks', async () => {
  // localhost SSE server emits 'data: hello\n\n' x 3 with 50ms gaps.
  // assert IncomingMessage emits 'data' events with each event's bytes
  // before 'end' fires.
});
```

The SSE test is the load-bearing one for Claude Code; if it passes,
the streaming reply path works.

**Commit:**

```bash
git commit -m "node(http/https): real ClientRequest/IncomingMessage + chunked transfer"
```

---

### Task C5: `fetch()` polyfill + `globalThis.fetch`

**Files:**
- Modify: `bootstrap.js` — add a `fetch` shim

```js
async function fetch(input, init = {}) {
  const url = typeof input === 'string' ? new URL(input) : input;
  const opts = {
    method: init.method || 'GET',
    host: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search, headers: { ...init.headers },
  };
  const useTls = url.protocol === 'https:';
  return new Promise((resolve, reject) => {
    const req = (useTls ? https : http).request(opts, res => {
      const reader = createSSRReader(res);
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode, statusText: res.statusMessage,
        headers: new Headers(res.headers),
        body: { getReader: () => reader },
        text: () => streamToText(res),
        json: () => streamToText(res).then(JSON.parse),
        arrayBuffer: () => streamToBuffer(res).then(b => b.buffer),
      });
    });
    req.on('error', reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}
globalThis.fetch = fetch;
globalThis.Headers = Headers;  // simple Map-of-arrays wrapper
```

**Test:**

```ts
it('fetch json round-trip against localhost', async () => {
  // ... start a Node http server returning {hello:1}, fetch it.
  const { stdout } = await runProgram('/usr/local/bin/node', ['-e', `
    fetch('http://127.0.0.1:' + PORT + '/').then(r => r.json()).then(j => process.stdout.write(JSON.stringify(j)));
  `]);
  expect(stdout).toBe('{"hello":1}');
});
```

**Commit:**

```bash
git commit -m "node(fetch): WHATWG fetch polyfill on top of http/https"
```

---

### Task C6: `zlib.gunzip` / `zlib.gzip` — wire to libz

**Files:**
- Create: `examples/libs/quickjs/qjs-zlib.c` (small bridge: 3 funcs —
  `inflate`, `deflate`, `inflateGzip`)
- Modify: `examples/libs/quickjs/build-quickjs.sh` (link libz.a from
  `examples/libs/zlib/`)
- Modify: `bootstrap.js` (zlib section)

Bridge mirrors crypto-bridge shape; `inflate` uses `inflateInit2(zs,
15+32)` to auto-detect gzip. Brotli and deflate-raw stubbed.

**Test:**

```ts
it('zlib.gunzip decompresses a known buffer', async () => {
  // ... gzip 'hello' on host, decompress in kernel-side node
});
```

**Commit:**

```bash
git commit -m "node(zlib): libz-backed gzip/inflate (brotli stub)"
```

---

### Task C7: Phase C — gauntlet + open PR #3

```bash
git push -u origin emdash/build-claude-code-wasm-phase-c
gh pr create --repo mho22/wasm-posix-kernel --base main \
  --head emdash/build-claude-code-wasm-phase-c --draft \
  --title "node(http): real https + fetch + SSE streaming" \
  --body "..."
```

Body: link to design + plan + Phase B PR; note part 3/5; call out the
SSE streaming test as the load-bearing one for Claude Code.

---

## Phase D — `claude-code` package + integration tests (PR #4)

The end-to-end phase. Vendor `cli.js`, write the wrapper, ship a CA
bundle, add a mock Anthropic SSE server, run the CLI through six
end-to-end scenarios.

### Task D1: Branch from Phase C

```bash
git checkout emdash/build-claude-code-wasm-phase-c
git checkout -b emdash/build-claude-code-wasm-phase-d
```

### Task D2: `ca-certificates` package

**Files:**
- Create: `examples/libs/ca-certificates/build-ca-certificates.sh`
- Create: `examples/libs/ca-certificates/deps.toml`

Build script downloads `https://curl.se/ca/cacert.pem` (Mozilla CA
bundle), SHA-pins, installs to `/etc/ssl/certs/ca-certificates.crt` in
the install-tree. `kind = "data"` (or "library"; new-ish manifest
extension if "data" doesn't exist — use "library" with no outputs and
a [[file_outputs]]).

```toml
kind = "library"  # or "data" if supported
name = "ca-certificates"
version = "2026-04-01"  # bundle date
revision = 1

[source]
url = "https://curl.se/ca/cacert.pem"
sha256 = "<filled in at first build>"

[license]
spdx = "MPL-2.0"
url = "https://curl.se/docs/copyright.html"

[build]
script = "build-ca-certificates.sh"

[[file_outputs]]
path = "/etc/ssl/certs/ca-certificates.crt"
mode = "0644"
```

`file_outputs` is a small manifest extension (see Task D4 for the
patch to the resolver). If pursuing this is outsized for D2, fall back
to baking the CA bundle into the `claude-code` package directly and
defer the manifest extension; functionally equivalent for v1.

**Commit:**

```bash
git commit -m "deps(ca-certificates): vendor Mozilla CA bundle from curl.se"
```

---

### Task D3: `claude-code` package manifest + build script

**Files:**
- Create: `examples/libs/claude-code/deps.toml`
- Create: `examples/libs/claude-code/build-claude-code.sh`
- Create: `examples/libs/claude-code/wrapper.sh`
- Create: `examples/libs/claude-code/README.md`

Manifest:

```toml
kind = "program"
name = "claude-code"
version = "1.0.x"  # exact pin chosen at first implementation; e.g. "1.0.83"
revision = 1
depends_on = ["node", "openssl", "ca-certificates", "bash", "git"]

[source]
url = "https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-1.0.83.tgz"
sha256 = "<sha of the tarball>"

[license]
spdx = "LicenseRef-Anthropic-Proprietary"
url = "https://www.anthropic.com/legal/commercial-terms"

[build]
script = "build-claude-code.sh"

[[file_outputs]]
path = "/usr/lib/claude/cli.js"
[[file_outputs]]
path = "/usr/lib/claude/sdk.mjs"
[[file_outputs]]
path = "/usr/local/bin/claude"
mode = "0755"
```

Build script:

```bash
#!/usr/bin/env bash
# examples/libs/claude-code/build-claude-code.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
WORK="$HERE/work"
DIST="$HERE/dist"

VERSION="${CLAUDE_CODE_VERSION:-1.0.83}"
TARBALL_SHA256="${CLAUDE_CODE_SHA256:-}"  # require explicit pin

mkdir -p "$WORK" "$DIST/usr/lib/claude" "$DIST/usr/local/bin"

if [ ! -f "$WORK/claude-code-$VERSION.tgz" ]; then
  curl -fsSLo "$WORK/claude-code-$VERSION.tgz" \
    "https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-$VERSION.tgz"
fi

if [ -n "$TARBALL_SHA256" ]; then
  echo "$TARBALL_SHA256  $WORK/claude-code-$VERSION.tgz" | sha256sum -c -
fi

tar -xzf "$WORK/claude-code-$VERSION.tgz" -C "$WORK"
# tarball expands as `package/` containing cli.js + sdk.mjs + package.json
cp "$WORK/package/cli.js"  "$DIST/usr/lib/claude/cli.js"
cp "$WORK/package/sdk.mjs" "$DIST/usr/lib/claude/sdk.mjs"

# Optional: pre-compile to QuickJS bytecode for fast cold start
if [ -x "$REPO/examples/libs/quickjs/quickjs-src/build-host/qjsc" ]; then
  "$REPO/examples/libs/quickjs/quickjs-src/build-host/qjsc" \
    -c -o "$DIST/usr/lib/claude/cli.bc" \
    "$DIST/usr/lib/claude/cli.js"
  # Wrapper checks for cli.bc first
fi

cp "$HERE/wrapper.sh" "$DIST/usr/local/bin/claude"
chmod 0755 "$DIST/usr/local/bin/claude"

echo "Claude Code $VERSION staged at $DIST"
```

Wrapper:

```sh
#!/usr/bin/dash
# /usr/local/bin/claude
exec /usr/local/bin/node /usr/lib/claude/cli.js "$@"
```

README in the package dir documenting the build flow, the
license (Anthropic-proprietary, no redistribution in our release
archives), and how to set `CLAUDE_CODE_VERSION` to a different pin.

**Commit:**

```bash
git commit -m "deps(claude-code): vendor cli.js+sdk.mjs build pipeline"
```

---

### Task D4: `file_outputs` manifest extension (resolver)

**Files:**
- Modify: `xtask/src/build_deps.rs` (or wherever the deps.toml resolver
  lives — `git grep depends_on` to find)
- Modify: `xtask/src/manifest.rs` if a separate types file
- Tests: cargo `--lib` cases for the resolver

This is a small manifest schema bump. Today `[[outputs]]` describes
wasm binaries. We add `[[file_outputs]]` describing arbitrary
filesystem-tree contents copied from the build's `dist/` directory.
The resolver, on `xtask install-release`, places them at the manifest
path with the manifest mode.

If a clean implementation balloons the PR, **fold this in**: bake the
CA bundle directly into the claude-code package's build output as a
loose file alongside cli.js, hand-write the install logic for that
specific package only. We can come back and generalize later.

**Cargo test:**

```rust
#[test]
fn file_outputs_manifest_round_trips() {
    let m: Manifest = toml::from_str(r#"
kind = "program"
name = "x"
version = "1"
revision = 1
[source]
url = "https://example.com"
sha256 = "0..."
[license]
spdx = "MIT"
[build]
script = "build.sh"
[[file_outputs]]
path = "/usr/local/bin/x"
mode = "0755"
"#).unwrap();
    assert_eq!(m.file_outputs.len(), 1);
    assert_eq!(m.file_outputs[0].path, "/usr/local/bin/x");
    assert_eq!(m.file_outputs[0].mode, Some(0o755));
}
```

**Commit:**

```bash
git commit -m "xtask(manifest): [[file_outputs]] for non-wasm package payloads"
```

---

### Task D5: Mock Anthropic SSE server

**Files:**
- Create: `host/test/anthropic-mock.ts`

```ts
// host/test/anthropic-mock.ts
import { createServer, ServerResponse } from 'node:http';

export type SsEvent = { event?: string; data: any };

export async function startMockAnthropic(opts: {
  responses: Record<string, SsEvent[]>;
  port?: number;
}): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((req, res) => {
    if (req.url !== '/v1/messages' || req.method !== 'POST') {
      res.statusCode = 404; res.end('not found'); return;
    }
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const json = JSON.parse(body);
      const userMsg = json.messages?.[json.messages.length - 1]?.content ?? '';
      const key = typeof userMsg === 'string' ? userMsg : userMsg[0]?.text ?? '';
      const events = opts.responses[key] ?? opts.responses['*'] ?? [];
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
      });
      let i = 0;
      const next = () => {
        if (i >= events.length) { res.end(); return; }
        const e = events[i++];
        if (e.event) res.write(`event: ${e.event}\n`);
        res.write(`data: ${JSON.stringify(e.data)}\n\n`);
        setTimeout(next, 20);
      };
      next();
    });
  });
  return new Promise(r => server.listen(opts.port ?? 0, () => {
    const port = (server.address() as any).port;
    r({
      url: `http://127.0.0.1:${port}`,
      close: () => new Promise<void>(rr => server.close(() => rr())),
    });
  }));
}

export function sseStreamText(...chunks: string[]): SsEvent[] {
  return [
    { event: 'message_start', data: { type: 'message_start', message: { id: 'mock', type: 'message', role: 'assistant', content: [] }}},
    { event: 'content_block_start', data: { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' }}},
    ...chunks.map(t => ({
      event: 'content_block_delta',
      data: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t }},
    })),
    { event: 'content_block_stop', data: { type: 'content_block_stop', index: 0 }},
    { event: 'message_stop', data: { type: 'message_stop' }},
  ];
}

export function sseToolCall(t: { name: string, input: any }): SsEvent[] {
  // emit content_block of type 'tool_use'
}
```

**Commit:**

```bash
git commit -m "test(claude-code): mock Anthropic SSE server"
```

---

### Task D6: `claude --version` + `claude --help` smoke

**Files:**
- Create: `host/test/claude-code-cli.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { runProgram } from './centralized-test-helper.js';

describe('claude-code CLI', () => {
  it('claude --version prints the pinned version', async () => {
    const { code, stdout } = await runProgram('/usr/local/bin/claude', ['--version']);
    expect(code).toBe(0);
    expect(stdout).toMatch(/^1\.0\./);
  });

  it('claude --help exits 0', async () => {
    const { code, stdout } = await runProgram('/usr/local/bin/claude', ['--help']);
    expect(code).toBe(0);
    expect(stdout).toMatch(/Usage|claude/i);
  });
});
```

This is the first run that may surface unexpected `bootstrap.js`
gaps. If `cli.js` calls a Node API we haven't shimmed, it will throw
with a stack trace pointing at the missing function. Treat the
discovery list as **the actual scope** of Phase D's bootstrap work;
add shims as required, no preemptive coverage.

Likely candidates discovered here:

- `fs.realpath` / `fs.realpathSync` (path canonicalization)
- `os.userInfo()` (non-stub; returns `{ uid, gid, username, homedir, shell }`)
- `process.argv0`, `process.execPath`
- `module._resolveLookupPaths`
- `Symbol.dispose` polyfill (Claude Code uses explicit-resource-management)

Add each as it surfaces; commit per surface.

**Commit (initial smoke):**

```bash
git commit -m "node(bootstrap): cover {realpath,userInfo,argv0,Symbol.dispose} for cli.js"
```

(or one commit per shim if cleaner)

---

### Task D7: Prompt round-trip against the mock API

```ts
it('prompt round-trips through the mock API', async () => {
  const mock = await startMockAnthropic({
    responses: {
      'hello': sseStreamText('Hi!', ' How', ' can', ' I', ' help', '?'),
    },
  });
  const sess = await runProgram('/usr/local/bin/claude', [], {
    env: [
      `ANTHROPIC_BASE_URL=${mock.url}`,
      'ANTHROPIC_API_KEY=mock-test-key',
      'CLAUDE_CONFIG_DIR=/tmp/claude-test',
    ],
    interactive: true,
  });
  await sess.expectScreen(/welcome|Try asking/i, { timeout: 10_000 });
  sess.send('hello\r');
  await sess.expectScreen(/Hi! How can I help\?/, { timeout: 10_000 });
  sess.send('\x04');  // Ctrl+D
  expect(await sess.exitCode).toBe(0);
  await mock.close();
});
```

`runProgram(..., { interactive: true })` is a small extension to the
test helper: allocates a pty, exposes `.send(str)` and
`.expectScreen(regex, opts)` (poll the pty's accumulated output until
match or timeout). The pattern already exists in
`host/test/centralized-test-helper.ts`'s `runProgramInPty`-like
helpers; mirror.

**Commit:**

```bash
git commit -m "test(claude-code): prompt round-trip via mock SSE"
```

---

### Task D8: Bash tool round-trip

```ts
it('Bash tool runs ls / via bash.wasm', async () => {
  const mock = await startMockAnthropic({
    responses: {
      'list /': [
        // tool_use block requesting Bash with command='ls /'
        ...sseToolCall({ name: 'Bash', input: { command: 'ls /' } }),
      ],
    },
  });
  const sess = await runProgram('/usr/local/bin/claude', [], { env: [...], interactive: true });
  await sess.expectScreen(/Try asking/i);
  sess.send('list /\r');
  // CLI prompts user to approve tool — auto-approve
  await sess.expectScreen(/run.*ls \//);
  sess.send('y\r');
  await sess.expectScreen(/etc|usr|var/);
  sess.send('\x04');
});
```

Pre-condition: `bash.wasm`, `coreutils-ls.wasm` (or busybox), and the
`ls` binary at `/usr/bin/ls` in the test VFS. The dinit-supervised
demo image (PR #370) already ships these; reuse its VFS bootstrap.

**Commit:**

```bash
git commit -m "test(claude-code): Bash tool runs ls / via bash.wasm"
```

---

### Task D9: Read tool, Edit tool, persistence

Same pattern as D8, three more tests:

```ts
it('Read tool reads /etc/passwd from VFS', async () => { /* ... */ });
it('Edit tool writes a file round-trip', async () => { /* ... */ });
it('Conversation transcript persists across runs', async () => {
  // Run claude, send msg, exit. Run again, assert transcript visible
  // under /tmp/claude-test/projects/<hash>/ as JSONL.
});
```

**Commit:**

```bash
git commit -m "test(claude-code): Read/Edit tools + transcript persistence"
```

---

### Task D10: docs

**Files:**
- Modify: `README.md` — add Claude Code to "Software ported"
- Modify: `docs/posix-status.md` — note TLS/HTTPS userspace working
- Modify: `docs/architecture.md` — short subsection on JS runtime
  extensions
- Modify: `docs/sdk-guide.md` — note vendored bundles are the model

```bash
git add README.md docs/
git commit -m "docs(claude-code): port notes + Claude Code in software list"
```

---

### Task D11: Manual smoke (the gate)

```bash
./run.sh node                                      # boot Node host
# in the dash shell:
$ claude config set apiKey $REAL_ANTHROPIC_KEY
$ claude
> hello
# expect streamed reply
> /tools
# expect tool list
> read /etc/passwd
# expect file contents
^D
# expect clean exit, termios restored:
$ stty -a | grep icanon  # should show 'icanon' (canonical mode on)
```

If anything fails: trace, fix, re-test. **Do not patch the CLI bundle.**

If everything works:

**Step 1: Re-run the gauntlet**

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
```

Expected: zero new failures vs the branch baseline.

**Step 2: Push + open PR #4**

```bash
git push -u origin emdash/build-claude-code-wasm-phase-d
gh pr create --repo mho22/wasm-posix-kernel --base main \
  --head emdash/build-claude-code-wasm-phase-d --draft \
  --title "deps(claude-code): vendor + integration tests + docs" \
  --body "..."
```

PR body: link to design + plan, paste manual-smoke transcript,
screenshots if useful, reiterate "hold for merge until Brandon
validates."

---

## Phase E — `rg.wasm` (PR #5, deferred-but-not-blocking)

ripgrep makes the Grep tool fast on large trees. Claude Code falls
back to `grep` if `rg` is missing, so this PR ships *after* PR #4
proves the rest works.

### Task E1: Branch from Phase D

```bash
git checkout emdash/build-claude-code-wasm-phase-d
git checkout -b emdash/build-claude-code-wasm-phase-e
```

### Task E2: cargo cross-compile script

**Files:**
- Create: `examples/libs/ripgrep/build-ripgrep.sh`
- Create: `examples/libs/ripgrep/deps.toml`

```bash
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
SRC="$HERE/ripgrep-src"
[ -d "$SRC" ] || git clone --depth 1 --branch 14.1.1 https://github.com/BurntSushi/ripgrep "$SRC"
cd "$SRC"
# Cargo target: wasm32-wasi works with our sysroot's WASI shim, OR build a
# custom rustc target spec for wasm32posix. The kernel already runs
# wasm32-wasip1 binaries via channel_syscall; if rust's std on wasm32-wasip1
# uses WASI imports we don't supply, prefer wasm32-unknown-unknown plus a
# manual main entrypoint. Investigate at first build.
cargo build --release --target wasm32-wasip1 \
  --features 'simd-accel'
cp "target/wasm32-wasip1/release/rg.wasm" "$HERE/rg.wasm"

source "$REPO/scripts/install-local-binary.sh"
install_local_binary ripgrep "$HERE/rg.wasm" rg.wasm
```

`wasm32-wasip1` may need plumbing in our toolchain — investigate at
first build. Brandon has built bash, redis, mariadb in C; ripgrep is
Rust — may surface new toolchain seams. If so, scope check, descope to
"port `grep` faster" if blocked.

**Test:** small Vitest test running `rg foo /tmp/dir-with-files`,
asserting matches.

**Commit:**

```bash
git commit -m "deps(ripgrep): cross-compile rg.wasm 14.1.1"
```

### Task E3: Phase E gauntlet + PR #5

```bash
git push -u origin emdash/build-claude-code-wasm-phase-e
gh pr create --repo mho22/wasm-posix-kernel --base main \
  --head emdash/build-claude-code-wasm-phase-e --draft \
  --title "deps(ripgrep): rg.wasm 14.1.1 for Claude Code Grep tool" --body "..."
```

---

## Final coordinated review

After PR #4's manual smoke passes and the gauntlet is green, post a
comment on the design PR (#11 on mho22/wasm-posix-kernel) summarising:

- Final pin (e.g. `claude-code@1.0.83`)
- All five PR numbers in stack order
- The gauntlet output (one-line summary per suite)
- Any non-trivial discoveries (new bootstrap shims, OpenSSL config
  tweaks, etc.) — link to the commit that landed each

Then ping Brandon. Per the user's policy, **we never merge upstream
ourselves** — Brandon merges into `wasm-posix-kernel/main` when
satisfied. On `mho22/main` we may merge once Brandon green-lights, but
even that waits for explicit user instruction.

After merge — whichever direction — update the design doc's R-list
with which risks materialised and how they were resolved, so the next
similar initiative (v2.x revisited, browser host, MCP-over-HTTP) has
a paper trail.
