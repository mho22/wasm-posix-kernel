var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/wasi-detect.ts
function isWasiModule(module) {
  return WebAssembly.Module.imports(module).some(
    (imp) => imp.module === "wasi_snapshot_preview1"
  );
}
function wasiModuleImportsMemory(module) {
  return WebAssembly.Module.imports(module).some(
    (imp) => imp.module === "env" && imp.name === "memory" && imp.kind === "memory"
  );
}
function wasiModuleDefinesMemory(module) {
  return WebAssembly.Module.exports(module).some(
    (exp) => exp.name === "memory" && exp.kind === "memory"
  );
}
var init_wasi_detect = __esm({
  "src/wasi-detect.ts"() {
    "use strict";
  }
});

// src/wasi-shim.ts
var wasi_shim_exports = {};
__export(wasi_shim_exports, {
  WasiExit: () => WasiExit,
  WasiShim: () => WasiShim,
  isWasiModule: () => isWasiModule,
  wasiModuleDefinesMemory: () => wasiModuleDefinesMemory,
  wasiModuleImportsMemory: () => wasiModuleImportsMemory
});
function translateLinuxErrno(linuxErrno) {
  return linuxToWasi.get(linuxErrno) ?? WASI_EIO;
}
function modeToFiletype(mode) {
  switch (mode & S_IFMT) {
    case S_IFBLK:
      return WASI_FILETYPE_BLOCK_DEVICE;
    case S_IFCHR:
      return WASI_FILETYPE_CHARACTER_DEVICE;
    case S_IFDIR:
      return WASI_FILETYPE_DIRECTORY;
    case S_IFREG:
      return WASI_FILETYPE_REGULAR_FILE;
    case S_IFLNK:
      return WASI_FILETYPE_SYMBOLIC_LINK;
    case S_IFSOCK:
      return WASI_FILETYPE_SOCKET_STREAM;
    case S_IFIFO:
      return WASI_FILETYPE_CHARACTER_DEVICE;
    // FIFO → char device (closest)
    default:
      return WASI_FILETYPE_UNKNOWN;
  }
}
function wasiWhenceToPosix(wasiWhence) {
  switch (wasiWhence) {
    case WASI_WHENCE_SET:
      return SEEK_SET;
    case WASI_WHENCE_CUR:
      return SEEK_CUR;
    case WASI_WHENCE_END:
      return SEEK_END;
    default:
      return SEEK_SET;
  }
}
function wasiClockToPosix(wasiClock) {
  switch (wasiClock) {
    case WASI_CLOCK_REALTIME:
      return CLOCK_REALTIME;
    case WASI_CLOCK_MONOTONIC:
      return CLOCK_MONOTONIC;
    case WASI_CLOCK_PROCESS_CPUTIME:
      return CLOCK_PROCESS_CPUTIME_ID;
    case WASI_CLOCK_THREAD_CPUTIME:
      return CLOCK_THREAD_CPUTIME_ID;
    default:
      return CLOCK_REALTIME;
  }
}
function wasiOflagsToPosix(oflags, fdflags) {
  let flags = 0;
  if (oflags & WASI_O_CREAT) flags |= O_CREAT;
  if (oflags & WASI_O_DIRECTORY) flags |= O_DIRECTORY;
  if (oflags & WASI_O_EXCL) flags |= O_EXCL;
  if (oflags & WASI_O_TRUNC) flags |= O_TRUNC;
  if (fdflags & WASI_FDFLAG_APPEND) flags |= O_APPEND;
  if (fdflags & WASI_FDFLAG_NONBLOCK) flags |= O_NONBLOCK;
  return flags;
}
function posixFlagToWasiFdflags(flags) {
  let fdflags = 0;
  if (flags & O_APPEND) fdflags |= WASI_FDFLAG_APPEND;
  if (flags & O_NONBLOCK) fdflags |= WASI_FDFLAG_NONBLOCK;
  return fdflags;
}
var CH_SYSCALL, CH_ARGS, CH_ARG_SIZE, CH_RETURN, CH_ERRNO, CH_DATA, CH_DATA_SIZE, CH_IDLE, CH_PENDING, SYS_CLOSE, SYS_LSEEK, SYS_FSTAT, SYS_FCNTL, SYS_GETPID, SYS_EXIT, SYS_KILL, SYS_CLOCK_GETTIME, SYS_POLL, SYS_SENDTO, SYS_RECVFROM, SYS_PREAD, SYS_PWRITE, SYS_OPENAT, SYS_FTRUNCATE, SYS_FSYNC, SYS_WRITEV, SYS_READV, SYS_FDATASYNC, SYS_FSTATAT, SYS_UNLINKAT, SYS_MKDIRAT, SYS_RENAMEAT, SYS_LINKAT, SYS_SYMLINKAT, SYS_READLINKAT, SYS_GETRANDOM, SYS_GETDENTS64, SYS_CLOCK_GETRES, SYS_UTIMENSAT, SYS_SCHED_YIELD, SYS_FALLOCATE, SYS_DUP2, SYS_SHUTDOWN, O_RDONLY, O_RDWR, O_CREAT, O_EXCL, O_TRUNC, O_APPEND, O_NONBLOCK, O_DIRECTORY, AT_FDCWD, AT_REMOVEDIR, F_GETFL, F_SETFL, SEEK_SET, SEEK_CUR, SEEK_END, S_IFDIR, S_IFCHR, S_IFBLK, S_IFREG, S_IFIFO, S_IFLNK, S_IFSOCK, S_IFMT, WASI_ESUCCESS, WASI_E2BIG, WASI_EACCES, WASI_EADDRINUSE, WASI_EADDRNOTAVAIL, WASI_EAFNOSUPPORT, WASI_EAGAIN, WASI_EALREADY, WASI_EBADF, WASI_EBADMSG, WASI_EBUSY, WASI_ECANCELED, WASI_ECHILD, WASI_ECONNABORTED, WASI_ECONNREFUSED, WASI_ECONNRESET, WASI_EDEADLK, WASI_EDESTADDRREQ, WASI_EDOM, WASI_EDQUOT, WASI_EEXIST, WASI_EFAULT, WASI_EFBIG, WASI_EHOSTUNREACH, WASI_EIDRM, WASI_EILSEQ, WASI_EINPROGRESS, WASI_EINTR, WASI_EINVAL, WASI_EIO, WASI_EISCONN, WASI_EISDIR, WASI_ELOOP, WASI_EMFILE, WASI_EMLINK, WASI_EMSGSIZE, WASI_EMULTIHOP, WASI_ENAMETOOLONG, WASI_ENETDOWN, WASI_ENETRESET, WASI_ENETUNREACH, WASI_ENFILE, WASI_ENOBUFS, WASI_ENODEV, WASI_ENOENT, WASI_ENOEXEC, WASI_ENOLCK, WASI_ENOLINK, WASI_ENOMEM, WASI_ENOMSG, WASI_ENOPROTOOPT, WASI_ENOSPC, WASI_ENOSYS, WASI_ENOTCONN, WASI_ENOTDIR, WASI_ENOTEMPTY, WASI_ENOTRECOVERABLE, WASI_ENOTSOCK, WASI_ENOTSUP, WASI_ENOTTY, WASI_ENXIO, WASI_EOVERFLOW, WASI_EOWNERDEAD, WASI_EPERM, WASI_EPIPE, WASI_EPROTO, WASI_EPROTONOSUPPORT, WASI_EPROTOTYPE, WASI_ERANGE, WASI_EROFS, WASI_ESPIPE, WASI_ESRCH, WASI_ESTALE, WASI_ETIMEDOUT, WASI_ETXTBSY, WASI_EXDEV, linuxToWasi, WASI_FILETYPE_UNKNOWN, WASI_FILETYPE_BLOCK_DEVICE, WASI_FILETYPE_CHARACTER_DEVICE, WASI_FILETYPE_DIRECTORY, WASI_FILETYPE_REGULAR_FILE, WASI_FILETYPE_SOCKET_STREAM, WASI_FILETYPE_SYMBOLIC_LINK, WASI_CLOCK_REALTIME, WASI_CLOCK_MONOTONIC, WASI_CLOCK_PROCESS_CPUTIME, WASI_CLOCK_THREAD_CPUTIME, CLOCK_REALTIME, CLOCK_MONOTONIC, CLOCK_PROCESS_CPUTIME_ID, CLOCK_THREAD_CPUTIME_ID, WASI_WHENCE_SET, WASI_WHENCE_CUR, WASI_WHENCE_END, WASI_O_CREAT, WASI_O_DIRECTORY, WASI_O_EXCL, WASI_O_TRUNC, WASI_FDFLAG_APPEND, WASI_FDFLAG_NONBLOCK, WASI_EVENTTYPE_CLOCK, WASI_EVENTTYPE_FD_READ, WASI_RIGHTS_ALL, WASI_PREOPENTYPE_DIR, POLLIN, POLLOUT, POLLERR, WasiExit, WasiShim;
var init_wasi_shim = __esm({
  "src/wasi-shim.ts"() {
    "use strict";
    init_wasi_detect();
    CH_SYSCALL = 4;
    CH_ARGS = 8;
    CH_ARG_SIZE = 8;
    CH_RETURN = 56;
    CH_ERRNO = 64;
    CH_DATA = 72;
    CH_DATA_SIZE = 65536;
    CH_IDLE = 0;
    CH_PENDING = 1;
    SYS_CLOSE = 2;
    SYS_LSEEK = 5;
    SYS_FSTAT = 6;
    SYS_FCNTL = 10;
    SYS_GETPID = 28;
    SYS_EXIT = 34;
    SYS_KILL = 35;
    SYS_CLOCK_GETTIME = 40;
    SYS_POLL = 60;
    SYS_SENDTO = 62;
    SYS_RECVFROM = 63;
    SYS_PREAD = 64;
    SYS_PWRITE = 65;
    SYS_OPENAT = 69;
    SYS_FTRUNCATE = 79;
    SYS_FSYNC = 80;
    SYS_WRITEV = 81;
    SYS_READV = 82;
    SYS_FDATASYNC = 86;
    SYS_FSTATAT = 93;
    SYS_UNLINKAT = 94;
    SYS_MKDIRAT = 95;
    SYS_RENAMEAT = 96;
    SYS_LINKAT = 100;
    SYS_SYMLINKAT = 101;
    SYS_READLINKAT = 102;
    SYS_GETRANDOM = 120;
    SYS_GETDENTS64 = 122;
    SYS_CLOCK_GETRES = 123;
    SYS_UTIMENSAT = 125;
    SYS_SCHED_YIELD = 229;
    SYS_FALLOCATE = 308;
    SYS_DUP2 = 8;
    SYS_SHUTDOWN = 57;
    O_RDONLY = 0;
    O_RDWR = 2;
    O_CREAT = 64;
    O_EXCL = 128;
    O_TRUNC = 512;
    O_APPEND = 1024;
    O_NONBLOCK = 2048;
    O_DIRECTORY = 65536;
    AT_FDCWD = -100;
    AT_REMOVEDIR = 512;
    F_GETFL = 3;
    F_SETFL = 4;
    SEEK_SET = 0;
    SEEK_CUR = 1;
    SEEK_END = 2;
    S_IFDIR = 16384;
    S_IFCHR = 8192;
    S_IFBLK = 24576;
    S_IFREG = 32768;
    S_IFIFO = 4096;
    S_IFLNK = 40960;
    S_IFSOCK = 49152;
    S_IFMT = 61440;
    WASI_ESUCCESS = 0;
    WASI_E2BIG = 1;
    WASI_EACCES = 2;
    WASI_EADDRINUSE = 3;
    WASI_EADDRNOTAVAIL = 4;
    WASI_EAFNOSUPPORT = 5;
    WASI_EAGAIN = 6;
    WASI_EALREADY = 7;
    WASI_EBADF = 8;
    WASI_EBADMSG = 9;
    WASI_EBUSY = 10;
    WASI_ECANCELED = 11;
    WASI_ECHILD = 12;
    WASI_ECONNABORTED = 13;
    WASI_ECONNREFUSED = 14;
    WASI_ECONNRESET = 15;
    WASI_EDEADLK = 16;
    WASI_EDESTADDRREQ = 17;
    WASI_EDOM = 18;
    WASI_EDQUOT = 19;
    WASI_EEXIST = 20;
    WASI_EFAULT = 21;
    WASI_EFBIG = 22;
    WASI_EHOSTUNREACH = 23;
    WASI_EIDRM = 24;
    WASI_EILSEQ = 25;
    WASI_EINPROGRESS = 26;
    WASI_EINTR = 27;
    WASI_EINVAL = 28;
    WASI_EIO = 29;
    WASI_EISCONN = 30;
    WASI_EISDIR = 31;
    WASI_ELOOP = 32;
    WASI_EMFILE = 33;
    WASI_EMLINK = 34;
    WASI_EMSGSIZE = 35;
    WASI_EMULTIHOP = 36;
    WASI_ENAMETOOLONG = 37;
    WASI_ENETDOWN = 38;
    WASI_ENETRESET = 39;
    WASI_ENETUNREACH = 40;
    WASI_ENFILE = 41;
    WASI_ENOBUFS = 42;
    WASI_ENODEV = 43;
    WASI_ENOENT = 44;
    WASI_ENOEXEC = 45;
    WASI_ENOLCK = 46;
    WASI_ENOLINK = 47;
    WASI_ENOMEM = 48;
    WASI_ENOMSG = 49;
    WASI_ENOPROTOOPT = 50;
    WASI_ENOSPC = 51;
    WASI_ENOSYS = 52;
    WASI_ENOTCONN = 53;
    WASI_ENOTDIR = 54;
    WASI_ENOTEMPTY = 55;
    WASI_ENOTRECOVERABLE = 56;
    WASI_ENOTSOCK = 57;
    WASI_ENOTSUP = 58;
    WASI_ENOTTY = 59;
    WASI_ENXIO = 60;
    WASI_EOVERFLOW = 61;
    WASI_EOWNERDEAD = 62;
    WASI_EPERM = 63;
    WASI_EPIPE = 64;
    WASI_EPROTO = 65;
    WASI_EPROTONOSUPPORT = 66;
    WASI_EPROTOTYPE = 67;
    WASI_ERANGE = 68;
    WASI_EROFS = 69;
    WASI_ESPIPE = 70;
    WASI_ESRCH = 71;
    WASI_ESTALE = 72;
    WASI_ETIMEDOUT = 73;
    WASI_ETXTBSY = 74;
    WASI_EXDEV = 75;
    linuxToWasi = /* @__PURE__ */ new Map([
      [0, WASI_ESUCCESS],
      [1, WASI_EPERM],
      // EPERM
      [2, WASI_ENOENT],
      // ENOENT
      [3, WASI_ESRCH],
      // ESRCH
      [4, WASI_EINTR],
      // EINTR
      [5, WASI_EIO],
      // EIO
      [6, WASI_ENXIO],
      // ENXIO
      [7, WASI_E2BIG],
      // E2BIG
      [8, WASI_ENOEXEC],
      // ENOEXEC
      [9, WASI_EBADF],
      // EBADF
      [10, WASI_ECHILD],
      // ECHILD
      [11, WASI_EAGAIN],
      // EAGAIN / EWOULDBLOCK
      [12, WASI_ENOMEM],
      // ENOMEM
      [13, WASI_EACCES],
      // EACCES
      [14, WASI_EFAULT],
      // EFAULT
      [16, WASI_EBUSY],
      // EBUSY
      [17, WASI_EEXIST],
      // EEXIST
      [18, WASI_EXDEV],
      // EXDEV
      [19, WASI_ENODEV],
      // ENODEV
      [20, WASI_ENOTDIR],
      // ENOTDIR
      [21, WASI_EISDIR],
      // EISDIR
      [22, WASI_EINVAL],
      // EINVAL
      [23, WASI_ENFILE],
      // ENFILE
      [24, WASI_EMFILE],
      // EMFILE
      [25, WASI_ENOTTY],
      // ENOTTY
      [26, WASI_ETXTBSY],
      // ETXTBSY
      [27, WASI_EFBIG],
      // EFBIG
      [28, WASI_ENOSPC],
      // ENOSPC
      [29, WASI_ESPIPE],
      // ESPIPE
      [30, WASI_EROFS],
      // EROFS
      [31, WASI_EMLINK],
      // EMLINK
      [32, WASI_EPIPE],
      // EPIPE
      [33, WASI_EDOM],
      // EDOM
      [34, WASI_ERANGE],
      // ERANGE
      [35, WASI_EDEADLK],
      // EDEADLK
      [36, WASI_ENAMETOOLONG],
      // ENAMETOOLONG
      [37, WASI_ENOLCK],
      // ENOLCK
      [38, WASI_ENOSYS],
      // ENOSYS
      [39, WASI_ENOTEMPTY],
      // ENOTEMPTY
      [40, WASI_ELOOP],
      // ELOOP
      [42, WASI_ENOMSG],
      // ENOMSG
      [43, WASI_EIDRM],
      // EIDRM
      [60, WASI_ENOTSUP],
      // ENOSTR → ENOTSUP (no WASI equivalent)
      [61, WASI_ENOTSUP],
      // ENODATA → ENOTSUP (no WASI equivalent)
      [62, WASI_ETIMEDOUT],
      // ETIME → ETIMEDOUT (no WASI equivalent)
      [67, WASI_ENOLINK],
      // ENOLINK
      [71, WASI_EPROTO],
      // EPROTO
      [72, WASI_EMULTIHOP],
      // EMULTIHOP
      [74, WASI_EBADMSG],
      // EBADMSG
      [75, WASI_EOVERFLOW],
      // EOVERFLOW
      [84, WASI_EILSEQ],
      // EILSEQ
      [88, WASI_ENOTSOCK],
      // ENOTSOCK
      [89, WASI_EDESTADDRREQ],
      // EDESTADDRREQ
      [90, WASI_EMSGSIZE],
      // EMSGSIZE
      [91, WASI_EPROTOTYPE],
      // EPROTOTYPE
      [92, WASI_ENOPROTOOPT],
      // ENOPROTOOPT
      [93, WASI_EPROTONOSUPPORT],
      // EPROTONOSUPPORT
      [95, WASI_ENOTSUP],
      // EOPNOTSUPP
      [97, WASI_EAFNOSUPPORT],
      // EAFNOSUPPORT
      [98, WASI_EADDRINUSE],
      // EADDRINUSE
      [99, WASI_EADDRNOTAVAIL],
      // EADDRNOTAVAIL
      [100, WASI_ENETDOWN],
      // ENETDOWN
      [101, WASI_ENETUNREACH],
      // ENETUNREACH
      [102, WASI_ENETRESET],
      // ENETRESET
      [103, WASI_ECONNABORTED],
      // ECONNABORTED
      [104, WASI_ECONNRESET],
      // ECONNRESET
      [105, WASI_ENOBUFS],
      // ENOBUFS
      [106, WASI_EISCONN],
      // EISCONN
      [107, WASI_ENOTCONN],
      // ENOTCONN
      [110, WASI_ETIMEDOUT],
      // ETIMEDOUT
      [111, WASI_ECONNREFUSED],
      // ECONNREFUSED
      [113, WASI_EHOSTUNREACH],
      // EHOSTUNREACH
      [114, WASI_EALREADY],
      // EALREADY
      [115, WASI_EINPROGRESS],
      // EINPROGRESS
      [116, WASI_ESTALE],
      // ESTALE
      [122, WASI_EDQUOT],
      // EDQUOT
      [125, WASI_ECANCELED],
      // ECANCELED
      [130, WASI_EOWNERDEAD],
      // EOWNERDEAD
      [131, WASI_ENOTRECOVERABLE]
      // ENOTRECOVERABLE
    ]);
    WASI_FILETYPE_UNKNOWN = 0;
    WASI_FILETYPE_BLOCK_DEVICE = 1;
    WASI_FILETYPE_CHARACTER_DEVICE = 2;
    WASI_FILETYPE_DIRECTORY = 3;
    WASI_FILETYPE_REGULAR_FILE = 4;
    WASI_FILETYPE_SOCKET_STREAM = 6;
    WASI_FILETYPE_SYMBOLIC_LINK = 7;
    WASI_CLOCK_REALTIME = 0;
    WASI_CLOCK_MONOTONIC = 1;
    WASI_CLOCK_PROCESS_CPUTIME = 2;
    WASI_CLOCK_THREAD_CPUTIME = 3;
    CLOCK_REALTIME = 0;
    CLOCK_MONOTONIC = 1;
    CLOCK_PROCESS_CPUTIME_ID = 2;
    CLOCK_THREAD_CPUTIME_ID = 3;
    WASI_WHENCE_SET = 0;
    WASI_WHENCE_CUR = 1;
    WASI_WHENCE_END = 2;
    WASI_O_CREAT = 1;
    WASI_O_DIRECTORY = 2;
    WASI_O_EXCL = 4;
    WASI_O_TRUNC = 8;
    WASI_FDFLAG_APPEND = 1;
    WASI_FDFLAG_NONBLOCK = 4;
    WASI_EVENTTYPE_CLOCK = 0;
    WASI_EVENTTYPE_FD_READ = 1;
    WASI_RIGHTS_ALL = BigInt("0x1FFFFFFF");
    WASI_PREOPENTYPE_DIR = 0;
    POLLIN = 1;
    POLLOUT = 4;
    POLLERR = 8;
    WasiExit = class extends Error {
      code;
      constructor(code) {
        super(`WASI exit: ${code}`);
        this.code = code;
      }
    };
    WasiShim = class {
      memory;
      channelOffset;
      argv;
      env;
      preopens = /* @__PURE__ */ new Map();
      encoder = new TextEncoder();
      decoder = new TextDecoder();
      constructor(memory, channelOffset, argv, env) {
        this.memory = memory;
        this.channelOffset = channelOffset;
        this.argv = argv;
        this.env = env;
      }
      /** Open preopened directories via syscall. Call after kernel registration. */
      init() {
        const pathBytes = this.encoder.encode("/");
        const dataArea = this.channelOffset + CH_DATA;
        const view = new DataView(this.memory.buffer);
        new Uint8Array(this.memory.buffer, dataArea, pathBytes.length).set(pathBytes);
        view.setUint8(dataArea + pathBytes.length, 0);
        const { result, errno } = this.doSyscall(
          SYS_OPENAT,
          AT_FDCWD,
          dataArea,
          O_RDONLY | O_DIRECTORY,
          0,
          0,
          0
        );
        if (errno === 0 && result >= 0) {
          this.preopens.set(result, "/");
        }
      }
      /** Issue a syscall through the channel and wait for the result. */
      doSyscall(syscallNum, a0 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0, a5 = 0) {
        const base = this.channelOffset;
        const view = new DataView(this.memory.buffer);
        view.setInt32(base + CH_SYSCALL, syscallNum, true);
        view.setBigInt64(base + CH_ARGS + 0 * CH_ARG_SIZE, BigInt(a0), true);
        view.setBigInt64(base + CH_ARGS + 1 * CH_ARG_SIZE, BigInt(a1), true);
        view.setBigInt64(base + CH_ARGS + 2 * CH_ARG_SIZE, BigInt(a2), true);
        view.setBigInt64(base + CH_ARGS + 3 * CH_ARG_SIZE, BigInt(a3), true);
        view.setBigInt64(base + CH_ARGS + 4 * CH_ARG_SIZE, BigInt(a4), true);
        view.setBigInt64(base + CH_ARGS + 5 * CH_ARG_SIZE, BigInt(a5), true);
        const i32 = new Int32Array(this.memory.buffer);
        const statusIdx = base / 4;
        Atomics.store(i32, statusIdx, CH_PENDING);
        Atomics.notify(i32, statusIdx, 1);
        while (Atomics.wait(i32, statusIdx, CH_PENDING) === "ok") {
        }
        const result = Number(view.getBigInt64(base + CH_RETURN, true));
        const errno = view.getUint32(base + CH_ERRNO, true);
        Atomics.store(i32, statusIdx, CH_IDLE);
        return { result, errno };
      }
      /** Get the channel data area address. */
      get dataArea() {
        return this.channelOffset + CH_DATA;
      }
      /** Write a string to the data area and null-terminate it. Returns byte length (without null). */
      writeStringToData(str, offset = 0) {
        const bytes = this.encoder.encode(str);
        const addr = this.dataArea + offset;
        new Uint8Array(this.memory.buffer, addr, bytes.length + 1).set(bytes);
        new DataView(this.memory.buffer).setUint8(addr + bytes.length, 0);
        return bytes.length;
      }
      /**
       * Resolve a WASI path (relative to a preopened dirfd) to a kernel-ready
       * (dirfd, pathAddr) pair. Writes the path into the data area.
       */
      resolvePath(dirfd, pathPtr, pathLen, dataOffset = 0) {
        const pathBytes = new Uint8Array(this.memory.buffer, pathPtr, pathLen);
        const path = this.decoder.decode(pathBytes);
        const preopenPath = this.preopens.get(dirfd);
        let fullPath;
        if (preopenPath !== void 0) {
          if (preopenPath === "/") {
            fullPath = path.startsWith("/") ? path : "/" + path;
          } else {
            fullPath = preopenPath + (path.startsWith("/") ? path : "/" + path);
          }
        } else {
          fullPath = path;
        }
        const addr = this.dataArea + dataOffset;
        const encoded = this.encoder.encode(fullPath);
        new Uint8Array(this.memory.buffer, addr, encoded.length + 1).set(encoded);
        new DataView(this.memory.buffer).setUint8(addr + encoded.length, 0);
        return { kernelDirfd: AT_FDCWD, pathAddr: addr };
      }
      /**
       * Read the kernel's WasmStat (88 bytes) from a data area offset and
       * write WASI filestat (64 bytes) to the module's memory.
       */
      translateStat(statDataOffset, filestatPtr) {
        const view = new DataView(this.memory.buffer);
        const base = this.dataArea + statDataOffset;
        const dev = view.getBigUint64(base + 0, true);
        const ino = view.getBigUint64(base + 8, true);
        const mode = view.getUint32(base + 16, true);
        const nlink = view.getUint32(base + 20, true);
        const size = view.getBigInt64(base + 32, true);
        const atimSec = view.getBigInt64(base + 40, true);
        const atimNsec = view.getBigInt64(base + 48, true);
        const mtimSec = view.getBigInt64(base + 56, true);
        const mtimNsec = view.getBigInt64(base + 64, true);
        const ctimSec = view.getBigInt64(base + 72, true);
        const ctimNsec = view.getBigInt64(base + 80, true);
        const p = filestatPtr;
        view.setBigUint64(p + 0, dev, true);
        view.setBigUint64(p + 8, ino, true);
        view.setUint8(p + 16, modeToFiletype(mode));
        for (let i = 17; i < 24; i++) view.setUint8(p + i, 0);
        view.setBigUint64(p + 24, BigInt(nlink), true);
        view.setBigUint64(p + 32, size < 0n ? 0n : BigInt(size), true);
        view.setBigUint64(p + 40, atimSec * 1000000000n + atimNsec, true);
        view.setBigUint64(p + 48, mtimSec * 1000000000n + mtimNsec, true);
        view.setBigUint64(p + 56, ctimSec * 1000000000n + ctimNsec, true);
      }
      /** Build the wasi_snapshot_preview1 import namespace. */
      getImports() {
        return {
          args_get: this.args_get.bind(this),
          args_sizes_get: this.args_sizes_get.bind(this),
          environ_get: this.environ_get.bind(this),
          environ_sizes_get: this.environ_sizes_get.bind(this),
          fd_prestat_get: this.fd_prestat_get.bind(this),
          fd_prestat_dir_name: this.fd_prestat_dir_name.bind(this),
          fd_close: this.fd_close.bind(this),
          fd_read: this.fd_read.bind(this),
          fd_write: this.fd_write.bind(this),
          fd_pread: this.fd_pread.bind(this),
          fd_pwrite: this.fd_pwrite.bind(this),
          fd_seek: this.fd_seek.bind(this),
          fd_tell: this.fd_tell.bind(this),
          fd_sync: this.fd_sync.bind(this),
          fd_datasync: this.fd_datasync.bind(this),
          fd_fdstat_get: this.fd_fdstat_get.bind(this),
          fd_fdstat_set_flags: this.fd_fdstat_set_flags.bind(this),
          fd_fdstat_set_rights: this.fd_fdstat_set_rights.bind(this),
          fd_filestat_get: this.fd_filestat_get.bind(this),
          fd_filestat_set_size: this.fd_filestat_set_size.bind(this),
          fd_filestat_set_times: this.fd_filestat_set_times.bind(this),
          fd_allocate: this.fd_allocate.bind(this),
          fd_advise: this.fd_advise.bind(this),
          fd_readdir: this.fd_readdir.bind(this),
          fd_renumber: this.fd_renumber.bind(this),
          path_create_directory: this.path_create_directory.bind(this),
          path_unlink_file: this.path_unlink_file.bind(this),
          path_remove_directory: this.path_remove_directory.bind(this),
          path_rename: this.path_rename.bind(this),
          path_symlink: this.path_symlink.bind(this),
          path_readlink: this.path_readlink.bind(this),
          path_link: this.path_link.bind(this),
          path_open: this.path_open.bind(this),
          path_filestat_get: this.path_filestat_get.bind(this),
          path_filestat_set_times: this.path_filestat_set_times.bind(this),
          random_get: this.random_get.bind(this),
          clock_time_get: this.clock_time_get.bind(this),
          clock_res_get: this.clock_res_get.bind(this),
          proc_exit: this.proc_exit.bind(this),
          proc_raise: this.proc_raise.bind(this),
          sched_yield: this.sched_yield.bind(this),
          poll_oneoff: this.poll_oneoff.bind(this),
          sock_recv: this.sock_recv.bind(this),
          sock_send: this.sock_send.bind(this),
          sock_shutdown: this.sock_shutdown.bind(this),
          sock_accept: this.sock_accept.bind(this)
        };
      }
      // ---- Args/Environ (no syscall needed) ----
      args_get(argvPtrs, argvBuf) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        let bufOffset = argvBuf;
        for (let i = 0; i < this.argv.length; i++) {
          view.setUint32(argvPtrs + i * 4, bufOffset, true);
          const encoded = this.encoder.encode(this.argv[i]);
          mem.set(encoded, bufOffset);
          mem[bufOffset + encoded.length] = 0;
          bufOffset += encoded.length + 1;
        }
        return WASI_ESUCCESS;
      }
      args_sizes_get(argcOut, argvBufSizeOut) {
        const view = new DataView(this.memory.buffer);
        view.setUint32(argcOut, this.argv.length, true);
        let totalSize = 0;
        for (const arg of this.argv) {
          totalSize += this.encoder.encode(arg).length + 1;
        }
        view.setUint32(argvBufSizeOut, totalSize, true);
        return WASI_ESUCCESS;
      }
      environ_get(environPtrs, environBuf) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        let bufOffset = environBuf;
        for (let i = 0; i < this.env.length; i++) {
          view.setUint32(environPtrs + i * 4, bufOffset, true);
          const encoded = this.encoder.encode(this.env[i]);
          mem.set(encoded, bufOffset);
          mem[bufOffset + encoded.length] = 0;
          bufOffset += encoded.length + 1;
        }
        return WASI_ESUCCESS;
      }
      environ_sizes_get(countOut, sizeOut) {
        const view = new DataView(this.memory.buffer);
        view.setUint32(countOut, this.env.length, true);
        let totalSize = 0;
        for (const e of this.env) {
          totalSize += this.encoder.encode(e).length + 1;
        }
        view.setUint32(sizeOut, totalSize, true);
        return WASI_ESUCCESS;
      }
      // ---- Prestat ----
      fd_prestat_get(fd, prestatPtr) {
        const path = this.preopens.get(fd);
        if (path === void 0) return WASI_EBADF;
        const view = new DataView(this.memory.buffer);
        view.setUint8(prestatPtr, WASI_PREOPENTYPE_DIR);
        view.setUint32(prestatPtr + 4, this.encoder.encode(path).length, true);
        return WASI_ESUCCESS;
      }
      fd_prestat_dir_name(fd, pathPtr, pathLen) {
        const path = this.preopens.get(fd);
        if (path === void 0) return WASI_EBADF;
        const encoded = this.encoder.encode(path);
        const len = Math.min(encoded.length, pathLen);
        new Uint8Array(this.memory.buffer, pathPtr, len).set(encoded.subarray(0, len));
        return WASI_ESUCCESS;
      }
      // ---- FD operations ----
      fd_close(fd) {
        const { errno } = this.doSyscall(SYS_CLOSE, fd);
        if (errno) return translateLinuxErrno(errno);
        this.preopens.delete(fd);
        return WASI_ESUCCESS;
      }
      fd_read(fd, iovsPtr, iovsLen, nreadOut) {
        const { result, errno } = this.doSyscall(SYS_READV, fd, iovsPtr, iovsLen);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        view.setUint32(nreadOut, result, true);
        return WASI_ESUCCESS;
      }
      fd_write(fd, iovsPtr, iovsLen, nwrittenOut) {
        const { result, errno } = this.doSyscall(SYS_WRITEV, fd, iovsPtr, iovsLen);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        view.setUint32(nwrittenOut, result, true);
        return WASI_ESUCCESS;
      }
      fd_pread(fd, iovsPtr, iovsLen, offset, nreadOut) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        let totalLen = 0;
        for (let i = 0; i < iovsLen; i++) {
          totalLen += view.getUint32(iovsPtr + i * 8 + 4, true);
        }
        totalLen = Math.min(totalLen, CH_DATA_SIZE - 256);
        const { result, errno } = this.doSyscall(
          SYS_PREAD,
          fd,
          this.dataArea,
          totalLen,
          Number(offset & 0xFFFFFFFFn),
          Number(offset >> 32n & 0xFFFFFFFFn)
        );
        if (errno) return translateLinuxErrno(errno);
        let remaining = result;
        let srcOff = 0;
        for (let i = 0; i < iovsLen && remaining > 0; i++) {
          const bufPtr = view.getUint32(iovsPtr + i * 8, true);
          const bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
          const copyLen = Math.min(bufLen, remaining);
          mem.copyWithin(bufPtr, this.dataArea + srcOff, this.dataArea + srcOff + copyLen);
          srcOff += copyLen;
          remaining -= copyLen;
        }
        view.setUint32(nreadOut, result, true);
        return WASI_ESUCCESS;
      }
      fd_pwrite(fd, iovsPtr, iovsLen, offset, nwrittenOut) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        let totalLen = 0;
        for (let i = 0; i < iovsLen; i++) {
          const bufPtr = view.getUint32(iovsPtr + i * 8, true);
          const bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
          const copyLen = Math.min(bufLen, CH_DATA_SIZE - 256 - totalLen);
          mem.copyWithin(this.dataArea + totalLen, bufPtr, bufPtr + copyLen);
          totalLen += copyLen;
        }
        const { result, errno } = this.doSyscall(
          SYS_PWRITE,
          fd,
          this.dataArea,
          totalLen,
          Number(offset & 0xFFFFFFFFn),
          Number(offset >> 32n & 0xFFFFFFFFn)
        );
        if (errno) return translateLinuxErrno(errno);
        view.setUint32(nwrittenOut, result, true);
        return WASI_ESUCCESS;
      }
      fd_seek(fd, offset, whence, newOffsetOut) {
        const posixWhence = wasiWhenceToPosix(whence);
        const offsetNum = Number(offset);
        const { result, errno } = this.doSyscall(SYS_LSEEK, fd, offsetNum, posixWhence);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        view.setBigUint64(newOffsetOut, BigInt(result), true);
        return WASI_ESUCCESS;
      }
      fd_tell(fd, offsetOut) {
        const { result, errno } = this.doSyscall(SYS_LSEEK, fd, 0, SEEK_CUR);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        view.setBigUint64(offsetOut, BigInt(result), true);
        return WASI_ESUCCESS;
      }
      fd_sync(fd) {
        const { errno } = this.doSyscall(SYS_FSYNC, fd);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      fd_datasync(fd) {
        const { errno } = this.doSyscall(SYS_FDATASYNC, fd);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      fd_fdstat_get(fd, fdstatPtr) {
        const view = new DataView(this.memory.buffer);
        const { errno: statErr } = this.doSyscall(SYS_FSTAT, fd, this.dataArea);
        if (statErr) return translateLinuxErrno(statErr);
        const mode = view.getUint32(this.dataArea + 16, true);
        const filetype = modeToFiletype(mode);
        const { result: flags, errno: fcntlErr } = this.doSyscall(SYS_FCNTL, fd, F_GETFL);
        const fdflags = fcntlErr ? 0 : posixFlagToWasiFdflags(flags);
        view.setUint8(fdstatPtr, filetype);
        view.setUint8(fdstatPtr + 1, 0);
        view.setUint16(fdstatPtr + 2, fdflags, true);
        view.setUint32(fdstatPtr + 4, 0, true);
        view.setBigUint64(fdstatPtr + 8, WASI_RIGHTS_ALL, true);
        view.setBigUint64(fdstatPtr + 16, WASI_RIGHTS_ALL, true);
        return WASI_ESUCCESS;
      }
      fd_fdstat_set_flags(fd, fdflags) {
        let posixFlags = 0;
        if (fdflags & WASI_FDFLAG_APPEND) posixFlags |= O_APPEND;
        if (fdflags & WASI_FDFLAG_NONBLOCK) posixFlags |= O_NONBLOCK;
        const { errno } = this.doSyscall(SYS_FCNTL, fd, F_SETFL, posixFlags);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      fd_fdstat_set_rights() {
        return WASI_ESUCCESS;
      }
      fd_filestat_get(fd, filestatPtr) {
        const { errno } = this.doSyscall(SYS_FSTAT, fd, this.dataArea);
        if (errno) return translateLinuxErrno(errno);
        this.translateStat(0, filestatPtr);
        return WASI_ESUCCESS;
      }
      fd_filestat_set_size(fd, size) {
        const { errno } = this.doSyscall(SYS_FTRUNCATE, fd, Number(size));
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      fd_filestat_set_times(fd, atim, mtim, fstFlags) {
        const UTIME_NOW = 1073741823;
        const UTIME_OMIT = 1073741822;
        const view = new DataView(this.memory.buffer);
        const tsAddr = this.dataArea;
        if (fstFlags & 2) {
          view.setBigInt64(tsAddr + 0, 0n, true);
          view.setBigInt64(tsAddr + 8, BigInt(UTIME_NOW), true);
        } else if (fstFlags & 1) {
          view.setBigInt64(tsAddr + 0, atim / 1000000000n, true);
          view.setBigInt64(tsAddr + 8, atim % 1000000000n, true);
        } else {
          view.setBigInt64(tsAddr + 0, 0n, true);
          view.setBigInt64(tsAddr + 8, BigInt(UTIME_OMIT), true);
        }
        if (fstFlags & 8) {
          view.setBigInt64(tsAddr + 16, 0n, true);
          view.setBigInt64(tsAddr + 24, BigInt(UTIME_NOW), true);
        } else if (fstFlags & 4) {
          view.setBigInt64(tsAddr + 16, mtim / 1000000000n, true);
          view.setBigInt64(tsAddr + 24, mtim % 1000000000n, true);
        } else {
          view.setBigInt64(tsAddr + 16, 0n, true);
          view.setBigInt64(tsAddr + 24, BigInt(UTIME_OMIT), true);
        }
        const emptyPathAddr = tsAddr + 32;
        view.setUint8(emptyPathAddr, 0);
        const { errno } = this.doSyscall(SYS_UTIMENSAT, fd, emptyPathAddr, tsAddr, 0);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      fd_allocate(fd, offset, len) {
        const { errno } = this.doSyscall(
          SYS_FALLOCATE,
          fd,
          Number(offset),
          Number(len)
        );
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      fd_advise() {
        return WASI_ESUCCESS;
      }
      fd_readdir(fd, buf, bufLen, cookie, sizeOut) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        const maxRead = Math.min(CH_DATA_SIZE - 256, 32768);
        const { result: bytesRead, errno } = this.doSyscall(
          SYS_GETDENTS64,
          fd,
          this.dataArea,
          maxRead
        );
        if (errno) return translateLinuxErrno(errno);
        let srcOff = 0;
        let dstOff = 0;
        let entryIdx = BigInt(0);
        while (srcOff < bytesRead && dstOff < bufLen) {
          const entBase = this.dataArea + srcOff;
          const dIno = view.getBigUint64(entBase, true);
          const dReclen = view.getUint16(entBase + 16, true);
          const dType = view.getUint8(entBase + 18);
          let nameEnd = entBase + 19;
          while (nameEnd < entBase + dReclen && view.getUint8(nameEnd) !== 0) nameEnd++;
          const nameLen = nameEnd - (entBase + 19);
          entryIdx++;
          if (entryIdx <= cookie) {
            srcOff += dReclen;
            continue;
          }
          const headerSize = 24;
          if (dstOff + headerSize > bufLen) break;
          let wasiType = WASI_FILETYPE_UNKNOWN;
          switch (dType) {
            case 1:
              wasiType = WASI_FILETYPE_CHARACTER_DEVICE;
              break;
            // DT_CHR (mapped from FIFO, close enough)
            case 2:
              wasiType = WASI_FILETYPE_CHARACTER_DEVICE;
              break;
            // DT_CHR
            case 4:
              wasiType = WASI_FILETYPE_DIRECTORY;
              break;
            // DT_DIR
            case 6:
              wasiType = WASI_FILETYPE_BLOCK_DEVICE;
              break;
            // DT_BLK
            case 8:
              wasiType = WASI_FILETYPE_REGULAR_FILE;
              break;
            // DT_REG
            case 10:
              wasiType = WASI_FILETYPE_SYMBOLIC_LINK;
              break;
            // DT_LNK
            case 12:
              wasiType = WASI_FILETYPE_SOCKET_STREAM;
              break;
          }
          view.setBigUint64(buf + dstOff, entryIdx, true);
          view.setBigUint64(buf + dstOff + 8, dIno, true);
          view.setUint32(buf + dstOff + 16, nameLen, true);
          view.setUint8(buf + dstOff + 20, wasiType);
          view.setUint8(buf + dstOff + 21, 0);
          view.setUint8(buf + dstOff + 22, 0);
          view.setUint8(buf + dstOff + 23, 0);
          dstOff += headerSize;
          const copyNameLen = Math.min(nameLen, bufLen - dstOff);
          if (copyNameLen > 0) {
            mem.copyWithin(buf + dstOff, entBase + 19, entBase + 19 + copyNameLen);
            dstOff += copyNameLen;
          }
          srcOff += dReclen;
        }
        view.setUint32(sizeOut, dstOff, true);
        return WASI_ESUCCESS;
      }
      fd_renumber(from, to) {
        const { errno: dupErr } = this.doSyscall(SYS_DUP2, from, to);
        if (dupErr) return translateLinuxErrno(dupErr);
        if (from !== to) {
          const { errno: closeErr } = this.doSyscall(SYS_CLOSE, from);
          if (closeErr) return translateLinuxErrno(closeErr);
        }
        const preopenPath = this.preopens.get(from);
        if (preopenPath !== void 0) {
          this.preopens.delete(from);
          this.preopens.set(to, preopenPath);
        }
        return WASI_ESUCCESS;
      }
      // ---- Path operations ----
      path_create_directory(fd, pathPtr, pathLen) {
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, pathPtr, pathLen);
        const { errno } = this.doSyscall(SYS_MKDIRAT, kernelDirfd, pathAddr, 511);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      path_unlink_file(fd, pathPtr, pathLen) {
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, pathPtr, pathLen);
        const { errno } = this.doSyscall(SYS_UNLINKAT, kernelDirfd, pathAddr, 0);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      path_remove_directory(fd, pathPtr, pathLen) {
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, pathPtr, pathLen);
        const { errno } = this.doSyscall(SYS_UNLINKAT, kernelDirfd, pathAddr, AT_REMOVEDIR);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      path_rename(oldFd, oldPathPtr, oldPathLen, newFd, newPathPtr, newPathLen) {
        const { kernelDirfd: oldDirfd, pathAddr: oldAddr } = this.resolvePath(
          oldFd,
          oldPathPtr,
          oldPathLen,
          0
        );
        const { kernelDirfd: newDirfd, pathAddr: newAddr } = this.resolvePath(
          newFd,
          newPathPtr,
          newPathLen,
          4096
        );
        const { errno } = this.doSyscall(SYS_RENAMEAT, oldDirfd, oldAddr, newDirfd, newAddr);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      path_symlink(oldPathPtr, oldPathLen, fd, newPathPtr, newPathLen) {
        const targetBytes = new Uint8Array(this.memory.buffer, oldPathPtr, oldPathLen);
        const targetAddr = this.dataArea;
        new Uint8Array(this.memory.buffer, targetAddr, oldPathLen + 1).set(targetBytes);
        new DataView(this.memory.buffer).setUint8(targetAddr + oldPathLen, 0);
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, newPathPtr, newPathLen, 4096);
        const { errno } = this.doSyscall(SYS_SYMLINKAT, targetAddr, kernelDirfd, pathAddr);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      path_readlink(fd, pathPtr, pathLen, buf, bufLen, sizeOut) {
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, pathPtr, pathLen);
        const resultAddr = this.dataArea + 4096;
        const maxLen = Math.min(bufLen, CH_DATA_SIZE - 4096 - 256);
        const { result, errno } = this.doSyscall(
          SYS_READLINKAT,
          kernelDirfd,
          pathAddr,
          resultAddr,
          maxLen
        );
        if (errno) return translateLinuxErrno(errno);
        new Uint8Array(this.memory.buffer).copyWithin(buf, resultAddr, resultAddr + result);
        new DataView(this.memory.buffer).setUint32(sizeOut, result, true);
        return WASI_ESUCCESS;
      }
      path_link(oldFd, _oldFlags, oldPathPtr, oldPathLen, newFd, newPathPtr, newPathLen) {
        const { kernelDirfd: oldDirfd, pathAddr: oldAddr } = this.resolvePath(
          oldFd,
          oldPathPtr,
          oldPathLen,
          0
        );
        const { kernelDirfd: newDirfd, pathAddr: newAddr } = this.resolvePath(
          newFd,
          newPathPtr,
          newPathLen,
          4096
        );
        const { errno } = this.doSyscall(SYS_LINKAT, oldDirfd, oldAddr, newDirfd, newAddr, 0);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      path_open(dirfd, _lookupFlags, pathPtr, pathLen, oflags, _rightsBase, _rightsInheriting, fdflags, fdOut) {
        const { kernelDirfd, pathAddr } = this.resolvePath(dirfd, pathPtr, pathLen);
        let posixFlags = wasiOflagsToPosix(oflags, fdflags);
        if (oflags & WASI_O_DIRECTORY) {
          posixFlags |= O_RDONLY;
        } else if (posixFlags & (O_CREAT | O_TRUNC)) {
          posixFlags |= O_RDWR;
        } else {
          posixFlags |= O_RDWR;
        }
        const { result, errno } = this.doSyscall(
          SYS_OPENAT,
          kernelDirfd,
          pathAddr,
          posixFlags,
          438
        );
        if (errno) {
          if ((errno === 21 || errno === 13) && !(posixFlags & O_CREAT)) {
            posixFlags = posixFlags & ~3 | O_RDONLY;
            const retry = this.doSyscall(SYS_OPENAT, kernelDirfd, pathAddr, posixFlags, 438);
            if (retry.errno) return translateLinuxErrno(retry.errno);
            new DataView(this.memory.buffer).setUint32(fdOut, retry.result, true);
            return WASI_ESUCCESS;
          }
          return translateLinuxErrno(errno);
        }
        new DataView(this.memory.buffer).setUint32(fdOut, result, true);
        return WASI_ESUCCESS;
      }
      path_filestat_get(fd, _flags, pathPtr, pathLen, filestatPtr) {
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, pathPtr, pathLen);
        const statBufOffset = 4096;
        const { errno } = this.doSyscall(
          SYS_FSTATAT,
          kernelDirfd,
          pathAddr,
          this.dataArea + statBufOffset,
          0
        );
        if (errno) return translateLinuxErrno(errno);
        this.translateStat(statBufOffset, filestatPtr);
        return WASI_ESUCCESS;
      }
      path_filestat_set_times(fd, _flags, pathPtr, pathLen, atim, mtim, fstFlags) {
        const { kernelDirfd, pathAddr } = this.resolvePath(fd, pathPtr, pathLen, 4096);
        const UTIME_NOW = 1073741823;
        const UTIME_OMIT = 1073741822;
        const view = new DataView(this.memory.buffer);
        const tsAddr = this.dataArea;
        if (fstFlags & 2) {
          view.setBigInt64(tsAddr + 0, 0n, true);
          view.setBigInt64(tsAddr + 8, BigInt(UTIME_NOW), true);
        } else if (fstFlags & 1) {
          view.setBigInt64(tsAddr + 0, atim / 1000000000n, true);
          view.setBigInt64(tsAddr + 8, atim % 1000000000n, true);
        } else {
          view.setBigInt64(tsAddr + 0, 0n, true);
          view.setBigInt64(tsAddr + 8, BigInt(UTIME_OMIT), true);
        }
        if (fstFlags & 8) {
          view.setBigInt64(tsAddr + 16, 0n, true);
          view.setBigInt64(tsAddr + 24, BigInt(UTIME_NOW), true);
        } else if (fstFlags & 4) {
          view.setBigInt64(tsAddr + 16, mtim / 1000000000n, true);
          view.setBigInt64(tsAddr + 24, mtim % 1000000000n, true);
        } else {
          view.setBigInt64(tsAddr + 16, 0n, true);
          view.setBigInt64(tsAddr + 24, BigInt(UTIME_OMIT), true);
        }
        const { errno } = this.doSyscall(SYS_UTIMENSAT, kernelDirfd, pathAddr, tsAddr, 0);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      // ---- Random/Clock/Process ----
      random_get(buf, bufLen) {
        let offset = 0;
        while (offset < bufLen) {
          const chunkSize = Math.min(bufLen - offset, CH_DATA_SIZE - 256);
          const { result, errno } = this.doSyscall(
            SYS_GETRANDOM,
            this.dataArea,
            chunkSize,
            0
          );
          if (errno) return translateLinuxErrno(errno);
          new Uint8Array(this.memory.buffer).copyWithin(
            buf + offset,
            this.dataArea,
            this.dataArea + result
          );
          offset += result;
        }
        return WASI_ESUCCESS;
      }
      clock_time_get(clockId, _precision, timeOut) {
        const posixClock = wasiClockToPosix(clockId);
        const { errno } = this.doSyscall(SYS_CLOCK_GETTIME, posixClock, this.dataArea);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        const sec = view.getBigInt64(this.dataArea, true);
        const nsec = view.getBigInt64(this.dataArea + 8, true);
        view.setBigUint64(timeOut, BigInt(sec) * 1000000000n + BigInt(nsec), true);
        return WASI_ESUCCESS;
      }
      clock_res_get(clockId, resOut) {
        const posixClock = wasiClockToPosix(clockId);
        const { errno } = this.doSyscall(SYS_CLOCK_GETRES, posixClock, this.dataArea);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        const sec = view.getBigInt64(this.dataArea, true);
        const nsec = view.getBigInt64(this.dataArea + 8, true);
        view.setBigUint64(resOut, BigInt(sec) * 1000000000n + BigInt(nsec), true);
        return WASI_ESUCCESS;
      }
      proc_exit(code) {
        this.doSyscall(SYS_EXIT, code);
        throw new WasiExit(code);
      }
      proc_raise(sig) {
        const { result: pid } = this.doSyscall(SYS_GETPID);
        const { errno } = this.doSyscall(SYS_KILL, pid, sig);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      sched_yield() {
        this.doSyscall(SYS_SCHED_YIELD);
        return WASI_ESUCCESS;
      }
      // ---- poll_oneoff ----
      poll_oneoff(inPtr, outPtr, nsubscriptions, neventsOut) {
        const view = new DataView(this.memory.buffer);
        if (nsubscriptions === 0) {
          view.setUint32(neventsOut, 0, true);
          return WASI_ESUCCESS;
        }
        let hasClockSub = false;
        let hasFdSub = false;
        for (let i = 0; i < nsubscriptions; i++) {
          const tag = view.getUint8(inPtr + i * 48 + 8);
          if (tag === WASI_EVENTTYPE_CLOCK) hasClockSub = true;
          else hasFdSub = true;
        }
        if (hasClockSub && !hasFdSub && nsubscriptions === 1) {
          const subBase = inPtr;
          const userdata = view.getBigUint64(subBase, true);
          const timeout = view.getBigUint64(subBase + 16 + 8, true);
          const flags = view.getUint16(subBase + 16 + 24, true);
          let timeoutMs;
          if (flags & 1) {
            const { errno: errno2 } = this.doSyscall(SYS_CLOCK_GETTIME, CLOCK_REALTIME, this.dataArea);
            if (errno2) return translateLinuxErrno(errno2);
            const nowSec = view.getBigInt64(this.dataArea, true);
            const nowNsec = view.getBigInt64(this.dataArea + 8, true);
            const nowNs = nowSec * 1000000000n + nowNsec;
            const deltaNs = BigInt(timeout) - nowNs;
            timeoutMs = deltaNs > 0n ? Number(deltaNs / 1000000n) : 0;
          } else {
            timeoutMs = Number(timeout / 1000000n);
          }
          if (timeoutMs > 0) {
            this.doSyscall(SYS_POLL, 0, 0, timeoutMs);
          }
          view.setBigUint64(outPtr, userdata, true);
          view.setUint16(outPtr + 8, 0, true);
          view.setUint8(outPtr + 10, WASI_EVENTTYPE_CLOCK);
          for (let i = 11; i < 32; i++) view.setUint8(outPtr + i, 0);
          view.setUint32(neventsOut, 1, true);
          return WASI_ESUCCESS;
        }
        const pollfds = [];
        let clockTimeoutMs = -1;
        let clockUserdata = 0n;
        for (let i = 0; i < nsubscriptions; i++) {
          const subBase = inPtr + i * 48;
          const userdata = view.getBigUint64(subBase, true);
          const tag = view.getUint8(subBase + 8);
          if (tag === WASI_EVENTTYPE_CLOCK) {
            const timeout = view.getBigUint64(subBase + 16 + 8, true);
            const ms = Number(timeout / 1000000n);
            if (clockTimeoutMs < 0 || ms < clockTimeoutMs) {
              clockTimeoutMs = ms;
              clockUserdata = userdata;
            }
          } else {
            const fd = view.getUint32(subBase + 16, true);
            const events = tag === WASI_EVENTTYPE_FD_READ ? POLLIN : POLLOUT;
            pollfds.push({ fd, events, idx: i, userdata, type: tag });
          }
        }
        const pollfdAddr = this.dataArea;
        for (let i = 0; i < pollfds.length; i++) {
          view.setInt32(pollfdAddr + i * 8, pollfds[i].fd, true);
          view.setInt16(pollfdAddr + i * 8 + 4, pollfds[i].events, true);
          view.setInt16(pollfdAddr + i * 8 + 6, 0, true);
        }
        const { errno } = this.doSyscall(
          SYS_POLL,
          pollfdAddr,
          pollfds.length,
          clockTimeoutMs >= 0 ? clockTimeoutMs : -1
        );
        if (errno && errno !== 4) return translateLinuxErrno(errno);
        let nevents = 0;
        for (let i = 0; i < pollfds.length; i++) {
          const revents = view.getInt16(pollfdAddr + i * 8 + 6, true);
          if (revents) {
            const evBase = outPtr + nevents * 32;
            view.setBigUint64(evBase, pollfds[i].userdata, true);
            const wasiErr = revents & POLLERR ? WASI_EIO : WASI_ESUCCESS;
            view.setUint16(evBase + 8, wasiErr, true);
            view.setUint8(evBase + 10, pollfds[i].type);
            for (let j = 11; j < 32; j++) view.setUint8(evBase + j, 0);
            view.setBigUint64(evBase + 16, 1n, true);
            nevents++;
          }
        }
        if (nevents === 0 && clockTimeoutMs >= 0) {
          const evBase = outPtr;
          view.setBigUint64(evBase, clockUserdata, true);
          view.setUint16(evBase + 8, 0, true);
          view.setUint8(evBase + 10, WASI_EVENTTYPE_CLOCK);
          for (let i = 11; i < 32; i++) view.setUint8(evBase + i, 0);
          nevents = 1;
        }
        view.setUint32(neventsOut, nevents, true);
        return WASI_ESUCCESS;
      }
      // ---- Socket operations ----
      sock_recv(fd, iovsPtr, iovsLen, _riFlags, roDataLenOut, roFlagsOut) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        let totalLen = 0;
        for (let i = 0; i < iovsLen; i++) {
          totalLen += view.getUint32(iovsPtr + i * 8 + 4, true);
        }
        totalLen = Math.min(totalLen, CH_DATA_SIZE - 256);
        const { result, errno } = this.doSyscall(
          SYS_RECVFROM,
          fd,
          this.dataArea,
          totalLen,
          0,
          0,
          0
        );
        if (errno) return translateLinuxErrno(errno);
        let remaining = result;
        let srcOff = 0;
        for (let i = 0; i < iovsLen && remaining > 0; i++) {
          const bufPtr = view.getUint32(iovsPtr + i * 8, true);
          const bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
          const copyLen = Math.min(bufLen, remaining);
          mem.copyWithin(bufPtr, this.dataArea + srcOff, this.dataArea + srcOff + copyLen);
          srcOff += copyLen;
          remaining -= copyLen;
        }
        view.setUint32(roDataLenOut, result, true);
        view.setUint16(roFlagsOut, 0, true);
        return WASI_ESUCCESS;
      }
      sock_send(fd, iovsPtr, iovsLen, _siFlags, nwrittenOut) {
        const view = new DataView(this.memory.buffer);
        const mem = new Uint8Array(this.memory.buffer);
        let totalLen = 0;
        for (let i = 0; i < iovsLen; i++) {
          const bufPtr = view.getUint32(iovsPtr + i * 8, true);
          const bufLen = view.getUint32(iovsPtr + i * 8 + 4, true);
          const copyLen = Math.min(bufLen, CH_DATA_SIZE - 256 - totalLen);
          mem.copyWithin(this.dataArea + totalLen, bufPtr, bufPtr + copyLen);
          totalLen += copyLen;
        }
        const { result, errno } = this.doSyscall(
          SYS_SENDTO,
          fd,
          this.dataArea,
          totalLen,
          0,
          0,
          0
        );
        if (errno) return translateLinuxErrno(errno);
        view.setUint32(nwrittenOut, result, true);
        return WASI_ESUCCESS;
      }
      sock_shutdown(fd, how) {
        const { errno } = this.doSyscall(SYS_SHUTDOWN, fd, how);
        return errno ? translateLinuxErrno(errno) : WASI_ESUCCESS;
      }
      sock_accept(_fd, _flags, _fdOut) {
        return WASI_ENOSYS;
      }
    };
  }
});

// src/vfs/zip.ts
var zip_exports = {};
__export(zip_exports, {
  extractZipEntry: () => extractZipEntry,
  fetchZipCentralDirectory: () => fetchZipCentralDirectory,
  parseZipCentralDirectory: () => parseZipCentralDirectory
});
import { inflateSync } from "fflate";
function findEOCD(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const searchStart = Math.max(0, data.length - EOCD_MAX_SEARCH);
  for (let i = data.length - EOCD_MIN_SIZE; i >= searchStart; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      return i;
    }
  }
  throw new Error("Zip EOCD record not found");
}
function parseZipCentralDirectory(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const eocdOffset = findEOCD(data);
  const cdEntryCount = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const entries = [];
  let offset = cdOffset;
  for (let i = 0; i < cdEntryCount; i++) {
    if (view.getUint32(offset, true) !== CENTRAL_DIR_SIGNATURE) {
      throw new Error(
        `Invalid central directory entry signature at offset ${offset}`
      );
    }
    const versionMadeBy = view.getUint16(offset + 4, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const externalAttrs = view.getUint32(offset + 38, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileNameBytes = data.subarray(
      offset + CENTRAL_DIR_FIXED_SIZE,
      offset + CENTRAL_DIR_FIXED_SIZE + fileNameLength
    );
    const fileName = new TextDecoder().decode(fileNameBytes);
    const creatorOS = versionMadeBy >> 8;
    let mode;
    if (creatorOS === CREATOR_UNIX) {
      const unixMode = externalAttrs >> 16 & 65535;
      mode = unixMode;
    } else {
      if (fileName.startsWith("bin/") || fileName.startsWith("sbin/") || fileName.includes("/bin/") || fileName.includes("/sbin/")) {
        mode = 493;
      } else {
        mode = 420;
      }
    }
    const isDirectory = fileName.endsWith("/");
    const isSymlink = creatorOS === CREATOR_UNIX && (mode & S_IFMT3) === S_IFLNK3;
    entries.push({
      fileName,
      compressedSize,
      uncompressedSize,
      compressionMethod,
      localHeaderOffset,
      mode,
      isDirectory,
      isSymlink,
      externalAttrs,
      creatorOS
    });
    offset += CENTRAL_DIR_FIXED_SIZE + fileNameLength + extraFieldLength + commentLength;
  }
  return entries;
}
function extractZipEntry(data, entry) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const localOffset = entry.localHeaderOffset;
  if (view.getUint32(localOffset, true) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error(
      `Invalid local file header signature at offset ${localOffset}`
    );
  }
  const localFileNameLength = view.getUint16(localOffset + 26, true);
  const localExtraLength = view.getUint16(localOffset + 28, true);
  const dataStart = localOffset + LOCAL_HEADER_FIXED_SIZE + localFileNameLength + localExtraLength;
  const compressedData = data.subarray(
    dataStart,
    dataStart + entry.compressedSize
  );
  if (entry.compressionMethod === COMPRESSION_STORE) {
    return new Uint8Array(compressedData);
  } else if (entry.compressionMethod === COMPRESSION_DEFLATE) {
    return inflateSync(compressedData);
  } else {
    throw new Error(
      `Unsupported compression method: ${entry.compressionMethod}`
    );
  }
}
async function fetchZipCentralDirectory(url) {
  const headResp = await fetch(url, { method: "HEAD" });
  if (!headResp.ok) {
    throw new Error(`HEAD request failed: ${headResp.status} ${headResp.statusText}`);
  }
  const contentLength = parseInt(headResp.headers.get("content-length") || "0", 10);
  const acceptRanges = headResp.headers.get("accept-ranges");
  if (!contentLength || acceptRanges !== "bytes") {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
    }
    const data = new Uint8Array(await resp.arrayBuffer());
    return { entries: parseZipCentralDirectory(data), totalSize: data.length };
  }
  const tailSize = Math.min(contentLength, EOCD_MAX_SEARCH);
  const tailStart = contentLength - tailSize;
  const tailResp = await fetch(url, {
    headers: { Range: `bytes=${tailStart}-${contentLength - 1}` }
  });
  if (tailResp.status !== 206) {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
    }
    const data = new Uint8Array(await resp.arrayBuffer());
    return { entries: parseZipCentralDirectory(data), totalSize: data.length };
  }
  const tailData = new Uint8Array(await tailResp.arrayBuffer());
  const tailView = new DataView(
    tailData.buffer,
    tailData.byteOffset,
    tailData.byteLength
  );
  const eocdOffsetInTail = findEOCD(tailData);
  const cdSize = tailView.getUint32(eocdOffsetInTail + 12, true);
  const cdOffset = tailView.getUint32(eocdOffsetInTail + 16, true);
  if (cdOffset >= tailStart) {
    const fullSize2 = contentLength;
    const buf2 = new Uint8Array(fullSize2);
    buf2.set(tailData, tailStart);
    return { entries: parseZipCentralDirectory(buf2), totalSize: fullSize2 };
  }
  const cdEnd = cdOffset + cdSize - 1;
  const cdResp = await fetch(url, {
    headers: { Range: `bytes=${cdOffset}-${cdEnd}` }
  });
  if (cdResp.status !== 206) {
    throw new Error(`Range request for CD failed: ${cdResp.status}`);
  }
  const cdData = new Uint8Array(await cdResp.arrayBuffer());
  const fullSize = contentLength;
  const buf = new Uint8Array(fullSize);
  buf.set(cdData, cdOffset);
  buf.set(tailData, tailStart);
  return { entries: parseZipCentralDirectory(buf), totalSize: fullSize };
}
var EOCD_SIGNATURE, CENTRAL_DIR_SIGNATURE, LOCAL_FILE_HEADER_SIGNATURE, EOCD_MAX_SEARCH, EOCD_MIN_SIZE, CENTRAL_DIR_FIXED_SIZE, LOCAL_HEADER_FIXED_SIZE, COMPRESSION_STORE, COMPRESSION_DEFLATE, CREATOR_UNIX, S_IFLNK3, S_IFMT3;
var init_zip = __esm({
  "src/vfs/zip.ts"() {
    "use strict";
    EOCD_SIGNATURE = 101010256;
    CENTRAL_DIR_SIGNATURE = 33639248;
    LOCAL_FILE_HEADER_SIGNATURE = 67324752;
    EOCD_MAX_SEARCH = 65557;
    EOCD_MIN_SIZE = 22;
    CENTRAL_DIR_FIXED_SIZE = 46;
    LOCAL_HEADER_FIXED_SIZE = 30;
    COMPRESSION_STORE = 0;
    COMPRESSION_DEFLATE = 8;
    CREATOR_UNIX = 3;
    S_IFLNK3 = 40960;
    S_IFMT3 = 61440;
  }
});

// src/shared-pipe-buffer.ts
var HEADER_SIZE = 16;
var HEAD_OFFSET = 0;
var TAIL_OFFSET = 1;
var LEN_OFFSET = 2;
var FLAGS_OFFSET = 3;
var FLAG_READ_OPEN = 1;
var FLAG_WRITE_OPEN = 2;
var SharedPipeBuffer = class _SharedPipeBuffer {
  meta;
  // View of header (4 x Int32)
  data;
  // View of ring buffer data
  cap;
  sab;
  constructor(sab, capacity) {
    this.sab = sab;
    this.cap = capacity;
    this.meta = new Int32Array(sab, 0, 4);
    this.data = new Uint8Array(sab, HEADER_SIZE, capacity);
  }
  static create(capacity = 65536) {
    const sab = new SharedArrayBuffer(HEADER_SIZE + capacity);
    const pipe = new _SharedPipeBuffer(sab, capacity);
    Atomics.store(pipe.meta, HEAD_OFFSET, 0);
    Atomics.store(pipe.meta, TAIL_OFFSET, 0);
    Atomics.store(pipe.meta, LEN_OFFSET, 0);
    Atomics.store(pipe.meta, FLAGS_OFFSET, FLAG_READ_OPEN | FLAG_WRITE_OPEN);
    return pipe;
  }
  static fromSharedBuffer(sab) {
    const capacity = sab.byteLength - HEADER_SIZE;
    return new _SharedPipeBuffer(sab, capacity);
  }
  getBuffer() {
    return this.sab;
  }
  capacity() {
    return this.cap;
  }
  available() {
    return Atomics.load(this.meta, LEN_OFFSET);
  }
  isReadOpen() {
    return (Atomics.load(this.meta, FLAGS_OFFSET) & FLAG_READ_OPEN) !== 0;
  }
  isWriteOpen() {
    return (Atomics.load(this.meta, FLAGS_OFFSET) & FLAG_WRITE_OPEN) !== 0;
  }
  write(src) {
    const len = Atomics.load(this.meta, LEN_OFFSET);
    const free = this.cap - len;
    const n = Math.min(src.length, free);
    if (n === 0) return 0;
    let tail = Atomics.load(this.meta, TAIL_OFFSET);
    for (let i = 0; i < n; i++) {
      this.data[tail] = src[i];
      tail = (tail + 1) % this.cap;
    }
    Atomics.store(this.meta, TAIL_OFFSET, tail);
    Atomics.add(this.meta, LEN_OFFSET, n);
    return n;
  }
  read(dst) {
    const len = Atomics.load(this.meta, LEN_OFFSET);
    const n = Math.min(dst.length, len);
    if (n === 0) return 0;
    let head = Atomics.load(this.meta, HEAD_OFFSET);
    for (let i = 0; i < n; i++) {
      dst[i] = this.data[head];
      head = (head + 1) % this.cap;
    }
    Atomics.store(this.meta, HEAD_OFFSET, head);
    Atomics.sub(this.meta, LEN_OFFSET, n);
    return n;
  }
  closeRead() {
    Atomics.and(this.meta, FLAGS_OFFSET, ~FLAG_READ_OPEN);
  }
  closeWrite() {
    Atomics.and(this.meta, FLAGS_OFFSET, ~FLAG_WRITE_OPEN);
  }
};

// src/shared-lock-table.ts
var HEADER_INTS = 4;
var HEADER_BYTES = HEADER_INTS * 4;
var ENTRY_INTS = 8;
var SPINLOCK = 0;
var COUNT = 1;
var CAPACITY = 2;
var WAKE_COUNTER = 3;
var E_PATH_HASH = 0;
var E_PID = 1;
var E_LOCK_TYPE = 2;
var E_START_LO = 4;
var E_START_HI = 5;
var E_LEN_LO = 6;
var E_LEN_HI = 7;
var F_RDLCK = 0;
var F_UNLCK = 2;
var SharedLockTable = class _SharedLockTable {
  view;
  sab;
  constructor(sab) {
    this.sab = sab;
    this.view = new Int32Array(sab);
  }
  static create(capacity = 256) {
    const byteLen = HEADER_BYTES + capacity * ENTRY_INTS * 4;
    const sab = new SharedArrayBuffer(byteLen);
    const table = new _SharedLockTable(sab);
    Atomics.store(table.view, SPINLOCK, 0);
    Atomics.store(table.view, COUNT, 0);
    Atomics.store(table.view, CAPACITY, capacity);
    Atomics.store(table.view, WAKE_COUNTER, 0);
    return table;
  }
  static fromBuffer(sab) {
    return new _SharedLockTable(sab);
  }
  getBuffer() {
    return this.sab;
  }
  // --- Spinlock ---
  acquire() {
    while (Atomics.compareExchange(this.view, SPINLOCK, 0, 1) !== 0) {
      Atomics.wait(this.view, SPINLOCK, 1, 1);
    }
  }
  release() {
    Atomics.store(this.view, SPINLOCK, 0);
    Atomics.notify(this.view, SPINLOCK, 1);
  }
  // --- Entry helpers (must hold spinlock) ---
  entryBase(index) {
    return HEADER_INTS + index * ENTRY_INTS;
  }
  readEntry(index) {
    const base = this.entryBase(index);
    return {
      pathHash: this.view[base + E_PATH_HASH],
      pid: this.view[base + E_PID],
      lockType: this.view[base + E_LOCK_TYPE],
      start: this.i64FromParts(
        this.view[base + E_START_LO],
        this.view[base + E_START_HI]
      ),
      len: this.i64FromParts(
        this.view[base + E_LEN_LO],
        this.view[base + E_LEN_HI]
      )
    };
  }
  writeEntry(index, entry) {
    const base = this.entryBase(index);
    this.view[base + E_PATH_HASH] = entry.pathHash;
    this.view[base + E_PID] = entry.pid;
    this.view[base + E_LOCK_TYPE] = entry.lockType;
    this.view[base + 3] = 0;
    const [sLo, sHi] = this.i64ToParts(entry.start);
    this.view[base + E_START_LO] = sLo;
    this.view[base + E_START_HI] = sHi;
    const [lLo, lHi] = this.i64ToParts(entry.len);
    this.view[base + E_LEN_LO] = lLo;
    this.view[base + E_LEN_HI] = lHi;
  }
  removeEntryUnsafe(index) {
    const count = this.view[COUNT];
    if (index < count - 1) {
      const lastBase = this.entryBase(count - 1);
      const base = this.entryBase(index);
      for (let i = 0; i < ENTRY_INTS; i++) {
        this.view[base + i] = this.view[lastBase + i];
      }
    }
    this.view[COUNT] = count - 1;
  }
  // --- i64 helpers ---
  i64FromParts(lo, hi) {
    return BigInt(hi) << 32n | BigInt(lo >>> 0);
  }
  i64ToParts(val) {
    const lo = Number(val & 0xffffffffn);
    const hi = Number(val >> 32n & 0xffffffffn);
    return [lo, hi];
  }
  // --- Range overlap (matches lock.rs logic) ---
  static rangesOverlap(s1, l1, s2, l2) {
    const e1 = l1 === 0n ? BigInt("0x7fffffffffffffff") : s1 + l1;
    const e2 = l2 === 0n ? BigInt("0x7fffffffffffffff") : s2 + l2;
    return s1 < e2 && s2 < e1;
  }
  // --- Conflict detection (matches lock.rs FileLock::conflicts_with) ---
  static conflicts(existing, lockType, start, len, pid) {
    if (existing.pid === pid) return false;
    if (!_SharedLockTable.rangesOverlap(existing.start, existing.len, start, len))
      return false;
    if (existing.lockType === F_RDLCK && lockType === F_RDLCK) return false;
    return true;
  }
  // --- Core API ---
  /**
   * Check if a lock would be blocked. Returns the blocking lock info, or null.
   * (Used for F_GETLK and for F_SETLK conflict check.)
   */
  getBlockingLock(pathHash, lockType, start, len, pid) {
    this.acquire();
    try {
      return this._getBlockingLockUnsafe(pathHash, lockType, start, len, pid);
    } finally {
      this.release();
    }
  }
  _getBlockingLockUnsafe(pathHash, lockType, start, len, pid) {
    const count = this.view[COUNT];
    for (let i = 0; i < count; i++) {
      const entry = this.readEntry(i);
      if (entry.pathHash !== pathHash) continue;
      if (_SharedLockTable.conflicts(entry, lockType, start, len, pid)) {
        return entry;
      }
    }
    return null;
  }
  /**
   * Set a lock (non-blocking). For F_UNLCK, removes matching locks.
   * Returns true on success, false if conflicting lock exists (EAGAIN).
   */
  setLock(pathHash, pid, lockType, start, len) {
    this.acquire();
    try {
      return this._setLockUnsafe(pathHash, pid, lockType, start, len);
    } finally {
      this.release();
    }
  }
  _setLockUnsafe(pathHash, pid, lockType, start, len) {
    if (lockType === F_UNLCK) {
      let i2 = 0;
      while (i2 < this.view[COUNT]) {
        const entry = this.readEntry(i2);
        if (entry.pathHash === pathHash && entry.pid === pid && _SharedLockTable.rangesOverlap(entry.start, entry.len, start, len)) {
          this.removeEntryUnsafe(i2);
        } else {
          i2++;
        }
      }
      Atomics.add(this.view, WAKE_COUNTER, 1);
      Atomics.notify(this.view, WAKE_COUNTER);
      return true;
    }
    if (this._getBlockingLockUnsafe(pathHash, lockType, start, len, pid)) {
      return false;
    }
    let i = 0;
    while (i < this.view[COUNT]) {
      const entry = this.readEntry(i);
      if (entry.pathHash === pathHash && entry.pid === pid && _SharedLockTable.rangesOverlap(entry.start, entry.len, start, len)) {
        this.removeEntryUnsafe(i);
      } else {
        i++;
      }
    }
    const count = this.view[COUNT];
    const capacity = this.view[CAPACITY];
    if (count >= capacity) {
      return false;
    }
    this.writeEntry(count, { pathHash, pid, lockType, start, len });
    this.view[COUNT] = count + 1;
    return true;
  }
  /**
   * Set a lock, blocking until it can be acquired (F_SETLKW).
   * Uses Atomics.wait on wake_counter to sleep between retries.
   */
  setLockWait(pathHash, pid, lockType, start, len) {
    while (true) {
      this.acquire();
      const blocker = this._getBlockingLockUnsafe(
        pathHash,
        lockType,
        start,
        len,
        pid
      );
      if (!blocker) {
        this._setLockUnsafe(pathHash, pid, lockType, start, len);
        this.release();
        return;
      }
      const wakeCount = Atomics.load(this.view, WAKE_COUNTER);
      this.release();
      Atomics.wait(this.view, WAKE_COUNTER, wakeCount, 5e3);
    }
  }
  /**
   * Remove all locks held by a given pid (cleanup on process exit).
   */
  removeLocksByPid(pid) {
    this.acquire();
    try {
      let i = 0;
      while (i < this.view[COUNT]) {
        const entry = this.readEntry(i);
        if (entry.pid === pid) {
          this.removeEntryUnsafe(i);
        } else {
          i++;
        }
      }
      Atomics.add(this.view, WAKE_COUNTER, 1);
      Atomics.notify(this.view, WAKE_COUNTER);
    } finally {
      this.release();
    }
  }
  /**
   * FNV-1a hash of a string, returning a signed i32.
   */
  static hashPath(path) {
    let hash = 2166136261;
    for (let i = 0; i < path.length; i++) {
      hash ^= path.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash | 0;
  }
};

// src/framebuffer/registry.ts
var FramebufferRegistry = class {
  bindings = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  writeListeners = /* @__PURE__ */ new Set();
  bind(b) {
    const isWriteBased = b.addr === 0 && b.len === 0;
    const hostBuffer = isWriteBased ? new Uint8ClampedArray(new ArrayBuffer(b.h * b.stride)) : null;
    this.bindings.set(b.pid, {
      ...b,
      view: null,
      imageData: null,
      hostBuffer
    });
    for (const l of this.listeners) l(b.pid, "bind");
  }
  unbind(pid) {
    if (!this.bindings.has(pid)) return;
    this.bindings.delete(pid);
    for (const l of this.listeners) l(pid, "unbind");
  }
  get(pid) {
    return this.bindings.get(pid);
  }
  /**
   * Drop cached view + ImageData for `pid`. Renderers must re-build them
   * from the (possibly new) process Memory SAB on the next frame. Call
   * after `WebAssembly.Memory.grow()` invalidates the prior buffer ref.
   * No-op for write-based bindings (the host buffer doesn't move).
   */
  rebindMemory(pid) {
    const b = this.bindings.get(pid);
    if (!b || b.hostBuffer) return;
    b.view = null;
    b.imageData = null;
  }
  /**
   * Push pixel bytes from the kernel into a write-based binding's
   * host buffer at the given byte offset. No-op (or out-of-range
   * clamp) if the binding is mmap-based or doesn't exist.
   *
   * Also fires `onWrite` listeners (used by browser hosts to forward
   * the bytes to a main-thread mirror registry).
   */
  fbWrite(pid, offset, bytes) {
    const b = this.bindings.get(pid);
    if (b?.hostBuffer) {
      const end = Math.min(offset + bytes.length, b.hostBuffer.length);
      if (end > offset) {
        b.hostBuffer.set(bytes.subarray(0, end - offset), offset);
      }
    }
    for (const l of this.writeListeners) l(pid, offset, bytes);
  }
  /**
   * Subscribe to write-based pixel pushes. Returns an unsubscribe
   * function. Used by the browser kernel-worker to forward writes to
   * the main-thread registry.
   */
  onWrite(fn) {
    this.writeListeners.add(fn);
    return () => {
      this.writeListeners.delete(fn);
    };
  }
  list() {
    return [...this.bindings.values()];
  }
  onChange(fn) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
};

// src/kernel.ts
function negErrno(err) {
  if (err && typeof err === "object" && "code" in err) {
    const code = err.code;
    if (typeof code === "number" && code !== 0) {
      return code < 0 ? code : -code;
    }
    switch (code) {
      case "ENOENT":
        return -2;
      case "EACCES":
        return -13;
      case "EPERM":
        return -1;
      case "EEXIST":
        return -17;
      case "ENOTDIR":
        return -20;
      case "EISDIR":
        return -21;
      case "EINVAL":
        return -22;
      case "ENOSPC":
        return -28;
      case "EROFS":
        return -30;
      case "ENOTEMPTY":
        return -39;
      case "ELOOP":
        return -40;
      case "ENAMETOOLONG":
        return -36;
      case "EBADF":
        return -9;
      case "EMFILE":
        return -24;
      case "ENFILE":
        return -23;
      case "EBUSY":
        return -16;
      case "EXDEV":
        return -18;
      case "ENODEV":
        return -19;
      case "EFAULT":
        return -14;
      case "ETXTBSY":
        return -26;
    }
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (msg.startsWith("ENOENT")) return -2;
    if (msg.startsWith("EACCES")) return -13;
    if (msg.startsWith("EPERM")) return -1;
    if (msg.startsWith("EEXIST")) return -17;
    if (msg.startsWith("ENOTDIR")) return -20;
    if (msg.startsWith("EISDIR")) return -21;
    if (msg.startsWith("EINVAL")) return -22;
    if (msg.startsWith("ENOSPC")) return -28;
    if (msg.startsWith("ENOTEMPTY")) return -39;
    if (msg.startsWith("EBADF")) return -9;
    if (msg.startsWith("ENOSYS")) return -38;
    if (msg.startsWith("ENXIO")) return -6;
    if (msg.startsWith("EXDEV")) return -18;
  }
  return -5;
}
var WASM_STAT_SIZE = 88;
var WasmPosixKernel = class _WasmPosixKernel {
  config;
  io;
  callbacks;
  instance = null;
  memory = null;
  sharedPipes = /* @__PURE__ */ new Map();
  signalWakeSab = null;
  sharedLockTable = null;
  programFuncTable = null;
  forkSab = null;
  waitpidSab = null;
  isThreadWorker = false;
  /** PID for this kernel instance (set by the worker) */
  pid = 0;
  /**
   * Live `/dev/fb0` mappings the kernel has reported via
   * `host_bind_framebuffer`. Renderers (canvas in browser, no-op in
   * Node) read this on each frame.
   */
  framebuffers = new FramebufferRegistry();
  /**
   * Merge additional callbacks into the existing set.
   * Existing callbacks not specified in the argument are preserved.
   */
  mergeCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  /**
   * Set the user program's indirect function table so signal handlers
   * registered by the program can be called from the kernel.
   */
  setProgramFuncTable(table) {
    this.programFuncTable = table;
  }
  constructor(config, io, callbacks) {
    this.config = config;
    this.io = io;
    this.callbacks = callbacks ?? {};
  }
  registerSharedPipe(handle, sab, end) {
    this.sharedPipes.set(handle, { pipe: SharedPipeBuffer.fromSharedBuffer(sab), end });
  }
  unregisterSharedPipe(handle) {
    this.sharedPipes.delete(handle);
  }
  /** Returns all registered shared pipes (for transferring during exec). */
  getSharedPipes() {
    return this.sharedPipes;
  }
  registerSignalWakeSab(sab) {
    this.signalWakeSab = sab;
  }
  registerSharedLockTable(sab) {
    this.sharedLockTable = SharedLockTable.fromBuffer(sab);
  }
  registerForkSab(sab) {
    this.forkSab = sab;
  }
  registerWaitpidSab(sab) {
    this.waitpidSab = sab;
  }
  /**
   * Load and instantiate the kernel Wasm module.
   *
   * @param wasmBytes - The compiled kernel Wasm binary
   */
  async init(wasmBytes) {
    const memory = new WebAssembly.Memory({
      initial: 17n,
      maximum: 16384n,
      shared: true,
      address: "i64"
    });
    this.memory = memory;
    const importObject = this.buildImportObject(memory);
    const module = await WebAssembly.compile(wasmBytes);
    this.instance = await WebAssembly.instantiate(module, importObject);
  }
  /**
   * Like init(), but uses an existing shared WebAssembly.Memory instead of
   * creating a new one. Used by thread workers that share the parent's memory.
   */
  async initWithMemory(wasmBytes, memory) {
    this.memory = memory;
    const importObject = this.buildImportObject(memory);
    const module = await WebAssembly.compile(wasmBytes);
    this.instance = await WebAssembly.instantiate(module, importObject);
  }
  buildImportObject(memory) {
    return {
      env: {
        memory,
        host_debug_log: (ptr, len) => {
          const buf = new Uint8Array(memory.buffer, Number(ptr), len);
          const msg = new TextDecoder().decode(buf.slice());
          console.log(`[KERNEL] ${msg}`);
        },
        host_open: (pathPtr, pathLen, flags, mode) => {
          return this.hostOpen(Number(pathPtr), pathLen, flags, mode);
        },
        host_close: (handle) => {
          return this.hostClose(handle);
        },
        host_read: (handle, bufPtr, bufLen) => {
          return this.hostRead(handle, Number(bufPtr), bufLen);
        },
        host_write: (handle, bufPtr, bufLen) => {
          return this.hostWrite(handle, Number(bufPtr), bufLen);
        },
        host_seek: (handle, offsetLo, offsetHi, whence) => {
          return this.hostSeek(handle, offsetLo, offsetHi, whence);
        },
        host_fstat: (handle, statPtr) => {
          return this.hostFstat(handle, Number(statPtr));
        },
        host_stat: (pathPtr, pathLen, statPtr) => {
          return this.hostStat(Number(pathPtr), pathLen, Number(statPtr));
        },
        host_lstat: (pathPtr, pathLen, statPtr) => {
          return this.hostLstat(Number(pathPtr), pathLen, Number(statPtr));
        },
        host_mkdir: (pathPtr, pathLen, mode) => {
          return this.hostMkdir(Number(pathPtr), pathLen, mode);
        },
        host_rmdir: (pathPtr, pathLen) => {
          return this.hostRmdir(Number(pathPtr), pathLen);
        },
        host_unlink: (pathPtr, pathLen) => {
          return this.hostUnlink(Number(pathPtr), pathLen);
        },
        host_rename: (oldPtr, oldLen, newPtr, newLen) => {
          return this.hostRename(Number(oldPtr), oldLen, Number(newPtr), newLen);
        },
        host_link: (oldPtr, oldLen, newPtr, newLen) => {
          return this.hostLink(Number(oldPtr), oldLen, Number(newPtr), newLen);
        },
        host_symlink: (targetPtr, targetLen, linkPtr, linkLen) => {
          return this.hostSymlink(Number(targetPtr), targetLen, Number(linkPtr), linkLen);
        },
        host_readlink: (pathPtr, pathLen, bufPtr, bufLen) => {
          return this.hostReadlink(Number(pathPtr), pathLen, Number(bufPtr), bufLen);
        },
        host_chmod: (pathPtr, pathLen, mode) => {
          return this.hostChmod(Number(pathPtr), pathLen, mode);
        },
        host_chown: (pathPtr, pathLen, uid, gid) => {
          return this.hostChown(Number(pathPtr), pathLen, uid, gid);
        },
        host_access: (pathPtr, pathLen, amode) => {
          return this.hostAccess(Number(pathPtr), pathLen, amode);
        },
        host_opendir: (pathPtr, pathLen) => {
          return this.hostOpendir(Number(pathPtr), pathLen);
        },
        host_readdir: (dirHandle, direntPtr, namePtr, nameLen) => {
          return this.hostReaddir(dirHandle, Number(direntPtr), Number(namePtr), nameLen);
        },
        host_closedir: (dirHandle) => {
          return this.hostClosedir(dirHandle);
        },
        host_clock_gettime: (clockId, secPtr, nsecPtr) => {
          return this.hostClockGettime(clockId, Number(secPtr), Number(nsecPtr));
        },
        host_nanosleep: (sec, nsec) => {
          return this.hostNanosleep(sec, nsec);
        },
        host_ftruncate: (handle, length) => {
          return this.hostFtruncate(handle, length);
        },
        host_fsync: (handle) => {
          return this.hostFsync(handle);
        },
        host_fchmod: (handle, mode) => {
          return this.hostFchmod(handle, mode);
        },
        host_fchown: (handle, uid, gid) => {
          return this.hostFchown(handle, uid, gid);
        },
        host_kill: (pid, sig) => {
          return this.hostKill(pid, sig);
        },
        host_exec: (pathPtr, pathLen) => {
          return this.hostExec(Number(pathPtr), pathLen);
        },
        host_set_alarm: (seconds) => {
          return this.hostSetAlarm(seconds);
        },
        host_set_posix_timer: (timerId, signo, valueMsLo, valueMsHi, intervalMsLo, intervalMsHi) => {
          const valueMs = (valueMsHi >>> 0) * 4294967296 + (valueMsLo >>> 0);
          const intervalMs = (intervalMsHi >>> 0) * 4294967296 + (intervalMsLo >>> 0);
          return this.hostSetPosixTimer(timerId, signo, valueMs, intervalMs);
        },
        host_sigsuspend_wait: () => {
          return this.hostSigsuspendWait();
        },
        host_call_signal_handler: (handler_index, signum, sa_flags) => {
          const SA_SIGINFO = 4;
          const table = this.programFuncTable ?? this.instance?.exports.__indirect_function_table;
          if (!table) {
            return -22;
          }
          const handler = table.get(handler_index);
          if (handler) {
            try {
              if (sa_flags & SA_SIGINFO) {
                handler(signum, 0, 0);
              } else {
                handler(signum);
              }
              return 0;
            } catch (e) {
              return -5;
            }
          }
          return -22;
        },
        host_getrandom: (bufPtr, bufLen) => {
          try {
            const mem = this.getMemoryBuffer();
            const ptr = Number(bufPtr);
            const target = mem.subarray(ptr, ptr + bufLen);
            if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
              const tmp = new Uint8Array(bufLen);
              globalThis.crypto.getRandomValues(tmp);
              target.set(tmp);
            } else {
              for (let i = 0; i < bufLen; i++) target[i] = Math.random() * 256 | 0;
            }
            return bufLen;
          } catch {
            return -5;
          }
        },
        host_utimensat: (pathPtr, pathLen, atimeSec, atimeNsec, mtimeSec, mtimeNsec) => {
          return this.hostUtimensat(Number(pathPtr), pathLen, atimeSec, atimeNsec, mtimeSec, mtimeNsec);
        },
        host_waitpid: (pid, options, statusPtr) => {
          return this.hostWaitpid(pid, options, Number(statusPtr));
        },
        host_net_connect: (handle, addrPtr, addrLen, port) => {
          return this.hostNetConnect(handle, Number(addrPtr), addrLen, port);
        },
        host_net_send: (handle, bufPtr, bufLen, flags) => {
          return this.hostNetSend(handle, Number(bufPtr), bufLen, flags);
        },
        host_net_recv: (handle, bufPtr, bufLen, flags) => {
          return this.hostNetRecv(handle, Number(bufPtr), bufLen, flags);
        },
        host_net_close: (handle) => {
          return this.hostNetClose(handle);
        },
        host_net_listen: (fd, port, addrA, addrB, addrC, addrD) => {
          return this.hostNetListen(fd, port, addrA, addrB, addrC, addrD);
        },
        host_getaddrinfo: (namePtr, nameLen, resultPtr, resultLen) => {
          return this.hostGetaddrinfo(Number(namePtr), nameLen, Number(resultPtr), resultLen);
        },
        host_fcntl_lock: (pathPtr, pathLen, pid, cmd, lockType, startLo, startHi, lenLo, lenHi, resultPtr) => {
          return this.hostFcntlLock(Number(pathPtr), pathLen, pid, cmd, lockType, startLo, startHi, lenLo, lenHi, Number(resultPtr));
        },
        host_fork: () => {
          return this.hostFork();
        },
        host_futex_wait: (addr, expected, timeoutLo, timeoutHi) => {
          return this.hostFutexWait(Number(addr), expected, timeoutLo, timeoutHi);
        },
        host_futex_wake: (addr, count) => {
          return this.hostFutexWake(Number(addr), count);
        },
        host_clone: (fnPtr, arg, stackPtr, tlsPtr, ctidPtr) => {
          return this.hostClone(Number(fnPtr), Number(arg), Number(stackPtr), Number(tlsPtr), Number(ctidPtr));
        },
        host_is_thread_worker: () => {
          return this.isThreadWorker ? 1 : 0;
        },
        // /dev/fb0 hooks: the kernel notifies the host when a process
        // maps or unmaps the framebuffer. The registry is purely
        // metadata; whether anything renders is the consuming app's
        // choice (canvas in browser, no-op in Node tests).
        host_bind_framebuffer: (pid, addr, len, w, h, stride, fmt) => {
          this.framebuffers.bind({
            pid,
            addr: Number(addr),
            len: Number(len),
            w,
            h,
            stride,
            // Only BGRA32 is defined today (fmt=0). If we ever add
            // formats we'll branch on the tag here.
            fmt: fmt === 0 ? "BGRA32" : "BGRA32"
          });
        },
        host_unbind_framebuffer: (pid) => {
          this.framebuffers.unbind(pid);
        },
        host_fb_write: (pid, offset, srcPtr, len) => {
          this.framebuffers.fbWrite(
            pid,
            Number(offset),
            this.readKernelBytes(Number(srcPtr), Number(len))
          );
        }
      }
    };
  }
  /**
   * Access the Wasm memory (e.g. for tests or advanced use).
   */
  getMemory() {
    return this.memory;
  }
  /**
   * Access the Wasm instance (e.g. to call exported functions).
   */
  getInstance() {
    return this.instance;
  }
  // ---- Host import implementations ----
  getMemoryBuffer() {
    if (!this.memory) {
      throw new Error("Kernel not initialized");
    }
    return new Uint8Array(this.memory.buffer);
  }
  getMemoryDataView() {
    if (!this.memory) {
      throw new Error("Kernel not initialized");
    }
    return new DataView(this.memory.buffer);
  }
  /** Copy `len` bytes from kernel memory at `ptr` into a non-shared
   *  Uint8Array. Used by host imports that consume kernel-scratch
   *  payloads (e.g. host_fb_write).
   */
  readKernelBytes(ptr, len) {
    const out = new Uint8Array(len);
    out.set(this.getMemoryBuffer().subarray(ptr, ptr + len));
    return out;
  }
  /**
   * host_open(path_ptr, path_len, flags, mode) -> i64
   *
   * Reads the path from Wasm memory and delegates to PlatformIO.
   * For the initial synchronous implementation, we cannot truly await
   * the async PlatformIO.open — so we use a synchronous fallback that
   * blocks on the promise. In practice, NodePlatformIO uses sync fs
   * operations internally, so the promise resolves immediately.
   */
  hostOpen(pathPtr, pathLen, flags, mode) {
    try {
      const mem = this.getMemoryBuffer();
      const pathBytes = mem.slice(pathPtr, pathPtr + pathLen);
      const path = new TextDecoder().decode(pathBytes);
      return BigInt(this.io.open(path, flags, mode));
    } catch (e) {
      return BigInt(negErrno(e));
    }
  }
  /**
   * host_close(handle: i64) -> i32
   */
  hostClose(handle) {
    const h = Number(handle);
    const entry = this.sharedPipes.get(h);
    if (entry) {
      if (entry.end === "read") {
        entry.pipe.closeRead();
      } else {
        entry.pipe.closeWrite();
      }
      this.sharedPipes.delete(h);
      return 0;
    }
    if (h >= 0 && h <= 2) {
      return 0;
    }
    try {
      return this.io.close(h);
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_read(handle: i64, buf_ptr, buf_len) -> i32
   *
   * For handle 0 (stdin): return 0 (no stdin support yet).
   * Other handles: delegate to PlatformIO.
   */
  hostRead(handle, bufPtr, bufLen) {
    const h = Number(handle);
    const readEntry = this.sharedPipes.get(h);
    if (readEntry) {
      const mem = this.getMemoryBuffer();
      const dst = new Uint8Array(mem.buffer, bufPtr, bufLen);
      return readEntry.pipe.read(dst);
    }
    if (h === 0) {
      if (this.callbacks.onStdin) {
        const data = this.callbacks.onStdin(bufLen);
        if (data === null) return 0;
        if (data.length === 0) return -11;
        const mem = this.getMemoryBuffer();
        const n = Math.min(data.length, bufLen);
        mem.set(data.subarray(0, n), bufPtr);
        return n;
      }
      return 0;
    }
    try {
      const mem = this.getMemoryBuffer();
      const buf = mem.subarray(bufPtr, bufPtr + bufLen);
      return this.io.read(h, buf, null, bufLen);
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_write(handle: i64, buf_ptr, buf_len) -> i32
   *
   * For handles 1 (stdout) and 2 (stderr): uses callback if provided,
   * falls back to process.stdout/stderr (Node.js), then console (browser).
   * Other handles: delegate to PlatformIO.
   */
  hostWrite(handle, bufPtr, bufLen) {
    const h = Number(handle);
    const mem = this.getMemoryBuffer();
    const data = mem.slice(bufPtr, bufPtr + bufLen);
    const writeEntry = this.sharedPipes.get(h);
    if (writeEntry) {
      return writeEntry.pipe.write(data);
    }
    if (h === 1) {
      if (this.callbacks.onStdout) {
        this.callbacks.onStdout(data);
      } else if (typeof process !== "undefined" && process.stdout) {
        process.stdout.write(data);
      } else {
        console.log(new TextDecoder().decode(data));
      }
      return bufLen;
    }
    if (h === 2) {
      if (this.callbacks.onStderr) {
        this.callbacks.onStderr(data);
      } else if (typeof process !== "undefined" && process.stderr) {
        process.stderr.write(data);
      } else {
        console.error(new TextDecoder().decode(data));
      }
      return bufLen;
    }
    try {
      return this.io.write(h, data, null, bufLen);
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_seek(handle: i64, offset_lo, offset_hi, whence) -> i64
   *
   * Combines the low and high 32-bit parts into a 64-bit offset.
   */
  hostSeek(handle, offsetLo, offsetHi, whence) {
    const h = Number(handle);
    const offset = offsetHi * 4294967296 + (offsetLo >>> 0);
    try {
      return BigInt(this.io.seek(h, offset, whence));
    } catch (e) {
      return BigInt(negErrno(e));
    }
  }
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
  hostFstat(handle, statPtr) {
    const h = Number(handle);
    try {
      const stat = this.io.fstat(h);
      this.writeStatToMemory(statPtr, stat);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * Write a StatResult into the WasmStat struct at the given Wasm memory offset.
   */
  writeStatToMemory(ptr, stat) {
    const dv = this.getMemoryDataView();
    const mem = this.getMemoryBuffer();
    mem.fill(0, ptr, ptr + WASM_STAT_SIZE);
    dv.setBigUint64(ptr + 0, BigInt(stat.dev), true);
    dv.setBigUint64(ptr + 8, BigInt(stat.ino), true);
    dv.setUint32(ptr + 16, stat.mode, true);
    dv.setUint32(ptr + 20, stat.nlink, true);
    dv.setUint32(ptr + 24, stat.uid, true);
    dv.setUint32(ptr + 28, stat.gid, true);
    dv.setBigUint64(ptr + 32, BigInt(stat.size), true);
    const atimeSec = Math.floor(stat.atimeMs / 1e3);
    const atimeNsec = Math.floor(stat.atimeMs % 1e3 * 1e6);
    dv.setBigUint64(ptr + 40, BigInt(atimeSec), true);
    dv.setUint32(ptr + 48, atimeNsec, true);
    const mtimeSec = Math.floor(stat.mtimeMs / 1e3);
    const mtimeNsec = Math.floor(stat.mtimeMs % 1e3 * 1e6);
    dv.setBigUint64(ptr + 56, BigInt(mtimeSec), true);
    dv.setUint32(ptr + 64, mtimeNsec, true);
    const ctimeSec = Math.floor(stat.ctimeMs / 1e3);
    const ctimeNsec = Math.floor(stat.ctimeMs % 1e3 * 1e6);
    dv.setBigUint64(ptr + 72, BigInt(ctimeSec), true);
    dv.setUint32(ptr + 80, ctimeNsec, true);
  }
  // ---- Phase 2: Path-based and directory host imports ----
  /**
   * Read a UTF-8 path string from Wasm memory.
   */
  readPathFromMemory(ptr, len) {
    const mem = this.getMemoryBuffer();
    const pathBytes = mem.slice(ptr, ptr + len);
    return new TextDecoder().decode(pathBytes);
  }
  /**
   * host_stat(path_ptr, path_len, stat_ptr) -> i32
   */
  hostStat(pathPtr, pathLen, statPtr) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      const stat = this.io.stat(path);
      this.writeStatToMemory(statPtr, stat);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_lstat(path_ptr, path_len, stat_ptr) -> i32
   */
  hostLstat(pathPtr, pathLen, statPtr) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      const stat = this.io.lstat(path);
      this.writeStatToMemory(statPtr, stat);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_mkdir(path_ptr, path_len, mode) -> i32
   */
  hostMkdir(pathPtr, pathLen, mode) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.mkdir(path, mode);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_rmdir(path_ptr, path_len) -> i32
   */
  hostRmdir(pathPtr, pathLen) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.rmdir(path);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_unlink(path_ptr, path_len) -> i32
   */
  hostUnlink(pathPtr, pathLen) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.unlink(path);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_rename(old_ptr, old_len, new_ptr, new_len) -> i32
   */
  hostRename(oldPtr, oldLen, newPtr, newLen) {
    try {
      const oldPath = this.readPathFromMemory(oldPtr, oldLen);
      const newPath = this.readPathFromMemory(newPtr, newLen);
      this.io.rename(oldPath, newPath);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_link(old_ptr, old_len, new_ptr, new_len) -> i32
   */
  hostLink(oldPtr, oldLen, newPtr, newLen) {
    try {
      const existingPath = this.readPathFromMemory(oldPtr, oldLen);
      const newPath = this.readPathFromMemory(newPtr, newLen);
      this.io.link(existingPath, newPath);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_symlink(target_ptr, target_len, link_ptr, link_len) -> i32
   */
  hostSymlink(targetPtr, targetLen, linkPtr, linkLen) {
    try {
      const target = this.readPathFromMemory(targetPtr, targetLen);
      const linkPath = this.readPathFromMemory(linkPtr, linkLen);
      this.io.symlink(target, linkPath);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_readlink(path_ptr, path_len, buf_ptr, buf_len) -> i32
   *
   * Returns the number of bytes written to the buffer, or -1 on error.
   */
  hostReadlink(pathPtr, pathLen, bufPtr, bufLen) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      const target = this.io.readlink(path);
      const encoded = new TextEncoder().encode(target);
      const n = Math.min(encoded.length, bufLen);
      const mem = this.getMemoryBuffer();
      mem.set(encoded.subarray(0, n), bufPtr);
      return n;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_chmod(path_ptr, path_len, mode) -> i32
   */
  hostChmod(pathPtr, pathLen, mode) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.chmod(path, mode);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_chown(path_ptr, path_len, uid, gid) -> i32
   */
  hostChown(pathPtr, pathLen, uid, gid) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.chown(path, uid, gid);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_access(path_ptr, path_len, amode) -> i32
   */
  hostAccess(pathPtr, pathLen, amode) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.access(path, amode);
      return 0;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_utimensat(path_ptr, path_len, atime_sec, atime_nsec, mtime_sec, mtime_nsec) -> i32
   */
  hostUtimensat(pathPtr, pathLen, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      this.io.utimensat(path, Number(atimeSec), Number(atimeNsec), Number(mtimeSec), Number(mtimeNsec));
      return 0;
    } catch {
      return -1;
    }
  }
  /**
   * host_waitpid(pid, options, status_ptr) -> i32
   * Returns child pid on success, negative errno on error.
   * Writes wait status to status_ptr.
   */
  hostWaitpid(pid, options, statusPtr) {
    if (this.waitpidSab && this.callbacks.onWaitpid) {
      const view = new Int32Array(this.waitpidSab);
      Atomics.store(view, 0, 0);
      Atomics.store(view, 1, 0);
      Atomics.store(view, 2, 0);
      this.callbacks.onWaitpid(pid, options);
      Atomics.wait(view, 0, 0);
      const resultPid = Atomics.load(view, 1);
      const resultStatus = Atomics.load(view, 2);
      if (resultPid < 0) {
        return resultPid;
      }
      if (statusPtr !== 0 && this.memory) {
        const dv = new DataView(this.memory.buffer);
        dv.setInt32(statusPtr, resultStatus, true);
      }
      return resultPid;
    }
    if (!this.io.waitpid) {
      return -10;
    }
    try {
      const result = this.io.waitpid(pid, options);
      if (statusPtr !== 0 && this.memory) {
        const view = new DataView(this.memory.buffer);
        view.setInt32(statusPtr, result.status, true);
      }
      return result.pid;
    } catch {
      return -10;
    }
  }
  /**
   * host_opendir(path_ptr, path_len) -> i64
   *
   * Returns a directory handle as i64, or -1 on error.
   */
  hostOpendir(pathPtr, pathLen) {
    try {
      const path = this.readPathFromMemory(pathPtr, pathLen);
      return BigInt(this.io.opendir(path));
    } catch (e) {
      return BigInt(negErrno(e));
    }
  }
  /**
   * host_readdir(dir_handle: i64, dirent_ptr, name_ptr, name_len) -> i32
   *
   * Writes a WasmDirent struct and the entry name to Wasm memory.
   * Returns 1 if an entry was written, 0 at end-of-directory, -1 on error.
   */
  hostReaddir(dirHandle, direntPtr, namePtr, nameLen) {
    try {
      const h = Number(dirHandle);
      const dirEntry = this.io.readdir(h);
      if (dirEntry === null) return 0;
      const dv = this.getMemoryDataView();
      const mem = this.getMemoryBuffer();
      const encoded = new TextEncoder().encode(dirEntry.name);
      const n = Math.min(encoded.length, nameLen);
      dv.setBigUint64(direntPtr, BigInt(dirEntry.ino), true);
      dv.setUint32(direntPtr + 8, dirEntry.type, true);
      dv.setUint32(direntPtr + 12, n, true);
      mem.set(encoded.subarray(0, n), namePtr);
      return 1;
    } catch (e) {
      return negErrno(e);
    }
  }
  /**
   * host_closedir(dir_handle: i64) -> i32
   */
  hostClosedir(dirHandle) {
    try {
      const h = Number(dirHandle);
      this.io.closedir(h);
      return 0;
    } catch {
      return -1;
    }
  }
  // ---- Phase 7: Time host imports ----
  /**
   * host_clock_gettime(clock_id, sec_ptr, nsec_ptr) -> i32
   *
   * Writes the current time (seconds and nanoseconds) to Wasm memory
   * at the given pointers.
   */
  hostClockGettime(clockId, secPtr, nsecPtr) {
    try {
      const result = this.io.clockGettime(clockId);
      const dv = this.getMemoryDataView();
      dv.setBigInt64(secPtr, BigInt(result.sec), true);
      dv.setBigInt64(nsecPtr, BigInt(result.nsec), true);
      return 0;
    } catch {
      return -1;
    }
  }
  /**
   * host_nanosleep(sec: i64, nsec: i64) -> i32
   *
   * Sleep for the specified duration. The i64 parameters appear as
   * BigInt in JavaScript.
   */
  hostNanosleep(sec, nsec) {
    try {
      this.io.nanosleep(Number(sec), Number(nsec));
      return 0;
    } catch {
      return -1;
    }
  }
  // ---- Phase 11: ftruncate/fsync/fchmod/fchown host imports ----
  hostFtruncate(handle, length) {
    try {
      this.io.ftruncate(Number(handle), Number(length));
      return 0;
    } catch {
      return -1;
    }
  }
  hostFsync(handle) {
    try {
      this.io.fsync(Number(handle));
      return 0;
    } catch {
      return -1;
    }
  }
  /**
   * host_fchmod(handle: i64, mode: u32) -> i32
   */
  hostFchmod(handle, mode) {
    try {
      this.io.fchmod(Number(handle), mode);
      return 0;
    } catch {
      return -1;
    }
  }
  /**
   * host_fchown(handle: i64, uid: u32, gid: u32) -> i32
   */
  hostFchown(handle, uid, gid) {
    try {
      this.io.fchown(Number(handle), uid, gid);
      return 0;
    } catch {
      return -1;
    }
  }
  // ---- Phase 13d: Cross-process kill ----
  hostKill(pid, sig) {
    if (this.callbacks.onKill) {
      return this.callbacks.onKill(pid, sig);
    }
    return -3;
  }
  // ---- Phase 13e: Exec ----
  hostExec(pathPtr, pathLen) {
    if (this.callbacks.onExec) {
      const mem = this.getMemoryBuffer();
      const path = new TextDecoder().decode(mem.slice(pathPtr, pathPtr + pathLen));
      return this.callbacks.onExec(path);
    }
    return -2;
  }
  // ---- Phase 14: Alarm ----
  hostSetAlarm(seconds) {
    if (this.callbacks.onAlarm) {
      return this.callbacks.onAlarm(seconds);
    }
    return 0;
  }
  hostSetPosixTimer(timerId, signo, valueMs, intervalMs) {
    if (this.callbacks.onPosixTimer) {
      return this.callbacks.onPosixTimer(timerId, signo, valueMs, intervalMs);
    }
    return 0;
  }
  hostSigsuspendWait() {
    if (!this.signalWakeSab) {
      return -4;
    }
    const view = new Int32Array(this.signalWakeSab);
    const old = Atomics.compareExchange(view, 0, 1, 0);
    if (old === 1) {
      const sig2 = Atomics.load(view, 1);
      Atomics.store(view, 1, 0);
      return sig2;
    }
    Atomics.wait(view, 0, 0);
    const sig = Atomics.load(view, 1);
    Atomics.store(view, 0, 0);
    Atomics.store(view, 1, 0);
    return sig;
  }
  // ---- Public API: Socket & Poll operations ----
  /**
   * Create a socket. Returns the fd or throws on error.
   */
  socket(domain, type, protocol) {
    const fn = this.instance.exports.kernel_socket;
    const result = fn(domain, type, protocol);
    if (result < 0) throw new Error(`socket failed: errno ${-result}`);
    return result;
  }
  /**
   * Create a connected pair of Unix domain stream sockets.
   * Returns [fd0, fd1].
   */
  socketpair(domain, type, protocol) {
    const fn = this.instance.exports.kernel_socketpair;
    const dv = this.getMemoryDataView();
    const scratchPtr = 4;
    const result = fn(domain, type, protocol, scratchPtr);
    if (result < 0) throw new Error(`socketpair failed: errno ${-result}`);
    const fd0 = dv.getInt32(scratchPtr, true);
    const fd1 = dv.getInt32(scratchPtr + 4, true);
    return [fd0, fd1];
  }
  /**
   * Shut down part of a full-duplex socket connection.
   */
  shutdown(fd, how) {
    const fn = this.instance.exports.kernel_shutdown;
    const result = fn(fd, how);
    if (result < 0) throw new Error(`shutdown failed: errno ${-result}`);
  }
  /**
   * Send data on a connected socket. Returns bytes sent.
   */
  send(fd, data, flags = 0) {
    const fn = this.instance.exports.kernel_send;
    const mem = this.getMemoryBuffer();
    const tmpPtr = 16;
    mem.set(data, tmpPtr);
    const result = fn(fd, tmpPtr, data.length, flags);
    if (result < 0) throw new Error(`send failed: errno ${-result}`);
    return result;
  }
  /**
   * Receive data from a connected socket. Returns the received data.
   */
  recv(fd, maxLen, flags = 0) {
    const fn = this.instance.exports.kernel_recv;
    const tmpPtr = 16;
    const result = fn(fd, tmpPtr, maxLen, flags);
    if (result < 0) throw new Error(`recv failed: errno ${-result}`);
    const mem = this.getMemoryBuffer();
    return mem.slice(tmpPtr, tmpPtr + result);
  }
  /**
   * Poll file descriptors for I/O readiness.
   * Returns array of {fd, events, revents} with revents filled in.
   */
  poll(fds, timeout) {
    const fn = this.instance.exports.kernel_poll;
    const nfds = fds.length;
    const tmpPtr = 16;
    const dv = this.getMemoryDataView();
    for (let i = 0; i < nfds; i++) {
      const off = tmpPtr + i * 8;
      dv.setInt32(off, fds[i].fd, true);
      dv.setInt16(off + 4, fds[i].events, true);
      dv.setInt16(off + 6, 0, true);
    }
    const result = fn(tmpPtr, nfds, timeout);
    if (result < 0) throw new Error(`poll failed: errno ${-result}`);
    return fds.map((f, i) => ({
      fd: f.fd,
      events: f.events,
      revents: dv.getInt16(tmpPtr + i * 8 + 6, true)
    }));
  }
  /**
   * Get a socket option value.
   */
  getsockopt(fd, level, optname) {
    const fn = this.instance.exports.kernel_getsockopt;
    const dv = this.getMemoryDataView();
    const scratchPtr = 4;
    const result = fn(fd, level, optname, scratchPtr);
    if (result < 0) throw new Error(`getsockopt failed: errno ${-result}`);
    return dv.getUint32(scratchPtr, true);
  }
  /**
   * Set a socket option value.
   */
  setsockopt(fd, level, optname, value) {
    const fn = this.instance.exports.kernel_setsockopt;
    const result = fn(fd, level, optname, value);
    if (result < 0) throw new Error(`setsockopt failed: errno ${-result}`);
  }
  // ---- Public API: Terminal operations ----
  /**
   * Get terminal attributes (48 bytes: c_iflag, c_oflag, c_cflag, c_lflag + c_cc).
   */
  tcgetattr(fd) {
    const fn = this.instance.exports.kernel_tcgetattr;
    const tmpPtr = 16;
    const result = fn(fd, tmpPtr, 48);
    if (result < 0) throw new Error(`tcgetattr failed: errno ${-result}`);
    const mem = this.getMemoryBuffer();
    return mem.slice(tmpPtr, tmpPtr + 48);
  }
  /**
   * Set terminal attributes.
   * action: 0=TCSANOW, 1=TCSADRAIN, 2=TCSAFLUSH
   */
  tcsetattr(fd, action, attrs) {
    const fn = this.instance.exports.kernel_tcsetattr;
    const mem = this.getMemoryBuffer();
    const tmpPtr = 16;
    mem.set(attrs, tmpPtr);
    const result = fn(fd, action, tmpPtr, attrs.length);
    if (result < 0) throw new Error(`tcsetattr failed: errno ${-result}`);
  }
  /**
   * Perform an ioctl operation.
   * For TIOCGWINSZ (0x5413): returns 8-byte buffer (ws_row, ws_col, ws_xpixel, ws_ypixel as u16 LE)
   * For TIOCSWINSZ (0x5414): pass 8-byte buffer to set window size
   */
  ioctl(fd, request, buf) {
    const fn = this.instance.exports.kernel_ioctl;
    const mem = this.getMemoryBuffer();
    const tmpPtr = 16;
    const bufLen = buf ? buf.length : 8;
    if (buf) mem.set(buf, tmpPtr);
    const result = fn(fd, request, tmpPtr, bufLen);
    if (result < 0) throw new Error(`ioctl failed: errno ${-result}`);
    return mem.slice(tmpPtr, tmpPtr + bufLen);
  }
  /**
   * Set signal handler (legacy API). Returns previous handler value.
   * handler: 0=SIG_DFL, 1=SIG_IGN, or function pointer index
   */
  signal(signum, handler) {
    const fn = this.instance.exports.kernel_signal;
    const result = fn(signum, handler);
    if (result < 0) throw new Error(`signal failed: errno ${-result}`);
    return result;
  }
  // ---- Public API: Phase 10 Extended POSIX ----
  /**
   * Set file creation mask. Returns previous mask.
   */
  umask(mask) {
    const fn = this.instance.exports.kernel_umask;
    return fn(mask);
  }
  /**
   * Get system identification. Returns object with sysname, nodename, release, version, machine.
   */
  uname() {
    const fn = this.instance.exports.kernel_uname;
    const tmpPtr = 16;
    const result = fn(tmpPtr, 325);
    if (result < 0) throw new Error(`uname failed: errno ${-result}`);
    const mem = this.getMemoryBuffer();
    const decoder2 = new TextDecoder();
    const readField = (offset) => {
      const start = tmpPtr + offset;
      let end = start;
      while (end < start + 65 && mem[end] !== 0) end++;
      return decoder2.decode(mem.slice(start, end));
    };
    return {
      sysname: readField(0),
      nodename: readField(65),
      release: readField(130),
      version: readField(195),
      machine: readField(260)
    };
  }
  /**
   * Get configurable system variable value.
   */
  sysconf(name) {
    const fn = this.instance.exports.kernel_sysconf;
    const result = fn(name);
    return Number(result);
  }
  /**
   * Duplicate fd with flags. Unlike dup2, returns error if oldfd == newfd.
   */
  dup3(oldfd, newfd, flags) {
    const fn = this.instance.exports.kernel_dup3;
    const result = fn(oldfd, newfd, flags);
    if (result < 0) throw new Error(`dup3 failed: errno ${-result}`);
    return result;
  }
  /**
   * Create pipe with flags (O_NONBLOCK, O_CLOEXEC). Returns [readFd, writeFd].
   */
  pipe2(flags) {
    const fn = this.instance.exports.kernel_pipe2;
    const dv = this.getMemoryDataView();
    const scratchPtr = 4;
    const result = fn(flags, scratchPtr);
    if (result < 0) throw new Error(`pipe2 failed: errno ${-result}`);
    return [dv.getInt32(scratchPtr, true), dv.getInt32(scratchPtr + 4, true)];
  }
  /**
   * Truncate file to specified length.
   */
  ftruncate(fd, length) {
    const fn = this.instance.exports.kernel_ftruncate;
    const lo = length & 4294967295;
    const hi = Math.floor(length / 4294967296);
    const result = fn(fd, lo, hi);
    if (result < 0) throw new Error(`ftruncate failed: errno ${-result}`);
  }
  /**
   * Synchronize file state to storage.
   */
  fsync(fd) {
    const fn = this.instance.exports.kernel_fsync;
    const result = fn(fd);
    if (result < 0) throw new Error(`fsync failed: errno ${-result}`);
  }
  // ---- Public API: Phase 11 Final Gaps ----
  /**
   * Truncate a file by path to specified length.
   */
  truncate(pathPtr, pathLen, length) {
    const fn = this.instance.exports.kernel_truncate;
    const lo = length & 4294967295;
    const hi = Math.floor(length / 4294967296);
    const result = fn(pathPtr, pathLen, lo, hi);
    if (result < 0) throw new Error(`truncate failed: errno ${-result}`);
  }
  /**
   * Synchronize file data to storage (alias for fsync in Wasm).
   */
  fdatasync(fd) {
    const fn = this.instance.exports.kernel_fdatasync;
    const result = fn(fd);
    if (result < 0) throw new Error(`fdatasync failed: errno ${-result}`);
  }
  /**
   * Change file mode via fd.
   */
  fchmod(fd, mode) {
    const fn = this.instance.exports.kernel_fchmod;
    const result = fn(fd, mode);
    if (result < 0) throw new Error(`fchmod failed: errno ${-result}`);
  }
  /**
   * Change file owner/group via fd.
   */
  fchown(fd, uid, gid) {
    const fn = this.instance.exports.kernel_fchown;
    const result = fn(fd, uid, gid);
    if (result < 0) throw new Error(`fchown failed: errno ${-result}`);
  }
  /**
   * Get process group ID.
   */
  getpgrp() {
    const fn = this.instance.exports.kernel_getpgrp;
    return fn();
  }
  /**
   * Set process group ID.
   */
  setpgid(pid, pgid) {
    const fn = this.instance.exports.kernel_setpgid;
    const result = fn(pid, pgid);
    if (result < 0) throw new Error(`setpgid failed: errno ${-result}`);
  }
  /**
   * Get session ID.
   */
  getsid(pid) {
    const fn = this.instance.exports.kernel_getsid;
    const result = fn(pid);
    if (result < 0) throw new Error(`getsid failed: errno ${-result}`);
    return result;
  }
  /**
   * Create new session.
   */
  setsid() {
    const fn = this.instance.exports.kernel_setsid;
    const result = fn();
    if (result < 0) throw new Error(`setsid failed: errno ${-result}`);
    return result;
  }
  // ---- Public API: Phase 12 Remaining Tractable ----
  /**
   * Set real and effective user ID.
   */
  setuid(uid) {
    const fn = this.instance.exports.kernel_setuid;
    const result = fn(uid);
    if (result < 0) throw new Error(`setuid failed: errno ${-result}`);
  }
  /**
   * Set real and effective group ID.
   */
  setgid(gid) {
    const fn = this.instance.exports.kernel_setgid;
    const result = fn(gid);
    if (result < 0) throw new Error(`setgid failed: errno ${-result}`);
  }
  /**
   * Set effective user ID.
   */
  seteuid(euid) {
    const fn = this.instance.exports.kernel_seteuid;
    const result = fn(euid);
    if (result < 0) throw new Error(`seteuid failed: errno ${-result}`);
  }
  /**
   * Set effective group ID.
   */
  setegid(egid) {
    const fn = this.instance.exports.kernel_setegid;
    const result = fn(egid);
    if (result < 0) throw new Error(`setegid failed: errno ${-result}`);
  }
  /**
   * Get resource usage. Returns 144-byte rusage struct.
   */
  getrusage(who) {
    const fn = this.instance.exports.kernel_getrusage;
    const tmpPtr = 16;
    const result = fn(who, tmpPtr, 144);
    if (result < 0) throw new Error(`getrusage failed: errno ${-result}`);
    const mem = this.getMemoryBuffer();
    return mem.slice(tmpPtr, tmpPtr + 144);
  }
  /**
   * select() — synchronous I/O multiplexing.
   * Takes fd arrays for read/write/except monitoring, returns arrays of ready fds.
   */
  select(nfds, readfds, writefds, exceptfds) {
    const fn = this.instance.exports.kernel_select;
    const mem = this.getMemoryBuffer();
    const basePtr = 16;
    const readPtr = readfds ? basePtr : 0;
    const writePtr = writefds ? basePtr + 128 : 0;
    const exceptPtr = exceptfds ? basePtr + 256 : 0;
    if (readfds) {
      mem.fill(0, readPtr, readPtr + 128);
      for (const fd of readfds) {
        mem[readPtr + Math.floor(fd / 8)] |= 1 << fd % 8;
      }
    }
    if (writefds) {
      mem.fill(0, writePtr, writePtr + 128);
      for (const fd of writefds) {
        mem[writePtr + Math.floor(fd / 8)] |= 1 << fd % 8;
      }
    }
    if (exceptfds) {
      mem.fill(0, exceptPtr, exceptPtr + 128);
      for (const fd of exceptfds) {
        mem[exceptPtr + Math.floor(fd / 8)] |= 1 << fd % 8;
      }
    }
    const result = fn(nfds, readPtr, writePtr, exceptPtr, 0);
    if (result < 0) throw new Error(`select failed: errno ${-result}`);
    const extractReady = (ptr, fds) => {
      if (!fds || !ptr) return [];
      return fds.filter((fd) => mem[ptr + Math.floor(fd / 8)] >> fd % 8 & 1);
    };
    return {
      readReady: extractReady(readPtr, readfds),
      writeReady: extractReady(writePtr, writefds),
      exceptReady: extractReady(exceptPtr, exceptfds)
    };
  }
  // ---- Networking host imports ----
  hostNetConnect(handle, addrPtr, addrLen, port) {
    if (!this.io.network) return -111;
    try {
      const mem = new Uint8Array(this.memory.buffer);
      const addr = mem.slice(addrPtr, addrPtr + addrLen);
      this.io.network.connect(handle, addr, port);
      return 0;
    } catch {
      return -111;
    }
  }
  hostNetSend(handle, bufPtr, bufLen, flags) {
    if (!this.io.network) return -107;
    try {
      const mem = new Uint8Array(this.memory.buffer);
      const data = mem.slice(bufPtr, bufPtr + bufLen);
      return this.io.network.send(handle, data, flags);
    } catch (e) {
      if (e?.errno === 11) return -11;
      return -32;
    }
  }
  hostNetRecv(handle, bufPtr, bufLen, flags) {
    if (!this.io.network) return -107;
    try {
      const data = this.io.network.recv(handle, bufLen, flags);
      if (data.length > 0 && this.memory) {
        const mem = new Uint8Array(this.memory.buffer);
        mem.set(data, bufPtr);
      }
      return data.length;
    } catch (e) {
      if (e?.errno === 11) return -11;
      return -104;
    }
  }
  hostNetClose(handle) {
    if (!this.io.network) return 0;
    try {
      this.io.network.close(handle);
      return 0;
    } catch {
      return 0;
    }
  }
  hostNetListen(fd, port, addrA, addrB, addrC, addrD) {
    if (this.callbacks.onNetListen) {
      return this.callbacks.onNetListen(fd, port, [addrA, addrB, addrC, addrD]);
    }
    return 0;
  }
  hostGetaddrinfo(namePtr, nameLen, resultPtr, resultLen) {
    if (!this.io.network) return -2;
    try {
      const mem = new Uint8Array(this.memory.buffer);
      const name = new TextDecoder().decode(mem.slice(namePtr, namePtr + nameLen));
      const addr = this.io.network.getaddrinfo(name);
      if (addr.length > resultLen) return -22;
      mem.set(addr, resultPtr);
      return addr.length;
    } catch {
      return -2;
    }
  }
  // fcntl lock constants (must match crates/shared/src/lib.rs)
  static F_GETLK = 12;
  static F_SETLK = 13;
  static F_SETLKW = 14;
  static F_UNLCK = 2;
  hostFcntlLock(pathPtr, pathLen, pid, cmd, lockType, startLo, startHi, lenLo, lenHi, resultPtr) {
    if (!this.sharedLockTable) {
      return 0;
    }
    try {
      const mem = this.getMemoryBuffer();
      const path = new TextDecoder().decode(mem.slice(pathPtr, pathPtr + pathLen));
      const pathHash = SharedLockTable.hashPath(path);
      const start = BigInt(startHi) << 32n | BigInt(startLo >>> 0);
      const len = BigInt(lenHi) << 32n | BigInt(lenLo >>> 0);
      switch (cmd) {
        case _WasmPosixKernel.F_GETLK: {
          const blocker = this.sharedLockTable.getBlockingLock(pathHash, lockType, start, len, pid);
          const dv = this.getMemoryDataView();
          if (blocker) {
            dv.setUint32(resultPtr, blocker.lockType, true);
            dv.setUint32(resultPtr + 4, blocker.pid, true);
            const bStart = blocker.start;
            dv.setUint32(resultPtr + 8, Number(bStart & 0xffffffffn), true);
            dv.setUint32(resultPtr + 12, Number(bStart >> 32n & 0xffffffffn), true);
            const bLen = blocker.len;
            dv.setUint32(resultPtr + 16, Number(bLen & 0xffffffffn), true);
            dv.setUint32(resultPtr + 20, Number(bLen >> 32n & 0xffffffffn), true);
          } else {
            dv.setUint32(resultPtr, _WasmPosixKernel.F_UNLCK, true);
          }
          return 0;
        }
        case _WasmPosixKernel.F_SETLK: {
          const ok = this.sharedLockTable.setLock(pathHash, pid, lockType, start, len);
          return ok ? 0 : -11;
        }
        case _WasmPosixKernel.F_SETLKW: {
          this.sharedLockTable.setLockWait(pathHash, pid, lockType, start, len);
          return 0;
        }
        default:
          return -22;
      }
    } catch {
      return -5;
    }
  }
  /**
   * host_fork() -> i32
   * Guest-initiated fork. Posts fork_request to host, blocks on Atomics.wait
   * until host signals back with child PID via forkSab.
   *
   * forkSab layout: Int32Array(2) on SharedArrayBuffer(8)
   *   [0] = flag (0 = waiting, 1 = done)
   *   [1] = result (child PID or negative errno)
   */
  hostFork() {
    if (!this.forkSab) {
      return -38;
    }
    const view = new Int32Array(this.forkSab);
    Atomics.store(view, 0, 0);
    Atomics.store(view, 1, 0);
    if (this.callbacks.onFork) {
      this.callbacks.onFork(this.forkSab);
    } else {
      return -38;
    }
    Atomics.wait(view, 0, 0);
    return Atomics.load(view, 1);
  }
  hostFutexWait(addr, expected, timeoutLo, timeoutHi) {
    if (!this.memory) return -22;
    const i32view = new Int32Array(this.memory.buffer);
    const index = addr >>> 2;
    const timeoutNs = BigInt(timeoutHi >>> 0) * 0x100000000n + BigInt(timeoutLo >>> 0);
    const signed = BigInt.asIntN(64, timeoutNs);
    let timeoutMs;
    if (signed >= 0n) {
      timeoutMs = Number(signed / 1000000n);
      if (timeoutMs === 0 && signed > 0n) timeoutMs = 1;
    }
    const result = Atomics.wait(i32view, index, expected, timeoutMs);
    if (result === "timed-out") {
      return -110;
    }
    if (result === "not-equal") return -11;
    return 0;
  }
  hostFutexWake(addr, count) {
    if (!this.memory) return 0;
    const i32view = new Int32Array(this.memory.buffer);
    const index = addr >>> 2;
    return Atomics.notify(i32view, index, count);
  }
  hostClone(fnPtr, arg, stackPtr, tlsPtr, ctidPtr) {
    if (this.callbacks.onClone) {
      return this.callbacks.onClone(fnPtr, arg, stackPtr, tlsPtr, ctidPtr);
    }
    return -38;
  }
};

// src/channel.ts
var STATUS_OFFSET = 0;
var SYSCALL_OFFSET = 4;
var ARGS_OFFSET = 8;
var ARGS_COUNT = 6;
var RETURN_OFFSET = 32;
var ERRNO_OFFSET = 36;
var DATA_OFFSET = 40;
var ChannelStatus = /* @__PURE__ */ ((ChannelStatus2) => {
  ChannelStatus2[ChannelStatus2["Idle"] = 0] = "Idle";
  ChannelStatus2[ChannelStatus2["Pending"] = 1] = "Pending";
  ChannelStatus2[ChannelStatus2["Complete"] = 2] = "Complete";
  ChannelStatus2[ChannelStatus2["Error"] = 3] = "Error";
  return ChannelStatus2;
})(ChannelStatus || {});
var SyscallChannel = class {
  view;
  i32Array;
  buffer;
  byteOffset;
  constructor(buffer, byteOffset = 0) {
    this.buffer = buffer;
    this.byteOffset = byteOffset;
    this.view = new DataView(buffer, byteOffset);
    this.i32Array = new Int32Array(buffer, byteOffset);
  }
  // ---- Status field (offset 0, 4 bytes) ----
  get status() {
    if (this.isShared) {
      return Atomics.load(this.i32Array, STATUS_OFFSET / 4);
    }
    return this.view.getUint32(STATUS_OFFSET, true);
  }
  set status(value) {
    if (this.isShared) {
      Atomics.store(this.i32Array, STATUS_OFFSET / 4, value);
    } else {
      this.view.setUint32(STATUS_OFFSET, value, true);
    }
  }
  // ---- Syscall number (offset 4, 4 bytes) ----
  get syscallNumber() {
    return this.view.getUint32(SYSCALL_OFFSET, true);
  }
  // ---- Arguments (offset 8, 6 x 4 bytes) ----
  getArg(index) {
    if (index < 0 || index >= ARGS_COUNT) {
      throw new RangeError(
        `Argument index ${index} out of range [0, ${ARGS_COUNT})`
      );
    }
    return this.view.getInt32(ARGS_OFFSET + index * 4, true);
  }
  // ---- Return value (offset 32, 4 bytes) ----
  setReturn(value) {
    this.view.setInt32(RETURN_OFFSET, value, true);
  }
  // ---- Errno (offset 36, 4 bytes) ----
  setErrno(value) {
    this.view.setUint32(ERRNO_OFFSET, value, true);
  }
  // ---- Data transfer buffer (offset 40..end) ----
  get dataBuffer() {
    return new Uint8Array(
      this.buffer,
      this.byteOffset + DATA_OFFSET
    );
  }
  // ---- Atomic operations for SharedArrayBuffer paths ----
  /**
   * Set status to Complete and wake any thread waiting on the status field.
   * Only meaningful when the underlying buffer is a SharedArrayBuffer.
   */
  notifyComplete() {
    if (!this.isShared) {
      this.status = 2 /* Complete */;
      return;
    }
    Atomics.store(this.i32Array, STATUS_OFFSET / 4, 2 /* Complete */);
    Atomics.notify(this.i32Array, STATUS_OFFSET / 4);
  }
  /**
   * Set status to Error and wake any thread waiting on the status field.
   * Only meaningful when the underlying buffer is a SharedArrayBuffer.
   */
  notifyError() {
    if (!this.isShared) {
      this.status = 3 /* Error */;
      return;
    }
    Atomics.store(this.i32Array, STATUS_OFFSET / 4, 3 /* Error */);
    Atomics.notify(this.i32Array, STATUS_OFFSET / 4);
  }
  /**
   * Block the current thread until the channel status transitions to
   * Complete or Error. Returns the final status.
   *
   * Only works with SharedArrayBuffer (requires Atomics.wait support).
   */
  waitForComplete() {
    if (!this.isShared) {
      return this.status;
    }
    while (true) {
      const current = Atomics.load(
        this.i32Array,
        STATUS_OFFSET / 4
      );
      if (current === 2 /* Complete */ || current === 3 /* Error */) {
        return current;
      }
      Atomics.wait(this.i32Array, STATUS_OFFSET / 4, current, 1e3);
    }
  }
  // ---- Helpers ----
  get isShared() {
    return this.buffer instanceof SharedArrayBuffer;
  }
};

// src/worker-adapter-browser.ts
var BrowserWorkerAdapter = class {
  entryUrl;
  constructor(entryUrl) {
    this.entryUrl = entryUrl;
  }
  createWorker(workerData) {
    const worker = new Worker(this.entryUrl, { type: "module" });
    const handle = new BrowserWorkerHandle(worker);
    worker.postMessage(workerData);
    return handle;
  }
};
var BrowserWorkerHandle = class {
  worker;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers = /* @__PURE__ */ new Map();
  terminated = false;
  constructor(worker) {
    this.worker = worker;
    worker.onmessage = (e) => {
      for (const h of this.handlers.get("message") ?? []) h(e.data);
    };
    worker.onerror = (e) => {
      for (const h of this.handlers.get("error") ?? []) h(new Error(e.message));
      if (!this.terminated) {
        this.terminated = true;
        for (const h of this.handlers.get("exit") ?? []) h(1);
      }
    };
  }
  postMessage(message, transfer) {
    this.worker.postMessage(message, transfer ?? []);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, handler) {
    let set = this.handlers.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.handlers.set(event, set);
    }
    set.add(handler);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }
  async terminate() {
    this.worker.terminate();
    if (!this.terminated) {
      this.terminated = true;
      for (const h of this.handlers.get("exit") ?? []) h(0);
    }
    return 0;
  }
};

// src/dylink.ts
var WASM_DYLINK_MEM_INFO = 1;
var WASM_DYLINK_NEEDED = 2;
var WASM_DYLINK_EXPORT_INFO = 3;
var WASM_DYLINK_IMPORT_INFO = 4;
var WASM_DYLINK_FLAG_TLS = 1;
var WASM_DYLINK_FLAG_WEAK = 2;
function readVarUint(data, offset) {
  let result = 0;
  let shift = 0;
  let byte;
  do {
    byte = data[offset.value++];
    result |= (byte & 127) << shift;
    shift += 7;
  } while (byte & 128);
  return result >>> 0;
}
function readString(data, offset) {
  const len = readVarUint(data, offset);
  const bytes = data.subarray(offset.value, offset.value + len);
  offset.value += len;
  return new TextDecoder().decode(bytes);
}
function parseDylinkSection(wasmBytes) {
  if (wasmBytes.length < 8) return null;
  if (wasmBytes[0] !== 0 || wasmBytes[1] !== 97 || wasmBytes[2] !== 115 || wasmBytes[3] !== 109) {
    return null;
  }
  const offset = { value: 8 };
  if (offset.value >= wasmBytes.length) return null;
  const sectionId = wasmBytes[offset.value++];
  if (sectionId !== 0) return null;
  const sectionSize = readVarUint(wasmBytes, offset);
  const sectionEnd = offset.value + sectionSize;
  const name = readString(wasmBytes, offset);
  if (name !== "dylink.0") return null;
  const metadata = {
    memorySize: 0,
    memoryAlign: 0,
    tableSize: 0,
    tableAlign: 0,
    neededDynlibs: [],
    tlsExports: /* @__PURE__ */ new Set(),
    weakImports: /* @__PURE__ */ new Set()
  };
  while (offset.value < sectionEnd) {
    const subType = readVarUint(wasmBytes, offset);
    const subSize = readVarUint(wasmBytes, offset);
    const subEnd = offset.value + subSize;
    switch (subType) {
      case WASM_DYLINK_MEM_INFO:
        metadata.memorySize = readVarUint(wasmBytes, offset);
        metadata.memoryAlign = readVarUint(wasmBytes, offset);
        metadata.tableSize = readVarUint(wasmBytes, offset);
        metadata.tableAlign = readVarUint(wasmBytes, offset);
        break;
      case WASM_DYLINK_NEEDED: {
        const count = readVarUint(wasmBytes, offset);
        for (let i = 0; i < count; i++) {
          metadata.neededDynlibs.push(readString(wasmBytes, offset));
        }
        break;
      }
      case WASM_DYLINK_EXPORT_INFO: {
        const count = readVarUint(wasmBytes, offset);
        for (let i = 0; i < count; i++) {
          const symName = readString(wasmBytes, offset);
          const flags = readVarUint(wasmBytes, offset);
          if (flags & WASM_DYLINK_FLAG_TLS) {
            metadata.tlsExports.add(symName);
          }
        }
        break;
      }
      case WASM_DYLINK_IMPORT_INFO: {
        const count = readVarUint(wasmBytes, offset);
        for (let i = 0; i < count; i++) {
          const _module = readString(wasmBytes, offset);
          const field = readString(wasmBytes, offset);
          const flags = readVarUint(wasmBytes, offset);
          if (flags & WASM_DYLINK_FLAG_WEAK) {
            metadata.weakImports.add(field);
          }
        }
        break;
      }
      default:
        break;
    }
    offset.value = subEnd;
  }
  return metadata;
}
function alignUp(value, align) {
  return value + align - 1 & ~(align - 1);
}
function instantiateSharedLibrary(name, wasmBytes, metadata, options) {
  const memAlign = 1 << metadata.memoryAlign;
  let memoryBase = 0;
  if (metadata.memorySize > 0) {
    memoryBase = alignUp(options.heapPointer.value, memAlign);
    options.heapPointer.value = memoryBase + metadata.memorySize;
    const neededPages = Math.ceil(options.heapPointer.value / 65536);
    const currentPages = options.memory.buffer.byteLength / 65536;
    if (neededPages > currentPages) {
      options.memory.grow(neededPages - currentPages);
    }
    new Uint8Array(options.memory.buffer, memoryBase, metadata.memorySize).fill(0);
  }
  let tableBase = 0;
  if (metadata.tableSize > 0) {
    tableBase = options.table.length;
    options.table.grow(metadata.tableSize);
  }
  const memoryBaseGlobal = new WebAssembly.Global(
    { value: "i32", mutable: false },
    memoryBase
  );
  const tableBaseGlobal = new WebAssembly.Global(
    { value: "i32", mutable: false },
    tableBase
  );
  const getOrCreateGOTEntry = (symName) => {
    let entry = options.got.get(symName);
    if (!entry) {
      entry = new WebAssembly.Global({ value: "i32", mutable: true }, 0);
      options.got.set(symName, entry);
    }
    return entry;
  };
  const imports = {
    env: new Proxy({}, {
      get(_target, prop) {
        switch (prop) {
          case "memory":
            return options.memory;
          case "__indirect_function_table":
            return options.table;
          case "__memory_base":
            return memoryBaseGlobal;
          case "__table_base":
            return tableBaseGlobal;
          case "__stack_pointer":
            return options.stackPointer;
        }
        const sym = options.globalSymbols.get(prop);
        if (sym !== void 0) return sym;
        return void 0;
      },
      has(_target, prop) {
        if ([
          "memory",
          "__indirect_function_table",
          "__memory_base",
          "__table_base",
          "__stack_pointer"
        ].includes(prop)) return true;
        return options.globalSymbols.has(prop);
      }
    }),
    "GOT.mem": new Proxy({}, {
      get(_target, prop) {
        return getOrCreateGOTEntry(prop);
      }
    }),
    "GOT.func": new Proxy({}, {
      get(_target, prop) {
        return getOrCreateGOTEntry(prop);
      }
    })
  };
  const module = new WebAssembly.Module(wasmBytes);
  const instance = new WebAssembly.Instance(module, imports);
  const relocatedExports = {};
  for (const [exportName, exportValue] of Object.entries(instance.exports)) {
    if (exportValue instanceof WebAssembly.Global) {
      try {
        exportValue.value = exportValue.value;
        relocatedExports[exportName] = exportValue;
      } catch {
        relocatedExports[exportName] = new WebAssembly.Global(
          { value: "i32", mutable: false },
          exportValue.value + memoryBase
        );
      }
    } else {
      relocatedExports[exportName] = exportValue;
    }
  }
  for (const [exportName, exportValue] of Object.entries(relocatedExports)) {
    if (exportName.startsWith("__")) continue;
    if (typeof exportValue === "function") {
      const tableIdx = options.table.length;
      options.table.grow(1);
      options.table.set(tableIdx, exportValue);
      const gotEntry = options.got.get(exportName);
      if (gotEntry) {
        gotEntry.value = tableIdx;
      }
      options.globalSymbols.set(exportName, exportValue);
    } else if (exportValue instanceof WebAssembly.Global) {
      const addr = exportValue.value;
      const gotEntry = options.got.get(exportName);
      if (gotEntry) {
        gotEntry.value = addr;
      }
      options.globalSymbols.set(exportName, exportValue);
    }
  }
  const applyRelocs = instance.exports.__wasm_apply_data_relocs;
  if (applyRelocs) {
    applyRelocs();
  }
  const ctors = instance.exports.__wasm_call_ctors;
  if (ctors) {
    ctors();
  }
  const loaded = {
    instance,
    memoryBase,
    tableBase,
    exports: relocatedExports,
    metadata,
    name
  };
  options.loadedLibraries.set(name, loaded);
  return loaded;
}
function loadSharedLibrarySync(name, wasmBytes, options) {
  const existing = options.loadedLibraries.get(name);
  if (existing) return existing;
  const metadata = parseDylinkSection(wasmBytes);
  if (!metadata) {
    throw new Error(`${name}: not a shared library (no dylink.0 section)`);
  }
  for (const dep of metadata.neededDynlibs) {
    if (options.loadedLibraries.has(dep)) continue;
    if (!options.resolveLibrarySync) {
      throw new Error(`${name}: depends on ${dep} but no resolveLibrarySync callback provided`);
    }
    const depBytes = options.resolveLibrarySync(dep);
    if (!depBytes) {
      throw new Error(`${name}: dependency ${dep} not found`);
    }
    loadSharedLibrarySync(dep, depBytes, options);
  }
  return instantiateSharedLibrary(name, wasmBytes, metadata, options);
}
var DynamicLinker = class {
  options;
  handleCounter = 1;
  handleMap = /* @__PURE__ */ new Map();
  lastError = null;
  constructor(options) {
    this.options = options;
  }
  /** Open a shared library. Returns a handle (>0) or 0 on error. */
  dlopenSync(name, wasmBytes) {
    try {
      const lib = loadSharedLibrarySync(name, wasmBytes, this.options);
      for (const [h, l] of this.handleMap) {
        if (l === lib) return h;
      }
      const handle = this.handleCounter++;
      this.handleMap.set(handle, lib);
      this.lastError = null;
      return handle;
    } catch (e) {
      this.lastError = e instanceof Error ? e.message : String(e);
      return 0;
    }
  }
  /** Look up a symbol by name. Returns the function or address, or null. */
  dlsym(handle, symbolName) {
    const lib = this.handleMap.get(handle);
    if (!lib) {
      this.lastError = "invalid handle";
      return null;
    }
    const exp = lib.exports[symbolName];
    if (exp === void 0) {
      const global = this.options.globalSymbols.get(symbolName);
      if (global === void 0) {
        this.lastError = `symbol not found: ${symbolName}`;
        return null;
      }
      if (typeof global === "function") {
        this.lastError = null;
        return global;
      }
      if (global instanceof WebAssembly.Global) {
        this.lastError = null;
        return global.value;
      }
    }
    if (typeof exp === "function") {
      const table = this.options.table;
      for (let i = 0; i < table.length; i++) {
        if (table.get(i) === exp) {
          this.lastError = null;
          return i;
        }
      }
      const idx = table.length;
      table.grow(1);
      table.set(idx, exp);
      this.lastError = null;
      return idx;
    }
    if (exp instanceof WebAssembly.Global) {
      this.lastError = null;
      return exp.value;
    }
    this.lastError = `symbol not found: ${symbolName}`;
    return null;
  }
  /** Close a library handle. Returns 0 on success. */
  dlclose(handle) {
    if (!this.handleMap.has(handle)) {
      this.lastError = "invalid handle";
      return -1;
    }
    this.handleMap.delete(handle);
    this.lastError = null;
    return 0;
  }
  /** Get the last error message, or null if no error. */
  dlerror() {
    const err = this.lastError;
    this.lastError = null;
    return err;
  }
};

// src/worker-main.ts
init_wasi_detect();
function buildKernelImports(memory, channelOffset, argv, envVars) {
  const _argv = argv || [];
  const _envVars = envVars || [];
  const encoder2 = new TextEncoder();
  const n = (v) => typeof v === "bigint" ? Number(v) : v;
  return {
    // CRT argv support
    kernel_get_argc: () => _argv.length,
    kernel_argv_read: (index, bufPtr, bufMax) => {
      if (index >= _argv.length) return 0;
      const encoded = encoder2.encode(_argv[index]);
      const len = Math.min(encoded.length, bufMax);
      new Uint8Array(memory.buffer, n(bufPtr), len).set(encoded.subarray(0, len));
      return len;
    },
    // CRT environ support
    kernel_environ_count: () => _envVars.length,
    kernel_environ_get: (index, bufPtr, bufMax) => {
      if (index >= _envVars.length) return -1;
      const encoded = encoder2.encode(_envVars[index]);
      const len = Math.min(encoded.length, bufMax);
      new Uint8Array(memory.buffer, n(bufPtr), len).set(encoded.subarray(0, len));
      return len;
    },
    // Fork/exec state — not a fork child in centralized mode
    kernel_is_fork_child: () => 0,
    kernel_apply_fork_fd_actions: () => 0,
    kernel_get_fork_exec_path: (_buf, _max) => 0,
    kernel_get_fork_exec_argc: () => 0,
    kernel_get_fork_exec_argv: (_index, _buf, _max) => 0,
    kernel_push_argv: (_ptr, _len) => {
    },
    kernel_clear_fork_exec: () => 0,
    // Exec dispatches through channel
    kernel_execve: (_pathPtr) => -38,
    // ENOSYS
    // Exit dispatches through channel (SYS_EXIT)
    kernel_exit: (status) => {
      const view = new DataView(memory.buffer);
      const base = channelOffset;
      view.setInt32(base + 4, 34, true);
      view.setBigInt64(base + 8, BigInt(status), true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.store(i32, base / 4, 1);
      Atomics.notify(i32, base / 4, 1);
      while (Atomics.wait(i32, base / 4, 1) === "ok") {
      }
      Atomics.store(i32, base / 4, 0);
    },
    // Clone dispatches through channel (SYS_CLONE)
    kernel_clone: (fnPtr, stackPtr, flags, arg, ptidPtr, tlsPtr, ctidPtr) => {
      const SYS_CLONE_NR = 201;
      const CH_ARG_SIZE2 = 8;
      const CH_RETURN2 = 56;
      const CH_ERRNO2 = 64;
      const CH_DATA2 = 72;
      const view = new DataView(memory.buffer);
      const base = channelOffset;
      view.setInt32(base + 4, SYS_CLONE_NR, true);
      view.setBigInt64(base + 8 + 0 * CH_ARG_SIZE2, BigInt(flags), true);
      view.setBigInt64(base + 8 + 1 * CH_ARG_SIZE2, BigInt(stackPtr), true);
      view.setBigInt64(base + 8 + 2 * CH_ARG_SIZE2, BigInt(ptidPtr), true);
      view.setBigInt64(base + 8 + 3 * CH_ARG_SIZE2, BigInt(tlsPtr), true);
      view.setBigInt64(base + 8 + 4 * CH_ARG_SIZE2, BigInt(ctidPtr), true);
      view.setBigInt64(base + 8 + 5 * CH_ARG_SIZE2, 0n, true);
      view.setUint32(base + CH_DATA2, n(fnPtr), true);
      view.setUint32(base + CH_DATA2 + 4, n(arg), true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.store(i32, base / 4, 1);
      Atomics.notify(i32, base / 4, 1);
      while (Atomics.wait(i32, base / 4, 1) === "ok") {
      }
      const result = Number(view.getBigInt64(base + CH_RETURN2, true));
      const err = view.getUint32(base + CH_ERRNO2, true);
      Atomics.store(i32, base / 4, 0);
      if (err) return -err;
      return result;
    },
    // Fork dispatches through channel (SYS_FORK)
    kernel_fork: () => {
      const SYS_FORK_NR = 212;
      const CH_ARG_SIZE2 = 8;
      const CH_RETURN2 = 56;
      const CH_ERRNO2 = 64;
      const view = new DataView(memory.buffer);
      const base = channelOffset;
      view.setInt32(base + 4, SYS_FORK_NR, true);
      for (let i = 0; i < 6; i++) view.setBigInt64(base + 8 + i * CH_ARG_SIZE2, 0n, true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.store(i32, base / 4, 1);
      Atomics.notify(i32, base / 4, 1);
      while (Atomics.wait(i32, base / 4, 1) === "ok") {
      }
      const result = Number(view.getBigInt64(base + CH_RETURN2, true));
      const err = view.getUint32(base + CH_ERRNO2, true);
      Atomics.store(i32, base / 4, 0);
      if (err) return -err;
      return result;
    }
  };
}
function buildDlopenImports(memory, getTable, getStackPointer, getInstance) {
  let linker = null;
  const decoder2 = new TextDecoder();
  const DYLIB_MEMORY_BASE = 128 * 1024 * 1024;
  const getLinker = () => {
    if (linker) return linker;
    const table = getTable();
    const sp = getStackPointer();
    if (!table || !sp) throw new Error("dlopen: program has no table or stack pointer");
    const globalSymbols = /* @__PURE__ */ new Map();
    const inst = getInstance();
    if (inst) {
      for (const [name, exp] of Object.entries(inst.exports)) {
        if (typeof exp === "function" && !name.startsWith("__")) {
          globalSymbols.set(name, exp);
        }
      }
    }
    linker = new DynamicLinker({
      memory,
      table,
      stackPointer: sp,
      heapPointer: { value: DYLIB_MEMORY_BASE },
      globalSymbols,
      got: /* @__PURE__ */ new Map(),
      loadedLibraries: /* @__PURE__ */ new Map()
    });
    return linker;
  };
  return {
    __wasm_dlopen: (bytesPtr, bytesLen, namePtr, nameLen) => {
      const bytes = new Uint8Array(memory.buffer, bytesPtr, bytesLen);
      const bytesCopy = new Uint8Array(bytes);
      const nameBytes = new Uint8Array(memory.buffer, namePtr, nameLen);
      const name = decoder2.decode(nameBytes);
      return getLinker().dlopenSync(name, bytesCopy);
    },
    __wasm_dlsym: (handle, namePtr, nameLen) => {
      const nameBytes = new Uint8Array(memory.buffer, namePtr, nameLen);
      const name = decoder2.decode(nameBytes);
      const result = getLinker().dlsym(handle, name);
      return result === null ? 0 : result;
    },
    __wasm_dlclose: (handle) => {
      return getLinker().dlclose(handle);
    },
    __wasm_dlerror: (bufPtr, bufMax) => {
      const err = getLinker().dlerror();
      if (!err) return 0;
      const encoder2 = new TextEncoder();
      const encoded = encoder2.encode(err);
      const len = Math.min(encoded.length, bufMax);
      new Uint8Array(memory.buffer, bufPtr, len).set(encoded.subarray(0, len));
      return len;
    }
  };
}
function buildImportObject(module, memory, kernelImports, channelOffset, dlopenImports, getInstance, ptrWidth = 4) {
  const envImports = { memory };
  const n = (v) => typeof v === "bigint" ? Number(v) : v;
  const retPtr = (v) => ptrWidth === 8 ? BigInt(v) : v;
  const moduleImports = WebAssembly.Module.imports(module);
  if (moduleImports.some((i) => i.module === "env" && i.name === "__channel_base" && i.kind === "global")) {
    if (ptrWidth === 8) {
      envImports.__channel_base = new WebAssembly.Global({ value: "i64", mutable: true }, BigInt(channelOffset));
    } else {
      envImports.__channel_base = new WebAssembly.Global({ value: "i32", mutable: true }, channelOffset);
    }
  }
  if (dlopenImports) {
    Object.assign(envImports, dlopenImports);
  }
  if (getInstance) {
    const cppMalloc = (size) => {
      const inst = getInstance();
      const malloc = inst?.exports.malloc;
      if (!malloc) return ptrWidth === 8 ? 0n : 0;
      return malloc(size || (ptrWidth === 8 ? 1n : 1));
    };
    const cppFree = (ptr) => {
      const inst = getInstance();
      const free = inst?.exports.free;
      if (free) free(ptr);
    };
    envImports._Znwm = cppMalloc;
    envImports._Znam = cppMalloc;
    envImports._ZdlPv = cppFree;
    envImports._ZdlPvm = cppFree;
    envImports._ZdaPv = cppFree;
    envImports._ZdaPvm = cppFree;
    envImports._ZnwmRKSt9nothrow_t = cppMalloc;
    envImports._ZnamRKSt9nothrow_t = cppMalloc;
  }
  envImports.__cxa_guard_acquire = (guardPtr) => {
    const view = new Uint8Array(memory.buffer);
    if (view[n(guardPtr)]) return 0;
    return 1;
  };
  envImports.__cxa_guard_release = (guardPtr) => {
    const view = new Uint8Array(memory.buffer);
    view[n(guardPtr)] = 1;
  };
  envImports.__cxa_guard_abort = (_guardPtr) => {
  };
  envImports.__cxa_pure_virtual = () => {
    throw new Error("pure virtual method called");
  };
  envImports.__cxa_atexit = () => 0;
  envImports.__cxa_thread_atexit = () => 0;
  envImports._ZNSt3__122__libcpp_verbose_abortEPKcz = (_fmt, _args) => {
    throw new Error("libc++ verbose abort");
  };
  envImports["_ZNSt3__16__sortIRNS_6__lessIyyEEPyEEvT0_S5_T_"] = (_first, _last, _comp) => {
    throw new Error("libc++ sort called unexpectedly");
  };
  const dcTiClassCache = /* @__PURE__ */ new Map();
  envImports.__dynamic_cast = (srcPtr_, _srcType, dstType_, _src2dst) => {
    const srcPtr = n(srcPtr_);
    const dstType = n(dstType_);
    if (srcPtr === 0) return retPtr(0);
    const view = new DataView(memory.buffer);
    const memSize = memory.buffer.byteLength;
    const PS = ptrWidth;
    const readPtr = (addr) => PS === 8 ? Number(view.getBigUint64(addr, true)) : view.getUint32(addr, true);
    const readSPtr = (addr) => PS === 8 ? Number(view.getBigInt64(addr, true)) : view.getInt32(addr, true);
    const vtablePtr = readPtr(srcPtr);
    if (vtablePtr === 0 || vtablePtr >= memSize) return retPtr(0);
    if (vtablePtr < 2 * PS) return retPtr(0);
    const rttiPtr = readPtr(vtablePtr - PS);
    if (rttiPtr === 0 || rttiPtr >= memSize) return retPtr(0);
    const offsetToTop = readSPtr(vtablePtr - 2 * PS);
    if (rttiPtr === dstType) return retPtr(srcPtr + offsetToTop);
    const TI_FIELD2 = 2 * PS;
    const BASE_INFO_STRIDE = PS + PS;
    const tiClassCache = dcTiClassCache;
    const isTypeAncestor = (ti, target, visited) => {
      if (ti === target) return true;
      if (ti === 0 || ti >= memSize || visited.has(ti)) return false;
      visited.add(ti);
      if (ti + TI_FIELD2 + PS > memSize) return false;
      const cached = tiClassCache.get(ti);
      if (cached === 0) return false;
      if (cached === 1) {
        const basePtr = readPtr(ti + TI_FIELD2);
        return isTypeAncestor(basePtr, target, visited);
      }
      if (cached === 2) {
        const baseCount = view.getUint32(ti + TI_FIELD2 + 4, true);
        for (let i = 0; i < baseCount; i++) {
          const baseType = readPtr(ti + TI_FIELD2 + 8 + i * BASE_INFO_STRIDE);
          if (baseType > 0 && isTypeAncestor(baseType, target, visited)) return true;
        }
        return false;
      }
      const field2 = readPtr(ti + TI_FIELD2);
      if (field2 > 256 && field2 + PS <= memSize) {
        const possibleTiName = readPtr(field2 + PS);
        if (possibleTiName > 0 && possibleTiName < memSize) {
          tiClassCache.set(ti, 1);
          if (isTypeAncestor(field2, target, visited)) return true;
          tiClassCache.delete(ti);
        }
      }
      const flags32 = view.getUint32(ti + TI_FIELD2, true);
      if (flags32 <= 3 && ti + TI_FIELD2 + 8 <= memSize) {
        const baseCount = view.getUint32(ti + TI_FIELD2 + 4, true);
        if (baseCount > 0 && baseCount < 100 && ti + TI_FIELD2 + 8 + baseCount * BASE_INFO_STRIDE <= memSize) {
          tiClassCache.set(ti, 2);
          for (let i = 0; i < baseCount; i++) {
            const baseType = readPtr(ti + TI_FIELD2 + 8 + i * BASE_INFO_STRIDE);
            if (baseType > 0 && isTypeAncestor(baseType, target, visited)) return true;
          }
          return false;
        }
      }
      tiClassCache.set(ti, 0);
      return false;
    };
    if (isTypeAncestor(rttiPtr, dstType, /* @__PURE__ */ new Set())) {
      return retPtr(srcPtr + offsetToTop);
    }
    return retPtr(0);
  };
  envImports["_ZNSt3__16__sortIRNS_6__lessIyyEEPyEEvT0_S5_T_"] = (begin_, end_) => {
    const begin = n(begin_), end = n(end_);
    const view = new DataView(memory.buffer);
    const count = (end - begin) / 8;
    const arr = [];
    for (let i = 0; i < count; i++) arr.push(view.getBigUint64(begin + i * 8, true));
    arr.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    for (let i = 0; i < count; i++) view.setBigUint64(begin + i * 8, arr[i], true);
  };
  for (const imp of WebAssembly.Module.imports(module)) {
    if (imp.kind !== "function") continue;
    if (imp.module === "env") {
      if (!envImports[imp.name]) {
        envImports[imp.name] = (..._args) => {
          throw new Error(`Unimplemented import: env.${imp.name}`);
        };
      }
    } else if (imp.module === "kernel") {
      if (!kernelImports[imp.name]) {
        kernelImports[imp.name] = (..._args) => 0;
      }
    }
  }
  const importObject = { env: envImports };
  if (Object.keys(kernelImports).length > 0) {
    importObject.kernel = kernelImports;
  }
  return importObject;
}
var ASYNCIFY_BUF_SIZE = 16384;
function verifyProgramAbi(instance, expected, pid) {
  if (expected === void 0) {
    return;
  }
  const fn = instance.exports.__abi_version;
  if (typeof fn !== "function") {
    if (!abiMissingWarned) {
      abiMissingWarned = true;
      console.warn(
        `[worker] pid=${pid}: user program lacks __abi_version export \u2014 legacy binary predates ABI marker rollout. Rebuild against the current glue (channel_syscall.c) to pick up the check. See docs/abi-versioning.md.`
      );
    }
    return;
  }
  const actual = fn();
  if (actual !== expected) {
    throw new Error(
      `pid=${pid}: ABI version mismatch \u2014 kernel advertises ${expected}, user program built against ${actual}. Rebuild the program against the current kernel, or roll back the kernel to the matching version. See docs/abi-versioning.md.`
    );
  }
}
var abiMissingWarned = false;
async function centralizedWorkerMain(port, initData) {
  try {
    const { memory, programBytes, channelOffset, pid } = initData;
    const ptrWidth = initData.ptrWidth ?? 4;
    const module = initData.programModule ? initData.programModule : await WebAssembly.compile(programBytes);
    if (isWasiModule(module)) {
      if (wasiModuleDefinesMemory(module)) {
        throw new Error(
          "WASI module defines its own memory. Only modules that import memory (compiled with --import-memory) are supported."
        );
      }
      const { WasiShim: WasiShim2, WasiExit: WasiExit2 } = await Promise.resolve().then(() => (init_wasi_shim(), wasi_shim_exports));
      const wasiShim = new WasiShim2(
        memory,
        channelOffset,
        initData.argv || [],
        initData.env || []
      );
      const wasiImports = wasiShim.getImports();
      const importObject = {
        wasi_snapshot_preview1: wasiImports,
        env: { memory }
      };
      const moduleImports = WebAssembly.Module.imports(module);
      for (const imp of moduleImports) {
        if (imp.module === "env" && imp.name !== "memory") {
          if (!importObject.env[imp.name]) {
            importObject.env[imp.name] = imp.kind === "function" ? (..._args) => {
              throw new Error(`Unimplemented WASI env import: ${imp.name}`);
            } : void 0;
          }
        }
      }
      const instance = await WebAssembly.instantiate(module, importObject);
      wasiShim.init();
      port.postMessage({ type: "ready", pid });
      let exitCode = 0;
      try {
        const start = instance.exports._start;
        if (start) start();
      } catch (e) {
        if (e instanceof WasiExit2) {
          exitCode = e.code;
        } else if (e instanceof Error && e.message.includes("unreachable")) {
          exitCode = 0;
        } else {
          throw e;
        }
      }
      port.postMessage({ type: "exit", pid, status: exitCode });
      return;
    }
    const kernelImports = buildKernelImports(
      memory,
      channelOffset,
      initData.argv || [],
      initData.env || []
    );
    const moduleExports = WebAssembly.Module.exports(module);
    const hasAsyncify = moduleExports.some((e) => e.name === "asyncify_get_state");
    let forkResult = 0;
    const asyncifyBufAddr = channelOffset - ASYNCIFY_BUF_SIZE;
    if (hasAsyncify) {
      let processInstance = null;
      kernelImports.kernel_fork = () => {
        if (!processInstance) return -38;
        const getState = processInstance.exports.asyncify_get_state;
        const state = getState();
        if (state === 2) {
          processInstance.exports.asyncify_stop_rewind();
          return forkResult;
        }
        const view = new DataView(memory.buffer);
        view.setInt32(asyncifyBufAddr, asyncifyBufAddr + 8, true);
        view.setInt32(asyncifyBufAddr + 4, asyncifyBufAddr + ASYNCIFY_BUF_SIZE, true);
        processInstance.exports.asyncify_start_unwind(asyncifyBufAddr);
        return 0;
      };
      const dlopenImports = buildDlopenImports(
        memory,
        () => processInstance?.exports.__indirect_function_table,
        () => processInstance?.exports.__stack_pointer,
        () => processInstance ?? void 0
      );
      const importObject = buildImportObject(
        module,
        memory,
        kernelImports,
        channelOffset,
        dlopenImports,
        () => processInstance ?? void 0,
        ptrWidth
      );
      const instance = await WebAssembly.instantiate(module, importObject);
      processInstance = instance;
      verifyProgramAbi(instance, initData.kernelAbiVersion, pid);
      if (initData.isForkChild && initData.asyncifyBufAddr != null) {
        const view = new DataView(memory.buffer);
        const tlsBaseGlobal = instance.exports.__tls_base;
        if (tlsBaseGlobal) {
          if (ptrWidth === 8) {
            const savedBase = Number(view.getBigUint64(initData.asyncifyBufAddr - 8, true));
            if (savedBase > 0) tlsBaseGlobal.value = BigInt(savedBase);
          } else {
            const savedBase = view.getUint32(initData.asyncifyBufAddr - 4, true);
            if (savedBase > 0) tlsBaseGlobal.value = savedBase;
          }
        }
        const stackPtrGlobal = instance.exports.__stack_pointer;
        if (stackPtrGlobal) {
          if (ptrWidth === 8) {
            const savedSp = Number(view.getBigUint64(initData.asyncifyBufAddr - 16, true));
            if (savedSp > 0) stackPtrGlobal.value = BigInt(savedSp);
          } else {
            const savedSp = view.getUint32(initData.asyncifyBufAddr - 8, true);
            if (savedSp > 0) stackPtrGlobal.value = savedSp;
          }
        }
      }
      setupChannelBase(instance, module, memory, channelOffset, programBytes, ptrWidth);
      port.postMessage({ type: "ready", pid });
      let exitCode = 0;
      try {
        const start = instance.exports._start;
        const getState = instance.exports.asyncify_get_state;
        const stopUnwind = instance.exports.asyncify_stop_unwind;
        const startRewind = instance.exports.asyncify_start_rewind;
        let needsRewind = !!initData.isForkChild;
        if (needsRewind) {
          forkResult = 0;
        }
        const rewindAddr = initData.isForkChild && initData.asyncifyBufAddr != null ? initData.asyncifyBufAddr : asyncifyBufAddr;
        for (; ; ) {
          if (needsRewind) {
            startRewind(rewindAddr);
            needsRewind = false;
          }
          try {
            start();
          } catch (e) {
            if (e instanceof Error && e.message.includes("unreachable")) {
              break;
            }
            throw e;
          }
          const asyncState = getState();
          if (asyncState === 1) {
            stopUnwind();
            saveParentTls(instance, memory, asyncifyBufAddr, ptrWidth);
            const childPid = sendForkSyscall(memory, channelOffset);
            if (childPid < 0) {
              throw new Error(`Fork failed: errno=${-childPid}`);
            }
            forkResult = childPid;
            needsRewind = true;
            continue;
          }
          break;
        }
      } catch (e) {
        if (!(e instanceof Error && e.message.includes("unreachable"))) {
          throw e;
        }
      }
      port.postMessage({ type: "exit", pid, status: exitCode });
    } else {
      if (initData.isForkChild) {
        let firstFork = true;
        const origKernelFork = kernelImports.kernel_fork;
        kernelImports.kernel_fork = () => {
          if (firstFork) {
            firstFork = false;
            return 0;
          }
          return origKernelFork();
        };
      }
      let processInstance = null;
      const dlopenImports = buildDlopenImports(
        memory,
        () => processInstance?.exports.__indirect_function_table,
        () => processInstance?.exports.__stack_pointer,
        () => processInstance ?? void 0
      );
      const importObject = buildImportObject(
        module,
        memory,
        kernelImports,
        channelOffset,
        dlopenImports,
        () => processInstance ?? void 0,
        ptrWidth
      );
      const instance = await WebAssembly.instantiate(module, importObject);
      processInstance = instance;
      verifyProgramAbi(instance, initData.kernelAbiVersion, pid);
      setupChannelBase(instance, module, memory, channelOffset, programBytes, ptrWidth);
      port.postMessage({ type: "ready", pid });
      let exitCode = 0;
      try {
        const start = instance.exports._start;
        if (start) start();
      } catch (e) {
        if (e instanceof Error && e.message.includes("unreachable")) {
          console.error(`[worker] pid=${pid} _start() hit unreachable trap: ${e.message}`);
          exitCode = 0;
        } else {
          throw e;
        }
      }
      console.error(`[worker] pid=${pid} _start() returned, exitCode=${exitCode}`);
      port.postMessage({ type: "exit", pid, status: exitCode });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.message}
${err.stack}` : String(err);
    port.postMessage({
      type: "error",
      pid: initData.pid,
      message: `Centralized worker failed: ${errMsg}`
    });
  }
}
function detectChannelBaseTlsOffset(programBytes) {
  const src = new Uint8Array(programBytes);
  if (src.length < 8) return -1;
  function readLEB128(buf, off) {
    let result = 0, shift = 0, pos = off;
    for (; ; ) {
      const byte = buf[pos++];
      result |= (byte & 127) << shift;
      if ((byte & 128) === 0) break;
      shift += 7;
    }
    return [result, pos - off];
  }
  const sections = [];
  let numFuncImports = 0;
  let offset = 8;
  while (offset < src.length) {
    const sectionId = src[offset];
    const [sectionSize, sizeBytes] = readLEB128(src, offset + 1);
    sections.push({ id: sectionId, contentOffset: offset + 1 + sizeBytes, contentSize: sectionSize });
    offset += 1 + sizeBytes + sectionSize;
  }
  for (const sec of sections) {
    if (sec.id === 2) {
      let pos = sec.contentOffset;
      const [importCount, countBytes] = readLEB128(src, pos);
      pos += countBytes;
      for (let i = 0; i < importCount; i++) {
        const [modLen, modLenBytes] = readLEB128(src, pos);
        pos += modLenBytes + modLen;
        const [fieldLen, fieldLenBytes] = readLEB128(src, pos);
        pos += fieldLenBytes + fieldLen;
        const kind = src[pos++];
        if (kind === 0) {
          numFuncImports++;
          const [, n] = readLEB128(src, pos);
          pos += n;
        } else if (kind === 1) {
          pos++;
          const f = src[pos++];
          const [, n] = readLEB128(src, pos);
          pos += n;
          if (f & 1) {
            const [, n2] = readLEB128(src, pos);
            pos += n2;
          }
        } else if (kind === 2) {
          const f = src[pos++];
          const [, n] = readLEB128(src, pos);
          pos += n;
          if (f & 1) {
            const [, n2] = readLEB128(src, pos);
            pos += n2;
          }
        } else if (kind === 3) {
          pos += 2;
        }
      }
      break;
    }
  }
  let channelBaseExportFuncIdx = -1;
  for (const sec of sections) {
    if (sec.id === 7) {
      let pos = sec.contentOffset;
      const [exportCount, countBytes] = readLEB128(src, pos);
      pos += countBytes;
      for (let i = 0; i < exportCount; i++) {
        const [nameLen, nameLenBytes] = readLEB128(src, pos);
        pos += nameLenBytes;
        const name = new TextDecoder().decode(src.subarray(pos, pos + nameLen));
        pos += nameLen;
        const kind = src[pos++];
        const [idx, idxBytes] = readLEB128(src, pos);
        pos += idxBytes;
        if (kind === 0 && name === "__get_channel_base_addr") {
          channelBaseExportFuncIdx = idx;
          break;
        }
      }
      break;
    }
  }
  if (channelBaseExportFuncIdx < 0) return -1;
  const exportCodeEntry = channelBaseExportFuncIdx - numFuncImports;
  if (exportCodeEntry < 0) return -1;
  for (const sec of sections) {
    if (sec.id !== 10) continue;
    let pos = sec.contentOffset;
    const [, funcCountBytes] = readLEB128(src, pos);
    pos += funcCountBytes;
    for (let i = 0; i < exportCodeEntry; i++) {
      const [bodySize, bodySizeBytes2] = readLEB128(src, pos);
      pos += bodySizeBytes2 + bodySize;
    }
    const [, bodySizeBytes] = readLEB128(src, pos);
    pos += bodySizeBytes;
    const [localCount, lcBytes] = readLEB128(src, pos);
    pos += lcBytes;
    for (let i = 0; i < localCount; i++) {
      const [, n] = readLEB128(src, pos);
      pos += n;
      pos++;
    }
    const I32_CONST = 65;
    const I64_CONST = 66;
    if (src[pos] === I32_CONST || src[pos] === I64_CONST) {
      pos++;
      const [tlsOffset2] = readLEB128(src, pos);
      return tlsOffset2;
    }
    if (src[pos] === 35) {
      let p3 = pos + 1;
      const [, globalIdxBytes] = readLEB128(src, p3);
      p3 += globalIdxBytes;
      if (src[p3] === I32_CONST || src[p3] === I64_CONST) {
        p3++;
        const [tlsOffset2] = readLEB128(src, p3);
        return tlsOffset2;
      }
    }
    if (src[pos] !== 16) return -1;
    pos++;
    const [, ctorIdxBytes] = readLEB128(src, pos);
    pos += ctorIdxBytes;
    if (src[pos] !== 16) return -1;
    pos++;
    const [actualFuncIdx] = readLEB128(src, pos);
    const actualCodeEntry = actualFuncIdx - numFuncImports;
    if (actualCodeEntry < 0) return -1;
    let pos2 = sec.contentOffset;
    const [, fcb2] = readLEB128(src, pos2);
    pos2 += fcb2;
    for (let i = 0; i < actualCodeEntry; i++) {
      const [bs, bsb] = readLEB128(src, pos2);
      pos2 += bsb + bs;
    }
    const [, bsb2] = readLEB128(src, pos2);
    pos2 += bsb2;
    const [lc2, lcb2] = readLEB128(src, pos2);
    pos2 += lcb2;
    for (let i = 0; i < lc2; i++) {
      const [, n] = readLEB128(src, pos2);
      pos2 += n;
      pos2++;
    }
    if (src[pos2] !== I32_CONST && src[pos2] !== I64_CONST) return -1;
    pos2++;
    const [tlsOffset] = readLEB128(src, pos2);
    return tlsOffset;
  }
  return -1;
}
function setupChannelBase(instance, module, memory, channelOffset, programBytes, ptrWidth = 4) {
  const moduleImports = WebAssembly.Module.imports(module);
  if (moduleImports.some((i) => i.module === "env" && i.name === "__channel_base" && i.kind === "global")) {
    return;
  }
  const tlsBase = instance.exports.__tls_base;
  const view = new DataView(memory.buffer);
  const tlsAddr = tlsBase ? Number(tlsBase.value) : 0;
  if (tlsAddr > 0) {
    let detectedOffset = -1;
    if (programBytes) {
      detectedOffset = detectChannelBaseTlsOffset(programBytes);
    }
    const addr = tlsAddr + (detectedOffset >= 0 ? detectedOffset : 0);
    if (ptrWidth === 8) {
      view.setBigUint64(addr, BigInt(channelOffset), true);
    } else {
      view.setUint32(addr, channelOffset, true);
    }
  }
}
function saveParentTls(instance, memory, asyncifyBufAddr, ptrWidth = 4) {
  const view = new DataView(memory.buffer);
  const tlsBaseGlobal = instance.exports.__tls_base;
  if (tlsBaseGlobal) {
    const tlsBase = Number(tlsBaseGlobal.value);
    if (tlsBase > 0) {
      if (ptrWidth === 8) {
        view.setBigUint64(asyncifyBufAddr - 8, BigInt(tlsBase), true);
      } else {
        view.setUint32(asyncifyBufAddr - 4, tlsBase, true);
      }
    }
  }
  const stackPtrGlobal = instance.exports.__stack_pointer;
  if (stackPtrGlobal) {
    const stackPtr = Number(stackPtrGlobal.value);
    if (stackPtr > 0) {
      if (ptrWidth === 8) {
        view.setBigUint64(asyncifyBufAddr - 16, BigInt(stackPtr), true);
      } else {
        view.setUint32(asyncifyBufAddr - 8, stackPtr, true);
      }
    }
  }
}
function sendForkSyscall(memory, channelOffset) {
  const SYS_FORK_NR = 212;
  const CH_SYSCALL2 = 4;
  const CH_ARGS2 = 8;
  const CH_ARG_SIZE2 = 8;
  const CH_RETURN2 = 56;
  const CH_ERRNO2 = 64;
  const view = new DataView(memory.buffer);
  view.setInt32(channelOffset + CH_SYSCALL2, SYS_FORK_NR, true);
  for (let i = 0; i < 6; i++) {
    view.setBigInt64(channelOffset + CH_ARGS2 + i * CH_ARG_SIZE2, 0n, true);
  }
  const i32 = new Int32Array(memory.buffer);
  Atomics.store(i32, channelOffset / 4, 1);
  Atomics.notify(i32, channelOffset / 4, 1);
  while (Atomics.wait(i32, channelOffset / 4, 1) === "ok") {
  }
  const result = Number(view.getBigInt64(channelOffset + CH_RETURN2, true));
  const err = view.getUint32(channelOffset + CH_ERRNO2, true);
  Atomics.store(i32, channelOffset / 4, 0);
  if (err) return -err;
  return result;
}

// src/vfs/vfs.ts
function normalizeMountPoint(mp) {
  if (mp !== "/" && mp.endsWith("/")) {
    return mp.slice(0, -1);
  }
  return mp;
}
var VirtualPlatformIO = class {
  mounts;
  time;
  fileHandles = /* @__PURE__ */ new Map();
  dirHandles = /* @__PURE__ */ new Map();
  nextFileHandle = 100;
  nextDirHandle = 1;
  network;
  constructor(mounts, time) {
    this.mounts = mounts.map((m) => ({
      prefix: normalizeMountPoint(m.mountPoint),
      backend: m.backend
    })).sort((a, b) => b.prefix.length - a.prefix.length);
    this.time = time;
    if (this.mounts.length === 0) {
      throw new Error("VirtualPlatformIO requires at least one mount");
    }
  }
  resolve(path) {
    for (const m of this.mounts) {
      if (m.prefix === "/") {
        return { backend: m.backend, relativePath: path };
      }
      if (path === m.prefix || path.startsWith(m.prefix + "/")) {
        let rel = path.slice(m.prefix.length);
        if (!rel.startsWith("/")) rel = "/" + rel;
        return { backend: m.backend, relativePath: rel };
      }
    }
    throw new Error(`ENOENT: no mount for path: ${path}`);
  }
  resolveTwoPaths(path1, path2) {
    const r1 = this.resolve(path1);
    const r2 = this.resolve(path2);
    if (r1.backend !== r2.backend) {
      throw new Error("EXDEV: cross-device link");
    }
    return { backend: r1.backend, rel1: r1.relativePath, rel2: r2.relativePath };
  }
  getFileHandle(handle) {
    const info = this.fileHandles.get(handle);
    if (!info) throw new Error(`EBADF: invalid file handle ${handle}`);
    return info;
  }
  getDirHandle(handle) {
    const info = this.dirHandles.get(handle);
    if (!info) throw new Error(`EBADF: invalid dir handle ${handle}`);
    return info;
  }
  // --- File handle operations ---
  open(path, flags, mode) {
    const { backend, relativePath } = this.resolve(path);
    const localHandle = backend.open(relativePath, flags, mode);
    const globalHandle = this.nextFileHandle++;
    this.fileHandles.set(globalHandle, { backend, localHandle });
    return globalHandle;
  }
  close(handle) {
    const info = this.getFileHandle(handle);
    const result = info.backend.close(info.localHandle);
    this.fileHandles.delete(handle);
    return result;
  }
  read(handle, buffer, offset, length) {
    const info = this.getFileHandle(handle);
    return info.backend.read(info.localHandle, buffer, offset, length);
  }
  write(handle, buffer, offset, length) {
    const info = this.getFileHandle(handle);
    return info.backend.write(info.localHandle, buffer, offset, length);
  }
  seek(handle, offset, whence) {
    const info = this.getFileHandle(handle);
    return info.backend.seek(info.localHandle, offset, whence);
  }
  fstat(handle) {
    const info = this.getFileHandle(handle);
    return info.backend.fstat(info.localHandle);
  }
  ftruncate(handle, length) {
    const info = this.getFileHandle(handle);
    info.backend.ftruncate(info.localHandle, length);
  }
  fsync(handle) {
    const info = this.getFileHandle(handle);
    info.backend.fsync(info.localHandle);
  }
  fchmod(handle, mode) {
    const info = this.getFileHandle(handle);
    info.backend.fchmod(info.localHandle, mode);
  }
  fchown(handle, uid, gid) {
    const info = this.getFileHandle(handle);
    info.backend.fchown(info.localHandle, uid, gid);
  }
  // --- Path-based operations ---
  stat(path) {
    const { backend, relativePath } = this.resolve(path);
    return backend.stat(relativePath);
  }
  lstat(path) {
    const { backend, relativePath } = this.resolve(path);
    return backend.lstat(relativePath);
  }
  mkdir(path, mode) {
    const { backend, relativePath } = this.resolve(path);
    backend.mkdir(relativePath, mode);
  }
  rmdir(path) {
    const { backend, relativePath } = this.resolve(path);
    backend.rmdir(relativePath);
  }
  unlink(path) {
    const { backend, relativePath } = this.resolve(path);
    backend.unlink(relativePath);
  }
  rename(oldPath, newPath) {
    const { backend, rel1, rel2 } = this.resolveTwoPaths(oldPath, newPath);
    backend.rename(rel1, rel2);
  }
  link(existingPath, newPath) {
    const { backend, rel1, rel2 } = this.resolveTwoPaths(existingPath, newPath);
    backend.link(rel1, rel2);
  }
  symlink(target, path) {
    const { backend, relativePath } = this.resolve(path);
    backend.symlink(target, relativePath);
  }
  readlink(path) {
    const { backend, relativePath } = this.resolve(path);
    return backend.readlink(relativePath);
  }
  chmod(path, mode) {
    const { backend, relativePath } = this.resolve(path);
    backend.chmod(relativePath, mode);
  }
  chown(path, uid, gid) {
    const { backend, relativePath } = this.resolve(path);
    backend.chown(relativePath, uid, gid);
  }
  access(path, mode) {
    const { backend, relativePath } = this.resolve(path);
    backend.access(relativePath, mode);
  }
  utimensat(path, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    const { backend, relativePath } = this.resolve(path);
    backend.utimensat(relativePath, atimeSec, atimeNsec, mtimeSec, mtimeNsec);
  }
  // --- Directory operations ---
  opendir(path) {
    const { backend, relativePath } = this.resolve(path);
    const localHandle = backend.opendir(relativePath);
    const globalHandle = this.nextDirHandle++;
    this.dirHandles.set(globalHandle, { backend, localHandle });
    return globalHandle;
  }
  readdir(handle) {
    const info = this.getDirHandle(handle);
    return info.backend.readdir(info.localHandle);
  }
  closedir(handle) {
    const info = this.getDirHandle(handle);
    info.backend.closedir(info.localHandle);
    this.dirHandles.delete(handle);
  }
  // --- Time operations ---
  clockGettime(clockId) {
    return this.time.clockGettime(clockId);
  }
  nanosleep(sec, nsec) {
    this.time.nanosleep(sec, nsec);
  }
};

// src/vfs/sharedfs-vendor.ts
var BLOCK_SIZE = 4096;
var INODE_SIZE = 128;
var INODES_PER_BLOCK = BLOCK_SIZE / INODE_SIZE;
var MAX_NAME = 255;
var MAX_FDS = 64;
var MAX_SYMLINK_HOPS = 8;
var DIRECT_BLOCKS = 10;
var PTRS_PER_BLOCK = BLOCK_SIZE / 4;
var INLINE_SYMLINK_SIZE = DIRECT_BLOCKS * 4;
var ROOT_INO = 1;
var FD_TABLE_OFFSET = 256;
var MAGIC = 1397114451;
var VERSION = 1;
var S_IFREG2 = 32768;
var S_IFDIR2 = 16384;
var S_IFLNK2 = 40960;
var S_IFMT2 = 61440;
var O_RDONLY2 = 0;
var O_WRONLY = 1;
var O_CREAT2 = 64;
var O_TRUNC2 = 512;
var O_APPEND2 = 1024;
var O_DIRECTORY2 = 65536;
var O_ACCMODE = 3;
var SEEK_SET2 = 0;
var SEEK_CUR2 = 1;
var SEEK_END2 = 2;
var DIRENT_HEADER_SIZE = 8;
var EPERM = -1;
var ENOENT = -2;
var EIO = -5;
var EBADF = -9;
var EEXIST = -17;
var ENOTDIR = -20;
var EISDIR = -21;
var EINVAL = -22;
var EMFILE = -24;
var ENOSPC = -28;
var ENAMETOOLONG = -36;
var ENOTEMPTY = -39;
var ELOOP = -40;
var SB_MAGIC = 0;
var SB_VERSION = 4;
var SB_BLOCK_SIZE = 8;
var SB_TOTAL_BLOCKS = 12;
var SB_TOTAL_INODES = 16;
var SB_FREE_BLOCKS = 20;
var SB_FREE_INODES = 24;
var SB_INODE_BITMAP_START = 28;
var SB_BLOCK_BITMAP_START = 32;
var SB_INODE_TABLE_START = 36;
var SB_DATA_START = 40;
var SB_INODE_BITMAP_BLOCKS = 44;
var SB_BLOCK_BITMAP_BLOCKS = 48;
var SB_INODE_TABLE_BLOCKS = 52;
var SB_GENERATION = 56;
var SB_GLOBAL_LOCK = 60;
var SB_MAX_SIZE_BLOCKS = 68;
var SB_GROW_CHUNK_BLOCKS = 72;
var INO_LOCK_STATE = 0;
var INO_MODE = 8;
var INO_LINK_COUNT = 12;
var INO_SIZE = 16;
var INO_MTIME = 24;
var INO_CTIME = 32;
var INO_ATIME = 40;
var INO_DIRECT = 48;
var INO_INDIRECT = 88;
var INO_DOUBLE_INDIRECT = 92;
var FD_INO = 4;
var FD_OFFSET = 8;
var FD_FLAGS = 16;
var FD_IS_DIR = 20;
var FD_ENTRY_SIZE = 24;
var WRITER_BIT = 2147483648 | 0;
var READER_MASK = 2147483647 | 0;
var ERROR_MESSAGES = {
  [ENOENT]: "No such file or directory",
  [EIO]: "I/O error",
  [EBADF]: "Bad file descriptor",
  [EEXIST]: "File exists",
  [ENOTDIR]: "Not a directory",
  [EISDIR]: "Is a directory",
  [EINVAL]: "Invalid argument",
  [EMFILE]: "Too many open files",
  [ENOSPC]: "No space left on device",
  [ENAMETOOLONG]: "File name too long",
  [ENOTEMPTY]: "Directory not empty",
  [ELOOP]: "Too many symbolic links"
};
var SFSError = class extends Error {
  constructor(code, message) {
    super(message || ERROR_MESSAGES[code] || `Error ${code}`);
    this.code = code;
    this.name = "SFSError";
  }
};
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function safeDecode(view) {
  if (view.buffer instanceof SharedArrayBuffer) {
    return decoder.decode(new Uint8Array(view));
  }
  return decoder.decode(view);
}
function align4(x) {
  return x + 3 & ~3;
}
var SharedFS = class _SharedFS {
  constructor(buffer) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.i32 = new Int32Array(buffer);
    this.u8 = new Uint8Array(buffer);
  }
  view;
  i32;
  u8;
  // ── Factory methods ──────────────────────────────────────────────
  static mkfs(buffer, maxSizeBytes) {
    const sizeBytes = buffer.byteLength;
    if (sizeBytes < BLOCK_SIZE * 16) throw new SFSError(EINVAL);
    const totalBlocks = Math.floor(sizeBytes / BLOCK_SIZE);
    const maxBlocks = maxSizeBytes ? Math.floor(maxSizeBytes / BLOCK_SIZE) : totalBlocks * 4;
    let totalInodes = Math.floor(maxBlocks / 4);
    if (totalInodes < 32) totalInodes = 32;
    totalInodes = Math.ceil(totalInodes / INODES_PER_BLOCK) * INODES_PER_BLOCK;
    const inodeBitmapBlocks = Math.ceil(totalInodes / (BLOCK_SIZE * 8));
    const blockBitmapBlocks = Math.ceil(maxBlocks / (BLOCK_SIZE * 8));
    const inodeTableBlocks = Math.ceil(
      totalInodes * INODE_SIZE / BLOCK_SIZE
    );
    const inodeBitmapStart = 1;
    const blockBitmapStart = inodeBitmapStart + inodeBitmapBlocks;
    const inodeTableStart = blockBitmapStart + blockBitmapBlocks;
    const dataStart = inodeTableStart + inodeTableBlocks;
    if (dataStart >= totalBlocks) throw new SFSError(ENOSPC);
    new Uint8Array(buffer).fill(0);
    const fs = new _SharedFS(buffer);
    fs.w32(SB_MAGIC, MAGIC);
    fs.w32(SB_VERSION, VERSION);
    fs.w32(SB_BLOCK_SIZE, BLOCK_SIZE);
    fs.w32(SB_TOTAL_BLOCKS, totalBlocks);
    fs.w32(SB_TOTAL_INODES, totalInodes);
    fs.w32(SB_INODE_BITMAP_START, inodeBitmapStart);
    fs.w32(SB_BLOCK_BITMAP_START, blockBitmapStart);
    fs.w32(SB_INODE_TABLE_START, inodeTableStart);
    fs.w32(SB_DATA_START, dataStart);
    fs.w32(SB_INODE_BITMAP_BLOCKS, inodeBitmapBlocks);
    fs.w32(SB_BLOCK_BITMAP_BLOCKS, blockBitmapBlocks);
    fs.w32(SB_INODE_TABLE_BLOCKS, inodeTableBlocks);
    fs.w32(SB_MAX_SIZE_BLOCKS, maxBlocks);
    fs.w32(SB_GROW_CHUNK_BLOCKS, 256);
    const bbStart = blockBitmapStart * BLOCK_SIZE;
    for (let b = 0; b < dataStart; b++) {
      const wordIdx = (bbStart >> 2) + (b >> 5);
      fs.i32[wordIdx] |= 1 << (b & 31);
    }
    const freeDataBlocks = totalBlocks - dataStart;
    Atomics.store(fs.i32, SB_FREE_BLOCKS >> 2, freeDataBlocks);
    const ibStart = inodeBitmapStart * BLOCK_SIZE;
    fs.i32[ibStart >> 2] |= 3;
    Atomics.store(fs.i32, SB_FREE_INODES >> 2, totalInodes - 2);
    const rootOff = fs.inodeOffset(ROOT_INO);
    fs.w32(rootOff + INO_MODE, S_IFDIR2 | 493);
    fs.w32(rootOff + INO_LINK_COUNT, 2);
    const rootBlock = fs.blockAlloc();
    if (rootBlock < 0) throw new SFSError(ENOSPC);
    fs.w32(rootOff + INO_DIRECT, rootBlock);
    const dBase = rootBlock * BLOCK_SIZE;
    const dotRecLen = align4(DIRENT_HEADER_SIZE + 1);
    const dotdotRecLen = align4(DIRENT_HEADER_SIZE + 2);
    fs.w32(dBase, ROOT_INO);
    fs.view.setUint16(dBase + 4, dotRecLen, true);
    fs.view.setUint16(dBase + 6, 1, true);
    fs.u8[dBase + DIRENT_HEADER_SIZE] = 46;
    const ddOff = dBase + dotRecLen;
    fs.w32(ddOff, ROOT_INO);
    fs.view.setUint16(ddOff + 4, dotdotRecLen, true);
    fs.view.setUint16(ddOff + 6, 2, true);
    fs.u8[ddOff + DIRENT_HEADER_SIZE] = 46;
    fs.u8[ddOff + DIRENT_HEADER_SIZE + 1] = 46;
    fs.w64(rootOff + INO_SIZE, dotRecLen + dotdotRecLen);
    Atomics.store(fs.i32, SB_GENERATION >> 2, 1);
    return fs;
  }
  static mount(buffer) {
    const fs = new _SharedFS(buffer);
    if (fs.r32(SB_MAGIC) !== MAGIC) throw new SFSError(EINVAL, "Bad magic");
    if (fs.r32(SB_VERSION) !== VERSION)
      throw new SFSError(EINVAL, "Bad version");
    if (fs.r32(SB_BLOCK_SIZE) !== BLOCK_SIZE)
      throw new SFSError(EINVAL, "Bad block size");
    return fs;
  }
  // ── Low-level read/write helpers ─────────────────────────────────
  r32(off) {
    return this.view.getUint32(off, true);
  }
  w32(off, v) {
    this.view.setUint32(off, v, true);
  }
  r64(off) {
    return Number(this.view.getBigUint64(off, true));
  }
  w64(off, v) {
    this.view.setBigUint64(off, BigInt(v), true);
  }
  // ── Superblock lock (for grow) ───────────────────────────────────
  sbLock() {
    const idx = SB_GLOBAL_LOCK >> 2;
    for (; ; ) {
      const old = Atomics.compareExchange(this.i32, idx, 0, 1);
      if (old === 0) return;
      Atomics.wait(this.i32, idx, 1);
    }
  }
  sbUnlock() {
    const idx = SB_GLOBAL_LOCK >> 2;
    Atomics.store(this.i32, idx, 0);
    Atomics.notify(this.i32, idx, Infinity);
  }
  // ── Block allocator ──────────────────────────────────────────────
  blockAlloc() {
    const totalBlocks = this.r32(SB_TOTAL_BLOCKS);
    const bbStart = this.r32(SB_BLOCK_BITMAP_START) * BLOCK_SIZE;
    const numWords = Math.ceil(totalBlocks / 32);
    for (let w = 0; w < numWords; w++) {
      const idx = (bbStart >> 2) + w;
      const word = Atomics.load(this.i32, idx);
      if (word === -1) continue;
      for (let bit = 0; bit < 32; bit++) {
        const blockNo = w * 32 + bit;
        if (blockNo >= totalBlocks) return ENOSPC;
        if (word & 1 << bit) continue;
        const desired = word | 1 << bit;
        const old = Atomics.compareExchange(this.i32, idx, word, desired);
        if (old === word) {
          Atomics.sub(this.i32, SB_FREE_BLOCKS >> 2, 1);
          const off = blockNo * BLOCK_SIZE;
          this.u8.fill(0, off, off + BLOCK_SIZE);
          return blockNo;
        }
        w--;
        break;
      }
    }
    return ENOSPC;
  }
  blockAllocWithGrow() {
    let blk = this.blockAlloc();
    if (blk !== ENOSPC) return blk;
    const grew = this.grow();
    if (grew < 0) return ENOSPC;
    blk = this.blockAlloc();
    return blk;
  }
  blockFree(blockNo) {
    const bbStart = this.r32(SB_BLOCK_BITMAP_START) * BLOCK_SIZE;
    const idx = (bbStart >> 2) + (blockNo >> 5);
    const bit = blockNo & 31;
    for (; ; ) {
      const word = Atomics.load(this.i32, idx);
      const desired = word & ~(1 << bit);
      const old = Atomics.compareExchange(this.i32, idx, word, desired);
      if (old === word) break;
    }
    Atomics.add(this.i32, SB_FREE_BLOCKS >> 2, 1);
  }
  // ── Growth ───────────────────────────────────────────────────────
  grow() {
    this.sbLock();
    try {
      if (Atomics.load(this.i32, SB_FREE_BLOCKS >> 2) > 0) return 0;
      const current = this.r32(SB_TOTAL_BLOCKS);
      const maxBlocks = this.r32(SB_MAX_SIZE_BLOCKS);
      let growBy = this.r32(SB_GROW_CHUNK_BLOCKS);
      let newTotal = current + growBy;
      if (newTotal > maxBlocks) {
        newTotal = maxBlocks;
        growBy = newTotal - current;
        if (growBy === 0) return ENOSPC;
      }
      const neededBytes = newTotal * BLOCK_SIZE;
      if (this.buffer.byteLength < neededBytes) {
        try {
          this.buffer.grow(neededBytes);
          this.view = new DataView(this.buffer);
          this.i32 = new Int32Array(this.buffer);
          this.u8 = new Uint8Array(this.buffer);
        } catch {
          return ENOSPC;
        }
      }
      this.w32(SB_TOTAL_BLOCKS, newTotal);
      Atomics.add(this.i32, SB_FREE_BLOCKS >> 2, growBy);
      Atomics.add(this.i32, SB_GENERATION >> 2, 1);
      return 0;
    } finally {
      this.sbUnlock();
    }
  }
  // ── Inode helpers ────────────────────────────────────────────────
  inodeOffset(ino) {
    const tableStart = this.r32(SB_INODE_TABLE_START);
    const block = tableStart + Math.floor(ino / INODES_PER_BLOCK);
    const off = ino % INODES_PER_BLOCK * INODE_SIZE;
    return block * BLOCK_SIZE + off;
  }
  inodeAlloc() {
    const totalInodes = this.r32(SB_TOTAL_INODES);
    const ibStart = this.r32(SB_INODE_BITMAP_START) * BLOCK_SIZE;
    const numWords = Math.ceil(totalInodes / 32);
    for (let w = 0; w < numWords; w++) {
      const idx = (ibStart >> 2) + w;
      const word = Atomics.load(this.i32, idx);
      if (word === -1) continue;
      for (let bit = 0; bit < 32; bit++) {
        const ino = w * 32 + bit;
        if (ino >= totalInodes) return ENOSPC;
        if (word & 1 << bit) continue;
        const desired = word | 1 << bit;
        const old = Atomics.compareExchange(this.i32, idx, word, desired);
        if (old === word) {
          Atomics.sub(this.i32, SB_FREE_INODES >> 2, 1);
          const off = this.inodeOffset(ino);
          this.u8.fill(0, off, off + INODE_SIZE);
          return ino;
        }
        w--;
        break;
      }
    }
    return ENOSPC;
  }
  inodeFree(ino) {
    const ibStart = this.r32(SB_INODE_BITMAP_START) * BLOCK_SIZE;
    const idx = (ibStart >> 2) + (ino >> 5);
    const bit = ino & 31;
    for (; ; ) {
      const word = Atomics.load(this.i32, idx);
      const desired = word & ~(1 << bit);
      const old = Atomics.compareExchange(this.i32, idx, word, desired);
      if (old === word) break;
    }
    Atomics.add(this.i32, SB_FREE_INODES >> 2, 1);
  }
  // ── Inode locking ────────────────────────────────────────────────
  inodeReadLock(ino) {
    const lockIdx = this.inodeOffset(ino) + INO_LOCK_STATE >> 2;
    for (; ; ) {
      const cur = Atomics.load(this.i32, lockIdx);
      if (cur & WRITER_BIT) {
        Atomics.wait(this.i32, lockIdx, cur);
        continue;
      }
      const old = Atomics.compareExchange(
        this.i32,
        lockIdx,
        cur,
        cur + 1
      );
      if (old === cur) return;
    }
  }
  inodeReadUnlock(ino) {
    const lockIdx = this.inodeOffset(ino) + INO_LOCK_STATE >> 2;
    const prev = Atomics.sub(this.i32, lockIdx, 1);
    if ((prev & READER_MASK) === 1) {
      Atomics.notify(this.i32, lockIdx, 1);
    }
  }
  inodeWriteLock(ino) {
    const lockIdx = this.inodeOffset(ino) + INO_LOCK_STATE >> 2;
    for (; ; ) {
      const cur = Atomics.load(this.i32, lockIdx);
      if (cur !== 0) {
        Atomics.wait(this.i32, lockIdx, cur);
        continue;
      }
      const old = Atomics.compareExchange(
        this.i32,
        lockIdx,
        0,
        WRITER_BIT
      );
      if (old === 0) return;
    }
  }
  inodeWriteUnlock(ino) {
    const lockIdx = this.inodeOffset(ino) + INO_LOCK_STATE >> 2;
    Atomics.store(this.i32, lockIdx, 0);
    Atomics.notify(this.i32, lockIdx, Infinity);
  }
  // ── Inode block mapping ──────────────────────────────────────────
  inodeBlockMap(ino, fileBlock, allocate) {
    const inoOff = this.inodeOffset(ino);
    if (fileBlock < DIRECT_BLOCKS) {
      const ptr = this.r32(inoOff + INO_DIRECT + fileBlock * 4);
      if (ptr !== 0) return ptr;
      if (!allocate) return 0;
      const blk = this.blockAllocWithGrow();
      if (blk < 0) return blk;
      this.w32(inoOff + INO_DIRECT + fileBlock * 4, blk);
      return blk;
    }
    fileBlock -= DIRECT_BLOCKS;
    if (fileBlock < PTRS_PER_BLOCK) {
      let ind = this.r32(inoOff + INO_INDIRECT);
      if (ind === 0) {
        if (!allocate) return 0;
        ind = this.blockAllocWithGrow();
        if (ind < 0) return ind;
        this.w32(inoOff + INO_INDIRECT, ind);
      }
      const ptrOff = ind * BLOCK_SIZE + fileBlock * 4;
      const ptr = this.r32(ptrOff);
      if (ptr !== 0) return ptr;
      if (!allocate) return 0;
      const blk = this.blockAllocWithGrow();
      if (blk < 0) return blk;
      this.w32(ptrOff, blk);
      return blk;
    }
    fileBlock -= PTRS_PER_BLOCK;
    if (fileBlock < PTRS_PER_BLOCK * PTRS_PER_BLOCK) {
      const idx1 = Math.floor(fileBlock / PTRS_PER_BLOCK);
      const idx2 = fileBlock % PTRS_PER_BLOCK;
      let dind = this.r32(inoOff + INO_DOUBLE_INDIRECT);
      if (dind === 0) {
        if (!allocate) return 0;
        dind = this.blockAllocWithGrow();
        if (dind < 0) return dind;
        this.w32(inoOff + INO_DOUBLE_INDIRECT, dind);
      }
      const l1Off = dind * BLOCK_SIZE + idx1 * 4;
      let l1 = this.r32(l1Off);
      if (l1 === 0) {
        if (!allocate) return 0;
        l1 = this.blockAllocWithGrow();
        if (l1 < 0) return l1;
        this.w32(l1Off, l1);
      }
      const l2Off = l1 * BLOCK_SIZE + idx2 * 4;
      const ptr = this.r32(l2Off);
      if (ptr !== 0) return ptr;
      if (!allocate) return 0;
      const blk = this.blockAllocWithGrow();
      if (blk < 0) return blk;
      this.w32(l2Off, blk);
      return blk;
    }
    return EINVAL;
  }
  // ── Inode data I/O ───────────────────────────────────────────────
  inodeReadData(ino, offset, dst, count) {
    const inoOff = this.inodeOffset(ino);
    const size = this.r64(inoOff + INO_SIZE);
    if (offset >= size) return 0;
    if (offset + count > size) count = size - offset;
    let totalRead = 0;
    let dstPos = 0;
    while (count > 0) {
      const fileBlock = Math.floor(offset / BLOCK_SIZE);
      const blockOff = offset % BLOCK_SIZE;
      let chunk = BLOCK_SIZE - blockOff;
      if (chunk > count) chunk = count;
      const phys = this.inodeBlockMap(ino, fileBlock, false);
      if (phys <= 0) {
        dst.fill(0, dstPos, dstPos + chunk);
      } else {
        const src = phys * BLOCK_SIZE + blockOff;
        dst.set(this.u8.subarray(src, src + chunk), dstPos);
      }
      dstPos += chunk;
      offset += chunk;
      count -= chunk;
      totalRead += chunk;
    }
    return totalRead;
  }
  inodeWriteData(ino, offset, src, count) {
    const inoOff = this.inodeOffset(ino);
    let totalWritten = 0;
    let srcPos = 0;
    while (count > 0) {
      const fileBlock = Math.floor(offset / BLOCK_SIZE);
      const blockOff = offset % BLOCK_SIZE;
      let chunk = BLOCK_SIZE - blockOff;
      if (chunk > count) chunk = count;
      const phys = this.inodeBlockMap(ino, fileBlock, true);
      if (phys < 0) return totalWritten > 0 ? totalWritten : phys;
      const dstOff = phys * BLOCK_SIZE + blockOff;
      this.u8.set(src.subarray(srcPos, srcPos + chunk), dstOff);
      srcPos += chunk;
      offset += chunk;
      count -= chunk;
      totalWritten += chunk;
    }
    const size = this.r64(inoOff + INO_SIZE);
    if (offset > size) {
      this.w64(inoOff + INO_SIZE, offset);
    }
    return totalWritten;
  }
  freeBlocksFrom(ino, fromBlock) {
    const inoOff = this.inodeOffset(ino);
    for (let i = fromBlock; i < DIRECT_BLOCKS; i++) {
      const ptr = this.r32(inoOff + INO_DIRECT + i * 4);
      if (ptr) {
        this.blockFree(ptr);
        this.w32(inoOff + INO_DIRECT + i * 4, 0);
      }
    }
    const ind = this.r32(inoOff + INO_INDIRECT);
    if (ind) {
      const start = fromBlock > DIRECT_BLOCKS ? fromBlock - DIRECT_BLOCKS : 0;
      for (let i = start; i < PTRS_PER_BLOCK; i++) {
        const ptrOff = ind * BLOCK_SIZE + i * 4;
        const ptr = this.r32(ptrOff);
        if (ptr) {
          this.blockFree(ptr);
          this.w32(ptrOff, 0);
        }
      }
      if (start === 0) {
        this.blockFree(ind);
        this.w32(inoOff + INO_INDIRECT, 0);
      }
    }
    const dind = this.r32(inoOff + INO_DOUBLE_INDIRECT);
    if (dind) {
      const absStart = fromBlock > DIRECT_BLOCKS + PTRS_PER_BLOCK ? fromBlock - DIRECT_BLOCKS - PTRS_PER_BLOCK : 0;
      const i1Start = Math.floor(absStart / PTRS_PER_BLOCK);
      for (let i1 = i1Start; i1 < PTRS_PER_BLOCK; i1++) {
        const l1Off = dind * BLOCK_SIZE + i1 * 4;
        const l1 = this.r32(l1Off);
        if (!l1) continue;
        const i2Start = i1 === i1Start ? absStart % PTRS_PER_BLOCK : 0;
        for (let i2 = i2Start; i2 < PTRS_PER_BLOCK; i2++) {
          const l2Off = l1 * BLOCK_SIZE + i2 * 4;
          const ptr = this.r32(l2Off);
          if (ptr) {
            this.blockFree(ptr);
            this.w32(l2Off, 0);
          }
        }
        if (i2Start === 0) {
          this.blockFree(l1);
          this.w32(l1Off, 0);
        }
      }
      if (i1Start === 0) {
        this.blockFree(dind);
        this.w32(inoOff + INO_DOUBLE_INDIRECT, 0);
      }
    }
  }
  inodeTruncate(ino, newSize) {
    const inoOff = this.inodeOffset(ino);
    const curSize = this.r64(inoOff + INO_SIZE);
    if (newSize >= curSize) {
      this.w64(inoOff + INO_SIZE, newSize);
      return;
    }
    const keepBlocks = Math.ceil(newSize / BLOCK_SIZE);
    this.freeBlocksFrom(ino, keepBlocks);
    this.w64(inoOff + INO_SIZE, newSize);
  }
  // ── Directory operations ─────────────────────────────────────────
  dirLookup(dirIno, name) {
    const inoOff = this.inodeOffset(dirIno);
    const dirSize = this.r64(inoOff + INO_SIZE);
    let pos = 0;
    while (pos < dirSize) {
      const fileBlock = Math.floor(pos / BLOCK_SIZE);
      const blockOff = pos % BLOCK_SIZE;
      const phys = this.inodeBlockMap(dirIno, fileBlock, false);
      if (phys <= 0) return EIO;
      const blockBase = phys * BLOCK_SIZE;
      let remain = dirSize - pos;
      if (remain > BLOCK_SIZE - blockOff) remain = BLOCK_SIZE - blockOff;
      let off = blockOff;
      while (off < blockOff + remain) {
        const abs = blockBase + off;
        const entIno = this.r32(abs);
        const recLen = this.view.getUint16(abs + 4, true);
        const entNameLen = this.view.getUint16(abs + 6, true);
        if (recLen === 0) return EIO;
        if (entIno !== 0 && entNameLen === name.length) {
          let match = true;
          for (let i = 0; i < name.length; i++) {
            if (this.u8[abs + DIRENT_HEADER_SIZE + i] !== name[i]) {
              match = false;
              break;
            }
          }
          if (match) return entIno;
        }
        off += recLen;
      }
      pos += remain;
    }
    return ENOENT;
  }
  dirAddEntry(dirIno, name, childIno) {
    const inoOff = this.inodeOffset(dirIno);
    const dirSize = this.r64(inoOff + INO_SIZE);
    const needed = align4(DIRENT_HEADER_SIZE + name.length);
    let lastEntAbs = -1;
    let pos = 0;
    while (pos < dirSize) {
      const fileBlock2 = Math.floor(pos / BLOCK_SIZE);
      const blockOff2 = pos % BLOCK_SIZE;
      const phys2 = this.inodeBlockMap(dirIno, fileBlock2, false);
      if (phys2 <= 0) return EIO;
      const blockBase = phys2 * BLOCK_SIZE;
      let remain = dirSize - pos;
      if (remain > BLOCK_SIZE - blockOff2) remain = BLOCK_SIZE - blockOff2;
      let off = blockOff2;
      while (off < blockOff2 + remain) {
        const abs2 = blockBase + off;
        const entIno = this.r32(abs2);
        const recLen = this.view.getUint16(abs2 + 4, true);
        const entNameLen = this.view.getUint16(abs2 + 6, true);
        if (recLen === 0) return EIO;
        if (entIno === 0 && recLen >= needed) {
          this.w32(abs2, childIno);
          this.view.setUint16(abs2 + 6, name.length, true);
          this.u8.set(name, abs2 + DIRENT_HEADER_SIZE);
          return 0;
        }
        const actualLen = align4(DIRENT_HEADER_SIZE + entNameLen);
        const slack = recLen - actualLen;
        if (entIno !== 0 && slack >= needed) {
          this.view.setUint16(abs2 + 4, actualLen, true);
          const newAbs = abs2 + actualLen;
          this.w32(newAbs, childIno);
          this.view.setUint16(newAbs + 4, slack, true);
          this.view.setUint16(newAbs + 6, name.length, true);
          this.u8.set(name, newAbs + DIRENT_HEADER_SIZE);
          return 0;
        }
        lastEntAbs = abs2;
        off += recLen;
      }
      pos += remain;
    }
    let appendPos = dirSize;
    let fileBlock = Math.floor(appendPos / BLOCK_SIZE);
    let blockOff = appendPos % BLOCK_SIZE;
    if (blockOff !== 0 && blockOff + needed > BLOCK_SIZE) {
      const gap = BLOCK_SIZE - blockOff;
      if (gap >= DIRENT_HEADER_SIZE) {
        const padPhys = this.inodeBlockMap(dirIno, fileBlock, false);
        if (padPhys > 0) {
          const padAbs = padPhys * BLOCK_SIZE + blockOff;
          this.w32(padAbs, 0);
          this.view.setUint16(padAbs + 4, gap, true);
          this.view.setUint16(padAbs + 6, 0, true);
        }
      } else if (lastEntAbs >= 0) {
        const oldRecLen = this.view.getUint16(lastEntAbs + 4, true);
        this.view.setUint16(lastEntAbs + 4, oldRecLen + gap, true);
      }
      appendPos = (fileBlock + 1) * BLOCK_SIZE;
      fileBlock++;
      blockOff = 0;
    }
    let phys;
    if (blockOff === 0) {
      phys = this.inodeBlockMap(dirIno, fileBlock, true);
      if (phys < 0) return phys;
    } else {
      phys = this.inodeBlockMap(dirIno, fileBlock, false);
      if (phys <= 0) return EIO;
    }
    const abs = phys * BLOCK_SIZE + blockOff;
    this.w32(abs, childIno);
    this.view.setUint16(abs + 4, needed, true);
    this.view.setUint16(abs + 6, name.length, true);
    this.u8.set(name, abs + DIRENT_HEADER_SIZE);
    this.w64(inoOff + INO_SIZE, appendPos + needed);
    return 0;
  }
  dirRemoveEntry(dirIno, name) {
    const inoOff = this.inodeOffset(dirIno);
    const dirSize = this.r64(inoOff + INO_SIZE);
    let pos = 0;
    while (pos < dirSize) {
      const fileBlock = Math.floor(pos / BLOCK_SIZE);
      const blockOff = pos % BLOCK_SIZE;
      const phys = this.inodeBlockMap(dirIno, fileBlock, false);
      if (phys <= 0) return EIO;
      const blockBase = phys * BLOCK_SIZE;
      let remain = dirSize - pos;
      if (remain > BLOCK_SIZE - blockOff) remain = BLOCK_SIZE - blockOff;
      let off = blockOff;
      while (off < blockOff + remain) {
        const abs = blockBase + off;
        const entIno = this.r32(abs);
        const recLen = this.view.getUint16(abs + 4, true);
        const entNameLen = this.view.getUint16(abs + 6, true);
        if (recLen === 0) return EIO;
        if (entIno !== 0 && entNameLen === name.length) {
          let match = true;
          for (let i = 0; i < name.length; i++) {
            if (this.u8[abs + DIRENT_HEADER_SIZE + i] !== name[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            this.w32(abs, 0);
            return 0;
          }
        }
        off += recLen;
      }
      pos += remain;
    }
    return ENOENT;
  }
  dirIsEmpty(dirIno) {
    const inoOff = this.inodeOffset(dirIno);
    const dirSize = this.r64(inoOff + INO_SIZE);
    let pos = 0;
    while (pos < dirSize) {
      const fileBlock = Math.floor(pos / BLOCK_SIZE);
      const blockOff = pos % BLOCK_SIZE;
      const phys = this.inodeBlockMap(dirIno, fileBlock, false);
      if (phys <= 0) return true;
      const blockBase = phys * BLOCK_SIZE;
      let remain = dirSize - pos;
      if (remain > BLOCK_SIZE - blockOff) remain = BLOCK_SIZE - blockOff;
      let off = blockOff;
      while (off < blockOff + remain) {
        const abs = blockBase + off;
        const entIno = this.r32(abs);
        const recLen = this.view.getUint16(abs + 4, true);
        const entNameLen = this.view.getUint16(abs + 6, true);
        if (recLen === 0) break;
        if (entIno !== 0) {
          if (entNameLen === 1 && this.u8[abs + DIRENT_HEADER_SIZE] === 46) {
            off += recLen;
            continue;
          }
          if (entNameLen === 2 && this.u8[abs + DIRENT_HEADER_SIZE] === 46 && this.u8[abs + DIRENT_HEADER_SIZE + 1] === 46) {
            off += recLen;
            continue;
          }
          return false;
        }
        off += recLen;
      }
      pos += remain;
    }
    return true;
  }
  // ── Path resolution ──────────────────────────────────────────────
  pathResolve(path, followSymlinks) {
    if (!path.startsWith("/")) return ENOENT;
    let ino = ROOT_INO;
    const parts = path.split("/").filter((p) => p.length > 0);
    let symlinkHops = 0;
    for (let pi = 0; pi < parts.length; pi++) {
      const part = parts[pi];
      if (part.length > MAX_NAME) return ENAMETOOLONG;
      const inoOff = this.inodeOffset(ino);
      const mode = this.r32(inoOff + INO_MODE);
      if ((mode & S_IFMT2) !== S_IFDIR2) return ENOTDIR;
      const nameBytes = encoder.encode(part);
      const childIno = this.dirLookup(ino, nameBytes);
      if (childIno < 0) return childIno;
      const childOff = this.inodeOffset(childIno);
      const childMode = this.r32(childOff + INO_MODE);
      if ((childMode & S_IFMT2) === S_IFLNK2) {
        const isLast = pi === parts.length - 1;
        if (!isLast || followSymlinks) {
          if (++symlinkHops > MAX_SYMLINK_HOPS) return ELOOP;
          const linkSize = this.r64(childOff + INO_SIZE);
          let target;
          if (linkSize <= INLINE_SYMLINK_SIZE) {
            target = safeDecode(
              this.u8.subarray(
                childOff + INO_DIRECT,
                childOff + INO_DIRECT + linkSize
              )
            );
          } else {
            const buf = new Uint8Array(linkSize);
            this.inodeReadData(childIno, 0, buf, linkSize);
            target = decoder.decode(buf);
          }
          if (target.startsWith("/")) {
            ino = ROOT_INO;
            const targetParts = target.split("/").filter((p) => p.length > 0);
            const remaining = parts.slice(pi + 1);
            parts.length = 0;
            parts.push(...targetParts, ...remaining);
            pi = -1;
          } else {
            const targetParts = target.split("/").filter((p) => p.length > 0);
            const remaining = parts.slice(pi + 1);
            parts.length = pi;
            parts.push(...targetParts, ...remaining);
            pi--;
          }
          continue;
        }
      }
      ino = childIno;
    }
    return ino;
  }
  pathResolveParent(path) {
    if (!path.startsWith("/"))
      throw new SFSError(EINVAL, "Path must be absolute");
    const parts = path.split("/").filter((p) => p.length > 0);
    if (parts.length === 0) throw new SFSError(EINVAL, "Cannot operate on /");
    const name = parts.pop();
    if (name.length > MAX_NAME) throw new SFSError(ENAMETOOLONG);
    const parentPath = "/" + parts.join("/");
    const parentIno = this.pathResolve(parentPath, true);
    if (parentIno < 0) throw new SFSError(parentIno);
    const pOff = this.inodeOffset(parentIno);
    const pMode = this.r32(pOff + INO_MODE);
    if ((pMode & S_IFMT2) !== S_IFDIR2) throw new SFSError(ENOTDIR);
    return { parentIno, name };
  }
  // ── FD table ─────────────────────────────────────────────────────
  fdAlloc(ino, flags, isDir) {
    for (let i = 0; i < MAX_FDS; i++) {
      const base = FD_TABLE_OFFSET + i * FD_ENTRY_SIZE;
      const idx = base >> 2;
      const old = Atomics.compareExchange(this.i32, idx, 0, 1);
      if (old === 0) {
        this.w32(base + FD_INO, ino);
        this.w64(base + FD_OFFSET, 0);
        this.w32(base + FD_FLAGS, flags);
        this.w32(base + FD_IS_DIR, isDir ? 1 : 0);
        return i;
      }
    }
    return EMFILE;
  }
  fdGet(fd) {
    if (fd < 0 || fd >= MAX_FDS) return null;
    const base = FD_TABLE_OFFSET + fd * FD_ENTRY_SIZE;
    const inUse = Atomics.load(this.i32, base >> 2);
    if (!inUse) return null;
    return {
      base,
      ino: this.r32(base + FD_INO),
      offset: this.r64(base + FD_OFFSET),
      flags: this.r32(base + FD_FLAGS),
      isDir: this.r32(base + FD_IS_DIR) !== 0
    };
  }
  fdFree(fd) {
    if (fd >= 0 && fd < MAX_FDS) {
      const base = FD_TABLE_OFFSET + fd * FD_ENTRY_SIZE;
      Atomics.store(this.i32, base >> 2, 0);
    }
  }
  // ── Build stat result from inode ─────────────────────────────────
  buildStat(ino) {
    const off = this.inodeOffset(ino);
    return {
      ino,
      mode: this.r32(off + INO_MODE),
      linkCount: this.r32(off + INO_LINK_COUNT),
      size: this.r64(off + INO_SIZE),
      mtime: this.r64(off + INO_MTIME),
      ctime: this.r64(off + INO_CTIME),
      atime: this.r64(off + INO_ATIME)
    };
  }
  // ── Public API: File operations ──────────────────────────────────
  open(path, flags, createMode = 420) {
    const accMode = flags & O_ACCMODE;
    const creating = (flags & O_CREAT2) !== 0;
    let ino = this.pathResolve(path, true);
    if (ino < 0 && ino === ENOENT && creating) {
      const { parentIno, name } = this.pathResolveParent(path);
      this.inodeWriteLock(parentIno);
      try {
        const nameBytes = encoder.encode(name);
        const existing = this.dirLookup(parentIno, nameBytes);
        if (existing >= 0) {
          ino = existing;
        } else {
          const newIno = this.inodeAlloc();
          if (newIno < 0) throw new SFSError(ENOSPC);
          const newOff = this.inodeOffset(newIno);
          this.w32(newOff + INO_MODE, S_IFREG2 | createMode & 4095);
          this.w32(newOff + INO_LINK_COUNT, 1);
          this.w64(newOff + INO_SIZE, 0);
          const now = Date.now();
          this.w64(newOff + INO_ATIME, now);
          this.w64(newOff + INO_MTIME, now);
          this.w64(newOff + INO_CTIME, now);
          const rc = this.dirAddEntry(parentIno, nameBytes, newIno);
          if (rc < 0) {
            this.inodeFree(newIno);
            throw new SFSError(rc);
          }
          ino = newIno;
        }
      } finally {
        this.inodeWriteUnlock(parentIno);
      }
    }
    if (ino < 0) throw new SFSError(ino);
    const inoOff = this.inodeOffset(ino);
    const mode = this.r32(inoOff + INO_MODE);
    if ((mode & S_IFMT2) === S_IFDIR2) {
      if (accMode !== O_RDONLY2) throw new SFSError(EISDIR);
    }
    if (flags & O_DIRECTORY2 && (mode & S_IFMT2) !== S_IFDIR2) {
      throw new SFSError(ENOTDIR);
    }
    if (flags & O_TRUNC2) {
      if ((mode & S_IFMT2) === S_IFDIR2) throw new SFSError(EISDIR);
      this.inodeWriteLock(ino);
      this.inodeTruncate(ino, 0);
      this.inodeWriteUnlock(ino);
    }
    const fd = this.fdAlloc(ino, flags, false);
    if (fd < 0) throw new SFSError(fd);
    if (flags & O_APPEND2) {
      const base = FD_TABLE_OFFSET + fd * FD_ENTRY_SIZE;
      this.w64(base + FD_OFFSET, this.r64(inoOff + INO_SIZE));
    }
    return fd;
  }
  close(fd) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    this.fdFree(fd);
  }
  read(fd, buffer) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    this.inodeReadLock(entry.ino);
    try {
      const nread = this.inodeReadData(
        entry.ino,
        entry.offset,
        buffer,
        buffer.length
      );
      const base = FD_TABLE_OFFSET + fd * FD_ENTRY_SIZE;
      this.w64(base + FD_OFFSET, entry.offset + nread);
      return nread;
    } finally {
      this.inodeReadUnlock(entry.ino);
    }
  }
  write(fd, data) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    const accMode = entry.flags & O_ACCMODE;
    if (accMode === O_RDONLY2) throw new SFSError(EBADF);
    this.inodeWriteLock(entry.ino);
    try {
      let offset = entry.offset;
      if (entry.flags & O_APPEND2) {
        const inoOff = this.inodeOffset(entry.ino);
        offset = this.r64(inoOff + INO_SIZE);
      }
      const nwritten = this.inodeWriteData(
        entry.ino,
        offset,
        data,
        data.length
      );
      const base = FD_TABLE_OFFSET + fd * FD_ENTRY_SIZE;
      this.w64(base + FD_OFFSET, offset + nwritten);
      return nwritten;
    } finally {
      this.inodeWriteUnlock(entry.ino);
    }
  }
  lseek(fd, offset, whence) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    let newOffset;
    if (whence === SEEK_SET2) {
      newOffset = offset;
    } else if (whence === SEEK_CUR2) {
      newOffset = entry.offset + offset;
    } else if (whence === SEEK_END2) {
      const inoOff = this.inodeOffset(entry.ino);
      const size = this.r64(inoOff + INO_SIZE);
      newOffset = size + offset;
    } else {
      throw new SFSError(EINVAL);
    }
    if (newOffset < 0) throw new SFSError(EINVAL);
    const base = FD_TABLE_OFFSET + fd * FD_ENTRY_SIZE;
    this.w64(base + FD_OFFSET, newOffset);
    return newOffset;
  }
  ftruncate(fd, length) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    if ((entry.flags & O_ACCMODE) === O_RDONLY2) throw new SFSError(EBADF);
    this.inodeWriteLock(entry.ino);
    try {
      this.inodeTruncate(entry.ino, length);
    } finally {
      this.inodeWriteUnlock(entry.ino);
    }
  }
  fstat(fd) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    this.inodeReadLock(entry.ino);
    try {
      return this.buildStat(entry.ino);
    } finally {
      this.inodeReadUnlock(entry.ino);
    }
  }
  // ── Public API: Path operations ──────────────────────────────────
  stat(path) {
    const ino = this.pathResolve(path, true);
    if (ino < 0) throw new SFSError(ino);
    this.inodeReadLock(ino);
    try {
      return this.buildStat(ino);
    } finally {
      this.inodeReadUnlock(ino);
    }
  }
  lstat(path) {
    const ino = this.pathResolve(path, false);
    if (ino < 0) throw new SFSError(ino);
    this.inodeReadLock(ino);
    try {
      return this.buildStat(ino);
    } finally {
      this.inodeReadUnlock(ino);
    }
  }
  unlink(path) {
    const { parentIno, name } = this.pathResolveParent(path);
    const nameBytes = encoder.encode(name);
    this.inodeWriteLock(parentIno);
    try {
      const childIno = this.dirLookup(parentIno, nameBytes);
      if (childIno < 0) throw new SFSError(childIno);
      const childOff = this.inodeOffset(childIno);
      const mode = this.r32(childOff + INO_MODE);
      if ((mode & S_IFMT2) === S_IFDIR2) throw new SFSError(EISDIR);
      const rc = this.dirRemoveEntry(parentIno, nameBytes);
      if (rc < 0) throw new SFSError(rc);
      this.inodeWriteLock(childIno);
      const linkCount = this.r32(childOff + INO_LINK_COUNT);
      if (linkCount <= 1) {
        this.inodeTruncate(childIno, 0);
        this.w32(childOff + INO_LINK_COUNT, 0);
        this.inodeWriteUnlock(childIno);
        this.inodeFree(childIno);
      } else {
        this.w32(childOff + INO_LINK_COUNT, linkCount - 1);
        this.inodeWriteUnlock(childIno);
      }
    } finally {
      this.inodeWriteUnlock(parentIno);
    }
  }
  rename(oldPath, newPath) {
    const { parentIno: oldParent, name: oldName } = this.pathResolveParent(oldPath);
    const { parentIno: newParent, name: newName } = this.pathResolveParent(newPath);
    const oldNameBytes = encoder.encode(oldName);
    const newNameBytes = encoder.encode(newName);
    const first = Math.min(oldParent, newParent);
    const second = Math.max(oldParent, newParent);
    this.inodeWriteLock(first);
    if (first !== second) this.inodeWriteLock(second);
    try {
      const srcIno = this.dirLookup(oldParent, oldNameBytes);
      if (srcIno < 0) throw new SFSError(srcIno);
      const existingIno = this.dirLookup(newParent, newNameBytes);
      if (existingIno >= 0) {
        const existOff = this.inodeOffset(existingIno);
        const existMode = this.r32(existOff + INO_MODE);
        if ((existMode & S_IFMT2) === S_IFDIR2) throw new SFSError(EISDIR);
        this.dirRemoveEntry(newParent, newNameBytes);
        this.inodeWriteLock(existingIno);
        this.inodeTruncate(existingIno, 0);
        this.w32(existOff + INO_LINK_COUNT, 0);
        this.inodeWriteUnlock(existingIno);
        this.inodeFree(existingIno);
      }
      const rc = this.dirAddEntry(newParent, newNameBytes, srcIno);
      if (rc < 0) throw new SFSError(rc);
      this.dirRemoveEntry(oldParent, oldNameBytes);
      const srcOff = this.inodeOffset(srcIno);
      const srcMode = this.r32(srcOff + INO_MODE);
      if ((srcMode & S_IFMT2) === S_IFDIR2 && oldParent !== newParent) {
        const oldPOff = this.inodeOffset(oldParent);
        this.w32(
          oldPOff + INO_LINK_COUNT,
          this.r32(oldPOff + INO_LINK_COUNT) - 1
        );
        const newPOff = this.inodeOffset(newParent);
        this.w32(
          newPOff + INO_LINK_COUNT,
          this.r32(newPOff + INO_LINK_COUNT) + 1
        );
      }
    } finally {
      if (first !== second) this.inodeWriteUnlock(second);
      this.inodeWriteUnlock(first);
    }
  }
  mkdir(path, mode = 493) {
    const { parentIno, name } = this.pathResolveParent(path);
    const nameBytes = encoder.encode(name);
    this.inodeWriteLock(parentIno);
    try {
      const existing = this.dirLookup(parentIno, nameBytes);
      if (existing >= 0) throw new SFSError(EEXIST);
      const newIno = this.inodeAlloc();
      if (newIno < 0) throw new SFSError(ENOSPC);
      const newOff = this.inodeOffset(newIno);
      this.w32(newOff + INO_MODE, S_IFDIR2 | mode);
      this.w32(newOff + INO_LINK_COUNT, 2);
      this.w64(newOff + INO_SIZE, 0);
      const now = Date.now();
      this.w64(newOff + INO_ATIME, now);
      this.w64(newOff + INO_MTIME, now);
      this.w64(newOff + INO_CTIME, now);
      const blk = this.blockAllocWithGrow();
      if (blk < 0) {
        this.inodeFree(newIno);
        throw new SFSError(ENOSPC);
      }
      this.w32(newOff + INO_DIRECT, blk);
      const dBase = blk * BLOCK_SIZE;
      const dotRecLen = align4(DIRENT_HEADER_SIZE + 1);
      const dotdotRecLen = align4(DIRENT_HEADER_SIZE + 2);
      this.w32(dBase, newIno);
      this.view.setUint16(dBase + 4, dotRecLen, true);
      this.view.setUint16(dBase + 6, 1, true);
      this.u8[dBase + DIRENT_HEADER_SIZE] = 46;
      const ddOff = dBase + dotRecLen;
      this.w32(ddOff, parentIno);
      this.view.setUint16(ddOff + 4, dotdotRecLen, true);
      this.view.setUint16(ddOff + 6, 2, true);
      this.u8[ddOff + DIRENT_HEADER_SIZE] = 46;
      this.u8[ddOff + DIRENT_HEADER_SIZE + 1] = 46;
      this.w64(newOff + INO_SIZE, dotRecLen + dotdotRecLen);
      const rc = this.dirAddEntry(parentIno, nameBytes, newIno);
      if (rc < 0) {
        this.blockFree(blk);
        this.inodeFree(newIno);
        throw new SFSError(rc);
      }
      const pOff = this.inodeOffset(parentIno);
      this.w32(pOff + INO_LINK_COUNT, this.r32(pOff + INO_LINK_COUNT) + 1);
    } finally {
      this.inodeWriteUnlock(parentIno);
    }
  }
  rmdir(path) {
    const { parentIno, name } = this.pathResolveParent(path);
    const nameBytes = encoder.encode(name);
    this.inodeWriteLock(parentIno);
    try {
      const childIno = this.dirLookup(parentIno, nameBytes);
      if (childIno < 0) throw new SFSError(childIno);
      const childOff = this.inodeOffset(childIno);
      const mode = this.r32(childOff + INO_MODE);
      if ((mode & S_IFMT2) !== S_IFDIR2) throw new SFSError(ENOTDIR);
      this.inodeWriteLock(childIno);
      try {
        if (!this.dirIsEmpty(childIno)) throw new SFSError(ENOTEMPTY);
        this.dirRemoveEntry(parentIno, nameBytes);
        this.inodeTruncate(childIno, 0);
        this.w32(childOff + INO_LINK_COUNT, 0);
      } finally {
        this.inodeWriteUnlock(childIno);
      }
      this.inodeFree(childIno);
      const pOff = this.inodeOffset(parentIno);
      this.w32(pOff + INO_LINK_COUNT, this.r32(pOff + INO_LINK_COUNT) - 1);
    } finally {
      this.inodeWriteUnlock(parentIno);
    }
  }
  symlink(target, linkPath) {
    const { parentIno, name } = this.pathResolveParent(linkPath);
    const nameBytes = encoder.encode(name);
    const targetBytes = encoder.encode(target);
    this.inodeWriteLock(parentIno);
    try {
      const existing = this.dirLookup(parentIno, nameBytes);
      if (existing >= 0) throw new SFSError(EEXIST);
      const newIno = this.inodeAlloc();
      if (newIno < 0) throw new SFSError(ENOSPC);
      const newOff = this.inodeOffset(newIno);
      this.w32(newOff + INO_MODE, S_IFLNK2 | 511);
      this.w32(newOff + INO_LINK_COUNT, 1);
      if (targetBytes.length <= INLINE_SYMLINK_SIZE) {
        this.u8.set(targetBytes, newOff + INO_DIRECT);
        this.w64(newOff + INO_SIZE, targetBytes.length);
      } else {
        this.w64(newOff + INO_SIZE, 0);
        const written = this.inodeWriteData(
          newIno,
          0,
          targetBytes,
          targetBytes.length
        );
        if (written < 0) {
          this.inodeFree(newIno);
          throw new SFSError(written);
        }
      }
      const rc = this.dirAddEntry(parentIno, nameBytes, newIno);
      if (rc < 0) {
        this.inodeFree(newIno);
        throw new SFSError(rc);
      }
    } finally {
      this.inodeWriteUnlock(parentIno);
    }
  }
  chmod(path, mode) {
    const ino = this.pathResolve(path, true);
    if (ino < 0) throw new SFSError(ino);
    this.inodeWriteLock(ino);
    try {
      const off = this.inodeOffset(ino);
      const oldMode = this.r32(off + INO_MODE);
      this.w32(off + INO_MODE, oldMode & S_IFMT2 | mode & 4095);
      this.w64(off + INO_CTIME, Date.now());
    } finally {
      this.inodeWriteUnlock(ino);
    }
  }
  fchmod(fd, mode) {
    const entry = this.fdGet(fd);
    if (!entry) throw new SFSError(EBADF);
    this.inodeWriteLock(entry.ino);
    try {
      const off = this.inodeOffset(entry.ino);
      const oldMode = this.r32(off + INO_MODE);
      this.w32(off + INO_MODE, oldMode & S_IFMT2 | mode & 4095);
      this.w64(off + INO_CTIME, Date.now());
    } finally {
      this.inodeWriteUnlock(entry.ino);
    }
  }
  utimens(path, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    const ino = this.pathResolve(path, true);
    if (ino < 0) throw new SFSError(ino);
    this.inodeWriteLock(ino);
    try {
      const off = this.inodeOffset(ino);
      const UTIME_NOW = 1073741823;
      const UTIME_OMIT = 1073741822;
      const now = Date.now();
      if (atimeNsec !== UTIME_OMIT) {
        const atimeMs = atimeNsec === UTIME_NOW ? now : atimeSec * 1e3 + Math.floor(atimeNsec / 1e6);
        this.w64(off + INO_ATIME, atimeMs);
      }
      if (mtimeNsec !== UTIME_OMIT) {
        const mtimeMs = mtimeNsec === UTIME_NOW ? now : mtimeSec * 1e3 + Math.floor(mtimeNsec / 1e6);
        this.w64(off + INO_MTIME, mtimeMs);
      }
      this.w64(off + INO_CTIME, now);
    } finally {
      this.inodeWriteUnlock(ino);
    }
  }
  link(existingPath, newPath) {
    const srcIno = this.pathResolve(existingPath, true);
    if (srcIno < 0) throw new SFSError(srcIno);
    const srcOff = this.inodeOffset(srcIno);
    const srcMode = this.r32(srcOff + INO_MODE);
    if ((srcMode & S_IFMT2) === S_IFDIR2) throw new SFSError(EPERM);
    const { parentIno, name } = this.pathResolveParent(newPath);
    const nameBytes = encoder.encode(name);
    this.inodeWriteLock(parentIno);
    try {
      const existing = this.dirLookup(parentIno, nameBytes);
      if (existing >= 0) throw new SFSError(EEXIST);
      const rc = this.dirAddEntry(parentIno, nameBytes, srcIno);
      if (rc < 0) throw new SFSError(rc);
      this.inodeWriteLock(srcIno);
      try {
        const linkCount = this.r32(srcOff + INO_LINK_COUNT);
        this.w32(srcOff + INO_LINK_COUNT, linkCount + 1);
        this.w64(srcOff + INO_CTIME, Date.now());
      } finally {
        this.inodeWriteUnlock(srcIno);
      }
    } finally {
      this.inodeWriteUnlock(parentIno);
    }
  }
  readlink(path) {
    const ino = this.pathResolve(path, false);
    if (ino < 0) throw new SFSError(ino);
    const inoOff = this.inodeOffset(ino);
    const mode = this.r32(inoOff + INO_MODE);
    if ((mode & S_IFMT2) !== S_IFLNK2) throw new SFSError(EINVAL);
    const size = this.r64(inoOff + INO_SIZE);
    if (size <= INLINE_SYMLINK_SIZE) {
      return safeDecode(
        this.u8.subarray(inoOff + INO_DIRECT, inoOff + INO_DIRECT + size)
      );
    }
    this.inodeReadLock(ino);
    try {
      const buf = new Uint8Array(size);
      this.inodeReadData(ino, 0, buf, size);
      return decoder.decode(buf);
    } finally {
      this.inodeReadUnlock(ino);
    }
  }
  // ── Public API: Directory reading ────────────────────────────────
  opendir(path) {
    const ino = this.pathResolve(path, true);
    if (ino < 0) throw new SFSError(ino);
    const inoOff = this.inodeOffset(ino);
    const mode = this.r32(inoOff + INO_MODE);
    if ((mode & S_IFMT2) !== S_IFDIR2) throw new SFSError(ENOTDIR);
    const dd = this.fdAlloc(ino, O_RDONLY2, true);
    if (dd < 0) throw new SFSError(dd);
    return dd;
  }
  readdirEntry(dd) {
    const entry = this.fdGet(dd);
    if (!entry || !entry.isDir) throw new SFSError(EBADF);
    const inoOff = this.inodeOffset(entry.ino);
    const dirSize = this.r64(inoOff + INO_SIZE);
    while (entry.offset < dirSize) {
      const pos = entry.offset;
      const fileBlock = Math.floor(pos / BLOCK_SIZE);
      const blockOff = pos % BLOCK_SIZE;
      const phys = this.inodeBlockMap(entry.ino, fileBlock, false);
      if (phys <= 0) return null;
      const abs = phys * BLOCK_SIZE + blockOff;
      const entIno = this.r32(abs);
      const recLen = this.view.getUint16(abs + 4, true);
      const entNameLen = this.view.getUint16(abs + 6, true);
      if (recLen === 0) return null;
      entry.offset = pos + recLen;
      const base = FD_TABLE_OFFSET + dd * FD_ENTRY_SIZE;
      this.w64(base + FD_OFFSET, pos + recLen);
      if (entIno !== 0) {
        const nameStr = safeDecode(
          this.u8.subarray(
            abs + DIRENT_HEADER_SIZE,
            abs + DIRENT_HEADER_SIZE + entNameLen
          )
        );
        return { name: nameStr, stat: this.buildStat(entIno) };
      }
    }
    return null;
  }
  closedir(dd) {
    this.close(dd);
  }
  readdir(path) {
    const dd = this.opendir(path);
    const entries = [];
    try {
      let entry;
      while ((entry = this.readdirEntry(dd)) !== null) {
        if (entry.name !== "." && entry.name !== "..") {
          entries.push(entry.name);
        }
      }
    } finally {
      this.closedir(dd);
    }
    return entries;
  }
  // ── High-level helpers ───────────────────────────────────────────
  writeFile(path, data) {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    const fd = this.open(path, O_WRONLY | O_CREAT2 | O_TRUNC2);
    try {
      this.write(fd, bytes);
    } finally {
      this.close(fd);
    }
  }
  readFile(path) {
    const fd = this.open(path, O_RDONLY2);
    try {
      const st = this.fstat(fd);
      const buf = new Uint8Array(st.size);
      this.read(fd, buf);
      return buf;
    } finally {
      this.close(fd);
    }
  }
  readFileText(path) {
    return decoder.decode(this.readFile(path));
  }
};

// src/vfs/memory-fs.ts
var VFS_IMAGE_MAGIC = 1447449417;
var VFS_IMAGE_VERSION = 1;
var VFS_IMAGE_FLAG_HAS_LAZY = 1 << 0;
var VFS_IMAGE_FLAG_HAS_LAZY_ARCHIVES = 1 << 1;
var VFS_IMAGE_HEADER_SIZE = 16;
var MemoryFileSystem = class _MemoryFileSystem {
  fs;
  /** Lazy files: inode → { path, url, size }. Cleared per-inode after materialization. */
  lazyFiles = /* @__PURE__ */ new Map();
  /** Lazy archive groups (bundle of files backed by one zip URL). */
  lazyArchiveGroups = [];
  /** Fast lookup: inode → group it belongs to. Cleared per-group after materialization. */
  lazyArchiveInodes = /* @__PURE__ */ new Map();
  constructor(fs) {
    this.fs = fs;
  }
  /** Return the underlying SharedArrayBuffer (for sharing with workers). */
  get sharedBuffer() {
    return this.fs.buffer;
  }
  static create(sab, maxSizeBytes) {
    return new _MemoryFileSystem(SharedFS.mkfs(sab, maxSizeBytes));
  }
  static fromExisting(sab) {
    return new _MemoryFileSystem(SharedFS.mount(sab));
  }
  /**
   * Register a lazy file: creates an empty stub in SharedFS and records
   * metadata so that read() will fetch content on demand via sync XHR.
   * Returns the inode number (useful for forwarding to other instances).
   */
  registerLazyFile(path, url, size, mode = 493) {
    const parts = path.split("/").filter(Boolean);
    let current = "";
    for (let i = 0; i < parts.length - 1; i++) {
      current += "/" + parts[i];
      try {
        this.fs.mkdir(current, 493);
      } catch {
      }
    }
    const fd = this.fs.open(path, 577, mode);
    this.fs.close(fd);
    const st = this.fs.stat(path);
    this.lazyFiles.set(st.ino, { path, url, size });
    return st.ino;
  }
  /**
   * Import lazy file entries from another instance (e.g., main thread → worker).
   * Does not create files — assumes the files already exist in the SharedArrayBuffer.
   */
  importLazyEntries(entries) {
    for (const e of entries) {
      this.lazyFiles.set(e.ino, { path: e.path, url: e.url, size: e.size });
    }
  }
  /** Export all pending lazy entries for transfer to another instance. */
  exportLazyEntries() {
    const entries = [];
    for (const [ino, { path, url, size }] of this.lazyFiles) {
      entries.push({ ino, path, url, size });
    }
    return entries;
  }
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
  registerLazyArchiveFromEntries(url, zipEntries, mountPrefix, symlinkTargets) {
    const group = {
      url,
      mountPrefix,
      materialized: false,
      entries: /* @__PURE__ */ new Map()
    };
    const normalized = mountPrefix.replace(/\/+$/, "");
    for (const ze of zipEntries) {
      if (ze.isDirectory) continue;
      const vfsPath = normalized + "/" + ze.fileName;
      const parts = vfsPath.split("/").filter(Boolean);
      let current = "";
      for (let i = 0; i < parts.length - 1; i++) {
        current += "/" + parts[i];
        try {
          this.fs.mkdir(current, 493);
        } catch {
        }
      }
      if (ze.isSymlink && symlinkTargets?.has(ze.fileName)) {
        const target = symlinkTargets.get(ze.fileName);
        this.fs.symlink(target, vfsPath);
      } else {
        const fd = this.fs.open(vfsPath, 577, ze.mode);
        this.fs.close(fd);
      }
      const st = this.fs.lstat(vfsPath);
      const entry = {
        ino: st.ino,
        size: ze.uncompressedSize,
        isSymlink: ze.isSymlink,
        deleted: false
      };
      group.entries.set(vfsPath, entry);
      this.lazyArchiveInodes.set(st.ino, group);
    }
    this.lazyArchiveGroups.push(group);
    return group;
  }
  /** Import lazy archive groups from another instance. Assumes stubs already exist. */
  importLazyArchiveEntries(serialized) {
    for (const s of serialized) {
      const entries = /* @__PURE__ */ new Map();
      for (const e of s.entries) {
        entries.set(e.vfsPath, {
          ino: e.ino,
          size: e.size,
          isSymlink: e.isSymlink,
          deleted: e.deleted
        });
      }
      const group = {
        url: s.url,
        mountPrefix: s.mountPrefix,
        materialized: s.materialized,
        entries
      };
      this.lazyArchiveGroups.push(group);
      if (!group.materialized) {
        for (const [, entry] of entries) {
          if (!entry.deleted) {
            this.lazyArchiveInodes.set(entry.ino, group);
          }
        }
      }
    }
  }
  /**
   * Rewrite the URL of every registered lazy archive group. Useful when the
   * VFS image was built with relative URLs (e.g. "vim.zip") and the runtime
   * needs to resolve them against a deployment base URL.
   */
  rewriteLazyArchiveUrls(transform) {
    for (const group of this.lazyArchiveGroups) {
      group.url = transform(group.url);
    }
  }
  /** Export all lazy archive groups for transfer to another instance. */
  exportLazyArchiveEntries() {
    return this.lazyArchiveGroups.map((group) => ({
      url: group.url,
      mountPrefix: group.mountPrefix,
      materialized: group.materialized,
      entries: Array.from(group.entries, ([vfsPath, entry]) => ({
        vfsPath,
        ino: entry.ino,
        size: entry.size,
        isSymlink: entry.isSymlink,
        deleted: entry.deleted
      }))
    }));
  }
  /**
   * Async-materialize a lazy file or archive-backed file if the given path
   * resolves to one. Call this before any synchronous read (e.g. in
   * handleExec) to avoid sync XHR which deadlocks with COOP/COEP.
   * Returns true if something was materialized, false if already concrete.
   */
  async ensureMaterialized(path) {
    if (this.lazyFiles.size === 0 && this.lazyArchiveInodes.size === 0) return false;
    try {
      const st = this.fs.stat(path);
      const entry = this.lazyFiles.get(st.ino);
      if (entry) {
        const resp = await fetch(entry.url);
        if (!resp.ok) {
          throw new Error(`Failed to fetch lazy file ${entry.path}: HTTP ${resp.status}`);
        }
        const data = new Uint8Array(await resp.arrayBuffer());
        const fd = this.fs.open(entry.path, 577, 493);
        this.fs.write(fd, data);
        this.fs.close(fd);
        this.lazyFiles.delete(st.ino);
        return true;
      }
      const group = this.lazyArchiveInodes.get(st.ino);
      if (group) {
        await this.ensureArchiveMaterialized(group);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  /**
   * Materialize a full lazy archive group: fetch the zip once, parse its
   * central directory, and write every non-deleted entry into its stub.
   * Subsequent calls are no-ops.
   */
  async ensureArchiveMaterialized(group) {
    if (group.materialized) return;
    const resp = await fetch(group.url);
    if (!resp.ok) {
      throw new Error(`Failed to fetch archive ${group.url}: HTTP ${resp.status}`);
    }
    const zipData = new Uint8Array(await resp.arrayBuffer());
    const { parseZipCentralDirectory: parseZipCentralDirectory2, extractZipEntry: extractZipEntry2 } = await Promise.resolve().then(() => (init_zip(), zip_exports));
    const zipEntries = parseZipCentralDirectory2(zipData);
    const zipLookup = /* @__PURE__ */ new Map();
    for (const ze of zipEntries) zipLookup.set(ze.fileName, ze);
    const normalizedPrefix = group.mountPrefix.replace(/\/+$/, "");
    for (const [vfsPath, archiveEntry] of group.entries) {
      if (archiveEntry.deleted) continue;
      if (archiveEntry.isSymlink) continue;
      const zipFileName = vfsPath.slice(normalizedPrefix.length + 1);
      const ze = zipLookup.get(zipFileName);
      if (!ze) continue;
      const content = extractZipEntry2(zipData, ze);
      const fd = this.fs.open(vfsPath, 577, 493);
      if (content.length > 0) this.fs.write(fd, content);
      this.fs.close(fd);
    }
    group.materialized = true;
    for (const [, archiveEntry] of group.entries) {
      this.lazyArchiveInodes.delete(archiveEntry.ino);
    }
  }
  /**
   * Save the current filesystem state as a portable binary image.
   *
   * With `materializeAll: true`, all lazy files are fetched and written
   * into the filesystem before saving, producing a self-contained image.
   * Otherwise, lazy file metadata (path/URL/size) is preserved in the
   * image and restored on load.
   */
  async saveImage(options) {
    if (options?.materializeAll) {
      const paths = Array.from(this.lazyFiles.values()).map((e) => e.path);
      for (const p of paths) {
        await this.ensureMaterialized(p);
      }
    }
    const sabBytes = new Uint8Array(this.fs.buffer);
    const lazyEntries = this.exportLazyEntries();
    const hasLazy = lazyEntries.length > 0;
    const lazyJson = hasLazy ? new TextEncoder().encode(JSON.stringify(lazyEntries)) : new Uint8Array(0);
    const archiveEntries = this.exportLazyArchiveEntries();
    const hasArchives = archiveEntries.length > 0;
    const archiveJson = hasArchives ? new TextEncoder().encode(JSON.stringify(archiveEntries)) : new Uint8Array(0);
    const archiveSectionSize = hasArchives ? 4 + archiveJson.byteLength : 0;
    const totalSize = VFS_IMAGE_HEADER_SIZE + sabBytes.byteLength + 4 + lazyJson.byteLength + archiveSectionSize;
    const image = new Uint8Array(totalSize);
    const view = new DataView(image.buffer);
    view.setUint32(0, VFS_IMAGE_MAGIC, true);
    view.setUint32(4, VFS_IMAGE_VERSION, true);
    view.setUint32(
      8,
      (hasLazy ? VFS_IMAGE_FLAG_HAS_LAZY : 0) | (hasArchives ? VFS_IMAGE_FLAG_HAS_LAZY_ARCHIVES : 0),
      true
    );
    view.setUint32(12, sabBytes.byteLength, true);
    const sabCopy = new Uint8Array(sabBytes.byteLength);
    sabCopy.set(sabBytes);
    image.set(sabCopy, VFS_IMAGE_HEADER_SIZE);
    const lazyOffset = VFS_IMAGE_HEADER_SIZE + sabBytes.byteLength;
    view.setUint32(lazyOffset, lazyJson.byteLength, true);
    if (lazyJson.byteLength > 0) {
      image.set(lazyJson, lazyOffset + 4);
    }
    if (hasArchives) {
      const archiveOffset = lazyOffset + 4 + lazyJson.byteLength;
      view.setUint32(archiveOffset, archiveJson.byteLength, true);
      image.set(archiveJson, archiveOffset + 4);
    }
    return image;
  }
  /**
   * Restore a MemoryFileSystem from a previously saved VFS image.
   * Allocates a new SharedArrayBuffer and populates it from the image.
   *
   * When `maxByteLength` is specified, creates a growable SharedArrayBuffer
   * so the filesystem can expand beyond the image's original size.
   */
  static fromImage(image, options) {
    if (image.byteLength < VFS_IMAGE_HEADER_SIZE) {
      throw new Error("VFS image too small");
    }
    const view = new DataView(
      image.buffer,
      image.byteOffset,
      image.byteLength
    );
    const magic = view.getUint32(0, true);
    if (magic !== VFS_IMAGE_MAGIC) {
      throw new Error(
        `Bad VFS image magic: 0x${magic.toString(16)} (expected 0x${VFS_IMAGE_MAGIC.toString(16)})`
      );
    }
    const version = view.getUint32(4, true);
    if (version !== VFS_IMAGE_VERSION) {
      throw new Error(
        `Unsupported VFS image version: ${version} (expected ${VFS_IMAGE_VERSION})`
      );
    }
    const flags = view.getUint32(8, true);
    const sabLen = view.getUint32(12, true);
    if (image.byteLength < VFS_IMAGE_HEADER_SIZE + sabLen + 4) {
      throw new Error("VFS image truncated");
    }
    const sabOptions = options?.maxByteLength ? { maxByteLength: options.maxByteLength } : void 0;
    const sab = new SharedArrayBuffer(sabLen, sabOptions);
    const sabView = new Uint8Array(sab);
    sabView.set(image.subarray(VFS_IMAGE_HEADER_SIZE, VFS_IMAGE_HEADER_SIZE + sabLen));
    const mfs = _MemoryFileSystem.fromExisting(sab);
    const lazyOffset = VFS_IMAGE_HEADER_SIZE + sabLen;
    const lazyLen = view.getUint32(lazyOffset, true);
    if (flags & VFS_IMAGE_FLAG_HAS_LAZY) {
      if (lazyLen > 0) {
        const lazyBytes = image.subarray(lazyOffset + 4, lazyOffset + 4 + lazyLen);
        const entries = JSON.parse(
          new TextDecoder().decode(lazyBytes)
        );
        mfs.importLazyEntries(entries);
      }
    }
    if (flags & VFS_IMAGE_FLAG_HAS_LAZY_ARCHIVES) {
      const archiveOffset = lazyOffset + 4 + lazyLen;
      if (image.byteLength < archiveOffset + 4) {
        throw new Error("VFS image truncated (lazy archive section)");
      }
      const archiveLen = view.getUint32(archiveOffset, true);
      if (archiveLen > 0) {
        const archiveBytes = image.subarray(
          archiveOffset + 4,
          archiveOffset + 4 + archiveLen
        );
        const entries = JSON.parse(
          new TextDecoder().decode(archiveBytes)
        );
        mfs.importLazyArchiveEntries(entries);
      }
    }
    return mfs;
  }
  adaptStat(s) {
    return {
      dev: 0,
      ino: s.ino,
      mode: s.mode,
      nlink: s.linkCount,
      uid: 0,
      gid: 0,
      size: s.size,
      atimeMs: s.atime,
      mtimeMs: s.mtime,
      ctimeMs: s.ctime
    };
  }
  open(path, flags, mode) {
    return this.fs.open(path, flags, mode);
  }
  close(handle) {
    this.fs.close(handle);
    return 0;
  }
  read(handle, buffer, offset, length) {
    if (offset !== null) {
      const savedPos = this.fs.lseek(handle, 0, 1);
      this.fs.lseek(handle, offset, 0);
      const n = this.fs.read(handle, buffer.subarray(0, length));
      this.fs.lseek(handle, savedPos, 0);
      return n;
    }
    return this.fs.read(handle, buffer.subarray(0, length));
  }
  write(handle, buffer, offset, length) {
    if (offset !== null) {
      const savedPos = this.fs.lseek(handle, 0, 1);
      this.fs.lseek(handle, offset, 0);
      const n = this.fs.write(handle, buffer.subarray(0, length));
      this.fs.lseek(handle, savedPos, 0);
      return n;
    }
    return this.fs.write(handle, buffer.subarray(0, length));
  }
  seek(handle, offset, whence) {
    return this.fs.lseek(handle, offset, whence);
  }
  fstat(handle) {
    const result = this.adaptStat(this.fs.fstat(handle));
    const entry = this.lazyFiles.get(result.ino);
    if (entry) {
      result.size = entry.size;
    } else {
      const group = this.lazyArchiveInodes.get(result.ino);
      if (group) {
        for (const archiveEntry of group.entries.values()) {
          if (archiveEntry.ino === result.ino) {
            result.size = archiveEntry.size;
            break;
          }
        }
      }
    }
    return result;
  }
  ftruncate(handle, length) {
    this.fs.ftruncate(handle, length);
  }
  // SharedFS is memory-backed, fsync is a no-op
  fsync(_handle) {
  }
  fchmod(handle, mode) {
    this.fs.fchmod(handle, mode);
  }
  fchown(_handle, _uid, _gid) {
  }
  stat(path) {
    const result = this.adaptStat(this.fs.stat(path));
    const entry = this.lazyFiles.get(result.ino);
    if (entry) {
      result.size = entry.size;
    } else {
      const group = this.lazyArchiveInodes.get(result.ino);
      if (group) {
        for (const archiveEntry of group.entries.values()) {
          if (archiveEntry.ino === result.ino) {
            result.size = archiveEntry.size;
            break;
          }
        }
      }
    }
    return result;
  }
  lstat(path) {
    const result = this.adaptStat(this.fs.lstat(path));
    const entry = this.lazyFiles.get(result.ino);
    if (entry) {
      result.size = entry.size;
    } else {
      const group = this.lazyArchiveInodes.get(result.ino);
      if (group) {
        for (const archiveEntry of group.entries.values()) {
          if (archiveEntry.ino === result.ino) {
            result.size = archiveEntry.size;
            break;
          }
        }
      }
    }
    return result;
  }
  mkdir(path, mode) {
    this.fs.mkdir(path, mode);
  }
  rmdir(path) {
    this.fs.rmdir(path);
  }
  unlink(path) {
    if (this.lazyArchiveInodes.size > 0) {
      try {
        const st = this.fs.lstat(path);
        const group = this.lazyArchiveInodes.get(st.ino);
        if (group) {
          const entry = group.entries.get(path);
          if (entry) entry.deleted = true;
          this.lazyArchiveInodes.delete(st.ino);
        }
      } catch {
      }
    }
    this.fs.unlink(path);
  }
  rename(oldPath, newPath) {
    this.fs.rename(oldPath, newPath);
  }
  link(existingPath, newPath) {
    this.fs.link(existingPath, newPath);
  }
  symlink(target, path) {
    this.fs.symlink(target, path);
  }
  readlink(path) {
    return this.fs.readlink(path);
  }
  chmod(path, mode) {
    this.fs.chmod(path, mode);
  }
  chown(_path, _uid, _gid) {
  }
  // access: check if path exists by stat'ing it (stat throws on error)
  access(path, _mode) {
    this.fs.stat(path);
  }
  utimensat(path, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    this.fs.utimens(path, atimeSec, atimeNsec, mtimeSec, mtimeNsec);
  }
  opendir(path) {
    return this.fs.opendir(path);
  }
  readdir(handle) {
    const entry = this.fs.readdirEntry(handle);
    if (!entry) return null;
    const mode = entry.stat.mode;
    let dtype = 0;
    if ((mode & 61440) === 32768) dtype = 8;
    else if ((mode & 61440) === 16384) dtype = 4;
    else if ((mode & 61440) === 40960) dtype = 10;
    return { name: entry.name, type: dtype, ino: entry.stat.ino };
  }
  closedir(handle) {
    this.fs.closedir(handle);
  }
};

// src/vfs/device-fs.ts
var S_IFCHR2 = 8192;
var S_IFDIR3 = 16384;
var nullDevice = {
  reader: () => 0,
  // EOF
  writer: (_buf, len) => len,
  // discard, report success
  mode: S_IFCHR2 | 438
};
var zeroDevice = {
  reader: (buf, len) => {
    buf.fill(0, 0, len);
    return len;
  },
  writer: (_buf, len) => len,
  // discard
  mode: S_IFCHR2 | 438
};
var ttyDevice = {
  reader: () => {
    throw new Error("ENXIO");
  },
  writer: () => {
    throw new Error("ENXIO");
  },
  mode: S_IFCHR2 | 438
};
function makeRandomDevice() {
  return {
    reader: (buf, len) => {
      if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
        const tmp = new Uint8Array(len);
        globalThis.crypto.getRandomValues(tmp);
        buf.set(tmp, 0);
      } else {
        for (let i = 0; i < len; i++) buf[i] = Math.random() * 256 | 0;
      }
      return len;
    },
    writer: (_buf, len) => len,
    // writes accepted, discarded (matches Linux)
    mode: S_IFCHR2 | 438
  };
}
var SUBDIRS = ["pts", "shm", "mqueue"];
var EXTRA_ENTRIES = [
  { name: "ptmx", type: 2, ino: 256 },
  { name: "pts", type: 4, ino: 257 },
  { name: "fd", type: 10, ino: 258 },
  { name: "stdin", type: 10, ino: 259 },
  { name: "stdout", type: 10, ino: 260 },
  { name: "stderr", type: 10, ino: 261 }
];
function isRootPath(path) {
  return path === "/" || path === "" || path === ".";
}
var DeviceFileSystem = class {
  devices = /* @__PURE__ */ new Map();
  handles = /* @__PURE__ */ new Map();
  nextHandle = 1;
  deviceNames;
  constructor() {
    const random = makeRandomDevice();
    this.devices.set("null", nullDevice);
    this.devices.set("zero", zeroDevice);
    this.devices.set("urandom", random);
    this.devices.set("random", random);
    this.devices.set("console", ttyDevice);
    this.devices.set("tty", ttyDevice);
    this.deviceNames = [...this.devices.keys()];
  }
  getDevice(path) {
    const name = path.startsWith("/") ? path.slice(1) : path;
    const dev = this.devices.get(name);
    if (!dev) throw new Error("ENOENT");
    return dev;
  }
  open(path, _flags, _mode) {
    const name = path.startsWith("/") ? path.slice(1) : path;
    if (isRootPath(path) || SUBDIRS.includes(name)) {
      const handle2 = this.nextHandle++;
      this.handles.set(handle2, { device: null });
      return handle2;
    }
    const device = this.getDevice(path);
    const handle = this.nextHandle++;
    this.handles.set(handle, { device });
    return handle;
  }
  close(handle) {
    if (!this.handles.delete(handle)) throw new Error("EBADF");
    return 0;
  }
  read(handle, buffer, _offset, length) {
    const h = this.handles.get(handle);
    if (!h) throw new Error("EBADF");
    if (!h.device) throw new Error("EISDIR");
    return h.device.reader(buffer, Math.min(length, buffer.length));
  }
  write(handle, buffer, _offset, length) {
    const h = this.handles.get(handle);
    if (!h) throw new Error("EBADF");
    if (!h.device) throw new Error("EISDIR");
    return h.device.writer(buffer, Math.min(length, buffer.length));
  }
  seek(_handle, _offset, _whence) {
    return 0;
  }
  fstat(handle) {
    const h = this.handles.get(handle);
    if (!h) throw new Error("EBADF");
    const now = Date.now();
    if (!h.device) {
      return {
        dev: 5,
        ino: 0,
        mode: S_IFDIR3 | 493,
        nlink: 2,
        uid: 0,
        gid: 0,
        size: 0,
        atimeMs: now,
        mtimeMs: now,
        ctimeMs: now
      };
    }
    return {
      dev: 5,
      ino: 0,
      mode: h.device.mode,
      nlink: 1,
      uid: 0,
      gid: 0,
      size: 0,
      atimeMs: now,
      mtimeMs: now,
      ctimeMs: now
    };
  }
  ftruncate(_handle, _length) {
  }
  fsync(_handle) {
  }
  fchmod(_handle, _mode) {
  }
  fchown(_handle, _uid, _gid) {
  }
  stat(path) {
    const now = Date.now();
    if (isRootPath(path)) {
      return {
        dev: 5,
        ino: 0,
        mode: S_IFDIR3 | 493,
        nlink: 2 + this.devices.size,
        uid: 0,
        gid: 0,
        size: 0,
        atimeMs: now,
        mtimeMs: now,
        ctimeMs: now
      };
    }
    const name = path.startsWith("/") ? path.slice(1) : path;
    if (SUBDIRS.includes(name)) {
      return {
        dev: 5,
        ino: 0,
        mode: S_IFDIR3 | 493,
        nlink: 2,
        uid: 0,
        gid: 0,
        size: 0,
        atimeMs: now,
        mtimeMs: now,
        ctimeMs: now
      };
    }
    const dev = this.getDevice(path);
    return {
      dev: 5,
      ino: 0,
      mode: dev.mode,
      nlink: 1,
      uid: 0,
      gid: 0,
      size: 0,
      atimeMs: now,
      mtimeMs: now,
      ctimeMs: now
    };
  }
  lstat(path) {
    return this.stat(path);
  }
  mkdir(_path, _mode) {
    throw new Error("EACCES");
  }
  rmdir(_path) {
    throw new Error("EACCES");
  }
  unlink(_path) {
    throw new Error("EACCES");
  }
  rename(_oldPath, _newPath) {
    throw new Error("EACCES");
  }
  link(_existingPath, _newPath) {
    throw new Error("ENOSYS");
  }
  symlink(_target, _path) {
    throw new Error("EACCES");
  }
  readlink(_path) {
    throw new Error("EINVAL");
  }
  chmod(_path, _mode) {
  }
  chown(_path, _uid, _gid) {
  }
  access(path, _mode) {
    this.stat(path);
  }
  utimensat(_path, _atimeSec, _atimeNsec, _mtimeSec, _mtimeNsec) {
  }
  // Directory iteration for /dev and subdirectories
  dirHandles = /* @__PURE__ */ new Map();
  nextDirHandle = 1;
  opendir(path) {
    const name = path.startsWith("/") ? path.slice(1) : path;
    let entries;
    if (isRootPath(path)) {
      entries = [
        ...this.deviceNames.map((n, i) => ({ name: n, type: 2, ino: i + 1 })),
        ...EXTRA_ENTRIES.filter((e) => !this.devices.has(e.name))
      ];
    } else if (SUBDIRS.includes(name)) {
      entries = [];
    } else {
      throw new Error("ENOTDIR");
    }
    const handle = this.nextDirHandle++;
    this.dirHandles.set(handle, { idx: 0, entries });
    return handle;
  }
  readdir(handle) {
    const state = this.dirHandles.get(handle);
    if (!state) throw new Error("EBADF");
    if (state.idx >= state.entries.length) return null;
    const entry = state.entries[state.idx];
    state.idx++;
    return entry;
  }
  closedir(handle) {
    this.dirHandles.delete(handle);
  }
};

// src/vfs/opfs-channel.ts
var STATUS_OFFSET2 = 0;
var OPCODE_OFFSET = 4;
var ARGS_OFFSET2 = 8;
var RESULT_OFFSET = 56;
var RESULT2_OFFSET = 60;
var DATA_OFFSET2 = 64;
var OpfsChannelStatus = /* @__PURE__ */ ((OpfsChannelStatus2) => {
  OpfsChannelStatus2[OpfsChannelStatus2["Idle"] = 0] = "Idle";
  OpfsChannelStatus2[OpfsChannelStatus2["Pending"] = 1] = "Pending";
  OpfsChannelStatus2[OpfsChannelStatus2["Complete"] = 2] = "Complete";
  OpfsChannelStatus2[OpfsChannelStatus2["Error"] = 3] = "Error";
  return OpfsChannelStatus2;
})(OpfsChannelStatus || {});
var OpfsOpcode = /* @__PURE__ */ ((OpfsOpcode2) => {
  OpfsOpcode2[OpfsOpcode2["OPEN"] = 1] = "OPEN";
  OpfsOpcode2[OpfsOpcode2["CLOSE"] = 2] = "CLOSE";
  OpfsOpcode2[OpfsOpcode2["READ"] = 3] = "READ";
  OpfsOpcode2[OpfsOpcode2["WRITE"] = 4] = "WRITE";
  OpfsOpcode2[OpfsOpcode2["SEEK"] = 5] = "SEEK";
  OpfsOpcode2[OpfsOpcode2["FSTAT"] = 6] = "FSTAT";
  OpfsOpcode2[OpfsOpcode2["FTRUNCATE"] = 7] = "FTRUNCATE";
  OpfsOpcode2[OpfsOpcode2["FSYNC"] = 8] = "FSYNC";
  OpfsOpcode2[OpfsOpcode2["STAT"] = 9] = "STAT";
  OpfsOpcode2[OpfsOpcode2["LSTAT"] = 10] = "LSTAT";
  OpfsOpcode2[OpfsOpcode2["MKDIR"] = 11] = "MKDIR";
  OpfsOpcode2[OpfsOpcode2["RMDIR"] = 12] = "RMDIR";
  OpfsOpcode2[OpfsOpcode2["UNLINK"] = 13] = "UNLINK";
  OpfsOpcode2[OpfsOpcode2["RENAME"] = 14] = "RENAME";
  OpfsOpcode2[OpfsOpcode2["ACCESS"] = 15] = "ACCESS";
  OpfsOpcode2[OpfsOpcode2["OPENDIR"] = 16] = "OPENDIR";
  OpfsOpcode2[OpfsOpcode2["READDIR"] = 17] = "READDIR";
  OpfsOpcode2[OpfsOpcode2["CLOSEDIR"] = 18] = "CLOSEDIR";
  return OpfsOpcode2;
})(OpfsOpcode || {});
var OPFS_CHANNEL_SIZE = 4 * 1024 * 1024;
var OpfsChannel = class {
  i32;
  view;
  buffer;
  constructor(buffer) {
    this.buffer = buffer;
    this.i32 = new Int32Array(buffer);
    this.view = new DataView(buffer);
  }
  // --- Status ---
  get status() {
    return Atomics.load(this.i32, STATUS_OFFSET2 / 4);
  }
  set status(value) {
    Atomics.store(this.i32, STATUS_OFFSET2 / 4, value);
  }
  // --- Opcode ---
  get opcode() {
    return this.view.getInt32(OPCODE_OFFSET, true);
  }
  set opcode(value) {
    this.view.setInt32(OPCODE_OFFSET, value, true);
  }
  // --- Args ---
  getArg(index) {
    return this.view.getInt32(ARGS_OFFSET2 + index * 4, true);
  }
  setArg(index, value) {
    this.view.setInt32(ARGS_OFFSET2 + index * 4, value, true);
  }
  // --- Result ---
  get result() {
    return this.view.getInt32(RESULT_OFFSET, true);
  }
  set result(value) {
    this.view.setInt32(RESULT_OFFSET, value, true);
  }
  get result2() {
    return this.view.getInt32(RESULT2_OFFSET, true);
  }
  set result2(value) {
    this.view.setInt32(RESULT2_OFFSET, value, true);
  }
  // --- Data section ---
  get dataBuffer() {
    return new Uint8Array(this.buffer, DATA_OFFSET2);
  }
  get dataCapacity() {
    return this.buffer.byteLength - DATA_OFFSET2;
  }
  /** Write a UTF-8 string into the data section. Returns bytes written. */
  writeString(str) {
    const encoder2 = new TextEncoder();
    const bytes = encoder2.encode(str);
    const data = this.dataBuffer;
    data.set(bytes);
    return bytes.length;
  }
  /** Read a UTF-8 string from the data section, up to `length` bytes. */
  readString(length) {
    const decoder2 = new TextDecoder();
    return decoder2.decode(new Uint8Array(this.buffer, DATA_OFFSET2, length));
  }
  /**
   * Write two null-separated strings (for rename: oldPath\0newPath).
   * Returns total bytes written.
   */
  writeTwoStrings(s1, s2) {
    const encoder2 = new TextEncoder();
    const b1 = encoder2.encode(s1);
    const b2 = encoder2.encode(s2);
    const data = this.dataBuffer;
    data.set(b1);
    data[b1.length] = 0;
    data.set(b2, b1.length + 1);
    return b1.length + 1 + b2.length;
  }
  /**
   * Read two null-separated strings from the data section.
   */
  readTwoStrings(totalLength) {
    const data = new Uint8Array(this.buffer, DATA_OFFSET2, totalLength);
    const nullIdx = data.indexOf(0);
    const decoder2 = new TextDecoder();
    const s1 = decoder2.decode(data.subarray(0, nullIdx));
    const s2 = decoder2.decode(data.subarray(nullIdx + 1));
    return [s1, s2];
  }
  // --- Stat result serialization (written into data section) ---
  // Layout: 10 × float64 (80 bytes) at DATA_OFFSET
  // Fields: dev, ino, mode, nlink, uid, gid, size, atimeMs, mtimeMs, ctimeMs
  writeStatResult(stat) {
    const f64 = new Float64Array(this.buffer, DATA_OFFSET2, 10);
    f64[0] = stat.dev;
    f64[1] = stat.ino;
    f64[2] = stat.mode;
    f64[3] = stat.nlink;
    f64[4] = stat.uid;
    f64[5] = stat.gid;
    f64[6] = stat.size;
    f64[7] = stat.atimeMs;
    f64[8] = stat.mtimeMs;
    f64[9] = stat.ctimeMs;
  }
  readStatResult() {
    const f64 = new Float64Array(this.buffer, DATA_OFFSET2, 10);
    return {
      dev: f64[0],
      ino: f64[1],
      mode: f64[2],
      nlink: f64[3],
      uid: f64[4],
      gid: f64[5],
      size: f64[6],
      atimeMs: f64[7],
      mtimeMs: f64[8],
      ctimeMs: f64[9]
    };
  }
  // --- Atomic synchronization ---
  /** Block until status transitions away from Pending. */
  waitForComplete() {
    while (true) {
      const current = Atomics.load(this.i32, STATUS_OFFSET2 / 4);
      if (current === 2 /* Complete */ || current === 3 /* Error */) {
        return current;
      }
      Atomics.wait(this.i32, STATUS_OFFSET2 / 4, current, 1e3);
    }
  }
  /** Set status to Complete and wake waiters. */
  notifyComplete() {
    Atomics.store(this.i32, STATUS_OFFSET2 / 4, 2 /* Complete */);
    Atomics.notify(this.i32, STATUS_OFFSET2 / 4);
  }
  /** Set status to Error and wake waiters. */
  notifyError() {
    Atomics.store(this.i32, STATUS_OFFSET2 / 4, 3 /* Error */);
    Atomics.notify(this.i32, STATUS_OFFSET2 / 4);
  }
  /** Set status to Pending and wake the proxy worker. */
  setPending() {
    Atomics.store(this.i32, STATUS_OFFSET2 / 4, 1 /* Pending */);
    Atomics.notify(this.i32, STATUS_OFFSET2 / 4);
  }
};

// src/vfs/opfs.ts
var OpfsFileSystem = class _OpfsFileSystem {
  channel;
  constructor(channel) {
    this.channel = channel;
  }
  static create(sab) {
    return new _OpfsFileSystem(new OpfsChannel(sab));
  }
  /** Send an opcode and block until complete. Returns the result value. Throws on error. */
  call(opcode) {
    this.channel.opcode = opcode;
    this.channel.setPending();
    const status = this.channel.waitForComplete();
    if (status === 3 /* Error */) {
      const errno = this.channel.result;
      throw this.errnoToError(errno);
    }
    return this.channel.result;
  }
  errnoToError(negErrno2) {
    const ERRNO_NAMES = {
      [-1]: "EPERM",
      [-2]: "ENOENT",
      [-9]: "EBADF",
      [-13]: "EACCES",
      [-17]: "EEXIST",
      [-18]: "EXDEV",
      [-20]: "ENOTDIR",
      [-21]: "EISDIR",
      [-22]: "EINVAL",
      [-28]: "ENOSPC",
      [-39]: "ENOTEMPTY",
      [-95]: "ENOTSUP"
    };
    const name = ERRNO_NAMES[negErrno2] || `errno(${negErrno2})`;
    return new Error(name);
  }
  // --- File handle operations ---
  open(path, flags, mode) {
    this.channel.setArg(0, flags);
    this.channel.setArg(1, mode);
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(2, pathLen);
    return this.call(1 /* OPEN */);
  }
  close(handle) {
    this.channel.setArg(0, handle);
    this.call(2 /* CLOSE */);
    return 0;
  }
  read(handle, buffer, offset, length) {
    this.channel.setArg(0, handle);
    this.channel.setArg(1, length);
    if (offset !== null) {
      this.channel.setArg(2, offset & 4294967295);
      this.channel.setArg(3, offset / 4294967296 | 0);
      this.channel.setArg(4, 1);
    } else {
      this.channel.setArg(2, 0);
      this.channel.setArg(3, 0);
      this.channel.setArg(4, 0);
    }
    const bytesRead = this.call(3 /* READ */);
    if (bytesRead > 0) {
      buffer.set(this.channel.dataBuffer.subarray(0, bytesRead));
    }
    return bytesRead;
  }
  write(handle, buffer, offset, length) {
    this.channel.setArg(0, handle);
    this.channel.setArg(1, length);
    if (offset !== null) {
      this.channel.setArg(2, offset & 4294967295);
      this.channel.setArg(3, offset / 4294967296 | 0);
      this.channel.setArg(4, 1);
    } else {
      this.channel.setArg(2, 0);
      this.channel.setArg(3, 0);
      this.channel.setArg(4, 0);
    }
    this.channel.dataBuffer.set(buffer.subarray(0, length));
    return this.call(4 /* WRITE */);
  }
  seek(handle, offset, whence) {
    this.channel.setArg(0, handle);
    this.channel.setArg(1, offset & 4294967295);
    this.channel.setArg(2, offset / 4294967296 | 0);
    this.channel.setArg(3, whence);
    return this.call(5 /* SEEK */);
  }
  fstat(handle) {
    this.channel.setArg(0, handle);
    this.call(6 /* FSTAT */);
    return this.channel.readStatResult();
  }
  ftruncate(handle, length) {
    this.channel.setArg(0, handle);
    this.channel.setArg(1, length & 4294967295);
    this.channel.setArg(2, length / 4294967296 | 0);
    this.call(7 /* FTRUNCATE */);
  }
  fsync(handle) {
    this.channel.setArg(0, handle);
    this.call(8 /* FSYNC */);
  }
  fchmod(_handle, _mode) {
  }
  fchown(_handle, _uid, _gid) {
  }
  // --- Path operations ---
  stat(path) {
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(0, pathLen);
    this.call(9 /* STAT */);
    return this.channel.readStatResult();
  }
  lstat(path) {
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(0, pathLen);
    this.call(10 /* LSTAT */);
    return this.channel.readStatResult();
  }
  mkdir(path, mode) {
    this.channel.setArg(0, mode);
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(1, pathLen);
    this.call(11 /* MKDIR */);
  }
  rmdir(path) {
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(0, pathLen);
    this.call(12 /* RMDIR */);
  }
  unlink(path) {
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(0, pathLen);
    this.call(13 /* UNLINK */);
  }
  rename(oldPath, newPath) {
    const totalLen = this.channel.writeTwoStrings(oldPath, newPath);
    this.channel.setArg(0, totalLen);
    this.call(14 /* RENAME */);
  }
  link(_existingPath, _newPath) {
    throw new Error("ENOTSUP");
  }
  symlink(_target, _path) {
    throw new Error("ENOTSUP");
  }
  readlink(_path) {
    throw new Error("ENOTSUP");
  }
  chmod(_path, _mode) {
  }
  chown(_path, _uid, _gid) {
  }
  access(path, mode) {
    this.channel.setArg(0, mode);
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(1, pathLen);
    this.call(15 /* ACCESS */);
  }
  utimensat(_path, _atimeSec, _atimeNsec, _mtimeSec, _mtimeNsec) {
  }
  // --- Directory iteration ---
  opendir(path) {
    const pathLen = this.channel.writeString(path);
    this.channel.setArg(0, pathLen);
    return this.call(16 /* OPENDIR */);
  }
  readdir(handle) {
    this.channel.setArg(0, handle);
    const rc = this.call(17 /* READDIR */);
    if (rc === 1) return null;
    const nameLen = this.channel.result2;
    const data = this.channel.dataBuffer;
    const name = new TextDecoder().decode(data.subarray(0, nameLen));
    const dtype = data[nameLen];
    return { name, type: dtype, ino: 0 };
  }
  closedir(handle) {
    this.channel.setArg(0, handle);
    this.call(18 /* CLOSEDIR */);
  }
};

// src/vfs/time.ts
var BrowserTimeProvider = class {
  clockGettime(clockId) {
    if (clockId === 1 || clockId === 2 || clockId === 3) {
      const ms = performance.now();
      return { sec: Math.floor(ms / 1e3), nsec: Math.floor(ms % 1e3 * 1e6) };
    }
    const now = Date.now();
    return { sec: Math.floor(now / 1e3), nsec: now % 1e3 * 1e6 };
  }
  nanosleep(sec, nsec) {
    const ms = sec * 1e3 + Math.floor(nsec / 1e6);
    if (ms > 0) {
      const sab = new SharedArrayBuffer(4);
      Atomics.wait(new Int32Array(sab), 0, 0, ms);
    }
  }
};
export {
  BrowserTimeProvider,
  BrowserWorkerAdapter,
  ChannelStatus,
  DeviceFileSystem,
  MemoryFileSystem,
  OPFS_CHANNEL_SIZE,
  OpfsChannel,
  OpfsChannelStatus,
  OpfsFileSystem,
  OpfsOpcode,
  SharedPipeBuffer,
  SyscallChannel,
  VirtualPlatformIO,
  WasmPosixKernel,
  centralizedWorkerMain
};
//# sourceMappingURL=browser.js.map