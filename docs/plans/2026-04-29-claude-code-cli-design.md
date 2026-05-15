# Claude Code CLI on `node.wasm` — Design

Date: 2026-04-29
Branch: `emdash/add-claude-code-wasm-tzdid`
Worktree: `emdash/worktrees/kandelo/wasm-posix-kernel/emdash/add-claude-code-wasm-tzdid/`

## §1. Goals & non-goals

**Goal.** A user runs `claude` in our PTY-backed shell (Node host or browser
demo, against a Node host today) and gets the real Claude Code CLI: Ink TUI
boots, `process.stdin` is in raw mode, `Esc` opens the menu, `/` brings up
slash commands, prompts hit `https://api.anthropic.com/v1/messages` with
`stream: true` and SSE deltas paint the screen line-by-line. The Bash and
Read/Edit/Grep tools work because the CLI shells out to **our own**
`bash.wasm`, `git.wasm`, `rg.wasm`, etc., spawned through `child_process` →
`fork` + `execve`. Conversation transcripts persist to the kernel VFS at
`~/.claude/projects/<hash>/`. The CLI exits cleanly on `Ctrl+D`, restoring
termios.

**Pin.** `@anthropic-ai/claude-code@^1.0.x` — the last pure-JS line. v2.1.x
ships a `bun build --compile` output bundling JavaScriptCore, which is a
non-starter without porting JSC and we are not doing that. We can revisit
once Anthropic ships a pure-JS escape hatch again, or once we port JSC. The
v1 line is supported because `engines.node: ">=18.0.0"` and the bundle is a
single `cli.js` (~13 MB) plus `sdk.mjs` — exactly the kind of payload
QuickJS-NG eats for breakfast.

**Non-goals (v1).**

- **v2.x native binary.** As above. Documented; no JSC porting.
- **Browser host.** `api.anthropic.com` does not return CORS headers; the
  browser host can run the binary, but every API request will fail until we
  put a CORS proxy in front of the demo or ship via service-worker
  interception (`docs/plans/2026-03-14-openssl-https-design.md` covers the
  TLS-MITM path; layering a CORS-friendly Anthropic proxy on top is real
  work). Ship Node host first, browser as a follow-up once a proxy story
  exists.
- **macOS Keychain / Windows DPAPI.** Use the Linux fall-through:
  `~/.claude/.credentials.json` mode `0600`. Already what Claude Code does
  on Linux. We are Linux-shaped.
- **`color-diff-napi`** N-API addon Anthropic bundles. Stub it (return the
  unstyled diff). Fidelity loss is purely cosmetic; the diff content is
  identical.
- **Sharp / `@img/sharp`.** Image-processing addon for screenshot
  attachments — stub (`unimplemented`). Power users on day one don't need
  image attachments through a wasm CLI.
- **OAuth via system-browser PKCE flow.** Implement `claude setup-token`
  (paste a long-lived OAuth token) plus `ANTHROPIC_API_KEY` env. The
  system-browser open-URL trick has no analogue on a wasm-hosted CLI.
- **`worker_threads`.** Claude Code uses workers for background compaction
  and indexing. Run that work synchronously on the main thread for v1.
  Compaction is rare; indexing is best-effort. Documented latency hit.
- **MCP HTTP / SSE / WebSocket transports.** Stdio MCP servers (the
  dominant case — subprocess + JSON-RPC over stdin/stdout) work because
  `child_process.spawn` works. HTTP/SSE/WS MCP transports defer to v2 of
  this initiative.

**Constraint** (CLAUDE.md "never compromise hosted software"). The
`claude` JS bundle is **not patched.** Every gap surfaces as a fix in
`bootstrap.js`, the kernel, or the SDK toolchain — never `#ifdef`-ed out
of the upstream JS. If a Claude Code release introduces a new Node API we
haven't shimmed, we shim it. The exception list above is for things we
deliberately stub (Keychain, sharp, color-diff-napi); those return correct
"feature unavailable" behavior and the CLI continues.

**Success criteria** (the gate for the implementation PR landing).

1. `claude --version` prints the pinned 1.0.x version.
2. `claude --help` exits 0 with the help screen.
3. `claude` (no args, after `claude config set apiKey ...` or with
   `ANTHROPIC_API_KEY` set) boots the Ink TUI within ~5s in our `dash`
   PTY shell, draws the welcome banner, accepts a typed prompt.
4. The prompt round-trips: `> hello` produces a streamed reply painted
   incrementally over SSE.
5. **The Bash tool works.** `> run ls /` produces output from our
   `ls.wasm` (coreutils) via `bash -c "ls /"`. The CLI sees stdout.
6. **The Read tool works.** `> read /etc/passwd` displays the file.
7. **The Edit tool works.** `> edit /tmp/foo.txt` round-trips a write
   through `fs.writeFile`; subsequent `cat /tmp/foo.txt` in the shell
   shows the new content.
8. **Transcripts persist.** Quit (`Ctrl+D`), re-launch in the same VFS
   session, see the prior conversation under `~/.claude/projects/`.
9. `Ctrl+C` cancels an in-flight stream and returns to the prompt.
10. Termios is restored on exit (`stty -a` after quit shows `icanon
    echo`).

## §2. Architecture

```
   ┌─ user (in our dash/PTY) ───────────────────────────────────┐
   │ $ claude                                                    │
   │   → /usr/local/bin/claude  (shell script)                  │
   │   → exec /usr/local/bin/node /usr/lib/claude/cli.js "$@"   │
   └─────────────┬──────────────────────────────────────────────┘
                 │ execve
   ┌─────────────▼──────────────────────────────────────────────┐
   │ node.wasm  (QuickJS-NG + bootstrap.js, already in tree)    │
   │   require('cli.js')                                         │
   │   ├─ fs / path / os                ─→ kernel POSIX (works) │
   │   ├─ tty.setRawMode               ─→ tcsetattr (NEW wire)  │
   │   ├─ process.stdin / SIGWINCH     ─→ pty.rs (works)        │
   │   ├─ child_process.spawn          ─→ fork + execve (NEW)   │
   │   ├─ https / http / fetch / SSE   ─→ openssl + AF_INET     │
   │   │                                  (NEW: bootstrap+lib)  │
   │   ├─ crypto.{randomUUID,createHash,createHmac}             │
   │   │                                ─→ openssl libcrypto    │
   │   ├─ worker_threads               ─→ inline-on-main-thread │
   │   ├─ zlib                         ─→ libz (libpng already  │
   │   │                                  pulls it in)          │
   │   └─ readline                     ─→ stdin + ESC parsing   │
   └─────────────┬──────────────────────────────────────────────┘
                 │ syscalls via channel (existing)
   ┌─────────────▼──────────────────────────────────────────────┐
   │ kernel.wasm (already does fork/exec/pipes/sockets/PTY/sig) │
   │ + new on host: AF_INET → real TCP via host_net_send/recv   │
   │   (already works for Node host)                            │
   └────────────────────────────────────────────────────────────┘

   ┌─ subprocess fanout ──────────────────────────────────────┐
   │ Bash tool   → fork+exec /usr/local/bin/bash.wasm         │
   │ Grep tool   → fork+exec /usr/local/bin/rg.wasm (built    │
   │                from BurntSushi/ripgrep)                  │
   │ Read/Edit   → no subprocess; fs.readFile / fs.writeFile  │
   │ Git tool    → fork+exec /usr/local/bin/git.wasm          │
   │ MCP stdio   → fork+exec <user-configured>; pipe JSON-RPC │
   └──────────────────────────────────────────────────────────┘
```

Three runtime layers, three porting axes:

1. **Runtime (`node.wasm`).** Already exists. We extend `bootstrap.js`
   with the surfaces Claude Code touches that aren't there yet — mostly
   `https`, `tty.setRawMode`, real `child_process.spawn`, real `crypto`.
   No new wasm binary; the existing `node.wasm` rebuilds with new
   bootstrap.

2. **Kernel.** Termios + SIGWINCH + fork/exec/pipes/sockets — all
   already in. The only kernel-shaped work is plumbing whatever
   bootstrap can't do in pure JS down to host imports we already have.
   **Expected ABI impact: zero.** If we discover otherwise, that's a
   plan-level surprise and gets called out before implementation.

3. **Native deps.** `claude` itself bundles ~everything it needs. We
   add **two** new ports:
   - **OpenSSL 3.x** library (already designed in
     `docs/plans/2026-03-14-openssl-https-design.md`, never landed).
     Reuse that design, drop the in-process MITM piece (we want real
     TLS through the kernel's AF_INET socket, not a fake-cert
     interceptor).
   - **ripgrep** as `rg.wasm` (Rust). This is a new port. Could
     defer — Claude Code falls back to `grep` if `rg` is missing — but
     the Grep tool is a hot path and `grep` is much slower on big
     trees. So we land `rg.wasm`, but the implementation phase ships
     it last; nothing else blocks on it.

**What's deliberately *not* on the diagram.**

- No new kernel devfs entry. No new ioctls. No new asyncify slots.
- No new channel ABI. No marshalled struct. No new syscall number.
- No browser-side renderer. No canvas. No SAB games.

This is a userspace+runtime port, not a kernel feature. The kernel is
already capable; we're plugging existing capabilities into a JS shim.

### Trade-offs

- **`node.wasm` is QuickJS-NG, not V8.** Claude Code 1.0.x is bundled
  with `bun build`, so it's already AOT-friendly JS — no eval-heavy
  paths, no V8-only intrinsics. Spec-wise it's ES2023; QuickJS-NG
  covers that. The risk surface is **performance**, not correctness:
  large `cli.js` parse + bytecode compile is a few hundred ms in
  QuickJS-NG. Acceptable for a CLI.
- **`worker_threads` collapses to main-thread.** Claude Code's
  workers are non-load-bearing. Indexing falls back to "do nothing"
  (search still works, just slower the first time). Compaction
  blocks the UI for ~50–500 ms — annoying, not broken. If users
  complain, we wire kernel-pthread workers in v2 of this work.
- **Stub `color-diff-napi` returns un-colorized diffs.** Diffs still
  display, just without inline character-level highlighting. We keep
  Anthropic's diff colorization shape so the CLI doesn't crash.
- **`fs.watch` polled.** QuickJS has no inotify. `fs.watch` falls
  back to a `setInterval` poll over the watched path. CPU cost is
  negligible for the small directory sets Claude Code watches.
- **No system Keychain.** Credentials in plain `~/.claude/.credentials.json`
  (mode 0600). This matches the Linux upstream behavior.
- **No PKCE OAuth.** `claude setup-token` (paste-a-token) and
  `ANTHROPIC_API_KEY` are the supported auth paths. Documented.

A "run the v2 native binary" approach was considered and rejected:
porting JavaScriptCore is a multi-month effort that gets us nothing
this initiative doesn't already get from the v1 line. If/when
Anthropic re-publishes a pure-JS track, this design's pin moves
forward; if not, this design holds at v1.

## §3. Runtime extensions (`bootstrap.js`)

`bootstrap.js` (currently 2576 lines, 27 modules) covers `path`,
`fs`, `os`, `util`, `assert`, `events`, `buffer`, `stream`, `url`,
`querystring`, `string_decoder`, `timers`, `module`, `tty` (partial),
`child_process` (partial), `crypto` (stubs), `net` (stubs), `http` /
`https` (stubs), `zlib` (passthrough), `worker_threads` (empty),
`readline` (stub), `dns` (loopback stub), `cluster` (single), `vm`,
`v8`, `perf_hooks`, `constants`. Each "stub" / "partial" below is
the gap Claude Code v1.0.x will hit.

### 3.1 `tty.setRawMode` (gap → wire to kernel)

Claude Code calls `process.stdin.setRawMode(true)` at startup and
`setRawMode(false)` on exit. Today this is a no-op stub.

Wire it to the existing kernel termios path:

```js
// in bootstrap.js: Stream class for stdin
ReadStream.prototype.setRawMode = function(mode) {
  if (!this.isTTY) return this;
  // POSIX raw: clear ICANON, ECHO, ISIG-on-INTR; set VMIN=1 VTIME=0
  const fd = this._fd;
  const t = _tcgetattr(fd);
  if (mode) {
    t.c_lflag &= ~(ICANON | ECHO | ISIG | IEXTEN);
    t.c_iflag &= ~(IXON | ICRNL | INPCK | ISTRIP | BRKINT);
    t.c_oflag &= ~OPOST;
    t.c_cc[VMIN] = 1; t.c_cc[VTIME] = 0;
  } else {
    // Restore from saved
    Object.assign(t, this._savedTermios);
  }
  _tcsetattr(fd, TCSANOW, t);
  this.isRaw = !!mode;
  return this;
};
```

`_tcgetattr` / `_tcsetattr` go through `qjs:os.ioctl` with `TCGETS` /
`TCSETS` — already supported by the kernel (`crates/kernel/src/syscalls.rs`
~5961, line discipline in `pty.rs` ~244). Save the original termios in
`this._savedTermios` on first read so `setRawMode(false)` can restore
exactly what was there. We also install a `process.on('exit')` and
SIGINT/SIGTERM handler that restores termios — Claude Code does this
itself, but a defensive net here costs nothing and saves a busted shell
when the CLI crashes.

`SIGWINCH` already routes to the foreground pgrp (`syscalls.rs` ~4893).
Bootstrap exposes it via `process.on('SIGWINCH', ...)` — currently this
works for raw signal handlers; verify Claude Code's resize listener
fires.

### 3.2 `child_process.spawn` (partial → real)

Today bootstrap implements `spawn` as a microtask wrapping
`execSync` → `std.popen()` (synchronous fork-of-shell). Claude Code
needs **real async spawn** because:

- The Bash tool stays a long-running subprocess; `popen` would block
  the event loop forever.
- MCP stdio servers need `stdin.write()` / `stdout.on('data')` over
  the lifetime of the conversation.

Replace the implementation with kernel `fork` + `execve`:

```js
function spawn(command, args, options) {
  const stdin  = options.stdio?.[0] === 'pipe' ? _pipe() : null;
  const stdout = options.stdio?.[1] === 'pipe' ? _pipe() : null;
  const stderr = options.stdio?.[2] === 'pipe' ? _pipe() : null;
  const pid = os.fork();   // qjs:os already exposes fork()
  if (pid === 0) {
    // child
    if (stdin)  { os.dup2(stdin.r, 0); os.close(stdin.r); os.close(stdin.w); }
    if (stdout) { os.dup2(stdout.w, 1); os.close(stdout.w); os.close(stdout.r); }
    if (stderr) { os.dup2(stderr.w, 2); os.close(stderr.w); os.close(stderr.r); }
    os.execvp(command, [command, ...args]);
    os._exit(127);
  }
  // parent
  if (stdin)  os.close(stdin.r);
  if (stdout) os.close(stdout.w);
  if (stderr) os.close(stderr.w);
  return new ChildProcess(pid, stdin, stdout, stderr);
}
```

The `ChildProcess` class is an `EventEmitter` exposing `.stdin`
(Writable), `.stdout` / `.stderr` (Readable backed by non-blocking
`read` on the pipe fd + the existing event loop), `.kill(sig)`
(`os.kill`), and emits `'exit'`/`'close'` after `os.waitpid(pid,
WNOHANG)` reports the child gone. The polling loop reuses
bootstrap's existing `setInterval`-based scheduler — same trick used
for `fs.watch`.

The kernel's `fork` and `execve` are stable (used by `bash.wasm`,
`make.wasm`, `git.wasm` already; tested by phase13b/13e plans).

`exec()` and `execSync()` keep their current `std.popen()` impls for
back-compat with code that wants string output from a one-shot — but
when those wrappers detect they're being given non-shell arguments,
they delegate to the new `spawn`.

### 3.3 `https` / `http` / `fetch` (stub → real, via OpenSSL)

This is the load-bearing chunk. Claude Code does **all** API calls
over `https.request` (or `fetch`, which under the hood uses the same
`https`-ish socket path) to `api.anthropic.com:443` with
`stream: true` + SSE.

**Architecture**:

```
  bootstrap.js https.request
     └─ TLSSocket   ── wraps ──→ net.Socket  ── wraps ──→ AF_INET fd
            │                                                 │
            │ uses libssl (BIO bridge to fd reads/writes)      │
            ▼                                                 ▼
        OpenSSL 3.x .a (linked into node.wasm)        kernel socket
                                                       → host_net_send/recv
                                                       → real TCP via Node
```

Steps:

1. **Build OpenSSL 3.x for wasm32** per the existing design at
   `docs/plans/2026-03-14-openssl-https-design.md`. Drop the
   "in-process MITM CA" piece — that was for the browser fetch
   intercept; we want bog-standard TLS to a real server. Output:
   `examples/libs/openssl/bin/{libcrypto.a,libssl.a}` plus headers
   in `sysroot/include/openssl/`.

2. **Add an OpenSSL bridge module to QuickJS-NG.** A new C file
   `examples/libs/quickjs/qjs-tls.c` exposes:
   ```c
   js_tls_connect(host, port) → tls_handle
   js_tls_write(tls, buf)
   js_tls_read(tls, n) → buf
   js_tls_close(tls)
   ```
   under module name `qjs:tls`. Backed by `SSL_CTX_new`,
   `SSL_set_fd`, `SSL_connect`, `SSL_read`, `SSL_write`, with the
   socket fd opened via `qjs:os.socket(AF_INET, SOCK_STREAM, 0)` →
   `connect`. Use `SSL_CTX_set_default_verify_paths` against the
   trust bundle we ship (a vendored `/etc/ssl/certs/ca-certificates.crt`
   in the VFS, sourced from Mozilla — same approach `curl.wasm` would
   take).

3. **Rewrite the bootstrap `https` module** on top of `qjs:tls`:
   - `https.Agent`, `https.request(opts, cb)` returning a `ClientRequest`
     that emits `'response'` with an `IncomingMessage`.
   - `IncomingMessage` is a `Readable` reading via repeated `tls_read`
     calls until EOF or `Content-Length`.
   - SSE works for free: callers do `res.on('data', chunk => ...)`,
     parse `data: ` lines themselves (Claude Code already does).

4. **`fetch()` polyfill** in bootstrap that wraps `https.request` for
   the simple cases Claude Code uses (`POST` with JSON body, streamed
   response). Skip URL `Request` / `Response` Web-streams symmetry for
   v1 — Claude Code uses both fetch and https.request paths but the
   fetch path can be implemented as a thin wrapper.

`http://` is the easy case — same as `https://` minus the TLS layer.
Implement on top of plain `net.Socket` (wraps `qjs:os.socket`).

**What about `globalThis.fetch`?** Add it. Bootstrap currently doesn't
expose `fetch`; Claude Code's bundle will use whichever it finds. We
hook it onto `globalThis` after `https` is wired.

### 3.4 `crypto` (stubs → real, via libcrypto)

Claude Code touches:

- `crypto.randomUUID()` / `crypto.randomBytes(n)` — random IDs for
  conversations, OAuth state. Today's bootstrap returns weak RNG; we
  upgrade to `getentropy()` (kernel exposes it via `/dev/urandom`,
  already wired in bootstrap as `os.urandom_read`).
- `crypto.createHash('sha256')` — content-hashing files for project
  IDs (`~/.claude/projects/<sha>/`). Today's bootstrap is a stub.
  Wire to `EVP_MD_CTX_*` from libcrypto via a thin C bridge module
  `qjs:crypto-bridge` (lives next to `qjs-tls.c`).
- `crypto.createHmac('sha256', key)` — request signing, HMAC-SHA256.
  Same C bridge.
- `crypto.timingSafeEqual` — pure-JS, easy.

The bridge keeps the JS API surface unchanged. We don't ship the full
`crypto` module — just the few primitives Claude Code actually uses,
gated behind a feature-detection table that throws `unimplemented` for
anything else. If a Claude Code release adds new crypto deps, we add
them; if a bug sneaks in, the throw points us at the right spot.

### 3.5 `worker_threads` (stub → fake-it-on-main)

Claude Code uses workers for two things: (a) background context
compaction; (b) initial workspace indexing.

Replace the empty `Worker` class with one that **runs the worker
script synchronously on the main thread** when `.postMessage` is
called:

```js
class Worker extends EventEmitter {
  constructor(scriptPath, opts) {
    super();
    this._port = new MessageChannel();
    this._workerScope = createWorkerScope(this._port.port2, opts.workerData);
    // Don't actually run the script yet — wait for first postMessage
    // (Claude Code's pattern: post a "start" message; respond with results)
    this._scriptPath = scriptPath;
    this._loaded = false;
  }
  postMessage(msg) {
    if (!this._loaded) { runInline(this._scriptPath, this._workerScope); this._loaded = true; }
    this._workerScope.dispatch(msg);
  }
  terminate() { /* no-op */ }
}
```

`MessageChannel` is straightforward to polyfill in pure JS; it just
queues messages between two ports.

Documented behavioural difference: messages are processed
synchronously when posted. Most worker code tolerates this (results
arrive before the post returns); code that depends on parallelism
will be slower but still correct.

### 3.6 Smaller fixes

- **`zlib`** — currently passthrough. Wire to `libz` (already in tree
  via `examples/libs/zlib/`). Brotli stays a stub; Claude Code's HTTP
  responses come `gzip` or identity.
- **`readline.createInterface`** — currently returns a stub. Implement
  a minimal Emacs-style line editor (Claude Code only uses it for
  one-off prompts in non-TUI flows; the main input loop is Ink, which
  drives `process.stdin` directly).
- **`os.networkInterfaces()`** — return a plausible single-loopback
  shape so deps that probe it don't crash.
- **`process.env`** populated from execve `envp`. Already works (verify).

## §4. Distribution & VFS layout

The CLI lives entirely in our existing VFS once installed.

**Pinned bundle.** We vendor the `cli.js` and `sdk.mjs` from
`@anthropic-ai/claude-code@1.0.x` into `examples/libs/claude-code/vendored/`.
A tiny build script (no actual compilation — JS) verifies the SHA-256 of
both files and copies them into the output. The vendored copy is **not
committed** to git (LICENSE: Anthropic-proprietary); instead, the build
script downloads-on-build with a `sha256sum` gate and a small README in
the directory pointing users at the upstream tarball. Same pattern Brandon
uses for `doom1.wad`.

**Filesystem layout** (paths in the kernel VFS, populated by
`examples/libs/claude-code/build-claude-code.sh`):

```
/usr/lib/claude/
  cli.js                  (~13 MB, vendored)
  sdk.mjs
  package.json            (minimal: name, version, type=commonjs)
/usr/local/bin/
  claude                  (POSIX shell script, ~5 lines)
/etc/ssl/certs/
  ca-certificates.crt     (Mozilla bundle, vendored)
~/.claude/
  settings.json           (created on first run by claude)
  projects/<hash>/        (transcripts, JSONL)
  .credentials.json       (created on first run, mode 0600)
```

The shell script:

```sh
#!/usr/bin/dash
exec /usr/local/bin/node /usr/lib/claude/cli.js "$@"
```

Brandon already ships `/usr/local/bin/node` (it's the current
`node.wasm`). If the user's PATH has `bash.wasm` and `git.wasm` at
`/usr/local/bin/`, the Bash and Git tools just work.

**Why a shell wrapper, not a wasm binary.** The `claude` "binary"
is a JS script; `cli.js` doesn't have a wasm32 ELF header. The
shell wrapper is the smallest layer that turns "execute claude" into
"execute node + JS file". This is exactly how Claude Code is
distributed on real Linux.

### Package manifest

`examples/libs/claude-code/deps.toml`:

```toml
kind = "program"
name = "claude-code"
version = "1.0.x"  # exact pin chosen at first implementation
revision = 1
depends_on = ["node", "openssl", "ca-certificates", "bash", "git"]

[source]
url = "https://registry.npmjs.org/@anthropic-ai/claude-code/-/claude-code-1.0.x.tgz"
sha256 = "<filled in at build time>"

[license]
spdx = "LicenseRef-Anthropic-Proprietary"
url = "https://www.anthropic.com/legal/commercial-terms"
notice = "Vendored unmodified per upstream redistribution terms; not redistributed in our release archives."

[build]
script = "build-claude-code.sh"

# No [[outputs]] wasm — this is a JS payload, not a wasm binary.
# Outputs are filesystem-tree contents (cli.js + sdk.mjs + wrapper).
[[file_outputs]]
path = "/usr/lib/claude/cli.js"
[[file_outputs]]
path = "/usr/lib/claude/sdk.mjs"
[[file_outputs]]
path = "/usr/local/bin/claude"
mode = "0755"
```

`file_outputs` is a new manifest field — small extension to the
package-management v2 system landed in PR #365. Plan-doc treats this
as a separate, justified change.

**Why a wrapper script over a `node.wasm`-detection trick in the
binary loader.** Keeping the wasm-binary loader purely about wasm is
the principle Brandon's package system already follows. Mixing in
"actually execute this JS file" behavior would creep responsibilities
into a layer that has none of the right context. The `dash` wrapper
costs nothing — `dash.wasm` is already installed in every relevant
demo image.

## §5. Testing strategy

Three layers, each guarding a different failure mode.

**Unit / module tests** in `host/test/claude-code-bootstrap.test.ts`:

For each shim we add to `bootstrap.js`, a Vitest test that runs
`node.wasm` against a tiny JS fixture exercising the shim. Examples:

- `tty.setRawMode(true)` flips `ICANON`/`ECHO` off; `(false)` restores.
  Driven by `tcgetattr` round-trip.
- `child_process.spawn('echo', ['hi']).stdout` emits `'hi\n'`.
- `crypto.createHash('sha256').update('abc').digest('hex')` produces
  the known sha256 hex.
- `https.request('https://api.github.com/zen')` returns a 200 (this
  is a Node-host test; the host has real internet).
- `fetch('https://api.github.com/zen')` returns 200.
- `worker_threads.Worker` round-trip.

These tests live under `host/test/` so they run in the standard
Vitest pass.

**Integration test** in `host/test/claude-code-cli.test.ts`:

A scripted invocation of the full CLI against a **mock Anthropic
endpoint** running on `localhost:4242` (a tiny Vitest helper that
serves canned SSE responses). Mock endpoint avoids API-key
requirements in CI and makes responses deterministic.

```ts
it('claude --version exits 0 with the pinned version', async () => {
  const { stdout, code } = await runProgram('/usr/local/bin/claude', ['--version']);
  expect(code).toBe(0);
  expect(stdout).toMatch(/^1\.0\./);
});

it('claude prompt round-trips against the mock API', async () => {
  const mock = await startMockAnthropic({
    responses: { 'hello': sseStream(['Hi!', ' ', 'How', ' can', ' I', ' help?']) },
  });
  const sess = await runProgramInteractive('/usr/local/bin/claude', [], {
    env: ['ANTHROPIC_BASE_URL=http://localhost:4242', 'ANTHROPIC_API_KEY=mock'],
  });
  await sess.expectScreen(/Welcome/);
  sess.send('hello\r');
  await sess.expectScreen(/Hi! How can I help\?/);
  sess.send('\x04');  // Ctrl+D
  expect(await sess.exitCode).toBe(0);
});

it('Bash tool runs ls / via bash.wasm', async () => {
  const mock = await startMockAnthropic({
    responses: { 'list root': sseToolCall({ tool: 'Bash', input: { command: 'ls /' } }) },
  });
  // ... drive CLI, assert tool stdout contains 'etc' or 'usr'
});

it('Read tool reads /etc/passwd from VFS', async () => {
  // ...
});

it('Conversation persists across runs', async () => {
  // run claude, send msg, exit, re-run, assert prior message visible
});
```

The Bash, Read, and Edit tool tests double as cross-component
integration: they exercise `cli.js` → `child_process.spawn` →
`fork`/`execve` → `bash.wasm` → kernel syscalls → file ops → result
back to `cli.js`. Failure here means *something in the chain broke*;
unit tests narrow it down.

**Manual smoke test** (the gate before merging): a tester runs
`./run.sh node` (or whatever Node-host demo entry exists), launches
the dash shell, types `claude`, and walks through the success
criteria from §1: prompt round-trips, Bash tool, Edit tool,
conversation persists, Ctrl+D exits clean.

**Full test gauntlet** per CLAUDE.md (all 6 suites, all green):

```bash
cargo test -p wasm-posix-kernel --target aarch64-apple-darwin --lib
(cd host && npx vitest run)
scripts/run-libc-tests.sh
scripts/run-posix-tests.sh
bash scripts/check-abi-version.sh
# (Open POSIX Test Suite is suite #4 above)
```

The expectation is **zero** new failures vs main on every suite.
This is a userspace+runtime port. If anything regresses on cargo,
libc, or POSIX suites, something kernel-shaped slipped in by
accident — that's the signal to stop and audit.

## §6. ABI & rollout

**ABI surface added: zero.**

This initiative does not bump `ABI_VERSION`, does not add a syscall
number, does not add a marshalled struct, does not change channel
layout. It rebuilds `node.wasm` against the existing kernel ABI (no
re-link required against the kernel; just a userspace rebuild). It
ships a new userspace package (`claude-code`) and a new userspace
library port (OpenSSL).

If `scripts/check-abi-version.sh` reports drift, **stop**. Something
slipped in that wasn't supposed to. Re-audit before bumping.

**Rollout sequencing** — five PRs, stacked, none merged until the
manual smoke test passes and Brandon validates. The user's policy
("we won't merge any PR before validation of Brandon") makes this
the natural model.

1. **PR #1 — OpenSSL 3.x port.** `examples/libs/openssl/build-openssl.sh`
   produces `libssl.a` + `libcrypto.a` cross-compiled with
   `wasm32posix-cc`. Headers go to `sysroot/include/openssl/`. Adds
   the `openssl` package to `examples/libs/openssl/deps.toml`. No
   binary outputs; this is a `kind = "library"` manifest. Test: a
   tiny C smoke test (`tools/openssl-smoke.c`) does
   `SSL_CTX_new` + `SSL_connect` to a Node-host echo server.

2. **PR #2 — `bootstrap.js`: TTY + child_process + crypto + worker_threads.**
   Pure JS changes plus the small C bridge file `qjs-crypto-bridge.c`
   that links libcrypto. Vitest unit tests for each shim. Rebuilds
   `node.wasm`. No CLI test yet.

3. **PR #3 — `bootstrap.js`: https + fetch + zlib.** The TLS bridge
   module `qjs-tls.c` lands here, links libssl. `https.request`,
   `fetch`, `zlib.gunzip` all go from stub to real. Vitest tests
   against a localhost TLS echo. Rebuilds `node.wasm`.

4. **PR #4 — `claude-code` package.** `examples/libs/claude-code/`
   manifest, build script, vendored CA bundle, wrapper. The
   integration tests in §5 live in this PR (mock Anthropic + the six
   end-to-end scenarios). Adds `ca-certificates` package.

5. **PR #5 — `rg.wasm` (ripgrep).** `examples/libs/ripgrep/` —
   Rust port via `cargo` cross-compile. Optional dep of
   `claude-code`; the CLI falls back to `grep` if missing. Lands
   last so PRs 1–4 aren't blocked.

After PR #4's manual smoke + tests pass, push the stack to
**`mho22/wasm-posix-kernel`** (the user's fork) and tag Brandon for
review. Brandon merges into upstream when satisfied; **we never
merge upstream ourselves** per the user's policy.

**Doc updates** (CLAUDE.md "every PR that adds user-facing features
must include corresponding documentation updates"):

- `docs/posix-status.md` — note that TLS/HTTPS userspace works via
  OpenSSL (kernel surface unchanged).
- `docs/architecture.md` — short subsection on "JS runtime
  extensions" pointing at bootstrap.js.
- `docs/sdk-guide.md` — note that `npm install` is **not** a runtime
  story; vendored bundles are the model.
- `docs/porting-guide.md` — "porting a Node.js CLI to wasm" using
  this initiative as the worked example.
- `README.md` — Claude Code in the "Software ported" list.

## §7. Risks & open questions

**R1. Claude Code v1.0.x release window may close.** Anthropic could
drop the v1 line entirely. Mitigation: pin to the exact 1.0.x
version we vendor; nothing forces an upgrade. If we need to track,
the work is "diff bootstrap shims against new release's API surface"
— scoped, repeatable. This is also why we don't commit the bundle
itself; we re-fetch on rebuild.

**R2. QuickJS-NG perf on 13 MB cli.js.** Cold start is the worry.
QuickJS-NG's `JS_Eval` is roughly 50–100 MB/s of source on modern
machines; 13 MB → maybe 200 ms. Plus bytecode caching: we can
pre-compile `cli.js` to QuickJS bytecode at build time (the same
`qjsc` we already use for `bootstrap.js`) and load that instead.
Drops cold start to "load 8 MB bytecode + jit" ≈ 50 ms. **Default
to this from the start.**

**R3. `cli.js` uses an API we haven't shimmed.** Most likely on
first run. The runtime extension list in §3 is best-effort; only an
actual run reveals everything. Mitigation: PR #4's integration test
runs the CLI; missing-API failures show up as throws with stack
traces pointing at exactly the shim to write. Treat these as
expected discoveries, not blockers.

**R4. SSE chunk parsing fights with QuickJS streaming.** Claude
Code's SSE parser expects `'data'` chunks of arbitrary size and
parses `data: ` prefixes itself. As long as our `IncomingMessage`
emits whatever chunks `tls_read` produced (and doesn't over-buffer),
this works. **Verify with an SSE test in PR #3.**

**R5. ca-certificates bundle staleness.** We vendor a Mozilla CA
bundle. Cert rotation matters; in 12 months our bundle will refuse
fresh Let's Encrypt chains. Mitigation: the build script fetches the
latest `cacert.pem` from `curl.se/ca/cacert.pem` and SHA-pins per
build. Refreshing is a 1-line PR.

**R6. `ANTHROPIC_BASE_URL` honored by all Claude Code paths?** The
CLI honors the env var for the API endpoint, but some telemetry /
update-check URLs may be hard-coded to anthropic.com. Mitigation:
disable telemetry via `DISABLE_TELEMETRY=1`; document the env vars in
the porting guide. Discovery happens during the integration test.

**R7. `bun:*` imports in `cli.js`?** Claude Code v1 was bundled with
Bun; if any `bun:sqlite` / `bun:test` survived into the public
bundle, QuickJS will choke. Skim of the v1 source-map indicates the
bundle replaces these with Node equivalents at build time, but this
needs verification on the exact pinned version. **First task in
implementation phase: download the bundle, grep for `bun:`, decide.**

---

This design ports Claude Code by extending the runtime, not the
kernel. The kernel is already capable of everything required;
absent surprises, ABI doesn't move. Subsequent phases — full v2.x
support, browser-host CORS proxy, MCP HTTP/SSE, sharp/image
attachments — remain available as separate initiatives once the v1
line is solid.
