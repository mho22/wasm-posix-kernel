import { g as KernelConfig, P as PlatformIO, o as WasmPosixKernel, v as FramebufferRegistry, m as StatResult, N as NetworkIO, F as FileSystemBackend, d as DirEntry, w as VfsImageOptions, M as MemoryFileSystem } from './time-FU5qoDUW.cjs';
export { A as AlarmSetMessage, B as BrowserTimeProvider, x as CentralizedThreadInitMessage, C as CentralizedWorkerInitMessage, b as ChannelStatus, D as DeliverSignalMessage, c as DeviceFileSystem, E as ExecCompleteMessage, e as ExecReplyMessage, f as ExecRequestMessage, H as HostToWorkerMessage, K as KernelCallbacks, L as LazyFileEntry, y as MockWorkerAdapter, z as MockWorkerHandle, h as MountConfig, G as NodeTimeProvider, I as NodeWorkerAdapter, O as OPFS_CHANNEL_SIZE, i as OpfsChannel, j as OpfsChannelStatus, k as OpfsFileSystem, l as OpfsOpcode, S as SharedPipeBuffer, n as SyscallChannel, J as ThreadExitMessage, T as TimeProvider, V as VirtualPlatformIO, W as WorkerAdapter, p as WorkerErrorMessage, q as WorkerExitMessage, a as WorkerHandle, r as WorkerMessagePort, s as WorkerReadyMessage, Q as WorkerTerminateMessage, t as WorkerToHostMessage, R as centralizedThreadWorkerMain, u as centralizedWorkerMain } from './time-FU5qoDUW.cjs';

/** Callbacks for fork/exec/exit handling in centralized mode. */
interface CentralizedKernelCallbacks {
    /**
     * Called when a process forks. The kernel has already cloned the Process
     * in its ProcessTable. The callback should spawn a child Worker with
     * a copy of the parent's Memory and register it with the kernel.
     * Returns the channel offsets allocated for the child.
     */
    onFork?: (parentPid: number, childPid: number, parentMemory: WebAssembly.Memory) => Promise<number[]>;
    /**
     * Called when a process calls execve. The callback should resolve the
     * program path, terminate the old Worker, create a new Worker with the
     * new binary, and call registerProcess with skipKernelCreate.
     * Returns 0 on success, negative errno on error.
     */
    onExec?: (pid: number, path: string, argv: string[], envp: string[]) => Promise<number>;
    /**
     * Called when a process calls clone (thread creation). The callback should
     * spawn a thread Worker sharing the parent's Memory. Returns the TID.
     */
    onClone?: (pid: number, tid: number, fnPtr: number, argPtr: number, stackPtr: number, tlsPtr: number, ctidPtr: number, memory: WebAssembly.Memory) => Promise<number>;
    /**
     * Called when a process exits.
     */
    onExit?: (pid: number, exitStatus: number) => void;
    /**
     * Called when a process calls exit_group (terminate all threads).
     * The callback should forcefully terminate all thread workers for the process.
     * Called BEFORE the process exit is processed.
     */
    onExitGroup?: (pid: number) => void;
}
declare class CentralizedKernelWorker {
    private config;
    private io;
    private callbacks;
    private kernel;
    private kernelInstance;
    private kernelMemory;
    /** ABI version read from the kernel wasm at startup. */
    private kernelAbiVersion;
    private processes;
    private activeChannels;
    private scratchOffset;
    private initialized;
    private nextChildPid;
    /**
     * Allocate a fresh pid for a top-level spawn from a host. Skips any pids
     * already in the kernel's process table (forked children, the virtual
     * init at pid 1, etc.). The host is no longer expected to pick pids;
     * this is the single source of truth.
     */
    allocatePid(): number;
    /** Maps "pid:channelOffset" to TID for tracking thread channels */
    private channelTids;
    /** Tracks the pid currently being serviced by kernel_handle_channel */
    private currentHandlePid;
    /**
     * Bind the kernel's view of "which thread is executing this syscall" to
     * the calling channel. Must be called immediately before every
     * `kernel_handle_channel` invocation that originates from user code — the
     * kernel consults this to route per-thread signal state (pthread_sigmask,
     * pthread_kill pending, sigsuspend per-thread mask swap). `tid = 0` means
     * "main thread" and is the default for channels without a tracked TID
     * (e.g. the main process worker).
     */
    private bindKernelTidForChannel;
    /** Alarm timers per process: pid → NodeJS.Timeout */
    private alarmTimers;
    /** POSIX timers: "pid:timerId" → {timeout, interval?, signo} */
    private posixTimers;
    /** Pending sleep timers per process: pid → {timer, channel, syscallNr, origArgs, retVal, errVal} */
    private pendingSleeps;
    /** Maps "pid:tid" to ctidPtr for CLONE_CHILD_CLEARTID on thread exit */
    private threadCtidPtrs;
    /** TCP listeners: "pid:fd" → { server, pid, port, connections } */
    private tcpListeners;
    /** TCP listener targets: port → list of {pid, fd} for round-robin dispatch.
     *  When multiple processes share a listening socket (e.g., nginx master forks
     *  workers), incoming connections are distributed among them. */
    private tcpListenerTargets;
    private tcpListenerRRIndex;
    /** Separate scratch buffer for TCP data pumping */
    private tcpScratchOffset;
    /** Node.js net module (loaded dynamically for browser compatibility) */
    private netModule;
    /** Parent-child process tracking for waitpid */
    private childToParent;
    private parentToChildren;
    /** Exit statuses of children not yet wait()-ed for: childPid → waitStatus */
    private exitedChildren;
    /** Deferred waitpid/waitid completions */
    private waitingForChild;
    /** Cached kernel memory typed array view (invalidated on memory.grow) */
    private cachedKernelMem;
    private cachedKernelBuffer;
    /** Pending poll/ppoll retries — keyed by channelOffset for per-thread tracking */
    private pendingPollRetries;
    /** Pending pselect6 retries — used for signal-driven wakeup and timeout tracking */
    private pendingSelectRetries;
    /** Flag to coalesce cross-process wakeup microtasks */
    private wakeScheduled;
    /** Pending pipe/socket readers: pipeIdx → array of waiting channels.
     * When a read-like syscall returns EAGAIN on a pipe/socket fd, the reader
     * is registered here instead of using a blind setImmediate retry.
     * When a write completes to the same pipe, readers are woken immediately. */
    private pendingPipeReaders;
    /** Pending pipe/socket writers: sendPipeIdx → array of waiting channels.
     * When a write-like syscall returns EAGAIN on a pipe/socket fd (buffer full),
     * the writer is registered here. When a read drains the pipe, writers wake. */
    private pendingPipeWriters;
    /** Socket timeout timers: channel → timer. When a socket read/write
     * blocks and has SO_RCVTIMEO/SO_SNDTIMEO set, a timer is scheduled
     * to complete the syscall with ETIMEDOUT. Cleared when the operation
     * completes before the timeout. */
    private socketTimeoutTimers;
    /** Pending futex waits: channelOffset → { futexAddr, futexIndex }.
     * Tracked so SYS_THREAD_CANCEL can force-wake a futex-blocked thread
     * by firing Atomics.notify on the address it is waiting on. The waitAsync
     * Promise in handleFutex then resolves and writes the channel result. */
    private pendingFutexWaits;
    /** Channel offsets with a cancellation request pending. Set by
     * SYS_THREAD_CANCEL.  Checked at the entry of every blocking syscall
     * path (futex wait, pipe retry, poll retry) so a cancel that arrives
     * before the target actually blocks still terminates the in-flight
     * syscall instead of silently racing past it. Cleared when the cancel
     * has been serviced (target's channel completed with -EINTR / woken). */
    private pendingCancels;
    /** Profiling data: syscallNr → {count, totalTimeMs, retries} */
    private profileData;
    /** Per-process stdin buffers: pid → { data, offset } */
    private stdinBuffers;
    /** Processes with finite stdin (setStdinData). Reads return EOF when buffer exhausted.
     *  Processes NOT in this set get EAGAIN (blocking) when no stdin data is available. */
    private stdinFinite;
    /** Active TCP connections per process for piggyback flushing */
    private tcpConnections;
    /** Per-process MAP_SHARED file-backed mappings: pid → Map<addr, info> */
    private sharedMappings;
    /** Host-side mirror of epoll interest lists: "pid:epfd" → interests.
     *  Maintained by intercepting epoll_ctl results. Used by handleEpollPwait
     *  to convert epoll_pwait to poll without calling kernel_handle_channel
     *  (which crashes in Chrome for epoll_pwait due to a suspected V8 bug). */
    private epollInterests;
    private lockTable;
    /** Per-process shared memory mappings: pid → Map<addr, {segId, size}> */
    private shmMappings;
    /** PTY index → pid mapping (for draining output after syscalls) */
    private ptyIndexByPid;
    /** Set of active PTY indices to drain after each syscall */
    private activePtyIndices;
    /** PTY output callbacks: ptyIdx → callback */
    private ptyOutputCallbacks;
    /** Virtual MAC address for this kernel instance (locally administered, unicast) */
    private virtualMacAddress;
    constructor(config: KernelConfig, io: PlatformIO, callbacks?: CentralizedKernelCallbacks);
    /**
     * Initialize the centralized kernel.
     * Loads kernel Wasm, sets mode to centralized (1).
     */
    init(kernelWasmBytes: BufferSource): Promise<void>;
    /**
     * Register a process and its thread channels with the kernel.
     * Each channel is a region in the process's shared Memory.
     */
    registerProcess(pid: number, memory: WebAssembly.Memory, channelOffsets: number[], options?: {
        skipKernelCreate?: boolean;
        argv?: string[];
        ptrWidth?: 4 | 8;
    }): void;
    /**
     * Provide data that will be returned when the process reads from stdin (fd 0).
     * Data is returned in chunks until exhausted, then EOF is returned.
     * Must be called before the process starts reading stdin.
     */
    setStdinData(pid: number, data: Uint8Array): void;
    /**
     * Set stdout/stderr capture callbacks on the underlying kernel instance.
     * Must be called after construction but works at any time.
     */
    setOutputCallbacks(callbacks: {
        onStdout?: (data: Uint8Array) => void;
        onStderr?: (data: Uint8Array) => void;
    }): void;
    /**
     * Append data to a process's stdin buffer without marking stdin as a pipe.
     * Used for interactive stdin where data arrives incrementally.
     * Wakes any blocked stdin readers after appending.
     */
    appendStdinData(pid: number, data: Uint8Array): void;
    /**
     * Create a PTY pair and wire fds 0/1/2 of `pid` to the slave side.
     * Returns the PTY index, or throws on failure.
     */
    setupPty(pid: number): number;
    /**
     * Write data to a PTY master (host → line discipline → slave).
     * Wakes any process blocked on reading the slave side.
     */
    ptyMasterWrite(ptyIdx: number, data: Uint8Array): void;
    /**
     * Read all available data from a PTY master (slave output → host).
     * Returns data or null if empty.
     */
    ptyMasterRead(ptyIdx: number): Uint8Array | null;
    /**
     * Resize a PTY and send SIGWINCH to the foreground process group.
     */
    ptySetWinsize(ptyIdx: number, rows: number, cols: number): void;
    /**
     * Register a callback for PTY output data.
     */
    onPtyOutput(ptyIdx: number, callback: (data: Uint8Array) => void): void;
    /**
     * Drain output from a PTY master and invoke the registered callback.
     */
    private drainPtyOutput;
    /**
     * Drain all active PTY outputs. Called after each syscall completion
     * to flush any program output produced during the syscall.
     */
    private drainAllPtyOutputs;
    /**
     * Set the working directory for a process.
     * Must be called after registerProcess and before the process starts.
     */
    setCwd(pid: number, cwd: string): void;
    /**
     * Unregister a process. Stops listening on its channels and removes
     * it from the kernel's process table.
     */
    unregisterProcess(pid: number): void;
    /**
     * Deactivate a process's channels without removing it from the kernel
     * process table. Used for zombie processes that need to remain queryable
     * (getpgid, setpgid) until reaped by wait/waitpid.
     */
    deactivateProcess(pid: number): void;
    /**
     * Run kernel-side exec setup: close CLOEXEC fds, reset signal handlers.
     * Returns 0 on success, negative errno on failure.
     * Called by onExec callbacks after confirming the target program exists.
     */
    kernelExecSetup(pid: number): number;
    /**
     * Remove old channel/registration state for a process about to exec.
     * Does NOT remove from kernel process table (exec keeps the same pid).
     * Does NOT cancel timers (POSIX: timers are preserved across exec).
     */
    prepareProcessForExec(pid: number): void;
    /**
     * Remove a process from the kernel's PROCESS_TABLE.
     * Called when a zombie is reaped by wait/waitpid.
     */
    removeFromKernelProcessTable(pid: number): void;
    /**
     * Add a new channel (e.g. for a thread) to an existing process registration.
     * Uses the process's existing memory. If tid is provided, tracks the mapping
     * so handleExit can identify thread exits.
     */
    addChannel(pid: number, channelOffset: number, tid?: number): void;
    /**
     * Remove a channel from a process registration (e.g. when a thread exits).
     */
    removeChannel(pid: number, channelOffset: number): void;
    /**
     * Listen for a syscall on a channel using Atomics.waitAsync.
     * When the process sets status to PENDING, we handle the syscall.
     */
    private listenOnChannel;
    /**
     * Handle a pending syscall from a process channel.
     *
     * 1. Read syscall number + args from process Memory
     * 2. For each pointer arg: copy data from process Memory to kernel scratch
     * 3. Write adjusted args to kernel scratch channel header
     * 4. Call kernel_handle_channel(scratchOffset, pid)
     * 5. For each output pointer arg: copy data from kernel scratch to process Memory
     * 6. Write return value + errno to process channel
     * 7. Set status to COMPLETE and notify process
     * 8. Re-listen for next syscall
     */
    private getKernelMem;
    /** Get pointer width for a process (4=wasm32, 8=wasm64). */
    private getPtrWidth;
    /** Debug: last N syscalls per pid for crash diagnosis */
    private syscallRing;
    dumpLastSyscalls(pid: number): string;
    /** Read a null-terminated C string from process memory */
    private readCString;
    /** Format a syscall for logging, decoding path/string args from process memory */
    private formatSyscallEntry;
    /** Format a syscall return value for logging */
    private formatSyscallReturn;
    private handleSyscall;
    private _handleSyscallInner;
    /**
     * Dequeue one pending Handler signal from the kernel and write delivery
     * info to the process channel. The glue code (channel_syscall.c) reads
     * this after the syscall returns and invokes the handler.
     */
    private dequeueSignalForDelivery;
    /**
     * Complete a syscall by copying output data and notifying the process.
     */
    private completeChannel;
    /**
     * Schedule re-listen on a channel.
     *
     * Uses queueMicrotask for speed (near-zero delay between syscalls).
     * Every Nth call (relistenBatchSize), yields via setImmediate so timer
     * callbacks (setTimeout/setInterval) can fire — prevents event loop
     * starvation while keeping throughput close to Node.js native setImmediate.
     *
     * In the browser (main thread), set relistenBatchSize=1 so every syscall
     * yields via setImmediate. The browser setImmediate polyfill (MessageChannel)
     * batches these efficiently while still allowing rendering frames between
     * batches. Without this, microtask chains from multi-threaded programs
     * (e.g. MariaDB's 5 threads) starve requestAnimationFrame and rendering.
     */
    private relistenCount;
    /** How many syscalls to process via microtask before yielding to the event
     *  loop via setImmediate. Default 64 is optimal for Node.js. Set to 1 in
     *  browser environments where the kernel runs on the main thread. */
    relistenBatchSize: number;
    /**
     * When true, use a MessageChannel-based poller to check all channels
     * instead of per-channel Atomics.waitAsync listeners.
     *
     * This avoids a V8 bug where Atomics.waitAsync microtask chains from
     * multiple concurrent processes freeze the main thread. The poller
     * uses MessageChannel for ~0ms dispatch (bypassing the browser's 4ms
     * timer clamp on setTimeout/setInterval), with periodic setTimeout
     * yields every 4ms to keep timers and rendering alive.
     *
     * Enable this in browser environments where the kernel runs on the
     * main thread. In Node.js (where setImmediate is native), the default
     * event-driven mode (Atomics.waitAsync) is preferred.
     */
    usePolling: boolean;
    private pollMC;
    private pollScheduled;
    private pollLastYield;
    /** Start the channel poller. Called automatically when usePolling=true
     *  and a process is registered. */
    private startPolling;
    /** Stop the channel poller. Called when all processes are unregistered. */
    private stopPolling;
    /** Schedule the next poll tick. Uses MessageChannel for ~0ms dispatch,
     *  with a setTimeout yield every 4ms to prevent timer starvation. */
    private schedulePoll;
    /** Poll all active channels for PENDING syscalls. */
    private pollTick;
    private relistenChannel;
    /**
     * Complete a channel with just return value and errno (no scatter/gather).
     * Used for thread exit where we need to unblock the worker.
     */
    private completeChannelRaw;
    /**
     * Handle EAGAIN retry for blocking syscalls.
     * The process stays blocked while we retry asynchronously.
     */
    private resolvePollPipeIndices;
    private resolveEpollPipeIndices;
    private wakeBlockedPoll;
    /** Cancel all pending poll retries for a given pid (used during cleanup) */
    private cleanupPendingPollRetries;
    /**
     * Drain kernel wakeup events and process targeted pipe wakeups.
     * Called after each syscall completion. The kernel pushes events from
     * PipeBuffer operations (read/write/close). Each event identifies a pipe
     * and whether it became readable or writable.
     */
    private drainAndProcessWakeupEvents;
    private anyPendingRetryNeedsSignalSafeWake;
    /** Same as scheduleWakeBlockedRetries but delays by a few ms to allow
     *  follow-up cross-process syscalls from the event source to land. */
    private scheduleWakeBlockedRetriesDeferred;
    /**
     * Schedule a microtask to wake all blocked poll/pselect6 retries.
     * Coalesced via wakeScheduled flag — multiple calls within the same
     * microtask batch result in only one wake cycle. This catches cross-process
     * pipe writes, socket connections, and other state changes that unblock
     * another process's pending poll/select.
     */
    private scheduleWakeBlockedRetries;
    /**
     * Wake all blocked poll/pselect6 retries by cancelling their setImmediate
     * timers and immediately re-executing the syscalls.
     */
    private wakeAllBlockedRetries;
    /**
     * Remove a process's entries from pendingPipeReaders.
     * Called during process cleanup.
     */
    private cleanupPendingPipeReaders;
    private cleanupPendingPipeWriters;
    /**
     * Cancel a pending socket timeout timer for a channel.
     */
    private clearSocketTimeout;
    /**
     * Remove a channel from pending pipe readers (all pipes).
     * Called when a socket timeout fires to clean up the reader registration.
     */
    private removePendingPipeReader;
    /**
     * Remove a channel from pending pipe writers (all pipes).
     */
    private removePendingPipeWriter;
    /**
     * SYS_THREAD_CANCEL — wake a thread that is blocked in a cancellation-point
     * syscall so its glue (__syscall_cp) can observe the pending cancel flag
     * and run pthread_exit(PTHREAD_CANCELED).
     *
     * The guest pthread_cancel() overlay has already atomically set
     * target->cancel = 1 in shared memory before calling this syscall — see
     * musl-overlay/src/thread/wasm32posix/pthread_cancel.c for the full flow.
     *
     * This handler's sole job is to force the target out of its Atomics.wait32
     * on CH_STATUS (if blocked). Strategy depends on what the target is
     * waiting on:
     *
     *   - futex wait: fire Atomics.notify on the futex address. handleFutex's
     *     waitAsync Promise resolves, writes (0, 0) to the channel, target
     *     wakes. Return-value 0 is benign — the post-syscall __testcancel()
     *     in glue picks up self->cancel and exits before the caller re-checks
     *     its predicate.
     *   - pipe read/write blocked on pendingPipeReaders/Writers: remove the
     *     registration and complete the channel with -EINTR.
     *   - poll/select scheduled with a retry timer: clear the timer and
     *     complete with -EINTR.
     *   - otherwise (not blocked, or already completed): no-op. The target
     *     will observe self->cancel on its next cancel-point entry.
     *
     * The caller's own syscall always succeeds with 0.
     */
    private handleThreadCancel;
    /**
     * Dump syscall profiling data to stderr. Call from your serve script:
     *   process.on('SIGINT', () => { kernelWorker.dumpProfile(); process.exit(); });
     *
     * Only produces output when WASM_POSIX_PROFILE=1 env var is set.
     */
    dumpProfile(): void;
    private flushTcpSendPipes;
    private handleBlockingRetry;
    /**
     * Retry a syscall by re-invoking handleSyscall with the original
     * args still in the process channel.
     */
    private retrySyscall;
    /**
     * Handle sleep syscalls where the kernel returns success immediately
     * but we need to delay the channel response.
     * Returns true if this is a sleep syscall that was handled.
     */
    private handleSleepDelay;
    /**
     * Complete a sleep syscall, checking for pending signals first.
     * POSIX: sleep interrupted by signal returns EINTR.
     */
    private completeSleepWithSignalCheck;
    /**
     * Handle writev/pwritev: copy iov array and all data buffers from
     * process memory into kernel scratch, then call kernel_handle_channel.
     */
    /**
     * Handle fcntl lock operations (F_GETLK, F_SETLK, F_SETLKW).
     * Arg3 is a pointer to struct flock (32 bytes) which needs copy in/out.
     */
    private handleFcntlLock;
    /**
     * Handle pselect6: copy fd_sets (inout), decode timeout/sigmask from
     * process memory, call kernel_handle_channel, copy fd_sets back.
     *
     * Layout in kernel scratch data area:
     *   [0..128]   readfds  (fd_set, 128 bytes)
     *   [128..256] writefds (fd_set, 128 bytes)
     *   [256..384] exceptfds (fd_set, 128 bytes)
     *   [384..392] mask (8 bytes: mask_lo + mask_hi)
     */
    private handlePselect6;
    /**
     * Handle epoll_create1 / epoll_create: let the kernel create the fd,
     * then initialise an empty interest list on the host side.
     */
    private handleEpollCreate;
    /**
     * Handle epoll_ctl: let the kernel modify its interest list, then mirror
     * the change on the host side.
     */
    private handleEpollCtl;
    /**
     * Handle epoll_pwait / epoll_wait entirely on the host side.
     * Converts the epoll interest list to a poll syscall, calls
     * kernel_handle_channel with SYS_POLL, then maps results back
     * to epoll_event format and writes to process memory.
     */
    private handleEpollPwait;
    /**
     * Handle SIOCGIFCONF: enumerate network interfaces.
     * struct ifconf { int ifc_len; union { char *ifc_buf; struct ifreq *ifc_req; }; }
     * The ifc_buf pointer is in process memory, so the kernel can't write to it
     * directly — we handle the entire ioctl on the host side.
     */
    private handleIoctlIfconf;
    /**
     * Handle SIOCGIFHWADDR: get hardware (MAC) address for an interface.
     * struct ifreq at arg[2]: ifr_name[16] + ifr_hwaddr (struct sockaddr, 16 bytes)
     * Returns the virtual MAC in ifr_hwaddr.sa_data[0..5].
     */
    private handleIoctlIfhwaddr;
    /**
     * Handle SIOCGIFADDR: get interface address.
     * struct ifreq at arg[2]: ifr_name[16] + ifr_addr (struct sockaddr, 16 bytes)
     * Returns 127.0.0.1 for the virtual interface.
     */
    private handleIoctlIfaddr;
    private handleWritev;
    /**
     * Handle large write/pwrite where the data exceeds CH_DATA_SIZE.
     * Loops through CH_DATA_SIZE chunks, issuing individual kernel calls.
     */
    private handleLargeWrite;
    /**
     * Handle large read/pread where the buffer exceeds CH_DATA_SIZE.
     * Loops through CH_DATA_SIZE chunks, copying data back to process memory.
     */
    private handleLargeRead;
    /**
     * Handle readv/preadv: set up iov array in kernel scratch, call
     * kernel_handle_channel, then copy read data back to process memory.
     */
    private handleReadv;
    /**
     * Handle sendmsg: decompose msghdr from process memory, flatten data + addr
     * into kernel scratch, call kernel_sendmsg which dispatches to sendto/send.
     */
    private handleSendmsg;
    /**
     * Handle recvmsg: decompose msghdr from process memory, set up buffers in
     * kernel scratch, call kernel_recvmsg, copy results back.
     */
    private handleRecvmsg;
    /**
     * Handle SYS_FORK/SYS_VFORK: clone the Process in the kernel's ProcessTable,
     * then call the onFork callback to spawn the child Worker.
     */
    private handleFork;
    /**
     * Read a null-terminated string from process memory at the given pointer.
     */
    private readCStringFromProcess;
    /**
     * Read a null-terminated array of string pointers from process memory.
     * Each element is a 32-bit pointer to a null-terminated string.
     */
    private readStringArrayFromProcess;
    /**
     * Handle SYS_EXECVE: read path, argv, and envp from process memory,
     * then call the onExec callback to load the new program.
     */
    private handleExec;
    /**
     * Resolve a relative exec path against the process's kernel CWD.
     * Returns absolute path if CWD can be queried, otherwise returns path unchanged.
     */
    private resolveExecPathAgainstCwd;
    /**
     * Handle SYS_EXECVEAT: execveat(dirfd, path, argv, envp, flags).
     * Used by fexecve which calls execveat(fd, "", argv, envp, AT_EMPTY_PATH).
     * Resolves the fd path via kernel_get_fd_path, then delegates to exec flow.
     */
    private handleExecveat;
    /**
     * Handle SYS_CLONE: thread creation. Call the onClone callback to spawn
     * a thread Worker sharing the parent's Memory.
     */
    private handleClone;
    /**
     * Handle SYS_EXIT/SYS_EXIT_GROUP: notify the kernel and clean up.
     *
     * For SYS_EXIT from a non-main channel (thread exit): notify kernel,
     * remove channel, complete channel to unblock thread worker.
     * For SYS_EXIT from main channel or SYS_EXIT_GROUP: current behavior.
     */
    private handleExit;
    /**
     * Handle a process that was terminated by a signal while blocking on a
     * syscall retry. Records the wait status and notifies the parent.
     */
    private handleProcessTerminated;
    /**
     * After SYS_KILL completes, scan for processes the kernel just marked
     * Exited that the host hasn't reaped. Without this, a `kill` of a
     * sleeping child (or any process not blocked in poll/select/pipe — those
     * are handled by scheduleWakeBlockedRetries) silently reaps the process
     * at the kernel level but leaves it in parentToChildren — wait4(-1)
     * then blocks forever.
     *
     * The kernel sets exit_status to 128 + signum for default Terminate
     * actions. Anything < 0 means the process is still alive.
     */
    private reapKilledProcessesAfterSyscall;
    /** Track pids the host has already reaped (prevents double-reaping
     *  when reapKilledProcessesAfterSyscall is called multiple times for
     *  the same already-Exited process). Cleared when the pid is
     *  re-allocated by a fresh fork+register. */
    private hostReaped;
    /**
     * Handle SYS_WAIT4: wait for a child process to exit.
     * Args: [pid, wstatus_ptr, options, rusage_ptr]
     */
    private handleWaitpid;
    /** Get the pgid of a process from the kernel's ProcessTable. */
    private getProcessPgid;
    /** Check if a child matches the waitpid pid argument. */
    private childMatchesWaitTarget;
    /** Find an exited child matching the waitpid pid argument. */
    private findExitedChild;
    /** Check if there are living children matching the pid arg. */
    private hasMatchingLivingChild;
    /** Remove an exited child from tracking after wait() consumes it. */
    private consumeExitedChild;
    /** Write wait status to the wstatus pointer in process memory. */
    private writeWaitStatus;
    /** Complete a waitpid syscall. */
    private completeWaitpid;
    /** Wake a parent blocked in waitpid/waitid when a child exits. */
    private wakeWaitingParent;
    /**
     * Re-check deferred waitpid/waitid calls after a process group change.
     * When a child changes its pgid (setpgid/setsid), a parent waiting on
     * waitpid(-pgid) may no longer have matching children → return ECHILD.
     */
    private recheckDeferredWaitpids;
    /**
     * Handle SYS_WAITID: wait for a child process state change.
     * Args: [idtype, id, siginfo_ptr, options, rusage_ptr]
     *
     * Supports P_PID, P_ALL, P_PGID id types and WNOWAIT/WNOHANG/WEXITED flags.
     * Fills siginfo_t in process memory with si_signo, si_code, si_pid, si_uid, si_status.
     */
    private handleWaitid;
    /**
     * Write siginfo_t fields for waitid into process memory.
     * Layout (wasm32): si_signo(+0), si_errno(+4), si_code(+8),
     * si_pid(+12), si_uid(+16), si_status(+20)
     */
    private writeSignalInfo;
    /**
     * Handle SYS_FUTEX directly on process memory.
     *
     * In centralized mode, the kernel's host_futex_wake/wait imports operate on
     * kernel memory, but futex addresses are in process memory. We bypass the
     * kernel entirely and implement the futex ops here.
     *
     * FUTEX_WAIT: compare-and-block. If the value at addr matches expected,
     * use Atomics.waitAsync to wait for a change, then return 0. If it doesn't
     * match, return -EAGAIN.
     *
     * FUTEX_WAKE: wake up to `val` waiters on addr. Returns number woken.
     */
    private handleFutex;
    /**
     * Notify the kernel that a thread has exited.
     * Removes thread state from the process's thread table.
     */
    notifyThreadExit(pid: number, tid: number): void;
    /**
     * Queue a signal on a target process in the kernel by invoking SYS_KILL
     * through kernel_handle_channel. The signal is queued in the kernel's
     * ProcessTable and will be delivered via dequeueSignalForDelivery on the
     * target process's next syscall completion.
     */
    private sendSignalToProcess;
    private ensureProcessMemoryCovers;
    /**
     * Populate a file-backed mmap region by reading from the file fd via pread.
     * Called after the kernel allocates the anonymous region and the host zeroes it.
     * Reads in CH_DATA_SIZE chunks using the kernel's pread handler.
     */
    private populateMmapFromFile;
    /**
     * Flush MAP_SHARED regions that overlap the msync range back to the file.
     * Reads from process memory and writes to the file via pwrite.
     */
    private flushSharedMappings;
    /**
     * Write data from process memory to a file via kernel pwrite syscalls.
     */
    private pwriteFromProcessMemory;
    /**
     * Remove shared mapping entries that overlap the munmap range.
     */
    private cleanupSharedMappings;
    /** Set the next child PID to allocate. */
    setNextChildPid(pid: number): void;
    /**
     * Set the mmap address space ceiling for a process.
     * Must be called before the process worker starts to prevent mmap
     * from allocating in the thread channel/TLS region.
     */
    setMaxAddr(pid: number, maxAddr: number): void;
    /**
     * Set the program's initial brk to its `__heap_base` value. Must be
     * called between `registerProcess` and the moment the new process worker
     * issues its first syscall — otherwise the kernel falls back to its
     * built-in `INITIAL_BRK` constant, which can land inside the program's
     * stack region for binaries with a large data section (e.g. mariadbd).
     *
     * Accepts `bigint` (preferred — what `extractHeapBase` returns) or
     * `number`. The kernel runs in wasm64 so the export takes a `usize`,
     * which is `bigint` on the JS side.
     */
    setBrkBase(pid: number, addr: bigint | number): void;
    /** Get the underlying kernel instance for direct access. */
    getKernel(): WasmPosixKernel;
    /**
     * Live `/dev/fb0` mappings reported by the kernel, indexed by pid.
     * Renderers (canvas in browser, no-op in Node) read from this on
     * each frame; the kernel populates it via the `host_bind_framebuffer`
     * import.
     */
    get framebuffers(): FramebufferRegistry;
    /**
     * Return the wasm `Memory` for `pid` (or `undefined` if no such
     * process is registered). Renderers use this to build typed-array
     * views over the bound framebuffer region.
     */
    getProcessMemory(pid: number): WebAssembly.Memory | undefined;
    /** Get the kernel Wasm instance. */
    getKernelInstance(): WebAssembly.Instance | null;
    /**
     * ABI version the kernel advertised at startup via its
     * `__abi_version` export. Worker processes compare against this
     * and refuse to run programs built against an incompatible ABI.
     */
    getKernelAbiVersion(): number;
    /**
     * Start a TCP server for a listening socket, bridging real TCP connections
     * into the kernel's pipe-buffer-backed accept path.
     */
    private startTcpListener;
    /**
     * Pick the next listener target for a port via round-robin.
     * Only considers processes that are still registered.
     */
    private pickListenerTarget;
    /**
     * Handle an incoming TCP connection: inject it into the kernel's listening
     * socket's backlog and pump data between the real socket and kernel pipes.
     */
    private handleIncomingTcpConnection;
    /**
     * Clean up all TCP listeners and connections for a process.
     */
    private cleanupTcpListeners;
    /** semctl: cmd-dependent arg handling — can't use SYSCALL_ARGS since arg[3]
     *  is a scalar for some commands and a pointer for others. */
    private handleSemctl;
    /** shmat: allocate address via kernel mmap, copy segment data to process memory */
    private handleIpcShmat;
    /** shmdt: copy process memory back to segment, untrack mapping */
    private handleIpcShmdt;
    /**
     * After mq_timedsend, check if the kernel has a pending notification
     * (a signal to deliver when a message arrives on a previously empty queue).
     * The notification is stored in the kernel's MqueueTable and drained here.
     */
    private drainMqueueNotification;
}

/**
 * Node.js platform I/O backend.
 *
 * Implements the PlatformIO interface using synchronous Node.js `fs`
 * operations. Synchronous methods are used because the kernel runs in
 * a Wasm import context which requires blocking, synchronous behavior.
 */

declare class NodePlatformIO implements PlatformIO {
    private dirHandles;
    private nextDirHandle;
    private fdPositions;
    private readonly _epochOffsetNs;
    private readonly _startNs;
    private readonly _shmDir;
    constructor();
    /** Rewrite /dev/shm/ paths to a tmpdir-backed directory (macOS compat). */
    private rewritePath;
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
}

/**
 * SharedLockTable — SharedArrayBuffer-backed advisory file lock table.
 *
 * Shared across all worker threads so that cross-process fcntl/flock
 * advisory locks are visible to every process (worker).
 *
 * SAB layout (Int32Array view):
 *   Header (16 bytes = 4 x i32):
 *     [0] spinlock       — 0=free, 1=held
 *     [1] count          — number of active lock entries
 *     [2] capacity       — max entries (fixed at creation)
 *     [3] wake_counter   — bumped on every unlock (Atomics.notify for F_SETLKW)
 *
 *   Entries (32 bytes = 8 x i32 each, starting at byte offset 16):
 *     [+0] path_hash     — FNV-1a hash of file path (i32)
 *     [+1] pid           — owning process ID (i32)
 *     [+2] lock_type     — F_RDLCK=0, F_WRLCK=1, F_UNLCK=2 (i32)
 *     [+3] _reserved     — padding (i32)
 *     [+4] start_lo      — lock start offset low 32 bits (i32)
 *     [+5] start_hi      — lock start offset high 32 bits (i32)
 *     [+6] len_lo        — lock length low 32 bits (i32)
 *     [+7] len_hi        — lock length high 32 bits (i32)
 */
interface LockInfo {
    pathHash: number;
    pid: number;
    lockType: number;
    start: bigint;
    len: bigint;
}
declare class SharedLockTable {
    private view;
    private sab;
    private constructor();
    static create(capacity?: number): SharedLockTable;
    static fromBuffer(sab: SharedArrayBuffer): SharedLockTable;
    getBuffer(): SharedArrayBuffer;
    private acquire;
    private release;
    private entryBase;
    private readEntry;
    private writeEntry;
    private removeEntryUnsafe;
    private i64FromParts;
    private i64ToParts;
    private static rangesOverlap;
    private static conflicts;
    /**
     * Check if a lock would be blocked. Returns the blocking lock info, or null.
     * (Used for F_GETLK and for F_SETLK conflict check.)
     */
    getBlockingLock(pathHash: number, lockType: number, start: bigint, len: bigint, pid: number): LockInfo | null;
    private _getBlockingLockUnsafe;
    /**
     * Set a lock (non-blocking). For F_UNLCK, removes matching locks.
     * Returns true on success, false if conflicting lock exists (EAGAIN).
     */
    setLock(pathHash: number, pid: number, lockType: number, start: bigint, len: bigint): boolean;
    private _setLockUnsafe;
    /**
     * Set a lock, blocking until it can be acquired (F_SETLKW).
     * Uses Atomics.wait on wake_counter to sleep between retries.
     */
    setLockWait(pathHash: number, pid: number, lockType: number, start: bigint, len: bigint): void;
    /**
     * Remove all locks held by a given pid (cleanup on process exit).
     */
    removeLocksByPid(pid: number): void;
    /**
     * FNV-1a hash of a string, returning a signed i32.
     */
    static hashPath(path: string): number;
}

declare class TcpNetworkBackend implements NetworkIO {
    private connections;
    connect(handle: number, addr: Uint8Array, port: number): void;
    send(handle: number, data: Uint8Array, _flags: number): number;
    recv(handle: number, maxLen: number, _flags: number): Uint8Array;
    close(handle: number): void;
    getaddrinfo(hostname: string): Uint8Array;
}

interface FetchBackendOptions {
    corsProxyUrl?: string;
}
declare class FetchNetworkBackend implements NetworkIO {
    private connections;
    private hostnameMap;
    private options;
    constructor(options?: FetchBackendOptions);
    connect(handle: number, addr: Uint8Array, port: number): void;
    send(handle: number, data: Uint8Array, _flags: number): number;
    recv(handle: number, maxLen: number, _flags: number): Uint8Array;
    close(handle: number): void;
    getaddrinfo(hostname: string): Uint8Array;
}

/**
 * HostFileSystem — a Node.js passthrough FileSystemBackend.
 *
 * All paths are sandboxed under `rootPath`; any attempt to escape
 * via `../` or symlinks resolving outside the root is rejected.
 */

declare class HostFileSystem implements FileSystemBackend {
    private rootPath;
    private fdPositions;
    private dirHandles;
    private nextDirHandle;
    constructor(rootPath: string);
    /**
     * Resolve a mount-relative path to an absolute host path,
     * ensuring it stays within `rootPath`.
     */
    private safePath;
    private toStatResult;
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

/**
 * Load a VFS image from bytes or a URL, handling `.vfs` (plain) and
 * `.vfs.zst` (zstd-compressed) transparently.
 *
 * Why zstd is done here rather than via `Content-Encoding: zstd` on
 * the HTTP server: we cannot rely on every consumer's server to
 * negotiate zstd correctly (Vite dev server, GitHub's raw asset
 * download, Node `fetch`, browser environments that lag the spec).
 * fzstd is ~18KB minified and deterministic.
 */

/**
 * Decompress a `.vfs.zst` blob if needed and return raw VFS image bytes.
 * `.vfs` bytes pass through unchanged.
 *
 * Detection is by zstd magic (0x28B52FFD, little-endian) rather than
 * filename — the caller may be working from an ambiguous source.
 */
declare function decompressVfsImage(buf: Uint8Array): Uint8Array;
/**
 * Load a VFS image from a URL, decompressing zstd if needed, and
 * instantiate a MemoryFileSystem.
 */
declare function loadVfsImage(url: string, options?: VfsImageOptions & {
    maxByteLength?: number;
}): Promise<MemoryFileSystem>;

/**
 * Resolve a binary (wasm, zip bundle, vfs image) from the repo's
 * `local-binaries/` or `binaries/` tree.
 *
 * Priority:
 *   1. `<repo>/local-binaries/<relPath>` — user-built override.
 *   2. `<repo>/binaries/<relPath>` — populated by
 *      `scripts/fetch-binaries.sh`.
 *
 * Throws if neither exists. Callers that want to tolerate a missing
 * binary should catch and fall back themselves.
 *
 * See `docs/binary-releases.md` for the layout.
 */
declare function findRepoRoot(startFrom?: string): string;
declare function resolveBinary(relPath: string): string;
/**
 * Like `resolveBinary` but returns `null` instead of throwing when the
 * binary is absent. Callers choose how to handle the miss.
 */
declare function tryResolveBinary(relPath: string): string | null;
/** Returns the absolute path of binaries/ whether or not it exists. */
declare function binariesDir(): string;
/** Returns the absolute path of local-binaries/ whether or not it exists. */
declare function localBinariesDir(): string;

/**
 * WebAssembly dynamic linking support — parses the dylink.0 custom section
 * and loads side modules into a running process's memory space.
 *
 * Follows the WebAssembly tool-conventions dynamic linking ABI:
 * https://github.com/WebAssembly/tool-conventions/blob/main/DynamicLinking.md
 */
interface DylinkMetadata {
    /** Bytes of linear memory this module needs */
    memorySize: number;
    /** Memory alignment as power of 2 */
    memoryAlign: number;
    /** Number of indirect function table slots needed */
    tableSize: number;
    /** Table alignment as power of 2 */
    tableAlign: number;
    /** Dependent shared libraries (like ELF DT_NEEDED) */
    neededDynlibs: string[];
    /** Exports that are TLS-related */
    tlsExports: Set<string>;
    /** Imports that are weakly bound */
    weakImports: Set<string>;
}
/**
 * Parse the dylink.0 custom section from a Wasm binary.
 * Returns null if the section is not found.
 */
declare function parseDylinkSection(wasmBytes: Uint8Array): DylinkMetadata | null;
/**
 * Shared library instance loaded into a process's address space.
 */
interface LoadedSharedLibrary {
    /** Wasm module instance */
    instance: WebAssembly.Instance;
    /** Base address in linear memory where this library's data is placed */
    memoryBase: number;
    /** Base index in the indirect function table */
    tableBase: number;
    /** Exported symbols (functions and data addresses) */
    exports: Record<string, WebAssembly.ExportValue>;
    /** Metadata from dylink.0 */
    metadata: DylinkMetadata;
    /** Path/name of the library */
    name: string;
}
/**
 * Options for loading a shared library.
 */
interface LoadSharedLibraryOptions {
    /** The shared Wasm.Memory used by the process */
    memory: WebAssembly.Memory;
    /** The process's indirect function table */
    table: WebAssembly.Table;
    /** Stack pointer global (shared across all modules) */
    stackPointer: WebAssembly.Global;
    /** Current heap pointer — updated after allocation */
    heapPointer: {
        value: number;
    };
    /** Global symbol table: name → function or WebAssembly.Global */
    globalSymbols: Map<string, Function | WebAssembly.Global>;
    /** GOT entries: symbol name → mutable i32 WebAssembly.Global */
    got: Map<string, WebAssembly.Global>;
    /** Already-loaded libraries for dedup and dependency resolution */
    loadedLibraries: Map<string, LoadedSharedLibrary>;
    /** Callback to locate and read a library file by name (async version) */
    resolveLibrary?: (name: string) => Promise<Uint8Array | null>;
    /** Callback to locate and read a library file by name (sync version) */
    resolveLibrarySync?: (name: string) => Uint8Array | null;
}
/**
 * Load a shared library (.so / side module) into a process's address space.
 * Async version — uses async WebAssembly compilation for large modules and
 * supports async dependency resolution.
 */
declare function loadSharedLibrary(name: string, wasmBytes: Uint8Array, options: LoadSharedLibraryOptions): Promise<LoadedSharedLibrary>;
/**
 * Load a shared library synchronously. Required for dlopen() which must
 * return synchronously to C code. Uses synchronous WebAssembly compilation.
 */
declare function loadSharedLibrarySync(name: string, wasmBytes: Uint8Array, options: LoadSharedLibraryOptions): LoadedSharedLibrary;
/**
 * Manages dynamic linking state for a single process. Provides the dlopen/dlsym/
 * dlclose API that maps to C runtime calls.
 */
declare class DynamicLinker {
    private options;
    private handleCounter;
    private handleMap;
    private lastError;
    constructor(options: LoadSharedLibraryOptions);
    /** Open a shared library. Returns a handle (>0) or 0 on error. */
    dlopenSync(name: string, wasmBytes: Uint8Array): number;
    /** Look up a symbol by name. Returns the function or address, or null. */
    dlsym(handle: number, symbolName: string): Function | number | null;
    /** Close a library handle. Returns 0 on success. */
    dlclose(handle: number): number;
    /** Get the last error message, or null if no error. */
    dlerror(): string | null;
}

/** WebAssembly page size (64 KiB) */
declare const WASM_PAGE_SIZE = 65536;
/** Total channel size: header + data */
declare const CH_TOTAL_SIZE: number;
/** Default max pages for WebAssembly.Memory */
declare const DEFAULT_MAX_PAGES = 16384;
/**
 * Pages allocated per thread: 2 for channel (65,608 bytes spills past one
 * 64 KiB page), 1 gap page, 1 for TLS.
 */
declare const PAGES_PER_THREAD = 4;

interface ThreadAllocation {
    /** Base page number (highest page of the thread's region) */
    basePage: number;
    /** Byte offset of the channel in Memory */
    channelOffset: number;
    /** Byte offset of the TLS region in Memory */
    tlsAllocAddr: number;
}
/**
 * Manages thread channel page allocation within a WebAssembly.Memory.
 *
 * Pages are allocated top-down: the main process channel sits at the top
 * two pages, and each thread gets PAGES_PER_THREAD pages counting downward.
 * Freed pages go to a free list for reuse.
 *
 * Per-thread layout (from basePage going down):
 *   basePage+1  — channel spill (40 bytes of header past 64 KiB boundary)
 *   basePage    — channel start (64 KiB data buffer)
 *   basePage-1  — gap page
 *   basePage-2  — TLS page
 * The spill page is absorbed by PAGES_PER_THREAD spacing between threads.
 */
declare class ThreadPageAllocator {
    private nextPage;
    private freePages;
    constructor(maxPages: number);
    /** Allocate pages for a new thread. Zeros the channel and TLS regions. */
    allocate(memory: WebAssembly.Memory): ThreadAllocation;
    /** Return pages to the free list after thread exit. */
    free(basePage: number): void;
}

/**
 * Tiny eager-import surface for the WASI compatibility path.
 *
 * Split out of `wasi-shim.ts` so worker bootstraps that handle our
 * native channel-syscall binaries (mariadbd, dinit, dash, coreutils,
 * everything compiled by the wasm32-posix toolchain) don't have to
 * pay the parse + JIT cost of the 1300-line WASI translation layer
 * just to run `Array.some()` over a module's imports and answer
 * "does this module import wasi_snapshot_preview1?".
 *
 * The heavy WasiShim class lives in `wasi-shim.ts` and is dynamically
 * imported by `worker-main.ts` only when `isWasiModule()` returns
 * true. For non-WASI workloads (the common case in this repo) it
 * never enters the worker.
 */
/**
 * Detect whether a compiled WebAssembly module is a WASI module.
 *
 * `wasi_snapshot_preview1` is the only WASI version this codebase
 * supports; older `wasi_unstable` modules aren't recognized.
 */
declare function isWasiModule(module: WebAssembly.Module): boolean;
/**
 * Check if a WASI module imports memory (required for shared memory channel).
 */
declare function wasiModuleImportsMemory(module: WebAssembly.Module): boolean;
/**
 * Check if a WASI module defines its own memory (not supported).
 */
declare function wasiModuleDefinesMemory(module: WebAssembly.Module): boolean;

/**
 * WASI Preview 1 compatibility shim.
 *
 * Translates wasi_snapshot_preview1 imports into channel-based syscalls
 * that the existing kernel understands. This allows pre-built WASI binaries
 * to run on the wasm-posix-kernel without recompilation.
 *
 * Only supports WASI modules that import memory (--import-memory).
 *
 * This module is dynamically imported by `worker-main.ts` only when
 * `isWasiModule()` (in `./wasi-detect.ts`) returns true. Workers that
 * load a native channel-syscall binary never pay this file's parse
 * + JIT cost. Don't add eager imports of it from the worker
 * bootstrap path.
 */
/**
 * Exit signal used by proc_exit to abort execution immediately.
 */
declare class WasiExit extends Error {
    code: number;
    constructor(code: number);
}

/**
 * WASI Preview 1 shim that translates WASI calls into channel-based syscalls.
 */
declare class WasiShim {
    private memory;
    private channelOffset;
    private argv;
    private env;
    private preopens;
    private encoder;
    private decoder;
    constructor(memory: WebAssembly.Memory, channelOffset: number, argv: string[], env: string[]);
    /** Open preopened directories via syscall. Call after kernel registration. */
    init(): void;
    /** Issue a syscall through the channel and wait for the result. */
    private doSyscall;
    /** Get the channel data area address. */
    private get dataArea();
    /** Write a string to the data area and null-terminate it. Returns byte length (without null). */
    private writeStringToData;
    /**
     * Resolve a WASI path (relative to a preopened dirfd) to a kernel-ready
     * (dirfd, pathAddr) pair. Writes the path into the data area.
     */
    private resolvePath;
    /**
     * Read the kernel's WasmStat (88 bytes) from a data area offset and
     * write WASI filestat (64 bytes) to the module's memory.
     */
    private translateStat;
    /** Build the wasi_snapshot_preview1 import namespace. */
    getImports(): Record<string, Function>;
    args_get(argvPtrs: number, argvBuf: number): number;
    args_sizes_get(argcOut: number, argvBufSizeOut: number): number;
    environ_get(environPtrs: number, environBuf: number): number;
    environ_sizes_get(countOut: number, sizeOut: number): number;
    fd_prestat_get(fd: number, prestatPtr: number): number;
    fd_prestat_dir_name(fd: number, pathPtr: number, pathLen: number): number;
    fd_close(fd: number): number;
    fd_read(fd: number, iovsPtr: number, iovsLen: number, nreadOut: number): number;
    fd_write(fd: number, iovsPtr: number, iovsLen: number, nwrittenOut: number): number;
    fd_pread(fd: number, iovsPtr: number, iovsLen: number, offset: bigint, nreadOut: number): number;
    fd_pwrite(fd: number, iovsPtr: number, iovsLen: number, offset: bigint, nwrittenOut: number): number;
    fd_seek(fd: number, offset: bigint, whence: number, newOffsetOut: number): number;
    fd_tell(fd: number, offsetOut: number): number;
    fd_sync(fd: number): number;
    fd_datasync(fd: number): number;
    fd_fdstat_get(fd: number, fdstatPtr: number): number;
    fd_fdstat_set_flags(fd: number, fdflags: number): number;
    fd_fdstat_set_rights(): number;
    fd_filestat_get(fd: number, filestatPtr: number): number;
    fd_filestat_set_size(fd: number, size: bigint): number;
    fd_filestat_set_times(fd: number, atim: bigint, mtim: bigint, fstFlags: number): number;
    fd_allocate(fd: number, offset: bigint, len: bigint): number;
    fd_advise(): number;
    fd_readdir(fd: number, buf: number, bufLen: number, cookie: bigint, sizeOut: number): number;
    fd_renumber(from: number, to: number): number;
    path_create_directory(fd: number, pathPtr: number, pathLen: number): number;
    path_unlink_file(fd: number, pathPtr: number, pathLen: number): number;
    path_remove_directory(fd: number, pathPtr: number, pathLen: number): number;
    path_rename(oldFd: number, oldPathPtr: number, oldPathLen: number, newFd: number, newPathPtr: number, newPathLen: number): number;
    path_symlink(oldPathPtr: number, oldPathLen: number, fd: number, newPathPtr: number, newPathLen: number): number;
    path_readlink(fd: number, pathPtr: number, pathLen: number, buf: number, bufLen: number, sizeOut: number): number;
    path_link(oldFd: number, _oldFlags: number, oldPathPtr: number, oldPathLen: number, newFd: number, newPathPtr: number, newPathLen: number): number;
    path_open(dirfd: number, _lookupFlags: number, pathPtr: number, pathLen: number, oflags: number, _rightsBase: bigint, _rightsInheriting: bigint, fdflags: number, fdOut: number): number;
    path_filestat_get(fd: number, _flags: number, pathPtr: number, pathLen: number, filestatPtr: number): number;
    path_filestat_set_times(fd: number, _flags: number, pathPtr: number, pathLen: number, atim: bigint, mtim: bigint, fstFlags: number): number;
    random_get(buf: number, bufLen: number): number;
    clock_time_get(clockId: number, _precision: bigint, timeOut: number): number;
    clock_res_get(clockId: number, resOut: number): number;
    proc_exit(code: number): void;
    proc_raise(sig: number): number;
    sched_yield(): number;
    poll_oneoff(inPtr: number, outPtr: number, nsubscriptions: number, neventsOut: number): number;
    sock_recv(fd: number, iovsPtr: number, iovsLen: number, _riFlags: number, roDataLenOut: number, roFlagsOut: number): number;
    sock_send(fd: number, iovsPtr: number, iovsLen: number, _siFlags: number, nwrittenOut: number): number;
    sock_shutdown(fd: number, how: number): number;
    sock_accept(_fd: number, _flags: number, _fdOut: number): number;
}

interface NodeKernelHostOptions {
    /** Maximum concurrent workers (default: 4) */
    maxWorkers?: number;
    /** Maximum wasm memory pages per process (default: 16384 = 1GB) */
    maxPages?: number;
    /** Size of the data buffer for syscall data transfer (default: 65536).
     *  Increase for programs that do large pwrite() calls (e.g. InnoDB). */
    dataBufferSize?: number;
    /** Virtual path → host filesystem path for exec resolution inside the worker */
    execPrograms?: Record<string, string>;
    /** Called when a process writes to stdout */
    onStdout?: (pid: number, data: Uint8Array) => void;
    /** Called when a process writes to stderr */
    onStderr?: (pid: number, data: Uint8Array) => void;
    /** Called when a process writes PTY output */
    onPtyOutput?: (pid: number, data: Uint8Array) => void;
    /**
     * Called when the worker can't resolve an exec path locally.
     * Return the program bytes or null if not found.
     */
    onResolveExec?: (path: string) => ArrayBuffer | null | Promise<ArrayBuffer | null>;
}
interface SpawnOptions {
    env?: string[];
    cwd?: string;
    stdin?: Uint8Array;
    pty?: boolean;
    /** Limit heap growth to protect thread channel pages */
    maxAddr?: number;
    /** Called after the process has been created and started */
    onStarted?: (pid: number) => void | Promise<void>;
}
declare class NodeKernelHost {
    private worker;
    private pendingRequests;
    private exitResolvers;
    private _nextRequestId;
    private options;
    constructor(options?: NodeKernelHostOptions);
    /** Initialize the kernel by spawning a dedicated worker_thread */
    init(kernelWasmBytes?: ArrayBuffer): Promise<void>;
    /**
     * Spawn a new process. Returns a promise that resolves with the exit code.
     */
    spawn(programBytes: ArrayBuffer, argv: string[], options?: SpawnOptions): Promise<number>;
    /** Append data to a process's stdin buffer (process sees more data, no EOF) */
    appendStdinData(pid: number, data: Uint8Array): void;
    /** Set a process's stdin data (complete buffer with implicit EOF) */
    setStdinData(pid: number, data: Uint8Array): void;
    /** Write data to the PTY master for a process */
    ptyWrite(pid: number, data: Uint8Array): void;
    /** Resize the PTY for a process */
    ptyResize(pid: number, rows: number, cols: number): void;
    /** Terminate a specific process */
    terminateProcess(pid: number, status?: number): Promise<void>;
    /** Destroy the kernel and release all resources */
    destroy(): Promise<void>;
    private sendToWorker;
    private request;
    private handleWorkerMessage;
    private handleResolveExec;
}

/**
 * Message protocol for Node.js main thread ↔ kernel worker_thread communication.
 *
 * Mirrors the browser's kernel-worker-protocol.ts but adapted for Node.js:
 * - No SharedArrayBuffer VFS (Node uses real filesystem via NodePlatformIO)
 * - No worker entry URLs (Node uses NodeWorkerAdapter)
 * - No pipe/inject/bridge operations (TCP bridging is automatic via NodePlatformIO)
 */
interface InitMessage {
    type: "init";
    kernelWasmBytes: ArrayBuffer;
    config: {
        maxWorkers: number;
        maxPages?: number;
        dataBufferSize?: number;
        useSharedMemory?: boolean;
    };
    /** Virtual path → host filesystem path for exec resolution */
    execPrograms?: Record<string, string>;
}
interface SpawnMessage {
    type: "spawn";
    requestId: number;
    programBytes: ArrayBuffer;
    argv: string[];
    env?: string[];
    cwd?: string;
    pty?: boolean;
    stdin?: Uint8Array;
    /** Limit heap growth to protect thread channel pages */
    maxAddr?: number;
}
interface AppendStdinDataMessage {
    type: "append_stdin_data";
    pid: number;
    data: Uint8Array;
}
interface SetStdinDataMessage {
    type: "set_stdin_data";
    pid: number;
    data: Uint8Array;
}
interface PtyWriteMessage {
    type: "pty_write";
    pid: number;
    data: Uint8Array;
}
interface PtyResizeMessage {
    type: "pty_resize";
    pid: number;
    rows: number;
    cols: number;
}
interface TerminateProcessMessage {
    type: "terminate_process";
    requestId: number;
    pid: number;
    status: number;
}
interface DestroyMessage {
    type: "destroy";
    requestId: number;
}
interface ResolveExecResponseMessage {
    type: "resolve_exec_response";
    requestId: number;
    programBytes: ArrayBuffer | null;
}
type MainToKernelMessage = InitMessage | SpawnMessage | AppendStdinDataMessage | SetStdinDataMessage | PtyWriteMessage | PtyResizeMessage | TerminateProcessMessage | DestroyMessage | ResolveExecResponseMessage;
interface ReadyMessage {
    type: "ready";
}
interface ResponseMessage {
    type: "response";
    requestId: number;
    result: unknown;
    error?: string;
}
interface ExitMessage {
    type: "exit";
    pid: number;
    status: number;
}
interface StdoutMessage {
    type: "stdout";
    pid: number;
    data: Uint8Array;
}
interface StderrMessage {
    type: "stderr";
    pid: number;
    data: Uint8Array;
}
interface PtyOutputMessage {
    type: "pty_output";
    pid: number;
    data: Uint8Array;
}
interface ResolveExecRequestMessage {
    type: "resolve_exec";
    requestId: number;
    path: string;
}
type KernelToMainMessage = ReadyMessage | ResponseMessage | ExitMessage | StdoutMessage | StderrMessage | PtyOutputMessage | ResolveExecRequestMessage;

export { CH_TOTAL_SIZE, type CentralizedKernelCallbacks, CentralizedKernelWorker, DEFAULT_MAX_PAGES, DirEntry, type DylinkMetadata, DynamicLinker, type FetchBackendOptions, FetchNetworkBackend, FileSystemBackend, HostFileSystem, KernelConfig, type KernelToMainMessage, type LoadSharedLibraryOptions, type LoadedSharedLibrary, type LockInfo, type MainToKernelMessage, MemoryFileSystem, NetworkIO, NodeKernelHost, type NodeKernelHostOptions, NodePlatformIO, PAGES_PER_THREAD, PlatformIO, SharedLockTable, type SpawnOptions, StatResult, TcpNetworkBackend, type ThreadAllocation, ThreadPageAllocator, VfsImageOptions, WASM_PAGE_SIZE, WasiExit, WasiShim, WasmPosixKernel, binariesDir, decompressVfsImage, findRepoRoot, isWasiModule, loadSharedLibrary, loadSharedLibrarySync, loadVfsImage, localBinariesDir, parseDylinkSection, resolveBinary, tryResolveBinary, wasiModuleDefinesMemory, wasiModuleImportsMemory };
