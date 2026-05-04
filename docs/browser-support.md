# Browser Support

## Overview

The wasm-posix-kernel runs in modern browsers with SharedArrayBuffer support (Chrome 91+, Firefox 79+, Safari 16.4+). The centralized kernel architecture uses one kernel Wasm instance in a dedicated web worker, with each process running in a sub-worker.

## Required HTTP Headers

SharedArrayBuffer requires cross-origin isolation:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without these headers, `SharedArrayBuffer` is undefined and the kernel cannot initialize.

## Architecture

The kernel runs in a dedicated web worker, freeing the main thread for UI rendering and coordination only. The main thread uses `BrowserKernel` as a thin proxy that communicates with the kernel worker via `postMessage`.

```
Main Thread (BrowserKernel)              Kernel Worker
├── UI / rendering                       ├── CentralizedKernelWorker
├── MemoryFileSystem (shared SAB)        ├── Kernel Wasm instance
├── Page API (spawn, stdin, fs)          ├── VirtualPlatformIO (shared SAB)
├── PTY terminal ──pty events──>         ├── Syscall dispatch (Atomics.waitAsync)
├── App clients (MySQL, Redis)           ├── Process lifecycle (fork/exec/clone/exit)
│   └── async pipe ops ────────────────> ├── Process sub-worker creation
│                                        ├── Connection pump (HTTP↔TCP bridge)
│                                        ├── Exec reads binaries from shared FS
└──── MessagePort (RPC) ───────────────> └── Blocking retry management
                                                    │
Service Worker ──MessagePort──> Kernel Worker       │
                                                    │
                                   Process Workers ──┘ (SharedArrayBuffer channels)
```

| Component | Location | Purpose |
|-----------|----------|---------|
| `BrowserKernel` | Main thread | Thin proxy — sends messages to kernel worker |
| `kernel-worker-entry.ts` | Kernel worker | Hosts CentralizedKernelWorker, process lifecycle |
| `CentralizedKernelWorker` | Kernel worker | Kernel instance, handles all syscalls |
| Process Workers | Sub-workers of kernel worker | One per process, communicates via SharedArrayBuffer + Atomics |
| Service Worker | Separate | Intercepts HTTP for nginx/WordPress demos |
| Connection pump | Kernel worker | Bridges HTTP requests to kernel TCP pipes |

### Key Design Decisions

- **Kernel in dedicated worker**: Enables `Atomics.waitAsync` without V8 microtask chain freeze bug (main-thread-only). No need for MessageChannel-based polling. Zero UI jank regardless of syscall load.
- **Shared MemoryFileSystem**: Main thread and kernel worker share the same `SharedArrayBuffer`-backed filesystem via `MemoryFileSystem.fromExisting()`. The main thread pre-populates files (via VFS images or direct writes), the kernel worker reads them (exec binaries, configs, data files).
- **Exec reads from filesystem**: Like a real OS, `exec()` reads binaries from the shared filesystem. Programs are loaded into the FS by the page before spawning. Symlinks are used for multicall binaries (e.g., coreutils).
- **Connection pump in kernel worker**: HTTP↔TCP bridge runs inside the kernel worker with synchronous pipe I/O (direct Wasm export calls). Service worker transfers a MessagePort to the kernel worker for HTTP request delivery.
- **App clients on main thread**: MySQL and Redis wire protocol clients stay on the main thread and use async pipe operations via the message protocol.

### Syscall Flow

```
Process Worker → SharedArrayBuffer channel → Atomics.notify
→ CentralizedKernelWorker.handleChannel() → kernel_handle_channel()
→ result written to channel → Atomics.notify → Process Worker resumes
```

### HTTP Request Flow (nginx/WordPress demos)

```
Browser fetch → Service Worker intercepts
→ MessagePort → Kernel Worker (connection pump)
→ kernel_inject_connection() → pipe write (raw HTTP)
→ nginx (Wasm) accepts, processes → pipe read (response)
→ MessagePort → Service Worker → browser Response
```

## Capabilities

### Multi-Process
- `fork()` via Asyncify snapshot/restore — child runs in new sub-worker with copied memory
- `exec()` reads program binary from the shared filesystem, replaces process
- `posix_spawn()` — fork+exec with file actions (addchdir, addfchdir, addclose, adddup2)
- Process groups, wait/waitpid, cross-process signals, pipes

### Threads
- `clone()` with `CLONE_VM|CLONE_THREAD` — shared Memory between parent and thread Workers
- Used by MariaDB (5 threads), Redis (3 background threads)

### Networking
- TCP via kernel pipe-backed connections
- Service worker cookie jar for session persistence (WordPress)
- nginx serves static files and proxies to PHP-FPM via loopback TCP

### Filesystem
- `MemoryFileSystem` — SharedArrayBuffer-based VFS shared between main thread and kernel worker
- `OpfsFileSystem` — Origin Private File System for browser persistence
- `DeviceFileSystem` — `/dev/null`, `/dev/zero`, `/dev/urandom`, `/dev/ptmx`

### Terminal
- PTY support with full line discipline
- Interactive stdin via `appendStdinData` for incremental input
- xterm.js integration via `PtyTerminal`

### Framebuffer (`/dev/fb0`)
- 640×400 BGRA32 packed-pixel framebuffer; single-process owner.
- The pixel buffer lives in the process's `WebAssembly.Memory` (a `SharedArrayBuffer`); the kernel notifies the host of `(pid, addr, len, w, h, stride, fmt)` on `mmap`, and the host renders via `requestAnimationFrame` + a 2D-canvas `putImageData` per frame.
- `host/src/framebuffer/canvas-renderer.ts::attachCanvas(canvas, registry, pid, opts)` is the consumer-side renderer.
- Keyboard input: the demo page maps browser `KeyboardEvent.code` to AT-set-1 scancodes and feeds them through `appendStdinData(pid, …)`; fbDOOM-style software (which puts the tty into MEDIUMRAW mode) decodes those bytes as scancodes.
- Limitations: `fork` does not auto-bind the child; multi-buffering / vsync via `FBIOPAN_DISPLAY` is a no-op.

### Mouse input (`/dev/input/mice`)
- Demo pages attach `mousemove` / `mousedown` / `mouseup` listeners to the canvas and call `BrowserKernel.injectMouseEvent(dx, dy, buttons)`. The main thread posts a `mouse_inject` message to the kernel worker, which calls the kernel's `kernel_inject_mouse_event` export. The kernel encodes a 3-byte PS/2 frame and queues it on a global ring; user processes drain the queue via `read("/dev/input/mice", …)`.
- **Pointer Lock recommended.** The DOOM demo calls `canvas.requestPointerLock()` on first click so the browser delivers unbounded relative motion (`MouseEvent.movementX/Y`). Without pointer lock, `clientX/Y` deltas clamp at the canvas edges and feel sluggish for first-person controls. Press `Esc` to release the lock.
- Browser `deltaY` is positive-down; the demo inverts it before injection so the kernel queue holds canonical PS/2 (positive-up) deltas.
- Browser `MouseEvent.button` (0=L, 1=M, 2=R) is mapped to PS/2 button bits (bit0=L, bit1=R, bit2=M). Right-click suppresses the browser context menu via `contextmenu` `preventDefault()`.
- Single-owner device (one process can hold `/dev/input/mice` open at a time; second open from another pid returns `EBUSY`).

### Audio output (`/dev/dsp`)
- The kernel exposes an OSS-style `/dev/dsp` character device. User programs `open(O_WRONLY)`, configure rate / channels / format via `SNDCTL_DSP_*` ioctls, and `write()` interleaved 16-bit-LE PCM. The kernel buffers samples in a 256 KiB ring (~1.5 s of stereo S16 @ 44.1 kHz). On overflow the *oldest* whole frame drops — same trade-off real OSS hardware makes under hardware overrun.
- Demo pages drive a `setInterval` loop (~50 ms cadence) that calls `BrowserKernel.drainAudio(maxBytes)`. The kernel-worker drains the ring via the `kernel_drain_audio` wasm export (which respects whole-frame boundaries so stereo L/R never tear) and posts the bytes back. Main thread converts S16 → Float32, builds an `AudioBuffer`, and schedules an `AudioBufferSourceNode` on the `AudioContext` clock with a small lookahead so brief drain hiccups don't underrun.
- Single-owner device. Owner is released on close-of-last-fd / `execve` / `exit`; the ring is flushed at the same time so a successor open starts from silence. Format must be `AFMT_S16_LE`; other formats are `EINVAL`.
- **AudioContext gesture requirement.** `new AudioContext()` starts suspended in modern browsers and only resumes after a user gesture. The DOOM demo creates the context immediately after the user's "Start" click (which is itself a gesture), so `audioCtx.resume()` succeeds without a separate prompt.

## Browser Demos

Located in `examples/browser/pages/`:

| Demo | Software | Features |
|------|----------|----------|
| simple | C programs | Basic file I/O, printf |
| shell | dash + coreutils | Interactive shell with exec, pipes, PATH lookup |
| python | CPython 3.13 | REPL + script runner |
| php | PHP CLI | Script execution |
| nginx | nginx | Static file serving via service worker |
| nginx-php | nginx + PHP-FPM | FastCGI, fork workers |
| mariadb | MariaDB 10.5 | SQL database with threads |
| redis | Redis 7.2 | In-memory store with threads |
| wordpress | nginx + PHP-FPM + WP | Full stack with SQLite |
| lamp | MariaDB + nginx + PHP-FPM + WP | Full LAMP stack |
| doom | fbDOOM | `/dev/fb0` framebuffer + canvas renderer + keyboard via stdin + mouse via `/dev/input/mice` (pointer-locked) + SFX **and** OPL2-synthesized music via `/dev/dsp` → AudioContext |

Run demos: `cd examples/browser && npx vite --port 5198`

## VFS Images

Browser demos use pre-built **VFS images** — binary snapshots of a `MemoryFileSystem` containing all runtime files, directory structure, configs, and symlinks needed by a demo. At runtime, restoring a VFS image is a single buffer copy, replacing what would otherwise be hundreds or thousands of individual file creation operations.

### How it works

1. **Build time**: A TypeScript build script creates a `MemoryFileSystem`, writes files/dirs/symlinks into it, and calls `saveImage()` to produce a `.vfs` binary file.
2. **Runtime**: The demo page fetches the `.vfs` file, calls `MemoryFileSystem.fromImage(imageBytes, { maxByteLength })` to restore it, and passes the resulting filesystem to `BrowserKernel({ memfs })`.

```typescript
// Typical demo pattern
const [kernelBuf, vfsImageBuf] = await Promise.all([
  fetch(kernelUrl).then(r => r.arrayBuffer()),
  fetch(vfsImageUrl).then(r => r.arrayBuffer()),
]);

const memfs = MemoryFileSystem.fromImage(
  new Uint8Array(vfsImageBuf),
  { maxByteLength: 512 * 1024 * 1024 },
);

const kernel = await BrowserKernel.create({ kernelWasm: kernelBuf, memfs });
```

### VFS images per demo

| Demo | Image | Build command | What's inside |
|------|-------|--------------|---------------|
| Python | `python.vfs` | `bash examples/browser/scripts/build-python-vfs-image.sh` | CPython stdlib |
| Erlang | `erlang.vfs` | `bash examples/browser/scripts/build-erlang-vfs-image.sh` | OTP runtime |
| Perl | `perl.vfs` | `bash examples/browser/scripts/build-perl-vfs-image.sh` | Perl stdlib |
| Shell | `shell.vfs` | `bash examples/browser/scripts/build-shell-vfs-image.sh` | dash, symlinks, vim runtime |
| WordPress | `wordpress.vfs` | `bash examples/browser/scripts/build-wp-vfs-image.sh` | WP files, nginx/PHP configs |
| LAMP | `lamp.vfs` | `bash examples/browser/scripts/build-lamp-vfs-image.sh` | MariaDB + WP + configs |
| MariaDB test | `mariadb-test.vfs` | `bash examples/browser/scripts/build-mariadb-test-vfs-image.sh` | MariaDB + test suite |

VFS images are `.gitignore`d and must be built locally. The `run.sh` script handles this automatically (e.g., `./run.sh browser` builds any missing VFS images before starting the dev server).

### Building VFS images

Each build script requires the corresponding software to be compiled first (e.g., `build-cpython.sh` before `build-python-vfs-image.sh`). The `run.sh` script orchestrates this:

```bash
./run.sh build python-vfs    # Build Python VFS image
./run.sh build shell-vfs     # Build Shell VFS image
./run.sh build all            # Build everything including all VFS images
```

### Adding a new VFS image

1. Create `examples/browser/scripts/build-<name>-vfs-image.ts` — import helpers from `vfs-image-helpers.ts`
2. Create `examples/browser/scripts/build-<name>-vfs-image.sh` — shell wrapper that runs the TypeScript script
3. Update the demo's `main.ts` to fetch the `.vfs` file and use `MemoryFileSystem.fromImage()`
4. Add a build target in `run.sh`

The shared helpers in `vfs-image-helpers.ts` provide:
- `writeVfsFile(fs, path, content)` / `writeVfsBinary(fs, path, data)` — write files
- `ensureDirRecursive(fs, path)` — create directory trees
- `symlink(fs, target, path)` — create symlinks
- `walkAndWrite(fs, hostDir, mountPrefix, opts?)` — recursively walk a host directory into the VFS
- `saveImage(fs, outFile)` — save and write the image to disk

## Vite Configuration

```typescript
// vite.config.ts
export default {
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
};
```

## Known Limitations

### SharedArrayBuffer restrictions
Chrome rejects SharedArrayBuffer-backed views in `TextDecoder.decode()` and `crypto.getRandomValues()`. Always copy to a temporary non-shared buffer first.

### No raw server sockets
Browser sandbox prevents listening on ports. nginx/PHP-FPM demos use a service worker to intercept HTTP requests and inject them as kernel TCP connections via the connection pump.

### Memory per process
Each process gets `WebAssembly.Memory(shared: true, initial: maxPages, max: maxPages)`. Shared memory reserves the full virtual address space at construction time, so `maxMemoryPages` should be tuned for multi-process demos (e.g., 4096 pages = 256MB for WordPress with 5+ processes).
