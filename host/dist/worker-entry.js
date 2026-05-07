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

// src/worker-entry.ts
import { parentPort, workerData } from "worker_threads";

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
  const encoder = new TextEncoder();
  const n = (v) => typeof v === "bigint" ? Number(v) : v;
  return {
    // CRT argv support
    kernel_get_argc: () => _argv.length,
    kernel_argv_read: (index, bufPtr, bufMax) => {
      if (index >= _argv.length) return 0;
      const encoded = encoder.encode(_argv[index]);
      const len = Math.min(encoded.length, bufMax);
      new Uint8Array(memory.buffer, n(bufPtr), len).set(encoded.subarray(0, len));
      return len;
    },
    // CRT environ support
    kernel_environ_count: () => _envVars.length,
    kernel_environ_get: (index, bufPtr, bufMax) => {
      if (index >= _envVars.length) return -1;
      const encoded = encoder.encode(_envVars[index]);
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
  const decoder = new TextDecoder();
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
      const name = decoder.decode(nameBytes);
      return getLinker().dlopenSync(name, bytesCopy);
    },
    __wasm_dlsym: (handle, namePtr, nameLen) => {
      const nameBytes = new Uint8Array(memory.buffer, namePtr, nameLen);
      const name = decoder.decode(nameBytes);
      const result = getLinker().dlsym(handle, name);
      return result === null ? 0 : result;
    },
    __wasm_dlclose: (handle) => {
      return getLinker().dlclose(handle);
    },
    __wasm_dlerror: (bufPtr, bufMax) => {
      const err = getLinker().dlerror();
      if (!err) return 0;
      const encoder = new TextEncoder();
      const encoded = encoder.encode(err);
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
function patchWasmForThread(bytes) {
  const src = new Uint8Array(bytes);
  if (src.length < 8) return bytes;
  function readLEB128(buf, off) {
    let result = 0;
    let shift = 0;
    let pos2 = off;
    for (; ; ) {
      const byte = buf[pos2++];
      result |= (byte & 127) << shift;
      if ((byte & 128) === 0) break;
      shift += 7;
    }
    return [result, pos2 - off];
  }
  function encodeLEB128(value) {
    const result = [];
    do {
      let byte = value & 127;
      value >>>= 7;
      if (value !== 0) byte |= 128;
      result.push(byte);
    } while (value !== 0);
    return result;
  }
  const sections = [];
  let numFuncImports = 0;
  let hasStartSection = false;
  let offset = 8;
  while (offset < src.length) {
    const sectionId = src[offset];
    const [sectionSize, sizeBytes] = readLEB128(src, offset + 1);
    const contentOffset = offset + 1 + sizeBytes;
    const totalSize = 1 + sizeBytes + sectionSize;
    sections.push({ id: sectionId, offset, totalSize, contentOffset, contentSize: sectionSize });
    if (sectionId === 8) hasStartSection = true;
    offset += totalSize;
  }
  if (!hasStartSection) return bytes;
  for (const sec of sections) {
    if (sec.id === 2) {
      let pos2 = sec.contentOffset;
      const [importCount, countBytes] = readLEB128(src, pos2);
      pos2 += countBytes;
      for (let i = 0; i < importCount; i++) {
        const [modLen, modLenBytes] = readLEB128(src, pos2);
        pos2 += modLenBytes + modLen;
        const [fieldLen, fieldLenBytes] = readLEB128(src, pos2);
        pos2 += fieldLenBytes + fieldLen;
        const kind = src[pos2++];
        if (kind === 0) {
          numFuncImports++;
          const [, typeIdxBytes] = readLEB128(src, pos2);
          pos2 += typeIdxBytes;
        } else if (kind === 1) {
          pos2++;
          const flags = src[pos2++];
          const [, minBytes] = readLEB128(src, pos2);
          pos2 += minBytes;
          if (flags & 1) {
            const [, maxBytes] = readLEB128(src, pos2);
            pos2 += maxBytes;
          }
        } else if (kind === 2) {
          const flags = src[pos2++];
          const [, minBytes] = readLEB128(src, pos2);
          pos2 += minBytes;
          if (flags & 1) {
            const [, maxBytes] = readLEB128(src, pos2);
            pos2 += maxBytes;
          }
        } else if (kind === 3) {
          pos2++;
          pos2++;
        }
      }
      break;
    }
  }
  let ctorFuncIndex = -1;
  let exportedFuncIndices = [];
  for (const sec of sections) {
    if (sec.id === 7) {
      let pos2 = sec.contentOffset;
      const [exportCount, countBytes] = readLEB128(src, pos2);
      pos2 += countBytes;
      for (let i = 0; i < exportCount; i++) {
        const [nameLen, nameLenBytes] = readLEB128(src, pos2);
        pos2 += nameLenBytes + nameLen;
        const kind = src[pos2++];
        const [idx, idxBytes] = readLEB128(src, pos2);
        pos2 += idxBytes;
        if (kind === 0) {
          exportedFuncIndices.push(idx);
        }
      }
      break;
    }
  }
  for (const sec of sections) {
    if (sec.id === 10 && exportedFuncIndices.length > 0) {
      const targetFunc = exportedFuncIndices[exportedFuncIndices.length - 1];
      const targetCodeEntry = targetFunc - numFuncImports;
      if (targetCodeEntry < 0) break;
      let pos2 = sec.contentOffset;
      const [, funcCountBytes] = readLEB128(src, pos2);
      pos2 += funcCountBytes;
      for (let i = 0; i < targetCodeEntry; i++) {
        const [bodySize2, bodySizeBytes2] = readLEB128(src, pos2);
        pos2 += bodySizeBytes2 + bodySize2;
      }
      const [bodySize, bodySizeBytes] = readLEB128(src, pos2);
      pos2 += bodySizeBytes;
      const [localCount, localCountBytes] = readLEB128(src, pos2);
      pos2 += localCountBytes;
      for (let i = 0; i < localCount; i++) {
        const [, countB] = readLEB128(src, pos2);
        pos2 += countB;
        pos2++;
      }
      if (src[pos2] === 16) {
        [ctorFuncIndex] = readLEB128(src, pos2 + 1);
      }
      break;
    }
  }
  const ctorCodeEntry = ctorFuncIndex >= 0 ? ctorFuncIndex - numFuncImports : -1;
  if (ctorFuncIndex < 0) {
  }
  const chunks = [];
  chunks.push(src.subarray(0, 8));
  for (const sec of sections) {
    if (sec.id === 8) {
      continue;
    }
    if (sec.id === 10 && ctorCodeEntry >= 0) {
      let pos2 = sec.contentOffset;
      const [funcCount, funcCountBytes] = readLEB128(src, pos2);
      pos2 += funcCountBytes;
      let targetBodyStart = pos2;
      for (let i = 0; i < ctorCodeEntry; i++) {
        const [bodySize, bodySizeBytes] = readLEB128(src, targetBodyStart);
        targetBodyStart += bodySizeBytes + bodySize;
      }
      const [origBodySize, origBodySizeBytes] = readLEB128(src, targetBodyStart);
      const origBodyEnd = targetBodyStart + origBodySizeBytes + origBodySize;
      const newBody = new Uint8Array([2, 0, 11]);
      const beforeTarget = targetBodyStart - sec.contentOffset;
      const afterTarget = sec.contentOffset + sec.contentSize - origBodyEnd;
      const newContentSize = beforeTarget + newBody.length + afterTarget;
      const newSectionSizeBytes = encodeLEB128(newContentSize);
      chunks.push(new Uint8Array([10]));
      chunks.push(new Uint8Array(newSectionSizeBytes));
      chunks.push(src.subarray(sec.contentOffset, targetBodyStart));
      chunks.push(newBody);
      chunks.push(src.subarray(origBodyEnd, sec.contentOffset + sec.contentSize));
    } else {
      chunks.push(src.subarray(sec.offset, sec.offset + sec.totalSize));
    }
  }
  const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out.buffer;
}
async function centralizedThreadWorkerMain(port, initData) {
  const { memory, channelOffset, pid, tid, fnPtr, argPtr, stackPtr, tlsPtr, ctidPtr, tlsAllocAddr } = initData;
  const ptrWidth = initData.ptrWidth ?? 4;
  let threadInstance;
  try {
    let programBytes = null;
    if (!initData.programModule) {
      programBytes = patchWasmForThread(initData.programBytes);
    }
    const module = initData.programModule ? initData.programModule : new WebAssembly.Module(programBytes);
    const kernelImports = buildKernelImports(memory, channelOffset);
    const importObject = buildImportObject(
      module,
      memory,
      kernelImports,
      channelOffset,
      void 0,
      () => threadInstance,
      ptrWidth
    );
    const instance = new WebAssembly.Instance(module, importObject);
    threadInstance = instance;
    const wasmInitTls = instance.exports.__wasm_init_tls;
    const CH_TOTAL = 65608;
    const safeTlsAddr = channelOffset + CH_TOTAL;
    const tlsBlock = safeTlsAddr;
    if (wasmInitTls && tlsBlock > 0) {
      wasmInitTls(ptrWidth === 8 ? BigInt(tlsBlock) : tlsBlock);
    }
    const stackPointer = instance.exports.__stack_pointer;
    if (stackPointer) {
      stackPointer.value = ptrWidth === 8 ? BigInt(stackPtr) : stackPtr;
    }
    const wasmThreadInit = instance.exports.__wasm_thread_init;
    if (wasmThreadInit && tlsPtr > 0) {
      wasmThreadInit(ptrWidth === 8 ? BigInt(tlsPtr) : tlsPtr);
    }
    const getChannelBaseAddr = instance.exports.__get_channel_base_addr;
    if (getChannelBaseAddr) {
      const addr = Number(getChannelBaseAddr());
      if (addr === 0) {
      } else {
        const view = new DataView(memory.buffer);
        if (ptrWidth === 8) {
          view.setBigUint64(addr, BigInt(channelOffset), true);
        } else {
          view.setUint32(addr, channelOffset, true);
        }
      }
    } else if (tlsBlock > 0) {
      const view = new DataView(memory.buffer);
      if (ptrWidth === 8) {
        view.setBigUint64(tlsBlock, BigInt(channelOffset), true);
      } else {
        view.setUint32(tlsBlock, channelOffset, true);
      }
    }
    const table = instance.exports.__indirect_function_table;
    if (!table) {
      throw new Error("No __indirect_function_table export \u2014 cannot call thread function");
    }
    const tableIdx = ptrWidth === 8 ? BigInt(fnPtr) : fnPtr;
    const threadFn = table.get(tableIdx);
    if (!threadFn) {
      throw new Error(`Thread function at table index ${fnPtr} is null`);
    }
    let result;
    try {
      const raw = threadFn(ptrWidth === 8 ? BigInt(argPtr) : argPtr);
      result = Number(raw);
    } catch (e) {
      if (e instanceof Error && e.message.includes("unreachable")) {
        result = 0;
      } else if (e instanceof Error && e.message.includes("null function or function signature mismatch")) {
        result = 0;
      } else {
        throw e;
      }
    }
    if (ctidPtr !== 0) {
      const view = new DataView(memory.buffer);
      view.setInt32(ctidPtr, 0, true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.notify(i32, ctidPtr / 4, 1);
    }
    {
      const view = new DataView(memory.buffer);
      const base = channelOffset;
      view.setInt32(base + 4, 34, true);
      view.setInt32(base + 8, result ?? 0, true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.store(i32, base / 4, 1);
      Atomics.notify(i32, base / 4, 1);
      while (Atomics.wait(i32, base / 4, 1) === "ok") {
      }
      Atomics.store(i32, base / 4, 0);
    }
    port.postMessage({
      type: "thread_exit",
      pid,
      tid
    });
  } catch (err) {
    port.postMessage({
      type: "thread_exit",
      pid,
      tid
    });
  }
}

// src/worker-entry.ts
if (parentPort) {
  parentPort.on("message", () => {
  });
  const data = workerData;
  if (data.type === "centralized_init") {
    centralizedWorkerMain(parentPort, workerData).catch((e) => {
      console.error(`[worker-entry] centralizedWorkerMain error: ${e}`);
    });
  } else if (data.type === "centralized_thread_init") {
    try {
      centralizedThreadWorkerMain(parentPort, workerData).catch((e) => {
        console.error(`[worker-entry] centralizedThreadWorkerMain rejected: ${e}`);
      });
    } catch (e) {
      console.error(`[worker-entry] centralizedThreadWorkerMain threw: ${e}`);
    }
  } else {
    throw new Error(`Unknown worker init type: ${data.type}`);
  }
}
//# sourceMappingURL=worker-entry.js.map