interface KernelConfig {
    maxWorkers: number;
    dataBufferSize: number;
    useSharedMemory: boolean;
    /** Log every syscall with decoded args and return values to stderr */
    enableSyscallLog?: boolean;
}
interface StatResult {
    dev: number;
    ino: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    size: number;
    atimeMs: number;
    mtimeMs: number;
    ctimeMs: number;
}
interface PlatformIO {
    open(path: string, flags: number, mode: number): number;
    close(handle: number): number;
    read(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    write(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    seek(handle: number, offset: number, whence: number): number;
    fstat(handle: number): StatResult;
    stat(path: string): StatResult;
    lstat(path: string): StatResult;
    mkdir(path: string, mode: number): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    rename(oldPath: string, newPath: string): void;
    link(existingPath: string, newPath: string): void;
    symlink(target: string, path: string): void;
    readlink(path: string): string;
    chmod(path: string, mode: number): void;
    chown(path: string, uid: number, gid: number): void;
    access(path: string, mode: number): void;
    utimensat(path: string, atimeSec: number, atimeNsec: number, mtimeSec: number, mtimeNsec: number): void;
    opendir(path: string): number;
    readdir(handle: number): {
        name: string;
        type: number;
        ino: number;
    } | null;
    closedir(handle: number): void;
    ftruncate(handle: number, length: number): void;
    fsync(handle: number): void;
    fchmod(handle: number, mode: number): void;
    fchown(handle: number, uid: number, gid: number): void;
    clockGettime(clockId: number): {
        sec: number;
        nsec: number;
    };
    nanosleep(sec: number, nsec: number): void;
    waitpid?(pid: number, options: number): {
        pid: number;
        status: number;
    };
    network?: NetworkIO;
}
interface NetworkIO {
    connect(handle: number, addr: Uint8Array, port: number): void;
    send(handle: number, data: Uint8Array, flags: number): number;
    recv(handle: number, maxLen: number, flags: number): Uint8Array;
    close(handle: number): void;
    getaddrinfo(hostname: string): Uint8Array;
}

declare class SharedPipeBuffer {
    private meta;
    private data;
    private cap;
    private sab;
    private constructor();
    static create(capacity?: number): SharedPipeBuffer;
    static fromSharedBuffer(sab: SharedArrayBuffer): SharedPipeBuffer;
    getBuffer(): SharedArrayBuffer;
    capacity(): number;
    available(): number;
    isReadOpen(): boolean;
    isWriteOpen(): boolean;
    write(src: Uint8Array): number;
    read(dst: Uint8Array): number;
    closeRead(): void;
    closeWrite(): void;
}

/**
 * Tracks live `/dev/fb0` mappings reported by the kernel.
 *
 * Two mapping modes — both flow through the same registry:
 *
 *   - **mmap-based** — pixel buffer lives inside the process's wasm
 *     `Memory` (a SharedArrayBuffer). The kernel emits a real
 *     `bind(pid, addr, len, w, h, stride, fmt)` and renderers project
 *     `[addr, addr+len)` of the process Memory onto a canvas. The
 *     view is rebuilt after every `WebAssembly.Memory.grow()`.
 *
 *   - **write-based** — used by software (e.g. fbDOOM) that does
 *     `write(fd_fb, …)` rather than mmap. The kernel emits a
 *     *sentinel* `bind` with `addr === 0 && len === 0`. The host
 *     allocates its own pixel buffer (`hostBuffer`); pixels arrive
 *     through `fbWrite(pid, offset, bytes)`. Renderers read directly
 *     from `hostBuffer` — no process-Memory access.
 *
 * Pure metadata + lazy view caches; the registry doesn't know what a
 * canvas is.
 */
type FbFormat = "BGRA32";
type FbBindingInput = {
    pid: number;
    /** Offset within the process's wasm Memory. `0` together with
     *  `len === 0` is the sentinel for a write-based binding (see file
     *  header) — the host owns the buffer in that case. */
    addr: number;
    /** Length in bytes (smem_len). `0` together with `addr === 0` is
     *  the write-based sentinel. */
    len: number;
    w: number;
    h: number;
    /** Bytes per row. */
    stride: number;
    fmt: FbFormat;
};
type FbBinding = FbBindingInput & {
    /**
     * Lazily-built typed-array view a renderer can pass to ImageData.
     * For mmap-based bindings the view points into the process Memory
     * SAB and is invalidated on `memory.grow`. For write-based
     * bindings it points into `hostBuffer` and never invalidates.
     */
    view: Uint8ClampedArray | null;
    /** Cached `ImageData` matching `view`; invalidated together. */
    imageData: ImageData | null;
    /**
     * Host-allocated pixel buffer for write-based bindings. `null` for
     * mmap-based bindings.
     */
    hostBuffer: Uint8ClampedArray | null;
};
type FbChangeEvent = "bind" | "unbind";
type FbChangeListener = (pid: number, ev: FbChangeEvent) => void;
type FbWriteListener = (pid: number, offset: number, bytes: Uint8Array) => void;
declare class FramebufferRegistry {
    private bindings;
    private listeners;
    private writeListeners;
    bind(b: FbBindingInput): void;
    unbind(pid: number): void;
    get(pid: number): FbBinding | undefined;
    /**
     * Drop cached view + ImageData for `pid`. Renderers must re-build them
     * from the (possibly new) process Memory SAB on the next frame. Call
     * after `WebAssembly.Memory.grow()` invalidates the prior buffer ref.
     * No-op for write-based bindings (the host buffer doesn't move).
     */
    rebindMemory(pid: number): void;
    /**
     * Push pixel bytes from the kernel into a write-based binding's
     * host buffer at the given byte offset. No-op (or out-of-range
     * clamp) if the binding is mmap-based or doesn't exist.
     *
     * Also fires `onWrite` listeners (used by browser hosts to forward
     * the bytes to a main-thread mirror registry).
     */
    fbWrite(pid: number, offset: number, bytes: Uint8Array): void;
    /**
     * Subscribe to write-based pixel pushes. Returns an unsubscribe
     * function. Used by the browser kernel-worker to forward writes to
     * the main-thread registry.
     */
    onWrite(fn: FbWriteListener): () => void;
    list(): FbBinding[];
    onChange(fn: FbChangeListener): () => void;
}

/**
 * WasmPosixKernel — Loads the kernel Wasm module and provides host
 * import functions that bridge Wasm syscalls to the PlatformIO backend.
 *
 * Host import functions exposed to Wasm:
 *   env.host_open(path_ptr, path_len, flags, mode) -> i64
 *   env.host_close(handle: i64) -> i32
 *   env.host_read(handle: i64, buf_ptr, buf_len) -> i32
 *   env.host_write(handle: i64, buf_ptr, buf_len) -> i32
 *   env.host_seek(handle: i64, offset_lo, offset_hi, whence) -> i64
 *   env.host_fstat(handle: i64, stat_ptr) -> i32
 *
 * IMPORTANT: Wasm i64 values appear as BigInt in JavaScript.
 */

interface KernelCallbacks {
    onKill?: (pid: number, signal: number) => number;
    onExec?: (path: string) => number;
    onAlarm?: (seconds: number) => number;
    onPosixTimer?: (timerId: number, signo: number, valueMs: number, intervalMs: number) => number;
    onFork?: (forkSab: SharedArrayBuffer) => void;
    onWaitpid?: (targetPid: number, options: number) => void;
    onClone?: (fnPtr: number, arg: number, stackPtr: number, tlsPtr: number, ctidPtr: number) => number;
    onNetListen?: (fd: number, port: number, addr: [number, number, number, number]) => number;
    onStdout?: (data: Uint8Array) => void;
    onStderr?: (data: Uint8Array) => void;
    /** Read up to maxLen bytes from stdin. Return a Uint8Array with available data, or empty/null for EOF. */
    onStdin?: (maxLen: number) => Uint8Array | null;
}
declare class WasmPosixKernel {
    private config;
    private io;
    private callbacks;
    private instance;
    private memory;
    private sharedPipes;
    private signalWakeSab;
    private sharedLockTable;
    private programFuncTable;
    private forkSab;
    private waitpidSab;
    isThreadWorker: boolean;
    /** PID for this kernel instance (set by the worker) */
    pid: number;
    /**
     * Live `/dev/fb0` mappings the kernel has reported via
     * `host_bind_framebuffer`. Renderers (canvas in browser, no-op in
     * Node) read this on each frame.
     */
    readonly framebuffers: FramebufferRegistry;
    /**
     * Merge additional callbacks into the existing set.
     * Existing callbacks not specified in the argument are preserved.
     */
    mergeCallbacks(callbacks: Partial<KernelCallbacks>): void;
    /**
     * Set the user program's indirect function table so signal handlers
     * registered by the program can be called from the kernel.
     */
    setProgramFuncTable(table: WebAssembly.Table): void;
    constructor(config: KernelConfig, io: PlatformIO, callbacks?: KernelCallbacks);
    registerSharedPipe(handle: number, sab: SharedArrayBuffer, end: "read" | "write"): void;
    unregisterSharedPipe(handle: number): void;
    /** Returns all registered shared pipes (for transferring during exec). */
    getSharedPipes(): Map<number, {
        pipe: SharedPipeBuffer;
        end: "read" | "write";
    }>;
    registerSignalWakeSab(sab: SharedArrayBuffer): void;
    registerSharedLockTable(sab: SharedArrayBuffer): void;
    registerForkSab(sab: SharedArrayBuffer): void;
    registerWaitpidSab(sab: SharedArrayBuffer): void;
    /**
     * Load and instantiate the kernel Wasm module.
     *
     * @param wasmBytes - The compiled kernel Wasm binary
     */
    init(wasmBytes: BufferSource): Promise<void>;
    /**
     * Like init(), but uses an existing shared WebAssembly.Memory instead of
     * creating a new one. Used by thread workers that share the parent's memory.
     */
    initWithMemory(wasmBytes: BufferSource, memory: WebAssembly.Memory): Promise<void>;
    private buildImportObject;
    /**
     * Access the Wasm memory (e.g. for tests or advanced use).
     */
    getMemory(): WebAssembly.Memory | null;
    /**
     * Access the Wasm instance (e.g. to call exported functions).
     */
    getInstance(): WebAssembly.Instance | null;
    private getMemoryBuffer;
    private getMemoryDataView;
    /** Copy `len` bytes from kernel memory at `ptr` into a non-shared
     *  Uint8Array. Used by host imports that consume kernel-scratch
     *  payloads (e.g. host_fb_write).
     */
    private readKernelBytes;
    /**
     * host_open(path_ptr, path_len, flags, mode) -> i64
     *
     * Reads the path from Wasm memory and delegates to PlatformIO.
     * For the initial synchronous implementation, we cannot truly await
     * the async PlatformIO.open — so we use a synchronous fallback that
     * blocks on the promise. In practice, NodePlatformIO uses sync fs
     * operations internally, so the promise resolves immediately.
     */
    private hostOpen;
    /**
     * host_close(handle: i64) -> i32
     */
    private hostClose;
    /**
     * host_read(handle: i64, buf_ptr, buf_len) -> i32
     *
     * For handle 0 (stdin): return 0 (no stdin support yet).
     * Other handles: delegate to PlatformIO.
     */
    private hostRead;
    /**
     * host_write(handle: i64, buf_ptr, buf_len) -> i32
     *
     * For handles 1 (stdout) and 2 (stderr): uses callback if provided,
     * falls back to process.stdout/stderr (Node.js), then console (browser).
     * Other handles: delegate to PlatformIO.
     */
    private hostWrite;
    /**
     * host_seek(handle: i64, offset_lo, offset_hi, whence) -> i64
     *
     * Combines the low and high 32-bit parts into a 64-bit offset.
     */
    private hostSeek;
    /**
     * host_fstat(handle: i64, stat_ptr) -> i32
     *
     * Writes a WasmStat structure into Wasm memory at stat_ptr.
     *
     * WasmStat layout (repr(C), 88 bytes total):
     *   0:  st_dev        u64
     *   8:  st_ino        u64
     *   16: st_mode       u32
     *   20: st_nlink      u32
     *   24: st_uid        u32
     *   28: st_gid        u32
     *   32: st_size       u64
     *   40: st_atime_sec  u64
     *   48: st_atime_nsec u32
     *   52: (pad)         u32
     *   56: st_mtime_sec  u64
     *   64: st_mtime_nsec u32
     *   68: (pad)         u32
     *   72: st_ctime_sec  u64
     *   80: st_ctime_nsec u32
     *   84: _pad          u32
     */
    private hostFstat;
    /**
     * Write a StatResult into the WasmStat struct at the given Wasm memory offset.
     */
    private writeStatToMemory;
    /**
     * Read a UTF-8 path string from Wasm memory.
     */
    private readPathFromMemory;
    /**
     * host_stat(path_ptr, path_len, stat_ptr) -> i32
     */
    private hostStat;
    /**
     * host_lstat(path_ptr, path_len, stat_ptr) -> i32
     */
    private hostLstat;
    /**
     * host_mkdir(path_ptr, path_len, mode) -> i32
     */
    private hostMkdir;
    /**
     * host_rmdir(path_ptr, path_len) -> i32
     */
    private hostRmdir;
    /**
     * host_unlink(path_ptr, path_len) -> i32
     */
    private hostUnlink;
    /**
     * host_rename(old_ptr, old_len, new_ptr, new_len) -> i32
     */
    private hostRename;
    /**
     * host_link(old_ptr, old_len, new_ptr, new_len) -> i32
     */
    private hostLink;
    /**
     * host_symlink(target_ptr, target_len, link_ptr, link_len) -> i32
     */
    private hostSymlink;
    /**
     * host_readlink(path_ptr, path_len, buf_ptr, buf_len) -> i32
     *
     * Returns the number of bytes written to the buffer, or -1 on error.
     */
    private hostReadlink;
    /**
     * host_chmod(path_ptr, path_len, mode) -> i32
     */
    private hostChmod;
    /**
     * host_chown(path_ptr, path_len, uid, gid) -> i32
     */
    private hostChown;
    /**
     * host_access(path_ptr, path_len, amode) -> i32
     */
    private hostAccess;
    /**
     * host_utimensat(path_ptr, path_len, atime_sec, atime_nsec, mtime_sec, mtime_nsec) -> i32
     */
    private hostUtimensat;
    /**
     * host_waitpid(pid, options, status_ptr) -> i32
     * Returns child pid on success, negative errno on error.
     * Writes wait status to status_ptr.
     */
    private hostWaitpid;
    /**
     * host_opendir(path_ptr, path_len) -> i64
     *
     * Returns a directory handle as i64, or -1 on error.
     */
    private hostOpendir;
    /**
     * host_readdir(dir_handle: i64, dirent_ptr, name_ptr, name_len) -> i32
     *
     * Writes a WasmDirent struct and the entry name to Wasm memory.
     * Returns 1 if an entry was written, 0 at end-of-directory, -1 on error.
     */
    private hostReaddir;
    /**
     * host_closedir(dir_handle: i64) -> i32
     */
    private hostClosedir;
    /**
     * host_clock_gettime(clock_id, sec_ptr, nsec_ptr) -> i32
     *
     * Writes the current time (seconds and nanoseconds) to Wasm memory
     * at the given pointers.
     */
    private hostClockGettime;
    /**
     * host_nanosleep(sec: i64, nsec: i64) -> i32
     *
     * Sleep for the specified duration. The i64 parameters appear as
     * BigInt in JavaScript.
     */
    private hostNanosleep;
    private hostFtruncate;
    private hostFsync;
    /**
     * host_fchmod(handle: i64, mode: u32) -> i32
     */
    private hostFchmod;
    /**
     * host_fchown(handle: i64, uid: u32, gid: u32) -> i32
     */
    private hostFchown;
    private hostKill;
    private hostExec;
    private hostSetAlarm;
    private hostSetPosixTimer;
    private hostSigsuspendWait;
    /**
     * Create a socket. Returns the fd or throws on error.
     */
    socket(domain: number, type: number, protocol: number): number;
    /**
     * Create a connected pair of Unix domain stream sockets.
     * Returns [fd0, fd1].
     */
    socketpair(domain: number, type: number, protocol: number): [number, number];
    /**
     * Shut down part of a full-duplex socket connection.
     */
    shutdown(fd: number, how: number): void;
    /**
     * Send data on a connected socket. Returns bytes sent.
     */
    send(fd: number, data: Uint8Array, flags?: number): number;
    /**
     * Receive data from a connected socket. Returns the received data.
     */
    recv(fd: number, maxLen: number, flags?: number): Uint8Array;
    /**
     * Poll file descriptors for I/O readiness.
     * Returns array of {fd, events, revents} with revents filled in.
     */
    poll(fds: Array<{
        fd: number;
        events: number;
    }>, timeout: number): Array<{
        fd: number;
        events: number;
        revents: number;
    }>;
    /**
     * Get a socket option value.
     */
    getsockopt(fd: number, level: number, optname: number): number;
    /**
     * Set a socket option value.
     */
    setsockopt(fd: number, level: number, optname: number, value: number): void;
    /**
     * Get terminal attributes (48 bytes: c_iflag, c_oflag, c_cflag, c_lflag + c_cc).
     */
    tcgetattr(fd: number): Uint8Array;
    /**
     * Set terminal attributes.
     * action: 0=TCSANOW, 1=TCSADRAIN, 2=TCSAFLUSH
     */
    tcsetattr(fd: number, action: number, attrs: Uint8Array): void;
    /**
     * Perform an ioctl operation.
     * For TIOCGWINSZ (0x5413): returns 8-byte buffer (ws_row, ws_col, ws_xpixel, ws_ypixel as u16 LE)
     * For TIOCSWINSZ (0x5414): pass 8-byte buffer to set window size
     */
    ioctl(fd: number, request: number, buf?: Uint8Array): Uint8Array;
    /**
     * Set signal handler (legacy API). Returns previous handler value.
     * handler: 0=SIG_DFL, 1=SIG_IGN, or function pointer index
     */
    signal(signum: number, handler: number): number;
    /**
     * Set file creation mask. Returns previous mask.
     */
    umask(mask: number): number;
    /**
     * Get system identification. Returns object with sysname, nodename, release, version, machine.
     */
    uname(): {
        sysname: string;
        nodename: string;
        release: string;
        version: string;
        machine: string;
    };
    /**
     * Get configurable system variable value.
     */
    sysconf(name: number): number;
    /**
     * Duplicate fd with flags. Unlike dup2, returns error if oldfd == newfd.
     */
    dup3(oldfd: number, newfd: number, flags: number): number;
    /**
     * Create pipe with flags (O_NONBLOCK, O_CLOEXEC). Returns [readFd, writeFd].
     */
    pipe2(flags: number): [number, number];
    /**
     * Truncate file to specified length.
     */
    ftruncate(fd: number, length: number): void;
    /**
     * Synchronize file state to storage.
     */
    fsync(fd: number): void;
    /**
     * Truncate a file by path to specified length.
     */
    truncate(pathPtr: number, pathLen: number, length: number): void;
    /**
     * Synchronize file data to storage (alias for fsync in Wasm).
     */
    fdatasync(fd: number): void;
    /**
     * Change file mode via fd.
     */
    fchmod(fd: number, mode: number): void;
    /**
     * Change file owner/group via fd.
     */
    fchown(fd: number, uid: number, gid: number): void;
    /**
     * Get process group ID.
     */
    getpgrp(): number;
    /**
     * Set process group ID.
     */
    setpgid(pid: number, pgid: number): void;
    /**
     * Get session ID.
     */
    getsid(pid: number): number;
    /**
     * Create new session.
     */
    setsid(): number;
    /**
     * Set real and effective user ID.
     */
    setuid(uid: number): void;
    /**
     * Set real and effective group ID.
     */
    setgid(gid: number): void;
    /**
     * Set effective user ID.
     */
    seteuid(euid: number): void;
    /**
     * Set effective group ID.
     */
    setegid(egid: number): void;
    /**
     * Get resource usage. Returns 144-byte rusage struct.
     */
    getrusage(who: number): Uint8Array;
    /**
     * select() — synchronous I/O multiplexing.
     * Takes fd arrays for read/write/except monitoring, returns arrays of ready fds.
     */
    select(nfds: number, readfds: number[] | null, writefds: number[] | null, exceptfds: number[] | null): {
        readReady: number[];
        writeReady: number[];
        exceptReady: number[];
    };
    private hostNetConnect;
    private hostNetSend;
    private hostNetRecv;
    private hostNetClose;
    private hostNetListen;
    private hostGetaddrinfo;
    private static readonly F_GETLK;
    private static readonly F_SETLK;
    private static readonly F_SETLKW;
    private static readonly F_UNLCK;
    private hostFcntlLock;
    /**
     * host_fork() -> i32
     * Guest-initiated fork. Posts fork_request to host, blocks on Atomics.wait
     * until host signals back with child PID via forkSab.
     *
     * forkSab layout: Int32Array(2) on SharedArrayBuffer(8)
     *   [0] = flag (0 = waiting, 1 = done)
     *   [1] = result (child PID or negative errno)
     */
    private hostFork;
    private hostFutexWait;
    private hostFutexWake;
    private hostClone;
}

/**
 * Shared-memory syscall channel for communication between the Wasm
 * userspace module and the host kernel.
 *
 * Memory layout (must match `wasm_posix_shared::channel`):
 *
 *   Offset  Size  Field
 *   0..3    4B    status (IDLE=0, PENDING=1, COMPLETE=2, ERROR=3)
 *   4..7    4B    syscall number
 *   8..31   24B   arguments (6 x i32)
 *   32..35  4B    return value
 *   36..39  4B    errno
 *   40..N         data transfer buffer
 */
declare const enum ChannelStatus {
    Idle = 0,
    Pending = 1,
    Complete = 2,
    Error = 3
}
declare class SyscallChannel {
    private readonly view;
    private readonly i32Array;
    private readonly buffer;
    private readonly byteOffset;
    constructor(buffer: SharedArrayBuffer | ArrayBuffer, byteOffset?: number);
    get status(): ChannelStatus;
    set status(value: ChannelStatus);
    get syscallNumber(): number;
    getArg(index: number): number;
    setReturn(value: number): void;
    setErrno(value: number): void;
    get dataBuffer(): Uint8Array;
    /**
     * Set status to Complete and wake any thread waiting on the status field.
     * Only meaningful when the underlying buffer is a SharedArrayBuffer.
     */
    notifyComplete(): void;
    /**
     * Set status to Error and wake any thread waiting on the status field.
     * Only meaningful when the underlying buffer is a SharedArrayBuffer.
     */
    notifyError(): void;
    /**
     * Block the current thread until the channel status transitions to
     * Complete or Error. Returns the final status.
     *
     * Only works with SharedArrayBuffer (requires Atomics.wait support).
     */
    waitForComplete(): ChannelStatus;
    private get isShared();
}

interface WorkerHandle {
    postMessage(message: unknown, transfer?: Transferable[]): void;
    on(event: "message", handler: (message: unknown) => void): void;
    on(event: "error", handler: (error: Error) => void): void;
    on(event: "exit", handler: (code: number) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    terminate(): Promise<number>;
}
interface WorkerAdapter {
    createWorker(workerData: unknown): WorkerHandle;
}
declare class MockWorkerHandle implements WorkerHandle {
    sentMessages: unknown[];
    private messageHandlers;
    private errorHandlers;
    private exitHandlers;
    postMessage(message: unknown): void;
    on(event: "message", handler: (msg: unknown) => void): void;
    on(event: "error", handler: (err: Error) => void): void;
    on(event: "exit", handler: (code: number) => void): void;
    off(event: string, handler: (...args: any[]) => void): void;
    terminate(): Promise<number>;
    simulateMessage(msg: unknown): void;
    simulateError(err: Error): void;
    simulateExit(code: number): void;
}
declare class MockWorkerAdapter implements WorkerAdapter {
    lastWorker: MockWorkerHandle | null;
    lastWorkerData: unknown;
    allWorkers: MockWorkerHandle[];
    createWorker(workerData: unknown): WorkerHandle;
}
declare class NodeWorkerAdapter implements WorkerAdapter {
    private entryUrl;
    private _compiledEntry;
    constructor(entryUrl?: URL);
    /**
     * Try to find a compiled .js version of the entry file.
     * Checks: ../dist/<basename>.js (tsup output), then sibling .js.
     */
    private resolveCompiledEntry;
    createWorker(workerData: unknown): WorkerHandle;
}

type HostToWorkerMessage = CentralizedWorkerInitMessage | CentralizedThreadInitMessage | WorkerTerminateMessage | DeliverSignalMessage | ExecReplyMessage;
interface DeliverSignalMessage {
    type: "deliver_signal";
    signal: number;
}
/**
 * Init message for centralized-mode Workers.
 * These Workers don't instantiate a kernel — they use channel IPC
 * to communicate with the CentralizedKernelWorker.
 */
interface CentralizedWorkerInitMessage {
    type: "centralized_init";
    pid: number;
    ppid: number;
    /** User program bytes (compiled with channel_syscall.c — no kernel imports) */
    programBytes: ArrayBuffer;
    /** Pre-compiled WebAssembly module (avoids recompilation in web workers) */
    programModule?: WebAssembly.Module;
    /** Shared Memory for this process (also shared with CentralizedKernelWorker) */
    memory: WebAssembly.Memory;
    /** Channel offset within the shared Memory for this thread's syscall channel */
    channelOffset: number;
    /** Optional env vars to set up in the program */
    env?: string[];
    /** Optional argv */
    argv?: string[];
    /** Optional cwd */
    cwd?: string;
    /** If true, this is a fork child created via asyncify — do rewind instead of normal _start */
    isForkChild?: boolean;
    /** Address of asyncify data buffer in memory (used for fork child rewind) */
    asyncifyBufAddr?: number;
    /** Pointer width: 4 for wasm32, 8 for wasm64. Defaults to 4. */
    ptrWidth?: 4 | 8;
    /**
     * Kernel's advertised ABI version (read from its `__abi_version`
     * export at kernel startup). Worker compares against the program's
     * own `__abi_version` export and refuses mismatches.
     */
    kernelAbiVersion?: number;
}
/**
 * Init message for thread Workers in centralized mode.
 * Threads share the parent process's Memory and run a function pointer.
 */
interface CentralizedThreadInitMessage {
    type: "centralized_thread_init";
    pid: number;
    tid: number;
    programBytes: ArrayBuffer;
    programModule?: WebAssembly.Module;
    memory: WebAssembly.Memory;
    channelOffset: number;
    fnPtr: number;
    argPtr: number;
    stackPtr: number;
    tlsPtr: number;
    ctidPtr: number;
    /** Pre-allocated address in shared memory for Wasm TLS initialization */
    tlsAllocAddr: number;
    /** Pointer width: 4 for wasm32, 8 for wasm64. Defaults to 4. */
    ptrWidth?: 4 | 8;
    /** See [`CentralizedWorkerInitMessage#kernelAbiVersion`]. */
    kernelAbiVersion?: number;
}
interface WorkerTerminateMessage {
    type: "terminate";
}
type WorkerToHostMessage = WorkerReadyMessage | WorkerExitMessage | ThreadExitMessage | WorkerErrorMessage | ExecRequestMessage | ExecCompleteMessage | AlarmSetMessage;
interface WorkerReadyMessage {
    type: "ready";
    pid: number;
}
interface WorkerExitMessage {
    type: "exit";
    pid: number;
    status: number;
}
interface ThreadExitMessage {
    type: "thread_exit";
    pid: number;
    tid: number;
}
interface WorkerErrorMessage {
    type: "error";
    pid: number;
    message: string;
}
interface ExecRequestMessage {
    type: "exec_request";
    pid: number;
    path: string;
}
interface ExecCompleteMessage {
    type: "exec_complete";
    pid: number;
}
interface AlarmSetMessage {
    type: "alarm_set";
    pid: number;
    seconds: number;
}
interface ExecReplyMessage {
    type: "exec_reply";
    wasmBytes: ArrayBuffer;
    programBytes?: ArrayBuffer;
}

/**
 * Centralized worker entry points.
 *
 * Programs compiled with channel_syscall.c run in Worker threads.
 * All syscalls go through a shared-memory channel to the
 * CentralizedKernelWorker on the main thread.
 */

interface MessagePort {
    postMessage(msg: unknown, transferList?: unknown[]): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
}
/**
 * Main process worker entry point.
 */
declare function centralizedWorkerMain(port: MessagePort, initData: CentralizedWorkerInitMessage): Promise<void>;
/**
 * Thread worker entry point for centralized mode.
 *
 * Threads share the parent process's Memory. This function:
 * 1. Instantiates the same Wasm module with shared memory (start section stripped)
 * 2. Allocates TLS for the thread
 * 3. Sets the channel base and stack pointer
 * 4. Calls the thread function via the indirect function table
 * 5. On return: performs CLONE_CHILD_CLEARTID (write 0 + futex wake at ctidPtr)
 */
declare function centralizedThreadWorkerMain(port: MessagePort, initData: CentralizedThreadInitMessage): Promise<void>;

interface DirEntry {
    name: string;
    type: number;
    ino: number;
}
interface FileSystemBackend {
    open(path: string, flags: number, mode: number): number;
    close(handle: number): number;
    read(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    write(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    seek(handle: number, offset: number, whence: number): number;
    fstat(handle: number): StatResult;
    ftruncate(handle: number, length: number): void;
    fsync(handle: number): void;
    fchmod(handle: number, mode: number): void;
    fchown(handle: number, uid: number, gid: number): void;
    stat(path: string): StatResult;
    lstat(path: string): StatResult;
    mkdir(path: string, mode: number): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    rename(oldPath: string, newPath: string): void;
    link(existingPath: string, newPath: string): void;
    symlink(target: string, path: string): void;
    readlink(path: string): string;
    chmod(path: string, mode: number): void;
    chown(path: string, uid: number, gid: number): void;
    access(path: string, mode: number): void;
    utimensat(path: string, atimeSec: number, atimeNsec: number, mtimeSec: number, mtimeNsec: number): void;
    opendir(path: string): number;
    readdir(handle: number): DirEntry | null;
    closedir(handle: number): void;
}
interface TimeProvider {
    clockGettime(clockId: number): {
        sec: number;
        nsec: number;
    };
    nanosleep(sec: number, nsec: number): void;
}
interface MountConfig {
    mountPoint: string;
    backend: FileSystemBackend;
    readonly?: boolean;
}

declare class VirtualPlatformIO implements PlatformIO {
    private mounts;
    private time;
    private fileHandles;
    private dirHandles;
    private nextFileHandle;
    private nextDirHandle;
    network?: NetworkIO;
    constructor(mounts: MountConfig[], time: TimeProvider);
    private resolve;
    private resolveTwoPaths;
    private getFileHandle;
    private getDirHandle;
    open(path: string, flags: number, mode: number): number;
    close(handle: number): number;
    read(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    write(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    seek(handle: number, offset: number, whence: number): number;
    fstat(handle: number): StatResult;
    ftruncate(handle: number, length: number): void;
    fsync(handle: number): void;
    fchmod(handle: number, mode: number): void;
    fchown(handle: number, uid: number, gid: number): void;
    stat(path: string): StatResult;
    lstat(path: string): StatResult;
    mkdir(path: string, mode: number): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    rename(oldPath: string, newPath: string): void;
    link(existingPath: string, newPath: string): void;
    symlink(target: string, path: string): void;
    readlink(path: string): string;
    chmod(path: string, mode: number): void;
    chown(path: string, uid: number, gid: number): void;
    access(path: string, mode: number): void;
    utimensat(path: string, atimeSec: number, atimeNsec: number, mtimeSec: number, mtimeNsec: number): void;
    opendir(path: string): number;
    readdir(handle: number): {
        name: string;
        type: number;
        ino: number;
    } | null;
    closedir(handle: number): void;
    clockGettime(clockId: number): {
        sec: number;
        nsec: number;
    };
    nanosleep(sec: number, nsec: number): void;
}

/**
 * Zip central directory parser and entry extractor.
 *
 * Parses zip file metadata from the central directory without
 * decompressing the entire archive. Used by lazy archive registration
 * to index file entries from range-request-fetched bytes.
 */
interface ZipEntry {
    fileName: string;
    compressedSize: number;
    uncompressedSize: number;
    compressionMethod: number;
    localHeaderOffset: number;
    mode: number;
    isDirectory: boolean;
    isSymlink: boolean;
    externalAttrs: number;
    creatorOS: number;
}

/** Serializable lazy file entry for transfer between instances. */
interface LazyFileEntry {
    ino: number;
    path: string;
    url: string;
    size: number;
}
/** Per-file metadata for a file inside a lazy archive. */
interface LazyArchiveFileEntry {
    ino: number;
    size: number;
    isSymlink: boolean;
    deleted: boolean;
}
/**
 * A group of files whose content comes from a single zip archive.
 * Accessing any member materializes the entire archive in one fetch.
 */
interface LazyArchiveGroup {
    url: string;
    mountPrefix: string;
    materialized: boolean;
    entries: Map<string, LazyArchiveFileEntry>;
}
/** JSON-serializable form of LazyArchiveGroup for cross-worker transfer. */
interface SerializedLazyArchiveEntry {
    url: string;
    mountPrefix: string;
    materialized: boolean;
    entries: Array<{
        vfsPath: string;
        ino: number;
        size: number;
        isSymlink: boolean;
        deleted: boolean;
    }>;
}
/** Options for saving a VFS image. */
interface VfsImageOptions {
    /**
     * If true, fetch and write all lazy file contents before saving.
     * The resulting image is self-contained with no external URL dependencies.
     * If false (default), lazy file metadata is preserved as-is.
     */
    materializeAll?: boolean;
}
declare class MemoryFileSystem implements FileSystemBackend {
    private fs;
    /** Lazy files: inode → { path, url, size }. Cleared per-inode after materialization. */
    private lazyFiles;
    /** Lazy archive groups (bundle of files backed by one zip URL). */
    private lazyArchiveGroups;
    /** Fast lookup: inode → group it belongs to. Cleared per-group after materialization. */
    private lazyArchiveInodes;
    private constructor();
    /** Return the underlying SharedArrayBuffer (for sharing with workers). */
    get sharedBuffer(): SharedArrayBuffer;
    static create(sab: SharedArrayBuffer, maxSizeBytes?: number): MemoryFileSystem;
    static fromExisting(sab: SharedArrayBuffer): MemoryFileSystem;
    /**
     * Register a lazy file: creates an empty stub in SharedFS and records
     * metadata so that read() will fetch content on demand via sync XHR.
     * Returns the inode number (useful for forwarding to other instances).
     */
    registerLazyFile(path: string, url: string, size: number, mode?: number): number;
    /**
     * Import lazy file entries from another instance (e.g., main thread → worker).
     * Does not create files — assumes the files already exist in the SharedArrayBuffer.
     */
    importLazyEntries(entries: LazyFileEntry[]): void;
    /** Export all pending lazy entries for transfer to another instance. */
    exportLazyEntries(): LazyFileEntry[];
    /**
     * Register a lazy archive group: creates stubs in SharedFS for every file
     * entry and records metadata so that accessing any one of them triggers a
     * single archive fetch that materializes all files in the group.
     *
     * Parse the zip's central directory (via host/src/vfs/zip.ts) and pass the
     * resulting ZipEntry[] in `zipEntries`. `mountPrefix` maps the zip's
     * internal paths into the VFS (e.g. prefix "/usr/" turns "bin/vim" into
     * "/usr/bin/vim").
     */
    registerLazyArchiveFromEntries(url: string, zipEntries: ZipEntry[], mountPrefix: string, symlinkTargets?: Map<string, string>): LazyArchiveGroup;
    /** Import lazy archive groups from another instance. Assumes stubs already exist. */
    importLazyArchiveEntries(serialized: SerializedLazyArchiveEntry[]): void;
    /**
     * Rewrite the URL of every registered lazy archive group. Useful when the
     * VFS image was built with relative URLs (e.g. "vim.zip") and the runtime
     * needs to resolve them against a deployment base URL.
     */
    rewriteLazyArchiveUrls(transform: (url: string) => string): void;
    /** Export all lazy archive groups for transfer to another instance. */
    exportLazyArchiveEntries(): SerializedLazyArchiveEntry[];
    /**
     * Async-materialize a lazy file or archive-backed file if the given path
     * resolves to one. Call this before any synchronous read (e.g. in
     * handleExec) to avoid sync XHR which deadlocks with COOP/COEP.
     * Returns true if something was materialized, false if already concrete.
     */
    ensureMaterialized(path: string): Promise<boolean>;
    /**
     * Materialize a full lazy archive group: fetch the zip once, parse its
     * central directory, and write every non-deleted entry into its stub.
     * Subsequent calls are no-ops.
     */
    ensureArchiveMaterialized(group: LazyArchiveGroup): Promise<void>;
    /**
     * Save the current filesystem state as a portable binary image.
     *
     * With `materializeAll: true`, all lazy files are fetched and written
     * into the filesystem before saving, producing a self-contained image.
     * Otherwise, lazy file metadata (path/URL/size) is preserved in the
     * image and restored on load.
     */
    saveImage(options?: VfsImageOptions): Promise<Uint8Array>;
    /**
     * Restore a MemoryFileSystem from a previously saved VFS image.
     * Allocates a new SharedArrayBuffer and populates it from the image.
     *
     * When `maxByteLength` is specified, creates a growable SharedArrayBuffer
     * so the filesystem can expand beyond the image's original size.
     */
    static fromImage(image: Uint8Array, options?: {
        maxByteLength?: number;
    }): MemoryFileSystem;
    private adaptStat;
    open(path: string, flags: number, mode: number): number;
    close(handle: number): number;
    read(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    write(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    seek(handle: number, offset: number, whence: number): number;
    fstat(handle: number): StatResult;
    ftruncate(handle: number, length: number): void;
    fsync(_handle: number): void;
    fchmod(handle: number, mode: number): void;
    fchown(_handle: number, _uid: number, _gid: number): void;
    stat(path: string): StatResult;
    lstat(path: string): StatResult;
    mkdir(path: string, mode: number): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    rename(oldPath: string, newPath: string): void;
    link(existingPath: string, newPath: string): void;
    symlink(target: string, path: string): void;
    readlink(path: string): string;
    chmod(path: string, mode: number): void;
    chown(_path: string, _uid: number, _gid: number): void;
    access(path: string, _mode: number): void;
    utimensat(path: string, atimeSec: number, atimeNsec: number, mtimeSec: number, mtimeNsec: number): void;
    opendir(path: string): number;
    readdir(handle: number): DirEntry | null;
    closedir(handle: number): void;
}

declare class DeviceFileSystem implements FileSystemBackend {
    private devices;
    private handles;
    private nextHandle;
    private deviceNames;
    constructor();
    private getDevice;
    open(path: string, _flags: number, _mode: number): number;
    close(handle: number): number;
    read(handle: number, buffer: Uint8Array, _offset: number | null, length: number): number;
    write(handle: number, buffer: Uint8Array, _offset: number | null, length: number): number;
    seek(_handle: number, _offset: number, _whence: number): number;
    fstat(handle: number): StatResult;
    ftruncate(_handle: number, _length: number): void;
    fsync(_handle: number): void;
    fchmod(_handle: number, _mode: number): void;
    fchown(_handle: number, _uid: number, _gid: number): void;
    stat(path: string): StatResult;
    lstat(path: string): StatResult;
    mkdir(_path: string, _mode: number): void;
    rmdir(_path: string): void;
    unlink(_path: string): void;
    rename(_oldPath: string, _newPath: string): void;
    link(_existingPath: string, _newPath: string): void;
    symlink(_target: string, _path: string): void;
    readlink(_path: string): string;
    chmod(_path: string, _mode: number): void;
    chown(_path: string, _uid: number, _gid: number): void;
    access(path: string, _mode: number): void;
    utimensat(_path: string, _atimeSec: number, _atimeNsec: number, _mtimeSec: number, _mtimeNsec: number): void;
    private dirHandles;
    private nextDirHandle;
    opendir(path: string): number;
    readdir(handle: number): DirEntry | null;
    closedir(handle: number): void;
}

/**
 * Shared-memory channel for communication between the OpfsFileSystem
 * (kernel worker) and the OpfsProxyWorker (dedicated OPFS worker).
 *
 * Memory layout:
 *
 *   Offset  Size   Field
 *   0       4B     status (IDLE=0, PENDING=1, COMPLETE=2, ERROR=3)
 *   4       4B     opcode
 *   8       48B    args (12 × i32)
 *   56      4B     result
 *   60      4B     result2 (secondary return value)
 *   64      ...    data section (path strings, read/write buffers)
 */
declare const enum OpfsChannelStatus {
    Idle = 0,
    Pending = 1,
    Complete = 2,
    Error = 3
}
declare const enum OpfsOpcode {
    OPEN = 1,
    CLOSE = 2,
    READ = 3,
    WRITE = 4,
    SEEK = 5,
    FSTAT = 6,
    FTRUNCATE = 7,
    FSYNC = 8,
    STAT = 9,
    LSTAT = 10,
    MKDIR = 11,
    RMDIR = 12,
    UNLINK = 13,
    RENAME = 14,
    ACCESS = 15,
    OPENDIR = 16,
    READDIR = 17,
    CLOSEDIR = 18
}
/** Default SAB size: 4 MB */
declare const OPFS_CHANNEL_SIZE: number;
declare class OpfsChannel {
    private readonly i32;
    private readonly view;
    readonly buffer: SharedArrayBuffer;
    constructor(buffer: SharedArrayBuffer);
    get status(): OpfsChannelStatus;
    set status(value: OpfsChannelStatus);
    get opcode(): OpfsOpcode;
    set opcode(value: OpfsOpcode);
    getArg(index: number): number;
    setArg(index: number, value: number): void;
    get result(): number;
    set result(value: number);
    get result2(): number;
    set result2(value: number);
    get dataBuffer(): Uint8Array;
    get dataCapacity(): number;
    /** Write a UTF-8 string into the data section. Returns bytes written. */
    writeString(str: string): number;
    /** Read a UTF-8 string from the data section, up to `length` bytes. */
    readString(length: number): string;
    /**
     * Write two null-separated strings (for rename: oldPath\0newPath).
     * Returns total bytes written.
     */
    writeTwoStrings(s1: string, s2: string): number;
    /**
     * Read two null-separated strings from the data section.
     */
    readTwoStrings(totalLength: number): [string, string];
    writeStatResult(stat: {
        dev: number;
        ino: number;
        mode: number;
        nlink: number;
        uid: number;
        gid: number;
        size: number;
        atimeMs: number;
        mtimeMs: number;
        ctimeMs: number;
    }): void;
    readStatResult(): {
        dev: number;
        ino: number;
        mode: number;
        nlink: number;
        uid: number;
        gid: number;
        size: number;
        atimeMs: number;
        mtimeMs: number;
        ctimeMs: number;
    };
    /** Block until status transitions away from Pending. */
    waitForComplete(): OpfsChannelStatus;
    /** Set status to Complete and wake waiters. */
    notifyComplete(): void;
    /** Set status to Error and wake waiters. */
    notifyError(): void;
    /** Set status to Pending and wake the proxy worker. */
    setPending(): void;
}

/**
 * OPFS-backed FileSystemBackend. Runs in the kernel worker thread.
 *
 * All operations serialize arguments into a SharedArrayBuffer channel,
 * then block with Atomics.wait() until the OpfsProxyWorker completes
 * the async OPFS operation.
 */

declare class OpfsFileSystem implements FileSystemBackend {
    private readonly channel;
    constructor(channel: OpfsChannel);
    static create(sab: SharedArrayBuffer): OpfsFileSystem;
    /** Send an opcode and block until complete. Returns the result value. Throws on error. */
    private call;
    private errnoToError;
    open(path: string, flags: number, mode: number): number;
    close(handle: number): number;
    read(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    write(handle: number, buffer: Uint8Array, offset: number | null, length: number): number;
    seek(handle: number, offset: number, whence: number): number;
    fstat(handle: number): StatResult;
    ftruncate(handle: number, length: number): void;
    fsync(handle: number): void;
    fchmod(_handle: number, _mode: number): void;
    fchown(_handle: number, _uid: number, _gid: number): void;
    stat(path: string): StatResult;
    lstat(path: string): StatResult;
    mkdir(path: string, mode: number): void;
    rmdir(path: string): void;
    unlink(path: string): void;
    rename(oldPath: string, newPath: string): void;
    link(_existingPath: string, _newPath: string): void;
    symlink(_target: string, _path: string): void;
    readlink(_path: string): string;
    chmod(_path: string, _mode: number): void;
    chown(_path: string, _uid: number, _gid: number): void;
    access(path: string, mode: number): void;
    utimensat(_path: string, _atimeSec: number, _atimeNsec: number, _mtimeSec: number, _mtimeNsec: number): void;
    opendir(path: string): number;
    readdir(handle: number): DirEntry | null;
    closedir(handle: number): void;
}

declare class NodeTimeProvider implements TimeProvider {
    private readonly _epochOffsetNs;
    private readonly _startNs;
    constructor();
    clockGettime(clockId: number): {
        sec: number;
        nsec: number;
    };
    nanosleep(sec: number, nsec: number): void;
}
declare class BrowserTimeProvider implements TimeProvider {
    clockGettime(clockId: number): {
        sec: number;
        nsec: number;
    };
    nanosleep(sec: number, nsec: number): void;
}

export { type AlarmSetMessage as A, BrowserTimeProvider as B, type CentralizedWorkerInitMessage as C, type DeliverSignalMessage as D, type ExecCompleteMessage as E, type FileSystemBackend as F, NodeTimeProvider as G, type HostToWorkerMessage as H, NodeWorkerAdapter as I, type ThreadExitMessage as J, type KernelCallbacks as K, type LazyFileEntry as L, MemoryFileSystem as M, type NetworkIO as N, OPFS_CHANNEL_SIZE as O, type PlatformIO as P, type WorkerTerminateMessage as Q, centralizedThreadWorkerMain as R, SharedPipeBuffer as S, type TimeProvider as T, VirtualPlatformIO as V, type WorkerAdapter as W, type WorkerHandle as a, ChannelStatus as b, DeviceFileSystem as c, type DirEntry as d, type ExecReplyMessage as e, type ExecRequestMessage as f, type KernelConfig as g, type MountConfig as h, OpfsChannel as i, OpfsChannelStatus as j, OpfsFileSystem as k, OpfsOpcode as l, type StatResult as m, SyscallChannel as n, WasmPosixKernel as o, type WorkerErrorMessage as p, type WorkerExitMessage as q, type MessagePort as r, type WorkerReadyMessage as s, type WorkerToHostMessage as t, centralizedWorkerMain as u, FramebufferRegistry as v, type VfsImageOptions as w, type CentralizedThreadInitMessage as x, MockWorkerAdapter as y, MockWorkerHandle as z };
