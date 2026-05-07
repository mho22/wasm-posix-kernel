"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/wasi-detect.ts
function isWasiModule(module2) {
  return WebAssembly.Module.imports(module2).some(
    (imp) => imp.module === "wasi_snapshot_preview1"
  );
}
function wasiModuleImportsMemory(module2) {
  return WebAssembly.Module.imports(module2).some(
    (imp) => imp.module === "env" && imp.name === "memory" && imp.kind === "memory"
  );
}
function wasiModuleDefinesMemory(module2) {
  return WebAssembly.Module.exports(module2).some(
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
var CH_SYSCALL2, CH_ARGS2, CH_ARG_SIZE2, CH_RETURN2, CH_ERRNO2, CH_DATA2, CH_DATA_SIZE2, CH_IDLE, CH_PENDING2, SYS_CLOSE, SYS_LSEEK, SYS_FSTAT, SYS_FCNTL2, SYS_GETPID, SYS_EXIT2, SYS_KILL2, SYS_CLOCK_GETTIME, SYS_POLL2, SYS_SENDTO, SYS_RECVFROM, SYS_PREAD2, SYS_PWRITE2, SYS_OPENAT, SYS_FTRUNCATE, SYS_FSYNC, SYS_WRITEV2, SYS_READV2, SYS_FDATASYNC, SYS_FSTATAT, SYS_UNLINKAT, SYS_MKDIRAT, SYS_RENAMEAT, SYS_LINKAT, SYS_SYMLINKAT, SYS_READLINKAT, SYS_GETRANDOM, SYS_GETDENTS64, SYS_CLOCK_GETRES, SYS_UTIMENSAT, SYS_SCHED_YIELD, SYS_FALLOCATE, SYS_DUP2, SYS_SHUTDOWN, O_RDONLY, O_RDWR, O_CREAT, O_EXCL, O_TRUNC, O_APPEND, O_NONBLOCK, O_DIRECTORY, AT_FDCWD, AT_REMOVEDIR, F_GETFL, F_SETFL, SEEK_SET, SEEK_CUR, SEEK_END, S_IFDIR, S_IFCHR, S_IFBLK, S_IFREG, S_IFIFO, S_IFLNK, S_IFSOCK, S_IFMT, WASI_ESUCCESS, WASI_E2BIG, WASI_EACCES, WASI_EADDRINUSE, WASI_EADDRNOTAVAIL, WASI_EAFNOSUPPORT, WASI_EAGAIN, WASI_EALREADY, WASI_EBADF, WASI_EBADMSG, WASI_EBUSY, WASI_ECANCELED, WASI_ECHILD, WASI_ECONNABORTED, WASI_ECONNREFUSED, WASI_ECONNRESET, WASI_EDEADLK, WASI_EDESTADDRREQ, WASI_EDOM, WASI_EDQUOT, WASI_EEXIST, WASI_EFAULT, WASI_EFBIG, WASI_EHOSTUNREACH, WASI_EIDRM, WASI_EILSEQ, WASI_EINPROGRESS, WASI_EINTR, WASI_EINVAL, WASI_EIO, WASI_EISCONN, WASI_EISDIR, WASI_ELOOP, WASI_EMFILE, WASI_EMLINK, WASI_EMSGSIZE, WASI_EMULTIHOP, WASI_ENAMETOOLONG, WASI_ENETDOWN, WASI_ENETRESET, WASI_ENETUNREACH, WASI_ENFILE, WASI_ENOBUFS, WASI_ENODEV, WASI_ENOENT, WASI_ENOEXEC, WASI_ENOLCK, WASI_ENOLINK, WASI_ENOMEM, WASI_ENOMSG, WASI_ENOPROTOOPT, WASI_ENOSPC, WASI_ENOSYS, WASI_ENOTCONN, WASI_ENOTDIR, WASI_ENOTEMPTY, WASI_ENOTRECOVERABLE, WASI_ENOTSOCK, WASI_ENOTSUP, WASI_ENOTTY, WASI_ENXIO, WASI_EOVERFLOW, WASI_EOWNERDEAD, WASI_EPERM, WASI_EPIPE, WASI_EPROTO, WASI_EPROTONOSUPPORT, WASI_EPROTOTYPE, WASI_ERANGE, WASI_EROFS, WASI_ESPIPE, WASI_ESRCH, WASI_ESTALE, WASI_ETIMEDOUT, WASI_ETXTBSY, WASI_EXDEV, linuxToWasi, WASI_FILETYPE_UNKNOWN, WASI_FILETYPE_BLOCK_DEVICE, WASI_FILETYPE_CHARACTER_DEVICE, WASI_FILETYPE_DIRECTORY, WASI_FILETYPE_REGULAR_FILE, WASI_FILETYPE_SOCKET_STREAM, WASI_FILETYPE_SYMBOLIC_LINK, WASI_CLOCK_REALTIME, WASI_CLOCK_MONOTONIC, WASI_CLOCK_PROCESS_CPUTIME, WASI_CLOCK_THREAD_CPUTIME, CLOCK_REALTIME, CLOCK_MONOTONIC, CLOCK_PROCESS_CPUTIME_ID, CLOCK_THREAD_CPUTIME_ID, WASI_WHENCE_SET, WASI_WHENCE_CUR, WASI_WHENCE_END, WASI_O_CREAT, WASI_O_DIRECTORY, WASI_O_EXCL, WASI_O_TRUNC, WASI_FDFLAG_APPEND, WASI_FDFLAG_NONBLOCK, WASI_EVENTTYPE_CLOCK, WASI_EVENTTYPE_FD_READ, WASI_RIGHTS_ALL, WASI_PREOPENTYPE_DIR, POLLIN, POLLOUT, POLLERR, WasiExit, WasiShim;
var init_wasi_shim = __esm({
  "src/wasi-shim.ts"() {
    "use strict";
    init_wasi_detect();
    CH_SYSCALL2 = 4;
    CH_ARGS2 = 8;
    CH_ARG_SIZE2 = 8;
    CH_RETURN2 = 56;
    CH_ERRNO2 = 64;
    CH_DATA2 = 72;
    CH_DATA_SIZE2 = 65536;
    CH_IDLE = 0;
    CH_PENDING2 = 1;
    SYS_CLOSE = 2;
    SYS_LSEEK = 5;
    SYS_FSTAT = 6;
    SYS_FCNTL2 = 10;
    SYS_GETPID = 28;
    SYS_EXIT2 = 34;
    SYS_KILL2 = 35;
    SYS_CLOCK_GETTIME = 40;
    SYS_POLL2 = 60;
    SYS_SENDTO = 62;
    SYS_RECVFROM = 63;
    SYS_PREAD2 = 64;
    SYS_PWRITE2 = 65;
    SYS_OPENAT = 69;
    SYS_FTRUNCATE = 79;
    SYS_FSYNC = 80;
    SYS_WRITEV2 = 81;
    SYS_READV2 = 82;
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
        const dataArea = this.channelOffset + CH_DATA2;
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
        view.setInt32(base + CH_SYSCALL2, syscallNum, true);
        view.setBigInt64(base + CH_ARGS2 + 0 * CH_ARG_SIZE2, BigInt(a0), true);
        view.setBigInt64(base + CH_ARGS2 + 1 * CH_ARG_SIZE2, BigInt(a1), true);
        view.setBigInt64(base + CH_ARGS2 + 2 * CH_ARG_SIZE2, BigInt(a2), true);
        view.setBigInt64(base + CH_ARGS2 + 3 * CH_ARG_SIZE2, BigInt(a3), true);
        view.setBigInt64(base + CH_ARGS2 + 4 * CH_ARG_SIZE2, BigInt(a4), true);
        view.setBigInt64(base + CH_ARGS2 + 5 * CH_ARG_SIZE2, BigInt(a5), true);
        const i32 = new Int32Array(this.memory.buffer);
        const statusIdx = base / 4;
        Atomics.store(i32, statusIdx, CH_PENDING2);
        Atomics.notify(i32, statusIdx, 1);
        while (Atomics.wait(i32, statusIdx, CH_PENDING2) === "ok") {
        }
        const result = Number(view.getBigInt64(base + CH_RETURN2, true));
        const errno = view.getUint32(base + CH_ERRNO2, true);
        Atomics.store(i32, statusIdx, CH_IDLE);
        return { result, errno };
      }
      /** Get the channel data area address. */
      get dataArea() {
        return this.channelOffset + CH_DATA2;
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
        const path2 = this.decoder.decode(pathBytes);
        const preopenPath = this.preopens.get(dirfd);
        let fullPath;
        if (preopenPath !== void 0) {
          if (preopenPath === "/") {
            fullPath = path2.startsWith("/") ? path2 : "/" + path2;
          } else {
            fullPath = preopenPath + (path2.startsWith("/") ? path2 : "/" + path2);
          }
        } else {
          fullPath = path2;
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
        const path2 = this.preopens.get(fd);
        if (path2 === void 0) return WASI_EBADF;
        const view = new DataView(this.memory.buffer);
        view.setUint8(prestatPtr, WASI_PREOPENTYPE_DIR);
        view.setUint32(prestatPtr + 4, this.encoder.encode(path2).length, true);
        return WASI_ESUCCESS;
      }
      fd_prestat_dir_name(fd, pathPtr, pathLen) {
        const path2 = this.preopens.get(fd);
        if (path2 === void 0) return WASI_EBADF;
        const encoded = this.encoder.encode(path2);
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
        const { result, errno } = this.doSyscall(SYS_READV2, fd, iovsPtr, iovsLen);
        if (errno) return translateLinuxErrno(errno);
        const view = new DataView(this.memory.buffer);
        view.setUint32(nreadOut, result, true);
        return WASI_ESUCCESS;
      }
      fd_write(fd, iovsPtr, iovsLen, nwrittenOut) {
        const { result, errno } = this.doSyscall(SYS_WRITEV2, fd, iovsPtr, iovsLen);
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
        totalLen = Math.min(totalLen, CH_DATA_SIZE2 - 256);
        const { result, errno } = this.doSyscall(
          SYS_PREAD2,
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
          const copyLen = Math.min(bufLen, CH_DATA_SIZE2 - 256 - totalLen);
          mem.copyWithin(this.dataArea + totalLen, bufPtr, bufPtr + copyLen);
          totalLen += copyLen;
        }
        const { result, errno } = this.doSyscall(
          SYS_PWRITE2,
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
        const { result: flags, errno: fcntlErr } = this.doSyscall(SYS_FCNTL2, fd, F_GETFL);
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
        const { errno } = this.doSyscall(SYS_FCNTL2, fd, F_SETFL, posixFlags);
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
        const maxRead = Math.min(CH_DATA_SIZE2 - 256, 32768);
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
        const maxLen = Math.min(bufLen, CH_DATA_SIZE2 - 4096 - 256);
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
          const chunkSize = Math.min(bufLen - offset, CH_DATA_SIZE2 - 256);
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
        this.doSyscall(SYS_EXIT2, code);
        throw new WasiExit(code);
      }
      proc_raise(sig) {
        const { result: pid } = this.doSyscall(SYS_GETPID);
        const { errno } = this.doSyscall(SYS_KILL2, pid, sig);
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
            this.doSyscall(SYS_POLL2, 0, 0, timeoutMs);
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
          SYS_POLL2,
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
        totalLen = Math.min(totalLen, CH_DATA_SIZE2 - 256);
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
          const copyLen = Math.min(bufLen, CH_DATA_SIZE2 - 256 - totalLen);
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
    return (0, import_fflate.inflateSync)(compressedData);
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
var import_fflate, EOCD_SIGNATURE, CENTRAL_DIR_SIGNATURE, LOCAL_FILE_HEADER_SIGNATURE, EOCD_MAX_SEARCH, EOCD_MIN_SIZE, CENTRAL_DIR_FIXED_SIZE, LOCAL_HEADER_FIXED_SIZE, COMPRESSION_STORE, COMPRESSION_DEFLATE, CREATOR_UNIX, S_IFLNK3, S_IFMT3;
var init_zip = __esm({
  "src/vfs/zip.ts"() {
    "use strict";
    import_fflate = require("fflate");
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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BrowserTimeProvider: () => BrowserTimeProvider,
  CH_TOTAL_SIZE: () => CH_TOTAL_SIZE2,
  CentralizedKernelWorker: () => CentralizedKernelWorker,
  ChannelStatus: () => ChannelStatus,
  DEFAULT_MAX_PAGES: () => DEFAULT_MAX_PAGES,
  DeviceFileSystem: () => DeviceFileSystem,
  DynamicLinker: () => DynamicLinker,
  FetchNetworkBackend: () => FetchNetworkBackend,
  HostFileSystem: () => HostFileSystem,
  MemoryFileSystem: () => MemoryFileSystem,
  MockWorkerAdapter: () => MockWorkerAdapter,
  MockWorkerHandle: () => MockWorkerHandle,
  NodeKernelHost: () => NodeKernelHost,
  NodePlatformIO: () => NodePlatformIO,
  NodeTimeProvider: () => NodeTimeProvider,
  NodeWorkerAdapter: () => NodeWorkerAdapter,
  OPFS_CHANNEL_SIZE: () => OPFS_CHANNEL_SIZE,
  OpfsChannel: () => OpfsChannel,
  OpfsChannelStatus: () => OpfsChannelStatus,
  OpfsFileSystem: () => OpfsFileSystem,
  OpfsOpcode: () => OpfsOpcode,
  PAGES_PER_THREAD: () => PAGES_PER_THREAD,
  SharedLockTable: () => SharedLockTable,
  SharedPipeBuffer: () => SharedPipeBuffer,
  SyscallChannel: () => SyscallChannel,
  TcpNetworkBackend: () => TcpNetworkBackend,
  ThreadPageAllocator: () => ThreadPageAllocator,
  VirtualPlatformIO: () => VirtualPlatformIO,
  WASM_PAGE_SIZE: () => WASM_PAGE_SIZE,
  WasiExit: () => WasiExit,
  WasiShim: () => WasiShim,
  WasmPosixKernel: () => WasmPosixKernel,
  binariesDir: () => binariesDir,
  centralizedThreadWorkerMain: () => centralizedThreadWorkerMain,
  centralizedWorkerMain: () => centralizedWorkerMain,
  decompressVfsImage: () => decompressVfsImage,
  findRepoRoot: () => findRepoRoot,
  isWasiModule: () => isWasiModule,
  loadSharedLibrary: () => loadSharedLibrary,
  loadSharedLibrarySync: () => loadSharedLibrarySync,
  loadVfsImage: () => loadVfsImage,
  localBinariesDir: () => localBinariesDir,
  parseDylinkSection: () => parseDylinkSection,
  resolveBinary: () => resolveBinary,
  tryResolveBinary: () => tryResolveBinary,
  wasiModuleDefinesMemory: () => wasiModuleDefinesMemory,
  wasiModuleImportsMemory: () => wasiModuleImportsMemory
});
module.exports = __toCommonJS(index_exports);

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
  static hashPath(path2) {
    let hash = 2166136261;
    for (let i = 0; i < path2.length; i++) {
      hash ^= path2.charCodeAt(i);
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
    const module2 = await WebAssembly.compile(wasmBytes);
    this.instance = await WebAssembly.instantiate(module2, importObject);
  }
  /**
   * Like init(), but uses an existing shared WebAssembly.Memory instead of
   * creating a new one. Used by thread workers that share the parent's memory.
   */
  async initWithMemory(wasmBytes, memory) {
    this.memory = memory;
    const importObject = this.buildImportObject(memory);
    const module2 = await WebAssembly.compile(wasmBytes);
    this.instance = await WebAssembly.instantiate(module2, importObject);
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
      const path2 = new TextDecoder().decode(pathBytes);
      return BigInt(this.io.open(path2, flags, mode));
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      const stat = this.io.stat(path2);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      const stat = this.io.lstat(path2);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.mkdir(path2, mode);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.rmdir(path2);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.unlink(path2);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      const target = this.io.readlink(path2);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.chmod(path2, mode);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.chown(path2, uid, gid);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.access(path2, amode);
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      this.io.utimensat(path2, Number(atimeSec), Number(atimeNsec), Number(mtimeSec), Number(mtimeNsec));
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
      const path2 = this.readPathFromMemory(pathPtr, pathLen);
      return BigInt(this.io.opendir(path2));
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
      const path2 = new TextDecoder().decode(mem.slice(pathPtr, pathPtr + pathLen));
      return this.callbacks.onExec(path2);
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
      const path2 = new TextDecoder().decode(mem.slice(pathPtr, pathPtr + pathLen));
      const pathHash = SharedLockTable.hashPath(path2);
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

// src/kernel-worker.ts
var CH_PENDING = 1;
var CH_COMPLETE = 2;
var EAGAIN = 11;
var ETIMEDOUT = 110;
var EINTR_ERRNO = 4;
var SYS_NANOSLEEP = 41;
var SYS_USLEEP = 68;
var SYS_CLOCK_NANOSLEEP = 124;
var SYS_FUTEX = 200;
var SYS_POLL = 60;
var SYS_PPOLL = 251;
var SYS_PSELECT6 = 252;
var SYS_EPOLL_PWAIT = 241;
var SYS_EPOLL_CREATE1 = 239;
var SYS_EPOLL_CREATE = 378;
var SYS_EPOLL_CTL = 240;
var SYS_EPOLL_WAIT = 379;
var SYS_RT_SIGTIMEDWAIT = 207;
var SYS_KILL = 35;
var SYS_EXECVE = 211;
var SYS_EXECVEAT = 386;
var SYS_FORK = 212;
var SYS_VFORK = 213;
var SYS_CLONE = 201;
var SYS_EXIT = 34;
var SYS_EXIT_GROUP = 387;
var SYS_SETPGID = 90;
var SYS_SETSID = 92;
var SYS_WAIT4 = 139;
var SYS_WAITID = 288;
var SYS_THREAD_CANCEL = 415;
var WNOHANG = 1;
var WNOWAIT = 16777216;
var P_ALL = 0;
var P_PID = 1;
var P_PGID = 2;
var CLD_EXITED = 1;
var CLD_KILLED = 2;
var SIGCHLD = 17;
var SIGALRM = 14;
var SIOCGIFCONF = 35090;
var SIOCGIFHWADDR = 35111;
var SIOCGIFADDR = 35093;
var SYS_IOCTL = 72;
var SYS_MMAP = 46;
var SYS_MUNMAP = 47;
var SYS_BRK = 48;
var SYS_MREMAP = 126;
var SYS_MSYNC = 278;
var SYS_WRITE = 4;
var SYS_PREAD = 64;
var SYS_PWRITE = 65;
var MAP_SHARED = 1;
var MAP_ANONYMOUS = 32;
var SYS_WRITEV = 81;
var SYS_READV = 82;
var SYS_PREADV = 295;
var SYS_PWRITEV = 296;
var SYS_FCNTL = 10;
var SYS_MSGRCV = 338;
var SYS_MSGSND = 339;
var SYS_SEMOP = 342;
var SYS_SEMCTL = 343;
var SYS_SHMAT = 345;
var SYS_SHMDT = 346;
var SYS_MQ_TIMEDSEND = 333;
var SYS_MQ_TIMEDRECEIVE = 334;
var IPC_64 = 256;
var F_GETLK = 5;
var F_SETLK = 6;
var F_SETLKW = 7;
var F_GETLK64 = 12;
var F_SETLK64 = 13;
var F_SETLKW64 = 14;
var F_OFD_GETLK = 36;
var F_OFD_SETLK = 37;
var F_OFD_SETLKW = 38;
var PROFILING = typeof process !== "undefined" && !!process.env?.WASM_POSIX_PROFILE;
var READ_LIKE_SYSCALLS = /* @__PURE__ */ new Set([3, 56, 63, 64, 82, 138]);
var WRITE_LIKE_SYSCALLS = /* @__PURE__ */ new Set([4, 55, 62, 65, 81, 137, 294]);
var CH_STATUS = 0;
var CH_SYSCALL = 4;
var CH_ARGS = 8;
var CH_ARG_SIZE = 8;
var CH_ARGS_COUNT = 6;
var CH_RETURN = 56;
var CH_ERRNO = 64;
var CH_DATA = 72;
var CH_DATA_SIZE = 65536;
var CH_TOTAL_SIZE = CH_DATA + CH_DATA_SIZE;
var CH_SIG_BASE = CH_DATA + CH_DATA_SIZE - 48;
var CH_SIG_SIGNUM = CH_SIG_BASE;
var CH_SIG_HANDLER = CH_SIG_BASE + 4;
var CH_SIG_FLAGS = CH_SIG_BASE + 8;
var CH_SIG_SI_VALUE = CH_SIG_BASE + 12;
var CH_SIG_OLD_MASK = CH_SIG_BASE + 16;
var CH_SIG_SI_CODE = CH_SIG_BASE + 24;
var CH_SIG_SI_PID = CH_SIG_BASE + 28;
var CH_SIG_SI_UID = CH_SIG_BASE + 32;
var CH_SIG_ALT_SP = CH_SIG_BASE + 36;
var CH_SIG_ALT_SIZE = CH_SIG_BASE + 40;
var SCRATCH_SIZE = CH_TOTAL_SIZE;
var WASM_STAT_SIZE2 = 88;
var TIMESPEC_SIZE = 16;
var ITIMERVAL_SIZE = 16;
var RLIMIT_SIZE = 16;
var STACK_T_SIZE = 12;
var SYSCALL_ARGS = {
  // File operations
  1: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // OPEN: path
  3: [{ argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }],
  // READ: buf
  4: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // WRITE: buf
  6: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: WASM_STAT_SIZE2 } }],
  // FSTAT: stat_buf
  64: [{ argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }],
  // PREAD: buf
  65: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // PWRITE: buf
  // _llseek
  119: [{ argIndex: 3, direction: "out", size: { type: "fixed", size: 8 } }],
  // _LLSEEK: result_ptr (off_t)
  // FD operations
  9: [{ argIndex: 0, direction: "out", size: { type: "fixed", size: 8 } }],
  // PIPE: 2 x i32
  78: [{ argIndex: 0, direction: "out", size: { type: "fixed", size: 8 } }],
  // PIPE2: 2 x i32
  // Stat
  11: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // STAT: path
    { argIndex: 1, direction: "out", size: { type: "fixed", size: WASM_STAT_SIZE2 } }
  ],
  12: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // LSTAT: path
    { argIndex: 1, direction: "out", size: { type: "fixed", size: WASM_STAT_SIZE2 } }
  ],
  93: [
    { argIndex: 1, direction: "in", size: { type: "cstring" } },
    // FSTATAT: path
    { argIndex: 2, direction: "out", size: { type: "fixed", size: WASM_STAT_SIZE2 } }
  ],
  // Directory operations
  13: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // MKDIR: path
  14: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // RMDIR: path
  15: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // UNLINK: path
  16: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // RENAME: old
    { argIndex: 1, direction: "in", size: { type: "cstring" } }
    //         new
  ],
  17: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // LINK: old
    { argIndex: 1, direction: "in", size: { type: "cstring" } }
    //       new
  ],
  18: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // SYMLINK: target
    { argIndex: 1, direction: "in", size: { type: "cstring" } }
    //          linkpath
  ],
  19: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // READLINK: path
    { argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }
    //           buf
  ],
  20: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // CHMOD: path
  21: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // CHOWN: path
  22: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // ACCESS: path
  23: [{ argIndex: 0, direction: "out", size: { type: "arg", argIndex: 1 } }],
  // GETCWD: buf
  24: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // CHDIR: path
  25: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // OPENDIR: path
  26: [
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 16 } },
    // READDIR: dirent
    { argIndex: 2, direction: "out", size: { type: "arg", argIndex: 3 } }
    //          name_buf
  ],
  122: [{ argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }],
  // GETDENTS64: buf
  // Signals
  36: [
    { argIndex: 1, direction: "in", size: { type: "fixed", size: 16 } },
    // SIGACTION: act
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 16 } }
    //            oldact
  ],
  37: [
    { argIndex: 1, direction: "in", size: { type: "fixed", size: 8 } },
    // SIGPROCMASK: set
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 8 } }
    //              oldset
  ],
  110: [{ argIndex: 0, direction: "in", size: { type: "fixed", size: 8 } }],
  // SIGSUSPEND: mask
  205: [{ argIndex: 2, direction: "in", size: { type: "fixed", size: 128 } }],
  // RT_SIGQUEUEINFO: siginfo_t
  // Time
  40: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: TIMESPEC_SIZE } }],
  // CLOCK_GETTIME
  41: [{ argIndex: 0, direction: "in", size: { type: "fixed", size: TIMESPEC_SIZE } }],
  // NANOSLEEP
  123: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: TIMESPEC_SIZE } }],
  // CLOCK_GETRES
  124: [{ argIndex: 2, direction: "in", size: { type: "fixed", size: TIMESPEC_SIZE } }],
  // CLOCK_NANOSLEEP
  // POSIX timers
  326: [
    // TIMER_CREATE: (clock_id, sigevent, *timerid)
    { argIndex: 1, direction: "in", size: { type: "fixed", size: 16 } },
    //   ksigevent (16 bytes)
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 4 } }
    //   timerid (i32)
  ],
  327: [
    // TIMER_SETTIME: (timerid, flags, new, old)
    { argIndex: 2, direction: "in", size: { type: "fixed", size: 32 } },
    //   new itimerspec (4 x i64 = 32 bytes)
    { argIndex: 3, direction: "out", size: { type: "fixed", size: 32 } }
    //   old itimerspec (4 x i64 = 32 bytes)
  ],
  328: [
    // TIMER_GETTIME: (timerid, curr)
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 32 } }
    //   curr itimerspec (4 x i64 = 32 bytes)
  ],
  // UTIMENSAT: (dirfd, path, times, flags)
  125: [
    { argIndex: 1, direction: "in", size: { type: "cstring" } },
    { argIndex: 2, direction: "in", size: { type: "fixed", size: TIMESPEC_SIZE * 2 } }
  ],
  250: [
    { argIndex: 2, direction: "in", size: { type: "fixed", size: 16 } },
    // PRLIMIT64: new_rlim
    { argIndex: 3, direction: "out", size: { type: "fixed", size: 16 } }
    //            old_rlim
  ],
  // Environment
  43: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // GETENV: name
    { argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }
    //         buf
  ],
  44: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // SETENV: name
    { argIndex: 1, direction: "in", size: { type: "cstring" } }
    //         value
  ],
  45: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // UNSETENV: name
  75: [{ argIndex: 0, direction: "out", size: { type: "fixed", size: 390 } }],
  // UNAME: buf (struct utsname = 6x65)
  120: [{ argIndex: 0, direction: "out", size: { type: "arg", argIndex: 1 } }],
  // GETRANDOM: buf
  109: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // REALPATH: path
    { argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }
    //           buf
  ],
  // Scheduling
  230: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: 36 } }],
  // SCHED_GETPARAM: param (36-byte struct)
  236: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: 16 } }],
  // SCHED_RR_GET_INTERVAL: timespec (16 bytes)
  // Signals
  206: [{ argIndex: 0, direction: "out", size: { type: "fixed", size: 8 } }],
  // RT_SIGPENDING: set
  207: [
    // RT_SIGTIMEDWAIT: (mask, info, timeout)
    { argIndex: 0, direction: "in", size: { type: "fixed", size: 8 } },
    //   mask (sigset_t, 8 bytes)
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 128 } },
    //   info (siginfo_t, 128 bytes)
    { argIndex: 2, direction: "in", size: { type: "fixed", size: 16 } }
    //   timeout (timespec, 16 bytes)
  ],
  209: [
    // SIGALTSTACK: ss + oss
    { argIndex: 0, direction: "in", size: { type: "fixed", size: STACK_T_SIZE } },
    // ss (input)
    { argIndex: 1, direction: "out", size: { type: "fixed", size: STACK_T_SIZE } }
    // oss (output)
  ],
  // Sockets
  51: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // BIND: addr
  53: [
    // ACCEPT: addr + addrlen
    { argIndex: 1, direction: "out", size: { type: "deref", argIndex: 2 } },
    { argIndex: 2, direction: "inout", size: { type: "fixed", size: 4 } }
  ],
  384: [
    // ACCEPT4: addr + addrlen (same as accept)
    { argIndex: 1, direction: "out", size: { type: "deref", argIndex: 2 } },
    { argIndex: 2, direction: "inout", size: { type: "fixed", size: 4 } }
  ],
  54: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // CONNECT: addr
  59: [{ argIndex: 3, direction: "in", size: { type: "arg", argIndex: 4 } }],
  // SETSOCKOPT: optval
  114: [
    // GETSOCKNAME: addr + addrlen
    { argIndex: 1, direction: "out", size: { type: "deref", argIndex: 2 } },
    //   addr (output, size from *addrlen)
    { argIndex: 2, direction: "inout", size: { type: "fixed", size: 4 } }
    //   addrlen (inout, socklen_t = 4 bytes)
  ],
  115: [
    // GETPEERNAME: addr + addrlen
    { argIndex: 1, direction: "out", size: { type: "deref", argIndex: 2 } },
    { argIndex: 2, direction: "inout", size: { type: "fixed", size: 4 } }
  ],
  55: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // SEND: buf
  56: [{ argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }],
  // RECV: buf
  58: [
    // GETSOCKOPT: optval + optlen
    { argIndex: 3, direction: "out", size: { type: "deref", argIndex: 4 } },
    //   optval (output, size from *optlen)
    { argIndex: 4, direction: "inout", size: { type: "fixed", size: 4 } }
    //   optlen (inout, socklen_t = 4 bytes)
  ],
  61: [{ argIndex: 3, direction: "out", size: { type: "fixed", size: 8 } }],
  // SOCKETPAIR: sv
  140: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // GETADDRINFO: name
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 256 } }
    //              result_buf
  ],
  137: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // SENDMSG: msg
  138: [{ argIndex: 1, direction: "inout", size: { type: "arg", argIndex: 2 } }],
  // RECVMSG: msg
  62: [
    { argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } },
    // SENDTO: buf
    { argIndex: 4, direction: "in", size: { type: "arg", argIndex: 5 } }
    //         dest_addr
  ],
  63: [
    { argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } },
    // RECVFROM: buf
    { argIndex: 4, direction: "out", size: { type: "deref", argIndex: 5 } },
    //           src_addr (size from *addrlen)
    { argIndex: 5, direction: "inout", size: { type: "fixed", size: 4 } }
    //           addrlen (inout, socklen_t = 4)
  ],
  // Poll/select
  60: [{ argIndex: 0, direction: "inout", size: { type: "arg", argIndex: 1 } }],
  // POLL: fds (nfds * 8)
  251: [{ argIndex: 0, direction: "inout", size: { type: "arg", argIndex: 1 } }],
  // PPOLL: fds (nfds * 8)
  // (epoll syscalls are now intercepted on the host side — see handleEpollCreate/Ctl/Pwait)
  // Terminal
  70: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: 256 } }],
  // TCGETATTR
  71: [{ argIndex: 2, direction: "in", size: { type: "fixed", size: 256 } }],
  // TCSETATTR
  72: [{ argIndex: 2, direction: "inout", size: { type: "fixed", size: 256 } }],
  // IOCTL
  // File system
  85: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // TRUNCATE: path
  // statfs64/fstatfs64: musl sends (path, sizeof, buf) / (fd, sizeof, buf)
  // because SYS_statfs64 is aliased to SYS_statfs on our platform
  129: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // STATFS64: path
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 72 } }
    //           buf (WasmStatfs = 72 bytes)
  ],
  130: [{ argIndex: 2, direction: "out", size: { type: "fixed", size: 72 } }],
  // FSTATFS64: buf (WasmStatfs = 72 bytes)
  // *at variants
  69: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // OPENAT: path
  94: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // UNLINKAT: path
  95: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // MKDIRAT: path
  96: [
    { argIndex: 1, direction: "in", size: { type: "cstring" } },
    // RENAMEAT: oldpath
    { argIndex: 3, direction: "in", size: { type: "cstring" } }
    //           newpath
  ],
  97: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // FACCESSAT: path
  98: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // FCHMODAT: path
  99: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // FCHOWNAT: path
  100: [
    { argIndex: 1, direction: "in", size: { type: "cstring" } },
    // LINKAT: oldpath
    { argIndex: 3, direction: "in", size: { type: "cstring" } }
    //         newpath
  ],
  101: [
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    // SYMLINKAT: target
    { argIndex: 2, direction: "in", size: { type: "cstring" } }
    //            linkpath
  ],
  102: [
    { argIndex: 1, direction: "in", size: { type: "cstring" } },
    // READLINKAT: path
    { argIndex: 2, direction: "out", size: { type: "arg", argIndex: 3 } }
    //             buf (a3), bufsiz (a4)
  ],
  // Resource limits
  83: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: RLIMIT_SIZE } }],
  // GETRLIMIT
  84: [{ argIndex: 1, direction: "in", size: { type: "fixed", size: RLIMIT_SIZE } }],
  // SETRLIMIT
  108: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: 144 } }],
  // GETRUSAGE: buf (time64 rusage = 18x8)
  132: [
    { argIndex: 0, direction: "out", size: { type: "fixed", size: 4 } },
    // GETRESUID
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 4 } },
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 4 } }
  ],
  134: [
    { argIndex: 0, direction: "out", size: { type: "fixed", size: 4 } },
    // GETRESGID
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 4 } },
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 4 } }
  ],
  // Wait
  139: [
    { argIndex: 1, direction: "out", size: { type: "fixed", size: 4 } },
    // WAIT4: wstatus
    { argIndex: 3, direction: "out", size: { type: "fixed", size: 32 } }
    //        rusage
  ],
  // Exec
  211: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // EXECVE: path
  // prctl(option, arg2, arg3, arg4, arg5)
  // Always marshal arg2 as a 16-byte inout buffer:
  //   PR_SET_NAME (15): kernel reads thread name from buf
  //   PR_GET_NAME (16): kernel writes thread name to buf
  //   Any other option: kernel ignores buf entirely (sys_prctl returns Ok(()) for
  //   unknown options without touching it), so always-marshalling is wasted-but-safe.
  // Without this, the user's wasm32 buffer pointer was passed unchanged to the
  // kernel's `from_raw_parts_mut(arg2 as *mut u8, 16)` — the kernel would
  // dereference user-space addresses against its own memory, with the failure
  // mode depending on whether the address landed in already-grown kernel pages
  // (silent corruption) or past them (RuntimeError: memory access out of bounds).
  // Triggered by mariadbd's pthread_setname_np during boot.
  223: [{ argIndex: 1, direction: "inout", size: { type: "fixed", size: 16 } }],
  // Timer
  225: [
    { argIndex: 1, direction: "in", size: { type: "fixed", size: ITIMERVAL_SIZE } },
    // SETITIMER: new
    { argIndex: 2, direction: "out", size: { type: "fixed", size: ITIMERVAL_SIZE } }
    //            old
  ],
  224: [{ argIndex: 1, direction: "out", size: { type: "fixed", size: ITIMERVAL_SIZE } }],
  // GETITIMER
  // statx
  260: [
    { argIndex: 1, direction: "in", size: { type: "cstring" } },
    // STATX: path
    { argIndex: 4, direction: "out", size: { type: "fixed", size: 256 } }
    //        statxbuf (a5)
  ],
  // mknod/mknodat
  271: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // MKNOD: path
  272: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // MKNODAT: path
  // faccessat2/fchmodat2
  382: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // FACCESSAT2: path
  383: [{ argIndex: 1, direction: "in", size: { type: "cstring" } }],
  // FCHMODAT2: path
  // POSIX message queues
  331: [
    // MQ_OPEN: (name, flags, mode, attr)
    { argIndex: 0, direction: "in", size: { type: "cstring" } },
    //   name
    { argIndex: 3, direction: "in", size: { type: "fixed", size: 32 } }
    //   mq_attr (if O_CREAT && non-null)
  ],
  332: [{ argIndex: 0, direction: "in", size: { type: "cstring" } }],
  // MQ_UNLINK: name
  333: [
    // MQ_TIMEDSEND: (mqd, msg_ptr, msg_len, priority, timeout)
    { argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } },
    //   message data
    { argIndex: 4, direction: "in", size: { type: "fixed", size: 16 } }
    //   timespec (optional)
  ],
  334: [
    // MQ_TIMEDRECEIVE: (mqd, msg_ptr, msg_len, prio_ptr, timeout)
    { argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } },
    //   message buffer (out)
    { argIndex: 3, direction: "out", size: { type: "fixed", size: 4 } },
    //   priority (out)
    { argIndex: 4, direction: "in", size: { type: "fixed", size: 16 } }
    //   timespec (optional)
  ],
  335: [
    // MQ_NOTIFY: (mqd, sigevent)
    { argIndex: 1, direction: "in", size: { type: "fixed", size: 16 } }
    //   sigevent (optional)
  ],
  336: [
    // MQ_GETSETATTR: (mqd, new_attr, old_attr)
    { argIndex: 1, direction: "in", size: { type: "fixed", size: 32 } },
    //   new mq_attr (optional)
    { argIndex: 2, direction: "out", size: { type: "fixed", size: 32 } }
    //   old mq_attr (out)
  ],
  // SysV IPC
  338: [{ argIndex: 1, direction: "out", size: { type: "arg", argIndex: 2 } }],
  // MSGRCV: msgp ({mtype, mtext})
  339: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // MSGSND: msgp ({mtype, mtext})
  340: [{ argIndex: 2, direction: "inout", size: { type: "fixed", size: 96 } }],
  // MSGCTL: msqid_ds buf
  342: [{ argIndex: 1, direction: "in", size: { type: "arg", argIndex: 2 } }],
  // SEMOP: sembuf[] (nsops * 6)
  347: [{ argIndex: 2, direction: "inout", size: { type: "fixed", size: 88 } }]
  // SHMCTL: shmid_ds buf
};
var SYSCALL_NAMES = {
  1: "open",
  2: "close",
  3: "read",
  4: "write",
  5: "lseek",
  6: "fstat",
  7: "dup",
  8: "dup2",
  9: "pipe",
  10: "fcntl",
  11: "stat",
  12: "lstat",
  13: "mkdir",
  14: "rmdir",
  15: "unlink",
  16: "rename",
  17: "link",
  18: "symlink",
  19: "readlink",
  20: "chmod",
  21: "chown",
  22: "access",
  23: "getcwd",
  24: "chdir",
  25: "opendir",
  26: "readdir",
  27: "closedir",
  28: "getpid",
  29: "getppid",
  30: "getuid",
  31: "geteuid",
  32: "getgid",
  33: "getegid",
  34: "exit",
  35: "kill",
  36: "sigaction",
  37: "sigprocmask",
  38: "raise",
  40: "clock_gettime",
  41: "nanosleep",
  43: "getenv",
  44: "setenv",
  45: "unsetenv",
  46: "mmap",
  47: "munmap",
  48: "brk",
  50: "socket",
  51: "bind",
  52: "listen",
  53: "accept",
  54: "connect",
  55: "send",
  56: "recv",
  57: "shutdown",
  58: "getsockopt",
  59: "setsockopt",
  60: "poll",
  61: "socketpair",
  62: "sendto",
  63: "recvfrom",
  64: "pread",
  65: "pwrite",
  68: "usleep",
  69: "openat",
  70: "tcgetattr",
  71: "tcsetattr",
  72: "ioctl",
  75: "uname",
  77: "dup3",
  78: "pipe2",
  81: "writev",
  82: "readv",
  83: "getrlimit",
  84: "setrlimit",
  85: "truncate",
  86: "ftruncate",
  87: "fsync",
  88: "fdatasync",
  89: "getpgrp",
  90: "setpgid",
  92: "setsid",
  93: "fstatat",
  94: "unlinkat",
  95: "mkdirat",
  96: "renameat",
  97: "faccessat",
  98: "fchmodat",
  99: "fchownat",
  100: "linkat",
  101: "symlinkat",
  102: "readlinkat",
  107: "fchmod",
  108: "getrusage",
  109: "realpath",
  110: "sigsuspend",
  114: "getsockname",
  115: "getpeername",
  119: "_llseek",
  120: "getrandom",
  121: "flock",
  122: "getdents64",
  123: "clock_getres",
  124: "clock_nanosleep",
  125: "utimensat",
  126: "mremap",
  127: "fchdir",
  129: "statfs64",
  130: "fstatfs64",
  132: "getresuid",
  134: "getresgid",
  137: "sendmsg",
  138: "recvmsg",
  139: "wait4",
  140: "getaddrinfo",
  200: "futex",
  201: "clone",
  205: "rt_sigqueueinfo",
  206: "rt_sigpending",
  207: "rt_sigtimedwait",
  208: "rt_sigreturn",
  209: "sigaltstack",
  211: "execve",
  212: "fork",
  213: "vfork",
  214: "getpgid",
  224: "getitimer",
  225: "setitimer",
  230: "sched_getparam",
  236: "sched_rr_get_interval",
  239: "epoll_create1",
  240: "epoll_ctl",
  241: "epoll_pwait",
  250: "prlimit64",
  251: "ppoll",
  252: "pselect6",
  260: "statx",
  271: "mknod",
  272: "mknodat",
  278: "msync",
  288: "waitid",
  295: "preadv",
  296: "pwritev",
  326: "timer_create",
  327: "timer_settime",
  328: "timer_gettime",
  329: "timer_getoverrun",
  330: "timer_delete",
  331: "mq_open",
  332: "mq_unlink",
  333: "mq_timedsend",
  334: "mq_timedreceive",
  335: "mq_notify",
  336: "mq_getsetattr",
  337: "msgget",
  338: "msgrcv",
  339: "msgsnd",
  340: "msgctl",
  341: "semget",
  342: "semop",
  343: "semctl",
  344: "shmget",
  345: "shmat",
  346: "shmdt",
  347: "shmctl",
  378: "epoll_create",
  379: "epoll_wait",
  382: "faccessat2",
  383: "fchmodat2",
  384: "accept4",
  386: "execveat",
  387: "exit_group"
};
var ERRNO_NAMES = {
  1: "EPERM",
  2: "ENOENT",
  3: "ESRCH",
  4: "EINTR",
  5: "EIO",
  6: "ENXIO",
  7: "E2BIG",
  8: "ENOEXEC",
  9: "EBADF",
  10: "ECHILD",
  11: "EAGAIN",
  12: "ENOMEM",
  13: "EACCES",
  14: "EFAULT",
  16: "EBUSY",
  17: "EEXIST",
  19: "ENODEV",
  20: "ENOTDIR",
  21: "EISDIR",
  22: "EINVAL",
  28: "ENOSPC",
  29: "ESPIPE",
  30: "EROFS",
  36: "ENAMETOOLONG",
  38: "ENOSYS",
  39: "ENOTEMPTY",
  61: "ENODATA",
  75: "EOVERFLOW",
  88: "ENOTSOCK",
  90: "EMSGSIZE",
  92: "ENOPROTOOPT",
  93: "EPROTONOSUPPORT",
  95: "EOPNOTSUPP",
  97: "EAFNOSUPPORT",
  98: "EADDRINUSE",
  99: "EADDRNOTAVAIL",
  100: "ENETDOWN",
  103: "ECONNABORTED",
  104: "ECONNRESET",
  106: "EISCONN",
  107: "ENOTCONN",
  110: "ETIMEDOUT",
  111: "ECONNREFUSED",
  115: "EINPROGRESS"
};
var CentralizedKernelWorker = class {
  constructor(config, io, callbacks = {}) {
    this.config = config;
    this.io = io;
    this.callbacks = callbacks;
    this.kernel = new WasmPosixKernel(config, io, {
      // In centralized mode, callbacks like onKill/onFork are handled
      // differently — the kernel returns EAGAIN and JS handles them.
      onStdin: (maxLen) => {
        const pid = this.currentHandlePid;
        const buf = this.stdinBuffers.get(pid);
        if (!buf) {
          return this.stdinFinite.has(pid) ? null : new Uint8Array(0);
        }
        const remaining = buf.data.length - buf.offset;
        if (remaining <= 0) {
          this.stdinBuffers.delete(pid);
          return this.stdinFinite.has(pid) ? null : new Uint8Array(0);
        }
        const n = Math.min(remaining, maxLen);
        const chunk = buf.data.subarray(buf.offset, buf.offset + n);
        buf.offset += n;
        if (buf.offset >= buf.data.length) {
          this.stdinBuffers.delete(pid);
        }
        return chunk;
      },
      onAlarm: (seconds) => {
        const pid = this.currentHandlePid;
        if (pid === 0) return 0;
        const existing = this.alarmTimers.get(pid);
        if (existing) {
          clearTimeout(existing);
          this.alarmTimers.delete(pid);
        }
        if (seconds > 0) {
          const timer = setTimeout(() => {
            this.alarmTimers.delete(pid);
            if (this.processes.has(pid)) {
              this.sendSignalToProcess(pid, SIGALRM);
            }
          }, seconds * 1e3);
          this.alarmTimers.set(pid, timer);
        }
        return 0;
      },
      onNetListen: (fd, port, addr) => {
        const pid = this.currentHandlePid;
        if (pid === 0) return 0;
        void addr;
        this.startTcpListener(pid, fd, port);
        return 0;
      },
      onPosixTimer: (timerId, signo, valueMs, intervalMs) => {
        const pid = this.currentHandlePid;
        if (pid === 0) return 0;
        const key = `${pid}:${timerId}`;
        const existing = this.posixTimers.get(key);
        if (existing) {
          clearTimeout(existing.timeout);
          if (existing.interval) clearInterval(existing.interval);
          this.posixTimers.delete(key);
        }
        if (valueMs > 0 || intervalMs > 0) {
          const delay = Math.max(0, valueMs);
          const timeout = setTimeout(() => {
            if (!this.processes.has(pid)) {
              this.posixTimers.delete(key);
              return;
            }
            this.sendSignalToProcess(pid, signo);
            if (intervalMs > 0) {
              const iv = setInterval(() => {
                if (!this.processes.has(pid)) {
                  const entry2 = this.posixTimers.get(key);
                  if (entry2?.interval) clearInterval(entry2.interval);
                  this.posixTimers.delete(key);
                  return;
                }
                const intervalFire = this.kernelInstance.exports.kernel_posix_timer_interval_fire;
                const alreadyPending = intervalFire ? intervalFire(pid, timerId) : 0;
                if (!alreadyPending) {
                  this.sendSignalToProcess(pid, signo);
                }
              }, intervalMs);
              const entry = this.posixTimers.get(key);
              if (entry) entry.interval = iv;
            } else {
              this.posixTimers.delete(key);
            }
          }, delay);
          this.posixTimers.set(key, { timeout, signo });
        }
        return 0;
      }
    });
    this.virtualMacAddress = new Uint8Array(6);
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(this.virtualMacAddress);
    } else {
      for (let i = 0; i < 6; i++) {
        this.virtualMacAddress[i] = Math.floor(Math.random() * 256);
      }
    }
    this.virtualMacAddress[0] = this.virtualMacAddress[0] & 254 | 2;
  }
  kernel;
  kernelInstance = null;
  kernelMemory = null;
  /** ABI version read from the kernel wasm at startup. */
  kernelAbiVersion = 0;
  processes = /* @__PURE__ */ new Map();
  activeChannels = [];
  scratchOffset = 0;
  initialized = false;
  nextChildPid = 100;
  /**
   * Allocate a fresh pid for a top-level spawn from a host. Skips any pids
   * already in the kernel's process table (forked children, the virtual
   * init at pid 1, etc.). The host is no longer expected to pick pids;
   * this is the single source of truth.
   */
  allocatePid() {
    while (this.processes.has(this.nextChildPid)) {
      this.nextChildPid++;
    }
    return this.nextChildPid++;
  }
  /** Maps "pid:channelOffset" to TID for tracking thread channels */
  channelTids = /* @__PURE__ */ new Map();
  /** Tracks the pid currently being serviced by kernel_handle_channel */
  currentHandlePid = 0;
  /**
   * Bind the kernel's view of "which thread is executing this syscall" to
   * the calling channel. Must be called immediately before every
   * `kernel_handle_channel` invocation that originates from user code — the
   * kernel consults this to route per-thread signal state (pthread_sigmask,
   * pthread_kill pending, sigsuspend per-thread mask swap). `tid = 0` means
   * "main thread" and is the default for channels without a tracked TID
   * (e.g. the main process worker).
   */
  bindKernelTidForChannel(channel) {
    const tid = this.channelTids.get(`${channel.pid}:${channel.channelOffset}`) ?? 0;
    const setTid = this.kernelInstance?.exports.kernel_set_current_tid;
    if (setTid) setTid(tid);
  }
  /** Alarm timers per process: pid → NodeJS.Timeout */
  alarmTimers = /* @__PURE__ */ new Map();
  /** POSIX timers: "pid:timerId" → {timeout, interval?, signo} */
  posixTimers = /* @__PURE__ */ new Map();
  /** Pending sleep timers per process: pid → {timer, channel, syscallNr, origArgs, retVal, errVal} */
  pendingSleeps = /* @__PURE__ */ new Map();
  /** Maps "pid:tid" to ctidPtr for CLONE_CHILD_CLEARTID on thread exit */
  threadCtidPtrs = /* @__PURE__ */ new Map();
  /** TCP listeners: "pid:fd" → { server, pid, port, connections } */
  tcpListeners = /* @__PURE__ */ new Map();
  /** TCP listener targets: port → list of {pid, fd} for round-robin dispatch.
   *  When multiple processes share a listening socket (e.g., nginx master forks
   *  workers), incoming connections are distributed among them. */
  tcpListenerTargets = /* @__PURE__ */ new Map();
  tcpListenerRRIndex = /* @__PURE__ */ new Map();
  /** Separate scratch buffer for TCP data pumping */
  tcpScratchOffset = 0;
  /** Node.js net module (loaded dynamically for browser compatibility) */
  netModule = null;
  /** Parent-child process tracking for waitpid */
  childToParent = /* @__PURE__ */ new Map();
  parentToChildren = /* @__PURE__ */ new Map();
  /** Exit statuses of children not yet wait()-ed for: childPid → waitStatus */
  exitedChildren = /* @__PURE__ */ new Map();
  /** Deferred waitpid/waitid completions */
  waitingForChild = [];
  /** Cached kernel memory typed array view (invalidated on memory.grow) */
  cachedKernelMem = null;
  cachedKernelBuffer = null;
  /** Pending poll/ppoll retries — keyed by channelOffset for per-thread tracking */
  pendingPollRetries = /* @__PURE__ */ new Map();
  /** Pending pselect6 retries — used for signal-driven wakeup and timeout tracking */
  pendingSelectRetries = /* @__PURE__ */ new Map();
  /** Flag to coalesce cross-process wakeup microtasks */
  wakeScheduled = false;
  /** Pending pipe/socket readers: pipeIdx → array of waiting channels.
   * When a read-like syscall returns EAGAIN on a pipe/socket fd, the reader
   * is registered here instead of using a blind setImmediate retry.
   * When a write completes to the same pipe, readers are woken immediately. */
  pendingPipeReaders = /* @__PURE__ */ new Map();
  /** Pending pipe/socket writers: sendPipeIdx → array of waiting channels.
   * When a write-like syscall returns EAGAIN on a pipe/socket fd (buffer full),
   * the writer is registered here. When a read drains the pipe, writers wake. */
  pendingPipeWriters = /* @__PURE__ */ new Map();
  /** Socket timeout timers: channel → timer. When a socket read/write
   * blocks and has SO_RCVTIMEO/SO_SNDTIMEO set, a timer is scheduled
   * to complete the syscall with ETIMEDOUT. Cleared when the operation
   * completes before the timeout. */
  socketTimeoutTimers = /* @__PURE__ */ new Map();
  /** Pending futex waits: channelOffset → { futexAddr, futexIndex }.
   * Tracked so SYS_THREAD_CANCEL can force-wake a futex-blocked thread
   * by firing Atomics.notify on the address it is waiting on. The waitAsync
   * Promise in handleFutex then resolves and writes the channel result. */
  pendingFutexWaits = /* @__PURE__ */ new Map();
  /** Channel offsets with a cancellation request pending. Set by
   * SYS_THREAD_CANCEL.  Checked at the entry of every blocking syscall
   * path (futex wait, pipe retry, poll retry) so a cancel that arrives
   * before the target actually blocks still terminates the in-flight
   * syscall instead of silently racing past it. Cleared when the cancel
   * has been serviced (target's channel completed with -EINTR / woken). */
  pendingCancels = /* @__PURE__ */ new Set();
  /** Profiling data: syscallNr → {count, totalTimeMs, retries} */
  profileData = PROFILING ? /* @__PURE__ */ new Map() : null;
  /** Per-process stdin buffers: pid → { data, offset } */
  stdinBuffers = /* @__PURE__ */ new Map();
  /** Processes with finite stdin (setStdinData). Reads return EOF when buffer exhausted.
   *  Processes NOT in this set get EAGAIN (blocking) when no stdin data is available. */
  stdinFinite = /* @__PURE__ */ new Set();
  /** Active TCP connections per process for piggyback flushing */
  tcpConnections = /* @__PURE__ */ new Map();
  /** Per-process MAP_SHARED file-backed mappings: pid → Map<addr, info> */
  sharedMappings = /* @__PURE__ */ new Map();
  /** Host-side mirror of epoll interest lists: "pid:epfd" → interests.
   *  Maintained by intercepting epoll_ctl results. Used by handleEpollPwait
   *  to convert epoll_pwait to poll without calling kernel_handle_channel
   *  (which crashes in Chrome for epoll_pwait due to a suspected V8 bug). */
  epollInterests = /* @__PURE__ */ new Map();
  lockTable = null;
  /** Per-process shared memory mappings: pid → Map<addr, {segId, size}> */
  shmMappings = /* @__PURE__ */ new Map();
  /** PTY index → pid mapping (for draining output after syscalls) */
  ptyIndexByPid = /* @__PURE__ */ new Map();
  /** Set of active PTY indices to drain after each syscall */
  activePtyIndices = /* @__PURE__ */ new Set();
  /** PTY output callbacks: ptyIdx → callback */
  ptyOutputCallbacks = /* @__PURE__ */ new Map();
  /** Virtual MAC address for this kernel instance (locally administered, unicast) */
  virtualMacAddress;
  /**
   * Initialize the centralized kernel.
   * Loads kernel Wasm, sets mode to centralized (1).
   */
  async init(kernelWasmBytes) {
    await this.kernel.init(kernelWasmBytes);
    this.kernelInstance = this.kernel.getInstance();
    this.kernelMemory = this.kernel.getMemory();
    const abiVersionFn = this.kernelInstance.exports.__abi_version;
    if (typeof abiVersionFn !== "function") {
      throw new Error(
        "kernel wasm is missing the __abi_version export \u2014 refusing to run. Rebuild the kernel (bash build.sh) against the current ABI."
      );
    }
    this.kernelAbiVersion = abiVersionFn();
    const setMode = this.kernelInstance.exports.kernel_set_mode;
    setMode(1);
    const allocScratch = this.kernelInstance.exports.kernel_alloc_scratch;
    this.scratchOffset = Number(allocScratch(SCRATCH_SIZE));
    if (this.scratchOffset === 0) {
      throw new Error("Failed to allocate kernel scratch buffer");
    }
    try {
      const net2 = await import("net");
      if (typeof net2.createServer === "function") {
        this.netModule = net2;
      }
    } catch {
    }
    this.tcpScratchOffset = Number(allocScratch(65536));
    if (this.tcpScratchOffset === 0) {
      throw new Error("Failed to allocate TCP scratch buffer");
    }
    this.lockTable = SharedLockTable.create();
    this.kernel.registerSharedLockTable(this.lockTable.getBuffer());
    this.initialized = true;
  }
  /**
   * Register a process and its thread channels with the kernel.
   * Each channel is a region in the process's shared Memory.
   */
  registerProcess(pid, memory, channelOffsets, options) {
    if (!this.initialized) throw new Error("Kernel not initialized");
    this.hostReaped.delete(pid);
    if (!options?.skipKernelCreate) {
      const createProcess = this.kernelInstance.exports.kernel_create_process;
      const result = createProcess(pid);
      if (result < 0) {
        throw new Error(`Failed to create process ${pid}: errno ${-result}`);
      }
    }
    if (options?.argv && options.argv.length > 0) {
      const setArgv = this.kernelInstance.exports.kernel_set_process_argv;
      if (setArgv) {
        const encoder2 = new TextEncoder();
        const nullSep = options.argv.join("\0");
        const encoded = encoder2.encode(nullSep);
        const kernelMem = new Uint8Array(this.kernelMemory.buffer);
        const scratchOffset = this.scratchOffset;
        kernelMem.set(encoded, scratchOffset);
        setArgv(pid, BigInt(scratchOffset), encoded.length);
      }
    }
    const setMaxAddr = this.kernelInstance.exports.kernel_set_max_addr;
    if (setMaxAddr && channelOffsets.length > 0) {
      const minChannelOffset = Math.min(...channelOffsets);
      setMaxAddr(pid, BigInt(minChannelOffset));
    }
    const channels = channelOffsets.map((offset) => ({
      pid,
      memory,
      channelOffset: offset,
      i32View: new Int32Array(memory.buffer, offset),
      consecutiveSyscalls: 0
    }));
    const registration = { pid, memory, channels, ptrWidth: options?.ptrWidth ?? 4 };
    this.processes.set(pid, registration);
    this.activeChannels.push(...channels);
    if (this.usePolling) {
      this.startPolling();
    } else {
      for (const channel of channels) {
        this.listenOnChannel(channel);
      }
    }
  }
  /**
   * Provide data that will be returned when the process reads from stdin (fd 0).
   * Data is returned in chunks until exhausted, then EOF is returned.
   * Must be called before the process starts reading stdin.
   */
  setStdinData(pid, data) {
    this.stdinBuffers.set(pid, { data, offset: 0 });
    this.stdinFinite.add(pid);
    const kernelSetStdinPipe = this.kernelInstance.exports.kernel_set_stdin_pipe;
    if (kernelSetStdinPipe) {
      kernelSetStdinPipe(pid);
    }
  }
  /**
   * Set stdout/stderr capture callbacks on the underlying kernel instance.
   * Must be called after construction but works at any time.
   */
  setOutputCallbacks(callbacks) {
    this.kernel.mergeCallbacks(callbacks);
  }
  /**
   * Append data to a process's stdin buffer without marking stdin as a pipe.
   * Used for interactive stdin where data arrives incrementally.
   * Wakes any blocked stdin readers after appending.
   */
  appendStdinData(pid, data) {
    const existing = this.stdinBuffers.get(pid);
    if (existing) {
      const remaining = existing.data.subarray(existing.offset);
      const combined = new Uint8Array(remaining.length + data.length);
      combined.set(remaining);
      combined.set(data, remaining.length);
      this.stdinBuffers.set(pid, { data: combined, offset: 0 });
    } else {
      this.stdinBuffers.set(pid, { data, offset: 0 });
    }
    this.scheduleWakeBlockedRetries();
  }
  // ── PTY management ──
  /**
   * Create a PTY pair and wire fds 0/1/2 of `pid` to the slave side.
   * Returns the PTY index, or throws on failure.
   */
  setupPty(pid) {
    const kernelPtyCreate = this.kernelInstance.exports.kernel_pty_create;
    if (!kernelPtyCreate) throw new Error("Kernel missing kernel_pty_create export");
    const ptyIdx = kernelPtyCreate(pid);
    if (ptyIdx < 0) throw new Error(`kernel_pty_create failed: errno ${-ptyIdx}`);
    this.ptyIndexByPid.set(pid, ptyIdx);
    this.activePtyIndices.add(ptyIdx);
    return ptyIdx;
  }
  /**
   * Write data to a PTY master (host → line discipline → slave).
   * Wakes any process blocked on reading the slave side.
   */
  ptyMasterWrite(ptyIdx, data) {
    const kernelPtyMasterWrite = this.kernelInstance.exports.kernel_pty_master_write;
    if (!kernelPtyMasterWrite) return;
    const buf = new Uint8Array(this.kernelMemory.buffer);
    buf.set(data, this.scratchOffset);
    kernelPtyMasterWrite(ptyIdx, BigInt(this.scratchOffset), data.length);
    this.drainPtyOutput(ptyIdx);
    this.scheduleWakeBlockedRetries();
  }
  /**
   * Read all available data from a PTY master (slave output → host).
   * Returns data or null if empty.
   */
  ptyMasterRead(ptyIdx) {
    const kernelPtyMasterRead = this.kernelInstance.exports.kernel_pty_master_read;
    if (!kernelPtyMasterRead) return null;
    const SCRATCH_READ_SIZE = 4096;
    const n = kernelPtyMasterRead(ptyIdx, BigInt(this.scratchOffset), SCRATCH_READ_SIZE);
    if (n <= 0) return null;
    const buf = new Uint8Array(this.kernelMemory.buffer);
    return buf.slice(this.scratchOffset, this.scratchOffset + n);
  }
  /**
   * Resize a PTY and send SIGWINCH to the foreground process group.
   */
  ptySetWinsize(ptyIdx, rows, cols) {
    const kernelPtySetWinsize = this.kernelInstance.exports.kernel_pty_set_winsize;
    if (!kernelPtySetWinsize) return;
    kernelPtySetWinsize(ptyIdx, rows, cols);
  }
  /**
   * Register a callback for PTY output data.
   */
  onPtyOutput(ptyIdx, callback) {
    this.ptyOutputCallbacks.set(ptyIdx, callback);
  }
  /**
   * Drain output from a PTY master and invoke the registered callback.
   */
  drainPtyOutput(ptyIdx) {
    const callback = this.ptyOutputCallbacks.get(ptyIdx);
    if (!callback) return;
    for (; ; ) {
      const data = this.ptyMasterRead(ptyIdx);
      if (!data) break;
      callback(data);
    }
  }
  /**
   * Drain all active PTY outputs. Called after each syscall completion
   * to flush any program output produced during the syscall.
   */
  drainAllPtyOutputs() {
    if (this.activePtyIndices.size === 0) return;
    for (const ptyIdx of this.activePtyIndices) {
      this.drainPtyOutput(ptyIdx);
    }
  }
  /**
   * Set the working directory for a process.
   * Must be called after registerProcess and before the process starts.
   */
  setCwd(pid, cwd) {
    if (!this.initialized) throw new Error("Kernel not initialized");
    const kernelSetCwd = this.kernelInstance.exports.kernel_set_cwd;
    if (!kernelSetCwd) return;
    const encoded = new TextEncoder().encode(cwd);
    const buf = new Uint8Array(this.kernelMemory.buffer);
    buf.set(encoded, this.scratchOffset);
    kernelSetCwd(pid, BigInt(this.scratchOffset), encoded.length);
  }
  /**
   * Unregister a process. Stops listening on its channels and removes
   * it from the kernel's process table.
   */
  unregisterProcess(pid) {
    const registration = this.processes.get(pid);
    if (!registration) return;
    this.activeChannels = this.activeChannels.filter((ch) => ch.pid !== pid);
    this.cleanupTcpListeners(pid);
    this.cleanupPendingPollRetries(pid);
    const selectEntry = this.pendingSelectRetries.get(pid);
    if (selectEntry?.timer) clearImmediate(selectEntry.timer);
    this.pendingSelectRetries.delete(pid);
    this.cleanupPendingPipeReaders(pid);
    this.cleanupPendingPipeWriters(pid);
    for (const [ch, timer] of this.socketTimeoutTimers) {
      if (ch.pid === pid) {
        clearTimeout(timer);
        this.socketTimeoutTimers.delete(ch);
      }
    }
    for (const key of this.epollInterests.keys()) {
      if (key.startsWith(`${pid}:`)) {
        this.epollInterests.delete(key);
      }
    }
    if (this.lockTable) {
      const lockBuf = this.lockTable.getBuffer();
      Atomics.store(new Int32Array(lockBuf), 0, 0);
      this.lockTable.removeLocksByPid(pid);
    }
    this.removeFromKernelProcessTable(pid);
    this.processes.delete(pid);
    this.stdinFinite.delete(pid);
    this.stdinBuffers.delete(pid);
    if (this.usePolling && this.processes.size === 0) {
      this.stopPolling();
    }
    const ptyIdx = this.ptyIndexByPid.get(pid);
    if (ptyIdx !== void 0) {
      this.ptyIndexByPid.delete(pid);
      this.activePtyIndices.delete(ptyIdx);
      this.ptyOutputCallbacks.delete(ptyIdx);
    }
  }
  /**
   * Deactivate a process's channels without removing it from the kernel
   * process table. Used for zombie processes that need to remain queryable
   * (getpgid, setpgid) until reaped by wait/waitpid.
   */
  deactivateProcess(pid) {
    this.activeChannels = this.activeChannels.filter((ch) => ch.pid !== pid);
    this.processes.delete(pid);
    this.stdinFinite.delete(pid);
    this.stdinBuffers.delete(pid);
    const alarmTimer = this.alarmTimers.get(pid);
    if (alarmTimer) {
      clearTimeout(alarmTimer);
      this.alarmTimers.delete(pid);
    }
    for (const [key, entry] of this.posixTimers) {
      if (key.startsWith(`${pid}:`)) {
        clearTimeout(entry.timeout);
        if (entry.interval) clearInterval(entry.interval);
        this.posixTimers.delete(key);
      }
    }
    const sleepTimer = this.pendingSleeps.get(pid);
    if (sleepTimer) {
      clearTimeout(sleepTimer.timer);
      this.pendingSleeps.delete(pid);
    }
    this.cleanupPendingPollRetries(pid);
    const selectEntry = this.pendingSelectRetries.get(pid);
    if (selectEntry?.timer) clearImmediate(selectEntry.timer);
    this.pendingSelectRetries.delete(pid);
    this.cleanupTcpListeners(pid);
    this.hostReaped.delete(pid);
  }
  /**
   * Run kernel-side exec setup: close CLOEXEC fds, reset signal handlers.
   * Returns 0 on success, negative errno on failure.
   * Called by onExec callbacks after confirming the target program exists.
   */
  kernelExecSetup(pid) {
    const fn = this.kernelInstance.exports.kernel_exec_setup;
    return fn(pid);
  }
  /**
   * Remove old channel/registration state for a process about to exec.
   * Does NOT remove from kernel process table (exec keeps the same pid).
   * Does NOT cancel timers (POSIX: timers are preserved across exec).
   */
  prepareProcessForExec(pid) {
    this.activeChannels = this.activeChannels.filter((ch) => ch.pid !== pid);
    this.cleanupPendingPollRetries(pid);
    const selectEntry = this.pendingSelectRetries.get(pid);
    if (selectEntry?.timer) clearImmediate(selectEntry.timer);
    this.pendingSelectRetries.delete(pid);
    this.cleanupPendingPipeReaders(pid);
    this.cleanupPendingPipeWriters(pid);
    for (const [ch, timer] of this.socketTimeoutTimers) {
      if (ch.pid === pid) {
        clearTimeout(timer);
        this.socketTimeoutTimers.delete(ch);
      }
    }
    this.processes.delete(pid);
  }
  /**
   * Remove a process from the kernel's PROCESS_TABLE.
   * Called when a zombie is reaped by wait/waitpid.
   */
  removeFromKernelProcessTable(pid) {
    const removeProcess = this.kernelInstance.exports.kernel_remove_process;
    removeProcess(pid);
  }
  /**
   * Add a new channel (e.g. for a thread) to an existing process registration.
   * Uses the process's existing memory. If tid is provided, tracks the mapping
   * so handleExit can identify thread exits.
   */
  addChannel(pid, channelOffset, tid) {
    const registration = this.processes.get(pid);
    if (!registration) throw new Error(`Process ${pid} not registered`);
    const channel = {
      pid,
      memory: registration.memory,
      channelOffset,
      i32View: new Int32Array(registration.memory.buffer, channelOffset),
      consecutiveSyscalls: 0
    };
    registration.channels.push(channel);
    this.activeChannels.push(channel);
    if (tid !== void 0) {
      this.channelTids.set(`${pid}:${channelOffset}`, tid);
    }
    const setMaxAddr = this.kernelInstance.exports.kernel_set_max_addr;
    if (setMaxAddr) {
      const tlsPageAddr = channelOffset - 2 * 65536;
      setMaxAddr(pid, BigInt(tlsPageAddr));
    }
    if (!this.usePolling) {
      this.listenOnChannel(channel);
    }
  }
  /**
   * Remove a channel from a process registration (e.g. when a thread exits).
   */
  removeChannel(pid, channelOffset) {
    const registration = this.processes.get(pid);
    if (!registration) return;
    registration.channels = registration.channels.filter(
      (ch) => ch.channelOffset !== channelOffset
    );
    this.activeChannels = this.activeChannels.filter(
      (ch) => !(ch.pid === pid && ch.channelOffset === channelOffset)
    );
    this.channelTids.delete(`${pid}:${channelOffset}`);
  }
  /**
   * Listen for a syscall on a channel using Atomics.waitAsync.
   * When the process sets status to PENDING, we handle the syscall.
   */
  listenOnChannel(channel) {
    const i32View = new Int32Array(channel.memory.buffer, channel.channelOffset);
    channel.i32View = i32View;
    const statusIndex = CH_STATUS / 4;
    const currentStatus = Atomics.load(i32View, statusIndex);
    if (currentStatus === CH_PENDING) {
      if (this.relistenBatchSize <= 1) {
        setImmediate(() => {
          if (this.processes.has(channel.pid)) {
            this.handleSyscall(channel);
          }
        });
      } else {
        this.handleSyscall(channel);
      }
      return;
    }
    const waitResult = Atomics.waitAsync(i32View, statusIndex, currentStatus);
    if (waitResult.async) {
      waitResult.value.then(() => {
        if (!this.processes.has(channel.pid)) return;
        this.listenOnChannel(channel);
      });
    } else {
      this.relistenChannel(channel);
    }
  }
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
  getKernelMem() {
    const buf = this.kernelMemory.buffer;
    if (buf !== this.cachedKernelBuffer) {
      this.cachedKernelMem = new Uint8Array(buf);
      this.cachedKernelBuffer = buf;
    }
    return this.cachedKernelMem;
  }
  /** Get pointer width for a process (4=wasm32, 8=wasm64). */
  getPtrWidth(pid) {
    return this.processes.get(pid)?.ptrWidth ?? 4;
  }
  /** Debug: last N syscalls per pid for crash diagnosis */
  syscallRing = /* @__PURE__ */ new Map();
  dumpLastSyscalls(pid) {
    return (this.syscallRing.get(pid) ?? []).join("\n");
  }
  /** Read a null-terminated C string from process memory */
  readCString(memory, ptr, maxLen = 256) {
    if (ptr === 0) return "(null)";
    const mem = new Uint8Array(memory.buffer);
    let len = 0;
    while (len < maxLen && ptr + len < mem.length && mem[ptr + len] !== 0) len++;
    const copy = new Uint8Array(len);
    copy.set(mem.subarray(ptr, ptr + len));
    return new TextDecoder().decode(copy);
  }
  /** Format a syscall for logging, decoding path/string args from process memory */
  formatSyscallEntry(channel, syscallNr, args) {
    const name = SYSCALL_NAMES[syscallNr] ?? `syscall_${syscallNr}`;
    const pid = channel.pid;
    const tid = this.channelTids.get(`${pid}:${channel.channelOffset}`);
    const tidSuffix = tid !== void 0 ? `:t${tid}` : ``;
    switch (syscallNr) {
      case 1:
        return `[${pid}${tidSuffix}] open("${this.readCString(channel.memory, args[0])}", 0x${(args[1] >>> 0).toString(16)}, 0o${(args[2] >>> 0).toString(8)})`;
      case 69:
        return `[${pid}${tidSuffix}] openat(${args[0]}, "${this.readCString(channel.memory, args[1])}", 0x${(args[2] >>> 0).toString(16)}, 0o${(args[3] >>> 0).toString(8)})`;
      case 11:
        return `[${pid}${tidSuffix}] stat("${this.readCString(channel.memory, args[0])}")`;
      case 12:
        return `[${pid}${tidSuffix}] lstat("${this.readCString(channel.memory, args[0])}")`;
      case 93:
        return `[${pid}${tidSuffix}] fstatat(${args[0]}, "${this.readCString(channel.memory, args[1])}", 0x${(args[3] >>> 0).toString(16)})`;
      case 22:
        return `[${pid}${tidSuffix}] access("${this.readCString(channel.memory, args[0])}", ${args[1]})`;
      case 97:
        return `[${pid}${tidSuffix}] faccessat(${args[0]}, "${this.readCString(channel.memory, args[1])}", ${args[2]})`;
      case 24:
        return `[${pid}${tidSuffix}] chdir("${this.readCString(channel.memory, args[0])}")`;
      case 25:
        return `[${pid}${tidSuffix}] opendir("${this.readCString(channel.memory, args[0])}")`;
      case 19:
        return `[${pid}${tidSuffix}] readlink("${this.readCString(channel.memory, args[0])}", ${args[2]})`;
      case 102:
        return `[${pid}${tidSuffix}] readlinkat(${args[0]}, "${this.readCString(channel.memory, args[1])}", ${args[3]})`;
      case 109:
        return `[${pid}${tidSuffix}] realpath("${this.readCString(channel.memory, args[0])}")`;
      case 3:
        return `[${pid}${tidSuffix}] read(${args[0]}, ${args[2]})`;
      case 4:
        return `[${pid}${tidSuffix}] write(${args[0]}, ${args[2]})`;
      case 2:
        return `[${pid}${tidSuffix}] close(${args[0]})`;
      case 6:
        return `[${pid}${tidSuffix}] fstat(${args[0]})`;
      case 10:
        return `[${pid}${tidSuffix}] fcntl(${args[0]}, ${args[1]}, ${args[2]})`;
      case 46:
        return `[${pid}${tidSuffix}] mmap(0x${(args[0] >>> 0).toString(16)}, ${args[1] >>> 0}, ${args[2]}, 0x${(args[3] >>> 0).toString(16)}, ${args[4]}, ${args[5] >>> 0})`;
      case 47:
        return `[${pid}${tidSuffix}] munmap(0x${(args[0] >>> 0).toString(16)}, ${args[1] >>> 0})`;
      case 48:
        return `[${pid}${tidSuffix}] brk(0x${(args[0] >>> 0).toString(16)})`;
      case 211:
        return `[${pid}${tidSuffix}] execve("${this.readCString(channel.memory, args[0])}")`;
      case 212:
        return `[${pid}${tidSuffix}] fork()`;
      case 213:
        return `[${pid}${tidSuffix}] vfork()`;
      case 201:
        return `[${pid}${tidSuffix}] clone(0x${(args[0] >>> 0).toString(16)})`;
      case 34:
        return `[${pid}${tidSuffix}] exit(${args[0]})`;
      case 60:
        return `[${pid}${tidSuffix}] poll(${args[1]}, ${args[2]})`;
      case 72:
        return `[${pid}${tidSuffix}] ioctl(${args[0]}, 0x${(args[1] >>> 0).toString(16)})`;
      default:
        return `[${pid}${tidSuffix}] ${name}(${args.filter((_, i) => i < 3).join(", ")})`;
    }
  }
  /** Format a syscall return value for logging */
  formatSyscallReturn(syscallNr, retVal, errVal) {
    if (retVal < 0 || errVal !== 0) {
      const errName = ERRNO_NAMES[errVal] ?? `errno=${errVal}`;
      return ` = ${retVal} (${errName})`;
    }
    switch (syscallNr) {
      case 46:
        return ` = 0x${(retVal >>> 0).toString(16)}`;
      case 48:
        return ` = 0x${(retVal >>> 0).toString(16)}`;
      default:
        return ` = ${retVal}`;
    }
  }
  handleSyscall(channel) {
    try {
      if (PROFILING) {
        const pv = new DataView(channel.memory.buffer, channel.channelOffset);
        const nr = pv.getUint32(CH_SYSCALL, true);
        const start = performance.now();
        this._handleSyscallInner(channel);
        const elapsed = performance.now() - start;
        let entry = this.profileData.get(nr);
        if (!entry) {
          entry = { count: 0, totalTimeMs: 0, retries: 0 };
          this.profileData.set(nr, entry);
        }
        entry.count++;
        entry.totalTimeMs += elapsed;
        return;
      }
      this._handleSyscallInner(channel);
    } catch (err) {
      console.error(`[handleSyscall] UNCAUGHT ERROR pid=${channel.pid}:`, err);
      this.completeChannelRaw(channel, -5, 5);
      this.relistenChannel(channel);
    }
  }
  _handleSyscallInner(channel) {
    const processView = new DataView(channel.memory.buffer, channel.channelOffset);
    const syscallNr = processView.getUint32(CH_SYSCALL, true);
    const origArgs = [];
    for (let i = 0; i < CH_ARGS_COUNT; i++) {
      origArgs.push(Number(processView.getBigInt64(CH_ARGS + i * CH_ARG_SIZE, true)));
    }
    const ringKey = channel.channelOffset;
    let ring = this.syscallRing.get(ringKey);
    if (!ring) {
      ring = [];
      this.syscallRing.set(ringKey, ring);
    }
    ring.push(`  syscall=${syscallNr} args=[${origArgs.join(",")}]`);
    if (ring.length > 30) ring.shift();
    const logging = this.config.enableSyscallLog;
    let logEntry = "";
    if (logging) {
      logEntry = this.formatSyscallEntry(channel, syscallNr, origArgs);
    }
    if (syscallNr === SYS_FORK || syscallNr === SYS_VFORK) {
      if (logging) console.error(logEntry);
      this.handleFork(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_EXECVE) {
      if (logging) console.error(logEntry);
      this.handleExec(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_EXECVEAT) {
      if (logging) console.error(logEntry);
      this.handleExecveat(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_CLONE) {
      if (logging) console.error(logEntry);
      this.handleClone(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_EXIT || syscallNr === SYS_EXIT_GROUP) {
      if (logging) console.error(logEntry);
      this.handleExit(channel, syscallNr, origArgs);
      return;
    }
    if (syscallNr === SYS_WAIT4) {
      if (logging) console.error(logEntry);
      this.handleWaitpid(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_WAITID) {
      if (logging) console.error(logEntry);
      this.handleWaitid(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_FUTEX) {
      this.handleFutex(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_THREAD_CANCEL) {
      if (logging) console.error(logEntry);
      this.handleThreadCancel(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_WRITEV || syscallNr === SYS_PWRITEV) {
      if (logging) console.error(logEntry);
      this.handleWritev(channel, syscallNr, origArgs);
      return;
    }
    if (syscallNr === SYS_READV || syscallNr === SYS_PREADV) {
      if (logging) console.error(logEntry);
      this.handleReadv(channel, syscallNr, origArgs);
      return;
    }
    if ((syscallNr === SYS_WRITE || syscallNr === SYS_PWRITE) && origArgs[2] > CH_DATA_SIZE) {
      this.handleLargeWrite(channel, syscallNr, origArgs);
      return;
    }
    if ((syscallNr === 3 || syscallNr === SYS_PREAD) && origArgs[2] > CH_DATA_SIZE) {
      this.handleLargeRead(channel, syscallNr, origArgs);
      return;
    }
    if (syscallNr === 137) {
      this.handleSendmsg(channel, origArgs);
      return;
    }
    if (syscallNr === 138) {
      this.handleRecvmsg(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_IOCTL) {
      const request = origArgs[1] >>> 0;
      if (request === SIOCGIFCONF) {
        this.handleIoctlIfconf(channel, origArgs);
        return;
      }
      if (request === SIOCGIFHWADDR) {
        this.handleIoctlIfhwaddr(channel, origArgs);
        return;
      }
      if (request === SIOCGIFADDR) {
        this.handleIoctlIfaddr(channel, origArgs);
        return;
      }
    }
    if (syscallNr === SYS_FCNTL) {
      const cmd = origArgs[1];
      if (cmd === F_GETLK || cmd === F_SETLK || cmd === F_SETLKW || cmd === F_GETLK64 || cmd === F_SETLK64 || cmd === F_SETLKW64 || cmd === F_OFD_GETLK || cmd === F_OFD_SETLK || cmd === F_OFD_SETLKW) {
        this.handleFcntlLock(channel, origArgs);
        return;
      }
    }
    if (syscallNr === SYS_EPOLL_CREATE1 || syscallNr === SYS_EPOLL_CREATE) {
      this.handleEpollCreate(channel, syscallNr, origArgs);
      return;
    }
    if (syscallNr === SYS_EPOLL_CTL) {
      this.handleEpollCtl(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_EPOLL_PWAIT || syscallNr === SYS_EPOLL_WAIT) {
      this.handleEpollPwait(channel, syscallNr, origArgs);
      return;
    }
    if (syscallNr === SYS_SHMAT) {
      this.handleIpcShmat(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_SHMDT) {
      this.handleIpcShmdt(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_SEMCTL) {
      this.handleSemctl(channel, origArgs);
      return;
    }
    if (syscallNr === SYS_PSELECT6) {
      this.handlePselect6(channel, origArgs);
      return;
    }
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const adjustedArgs = [...origArgs];
    const argDescs = SYSCALL_ARGS[syscallNr];
    let dataOffset = 0;
    if (argDescs) {
      const processMem = new Uint8Array(channel.memory.buffer);
      const kernelMem = this.getKernelMem();
      const dataStart = this.scratchOffset + CH_DATA;
      for (const desc of argDescs) {
        const ptr = origArgs[desc.argIndex];
        if (ptr === 0) continue;
        let size;
        if (desc.size.type === "cstring") {
          let len = 0;
          while (processMem[ptr + len] !== 0 && len < CH_DATA_SIZE - dataOffset - 1) {
            len++;
          }
          size = len + 1;
        } else if (desc.size.type === "arg") {
          size = origArgs[desc.size.argIndex];
          if (syscallNr === SYS_POLL || syscallNr === SYS_PPOLL) size *= 8;
          if (syscallNr === SYS_MSGSND || syscallNr === SYS_MSGRCV) size += 4;
          if (syscallNr === SYS_SEMOP) size *= 6;
        } else if (desc.size.type === "deref") {
          const derefPtr = origArgs[desc.size.argIndex];
          if (derefPtr === 0) continue;
          size = processMem[derefPtr] | processMem[derefPtr + 1] << 8 | processMem[derefPtr + 2] << 16 | processMem[derefPtr + 3] << 24;
        } else {
          size = desc.size.size;
        }
        if (size <= 0) continue;
        if (dataOffset + size > CH_DATA_SIZE) {
          size = CH_DATA_SIZE - dataOffset;
          if (size <= 0) continue;
          if (desc.size.type === "arg") {
            adjustedArgs[desc.size.argIndex] = size;
          }
        }
        const kernelPtr = dataStart + dataOffset;
        if (desc.direction === "in" || desc.direction === "inout") {
          kernelMem.set(processMem.subarray(ptr, ptr + size), kernelPtr);
        } else {
          kernelMem.fill(0, kernelPtr, kernelPtr + size);
        }
        adjustedArgs[desc.argIndex] = kernelPtr;
        dataOffset += size;
        dataOffset = dataOffset + 3 & ~3;
      }
    }
    if (syscallNr === SYS_PPOLL) {
      const tsPtr = origArgs[2];
      if (tsPtr !== 0) {
        const pv = new DataView(channel.memory.buffer, tsPtr);
        const sec = Number(pv.getBigInt64(0, true));
        const nsec = Number(pv.getBigInt64(8, true));
        adjustedArgs[2] = sec * 1e3 + Math.floor(nsec / 1e6);
      } else {
        adjustedArgs[2] = -1;
      }
      const maskPtr = origArgs[3];
      if (maskPtr !== 0) {
        const pv = new DataView(channel.memory.buffer, maskPtr);
        adjustedArgs[3] = 1;
        adjustedArgs[4] = pv.getUint32(0, true);
        adjustedArgs[5] = pv.getUint32(4, true);
      } else {
        adjustedArgs[3] = 0;
        adjustedArgs[4] = 0;
        adjustedArgs[5] = 0;
      }
    }
    kernelView.setUint32(CH_SYSCALL, syscallNr, true);
    for (let i = 0; i < CH_ARGS_COUNT; i++) {
      kernelView.setBigInt64(CH_ARGS + i * CH_ARG_SIZE, BigInt(adjustedArgs[i]), true);
    }
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } catch (err) {
      if (logging) console.error(logEntry + " = KERNEL THROW");
      console.error(`[handleSyscall] kernel threw for pid=${channel.pid} syscall=${syscallNr} args=[${origArgs}]:`, err);
      this.completeChannelRaw(channel, -5, 5);
      this.relistenChannel(channel);
      return;
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal > 0) {
      this.ensureProcessMemoryCovers(channel.memory, syscallNr, retVal, origArgs);
    }
    if (syscallNr === SYS_MMAP && retVal > 0 && retVal >>> 0 !== 4294967295) {
      const mmapAddr = retVal >>> 0;
      const mmapLen = origArgs[1] >>> 0;
      if (mmapAddr + mmapLen > 1071382528) {
        console.error(`[MMAP ALERT] pid=${channel.pid} mmap returned 0x${mmapAddr.toString(16)} len=${mmapLen} \u2014 OVERLAPS THREAD REGION! args=[${origArgs.map((a) => "0x" + (a >>> 0).toString(16)).join(",")}]`);
      }
    }
    if (syscallNr === SYS_MREMAP && retVal > 0 && retVal >>> 0 !== 4294967295) {
      const mremapAddr = retVal >>> 0;
      const mremapLen = origArgs[2] >>> 0;
      if (mremapAddr + mremapLen > 1071382528) {
        console.error(`[MREMAP ALERT] pid=${channel.pid} mremap returned 0x${mremapAddr.toString(16)} len=${mremapLen} \u2014 OVERLAPS THREAD REGION!`);
      }
    }
    if (syscallNr === SYS_BRK && retVal > 1071382528) {
      console.error(`[BRK ALERT] pid=${channel.pid} brk returned 0x${(retVal >>> 0).toString(16)} \u2014 IN THREAD REGION!`);
    }
    if (syscallNr === SYS_MMAP && retVal > 0 && retVal >>> 0 !== 4294967295) {
      const mmapFd = origArgs[4];
      const mmapFlags = origArgs[3] >>> 0;
      if (mmapFd >= 0 && (mmapFlags & MAP_ANONYMOUS) === 0) {
        this.populateMmapFromFile(channel, retVal >>> 0, origArgs);
        if (mmapFlags & MAP_SHARED) {
          const pageOffset = origArgs[5] >>> 0;
          let pidMap = this.sharedMappings.get(channel.pid);
          if (!pidMap) {
            pidMap = /* @__PURE__ */ new Map();
            this.sharedMappings.set(channel.pid, pidMap);
          }
          pidMap.set(retVal >>> 0, {
            fd: mmapFd,
            fileOffset: pageOffset * 4096,
            len: origArgs[1] >>> 0
          });
        }
      }
    }
    if (syscallNr === SYS_MSYNC && retVal === 0) {
      this.flushSharedMappings(channel, origArgs);
    }
    if (syscallNr === SYS_MUNMAP && retVal === 0) {
      this.cleanupSharedMappings(channel.pid, origArgs[0] >>> 0, origArgs[1] >>> 0);
    }
    const getExitStatus = this.kernelInstance.exports.kernel_get_process_exit_status;
    if (getExitStatus) {
      const exitStatus = getExitStatus(channel.pid);
      if (exitStatus >= 0) {
        const signum = exitStatus >= 128 ? exitStatus - 128 : 0;
        const waitStatus = signum > 0 ? signum & 127 : (exitStatus & 255) << 8;
        this.handleProcessTerminated(channel, waitStatus);
        return;
      }
    }
    if (syscallNr === SYS_MQ_TIMEDSEND && retVal === 0) {
      this.drainMqueueNotification();
    }
    this.dequeueSignalForDelivery(channel);
    if (retVal === -1 && errVal === EAGAIN) {
      if (logging) {
        console.error(logEntry + " = -1 (EAGAIN, will retry)");
      }
      this.handleBlockingRetry(channel, syscallNr, origArgs);
      return;
    }
    if (this.handleSleepDelay(channel, syscallNr, origArgs, retVal, errVal)) {
      return;
    }
    if (errVal === 0 && (syscallNr === SYS_SETPGID || syscallNr === SYS_SETSID)) {
      this.recheckDeferredWaitpids();
    }
    if (errVal === 0 && syscallNr === SYS_KILL) {
      this.scheduleWakeBlockedRetries();
      this.reapKilledProcessesAfterSyscall();
    }
    if (logging) {
      console.error(logEntry + this.formatSyscallReturn(syscallNr, retVal, errVal));
    }
    this.completeChannel(channel, syscallNr, origArgs, argDescs, retVal, errVal);
  }
  /**
   * Dequeue one pending Handler signal from the kernel and write delivery
   * info to the process channel. The glue code (channel_syscall.c) reads
   * this after the syscall returns and invokes the handler.
   */
  dequeueSignalForDelivery(channel) {
    const dequeueSignal = this.kernelInstance.exports.kernel_dequeue_signal;
    if (!dequeueSignal) return;
    const sigOutOffset = this.scratchOffset + CH_SIG_BASE;
    const sigResult = dequeueSignal(channel.pid, BigInt(sigOutOffset));
    if (sigResult > 0) {
      const kernelMem = this.getKernelMem();
      const processMem = new Uint8Array(channel.memory.buffer);
      processMem.set(
        kernelMem.subarray(sigOutOffset, sigOutOffset + 44),
        channel.channelOffset + CH_SIG_BASE
      );
    } else {
      const sigStart = channel.channelOffset + CH_SIG_BASE;
      new Uint8Array(channel.memory.buffer, sigStart, 48).fill(0);
    }
  }
  /**
   * Complete a syscall by copying output data and notifying the process.
   */
  completeChannel(channel, syscallNr, origArgs, argDescs, retVal, errVal) {
    const processView = new DataView(channel.memory.buffer, channel.channelOffset);
    if (argDescs) {
      const processMem = new Uint8Array(channel.memory.buffer);
      const kernelMem = this.getKernelMem();
      const dataStart = this.scratchOffset + CH_DATA;
      let outOffset = 0;
      for (const desc of argDescs) {
        const origPtr = origArgs[desc.argIndex];
        if (origPtr === 0) continue;
        let size;
        if (desc.size.type === "cstring") {
          let len = 0;
          while (processMem[origPtr + len] !== 0 && len < CH_DATA_SIZE - outOffset - 1) {
            len++;
          }
          size = len + 1;
        } else if (desc.size.type === "arg") {
          size = origArgs[desc.size.argIndex];
          if (syscallNr === SYS_POLL || syscallNr === SYS_PPOLL) size *= 8;
          if (syscallNr === SYS_EPOLL_PWAIT) size *= 12;
          if (syscallNr === SYS_MSGSND || syscallNr === SYS_MSGRCV) size += 4;
          if (syscallNr === SYS_SEMOP) size *= 6;
        } else if (desc.size.type === "deref") {
          const derefPtr = origArgs[desc.size.argIndex];
          if (derefPtr === 0) continue;
          size = processMem[derefPtr] | processMem[derefPtr + 1] << 8 | processMem[derefPtr + 2] << 16 | processMem[derefPtr + 3] << 24;
        } else {
          size = desc.size.size;
        }
        if (size <= 0) continue;
        if (outOffset + size > CH_DATA_SIZE) {
          size = CH_DATA_SIZE - outOffset;
          if (size <= 0) continue;
        }
        const kernelPtr = dataStart + outOffset;
        if (desc.direction === "out" || desc.direction === "inout") {
          if (desc.direction === "out" && retVal < 0) {
            outOffset += size;
            outOffset = outOffset + 3 & ~3;
            continue;
          }
          let copySize = size;
          if (desc.direction === "out" && desc.size.type === "arg") {
            if (retVal > 0 && retVal < size) {
              copySize = retVal;
              if (syscallNr === SYS_MSGRCV) copySize += 4;
            }
          }
          processMem.set(
            kernelMem.subarray(kernelPtr, kernelPtr + copySize),
            origPtr
          );
        }
        outOffset += size;
        outOffset = outOffset + 3 & ~3;
      }
    }
    channel.handling = false;
    processView.setBigInt64(CH_RETURN, BigInt(retVal), true);
    processView.setUint32(CH_ERRNO, errVal, true);
    this.clearSocketTimeout(channel);
    this.drainAllPtyOutputs();
    this.flushTcpSendPipes(channel.pid);
    const i32View = new Int32Array(channel.memory.buffer, channel.channelOffset);
    Atomics.store(i32View, CH_STATUS / 4, CH_COMPLETE);
    Atomics.notify(i32View, CH_STATUS / 4, 1);
    this.drainAndProcessWakeupEvents();
    this.relistenChannel(channel);
  }
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
  relistenCount = 0;
  /** How many syscalls to process via microtask before yielding to the event
   *  loop via setImmediate. Default 64 is optimal for Node.js. Set to 1 in
   *  browser environments where the kernel runs on the main thread. */
  relistenBatchSize = 64;
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
  usePolling = false;
  pollMC = null;
  pollScheduled = false;
  pollLastYield = 0;
  /** Start the channel poller. Called automatically when usePolling=true
   *  and a process is registered. */
  startPolling() {
    if (this.pollMC !== null) return;
    this.pollMC = new MessageChannel();
    this.pollMC.port1.onmessage = () => this.pollTick();
    this.pollLastYield = performance.now();
    this.schedulePoll();
  }
  /** Stop the channel poller. Called when all processes are unregistered. */
  stopPolling() {
    if (this.pollMC !== null) {
      this.pollMC.port1.close();
      this.pollMC = null;
      this.pollScheduled = false;
    }
  }
  /** Schedule the next poll tick. Uses MessageChannel for ~0ms dispatch,
   *  with a setTimeout yield every 4ms to prevent timer starvation. */
  schedulePoll() {
    if (this.pollScheduled || !this.pollMC) return;
    this.pollScheduled = true;
    const now = performance.now();
    if (now - this.pollLastYield >= 4) {
      this.pollLastYield = now;
      setTimeout(() => {
        this.pollScheduled = false;
        this.pollTick();
      }, 0);
    } else {
      this.pollMC.port2.postMessage(null);
    }
  }
  /** Poll all active channels for PENDING syscalls. */
  pollTick() {
    this.pollScheduled = false;
    if (!this.pollMC || this.activeChannels.length === 0) return;
    const channels = this.activeChannels.slice();
    for (const channel of channels) {
      if (channel.handling) continue;
      const i32View = new Int32Array(channel.memory.buffer, channel.channelOffset);
      channel.i32View = i32View;
      if (Atomics.load(i32View, 0) === CH_PENDING) {
        channel.handling = true;
        this.handleSyscall(channel);
      }
    }
    this.schedulePoll();
  }
  relistenChannel(channel) {
    channel.handling = false;
    if (!this.processes.has(channel.pid)) return;
    if (this.usePolling) return;
    this.relistenCount++;
    const useImmediate = this.relistenCount >= this.relistenBatchSize;
    if (useImmediate) {
      this.relistenCount = 0;
      setImmediate(() => this.listenOnChannel(channel));
    } else {
      queueMicrotask(() => this.listenOnChannel(channel));
    }
  }
  /**
   * Complete a channel with just return value and errno (no scatter/gather).
   * Used for thread exit where we need to unblock the worker.
   */
  completeChannelRaw(channel, retVal, errVal) {
    channel.handling = false;
    const processView = new DataView(channel.memory.buffer, channel.channelOffset);
    processView.setBigInt64(CH_RETURN, BigInt(retVal), true);
    processView.setUint32(CH_ERRNO, errVal, true);
    this.clearSocketTimeout(channel);
    this.pendingCancels.delete(channel.channelOffset);
    const i32View = new Int32Array(channel.memory.buffer, channel.channelOffset);
    Atomics.store(i32View, CH_STATUS / 4, CH_COMPLETE);
    Atomics.notify(i32View, CH_STATUS / 4, 1);
  }
  /**
   * Handle EAGAIN retry for blocking syscalls.
   * The process stays blocked while we retry asynchronously.
   */
  resolvePollPipeIndices(pid, origArgs, syscallNr) {
    const getFdPipeIdx = this.kernelInstance.exports.kernel_get_fd_pipe_idx;
    const getRecvPipe = getFdPipeIdx ?? this.kernelInstance.exports.kernel_get_socket_recv_pipe;
    if (!getRecvPipe) return [];
    const fdsPtr = origArgs[0];
    const nfds = origArgs[1];
    if (fdsPtr === 0 || nfds === 0) return [];
    const channel = this.activeChannels.find((c) => c.pid === pid);
    if (!channel) return [];
    const indices = [];
    const processMem = new DataView(channel.memory.buffer);
    for (let i = 0; i < nfds; i++) {
      const fd = processMem.getInt32(fdsPtr + i * 8, true);
      if (fd < 0) continue;
      const pipeIdx = getRecvPipe(pid, fd);
      if (pipeIdx >= 0) {
        indices.push(pipeIdx);
      }
    }
    return indices;
  }
  resolveEpollPipeIndices(pid) {
    const getRecvPipe = this.kernelInstance.exports.kernel_get_socket_recv_pipe;
    if (!getRecvPipe) return [];
    const key = `${pid}:`;
    const indices = [];
    for (const [k, interests] of this.epollInterests) {
      if (!k.startsWith(key)) continue;
      for (const interest of interests) {
        const pipeIdx = getRecvPipe(pid, interest.fd);
        if (pipeIdx >= 0) {
          indices.push(pipeIdx);
        }
      }
    }
    return indices;
  }
  wakeBlockedPoll(pid, pipeIdx) {
    const matches = Array.from(this.pendingPollRetries.entries()).filter(
      ([, e]) => e.channel.pid === pid && e.pipeIndices.includes(pipeIdx)
    );
    for (const [key, entry] of matches) {
      if (this.pendingPollRetries.get(key) !== entry) continue;
      if (entry.timer !== null) {
        clearTimeout(entry.timer);
      }
      this.pendingPollRetries.delete(key);
      if (this.processes.has(pid)) {
        this.retrySyscall(entry.channel);
      }
    }
  }
  /** Cancel all pending poll retries for a given pid (used during cleanup) */
  cleanupPendingPollRetries(pid) {
    for (const [key, entry] of this.pendingPollRetries) {
      if (entry.channel.pid === pid) {
        if (entry.timer) clearTimeout(entry.timer);
        this.pendingPollRetries.delete(key);
      }
    }
  }
  /**
   * Drain kernel wakeup events and process targeted pipe wakeups.
   * Called after each syscall completion. The kernel pushes events from
   * PipeBuffer operations (read/write/close). Each event identifies a pipe
   * and whether it became readable or writable.
   */
  drainAndProcessWakeupEvents() {
    const drainFn = this.kernelInstance.exports.kernel_drain_wakeup_events;
    if (!drainFn) return;
    const MAX_EVENTS = 256;
    const BYTES_PER_EVENT = 5;
    const bufSize = MAX_EVENTS * BYTES_PER_EVENT;
    const count = drainFn(BigInt(this.scratchOffset), bufSize, MAX_EVENTS);
    if (count === 0) return;
    const kernelMem = new Uint8Array(this.kernelMemory.buffer);
    const WAKE_READABLE = 1;
    const WAKE_WRITABLE = 2;
    let needBroadWake = false;
    for (let i = 0; i < count; i++) {
      const off = this.scratchOffset + i * BYTES_PER_EVENT;
      const pipeIdx = kernelMem[off] | kernelMem[off + 1] << 8 | kernelMem[off + 2] << 16 | kernelMem[off + 3] << 24;
      const wakeType = kernelMem[off + 4];
      if (wakeType & WAKE_READABLE) {
        const readers = this.pendingPipeReaders.get(pipeIdx);
        if (readers && readers.length > 0) {
          this.pendingPipeReaders.delete(pipeIdx);
          for (const reader of readers) {
            if (this.processes.has(reader.pid)) {
              this.retrySyscall(reader.channel);
            }
          }
        }
      }
      if (wakeType & WAKE_WRITABLE) {
        const writers = this.pendingPipeWriters.get(pipeIdx);
        if (writers && writers.length > 0) {
          this.pendingPipeWriters.delete(pipeIdx);
          for (const writer of writers) {
            if (this.processes.has(writer.pid)) {
              this.retrySyscall(writer.channel);
            }
          }
        }
      }
      needBroadWake = true;
    }
    if (needBroadWake) {
      if (this.anyPendingRetryNeedsSignalSafeWake()) {
        this.scheduleWakeBlockedRetriesDeferred();
      } else {
        this.scheduleWakeBlockedRetries();
      }
    }
  }
  anyPendingRetryNeedsSignalSafeWake() {
    for (const entry of this.pendingPollRetries.values()) {
      if (entry.needsSignalSafeWake) return true;
    }
    for (const entry of this.pendingSelectRetries.values()) {
      if (entry.needsSignalSafeWake) return true;
    }
    return false;
  }
  /** Same as scheduleWakeBlockedRetries but delays by a few ms to allow
   *  follow-up cross-process syscalls from the event source to land. */
  scheduleWakeBlockedRetriesDeferred() {
    if (this.wakeScheduled) return;
    if (this.pendingPollRetries.size === 0 && this.pendingSelectRetries.size === 0 && this.pendingPipeReaders.size === 0 && this.pendingPipeWriters.size === 0) return;
    this.wakeScheduled = true;
    setTimeout(() => {
      this.wakeScheduled = false;
      this.wakeAllBlockedRetries();
    }, 10);
  }
  /**
   * Schedule a microtask to wake all blocked poll/pselect6 retries.
   * Coalesced via wakeScheduled flag — multiple calls within the same
   * microtask batch result in only one wake cycle. This catches cross-process
   * pipe writes, socket connections, and other state changes that unblock
   * another process's pending poll/select.
   */
  scheduleWakeBlockedRetries() {
    if (this.wakeScheduled) return;
    if (this.pendingPollRetries.size === 0 && this.pendingSelectRetries.size === 0 && this.pendingPipeReaders.size === 0 && this.pendingPipeWriters.size === 0) return;
    this.wakeScheduled = true;
    setImmediate(() => {
      this.wakeScheduled = false;
      this.wakeAllBlockedRetries();
    });
  }
  /**
   * Wake all blocked poll/pselect6 retries by cancelling their setImmediate
   * timers and immediately re-executing the syscalls.
   */
  wakeAllBlockedRetries() {
    const pollEntries = Array.from(this.pendingPollRetries.entries());
    const selectEntries = Array.from(this.pendingSelectRetries.entries());
    this.pendingPollRetries.clear();
    this.pendingSelectRetries.clear();
    for (const [_key, entry] of pollEntries) {
      if (!this.processes.has(entry.channel.pid)) continue;
      if (entry.timer !== null) {
        clearTimeout(entry.timer);
      }
      this.retrySyscall(entry.channel);
    }
    for (const [pid, entry] of selectEntries) {
      if (!this.processes.has(pid)) continue;
      clearTimeout(entry.timer);
      clearImmediate(entry.timer);
      this.handlePselect6(entry.channel, entry.origArgs);
    }
    if (this.pendingPipeReaders.size > 0) {
      const pipeEntries = Array.from(this.pendingPipeReaders.entries());
      this.pendingPipeReaders.clear();
      for (const [, readers] of pipeEntries) {
        for (const reader of readers) {
          if (this.processes.has(reader.pid)) {
            this.retrySyscall(reader.channel);
          }
        }
      }
    }
    if (this.pendingPipeWriters.size > 0) {
      const writerEntries = Array.from(this.pendingPipeWriters.entries());
      this.pendingPipeWriters.clear();
      for (const [, writers] of writerEntries) {
        for (const writer of writers) {
          if (this.processes.has(writer.pid)) {
            this.retrySyscall(writer.channel);
          }
        }
      }
    }
  }
  /**
   * Remove a process's entries from pendingPipeReaders.
   * Called during process cleanup.
   */
  cleanupPendingPipeReaders(pid) {
    for (const [pipeIdx, readers] of this.pendingPipeReaders) {
      const filtered = readers.filter((r) => r.pid !== pid);
      if (filtered.length === 0) {
        this.pendingPipeReaders.delete(pipeIdx);
      } else {
        this.pendingPipeReaders.set(pipeIdx, filtered);
      }
    }
  }
  cleanupPendingPipeWriters(pid) {
    for (const [pipeIdx, writers] of this.pendingPipeWriters) {
      const filtered = writers.filter((w) => w.pid !== pid);
      if (filtered.length === 0) {
        this.pendingPipeWriters.delete(pipeIdx);
      } else {
        this.pendingPipeWriters.set(pipeIdx, filtered);
      }
    }
  }
  /**
   * Cancel a pending socket timeout timer for a channel.
   */
  clearSocketTimeout(channel) {
    const timer = this.socketTimeoutTimers.get(channel);
    if (timer !== void 0) {
      clearTimeout(timer);
      this.socketTimeoutTimers.delete(channel);
    }
  }
  /**
   * Remove a channel from pending pipe readers (all pipes).
   * Called when a socket timeout fires to clean up the reader registration.
   */
  removePendingPipeReader(channel) {
    for (const [pipeIdx, readers] of this.pendingPipeReaders) {
      const filtered = readers.filter((r) => r.channel !== channel);
      if (filtered.length === 0) {
        this.pendingPipeReaders.delete(pipeIdx);
      } else if (filtered.length !== readers.length) {
        this.pendingPipeReaders.set(pipeIdx, filtered);
      }
    }
  }
  /**
   * Remove a channel from pending pipe writers (all pipes).
   */
  removePendingPipeWriter(channel) {
    for (const [pipeIdx, writers] of this.pendingPipeWriters) {
      const filtered = writers.filter((w) => w.channel !== channel);
      if (filtered.length === 0) {
        this.pendingPipeWriters.delete(pipeIdx);
      } else if (filtered.length !== writers.length) {
        this.pendingPipeWriters.set(pipeIdx, filtered);
      }
    }
  }
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
  handleThreadCancel(channel, origArgs) {
    const targetTid = origArgs[0];
    const registration = this.processes.get(channel.pid);
    this.completeChannelRaw(channel, 0, 0);
    this.relistenChannel(channel);
    if (!registration) return;
    let target;
    for (const ch of registration.channels) {
      const mappedTid = this.channelTids.get(`${channel.pid}:${ch.channelOffset}`);
      const effectiveTid = mappedTid !== void 0 ? mappedTid : channel.pid;
      if (effectiveTid === targetTid) {
        target = ch;
        break;
      }
    }
    if (!target) return;
    this.pendingCancels.add(target.channelOffset);
    const futexEntry = this.pendingFutexWaits.get(target.channelOffset);
    if (futexEntry) {
      const tgtMemView = new Int32Array(target.memory.buffer);
      Atomics.notify(tgtMemView, futexEntry.futexIndex, 1);
      return;
    }
    const pollEntry = this.pendingPollRetries.get(target.channelOffset);
    if (pollEntry) {
      if (pollEntry.timer !== null) clearTimeout(pollEntry.timer);
      this.pendingPollRetries.delete(target.channelOffset);
      this.completeChannelRaw(target, -EINTR_ERRNO, EINTR_ERRNO);
      this.relistenChannel(target);
      return;
    }
    const selEntry = this.pendingSelectRetries.get(target.pid);
    if (selEntry && selEntry.channel === target) {
      clearTimeout(selEntry.timer);
      clearImmediate(selEntry.timer);
      this.pendingSelectRetries.delete(target.pid);
      this.completeChannelRaw(target, -EINTR_ERRNO, EINTR_ERRNO);
      this.relistenChannel(target);
      return;
    }
    let wokePipe = false;
    for (const [pipeIdx, readers] of this.pendingPipeReaders) {
      const filtered = readers.filter((r) => r.channel !== target);
      if (filtered.length !== readers.length) {
        if (filtered.length === 0) this.pendingPipeReaders.delete(pipeIdx);
        else this.pendingPipeReaders.set(pipeIdx, filtered);
        wokePipe = true;
      }
    }
    for (const [pipeIdx, writers] of this.pendingPipeWriters) {
      const filtered = writers.filter((w) => w.channel !== target);
      if (filtered.length !== writers.length) {
        if (filtered.length === 0) this.pendingPipeWriters.delete(pipeIdx);
        else this.pendingPipeWriters.set(pipeIdx, filtered);
        wokePipe = true;
      }
    }
    if (wokePipe) {
      this.clearSocketTimeout(target);
      this.completeChannelRaw(target, -EINTR_ERRNO, EINTR_ERRNO);
      this.relistenChannel(target);
      return;
    }
  }
  /**
   * Dump syscall profiling data to stderr. Call from your serve script:
   *   process.on('SIGINT', () => { kernelWorker.dumpProfile(); process.exit(); });
   *
   * Only produces output when WASM_POSIX_PROFILE=1 env var is set.
   */
  dumpProfile() {
    if (!this.profileData) {
      console.error("[profile] Profiling not enabled. Set WASM_POSIX_PROFILE=1");
      return;
    }
    const entries = Array.from(this.profileData.entries()).sort((a, b) => b[1].totalTimeMs - a[1].totalTimeMs);
    let totalCalls = 0;
    let totalTime = 0;
    let totalRetries = 0;
    console.error("\n=== Syscall Profile ===");
    console.error(`${"Syscall".padEnd(8)} ${"Count".padStart(10)} ${"Time(ms)".padStart(12)} ${"Avg(ms)".padStart(10)} ${"Retries".padStart(10)}`);
    console.error("-".repeat(52));
    for (const [nr, data] of entries) {
      totalCalls += data.count;
      totalTime += data.totalTimeMs;
      totalRetries += data.retries;
      console.error(
        `${String(nr).padEnd(8)} ${String(data.count).padStart(10)} ${data.totalTimeMs.toFixed(2).padStart(12)} ${(data.totalTimeMs / data.count).toFixed(3).padStart(10)} ${String(data.retries).padStart(10)}`
      );
    }
    console.error("-".repeat(52));
    console.error(
      `${"TOTAL".padEnd(8)} ${String(totalCalls).padStart(10)} ${totalTime.toFixed(2).padStart(12)} ${(totalTime / (totalCalls || 1)).toFixed(3).padStart(10)} ${String(totalRetries).padStart(10)}`
    );
    console.error(`Pending pipe readers: ${this.pendingPipeReaders.size}, writers: ${this.pendingPipeWriters.size}`);
    console.error("=== End Profile ===\n");
  }
  flushTcpSendPipes(pid) {
    const conns = this.tcpConnections.get(pid);
    if (!conns || conns.length === 0) return;
    const pipeRead = this.kernelInstance.exports.kernel_pipe_read;
    const mem = this.getKernelMem();
    for (const conn of conns) {
      for (; ; ) {
        const readN = pipeRead(0, conn.sendPipeIdx, BigInt(conn.scratchOffset), 65536);
        if (readN <= 0) break;
        const outData = Buffer.from(mem.slice(conn.scratchOffset, conn.scratchOffset + readN));
        if (!conn.clientSocket.destroyed) {
          conn.clientSocket.write(outData);
        }
      }
      conn.schedulePump();
    }
  }
  handleBlockingRetry(channel, syscallNr, origArgs) {
    if (!this.processes.has(channel.pid)) return;
    if (syscallNr === SYS_FUTEX) {
      const futexOp = origArgs[1] & 127;
      if (futexOp === 0) {
        const addr = origArgs[0];
        const expectedVal = origArgs[2];
        const i32View = new Int32Array(channel.memory.buffer);
        const index = addr >>> 2;
        const currentVal = Atomics.load(i32View, index);
        if (currentVal !== expectedVal) {
          this.retrySyscall(channel);
          return;
        }
        const waitResult = Atomics.waitAsync(i32View, index, expectedVal);
        if (waitResult.async) {
          waitResult.value.then(() => {
            if (this.processes.has(channel.pid)) {
              this.retrySyscall(channel);
            }
          });
        } else {
          setImmediate(() => this.retrySyscall(channel));
        }
        return;
      }
    }
    if (syscallNr === SYS_POLL || syscallNr === SYS_PPOLL) {
      let timeoutMs = -1;
      const needsSignalSafeWake = syscallNr === SYS_PPOLL && origArgs[3] !== 0;
      if (syscallNr === SYS_POLL) {
        timeoutMs = origArgs[2];
      } else {
        const tsPtr = origArgs[2];
        if (tsPtr !== 0) {
          const pv = new DataView(channel.memory.buffer, tsPtr);
          const sec = Number(pv.getBigInt64(0, true));
          const nsec = Number(pv.getBigInt64(8, true));
          timeoutMs = sec * 1e3 + Math.floor(nsec / 1e6);
        }
      }
      if (timeoutMs === 0) {
        this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], 0, 0);
        return;
      }
      const pipeIndices = this.resolvePollPipeIndices(channel.pid, origArgs, syscallNr);
      const nfds = origArgs[1];
      if (timeoutMs > 0 && nfds === 0) {
        const timer3 = setTimeout(() => {
          this.pendingPollRetries.delete(channel.channelOffset);
          if (this.processes.has(channel.pid)) {
            this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], 0, 0);
          }
        }, timeoutMs);
        this.pendingPollRetries.set(channel.channelOffset, { timer: timer3, channel, pipeIndices, needsSignalSafeWake });
        return;
      }
      const deadline = timeoutMs > 0 ? Date.now() + timeoutMs : -1;
      const retryFn2 = () => {
        this.pendingPollRetries.delete(channel.channelOffset);
        if (!this.processes.has(channel.pid)) return;
        if (deadline > 0 && Date.now() >= deadline) {
          this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], 0, 0);
          return;
        }
        this.retrySyscall(channel);
      };
      const retryMs = pipeIndices.length > 0 ? deadline > 0 ? Math.min(deadline - Date.now(), 200) : 200 : deadline > 0 ? Math.min(deadline - Date.now(), 50) : 50;
      const timer2 = setTimeout(retryFn2, Math.max(retryMs, 1));
      this.pendingPollRetries.set(channel.channelOffset, { timer: timer2, channel, pipeIndices, needsSignalSafeWake });
      return;
    }
    if (syscallNr === SYS_RT_SIGTIMEDWAIT) {
      const timeoutPtr = origArgs[2];
      if (timeoutPtr === 0) {
        setTimeout(() => {
          if (this.processes.has(channel.pid)) {
            this.retrySyscall(channel);
          }
        }, 500);
        return;
      }
      const pv = new DataView(channel.memory.buffer, timeoutPtr);
      const sec = Number(pv.getBigInt64(0, true));
      const nsec = Number(pv.getBigInt64(8, true));
      const timeoutMs = sec * 1e3 + Math.floor(nsec / 1e6);
      const EAGAIN_ERRNO = 11;
      if (timeoutMs <= 0) {
        this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], -1, EAGAIN_ERRNO);
      } else {
        setTimeout(() => {
          if (this.processes.has(channel.pid)) {
            this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], -1, EAGAIN_ERRNO);
          }
        }, timeoutMs);
      }
      return;
    }
    if (READ_LIKE_SYSCALLS.has(syscallNr) || WRITE_LIKE_SYSCALLS.has(syscallNr) || syscallNr === 53 || syscallNr === 384 || syscallNr === 54) {
      const fd = origArgs[0];
      const isFdNonblock = this.kernelInstance.exports.kernel_is_fd_nonblock;
      if (isFdNonblock) {
        const nb = isFdNonblock(channel.pid, fd);
        if (nb === 1) {
          this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], -1, EAGAIN);
          return;
        }
      }
    }
    if (syscallNr === SYS_MQ_TIMEDSEND || syscallNr === SYS_MQ_TIMEDRECEIVE) {
      const mqd = origArgs[0];
      const isFdNonblock = this.kernelInstance.exports.kernel_is_fd_nonblock;
      if (isFdNonblock && isFdNonblock(channel.pid, mqd) === 1) {
        this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], -1, EAGAIN);
        return;
      }
    }
    if (READ_LIKE_SYSCALLS.has(syscallNr) || WRITE_LIKE_SYSCALLS.has(syscallNr)) {
      const fd = origArgs[0];
      const getTimeout = this.kernelInstance.exports.kernel_get_socket_timeout_ms;
      if (getTimeout && !this.socketTimeoutTimers.has(channel)) {
        const isRecv = READ_LIKE_SYSCALLS.has(syscallNr) ? 1 : 0;
        const timeoutMs = Number(getTimeout(channel.pid, fd, isRecv));
        if (timeoutMs > 0) {
          const timer2 = setTimeout(() => {
            this.socketTimeoutTimers.delete(channel);
            this.removePendingPipeReader(channel);
            if (this.processes.has(channel.pid)) {
              this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], -1, ETIMEDOUT);
            }
          }, timeoutMs);
          this.socketTimeoutTimers.set(channel, timer2);
        }
      }
    }
    if (READ_LIKE_SYSCALLS.has(syscallNr)) {
      const fd = origArgs[0];
      const getFdPipeIdx = this.kernelInstance.exports.kernel_get_fd_pipe_idx;
      if (getFdPipeIdx) {
        const pipeIdx = getFdPipeIdx(channel.pid, fd);
        if (pipeIdx >= 0) {
          let readers = this.pendingPipeReaders.get(pipeIdx);
          if (!readers) {
            readers = [];
            this.pendingPipeReaders.set(pipeIdx, readers);
          }
          if (!readers.some((r) => r.channel === channel)) {
            readers.push({ channel, pid: channel.pid });
          }
          if (PROFILING) {
            const entry = this.profileData.get(syscallNr);
            if (entry) entry.retries++;
          }
          return;
        }
      }
    }
    if (WRITE_LIKE_SYSCALLS.has(syscallNr)) {
      const fd = origArgs[0];
      const getSendPipeIdx = this.kernelInstance.exports.kernel_get_fd_send_pipe_idx;
      if (getSendPipeIdx) {
        const pipeIdx = getSendPipeIdx(channel.pid, fd);
        if (pipeIdx >= 0) {
          let writers = this.pendingPipeWriters.get(pipeIdx);
          if (!writers) {
            writers = [];
            this.pendingPipeWriters.set(pipeIdx, writers);
          }
          if (!writers.some((w) => w.channel === channel)) {
            writers.push({ channel, pid: channel.pid });
          }
          if (PROFILING) {
            const entry = this.profileData.get(syscallNr);
            if (entry) entry.retries++;
          }
          return;
        }
      }
    }
    if (syscallNr === 53 || syscallNr === 384) {
      const fd = origArgs[0];
      const getFdPipeIdx = this.kernelInstance.exports.kernel_get_fd_pipe_idx;
      if (getFdPipeIdx) {
        const pipeIdx = getFdPipeIdx(channel.pid, fd);
        if (pipeIdx >= 0) {
          let readers = this.pendingPipeReaders.get(pipeIdx);
          if (!readers) {
            readers = [];
            this.pendingPipeReaders.set(pipeIdx, readers);
          }
          if (!readers.some((r) => r.channel === channel)) {
            readers.push({ channel, pid: channel.pid });
          }
          if (PROFILING) {
            const entry = this.profileData.get(syscallNr);
            if (entry) entry.retries++;
          }
          return;
        }
      }
    }
    if (PROFILING) {
      const entry = this.profileData.get(syscallNr);
      if (entry) entry.retries++;
    }
    const retryFn = () => {
      this.pendingPollRetries.delete(channel.channelOffset);
      if (this.processes.has(channel.pid)) {
        this.retrySyscall(channel);
      }
    };
    const timer = setTimeout(retryFn, 10);
    this.pendingPollRetries.set(channel.channelOffset, { timer, channel, pipeIndices: [] });
  }
  /**
   * Retry a syscall by re-invoking handleSyscall with the original
   * args still in the process channel.
   */
  retrySyscall(channel) {
    const getExitStatus = this.kernelInstance.exports.kernel_get_process_exit_status;
    if (getExitStatus) {
      const exitStatus = getExitStatus(channel.pid);
      if (exitStatus >= 0) {
        const signum = exitStatus >= 128 ? exitStatus - 128 : 0;
        const waitStatus = signum > 0 ? signum & 127 : (exitStatus & 255) << 8;
        this.handleProcessTerminated(channel, waitStatus);
        return;
      }
    }
    this.handleSyscall(channel);
  }
  /**
   * Handle sleep syscalls where the kernel returns success immediately
   * but we need to delay the channel response.
   * Returns true if this is a sleep syscall that was handled.
   */
  handleSleepDelay(channel, syscallNr, origArgs, retVal, errVal) {
    let delayMs = 0;
    if (syscallNr === SYS_NANOSLEEP && retVal >= 0) {
      const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
      const sec = kernelView.getUint32(CH_DATA, true);
      const nsec = kernelView.getUint32(CH_DATA + 8, true);
      delayMs = sec * 1e3 + Math.floor(nsec / 1e6);
    } else if (syscallNr === SYS_USLEEP && retVal >= 0) {
      const usec = origArgs[0] >>> 0;
      delayMs = Math.max(1, Math.floor(usec / 1e3));
    } else if (syscallNr === SYS_CLOCK_NANOSLEEP && retVal >= 0) {
      const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
      const sec = kernelView.getUint32(CH_DATA, true);
      const nsec = kernelView.getUint32(CH_DATA + 8, true);
      delayMs = sec * 1e3 + Math.floor(nsec / 1e6);
    }
    if (delayMs > 0) {
      const timer = setTimeout(() => {
        this.pendingSleeps.delete(channel.pid);
        if (this.processes.has(channel.pid)) {
          this.completeSleepWithSignalCheck(channel, syscallNr, origArgs, retVal, errVal);
        }
      }, delayMs);
      this.pendingSleeps.set(channel.pid, { timer, channel, syscallNr, origArgs, retVal, errVal });
      return true;
    }
    return false;
  }
  /**
   * Complete a sleep syscall, checking for pending signals first.
   * POSIX: sleep interrupted by signal returns EINTR.
   */
  completeSleepWithSignalCheck(channel, syscallNr, origArgs, retVal, errVal) {
    this.dequeueSignalForDelivery(channel);
    const processView = new DataView(channel.memory.buffer, channel.channelOffset);
    const pendingSig = processView.getUint32(CH_SIG_SIGNUM, true);
    if (pendingSig > 0) {
      const EINTR = 4;
      this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], -1, EINTR);
    } else {
      this.completeChannel(channel, syscallNr, origArgs, SYSCALL_ARGS[syscallNr], retVal, errVal);
    }
  }
  // -----------------------------------------------------------------------
  // Scatter/gather I/O handling (writev/readv/pwritev/preadv)
  //
  // These syscalls use struct iovec arrays with nested pointers:
  //   struct iovec { void *iov_base; size_t iov_len; }  (8 bytes on wasm32)
  // Both the iov array AND each iov_base buffer must be in kernel memory.
  // -----------------------------------------------------------------------
  /**
   * Handle writev/pwritev: copy iov array and all data buffers from
   * process memory into kernel scratch, then call kernel_handle_channel.
   */
  /**
   * Handle fcntl lock operations (F_GETLK, F_SETLK, F_SETLKW).
   * Arg3 is a pointer to struct flock (32 bytes) which needs copy in/out.
   */
  handleFcntlLock(channel, origArgs) {
    const FLOCK_SIZE = 32;
    const flockPtr = origArgs[2];
    const processMem = new Uint8Array(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    if (flockPtr !== 0) {
      kernelMem.set(processMem.subarray(flockPtr, flockPtr + FLOCK_SIZE), dataStart);
    }
    kernelView.setUint32(CH_SYSCALL, SYS_FCNTL, true);
    kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(origArgs[0]), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(origArgs[1]), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(flockPtr !== 0 ? dataStart : 0), true);
    for (let i = 3; i < CH_ARGS_COUNT; i++) {
      kernelView.setBigInt64(CH_ARGS + i * CH_ARG_SIZE, BigInt(origArgs[i]), true);
    }
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (flockPtr !== 0 && retVal >= 0) {
      const freshProcessMem = new Uint8Array(channel.memory.buffer);
      freshProcessMem.set(kernelMem.subarray(dataStart, dataStart + FLOCK_SIZE), flockPtr);
    }
    this.completeChannel(channel, SYS_FCNTL, origArgs, void 0, retVal, errVal);
  }
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
  handlePselect6(channel, origArgs) {
    const FD_SET_SIZE = 128;
    const processMem = new Uint8Array(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const nfds = origArgs[0];
    const readPtr = origArgs[1];
    const writePtr = origArgs[2];
    const exceptPtr = origArgs[3];
    const tsPtr = origArgs[4];
    const maskDataPtr = origArgs[5];
    if (readPtr !== 0) {
      kernelMem.set(processMem.subarray(readPtr, readPtr + FD_SET_SIZE), dataStart);
    } else {
      kernelMem.fill(0, dataStart, dataStart + FD_SET_SIZE);
    }
    if (writePtr !== 0) {
      kernelMem.set(processMem.subarray(writePtr, writePtr + FD_SET_SIZE), dataStart + FD_SET_SIZE);
    } else {
      kernelMem.fill(0, dataStart + FD_SET_SIZE, dataStart + 2 * FD_SET_SIZE);
    }
    if (exceptPtr !== 0) {
      kernelMem.set(processMem.subarray(exceptPtr, exceptPtr + FD_SET_SIZE), dataStart + 2 * FD_SET_SIZE);
    } else {
      kernelMem.fill(0, dataStart + 2 * FD_SET_SIZE, dataStart + 3 * FD_SET_SIZE);
    }
    let timeoutMs = -1;
    if (tsPtr !== 0) {
      const pv = new DataView(channel.memory.buffer, tsPtr);
      const sec = Number(pv.getBigInt64(0, true));
      const nsec = Number(pv.getBigInt64(8, true));
      timeoutMs = sec * 1e3 + Math.floor(nsec / 1e6);
    }
    const maskOffset = dataStart + 3 * FD_SET_SIZE;
    let kernelMaskPtr = 0;
    if (maskDataPtr !== 0) {
      const pw = this.getPtrWidth(channel.pid);
      const mdv = new DataView(channel.memory.buffer, maskDataPtr);
      const maskPtr = pw === 8 ? Number(mdv.getBigUint64(0, true)) : mdv.getUint32(0, true);
      if (maskPtr !== 0) {
        kernelMem.set(processMem.subarray(maskPtr, maskPtr + 8), maskOffset);
        kernelMaskPtr = maskOffset;
      }
    }
    kernelView.setUint32(CH_SYSCALL, SYS_PSELECT6, true);
    kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(nfds), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(readPtr !== 0 ? dataStart : 0), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(writePtr !== 0 ? dataStart + FD_SET_SIZE : 0), true);
    kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(exceptPtr !== 0 ? dataStart + 2 * FD_SET_SIZE : 0), true);
    kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(timeoutMs), true);
    kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(kernelMaskPtr), true);
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal >= 0) {
      const freshProcessMem = new Uint8Array(channel.memory.buffer);
      if (readPtr !== 0) {
        freshProcessMem.set(kernelMem.subarray(dataStart, dataStart + FD_SET_SIZE), readPtr);
      }
      if (writePtr !== 0) {
        freshProcessMem.set(
          kernelMem.subarray(dataStart + FD_SET_SIZE, dataStart + 2 * FD_SET_SIZE),
          writePtr
        );
      }
      if (exceptPtr !== 0) {
        freshProcessMem.set(
          kernelMem.subarray(dataStart + 2 * FD_SET_SIZE, dataStart + 3 * FD_SET_SIZE),
          exceptPtr
        );
      }
    }
    this.dequeueSignalForDelivery(channel);
    if (retVal === -1 && errVal === EAGAIN) {
      if (timeoutMs === 0) {
        this.completeChannel(channel, SYS_PSELECT6, origArgs, void 0, 0, 0);
        return;
      }
      const deadline = timeoutMs > 0 ? Date.now() + timeoutMs : -1;
      const needsSignalSafeWake = maskDataPtr !== 0;
      if (nfds === 0) {
        if (timeoutMs > 0) {
          const timer2 = setTimeout(() => {
            this.pendingSelectRetries.delete(channel.pid);
            if (this.processes.has(channel.pid)) {
              this.completeChannel(channel, SYS_PSELECT6, origArgs, void 0, 0, 0);
            }
          }, timeoutMs);
          this.pendingSelectRetries.set(channel.pid, { timer: timer2, channel, origArgs, deadline, needsSignalSafeWake });
        } else {
          this.pendingSelectRetries.set(channel.pid, { timer: null, channel, origArgs, deadline: -1, needsSignalSafeWake });
        }
        return;
      }
      const retryFn = () => {
        this.pendingSelectRetries.delete(channel.pid);
        if (!this.processes.has(channel.pid)) return;
        if (deadline > 0 && Date.now() >= deadline) {
          this.completeChannel(channel, SYS_PSELECT6, origArgs, void 0, 0, 0);
          return;
        }
        this.handlePselect6(channel, origArgs);
      };
      const timer = setImmediate(retryFn);
      this.pendingSelectRetries.set(channel.pid, { timer, channel, origArgs, deadline, needsSignalSafeWake });
      return;
    }
    this.completeChannel(channel, SYS_PSELECT6, origArgs, void 0, retVal, errVal);
  }
  // ---- epoll host-side implementation ----
  // kernel_handle_channel crashes in Chrome for epoll_pwait (suspected V8
  // shared-memory Wasm bug).  We handle all epoll syscalls on the host:
  //   epoll_create1/create → still call kernel (works fine), mirror result
  //   epoll_ctl → still call kernel (works fine), mirror interest list
  //   epoll_pwait → convert to poll entirely on host, no kernel_handle_channel
  /**
   * Handle epoll_create1 / epoll_create: let the kernel create the fd,
   * then initialise an empty interest list on the host side.
   */
  handleEpollCreate(channel, syscallNr, origArgs) {
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const flags = origArgs[0];
    const actualFlags = syscallNr === SYS_EPOLL_CREATE ? 0 : flags;
    kernelView.setUint32(CH_SYSCALL, syscallNr, true);
    kernelView.setBigInt64(CH_ARGS, BigInt(actualFlags), true);
    for (let i = 1; i < CH_ARGS_COUNT; i++) {
      kernelView.setBigInt64(CH_ARGS + i * CH_ARG_SIZE, 0n, true);
    }
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal >= 0) {
      const key = `${channel.pid}:${retVal}`;
      this.epollInterests.set(key, []);
    }
    this.completeChannel(channel, syscallNr, origArgs, void 0, retVal, errVal);
  }
  /**
   * Handle epoll_ctl: let the kernel modify its interest list, then mirror
   * the change on the host side.
   */
  handleEpollCtl(channel, origArgs) {
    const epfd = origArgs[0];
    const op = origArgs[1];
    const fd = origArgs[2];
    const eventPtr = origArgs[3];
    let events = 0;
    let data = 0n;
    if (eventPtr !== 0) {
      const pv = new DataView(channel.memory.buffer, eventPtr);
      events = pv.getUint32(0, true);
      data = pv.getBigUint64(4, true);
    }
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const kernelMem = this.getKernelMem();
    const dataStart = this.scratchOffset + CH_DATA;
    if (eventPtr !== 0) {
      const processMem = new Uint8Array(channel.memory.buffer);
      kernelMem.set(processMem.subarray(eventPtr, eventPtr + 12), dataStart);
    }
    kernelView.setUint32(CH_SYSCALL, SYS_EPOLL_CTL, true);
    kernelView.setBigInt64(CH_ARGS, BigInt(epfd), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(op), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(fd), true);
    kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(eventPtr !== 0 ? dataStart : 0), true);
    kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(0), true);
    kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal === 0) {
      const EPOLL_CTL_ADD = 1;
      const EPOLL_CTL_DEL = 2;
      const EPOLL_CTL_MOD = 3;
      const key = `${channel.pid}:${epfd}`;
      let interests = this.epollInterests.get(key);
      if (!interests) {
        interests = [];
        this.epollInterests.set(key, interests);
      }
      if (op === EPOLL_CTL_ADD) {
        interests.push({ fd, events, data });
      } else if (op === EPOLL_CTL_DEL) {
        const idx = interests.findIndex((e) => e.fd === fd);
        if (idx >= 0) interests.splice(idx, 1);
      } else if (op === EPOLL_CTL_MOD) {
        const entry = interests.find((e) => e.fd === fd);
        if (entry) {
          entry.events = events;
          entry.data = data;
        }
      }
    }
    this.completeChannel(channel, SYS_EPOLL_CTL, origArgs, void 0, retVal, errVal);
  }
  /**
   * Handle epoll_pwait / epoll_wait entirely on the host side.
   * Converts the epoll interest list to a poll syscall, calls
   * kernel_handle_channel with SYS_POLL, then maps results back
   * to epoll_event format and writes to process memory.
   */
  handleEpollPwait(channel, syscallNr, origArgs) {
    const epfd = origArgs[0];
    const eventsPtr = origArgs[1];
    const maxevents = origArgs[2];
    const timeoutMs = origArgs[3];
    if (maxevents <= 0) {
      this.completeChannelRaw(channel, -22, 22);
      this.relistenChannel(channel);
      return;
    }
    const key = `${channel.pid}:${epfd}`;
    const interests = this.epollInterests.get(key);
    if (!interests) {
      this.completeChannelRaw(channel, -9, 9);
      this.relistenChannel(channel);
      return;
    }
    if (interests.length === 0) {
      if (timeoutMs === 0) {
        this.completeChannelRaw(channel, 0, 0);
        this.relistenChannel(channel);
        return;
      }
      const retryFn2 = () => {
        this.pendingPollRetries.delete(channel.channelOffset);
        if (this.processes.has(channel.pid)) {
          this.handleEpollPwait(channel, syscallNr, origArgs);
        }
      };
      const timer2 = setTimeout(retryFn2, 10);
      this.pendingPollRetries.set(channel.channelOffset, { timer: timer2, channel, pipeIndices: [] });
      return;
    }
    const EPOLLIN = 1;
    const EPOLLOUT = 4;
    const EPOLLERR = 8;
    const EPOLLHUP = 16;
    const POLLIN2 = 1;
    const POLLOUT2 = 4;
    const POLLERR2 = 8;
    const POLLHUP = 16;
    const nfds = interests.length;
    const pollfdSize = nfds * 8;
    if (pollfdSize > CH_DATA_SIZE) {
      this.completeChannelRaw(channel, -22, 22);
      this.relistenChannel(channel);
      return;
    }
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    for (let i = 0; i < nfds; i++) {
      const interest = interests[i];
      const off = dataStart + i * 8;
      let pollEvents = 0;
      if (interest.events & EPOLLIN) pollEvents |= POLLIN2;
      if (interest.events & EPOLLOUT) pollEvents |= POLLOUT2;
      new DataView(this.kernelMemory.buffer).setInt32(off, interest.fd, true);
      new DataView(this.kernelMemory.buffer).setInt16(off + 4, pollEvents, true);
      new DataView(this.kernelMemory.buffer).setInt16(off + 6, 0, true);
    }
    kernelView.setUint32(CH_SYSCALL, SYS_POLL, true);
    kernelView.setBigInt64(CH_ARGS, BigInt(dataStart), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(nfds), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(0), true);
    for (let i = 3; i < CH_ARGS_COUNT; i++) {
      kernelView.setBigInt64(CH_ARGS + i * CH_ARG_SIZE, 0n, true);
    }
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    this.dequeueSignalForDelivery(channel);
    if (retVal < 0 && errVal !== EAGAIN) {
      this.completeChannelRaw(channel, retVal, errVal);
      this.relistenChannel(channel);
      return;
    }
    let readyCount = 0;
    if (retVal > 0) {
      const processView = new DataView(channel.memory.buffer);
      for (let i = 0; i < nfds && readyCount < maxevents; i++) {
        const off = dataStart + i * 8;
        const revents = new DataView(this.kernelMemory.buffer).getInt16(off + 6, true);
        if (revents !== 0) {
          let epEvents = 0;
          if (revents & POLLIN2) epEvents |= EPOLLIN;
          if (revents & POLLOUT2) epEvents |= EPOLLOUT;
          if (revents & POLLERR2) epEvents |= EPOLLERR;
          if (revents & POLLHUP) epEvents |= EPOLLHUP;
          const evOff = eventsPtr + readyCount * 12;
          processView.setUint32(evOff, epEvents, true);
          processView.setBigUint64(evOff + 4, interests[i].data, true);
          readyCount++;
        }
      }
    }
    if (readyCount > 0) {
      this.completeChannelRaw(channel, readyCount, 0);
      this.relistenChannel(channel);
      return;
    }
    if (timeoutMs === 0) {
      this.completeChannelRaw(channel, 0, 0);
      this.relistenChannel(channel);
      return;
    }
    const pipeIndices = this.resolveEpollPipeIndices(channel.pid);
    const retryFn = () => {
      this.pendingPollRetries.delete(channel.channelOffset);
      if (this.processes.has(channel.pid)) {
        this.handleEpollPwait(channel, syscallNr, origArgs);
      }
    };
    const timer = setTimeout(retryFn, 10);
    this.pendingPollRetries.set(channel.channelOffset, { timer, channel, pipeIndices });
  }
  // ---- Network interface ioctl host-side handlers ----
  // The kernel has a single virtual network interface ("eth0") with a random
  // MAC address generated per kernel instance.
  /**
   * Handle SIOCGIFCONF: enumerate network interfaces.
   * struct ifconf { int ifc_len; union { char *ifc_buf; struct ifreq *ifc_req; }; }
   * The ifc_buf pointer is in process memory, so the kernel can't write to it
   * directly — we handle the entire ioctl on the host side.
   */
  handleIoctlIfconf(channel, origArgs) {
    const processView = new DataView(channel.memory.buffer);
    const processMem = new Uint8Array(channel.memory.buffer);
    const pw = this.getPtrWidth(channel.pid);
    const ifconfPtr = origArgs[2];
    const ifcLen = processView.getInt32(ifconfPtr, true);
    let ifcBuf;
    if (pw === 8) {
      ifcBuf = Number(processView.getBigUint64(ifconfPtr + 8, true));
    } else {
      ifcBuf = processView.getUint32(ifconfPtr + 4, true);
    }
    const SIZEOF_IFREQ = 32;
    if (ifcLen >= SIZEOF_IFREQ && ifcBuf !== 0) {
      const nameBytes = new TextEncoder().encode("eth0");
      processMem.set(nameBytes, ifcBuf);
      processMem.fill(0, ifcBuf + nameBytes.length, ifcBuf + 16);
      processMem.fill(0, ifcBuf + 16, ifcBuf + SIZEOF_IFREQ);
      processView.setUint16(ifcBuf + 16, 2, true);
      processMem[ifcBuf + 20] = 127;
      processMem[ifcBuf + 21] = 0;
      processMem[ifcBuf + 22] = 0;
      processMem[ifcBuf + 23] = 1;
      processView.setInt32(ifconfPtr, SIZEOF_IFREQ, true);
    } else {
      processView.setInt32(ifconfPtr, 0, true);
    }
    this.completeChannelRaw(channel, 0, 0);
    this.relistenChannel(channel);
  }
  /**
   * Handle SIOCGIFHWADDR: get hardware (MAC) address for an interface.
   * struct ifreq at arg[2]: ifr_name[16] + ifr_hwaddr (struct sockaddr, 16 bytes)
   * Returns the virtual MAC in ifr_hwaddr.sa_data[0..5].
   */
  handleIoctlIfhwaddr(channel, origArgs) {
    const processView = new DataView(channel.memory.buffer);
    const processMem = new Uint8Array(channel.memory.buffer);
    const ifreqPtr = origArgs[2];
    processMem.fill(0, ifreqPtr + 16, ifreqPtr + 32);
    processView.setUint16(ifreqPtr + 16, 1, true);
    processMem.set(this.virtualMacAddress, ifreqPtr + 18);
    this.completeChannelRaw(channel, 0, 0);
    this.relistenChannel(channel);
  }
  /**
   * Handle SIOCGIFADDR: get interface address.
   * struct ifreq at arg[2]: ifr_name[16] + ifr_addr (struct sockaddr, 16 bytes)
   * Returns 127.0.0.1 for the virtual interface.
   */
  handleIoctlIfaddr(channel, origArgs) {
    const processView = new DataView(channel.memory.buffer);
    const processMem = new Uint8Array(channel.memory.buffer);
    const ifreqPtr = origArgs[2];
    processMem.fill(0, ifreqPtr + 16, ifreqPtr + 32);
    processView.setUint16(ifreqPtr + 16, 2, true);
    processMem[ifreqPtr + 20] = 127;
    processMem[ifreqPtr + 21] = 0;
    processMem[ifreqPtr + 22] = 0;
    processMem[ifreqPtr + 23] = 1;
    this.completeChannelRaw(channel, 0, 0);
    this.relistenChannel(channel);
  }
  handleWritev(channel, syscallNr, origArgs) {
    const fd = origArgs[0];
    const iovPtr = origArgs[1];
    const iovcnt = origArgs[2];
    const processMem = new Uint8Array(channel.memory.buffer);
    const processView = new DataView(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const pw = this.getPtrWidth(channel.pid);
    const iovEntrySize = pw === 8 ? 16 : 8;
    const entries = [];
    let totalData = 0;
    for (let i = 0; i < iovcnt; i++) {
      let base, len;
      if (pw === 8) {
        base = Number(processView.getBigUint64(iovPtr + i * iovEntrySize, true));
        len = Number(processView.getBigUint64(iovPtr + i * iovEntrySize + 8, true));
      } else {
        base = processView.getUint32(iovPtr + i * iovEntrySize, true);
        len = processView.getUint32(iovPtr + i * iovEntrySize + 4, true);
      }
      entries.push({ base, len });
      totalData += len;
    }
    const iovSize = iovcnt * 8;
    const maxDataPerCall = CH_DATA_SIZE - iovSize;
    if (totalData <= maxDataPerCall) {
      let dataOff = iovSize;
      for (let i = 0; i < iovcnt; i++) {
        const kernelBase = dataStart + dataOff;
        if (entries[i].len > 0) {
          kernelMem.set(processMem.subarray(entries[i].base, entries[i].base + entries[i].len), kernelBase);
        }
        const iovAddr = dataStart + i * 8;
        new DataView(kernelMem.buffer).setUint32(iovAddr, kernelBase, true);
        new DataView(kernelMem.buffer).setUint32(iovAddr + 4, entries[i].len, true);
        dataOff += entries[i].len;
        dataOff = dataOff + 3 & ~3;
      }
      kernelView.setUint32(CH_SYSCALL, syscallNr, true);
      kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(iovcnt), true);
      if (syscallNr === SYS_PWRITEV) {
        kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(origArgs[3]), true);
        kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(origArgs[4]), true);
      }
      const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
      const errVal = kernelView.getUint32(CH_ERRNO, true);
      if (retVal === -1 && errVal === EAGAIN) {
        this.handleBlockingRetry(channel, syscallNr, origArgs);
        return;
      }
      this.completeChannel(channel, syscallNr, origArgs, void 0, retVal, errVal);
    } else {
      const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
      const isPwritev = syscallNr === SYS_PWRITEV;
      let fileOffset = isPwritev ? (origArgs[3] | 0) + (origArgs[4] | 0) * 4294967296 : 0;
      let totalWritten = 0;
      let gotEagain = false;
      const maxChunk = CH_DATA_SIZE - 8;
      for (const entry of entries) {
        if (entry.len === 0) continue;
        let entryWritten = 0;
        while (entryWritten < entry.len) {
          const chunkLen = Math.min(entry.len - entryWritten, maxChunk);
          const kernelBuf = dataStart + 8;
          kernelMem.set(
            processMem.subarray(entry.base + entryWritten, entry.base + entryWritten + chunkLen),
            kernelBuf
          );
          new DataView(kernelMem.buffer).setUint32(dataStart, kernelBuf, true);
          new DataView(kernelMem.buffer).setUint32(dataStart + 4, chunkLen, true);
          if (isPwritev) {
            kernelView.setUint32(CH_SYSCALL, SYS_PWRITEV, true);
            kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
            kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
            kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(1), true);
            kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(fileOffset & 4294967295), true);
            kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(Math.floor(fileOffset / 4294967296)), true);
          } else {
            kernelView.setUint32(CH_SYSCALL, SYS_WRITEV, true);
            kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
            kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
            kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(1), true);
          }
          this.currentHandlePid = channel.pid;
          this.bindKernelTidForChannel(channel);
          try {
            handleChannel(BigInt(this.scratchOffset), channel.pid);
          } finally {
            this.currentHandlePid = 0;
          }
          const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
          const errVal = kernelView.getUint32(CH_ERRNO, true);
          if (retVal === -1) {
            if (errVal === EAGAIN && totalWritten === 0) {
              gotEagain = true;
            }
            break;
          }
          entryWritten += retVal;
          totalWritten += retVal;
          if (isPwritev) fileOffset += retVal;
          if (retVal < chunkLen) break;
        }
        if (gotEagain || entryWritten < entry.len) break;
      }
      if (gotEagain) {
        this.handleBlockingRetry(channel, syscallNr, origArgs);
        return;
      }
      this.completeChannelRaw(channel, totalWritten, 0);
      this.relistenChannel(channel);
    }
  }
  /**
   * Handle large write/pwrite where the data exceeds CH_DATA_SIZE.
   * Loops through CH_DATA_SIZE chunks, issuing individual kernel calls.
   */
  handleLargeWrite(channel, syscallNr, origArgs) {
    const fd = origArgs[0];
    const bufPtr = origArgs[1];
    const totalLen = origArgs[2];
    const isPwrite = syscallNr === SYS_PWRITE;
    let fileOffset = isPwrite ? origArgs[3] : 0;
    const processMem = new Uint8Array(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    let totalWritten = 0;
    while (totalWritten < totalLen) {
      const chunkLen = Math.min(totalLen - totalWritten, CH_DATA_SIZE);
      kernelMem.set(
        processMem.subarray(bufPtr + totalWritten, bufPtr + totalWritten + chunkLen),
        dataStart
      );
      kernelView.setUint32(CH_SYSCALL, syscallNr, true);
      kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(chunkLen), true);
      if (isPwrite) {
        kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(fileOffset), true);
      }
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } catch (err) {
        console.error(`[handleLargeWrite] kernel threw for pid=${channel.pid}:`, err);
        if (totalWritten > 0) {
          this.completeChannelRaw(channel, totalWritten, 0);
        } else {
          this.completeChannelRaw(channel, -5, 5);
        }
        this.relistenChannel(channel);
        return;
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
      const errVal = kernelView.getUint32(CH_ERRNO, true);
      if (retVal === -1 && errVal === EAGAIN) {
        if (totalWritten > 0) {
          this.completeChannelRaw(channel, totalWritten, 0);
          this.relistenChannel(channel);
          return;
        }
        this.handleBlockingRetry(channel, syscallNr, origArgs);
        return;
      }
      if (errVal !== 0 || retVal <= 0) {
        if (totalWritten > 0) {
          this.completeChannelRaw(channel, totalWritten, 0);
        } else {
          this.completeChannelRaw(channel, retVal, errVal);
        }
        this.relistenChannel(channel);
        return;
      }
      totalWritten += retVal;
      if (isPwrite) fileOffset += retVal;
      if (retVal < chunkLen) break;
    }
    this.dequeueSignalForDelivery(channel);
    this.completeChannelRaw(channel, totalWritten, 0);
    this.relistenChannel(channel);
  }
  /**
   * Handle large read/pread where the buffer exceeds CH_DATA_SIZE.
   * Loops through CH_DATA_SIZE chunks, copying data back to process memory.
   */
  handleLargeRead(channel, syscallNr, origArgs) {
    const fd = origArgs[0];
    const bufPtr = origArgs[1];
    const totalLen = origArgs[2];
    const isPread = syscallNr === SYS_PREAD;
    let fileOffset = isPread ? origArgs[3] : 0;
    const processMem = new Uint8Array(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    let totalRead = 0;
    while (totalRead < totalLen) {
      const chunkLen = Math.min(totalLen - totalRead, CH_DATA_SIZE);
      kernelMem.fill(0, dataStart, dataStart + chunkLen);
      kernelView.setUint32(CH_SYSCALL, syscallNr, true);
      kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(chunkLen), true);
      if (isPread) {
        kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(fileOffset), true);
      }
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } catch (err) {
        console.error(`[handleLargeRead] kernel threw for pid=${channel.pid}:`, err);
        if (totalRead > 0) {
          this.completeChannelRaw(channel, totalRead, 0);
        } else {
          this.completeChannelRaw(channel, -5, 5);
        }
        this.relistenChannel(channel);
        return;
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
      const errVal = kernelView.getUint32(CH_ERRNO, true);
      if (retVal === -1 && errVal === EAGAIN) {
        if (totalRead > 0) {
          this.completeChannelRaw(channel, totalRead, 0);
          this.relistenChannel(channel);
          return;
        }
        this.handleBlockingRetry(channel, syscallNr, origArgs);
        return;
      }
      if (errVal !== 0 || retVal <= 0) {
        if (totalRead > 0) {
          this.completeChannelRaw(channel, totalRead, 0);
        } else {
          this.completeChannelRaw(channel, retVal, errVal);
        }
        this.relistenChannel(channel);
        return;
      }
      processMem.set(
        kernelMem.subarray(dataStart, dataStart + retVal),
        bufPtr + totalRead
      );
      totalRead += retVal;
      if (isPread) fileOffset += retVal;
      if (retVal < chunkLen) break;
    }
    this.dequeueSignalForDelivery(channel);
    this.completeChannelRaw(channel, totalRead, 0);
    this.relistenChannel(channel);
  }
  /**
   * Handle readv/preadv: set up iov array in kernel scratch, call
   * kernel_handle_channel, then copy read data back to process memory.
   */
  handleReadv(channel, syscallNr, origArgs) {
    const fd = origArgs[0];
    const iovPtr = origArgs[1];
    const iovcnt = origArgs[2];
    const processMem = new Uint8Array(channel.memory.buffer);
    const processView = new DataView(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const pw = this.getPtrWidth(channel.pid);
    const iovEntrySize = pw === 8 ? 16 : 8;
    const entries = [];
    let totalData = 0;
    for (let i = 0; i < iovcnt; i++) {
      let base, len;
      if (pw === 8) {
        base = Number(processView.getBigUint64(iovPtr + i * iovEntrySize, true));
        len = Number(processView.getBigUint64(iovPtr + i * iovEntrySize + 8, true));
      } else {
        base = processView.getUint32(iovPtr + i * iovEntrySize, true);
        len = processView.getUint32(iovPtr + i * iovEntrySize + 4, true);
      }
      entries.push({ base, len });
      totalData += len;
    }
    const maxDataPerCall = CH_DATA_SIZE - 8;
    if (totalData <= maxDataPerCall && iovcnt <= Math.floor(CH_DATA_SIZE / 8)) {
      const iovSize = iovcnt * 8;
      let dataOff = iovSize;
      const kernelEntries = [];
      for (let i = 0; i < iovcnt; i++) {
        const kernelBase = dataStart + dataOff;
        kernelEntries.push({ base: entries[i].base, kernelBase, len: entries[i].len });
        if (entries[i].len > 0) {
          kernelMem.fill(0, kernelBase, kernelBase + entries[i].len);
        }
        const iovAddr = dataStart + i * 8;
        new DataView(kernelMem.buffer).setUint32(iovAddr, kernelBase, true);
        new DataView(kernelMem.buffer).setUint32(iovAddr + 4, entries[i].len, true);
        dataOff += entries[i].len;
        dataOff = dataOff + 3 & ~3;
      }
      kernelView.setUint32(CH_SYSCALL, syscallNr, true);
      kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(iovcnt), true);
      if (syscallNr === SYS_PREADV) {
        kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(origArgs[3]), true);
        kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(origArgs[4]), true);
      }
      const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
      const errVal = kernelView.getUint32(CH_ERRNO, true);
      if (retVal === -1 && errVal === EAGAIN) {
        this.handleBlockingRetry(channel, syscallNr, origArgs);
        return;
      }
      if (retVal > 0) {
        let remaining = retVal;
        for (const entry of kernelEntries) {
          if (remaining <= 0) break;
          const copyLen = Math.min(entry.len, remaining);
          processMem.set(
            kernelMem.subarray(entry.kernelBase, entry.kernelBase + copyLen),
            entry.base
          );
          remaining -= copyLen;
        }
      }
      this.completeChannel(channel, syscallNr, origArgs, void 0, retVal, errVal);
    } else {
      const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
      const isPreadv = syscallNr === SYS_PREADV;
      let fileOffset = isPreadv ? (origArgs[3] | 0) + (origArgs[4] | 0) * 4294967296 : 0;
      let totalRead = 0;
      let lastErr = 0;
      let gotEagain = false;
      for (const entry of entries) {
        if (entry.len === 0) continue;
        let entryRead = 0;
        while (entryRead < entry.len) {
          const chunkLen = Math.min(entry.len - entryRead, maxDataPerCall);
          const kernelBuf = dataStart + 8;
          new DataView(kernelMem.buffer).setUint32(dataStart, kernelBuf, true);
          new DataView(kernelMem.buffer).setUint32(dataStart + 4, chunkLen, true);
          kernelMem.fill(0, kernelBuf, kernelBuf + chunkLen);
          if (isPreadv) {
            kernelView.setUint32(CH_SYSCALL, SYS_PREADV, true);
            kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
            kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
            kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(1), true);
            kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(fileOffset & 4294967295), true);
            kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(Math.floor(fileOffset / 4294967296)), true);
          } else {
            kernelView.setUint32(CH_SYSCALL, SYS_READV, true);
            kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
            kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
            kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(1), true);
          }
          this.currentHandlePid = channel.pid;
          this.bindKernelTidForChannel(channel);
          try {
            handleChannel(BigInt(this.scratchOffset), channel.pid);
          } finally {
            this.currentHandlePid = 0;
          }
          const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
          const errVal = kernelView.getUint32(CH_ERRNO, true);
          if (retVal === -1) {
            if (errVal === EAGAIN && totalRead === 0) {
              gotEagain = true;
              break;
            }
            lastErr = errVal;
            break;
          }
          if (retVal === 0) break;
          processMem.set(
            kernelMem.subarray(kernelBuf, kernelBuf + retVal),
            entry.base + entryRead
          );
          entryRead += retVal;
          totalRead += retVal;
          if (isPreadv) fileOffset += retVal;
          if (retVal < chunkLen) break;
        }
        if (gotEagain || lastErr) break;
      }
      if (gotEagain) {
        this.handleBlockingRetry(channel, syscallNr, origArgs);
        return;
      }
      const finalRet = totalRead > 0 ? totalRead : lastErr ? -1 : 0;
      const finalErr = totalRead > 0 ? 0 : lastErr;
      this.completeChannel(channel, syscallNr, origArgs, void 0, finalRet, finalErr);
    }
  }
  /**
   * Handle sendmsg: decompose msghdr from process memory, flatten data + addr
   * into kernel scratch, call kernel_sendmsg which dispatches to sendto/send.
   */
  handleSendmsg(channel, origArgs) {
    const fd = origArgs[0];
    const msgPtr = origArgs[1];
    const flags = origArgs[2];
    const processMem = new Uint8Array(channel.memory.buffer);
    const processView = new DataView(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const pw = this.getPtrWidth(channel.pid);
    let namePtr, nameLen, iovPtr, iovCnt;
    let controlPtr, controlLen;
    if (pw === 8) {
      namePtr = Number(processView.getBigUint64(msgPtr, true));
      nameLen = processView.getUint32(msgPtr + 8, true);
      iovPtr = Number(processView.getBigUint64(msgPtr + 16, true));
      iovCnt = processView.getUint32(msgPtr + 24, true);
      controlPtr = Number(processView.getBigUint64(msgPtr + 32, true));
      controlLen = processView.getUint32(msgPtr + 40, true);
    } else {
      namePtr = processView.getUint32(msgPtr, true);
      nameLen = processView.getUint32(msgPtr + 4, true);
      iovPtr = processView.getUint32(msgPtr + 8, true);
      iovCnt = processView.getUint32(msgPtr + 12, true);
      controlPtr = processView.getUint32(msgPtr + 16, true);
      controlLen = processView.getUint32(msgPtr + 20, true);
    }
    const kMsgPtr = dataStart;
    const kv = new DataView(kernelMem.buffer);
    kv.setUint32(kMsgPtr, namePtr, true);
    kv.setUint32(kMsgPtr + 4, nameLen, true);
    kv.setUint32(kMsgPtr + 8, iovPtr, true);
    kv.setUint32(kMsgPtr + 12, iovCnt, true);
    kv.setUint32(kMsgPtr + 16, controlPtr, true);
    kv.setUint32(kMsgPtr + 20, controlLen, true);
    kv.setUint32(kMsgPtr + 24, 0, true);
    let dataOff = 28;
    if (namePtr !== 0 && nameLen > 0 && dataOff + nameLen <= CH_DATA_SIZE) {
      const kNamePtr = dataStart + dataOff;
      kernelMem.set(processMem.subarray(namePtr, namePtr + nameLen), kNamePtr);
      kv.setUint32(kMsgPtr, kNamePtr, true);
      dataOff += nameLen;
      dataOff = dataOff + 3 & ~3;
    }
    if (controlPtr !== 0 && controlLen > 0 && dataOff + controlLen <= CH_DATA_SIZE) {
      const kCtrlPtr = dataStart + dataOff;
      kernelMem.set(processMem.subarray(controlPtr, controlPtr + controlLen), kCtrlPtr);
      kv.setUint32(kMsgPtr + 16, kCtrlPtr, true);
      dataOff += controlLen;
      dataOff = dataOff + 3 & ~3;
    }
    const iovEntrySize = pw === 8 ? 16 : 8;
    if (iovCnt > 0 && iovPtr !== 0) {
      const kIovSize = iovCnt * 8;
      const kIovPtr = dataStart + dataOff;
      dataOff += kIovSize;
      dataOff = dataOff + 3 & ~3;
      kv.setUint32(kMsgPtr + 8, kIovPtr, true);
      for (let i = 0; i < iovCnt; i++) {
        let base, len;
        if (pw === 8) {
          base = Number(processView.getBigUint64(iovPtr + i * iovEntrySize, true));
          len = Number(processView.getBigUint64(iovPtr + i * iovEntrySize + 8, true));
        } else {
          base = processView.getUint32(iovPtr + i * 8, true);
          len = processView.getUint32(iovPtr + i * 8 + 4, true);
        }
        kv.setUint32(kIovPtr + i * 8, 0, true);
        kv.setUint32(kIovPtr + i * 8 + 4, len, true);
        if (len > 0 && dataOff + len <= CH_DATA_SIZE) {
          const kBufPtr = dataStart + dataOff;
          kernelMem.set(processMem.subarray(base, base + len), kBufPtr);
          kv.setUint32(kIovPtr + i * 8, kBufPtr, true);
          dataOff += len;
          dataOff = dataOff + 3 & ~3;
        }
      }
    }
    kernelView.setUint32(CH_SYSCALL, 137, true);
    kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(kMsgPtr), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(flags), true);
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal === -1 && errVal === EAGAIN) {
      this.handleBlockingRetry(channel, 137, origArgs);
      return;
    }
    this.completeChannel(channel, 137, origArgs, void 0, retVal, errVal);
  }
  /**
   * Handle recvmsg: decompose msghdr from process memory, set up buffers in
   * kernel scratch, call kernel_recvmsg, copy results back.
   */
  handleRecvmsg(channel, origArgs) {
    const fd = origArgs[0];
    const msgPtr = origArgs[1];
    const flags = origArgs[2];
    const processMem = new Uint8Array(channel.memory.buffer);
    const processView = new DataView(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const dataStart = this.scratchOffset + CH_DATA;
    const pw = this.getPtrWidth(channel.pid);
    let namePtr, nameLen, iovPtr, iovCnt;
    let controlPtr, controlLen;
    if (pw === 8) {
      namePtr = Number(processView.getBigUint64(msgPtr, true));
      nameLen = processView.getUint32(msgPtr + 8, true);
      iovPtr = Number(processView.getBigUint64(msgPtr + 16, true));
      iovCnt = processView.getUint32(msgPtr + 24, true);
      controlPtr = Number(processView.getBigUint64(msgPtr + 32, true));
      controlLen = processView.getUint32(msgPtr + 40, true);
    } else {
      namePtr = processView.getUint32(msgPtr, true);
      nameLen = processView.getUint32(msgPtr + 4, true);
      iovPtr = processView.getUint32(msgPtr + 8, true);
      iovCnt = processView.getUint32(msgPtr + 12, true);
      controlPtr = processView.getUint32(msgPtr + 16, true);
      controlLen = processView.getUint32(msgPtr + 20, true);
    }
    const kMsgPtr = dataStart;
    const kv = new DataView(kernelMem.buffer);
    kv.setUint32(kMsgPtr, namePtr, true);
    kv.setUint32(kMsgPtr + 4, nameLen, true);
    kv.setUint32(kMsgPtr + 8, iovPtr, true);
    kv.setUint32(kMsgPtr + 12, iovCnt, true);
    kv.setUint32(kMsgPtr + 16, controlPtr, true);
    kv.setUint32(kMsgPtr + 20, controlLen, true);
    kv.setUint32(kMsgPtr + 24, 0, true);
    let dataOff = 28;
    let kNamePtr = 0;
    if (namePtr !== 0 && nameLen > 0 && dataOff + nameLen <= CH_DATA_SIZE) {
      kNamePtr = dataStart + dataOff;
      kernelMem.fill(0, kNamePtr, kNamePtr + nameLen);
      kv.setUint32(kMsgPtr, kNamePtr, true);
      dataOff += nameLen;
      dataOff = dataOff + 3 & ~3;
    }
    let kCtrlPtr = 0;
    if (controlPtr !== 0 && controlLen > 0 && dataOff + controlLen <= CH_DATA_SIZE) {
      kCtrlPtr = dataStart + dataOff;
      kernelMem.fill(0, kCtrlPtr, kCtrlPtr + controlLen);
      kv.setUint32(kMsgPtr + 16, kCtrlPtr, true);
      dataOff += controlLen;
      dataOff = dataOff + 3 & ~3;
    }
    const entries = [];
    const iovEntrySize = pw === 8 ? 16 : 8;
    if (iovCnt > 0 && iovPtr !== 0) {
      const kIovSize = iovCnt * 8;
      const kIovPtr = dataStart + dataOff;
      dataOff += kIovSize;
      dataOff = dataOff + 3 & ~3;
      kv.setUint32(kMsgPtr + 8, kIovPtr, true);
      for (let i = 0; i < iovCnt; i++) {
        let base, len;
        if (pw === 8) {
          base = Number(processView.getBigUint64(iovPtr + i * iovEntrySize, true));
          len = Number(processView.getBigUint64(iovPtr + i * iovEntrySize + 8, true));
        } else {
          base = processView.getUint32(iovPtr + i * 8, true);
          len = processView.getUint32(iovPtr + i * 8 + 4, true);
        }
        if (len > 0 && dataOff + len <= CH_DATA_SIZE) {
          const kBufPtr = dataStart + dataOff;
          kernelMem.fill(0, kBufPtr, kBufPtr + len);
          kv.setUint32(kIovPtr + i * 8, kBufPtr, true);
          kv.setUint32(kIovPtr + i * 8 + 4, len, true);
          entries.push({ base, len, kernelBase: kBufPtr });
          dataOff += len;
          dataOff = dataOff + 3 & ~3;
        } else {
          kv.setUint32(kIovPtr + i * 8, 0, true);
          kv.setUint32(kIovPtr + i * 8 + 4, len, true);
        }
      }
    }
    kernelView.setUint32(CH_SYSCALL, 138, true);
    kernelView.setBigInt64(CH_ARGS, BigInt(fd), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(kMsgPtr), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(flags), true);
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal === -1 && errVal === EAGAIN) {
      this.handleBlockingRetry(channel, 138, origArgs);
      return;
    }
    if (retVal > 0) {
      let remaining = retVal;
      for (const entry of entries) {
        if (remaining <= 0) break;
        const copyLen = Math.min(entry.len, remaining);
        processMem.set(
          kernelMem.subarray(entry.kernelBase, entry.kernelBase + copyLen),
          entry.base
        );
        remaining -= copyLen;
      }
    }
    if (kNamePtr !== 0 && namePtr !== 0 && nameLen > 0) {
      processMem.set(kernelMem.subarray(kNamePtr, kNamePtr + nameLen), namePtr);
    }
    if (kCtrlPtr !== 0 && controlPtr !== 0) {
      const actualControlLen = kv.getUint32(kMsgPtr + 20, true);
      if (actualControlLen > 0 && actualControlLen <= controlLen) {
        processMem.set(
          kernelMem.subarray(kCtrlPtr, kCtrlPtr + actualControlLen),
          controlPtr
        );
      }
    }
    const kNamelenVal = kv.getUint32(kMsgPtr + 4, true);
    const kControllenVal = kv.getUint32(kMsgPtr + 20, true);
    const kMsgflags = kv.getUint32(kMsgPtr + 24, true);
    if (pw === 8) {
      processView.setUint32(msgPtr + 8, kNamelenVal, true);
      processView.setUint32(msgPtr + 40, kControllenVal, true);
      processView.setUint32(msgPtr + 44, kMsgflags, true);
    } else {
      processView.setUint32(msgPtr + 4, kNamelenVal, true);
      processView.setUint32(msgPtr + 20, kControllenVal, true);
      processView.setUint32(msgPtr + 24, kMsgflags, true);
    }
    this.completeChannel(channel, 138, origArgs, void 0, retVal, errVal);
  }
  // -----------------------------------------------------------------------
  // Fork/exec/clone/exit handling
  // -----------------------------------------------------------------------
  /**
   * Handle SYS_FORK/SYS_VFORK: clone the Process in the kernel's ProcessTable,
   * then call the onFork callback to spawn the child Worker.
   */
  handleFork(channel, _origArgs) {
    if (!this.callbacks.onFork) {
      this.completeChannel(channel, SYS_FORK, _origArgs, void 0, -1, 38);
      return;
    }
    const parentPid = channel.pid;
    while (this.processes.has(this.nextChildPid)) {
      this.nextChildPid++;
    }
    const childPid = this.nextChildPid++;
    const kernelForkProcess = this.kernelInstance.exports.kernel_fork_process;
    const forkResult = kernelForkProcess(parentPid, childPid);
    if (forkResult < 0) {
      this.completeChannel(channel, SYS_FORK, _origArgs, void 0, -1, -forkResult >>> 0);
      return;
    }
    const clearForkChild = this.kernelInstance.exports.kernel_clear_fork_child;
    if (clearForkChild) clearForkChild(childPid);
    const resetSignalMask = this.kernelInstance.exports.kernel_reset_signal_mask;
    if (resetSignalMask) resetSignalMask(childPid);
    this.childToParent.set(childPid, parentPid);
    let children = this.parentToChildren.get(parentPid);
    if (!children) {
      children = /* @__PURE__ */ new Set();
      this.parentToChildren.set(parentPid, children);
    }
    children.add(childPid);
    this.callbacks.onFork(parentPid, childPid, channel.memory).then((childChannelOffsets) => {
      if (!this.processes.has(parentPid)) return;
      for (const [port, targets] of this.tcpListenerTargets) {
        const parentTarget = targets.find((t) => t.pid === parentPid);
        if (parentTarget && !targets.some((t) => t.pid === childPid)) {
          targets.push({ pid: childPid, fd: parentTarget.fd });
        }
      }
      for (const [key, interests] of this.epollInterests) {
        if (key.startsWith(`${parentPid}:`)) {
          const epfd = key.slice(key.indexOf(":") + 1);
          this.epollInterests.set(`${childPid}:${epfd}`, interests.map((e) => ({ ...e })));
        }
      }
      this.completeChannel(channel, SYS_FORK, _origArgs, void 0, childPid, 0);
    }).catch(() => {
      const removeProcess = this.kernelInstance.exports.kernel_remove_process;
      removeProcess(childPid);
      this.completeChannel(channel, SYS_FORK, _origArgs, void 0, -1, 12);
    });
  }
  /**
   * Read a null-terminated string from process memory at the given pointer.
   */
  readCStringFromProcess(mem, ptr, maxLen = 4096) {
    if (ptr === 0) return "";
    let len = 0;
    while (ptr + len < mem.length && mem[ptr + len] !== 0 && len < maxLen) {
      len++;
    }
    return new TextDecoder().decode(mem.slice(ptr, ptr + len));
  }
  /**
   * Read a null-terminated array of string pointers from process memory.
   * Each element is a 32-bit pointer to a null-terminated string.
   */
  readStringArrayFromProcess(mem, arrayPtr, ptrWidth = 4) {
    if (arrayPtr === 0) return [];
    const result = [];
    const view = new DataView(mem.buffer, mem.byteOffset, mem.byteLength);
    for (let i = 0; i < 1024; i++) {
      let strPtr;
      if (ptrWidth === 8) {
        strPtr = Number(view.getBigUint64(arrayPtr + i * 8, true));
      } else {
        strPtr = view.getUint32(arrayPtr + i * 4, true);
      }
      if (strPtr === 0) break;
      result.push(this.readCStringFromProcess(mem, strPtr));
    }
    return result;
  }
  /**
   * Handle SYS_EXECVE: read path, argv, and envp from process memory,
   * then call the onExec callback to load the new program.
   */
  handleExec(channel, origArgs) {
    const processMem = new Uint8Array(channel.memory.buffer);
    const pw = this.getPtrWidth(channel.pid);
    let path2 = this.readCStringFromProcess(processMem, origArgs[0]);
    const argv = this.readStringArrayFromProcess(processMem, origArgs[1], pw);
    const envp = this.readStringArrayFromProcess(processMem, origArgs[2], pw);
    if (path2 && !path2.startsWith("/")) {
      path2 = this.resolveExecPathAgainstCwd(channel.pid, path2);
    }
    if (!this.callbacks.onExec) {
      this.completeChannel(channel, SYS_EXECVE, origArgs, void 0, -1, 38);
      return;
    }
    this.callbacks.onExec(channel.pid, path2, argv, envp).then((result) => {
      if (result < 0) {
        this.completeChannel(channel, SYS_EXECVE, origArgs, void 0, -1, -result >>> 0);
      }
    }).catch((err) => {
      console.error(`[kernel] exec error for pid ${channel.pid}:`, err);
      this.completeChannel(channel, SYS_EXECVE, origArgs, void 0, -1, 5);
    });
  }
  /**
   * Resolve a relative exec path against the process's kernel CWD.
   * Returns absolute path if CWD can be queried, otherwise returns path unchanged.
   */
  resolveExecPathAgainstCwd(pid, path2) {
    const getCwd = this.kernelInstance.exports.kernel_get_cwd;
    if (!getCwd) return path2;
    const cwdLen = getCwd(pid, BigInt(this.scratchOffset), 4096);
    if (cwdLen <= 0) return path2;
    const kernelBuf = new Uint8Array(this.kernelMemory.buffer);
    const cwd = new TextDecoder().decode(kernelBuf.slice(this.scratchOffset, this.scratchOffset + cwdLen));
    const joined = cwd.endsWith("/") ? cwd + path2 : cwd + "/" + path2;
    const parts = joined.split("/");
    const normalized = [];
    for (const part of parts) {
      if (part === "." || part === "") continue;
      if (part === ".." && normalized.length > 0) {
        normalized.pop();
        continue;
      }
      normalized.push(part);
    }
    return "/" + normalized.join("/");
  }
  /**
   * Handle SYS_EXECVEAT: execveat(dirfd, path, argv, envp, flags).
   * Used by fexecve which calls execveat(fd, "", argv, envp, AT_EMPTY_PATH).
   * Resolves the fd path via kernel_get_fd_path, then delegates to exec flow.
   */
  handleExecveat(channel, origArgs) {
    const AT_EMPTY_PATH = 4096;
    const dirfd = origArgs[0];
    const flags = origArgs[4];
    const processMem = new Uint8Array(channel.memory.buffer);
    const pw = this.getPtrWidth(channel.pid);
    const pathStr = this.readCStringFromProcess(processMem, origArgs[1]);
    const argv = this.readStringArrayFromProcess(processMem, origArgs[2], pw);
    const envp = this.readStringArrayFromProcess(processMem, origArgs[3], pw);
    let execPath;
    if ((flags & AT_EMPTY_PATH) !== 0 && pathStr === "") {
      const getFdPath = this.kernelInstance.exports.kernel_get_fd_path;
      if (!getFdPath) {
        this.completeChannel(channel, SYS_EXECVEAT, origArgs, void 0, -1, 38);
        return;
      }
      const result = getFdPath(channel.pid, dirfd, BigInt(this.scratchOffset), 4096);
      if (result <= 0) {
        const errno = result < 0 ? -result >>> 0 : 2;
        this.completeChannel(channel, SYS_EXECVEAT, origArgs, void 0, -1, errno);
        return;
      }
      const kernelBuf = new Uint8Array(this.kernelMemory.buffer);
      execPath = new TextDecoder().decode(kernelBuf.slice(this.scratchOffset, this.scratchOffset + result));
    } else if (pathStr.startsWith("/")) {
      execPath = pathStr;
    } else {
      const getCwd = this.kernelInstance.exports.kernel_get_cwd;
      if (getCwd) {
        const cwdLen = getCwd(channel.pid, this.scratchOffset, 4096);
        if (cwdLen > 0) {
          const kernelBuf = new Uint8Array(this.kernelMemory.buffer);
          const cwd = new TextDecoder().decode(kernelBuf.slice(this.scratchOffset, this.scratchOffset + cwdLen));
          execPath = cwd.endsWith("/") ? cwd + pathStr : cwd + "/" + pathStr;
        } else {
          execPath = pathStr;
        }
      } else {
        execPath = pathStr;
      }
    }
    if (!this.callbacks.onExec) {
      this.completeChannel(channel, SYS_EXECVEAT, origArgs, void 0, -1, 38);
      return;
    }
    this.callbacks.onExec(channel.pid, execPath, argv, envp).then((result) => {
      if (result < 0) {
        this.completeChannel(channel, SYS_EXECVEAT, origArgs, void 0, -1, -result >>> 0);
      }
    }).catch((err) => {
      console.error(`[kernel] execveat error for pid ${channel.pid}:`, err);
      this.completeChannel(channel, SYS_EXECVEAT, origArgs, void 0, -1, 5);
    });
  }
  /**
   * Handle SYS_CLONE: thread creation. Call the onClone callback to spawn
   * a thread Worker sharing the parent's Memory.
   */
  handleClone(channel, origArgs) {
    if (!this.callbacks.onClone) {
      this.completeChannel(channel, SYS_CLONE, origArgs, void 0, -1, 38);
      return;
    }
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    kernelView.setUint32(CH_SYSCALL, SYS_CLONE, true);
    for (let i = 0; i < CH_ARGS_COUNT; i++) {
      kernelView.setBigInt64(CH_ARGS + i * CH_ARG_SIZE, BigInt(origArgs[i]), true);
    }
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    const errVal = kernelView.getUint32(CH_ERRNO, true);
    if (retVal < 0) {
      this.completeChannel(channel, SYS_CLONE, origArgs, void 0, retVal, errVal);
      return;
    }
    const tid = retVal;
    const CLONE_PARENT_SETTID = 1048576;
    const flags = origArgs[0];
    const ptidPtr = origArgs[2];
    if (flags & CLONE_PARENT_SETTID && ptidPtr !== 0) {
      const procView = new DataView(channel.memory.buffer);
      procView.setInt32(ptidPtr, tid, true);
    }
    const processView = new DataView(channel.memory.buffer, channel.channelOffset);
    const fnPtr = processView.getUint32(CH_DATA, true);
    const argPtr = processView.getUint32(CH_DATA + 4, true);
    const stackPtr = origArgs[1];
    const tlsPtr = origArgs[3];
    const ctidPtr = origArgs[4];
    this.callbacks.onClone(
      channel.pid,
      tid,
      fnPtr,
      argPtr,
      stackPtr,
      tlsPtr,
      ctidPtr,
      channel.memory
    ).then((assignedTid) => {
      if (!this.processes.has(channel.pid)) return;
      if (ctidPtr !== 0) {
        this.threadCtidPtrs.set(`${channel.pid}:${assignedTid}`, ctidPtr);
      }
      this.completeChannel(channel, SYS_CLONE, origArgs, void 0, assignedTid, 0);
    }).catch((err) => {
      console.error(`[kernel-worker] onClone failed: ${err}`);
      this.completeChannel(channel, SYS_CLONE, origArgs, void 0, -1, 12);
    });
  }
  /**
   * Handle SYS_EXIT/SYS_EXIT_GROUP: notify the kernel and clean up.
   *
   * For SYS_EXIT from a non-main channel (thread exit): notify kernel,
   * remove channel, complete channel to unblock thread worker.
   * For SYS_EXIT from main channel or SYS_EXIT_GROUP: current behavior.
   */
  handleExit(channel, syscallNr, origArgs) {
    const exitStatus = origArgs[0];
    const registration = this.processes.get(channel.pid);
    const isMainChannel = registration && registration.channels.length > 0 && registration.channels[0].channelOffset === channel.channelOffset;
    if (syscallNr === SYS_EXIT && !isMainChannel) {
      const tidKey = `${channel.pid}:${channel.channelOffset}`;
      const tid = this.channelTids.get(tidKey) ?? 0;
      if (tid > 0) {
        this.channelTids.delete(tidKey);
      }
      if (tid > 0) {
        const ctidKey = `${channel.pid}:${tid}`;
        const ctidPtr = this.threadCtidPtrs.get(ctidKey);
        if (ctidPtr && ctidPtr !== 0) {
          this.threadCtidPtrs.delete(ctidKey);
          const procView = new DataView(channel.memory.buffer);
          procView.setInt32(ctidPtr, 0, true);
          const i32View = new Int32Array(channel.memory.buffer);
          Atomics.notify(i32View, ctidPtr >>> 2, 1);
        }
      }
      if (tid > 0) {
        this.notifyThreadExit(channel.pid, tid);
      }
      this.removeChannel(channel.pid, channel.channelOffset);
      this.completeChannelRaw(channel, 0, 0);
      return;
    }
    {
      const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
      kernelView.setUint32(CH_SYSCALL, syscallNr, true);
      kernelView.setBigInt64(CH_ARGS, BigInt(exitStatus), true);
      const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } catch {
      } finally {
        this.currentHandlePid = 0;
      }
    }
    const exitingPid = channel.pid;
    if (this.hostReaped.has(exitingPid)) {
      this.completeChannelRaw(channel, 0, 0);
      this.scheduleWakeBlockedRetries();
      if (this.callbacks.onExit) this.callbacks.onExit(exitingPid, exitStatus);
      return;
    }
    this.hostReaped.add(exitingPid);
    const parentPid = this.childToParent.get(exitingPid);
    if (parentPid !== void 0) {
      const getExitStatus = this.kernelInstance.exports.kernel_get_process_exit_status;
      const kernelExitStatus = getExitStatus ? getExitStatus(exitingPid) : -1;
      let waitStatus;
      if (kernelExitStatus >= 128) {
        const signum = kernelExitStatus - 128;
        waitStatus = signum & 127;
      } else {
        waitStatus = (exitStatus & 255) << 8;
      }
      const hasNoCldWait = this.kernelInstance.exports.kernel_has_sa_nocldwait;
      const autoReap = hasNoCldWait ? hasNoCldWait(parentPid) === 1 : false;
      if (!autoReap) {
        this.exitedChildren.set(exitingPid, waitStatus);
        this.sendSignalToProcess(parentPid, SIGCHLD);
        this.wakeWaitingParent(parentPid, exitingPid, waitStatus);
      } else {
        this.childToParent.delete(exitingPid);
      }
    }
    this.completeChannelRaw(channel, 0, 0);
    this.scheduleWakeBlockedRetries();
    if (this.callbacks.onExit) {
      this.callbacks.onExit(exitingPid, exitStatus);
    }
  }
  /**
   * Handle a process that was terminated by a signal while blocking on a
   * syscall retry. Records the wait status and notifies the parent.
   */
  handleProcessTerminated(channel, waitStatus) {
    const exitingPid = channel.pid;
    if (this.hostReaped.has(exitingPid)) return;
    this.hostReaped.add(exitingPid);
    const parentPid = this.childToParent.get(exitingPid);
    if (parentPid !== void 0) {
      const hasNoCldWait = this.kernelInstance.exports.kernel_has_sa_nocldwait;
      const autoReap = hasNoCldWait ? hasNoCldWait(parentPid) === 1 : false;
      if (!autoReap) {
        this.exitedChildren.set(exitingPid, waitStatus);
        this.sendSignalToProcess(parentPid, SIGCHLD);
        this.wakeWaitingParent(parentPid, exitingPid, waitStatus);
      } else {
        this.childToParent.delete(exitingPid);
      }
    }
    this.sharedMappings.delete(exitingPid);
    if (this.callbacks.onExit) {
      const exitCode = waitStatus > 255 ? waitStatus >> 8 & 255 : 128 + (waitStatus & 127);
      this.callbacks.onExit(exitingPid, exitCode);
    }
  }
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
  reapKilledProcessesAfterSyscall() {
    const getExitStatus = this.kernelInstance.exports.kernel_get_process_exit_status;
    if (!getExitStatus) return;
    const pids = Array.from(this.processes.keys());
    for (const pid of pids) {
      const status = getExitStatus(pid);
      if (status < 0) continue;
      if (this.hostReaped.has(pid)) continue;
      const sigKilled = status >= 128 ? status - 128 : 0;
      const waitStatus = sigKilled > 0 ? sigKilled & 127 : (status & 255) << 8;
      const ps = this.pendingSleeps.get(pid);
      if (ps) {
        clearTimeout(ps.timer);
        this.pendingSleeps.delete(pid);
      }
      const proc = this.processes.get(pid);
      const ch = proc?.channels[0];
      if (ch) this.handleProcessTerminated(ch, waitStatus);
    }
  }
  /** Track pids the host has already reaped (prevents double-reaping
   *  when reapKilledProcessesAfterSyscall is called multiple times for
   *  the same already-Exited process). Cleared when the pid is
   *  re-allocated by a fresh fork+register. */
  hostReaped = /* @__PURE__ */ new Set();
  /**
   * Handle SYS_WAIT4: wait for a child process to exit.
   * Args: [pid, wstatus_ptr, options, rusage_ptr]
   */
  handleWaitpid(channel, origArgs) {
    const targetPid = origArgs[0];
    const wstatusPtr = origArgs[1];
    const options = origArgs[2] >>> 0;
    const parentPid = channel.pid;
    const children = this.parentToChildren.get(parentPid);
    if (!children || children.size === 0) {
      this.completeWaitpid(channel, origArgs, -1, 10);
      return;
    }
    const matchedChild = this.findExitedChild(parentPid, targetPid);
    if (matchedChild !== void 0) {
      const waitStatus = this.exitedChildren.get(matchedChild);
      this.consumeExitedChild(parentPid, matchedChild);
      this.writeWaitStatus(channel, wstatusPtr, waitStatus);
      this.completeWaitpid(channel, origArgs, matchedChild, 0);
      return;
    }
    const hasLivingChild = this.hasMatchingLivingChild(parentPid, targetPid);
    if (!hasLivingChild) {
      this.completeWaitpid(channel, origArgs, -1, 10);
      return;
    }
    if (options & WNOHANG) {
      this.completeWaitpid(channel, origArgs, 0, 0);
      return;
    }
    this.waitingForChild.push({
      parentPid,
      channel,
      origArgs,
      pid: targetPid,
      options,
      syscallNr: SYS_WAIT4
    });
  }
  /** Get the pgid of a process from the kernel's ProcessTable. */
  getProcessPgid(pid) {
    const fn_ = this.kernelInstance?.exports.kernel_getpgid_direct;
    if (!fn_) return pid;
    const result = fn_(pid);
    return result >= 0 ? result : pid;
  }
  /** Check if a child matches the waitpid pid argument. */
  childMatchesWaitTarget(childPid, targetPid, parentPid) {
    if (targetPid > 0) {
      return childPid === targetPid;
    }
    if (targetPid === -1) {
      return true;
    }
    if (targetPid === 0) {
      const parentPgid = this.getProcessPgid(parentPid);
      const childPgid2 = this.getProcessPgid(childPid);
      return childPgid2 === parentPgid;
    }
    const targetPgid = -targetPid;
    const childPgid = this.getProcessPgid(childPid);
    return childPgid === targetPgid;
  }
  /** Find an exited child matching the waitpid pid argument. */
  findExitedChild(parentPid, targetPid) {
    const children = this.parentToChildren.get(parentPid);
    if (!children) return void 0;
    for (const childPid of children) {
      if (this.exitedChildren.has(childPid) && this.childMatchesWaitTarget(childPid, targetPid, parentPid)) {
        return childPid;
      }
    }
    return void 0;
  }
  /** Check if there are living children matching the pid arg. */
  hasMatchingLivingChild(parentPid, targetPid) {
    const children = this.parentToChildren.get(parentPid);
    if (!children) return false;
    for (const childPid of children) {
      if (!this.exitedChildren.has(childPid) && this.childMatchesWaitTarget(childPid, targetPid, parentPid)) {
        return true;
      }
    }
    return false;
  }
  /** Remove an exited child from tracking after wait() consumes it. */
  consumeExitedChild(parentPid, childPid) {
    this.exitedChildren.delete(childPid);
    this.childToParent.delete(childPid);
    this.removeFromKernelProcessTable(childPid);
    const children = this.parentToChildren.get(parentPid);
    if (children) {
      children.delete(childPid);
      if (children.size === 0) {
        this.parentToChildren.delete(parentPid);
      }
    }
  }
  /** Write wait status to the wstatus pointer in process memory. */
  writeWaitStatus(channel, wstatusPtr, waitStatus) {
    if (wstatusPtr !== 0) {
      const procView = new DataView(channel.memory.buffer);
      procView.setInt32(wstatusPtr, waitStatus, true);
    }
  }
  /** Complete a waitpid syscall. */
  completeWaitpid(channel, origArgs, retVal, errVal) {
    this.dequeueSignalForDelivery(channel);
    this.completeChannel(channel, SYS_WAIT4, origArgs, void 0, retVal, errVal);
  }
  /** Wake a parent blocked in waitpid/waitid when a child exits. */
  wakeWaitingParent(parentPid, childPid, waitStatus) {
    const idx = this.waitingForChild.findIndex(
      (w) => w.parentPid === parentPid && this.childMatchesWaitTarget(childPid, w.pid, parentPid)
    );
    if (idx === -1) return;
    const waiter = this.waitingForChild[idx];
    this.waitingForChild.splice(idx, 1);
    if (waiter.syscallNr === SYS_WAITID) {
      this.writeSignalInfo(waiter.channel, waiter.origArgs[2], childPid, waitStatus);
      if (!(waiter.options & WNOWAIT)) {
        this.consumeExitedChild(parentPid, childPid);
      }
      this.dequeueSignalForDelivery(waiter.channel);
      this.completeChannel(waiter.channel, SYS_WAITID, waiter.origArgs, void 0, 0, 0);
    } else {
      this.consumeExitedChild(parentPid, childPid);
      this.writeWaitStatus(waiter.channel, waiter.origArgs[1], waitStatus);
      this.completeWaitpid(waiter.channel, waiter.origArgs, childPid, 0);
    }
  }
  /**
   * Re-check deferred waitpid/waitid calls after a process group change.
   * When a child changes its pgid (setpgid/setsid), a parent waiting on
   * waitpid(-pgid) may no longer have matching children → return ECHILD.
   */
  recheckDeferredWaitpids() {
    for (let i = this.waitingForChild.length - 1; i >= 0; i--) {
      const waiter = this.waitingForChild[i];
      if (waiter.pid > 0 || waiter.pid === -1) continue;
      if (!this.hasMatchingLivingChild(waiter.parentPid, waiter.pid) && !this.findExitedChild(waiter.parentPid, waiter.pid)) {
        this.waitingForChild.splice(i, 1);
        if (waiter.syscallNr === SYS_WAITID) {
          this.completeChannel(waiter.channel, SYS_WAITID, waiter.origArgs, void 0, -1, 10);
        } else {
          this.completeWaitpid(waiter.channel, waiter.origArgs, -1, 10);
        }
      }
    }
  }
  /**
   * Handle SYS_WAITID: wait for a child process state change.
   * Args: [idtype, id, siginfo_ptr, options, rusage_ptr]
   *
   * Supports P_PID, P_ALL, P_PGID id types and WNOWAIT/WNOHANG/WEXITED flags.
   * Fills siginfo_t in process memory with si_signo, si_code, si_pid, si_uid, si_status.
   */
  handleWaitid(channel, origArgs) {
    const idtype = origArgs[0];
    const id = origArgs[1];
    const siginfoPtr = origArgs[2];
    const options = origArgs[3] >>> 0;
    const parentPid = channel.pid;
    const children = this.parentToChildren.get(parentPid);
    if (!children || children.size === 0) {
      this.completeChannel(channel, SYS_WAITID, origArgs, void 0, -1, 10);
      return;
    }
    let matchedChild;
    if (idtype === P_PID) {
      if (children.has(id) && this.exitedChildren.has(id)) {
        matchedChild = id;
      }
    } else if (idtype === P_ALL) {
      for (const childPid of children) {
        if (this.exitedChildren.has(childPid)) {
          matchedChild = childPid;
          break;
        }
      }
    } else if (idtype === P_PGID) {
      const targetPgid = id === 0 ? this.getProcessPgid(parentPid) : id;
      for (const childPid of children) {
        if (this.exitedChildren.has(childPid) && this.getProcessPgid(childPid) === targetPgid) {
          matchedChild = childPid;
          break;
        }
      }
    }
    if (matchedChild !== void 0) {
      const waitStatus = this.exitedChildren.get(matchedChild);
      this.writeSignalInfo(channel, siginfoPtr, matchedChild, waitStatus);
      if (!(options & WNOWAIT)) {
        this.consumeExitedChild(parentPid, matchedChild);
      }
      this.completeChannel(channel, SYS_WAITID, origArgs, void 0, 0, 0);
      return;
    }
    let hasLivingChild = false;
    if (idtype === P_PID) {
      hasLivingChild = children.has(id) && !this.exitedChildren.has(id);
    } else if (idtype === P_PGID) {
      const targetPgid = id === 0 ? this.getProcessPgid(parentPid) : id;
      for (const childPid of children) {
        if (!this.exitedChildren.has(childPid) && this.getProcessPgid(childPid) === targetPgid) {
          hasLivingChild = true;
          break;
        }
      }
    } else {
      for (const childPid of children) {
        if (!this.exitedChildren.has(childPid)) {
          hasLivingChild = true;
          break;
        }
      }
    }
    if (!hasLivingChild) {
      this.completeChannel(channel, SYS_WAITID, origArgs, void 0, -1, 10);
      return;
    }
    if (options & WNOHANG) {
      if (siginfoPtr !== 0) {
        const procView = new DataView(channel.memory.buffer);
        procView.setInt32(siginfoPtr, 0, true);
        procView.setInt32(siginfoPtr + 12, 0, true);
      }
      this.completeChannel(channel, SYS_WAITID, origArgs, void 0, 0, 0);
      return;
    }
    let waitPid;
    if (idtype === P_PID) {
      waitPid = id;
    } else if (idtype === P_PGID) {
      waitPid = id === 0 ? 0 : -id;
    } else {
      waitPid = -1;
    }
    this.waitingForChild.push({
      parentPid,
      channel,
      origArgs,
      pid: waitPid,
      options,
      syscallNr: SYS_WAITID
    });
  }
  /**
   * Write siginfo_t fields for waitid into process memory.
   * Layout (wasm32): si_signo(+0), si_errno(+4), si_code(+8),
   * si_pid(+12), si_uid(+16), si_status(+20)
   */
  writeSignalInfo(channel, siginfoPtr, childPid, waitStatus) {
    if (siginfoPtr === 0) return;
    const procView = new DataView(channel.memory.buffer);
    for (let i = 0; i < 128; i += 4) {
      procView.setInt32(siginfoPtr + i, 0, true);
    }
    const signaled = (waitStatus & 127) !== 0;
    procView.setInt32(siginfoPtr + 0, SIGCHLD, true);
    procView.setInt32(siginfoPtr + 4, 0, true);
    if (signaled) {
      procView.setInt32(siginfoPtr + 8, CLD_KILLED, true);
    } else {
      procView.setInt32(siginfoPtr + 8, CLD_EXITED, true);
    }
    procView.setInt32(siginfoPtr + 12, childPid, true);
    procView.setInt32(siginfoPtr + 16, 1e3, true);
    if (signaled) {
      procView.setInt32(siginfoPtr + 20, waitStatus & 127, true);
    } else {
      procView.setInt32(siginfoPtr + 20, waitStatus >> 8 & 255, true);
    }
  }
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
  handleFutex(channel, origArgs) {
    const addr = origArgs[0];
    const op = origArgs[1];
    const val = origArgs[2];
    const FUTEX_PRIVATE_FLAG = 128;
    const FUTEX_CLOCK_REALTIME = 256;
    const baseOp = op & ~(FUTEX_PRIVATE_FLAG | FUTEX_CLOCK_REALTIME);
    const FUTEX_WAIT = 0;
    const FUTEX_WAKE = 1;
    const FUTEX_REQUEUE = 3;
    const FUTEX_CMP_REQUEUE = 4;
    const FUTEX_WAKE_OP = 5;
    const FUTEX_WAIT_BITSET = 9;
    const FUTEX_WAKE_BITSET = 10;
    const i32View = new Int32Array(channel.memory.buffer);
    const index = addr >>> 2;
    if (baseOp === FUTEX_WAIT || baseOp === FUTEX_WAIT_BITSET) {
      if (this.pendingCancels.has(channel.channelOffset)) {
        this.pendingCancels.delete(channel.channelOffset);
        this.completeChannelRaw(channel, -EINTR_ERRNO, EINTR_ERRNO);
        this.relistenChannel(channel);
        return;
      }
      const currentVal = Atomics.load(i32View, index);
      if (currentVal !== val) {
        this.completeChannelRaw(channel, -EAGAIN, EAGAIN);
        this.relistenChannel(channel);
        return;
      }
      let timeoutMs;
      const timeoutPtr = origArgs[3];
      if (timeoutPtr !== 0) {
        const dataView = new DataView(channel.memory.buffer);
        const tv_sec = Number(dataView.getBigInt64(timeoutPtr, true));
        const tv_nsec = Number(dataView.getBigInt64(timeoutPtr + 8, true));
        if (tv_sec < 0 || tv_sec === 0 && tv_nsec <= 0) {
          this.completeChannelRaw(channel, -ETIMEDOUT, ETIMEDOUT);
          this.relistenChannel(channel);
          return;
        }
        timeoutMs = tv_sec * 1e3 + Math.ceil(tv_nsec / 1e6);
        if (timeoutMs <= 0) timeoutMs = 1;
        if (timeoutMs > 2147483647) timeoutMs = 2147483647;
      }
      const waitResult = Atomics.waitAsync(i32View, index, val);
      if (waitResult.async) {
        let settled = false;
        let timer;
        const complete = (retVal, errVal) => {
          if (settled) return;
          settled = true;
          if (timer !== void 0) clearTimeout(timer);
          this.pendingFutexWaits.delete(channel.channelOffset);
          if (!this.processes.has(channel.pid)) return;
          this.completeChannelRaw(channel, retVal, errVal);
          channel.consecutiveSyscalls = 0;
          this.relistenChannel(channel);
        };
        this.pendingFutexWaits.set(channel.channelOffset, { channel, futexIndex: index });
        waitResult.value.then(() => {
          complete(0, 0);
        });
        if (timeoutMs !== void 0) {
          timer = setTimeout(() => {
            Atomics.notify(i32View, index, 1);
            complete(-ETIMEDOUT, ETIMEDOUT);
          }, timeoutMs);
        }
      } else {
        this.completeChannelRaw(channel, 0, 0);
        this.relistenChannel(channel);
      }
      return;
    }
    if (baseOp === FUTEX_WAKE || baseOp === FUTEX_WAKE_BITSET) {
      const woken = Atomics.notify(i32View, index, val);
      this.completeChannelRaw(channel, woken, 0);
      this.relistenChannel(channel);
      return;
    }
    if (baseOp === FUTEX_REQUEUE || baseOp === FUTEX_CMP_REQUEUE) {
      const val2 = origArgs[3];
      const woken = Atomics.notify(i32View, index, val + val2);
      this.completeChannelRaw(channel, woken, 0);
      this.relistenChannel(channel);
      return;
    }
    if (baseOp === FUTEX_WAKE_OP) {
      const val2 = origArgs[3];
      const uaddr2 = origArgs[4];
      const index2 = uaddr2 >>> 2;
      let woken = Atomics.notify(i32View, index, val);
      woken += Atomics.notify(i32View, index2, val2);
      this.completeChannelRaw(channel, woken, 0);
      this.relistenChannel(channel);
      return;
    }
    this.completeChannelRaw(channel, -38, 38);
    this.relistenChannel(channel);
  }
  /**
   * Notify the kernel that a thread has exited.
   * Removes thread state from the process's thread table.
   */
  notifyThreadExit(pid, tid) {
    if (!this.kernelInstance) return;
    const threadExit = this.kernelInstance.exports.kernel_thread_exit;
    if (threadExit) {
      threadExit(pid, tid);
    }
  }
  /**
   * Queue a signal on a target process in the kernel by invoking SYS_KILL
   * through kernel_handle_channel. The signal is queued in the kernel's
   * ProcessTable and will be delivered via dequeueSignalForDelivery on the
   * target process's next syscall completion.
   */
  sendSignalToProcess(targetPid, signum) {
    if (!this.kernelInstance || !this.kernelMemory) return;
    if (!this.processes.has(targetPid)) return;
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    kernelView.setUint32(CH_SYSCALL, SYS_KILL, true);
    kernelView.setBigInt64(CH_ARGS, BigInt(targetPid), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(signum), true);
    for (let i = 2; i < CH_ARGS_COUNT; i++) {
      kernelView.setBigInt64(CH_ARGS + i * CH_ARG_SIZE, 0n, true);
    }
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = targetPid;
    const setTid = this.kernelInstance.exports.kernel_set_current_tid;
    if (setTid) setTid(0);
    try {
      handleChannel(BigInt(this.scratchOffset), targetPid);
    } catch (err) {
      console.error(`[sendSignalToProcess] kernel threw for pid=${targetPid} sig=${signum}: ${err}`);
    } finally {
      this.currentHandlePid = 0;
    }
    const isBlocked = this.kernelInstance.exports.kernel_is_signal_blocked(targetPid, signum);
    if (isBlocked) return;
    const pendingSleep = this.pendingSleeps.get(targetPid);
    if (pendingSleep) {
      clearTimeout(pendingSleep.timer);
      this.pendingSleeps.delete(targetPid);
      this.completeSleepWithSignalCheck(
        pendingSleep.channel,
        pendingSleep.syscallNr,
        pendingSleep.origArgs,
        pendingSleep.retVal,
        pendingSleep.errVal
      );
    }
    for (const [key, pollEntry] of this.pendingPollRetries) {
      if (pollEntry.channel.pid !== targetPid) continue;
      if (pollEntry.timer) clearTimeout(pollEntry.timer);
      this.pendingPollRetries.delete(key);
      if (this.processes.has(targetPid)) {
        this.retrySyscall(pollEntry.channel);
      }
    }
    const selectEntry = this.pendingSelectRetries.get(targetPid);
    if (selectEntry) {
      clearImmediate(selectEntry.timer);
      this.pendingSelectRetries.delete(targetPid);
      if (this.processes.has(targetPid)) {
        this.handlePselect6(selectEntry.channel, selectEntry.origArgs);
      }
    }
  }
  // -----------------------------------------------------------------------
  // Process memory management
  //
  // In centralized mode, the kernel's ensure_memory_covers() grows the
  // KERNEL's Wasm memory (memory index 0 in the kernel module). But the
  // process runs in a different WebAssembly.Memory. After brk/mmap/mremap
  // syscalls, we must grow the process's memory to cover the returned
  // addresses — otherwise the process gets "memory access out of bounds".
  // -----------------------------------------------------------------------
  ensureProcessMemoryCovers(processMemory, syscallNr, retVal, origArgs) {
    let endAddr = 0;
    let mmapAddr = 0;
    let mmapLen = 0;
    if (syscallNr === SYS_BRK) {
      if (retVal >= 0) endAddr = retVal;
    } else if (syscallNr === SYS_MMAP) {
      if (retVal >= 0) {
        mmapAddr = retVal;
        mmapLen = origArgs[1];
        endAddr = mmapAddr + mmapLen;
      }
    } else if (syscallNr === SYS_MREMAP) {
      if (retVal >= 0) {
        mmapAddr = retVal;
        mmapLen = origArgs[2];
        endAddr = mmapAddr + mmapLen;
      }
    }
    const currentBytes = processMemory.buffer.byteLength;
    if (endAddr > 0 && endAddr > currentBytes) {
      const neededPages = Math.ceil((endAddr - currentBytes) / 65536);
      processMemory.grow(neededPages);
      this.kernel.framebuffers.rebindMemory(this.currentHandlePid);
    }
    if (mmapLen > 0) {
      const PAGE_SIZE = 65536;
      const alignedLen = Math.ceil(mmapLen / PAGE_SIZE) * PAGE_SIZE;
      const newBytes = processMemory.buffer.byteLength;
      const zeroEnd = Math.min(mmapAddr + alignedLen, newBytes);
      if (mmapAddr < zeroEnd) {
        new Uint8Array(processMemory.buffer, mmapAddr, zeroEnd - mmapAddr).fill(0);
      }
    }
  }
  /**
   * Populate a file-backed mmap region by reading from the file fd via pread.
   * Called after the kernel allocates the anonymous region and the host zeroes it.
   * Reads in CH_DATA_SIZE chunks using the kernel's pread handler.
   */
  populateMmapFromFile(channel, mmapAddr, origArgs) {
    const fd = origArgs[4];
    const mapLen = origArgs[1];
    const pageOffset = origArgs[5];
    let fileOffset = pageOffset * 4096;
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const kernelMem = new Uint8Array(this.kernelMemory.buffer);
    const dataStart = this.scratchOffset + CH_DATA;
    let written = 0;
    while (written < mapLen) {
      const chunkSize = Math.min(CH_DATA_SIZE, mapLen - written);
      kernelView.setUint32(CH_SYSCALL, SYS_PREAD, true);
      kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(fd), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(chunkSize), true);
      kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(fileOffset & 4294967295), true);
      kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(Math.floor(fileOffset / 4294967296) | 0), true);
      kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } catch {
        break;
      }
      this.currentHandlePid = 0;
      const bytesRead = Number(kernelView.getBigInt64(CH_RETURN, true));
      if (bytesRead <= 0) break;
      const processMem = new Uint8Array(channel.memory.buffer);
      processMem.set(
        kernelMem.subarray(dataStart, dataStart + bytesRead),
        mmapAddr + written
      );
      written += bytesRead;
      fileOffset += bytesRead;
      if (bytesRead < chunkSize) break;
    }
  }
  /**
   * Flush MAP_SHARED regions that overlap the msync range back to the file.
   * Reads from process memory and writes to the file via pwrite.
   */
  flushSharedMappings(channel, origArgs) {
    const syncAddr = origArgs[0] >>> 0;
    const syncLen = origArgs[1] >>> 0;
    const pidMap = this.sharedMappings.get(channel.pid);
    if (!pidMap || pidMap.size === 0) return;
    const syncEnd = syncAddr + syncLen;
    for (const [mapAddr, mapping] of pidMap) {
      const mapEnd = mapAddr + mapping.len;
      if (mapAddr >= syncEnd || mapEnd <= syncAddr) continue;
      const flushStart = Math.max(syncAddr, mapAddr);
      const flushEnd = Math.min(syncEnd, mapEnd);
      const flushLen = flushEnd - flushStart;
      if (flushLen <= 0) continue;
      const fileOffsetBase = mapping.fileOffset + (flushStart - mapAddr);
      this.pwriteFromProcessMemory(
        channel,
        mapping.fd,
        flushStart,
        flushLen,
        fileOffsetBase
      );
    }
  }
  /**
   * Write data from process memory to a file via kernel pwrite syscalls.
   */
  pwriteFromProcessMemory(channel, fd, processAddr, len, fileOffset) {
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const kernelMem = new Uint8Array(this.kernelMemory.buffer);
    const dataStart = this.scratchOffset + CH_DATA;
    let written = 0;
    while (written < len) {
      const chunkSize = Math.min(CH_DATA_SIZE, len - written);
      const processMem = new Uint8Array(channel.memory.buffer);
      kernelMem.set(
        processMem.subarray(processAddr + written, processAddr + written + chunkSize),
        dataStart
      );
      const curOffset = fileOffset + written;
      kernelView.setUint32(CH_SYSCALL, SYS_PWRITE, true);
      kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(fd), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(chunkSize), true);
      kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(curOffset & 4294967295), true);
      kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(Math.floor(curOffset / 4294967296) | 0), true);
      kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } catch {
        break;
      }
      this.currentHandlePid = 0;
      const bytesWritten = Number(kernelView.getBigInt64(CH_RETURN, true));
      if (bytesWritten <= 0) break;
      written += bytesWritten;
      if (bytesWritten < chunkSize) break;
    }
  }
  /**
   * Remove shared mapping entries that overlap the munmap range.
   */
  cleanupSharedMappings(pid, addr, len) {
    const pidMap = this.sharedMappings.get(pid);
    if (!pidMap) return;
    const unmapEnd = addr + len;
    for (const [mapAddr, mapping] of pidMap) {
      const mapEnd = mapAddr + mapping.len;
      if (mapAddr >= addr && mapEnd <= unmapEnd) {
        pidMap.delete(mapAddr);
      }
    }
    if (pidMap.size === 0) {
      this.sharedMappings.delete(pid);
    }
  }
  /** Set the next child PID to allocate. */
  setNextChildPid(pid) {
    this.nextChildPid = pid;
  }
  /**
   * Set the mmap address space ceiling for a process.
   * Must be called before the process worker starts to prevent mmap
   * from allocating in the thread channel/TLS region.
   */
  setMaxAddr(pid, maxAddr) {
    const setMaxAddrFn = this.kernelInstance.exports.kernel_set_max_addr;
    if (setMaxAddrFn) {
      setMaxAddrFn(pid, BigInt(maxAddr));
    }
  }
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
  setBrkBase(pid, addr) {
    const setBrkBaseFn = this.kernelInstance.exports.kernel_set_brk_base;
    if (setBrkBaseFn) {
      setBrkBaseFn(pid, typeof addr === "bigint" ? addr : BigInt(addr));
    }
  }
  /** Get the underlying kernel instance for direct access. */
  getKernel() {
    return this.kernel;
  }
  /**
   * Live `/dev/fb0` mappings reported by the kernel, indexed by pid.
   * Renderers (canvas in browser, no-op in Node) read from this on
   * each frame; the kernel populates it via the `host_bind_framebuffer`
   * import.
   */
  get framebuffers() {
    return this.kernel.framebuffers;
  }
  /**
   * Return the wasm `Memory` for `pid` (or `undefined` if no such
   * process is registered). Renderers use this to build typed-array
   * views over the bound framebuffer region.
   */
  getProcessMemory(pid) {
    return this.processes.get(pid)?.memory;
  }
  /** Get the kernel Wasm instance. */
  getKernelInstance() {
    return this.kernelInstance;
  }
  /**
   * ABI version the kernel advertised at startup via its
   * `__abi_version` export. Worker processes compare against this
   * and refuse to run programs built against an incompatible ABI.
   */
  getKernelAbiVersion() {
    return this.kernelAbiVersion;
  }
  // ---------------------------------------------------------------------------
  // TCP bridge — injects real TCP connections into kernel pipe-buffer sockets
  // ---------------------------------------------------------------------------
  /**
   * Start a TCP server for a listening socket, bridging real TCP connections
   * into the kernel's pipe-buffer-backed accept path.
   */
  startTcpListener(pid, fd, port) {
    const key = `${pid}:${fd}`;
    if (this.tcpListeners.has(key)) return;
    if (!this.tcpListenerTargets.has(port)) {
      this.tcpListenerTargets.set(port, []);
      this.tcpListenerRRIndex.set(port, 0);
    }
    const targets = this.tcpListenerTargets.get(port);
    if (!targets.some((t) => t.pid === pid && t.fd === fd)) {
      targets.push({ pid, fd });
    }
    if (!this.netModule) return;
    for (const [, listener] of this.tcpListeners) {
      if (listener.port === port) {
        this.tcpListeners.set(key, listener);
        return;
      }
    }
    const net2 = this.netModule;
    const connections = /* @__PURE__ */ new Set();
    const server = net2.createServer((clientSocket) => {
      const target = this.pickListenerTarget(port);
      if (target) {
        this.handleIncomingTcpConnection(target.pid, target.fd, clientSocket, connections);
      } else {
        clientSocket.destroy();
      }
    });
    server.listen(port, "0.0.0.0", () => {
    });
    server.on("error", (err) => {
      console.error(`TCP listener error on port ${port}:`, err);
    });
    this.tcpListeners.set(key, { server, pid, port, connections });
  }
  /**
   * Pick the next listener target for a port via round-robin.
   * Only considers processes that are still registered.
   */
  pickListenerTarget(port) {
    const targets = this.tcpListenerTargets.get(port);
    if (!targets || targets.length === 0) return null;
    const alive = targets.filter((t) => this.processes.has(t.pid));
    if (alive.length === 0) return null;
    if (alive.length !== targets.length) {
      this.tcpListenerTargets.set(port, alive);
    }
    let candidates = alive;
    if (alive.length > 1) {
      const children = alive.filter((t) => this.childToParent.has(t.pid));
      if (children.length > 0) {
        candidates = children;
      }
    }
    const idx = (this.tcpListenerRRIndex.get(port) ?? 0) % candidates.length;
    this.tcpListenerRRIndex.set(port, idx + 1);
    return candidates[idx];
  }
  /**
   * Handle an incoming TCP connection: inject it into the kernel's listening
   * socket's backlog and pump data between the real socket and kernel pipes.
   */
  handleIncomingTcpConnection(pid, listenerFd, clientSocket, connections) {
    connections.add(clientSocket);
    const remoteAddr = clientSocket.remoteAddress || "127.0.0.1";
    const remotePort = clientSocket.remotePort || 0;
    const parts = remoteAddr.replace("::ffff:", "").split(".").map(Number);
    const addrA = parts[0] || 127;
    const addrB = parts[1] || 0;
    const addrC = parts[2] || 0;
    const addrD = parts[3] || 1;
    const injectConnection = this.kernelInstance.exports.kernel_inject_connection;
    const recvPipeIdx = injectConnection(pid, listenerFd, addrA, addrB, addrC, addrD, remotePort);
    if (recvPipeIdx < 0) {
      clientSocket.destroy();
      connections.delete(clientSocket);
      return;
    }
    this.scheduleWakeBlockedRetries();
    const sendPipeIdx = recvPipeIdx + 1;
    const GLOBAL_PIPE_PID = 0;
    const pipeWrite = this.kernelInstance.exports.kernel_pipe_write;
    const pipeRead = this.kernelInstance.exports.kernel_pipe_read;
    const pipeCloseWrite = this.kernelInstance.exports.kernel_pipe_close_write;
    const pipeCloseRead = this.kernelInstance.exports.kernel_pipe_close_read;
    const pipeIsReadOpen = this.kernelInstance.exports.kernel_pipe_is_read_open;
    const inboundQueue = [];
    let clientEnded = false;
    let pumpPending = false;
    let cleaned = false;
    const scratchOffset = this.tcpScratchOffset;
    const pipeIsWriteOpen = this.kernelInstance.exports.kernel_pipe_is_write_open;
    const drainInbound = () => {
      const mem = this.getKernelMem();
      while (inboundQueue.length > 0) {
        const chunk = inboundQueue[0];
        const toWrite = Math.min(chunk.length, 65536);
        mem.set(chunk.subarray(0, toWrite), scratchOffset);
        const written = pipeWrite(GLOBAL_PIPE_PID, recvPipeIdx, BigInt(scratchOffset), toWrite);
        if (written <= 0) break;
        if (written >= chunk.length) {
          inboundQueue.shift();
        } else {
          inboundQueue[0] = chunk.subarray(written);
        }
      }
      if (clientEnded && inboundQueue.length === 0) {
        pipeCloseWrite(GLOBAL_PIPE_PID, recvPipeIdx);
      }
    };
    const drainOutbound = () => {
      const mem = this.getKernelMem();
      let totalRead = 0;
      for (; ; ) {
        const readN = pipeRead(GLOBAL_PIPE_PID, sendPipeIdx, BigInt(scratchOffset), 65536);
        if (readN <= 0) break;
        totalRead += readN;
        const outData = Buffer.from(mem.slice(scratchOffset, scratchOffset + readN));
        if (!clientSocket.destroyed) {
          clientSocket.write(outData);
        }
      }
      return totalRead;
    };
    const schedulePump = (delayMs = 0) => {
      if (pumpPending || cleaned) return;
      pumpPending = true;
      if (delayMs > 0) {
        setTimeout(pump, delayMs);
      } else {
        setImmediate(pump);
      }
    };
    const pump = () => {
      pumpPending = false;
      if (cleaned || !this.processes.has(pid)) {
        cleanup();
        return;
      }
      drainInbound();
      const readN = drainOutbound();
      const writeOpen = pipeIsWriteOpen(GLOBAL_PIPE_PID, sendPipeIdx);
      if (writeOpen === 0 && readN === 0) {
        if (!clientSocket.destroyed) {
          clientSocket.end();
        }
        cleanup();
        return;
      }
      schedulePump();
    };
    clientSocket.on("data", (chunk) => {
      inboundQueue.push(chunk);
      if (!this.processes.has(pid)) {
        cleanup();
        return;
      }
      drainInbound();
      this.wakeBlockedPoll(pid, recvPipeIdx);
      const readers = this.pendingPipeReaders.get(recvPipeIdx);
      if (readers && readers.length > 0) {
        this.pendingPipeReaders.delete(recvPipeIdx);
        for (const reader of readers) {
          if (this.processes.has(reader.pid)) {
            this.retrySyscall(reader.channel);
          }
        }
      }
      this.scheduleWakeBlockedRetries();
      schedulePump();
    });
    clientSocket.on("end", () => {
      clientEnded = true;
      schedulePump();
    });
    clientSocket.on("error", () => {
      clientEnded = true;
      clientSocket.destroy();
    });
    clientSocket.on("close", () => {
      connections.delete(clientSocket);
    });
    let conns = this.tcpConnections.get(pid);
    if (!conns) {
      conns = [];
      this.tcpConnections.set(pid, conns);
    }
    const connEntry = { sendPipeIdx, scratchOffset, clientSocket, recvPipeIdx, schedulePump };
    conns.push(connEntry);
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      pipeCloseWrite(GLOBAL_PIPE_PID, recvPipeIdx);
      pipeCloseRead(GLOBAL_PIPE_PID, sendPipeIdx);
      connections.delete(clientSocket);
      const arr = this.tcpConnections?.get(pid);
      if (arr) {
        const idx = arr.indexOf(connEntry);
        if (idx >= 0) arr.splice(idx, 1);
        if (arr.length === 0) this.tcpConnections?.delete(pid);
      }
      if (!clientSocket.destroyed) {
        clientSocket.destroy();
      }
    };
  }
  /**
   * Clean up all TCP listeners and connections for a process.
   */
  cleanupTcpListeners(pid) {
    for (const [port, targets] of this.tcpListenerTargets) {
      const filtered = targets.filter((t) => t.pid !== pid);
      if (filtered.length === 0) {
        this.tcpListenerTargets.delete(port);
        this.tcpListenerRRIndex.delete(port);
      } else {
        this.tcpListenerTargets.set(port, filtered);
      }
    }
    for (const [key, entry] of this.tcpListeners) {
      if (entry.pid === pid) {
        const hasOtherTargets = this.tcpListenerTargets.has(entry.port);
        if (!hasOtherTargets) {
          entry.server.close();
          for (const conn of entry.connections) {
            conn.destroy();
          }
          entry.connections.clear();
        }
        this.tcpListeners.delete(key);
      }
    }
    this.tcpConnections.delete(pid);
    this.shmMappings.delete(pid);
  }
  // =========================================================================
  // SysV IPC handlers — shmat/shmdt/semctl need host-side interception
  //
  // Most IPC syscalls now go through the kernel via SYSCALL_ARGS marshalling.
  // shmat/shmdt are intercepted because they require process memory management
  // (mmap address allocation, data transfer between kernel and process memory).
  // semctl is intercepted because arg[3] is cmd-dependent (scalar vs pointer).
  // =========================================================================
  /** semctl: cmd-dependent arg handling — can't use SYSCALL_ARGS since arg[3]
   *  is a scalar for some commands and a pointer for others. */
  handleSemctl(channel, origArgs) {
    const [semid, semnum, rawCmd, arg] = origArgs;
    const cmd = rawCmd & ~IPC_64;
    const IPC_STAT = 2;
    const GETALL = 13;
    const SETALL = 17;
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    const kernelMem = this.getKernelMem();
    const dataStart = this.scratchOffset + CH_DATA;
    if (cmd === IPC_STAT && arg !== 0) {
      kernelView.setUint32(CH_SYSCALL, SYS_SEMCTL, true);
      kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(semid), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(semnum), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(rawCmd), true);
      kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(0), true);
      kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
      kernelMem.fill(0, dataStart, dataStart + 72);
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal2 = Number(kernelView.getBigInt64(CH_RETURN, true));
      if (retVal2 >= 0) {
        const processMem = new Uint8Array(channel.memory.buffer);
        processMem.set(kernelMem.subarray(dataStart, dataStart + 72), arg);
      }
      this.completeChannelRaw(channel, retVal2, retVal2 < 0 ? -retVal2 : 0);
      this.relistenChannel(channel);
      return;
    }
    if (cmd === GETALL && arg !== 0) {
      const maxBytes = 1024;
      kernelView.setUint32(CH_SYSCALL, SYS_SEMCTL, true);
      kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(semid), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(semnum), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(rawCmd), true);
      kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(0), true);
      kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
      kernelMem.fill(0, dataStart, dataStart + maxBytes);
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal2 = Number(kernelView.getBigInt64(CH_RETURN, true));
      if (retVal2 >= 0) {
        const processMem = new Uint8Array(channel.memory.buffer);
        processMem.set(kernelMem.subarray(dataStart, dataStart + maxBytes), arg);
      }
      this.completeChannelRaw(channel, retVal2, retVal2 < 0 ? -retVal2 : 0);
      this.relistenChannel(channel);
      return;
    }
    if (cmd === SETALL && arg !== 0) {
      const maxBytes = 1024;
      const processMem = new Uint8Array(channel.memory.buffer);
      kernelMem.set(processMem.subarray(arg, arg + maxBytes), dataStart);
      kernelView.setUint32(CH_SYSCALL, SYS_SEMCTL, true);
      kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(semid), true);
      kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(semnum), true);
      kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(rawCmd), true);
      kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(dataStart), true);
      kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(0), true);
      kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
      this.currentHandlePid = channel.pid;
      this.bindKernelTidForChannel(channel);
      try {
        handleChannel(BigInt(this.scratchOffset), channel.pid);
      } finally {
        this.currentHandlePid = 0;
      }
      const retVal2 = Number(kernelView.getBigInt64(CH_RETURN, true));
      this.completeChannelRaw(channel, retVal2, retVal2 < 0 ? -retVal2 : 0);
      this.relistenChannel(channel);
      return;
    }
    kernelView.setUint32(CH_SYSCALL, SYS_SEMCTL, true);
    kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(semid), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(semnum), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(rawCmd), true);
    kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(arg), true);
    kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(0), true);
    kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } finally {
      this.currentHandlePid = 0;
    }
    const retVal = Number(kernelView.getBigInt64(CH_RETURN, true));
    this.completeChannelRaw(channel, retVal, retVal < 0 ? -retVal : 0);
    this.relistenChannel(channel);
  }
  /** shmat: allocate address via kernel mmap, copy segment data to process memory */
  handleIpcShmat(channel, args) {
    const [shmid, _shmaddr, _flags] = args;
    const setCurrentPid = this.kernelInstance.exports.kernel_set_current_pid;
    if (setCurrentPid) setCurrentPid(channel.pid);
    const kernelShmat = this.kernelInstance.exports.kernel_ipc_shmat;
    const sizeOrErr = kernelShmat(shmid, _shmaddr, _flags);
    if (sizeOrErr < 0) {
      this.completeChannelRaw(channel, sizeOrErr, -sizeOrErr);
      this.relistenChannel(channel);
      return;
    }
    const size = sizeOrErr;
    const kernelView = new DataView(this.kernelMemory.buffer, this.scratchOffset);
    kernelView.setUint32(CH_SYSCALL, SYS_MMAP, true);
    kernelView.setBigInt64(CH_ARGS + 0 * CH_ARG_SIZE, BigInt(0), true);
    kernelView.setBigInt64(CH_ARGS + 1 * CH_ARG_SIZE, BigInt(size), true);
    kernelView.setBigInt64(CH_ARGS + 2 * CH_ARG_SIZE, BigInt(3), true);
    kernelView.setBigInt64(CH_ARGS + 3 * CH_ARG_SIZE, BigInt(34), true);
    kernelView.setBigInt64(CH_ARGS + 4 * CH_ARG_SIZE, BigInt(-1), true);
    kernelView.setBigInt64(CH_ARGS + 5 * CH_ARG_SIZE, BigInt(0), true);
    const handleChannel = this.kernelInstance.exports.kernel_handle_channel;
    this.currentHandlePid = channel.pid;
    this.bindKernelTidForChannel(channel);
    try {
      handleChannel(BigInt(this.scratchOffset), channel.pid);
    } catch (err) {
      console.error(`[handleIpcShmat] mmap failed for pid=${channel.pid}:`, err);
      this.completeChannelRaw(channel, -12, 12);
      this.relistenChannel(channel);
      return;
    } finally {
      this.currentHandlePid = 0;
    }
    const addr = Number(kernelView.getBigInt64(CH_RETURN, true));
    if (addr < 0) {
      this.completeChannelRaw(channel, -12, 12);
      this.relistenChannel(channel);
      return;
    }
    this.ensureProcessMemoryCovers(channel.memory, SYS_MMAP, addr, [0, size, 3, 34, -1, 0]);
    const readChunk = this.kernelInstance.exports.kernel_ipc_shm_read_chunk;
    const processMem = new Uint8Array(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const chunkSize = CH_DATA_SIZE;
    const chunkPtr = this.scratchOffset + CH_DATA;
    let transferred = 0;
    while (transferred < size) {
      const remaining = size - transferred;
      const toRead = Math.min(remaining, chunkSize);
      const nRead = readChunk(shmid, transferred, BigInt(chunkPtr), toRead);
      if (nRead <= 0) break;
      processMem.set(kernelMem.subarray(chunkPtr, chunkPtr + nRead), (addr >>> 0) + transferred);
      transferred += nRead;
    }
    let pidMappings = this.shmMappings.get(channel.pid);
    if (!pidMappings) {
      pidMappings = /* @__PURE__ */ new Map();
      this.shmMappings.set(channel.pid, pidMappings);
    }
    pidMappings.set(addr >>> 0, { segId: shmid, size });
    this.completeChannelRaw(channel, addr, 0);
    this.relistenChannel(channel);
  }
  /** shmdt: copy process memory back to segment, untrack mapping */
  handleIpcShmdt(channel, args) {
    const addr = args[0];
    const pidMappings = this.shmMappings.get(channel.pid);
    if (!pidMappings) {
      this.completeChannelRaw(channel, -22, 22);
      this.relistenChannel(channel);
      return;
    }
    const mapping = pidMappings.get(addr);
    if (!mapping) {
      this.completeChannelRaw(channel, -22, 22);
      this.relistenChannel(channel);
      return;
    }
    const setCurrentPid = this.kernelInstance.exports.kernel_set_current_pid;
    if (setCurrentPid) setCurrentPid(channel.pid);
    const writeChunk = this.kernelInstance.exports.kernel_ipc_shm_write_chunk;
    const processMem = new Uint8Array(channel.memory.buffer);
    const kernelMem = this.getKernelMem();
    const chunkSize = CH_DATA_SIZE;
    const chunkPtr = this.scratchOffset + CH_DATA;
    let transferred = 0;
    while (transferred < mapping.size) {
      const remaining = mapping.size - transferred;
      const toWrite = Math.min(remaining, chunkSize);
      kernelMem.set(processMem.subarray(addr + transferred, addr + transferred + toWrite), chunkPtr);
      const nWritten = writeChunk(mapping.segId, transferred, BigInt(chunkPtr), toWrite);
      if (nWritten <= 0) break;
      transferred += nWritten;
    }
    const kernelShmdt = this.kernelInstance.exports.kernel_ipc_shmdt;
    const result = kernelShmdt(mapping.segId);
    pidMappings.delete(addr);
    if (result < 0) {
      this.completeChannelRaw(channel, result, -result);
    } else {
      this.completeChannelRaw(channel, 0, 0);
    }
    this.relistenChannel(channel);
  }
  // =========================================================================
  // POSIX mqueue notification drain
  // =========================================================================
  /**
   * After mq_timedsend, check if the kernel has a pending notification
   * (a signal to deliver when a message arrives on a previously empty queue).
   * The notification is stored in the kernel's MqueueTable and drained here.
   */
  drainMqueueNotification() {
    const drain = this.kernelInstance.exports.kernel_mq_drain_notification;
    if (!drain) return;
    const outOffset = this.scratchOffset;
    const hasPending = drain(BigInt(outOffset));
    if (hasPending) {
      const dv = new DataView(this.kernelMemory.buffer, outOffset);
      const pid = dv.getUint32(0, true);
      const signo = dv.getUint32(4, true);
      if (signo > 0) {
        this.sendSignalToProcess(pid, signo);
      }
    }
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

// src/platform/node.ts
var fs2 = __toESM(require("fs"), 1);
var os = __toESM(require("os"), 1);
var path = __toESM(require("path"), 1);

// src/vfs/host-fs.ts
var fs = __toESM(require("fs"), 1);
var nodePath = __toESM(require("path"), 1);
function translateOpenFlags(linuxFlags) {
  const L_O_WRONLY = 1;
  const L_O_RDWR = 2;
  const L_O_CREAT = 64;
  const L_O_EXCL = 128;
  const L_O_NOCTTY = 256;
  const L_O_TRUNC = 512;
  const L_O_APPEND = 1024;
  const L_O_NONBLOCK = 2048;
  const L_O_DIRECTORY = 65536;
  const L_O_NOFOLLOW = 131072;
  let native = 0;
  if (linuxFlags & L_O_RDWR) native |= fs.constants.O_RDWR;
  else if (linuxFlags & L_O_WRONLY) native |= fs.constants.O_WRONLY;
  if (linuxFlags & L_O_CREAT) native |= fs.constants.O_CREAT;
  if (linuxFlags & L_O_EXCL) native |= fs.constants.O_EXCL;
  if (linuxFlags & L_O_TRUNC) native |= fs.constants.O_TRUNC;
  if (linuxFlags & L_O_APPEND) native |= fs.constants.O_APPEND;
  if (linuxFlags & L_O_NONBLOCK) native |= fs.constants.O_NONBLOCK;
  if (linuxFlags & L_O_DIRECTORY && fs.constants.O_DIRECTORY)
    native |= fs.constants.O_DIRECTORY;
  if (linuxFlags & L_O_NOFOLLOW && fs.constants.O_NOFOLLOW)
    native |= fs.constants.O_NOFOLLOW;
  if (linuxFlags & L_O_NOCTTY && fs.constants.O_NOCTTY)
    native |= fs.constants.O_NOCTTY;
  return native;
}
var HostFileSystem = class {
  rootPath;
  fdPositions = /* @__PURE__ */ new Map();
  dirHandles = /* @__PURE__ */ new Map();
  nextDirHandle = 1;
  constructor(rootPath) {
    this.rootPath = nodePath.resolve(rootPath);
  }
  /**
   * Resolve a mount-relative path to an absolute host path,
   * ensuring it stays within `rootPath`.
   */
  safePath(relative) {
    const resolved = nodePath.resolve(
      this.rootPath,
      relative.replace(/^\//, "")
    );
    if (resolved !== this.rootPath && !resolved.startsWith(this.rootPath + "/")) {
      throw new Error("EACCES: path traversal blocked");
    }
    return resolved;
  }
  toStatResult(s) {
    return {
      dev: s.dev,
      ino: s.ino,
      mode: s.mode,
      nlink: s.nlink,
      uid: s.uid,
      gid: s.gid,
      size: s.size,
      atimeMs: s.atimeMs,
      mtimeMs: s.mtimeMs,
      ctimeMs: s.ctimeMs
    };
  }
  // ── File handle operations ───────────────────────────────────
  open(path2, flags, mode) {
    const fd = fs.openSync(
      this.safePath(path2),
      translateOpenFlags(flags),
      mode
    );
    this.fdPositions.set(fd, 0);
    return fd;
  }
  close(handle) {
    fs.closeSync(handle);
    this.fdPositions.delete(handle);
    return 0;
  }
  read(handle, buffer, offset, length) {
    const pos = offset ?? this.fdPositions.get(handle) ?? 0;
    const bytesRead = fs.readSync(handle, buffer, 0, length, pos);
    if (offset === null) {
      this.fdPositions.set(handle, pos + bytesRead);
    }
    return bytesRead;
  }
  write(handle, buffer, offset, length) {
    const pos = offset ?? this.fdPositions.get(handle) ?? 0;
    const bytesWritten = fs.writeSync(handle, buffer, 0, length, pos);
    if (offset === null) {
      this.fdPositions.set(handle, pos + bytesWritten);
    }
    return bytesWritten;
  }
  seek(handle, offset, whence) {
    let newPos;
    switch (whence) {
      case 0:
        newPos = offset;
        break;
      case 1:
        newPos = (this.fdPositions.get(handle) ?? 0) + offset;
        break;
      case 2:
        newPos = fs.fstatSync(handle).size + offset;
        break;
      default:
        throw new Error(`Invalid whence value: ${whence}`);
    }
    this.fdPositions.set(handle, newPos);
    return newPos;
  }
  fstat(handle) {
    return this.toStatResult(fs.fstatSync(handle));
  }
  ftruncate(handle, length) {
    fs.ftruncateSync(handle, length);
  }
  fsync(handle) {
    fs.fsyncSync(handle);
  }
  fchmod(handle, mode) {
    fs.fchmodSync(handle, mode);
  }
  fchown(handle, uid, gid) {
    swallowChownPermissionError(() => fs.fchownSync(handle, uid, gid));
  }
  // ── Path-based operations ───────────────────────────────────
  stat(path2) {
    return this.toStatResult(fs.statSync(this.safePath(path2)));
  }
  lstat(path2) {
    return this.toStatResult(fs.lstatSync(this.safePath(path2)));
  }
  mkdir(path2, mode) {
    fs.mkdirSync(this.safePath(path2), { mode });
  }
  rmdir(path2) {
    fs.rmdirSync(this.safePath(path2));
  }
  unlink(path2) {
    fs.unlinkSync(this.safePath(path2));
  }
  rename(oldPath, newPath) {
    fs.renameSync(this.safePath(oldPath), this.safePath(newPath));
  }
  link(existingPath, newPath) {
    fs.linkSync(this.safePath(existingPath), this.safePath(newPath));
  }
  symlink(target, path2) {
    fs.symlinkSync(target, this.safePath(path2));
  }
  readlink(path2) {
    return fs.readlinkSync(this.safePath(path2), "utf8");
  }
  chmod(path2, mode) {
    fs.chmodSync(this.safePath(path2), mode);
  }
  chown(path2, uid, gid) {
    swallowChownPermissionError(
      () => fs.chownSync(this.safePath(path2), uid, gid)
    );
  }
  access(path2, mode) {
    fs.accessSync(this.safePath(path2), mode);
  }
  utimensat(path2, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    const atime = atimeSec + atimeNsec / 1e9;
    const mtime = mtimeSec + mtimeNsec / 1e9;
    fs.utimesSync(this.safePath(path2), atime, mtime);
  }
  // ── Directory iteration ─────────────────────────────────────
  opendir(path2) {
    const dir = fs.opendirSync(this.safePath(path2));
    const handle = this.nextDirHandle++;
    this.dirHandles.set(handle, dir);
    return handle;
  }
  readdir(handle) {
    const dir = this.dirHandles.get(handle);
    if (!dir) throw new Error("Invalid dir handle");
    const entry = dir.readSync();
    if (!entry) return null;
    let dtype = 0;
    if (entry.isFile()) dtype = 8;
    else if (entry.isDirectory()) dtype = 4;
    else if (entry.isSymbolicLink()) dtype = 10;
    else if (entry.isFIFO()) dtype = 1;
    else if (entry.isSocket()) dtype = 12;
    else if (entry.isCharacterDevice()) dtype = 2;
    else if (entry.isBlockDevice()) dtype = 6;
    return { name: entry.name, type: dtype, ino: 0 };
  }
  closedir(handle) {
    const dir = this.dirHandles.get(handle);
    if (!dir) throw new Error("Invalid dir handle");
    dir.closeSync();
    this.dirHandles.delete(handle);
  }
};
function swallowChownPermissionError(op) {
  try {
    op();
  } catch (e) {
    const code = e?.code;
    if (code === "EPERM" || code === "EINVAL" || code === "ENOTSUP") {
      return;
    }
    throw e;
  }
}

// src/platform/node.ts
var NodePlatformIO = class {
  dirHandles = /* @__PURE__ */ new Map();
  nextDirHandle = 1;
  fdPositions = /* @__PURE__ */ new Map();
  // Offset from hrtime (monotonic) to epoch, computed once at startup.
  _epochOffsetNs;
  // hrtime at creation, used as process start for CPUTIME clocks.
  _startNs;
  // /dev/shm replacement directory (macOS has no /dev/shm)
  _shmDir;
  constructor() {
    const hrt = process.hrtime.bigint();
    const wallNs = BigInt(Date.now()) * 1000000n;
    this._epochOffsetNs = wallNs - hrt;
    this._startNs = hrt;
    this._shmDir = path.join(os.tmpdir(), "wasm-posix-shm");
  }
  /** Rewrite /dev/shm/ paths to a tmpdir-backed directory (macOS compat). */
  rewritePath(p) {
    if (p.startsWith("/dev/shm/") || p === "/dev/shm") {
      const rel = p.slice("/dev/shm".length);
      const target = this._shmDir + rel;
      fs2.mkdirSync(this._shmDir, { recursive: true });
      return target;
    }
    return p;
  }
  open(path2, flags, mode) {
    const fd = fs2.openSync(this.rewritePath(path2), translateOpenFlags(flags), mode);
    this.fdPositions.set(fd, 0);
    return fd;
  }
  close(handle) {
    fs2.closeSync(handle);
    this.fdPositions.delete(handle);
    return 0;
  }
  read(handle, buffer, offset, length) {
    const pos = offset ?? this.fdPositions.get(handle) ?? 0;
    const bytesRead = fs2.readSync(handle, buffer, 0, length, pos);
    if (offset === null) {
      this.fdPositions.set(handle, pos + bytesRead);
    }
    return bytesRead;
  }
  write(handle, buffer, offset, length) {
    const pos = offset ?? this.fdPositions.get(handle) ?? 0;
    const bytesWritten = fs2.writeSync(handle, buffer, 0, length, pos);
    if (offset === null) {
      this.fdPositions.set(handle, pos + bytesWritten);
    }
    return bytesWritten;
  }
  seek(handle, offset, whence) {
    let newPos;
    switch (whence) {
      case 0:
        newPos = offset;
        break;
      case 1: {
        const cur = this.fdPositions.get(handle) ?? 0;
        newPos = cur + offset;
        break;
      }
      case 2: {
        const stat = fs2.fstatSync(handle);
        newPos = stat.size + offset;
        break;
      }
      default:
        throw new Error(`Invalid whence value: ${whence}`);
    }
    this.fdPositions.set(handle, newPos);
    return newPos;
  }
  fstat(handle) {
    const stat = fs2.fstatSync(handle);
    return {
      dev: stat.dev,
      ino: stat.ino,
      mode: stat.mode,
      nlink: stat.nlink,
      uid: stat.uid,
      gid: stat.gid,
      size: stat.size,
      atimeMs: stat.atimeMs,
      mtimeMs: stat.mtimeMs,
      ctimeMs: stat.ctimeMs
    };
  }
  stat(path2) {
    const s = fs2.statSync(this.rewritePath(path2));
    return {
      dev: s.dev,
      ino: s.ino,
      mode: s.mode,
      nlink: s.nlink,
      uid: s.uid,
      gid: s.gid,
      size: s.size,
      atimeMs: s.atimeMs,
      mtimeMs: s.mtimeMs,
      ctimeMs: s.ctimeMs
    };
  }
  lstat(path2) {
    const s = fs2.lstatSync(this.rewritePath(path2));
    return {
      dev: s.dev,
      ino: s.ino,
      mode: s.mode,
      nlink: s.nlink,
      uid: s.uid,
      gid: s.gid,
      size: s.size,
      atimeMs: s.atimeMs,
      mtimeMs: s.mtimeMs,
      ctimeMs: s.ctimeMs
    };
  }
  mkdir(path2, mode) {
    fs2.mkdirSync(this.rewritePath(path2), { mode });
  }
  rmdir(path2) {
    fs2.rmdirSync(this.rewritePath(path2));
  }
  unlink(path2) {
    fs2.unlinkSync(this.rewritePath(path2));
  }
  rename(oldPath, newPath) {
    fs2.renameSync(this.rewritePath(oldPath), this.rewritePath(newPath));
  }
  link(existingPath, newPath) {
    fs2.linkSync(this.rewritePath(existingPath), this.rewritePath(newPath));
  }
  symlink(target, path2) {
    fs2.symlinkSync(target, this.rewritePath(path2));
  }
  readlink(path2) {
    return fs2.readlinkSync(this.rewritePath(path2), "utf8");
  }
  chmod(path2, mode) {
    fs2.chmodSync(this.rewritePath(path2), mode);
  }
  chown(path2, uid, gid) {
    swallowChownPermissionError2(
      () => fs2.chownSync(this.rewritePath(path2), uid, gid)
    );
  }
  access(path2, mode) {
    fs2.accessSync(this.rewritePath(path2), mode);
  }
  utimensat(path2, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    const atime = atimeSec + atimeNsec / 1e9;
    const mtime = mtimeSec + mtimeNsec / 1e9;
    fs2.utimesSync(this.rewritePath(path2), atime, mtime);
  }
  opendir(path2) {
    const dir = fs2.opendirSync(this.rewritePath(path2));
    const handle = this.nextDirHandle++;
    this.dirHandles.set(handle, dir);
    return handle;
  }
  readdir(handle) {
    const dir = this.dirHandles.get(handle);
    if (!dir) throw new Error("Invalid dir handle");
    const entry = dir.readSync();
    if (!entry) return null;
    let dtype = 0;
    if (entry.isFile()) dtype = 8;
    else if (entry.isDirectory()) dtype = 4;
    else if (entry.isSymbolicLink()) dtype = 10;
    else if (entry.isFIFO()) dtype = 1;
    else if (entry.isSocket()) dtype = 12;
    else if (entry.isCharacterDevice()) dtype = 2;
    else if (entry.isBlockDevice()) dtype = 6;
    return { name: entry.name, type: dtype, ino: 0 };
  }
  closedir(handle) {
    const dir = this.dirHandles.get(handle);
    if (!dir) throw new Error("Invalid dir handle");
    dir.closeSync();
    this.dirHandles.delete(handle);
  }
  ftruncate(handle, length) {
    fs2.ftruncateSync(handle, length);
  }
  fsync(handle) {
    fs2.fsyncSync(handle);
  }
  fchmod(handle, mode) {
    fs2.fchmodSync(handle, mode);
  }
  fchown(handle, uid, gid) {
    swallowChownPermissionError2(() => fs2.fchownSync(handle, uid, gid));
  }
  clockGettime(clockId) {
    const ns = process.hrtime.bigint();
    if (clockId === 2 || clockId === 3) {
      const elapsed = ns - this._startNs;
      return { sec: Number(elapsed / 1000000000n), nsec: Number(elapsed % 1000000000n) };
    }
    if (clockId === 1) {
      return { sec: Number(ns / 1000000000n), nsec: Number(ns % 1000000000n) };
    }
    const realNs = ns + this._epochOffsetNs;
    return { sec: Number(realNs / 1000000000n), nsec: Number(realNs % 1000000000n) };
  }
  nanosleep(sec, nsec) {
    const ms = sec * 1e3 + Math.floor(nsec / 1e6);
    if (ms > 0) {
      const sab = new SharedArrayBuffer(4);
      const arr = new Int32Array(sab);
      Atomics.wait(arr, 0, 0, ms);
    }
  }
};
function swallowChownPermissionError2(op) {
  try {
    op();
  } catch (e) {
    const code = e?.code;
    if (code === "EPERM" || code === "EINVAL" || code === "ENOTSUP") {
      return;
    }
    throw e;
  }
}

// src/worker-adapter.ts
var import_node_worker_threads = require("worker_threads");
var import_node_url = require("url");
var import_node_module = require("module");
var import_node_fs = require("fs");
var import_meta = {};
var MockWorkerHandle = class {
  sentMessages = [];
  messageHandlers = [];
  errorHandlers = [];
  exitHandlers = [];
  postMessage(message) {
    this.sentMessages.push(message);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, handler) {
    switch (event) {
      case "message":
        this.messageHandlers.push(handler);
        break;
      case "error":
        this.errorHandlers.push(handler);
        break;
      case "exit":
        this.exitHandlers.push(handler);
        break;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event, handler) {
    switch (event) {
      case "message": {
        const idx = this.messageHandlers.indexOf(handler);
        if (idx >= 0) this.messageHandlers.splice(idx, 1);
        break;
      }
      case "error": {
        const idx = this.errorHandlers.indexOf(handler);
        if (idx >= 0) this.errorHandlers.splice(idx, 1);
        break;
      }
      case "exit": {
        const idx = this.exitHandlers.indexOf(handler);
        if (idx >= 0) this.exitHandlers.splice(idx, 1);
        break;
      }
    }
  }
  async terminate() {
    return 0;
  }
  // --- Test helpers ---
  simulateMessage(msg) {
    for (const h of this.messageHandlers) h(msg);
  }
  simulateError(err) {
    for (const h of this.errorHandlers) h(err);
  }
  simulateExit(code) {
    for (const h of this.exitHandlers) h(code);
  }
};
var MockWorkerAdapter = class {
  lastWorker = null;
  lastWorkerData = null;
  allWorkers = [];
  createWorker(workerData) {
    const handle = new MockWorkerHandle();
    this.lastWorker = handle;
    this.lastWorkerData = workerData;
    this.allWorkers.push(handle);
    return handle;
  }
};
var NodeWorkerAdapter = class {
  entryUrl;
  _compiledEntry;
  constructor(entryUrl) {
    this.entryUrl = entryUrl ?? new URL("./worker-entry.ts", import_meta.url);
  }
  /**
   * Try to find a compiled .js version of the entry file.
   * Checks: ../dist/<basename>.js (tsup output), then sibling .js.
   */
  resolveCompiledEntry() {
    if (this._compiledEntry !== void 0) {
      return this._compiledEntry || null;
    }
    if (this.entryUrl.protocol !== "file:") {
      this._compiledEntry = false;
      return null;
    }
    const href = this.entryUrl.href;
    const distUrl = new URL(href.replace(/\/src\/([^/]+)\.ts$/, "/dist/$1.js"));
    if (distUrl.href !== href && (0, import_node_fs.existsSync)(distUrl)) {
      this._compiledEntry = distUrl;
      return distUrl;
    }
    const jsUrl = new URL(href.replace(/\.ts$/, ".js"));
    if (jsUrl.href !== href && (0, import_node_fs.existsSync)(jsUrl)) {
      this._compiledEntry = jsUrl;
      return jsUrl;
    }
    this._compiledEntry = false;
    return null;
  }
  createWorker(workerData) {
    const compiledEntry = this.resolveCompiledEntry();
    if (compiledEntry) {
      const worker2 = new import_node_worker_threads.Worker(compiledEntry, { workerData });
      return new NodeWorkerHandle(worker2);
    }
    const require2 = (0, import_node_module.createRequire)(import_meta.url);
    const tsxApiPath = require2.resolve("tsx/esm/api");
    const tsxApiUrl = (0, import_node_url.pathToFileURL)(tsxApiPath).href;
    const entryUrl = this.entryUrl.href;
    const bootstrap = [
      `import { register } from '${tsxApiUrl}';`,
      `register();`,
      `await import('${entryUrl}');`
    ].join("\n");
    const worker = new import_node_worker_threads.Worker(bootstrap, {
      eval: true,
      workerData
    });
    return new NodeWorkerHandle(worker);
  }
};
var NodeWorkerHandle = class {
  constructor(worker) {
    this.worker = worker;
  }
  postMessage(message, transfer) {
    if (transfer) {
      this.worker.postMessage(
        message,
        transfer
      );
    } else {
      this.worker.postMessage(message);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event, handler) {
    this.worker.on(event, handler);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event, handler) {
    this.worker.off(event, handler);
  }
  async terminate() {
    return this.worker.terminate();
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
  const module2 = new WebAssembly.Module(wasmBytes);
  const instance = new WebAssembly.Instance(module2, imports);
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
async function loadSharedLibrary(name, wasmBytes, options) {
  const existing = options.loadedLibraries.get(name);
  if (existing) return existing;
  const metadata = parseDylinkSection(wasmBytes);
  if (!metadata) {
    throw new Error(`${name}: not a shared library (no dylink.0 section)`);
  }
  for (const dep of metadata.neededDynlibs) {
    if (options.loadedLibraries.has(dep)) continue;
    if (!options.resolveLibrary) {
      throw new Error(`${name}: depends on ${dep} but no resolveLibrary callback provided`);
    }
    const depBytes = await options.resolveLibrary(dep);
    if (!depBytes) {
      throw new Error(`${name}: dependency ${dep} not found`);
    }
    await loadSharedLibrary(dep, depBytes, options);
  }
  return instantiateSharedLibrary(name, wasmBytes, metadata, options);
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
      const CH_ARG_SIZE3 = 8;
      const CH_RETURN3 = 56;
      const CH_ERRNO3 = 64;
      const CH_DATA3 = 72;
      const view = new DataView(memory.buffer);
      const base = channelOffset;
      view.setInt32(base + 4, SYS_CLONE_NR, true);
      view.setBigInt64(base + 8 + 0 * CH_ARG_SIZE3, BigInt(flags), true);
      view.setBigInt64(base + 8 + 1 * CH_ARG_SIZE3, BigInt(stackPtr), true);
      view.setBigInt64(base + 8 + 2 * CH_ARG_SIZE3, BigInt(ptidPtr), true);
      view.setBigInt64(base + 8 + 3 * CH_ARG_SIZE3, BigInt(tlsPtr), true);
      view.setBigInt64(base + 8 + 4 * CH_ARG_SIZE3, BigInt(ctidPtr), true);
      view.setBigInt64(base + 8 + 5 * CH_ARG_SIZE3, 0n, true);
      view.setUint32(base + CH_DATA3, n(fnPtr), true);
      view.setUint32(base + CH_DATA3 + 4, n(arg), true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.store(i32, base / 4, 1);
      Atomics.notify(i32, base / 4, 1);
      while (Atomics.wait(i32, base / 4, 1) === "ok") {
      }
      const result = Number(view.getBigInt64(base + CH_RETURN3, true));
      const err = view.getUint32(base + CH_ERRNO3, true);
      Atomics.store(i32, base / 4, 0);
      if (err) return -err;
      return result;
    },
    // Fork dispatches through channel (SYS_FORK)
    kernel_fork: () => {
      const SYS_FORK_NR = 212;
      const CH_ARG_SIZE3 = 8;
      const CH_RETURN3 = 56;
      const CH_ERRNO3 = 64;
      const view = new DataView(memory.buffer);
      const base = channelOffset;
      view.setInt32(base + 4, SYS_FORK_NR, true);
      for (let i = 0; i < 6; i++) view.setBigInt64(base + 8 + i * CH_ARG_SIZE3, 0n, true);
      const i32 = new Int32Array(memory.buffer);
      Atomics.store(i32, base / 4, 1);
      Atomics.notify(i32, base / 4, 1);
      while (Atomics.wait(i32, base / 4, 1) === "ok") {
      }
      const result = Number(view.getBigInt64(base + CH_RETURN3, true));
      const err = view.getUint32(base + CH_ERRNO3, true);
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
function buildImportObject(module2, memory, kernelImports, channelOffset, dlopenImports, getInstance, ptrWidth = 4) {
  const envImports = { memory };
  const n = (v) => typeof v === "bigint" ? Number(v) : v;
  const retPtr = (v) => ptrWidth === 8 ? BigInt(v) : v;
  const moduleImports = WebAssembly.Module.imports(module2);
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
  for (const imp of WebAssembly.Module.imports(module2)) {
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
    const module2 = initData.programModule ? initData.programModule : await WebAssembly.compile(programBytes);
    if (isWasiModule(module2)) {
      if (wasiModuleDefinesMemory(module2)) {
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
      const moduleImports = WebAssembly.Module.imports(module2);
      for (const imp of moduleImports) {
        if (imp.module === "env" && imp.name !== "memory") {
          if (!importObject.env[imp.name]) {
            importObject.env[imp.name] = imp.kind === "function" ? (..._args) => {
              throw new Error(`Unimplemented WASI env import: ${imp.name}`);
            } : void 0;
          }
        }
      }
      const instance = await WebAssembly.instantiate(module2, importObject);
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
    const moduleExports = WebAssembly.Module.exports(module2);
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
        module2,
        memory,
        kernelImports,
        channelOffset,
        dlopenImports,
        () => processInstance ?? void 0,
        ptrWidth
      );
      const instance = await WebAssembly.instantiate(module2, importObject);
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
      setupChannelBase(instance, module2, memory, channelOffset, programBytes, ptrWidth);
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
        module2,
        memory,
        kernelImports,
        channelOffset,
        dlopenImports,
        () => processInstance ?? void 0,
        ptrWidth
      );
      const instance = await WebAssembly.instantiate(module2, importObject);
      processInstance = instance;
      verifyProgramAbi(instance, initData.kernelAbiVersion, pid);
      setupChannelBase(instance, module2, memory, channelOffset, programBytes, ptrWidth);
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
function setupChannelBase(instance, module2, memory, channelOffset, programBytes, ptrWidth = 4) {
  const moduleImports = WebAssembly.Module.imports(module2);
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
  const CH_SYSCALL3 = 4;
  const CH_ARGS3 = 8;
  const CH_ARG_SIZE3 = 8;
  const CH_RETURN3 = 56;
  const CH_ERRNO3 = 64;
  const view = new DataView(memory.buffer);
  view.setInt32(channelOffset + CH_SYSCALL3, SYS_FORK_NR, true);
  for (let i = 0; i < 6; i++) {
    view.setBigInt64(channelOffset + CH_ARGS3 + i * CH_ARG_SIZE3, 0n, true);
  }
  const i32 = new Int32Array(memory.buffer);
  Atomics.store(i32, channelOffset / 4, 1);
  Atomics.notify(i32, channelOffset / 4, 1);
  while (Atomics.wait(i32, channelOffset / 4, 1) === "ok") {
  }
  const result = Number(view.getBigInt64(channelOffset + CH_RETURN3, true));
  const err = view.getUint32(channelOffset + CH_ERRNO3, true);
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
    const module2 = initData.programModule ? initData.programModule : new WebAssembly.Module(programBytes);
    const kernelImports = buildKernelImports(memory, channelOffset);
    const importObject = buildImportObject(
      module2,
      memory,
      kernelImports,
      channelOffset,
      void 0,
      () => threadInstance,
      ptrWidth
    );
    const instance = new WebAssembly.Instance(module2, importObject);
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

// src/networking/tcp-backend.ts
var net = __toESM(require("net"), 1);
var import_dns = require("dns");
var TcpNetworkBackend = class {
  connections = /* @__PURE__ */ new Map();
  connect(handle, addr, port) {
    const ip = `${addr[0]}.${addr[1]}.${addr[2]}.${addr[3]}`;
    const socket = new net.Socket();
    const conn = {
      socket,
      recvBuf: Buffer.alloc(0),
      connected: false,
      error: null,
      closed: false
    };
    socket.on("data", (data) => {
      conn.recvBuf = Buffer.concat([conn.recvBuf, data]);
    });
    socket.on("error", (err) => {
      conn.error = err;
    });
    socket.on("close", () => {
      conn.closed = true;
    });
    const sab = new SharedArrayBuffer(4);
    const flag = new Int32Array(sab);
    socket.connect(port, ip, () => {
      conn.connected = true;
      Atomics.store(flag, 0, 1);
      Atomics.notify(flag, 0);
    });
    socket.on("error", () => {
      Atomics.store(flag, 0, -1);
      Atomics.notify(flag, 0);
    });
    Atomics.wait(flag, 0, 0, 3e4);
    if (flag[0] !== 1) {
      socket.destroy();
      const errMsg = conn.error?.message ?? "";
      if (errMsg.includes("ECONNREFUSED")) {
        throw Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" });
      }
      if (errMsg.includes("ETIMEDOUT") || flag[0] === 0) {
        throw Object.assign(new Error("ETIMEDOUT"), { code: "ETIMEDOUT" });
      }
      throw conn.error ?? new Error("Connection failed");
    }
    this.connections.set(handle, conn);
  }
  send(handle, data, _flags) {
    const conn = this.connections.get(handle);
    if (!conn || !conn.connected) throw new Error("ENOTCONN");
    conn.socket.write(data);
    return data.length;
  }
  recv(handle, maxLen, _flags) {
    const conn = this.connections.get(handle);
    if (!conn) throw new Error("ENOTCONN");
    const sab = new SharedArrayBuffer(4);
    const flag = new Int32Array(sab);
    if (conn.recvBuf.length === 0 && !conn.closed) {
      const onData = () => {
        Atomics.store(flag, 0, 1);
        Atomics.notify(flag, 0);
      };
      const onClose = () => {
        Atomics.store(flag, 0, 1);
        Atomics.notify(flag, 0);
      };
      conn.socket.once("data", onData);
      conn.socket.once("close", onClose);
      if (conn.recvBuf.length === 0 && !conn.closed) {
        Atomics.wait(flag, 0, 0, 3e4);
      }
      conn.socket.removeListener("data", onData);
      conn.socket.removeListener("close", onClose);
    }
    const len = Math.min(maxLen, conn.recvBuf.length);
    if (len === 0) return new Uint8Array(0);
    const result = new Uint8Array(conn.recvBuf.buffer, conn.recvBuf.byteOffset, len);
    conn.recvBuf = conn.recvBuf.subarray(len);
    return result;
  }
  close(handle) {
    const conn = this.connections.get(handle);
    if (conn) {
      conn.socket.destroy();
      this.connections.delete(handle);
    }
  }
  getaddrinfo(hostname) {
    const sab = new SharedArrayBuffer(8);
    const flag = new Int32Array(sab);
    const result = new Uint8Array(4);
    (0, import_dns.lookup)(hostname, 4, (err, address) => {
      if (err || !address) {
        Atomics.store(flag, 0, -1);
      } else {
        const parts = address.split(".").map(Number);
        result[0] = parts[0];
        result[1] = parts[1];
        result[2] = parts[2];
        result[3] = parts[3];
        Atomics.store(flag, 0, 1);
      }
      Atomics.notify(flag, 0);
    });
    Atomics.wait(flag, 0, 0, 1e4);
    if (flag[0] !== 1) throw new Error("DNS resolution failed");
    return result;
  }
};

// src/networking/fetch-backend.ts
var EagainError = class extends Error {
  errno = 11;
  constructor() {
    super("EAGAIN");
  }
};
var FetchNetworkBackend = class {
  connections = /* @__PURE__ */ new Map();
  hostnameMap = /* @__PURE__ */ new Map();
  // ip string → hostname
  options;
  constructor(options) {
    this.options = options ?? {};
  }
  connect(handle, addr, port) {
    const ipStr = `${addr[0]}.${addr[1]}.${addr[2]}.${addr[3]}`;
    const hostname = this.hostnameMap.get(ipStr) || ipStr;
    this.connections.set(handle, {
      hostname,
      ip: new Uint8Array(addr),
      port,
      sendBuf: new Uint8Array(0),
      responseBuf: null,
      responseOffset: 0,
      fetchDone: false,
      fetchError: null
    });
  }
  send(handle, data, _flags) {
    const conn = this.connections.get(handle);
    if (!conn) throw new Error("ENOTCONN");
    const newBuf = new Uint8Array(conn.sendBuf.length + data.length);
    newBuf.set(conn.sendBuf);
    newBuf.set(data, conn.sendBuf.length);
    conn.sendBuf = newBuf;
    const headerEnd = findHeaderEnd(conn.sendBuf);
    if (headerEnd === -1) {
      return data.length;
    }
    const headerStr = new TextDecoder().decode(conn.sendBuf.subarray(0, headerEnd));
    const contentLength = parseContentLength(headerStr);
    const bodyStart = headerEnd + 4;
    const bodyReceived = conn.sendBuf.length - bodyStart;
    if (contentLength > 0 && bodyReceived < contentLength) {
      return data.length;
    }
    const { method, path: path2, headers, body } = parseHttpRequest(conn.sendBuf, headerEnd);
    const hostHeader = headers.get("host");
    const scheme = conn.port === 443 ? "https" : "http";
    const portSuffix = conn.port === 80 || conn.port === 443 ? "" : `:${conn.port}`;
    const host = hostHeader ? hostHeader : `${conn.hostname}${portSuffix}`;
    const url = `${scheme}://${host}${path2}`;
    const fetchHeaders = new Headers();
    for (const [key, value] of headers) {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "connection") {
        fetchHeaders.set(key, value);
      }
    }
    const fetchBody = body && body.length > 0 ? new Uint8Array(body) : void 0;
    const doFetch = async () => {
      try {
        let response;
        try {
          response = await fetch(url, {
            method,
            headers: fetchHeaders,
            body: fetchBody
          });
        } catch (e) {
          if (this.options.corsProxyUrl) {
            response = await fetch(`${this.options.corsProxyUrl}${url}`, {
              method,
              headers: fetchHeaders,
              body: fetchBody
            });
          } else {
            throw e;
          }
        }
        conn.responseBuf = formatHttpResponse(response.status, response.statusText, response.headers, await response.arrayBuffer());
        conn.fetchDone = true;
      } catch (e) {
        conn.fetchError = e;
        conn.fetchDone = true;
      }
    };
    conn.fetchDone = false;
    conn.responseBuf = null;
    conn.responseOffset = 0;
    conn.fetchError = null;
    doFetch();
    conn.sendBuf = new Uint8Array(0);
    return data.length;
  }
  recv(handle, maxLen, _flags) {
    const conn = this.connections.get(handle);
    if (!conn) throw new Error("ENOTCONN");
    if (!conn.fetchDone) {
      throw new EagainError();
    }
    if (conn.fetchError) throw conn.fetchError;
    if (!conn.responseBuf) {
      return new Uint8Array(0);
    }
    const remaining = conn.responseBuf.length - conn.responseOffset;
    const len = Math.min(maxLen, remaining);
    if (len === 0) return new Uint8Array(0);
    const result = conn.responseBuf.slice(conn.responseOffset, conn.responseOffset + len);
    conn.responseOffset += len;
    return result;
  }
  close(handle) {
    this.connections.delete(handle);
  }
  getaddrinfo(hostname) {
    let hash = 0;
    for (let i = 0; i < hostname.length; i++) {
      hash = (hash << 5) - hash + hostname.charCodeAt(i) | 0;
    }
    const ip = new Uint8Array([10, hash >> 16 & 255, hash >> 8 & 255, hash & 255]);
    const ipStr = `${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}`;
    this.hostnameMap.set(ipStr, hostname);
    return ip;
  }
};
function findHeaderEnd(buf) {
  for (let i = 0; i <= buf.length - 4; i++) {
    if (buf[i] === 13 && buf[i + 1] === 10 && buf[i + 2] === 13 && buf[i + 3] === 10) {
      return i;
    }
  }
  return -1;
}
function parseContentLength(headers) {
  const match = headers.match(/content-length:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}
function parseHttpRequest(buf, headerEnd) {
  const headerStr = new TextDecoder().decode(buf.subarray(0, headerEnd));
  const lines = headerStr.split("\r\n");
  const [method, path2] = lines[0].split(" ");
  const headers = /* @__PURE__ */ new Map();
  for (let i = 1; i < lines.length; i++) {
    const colon = lines[i].indexOf(":");
    if (colon > 0) {
      headers.set(lines[i].substring(0, colon).trim().toLowerCase(), lines[i].substring(colon + 1).trim());
    }
  }
  const bodyStart = headerEnd + 4;
  const body = bodyStart < buf.length ? buf.subarray(bodyStart) : null;
  return { method, path: path2, headers, body };
}
var HOP_BY_HOP_HEADERS = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "content-encoding",
  "connection",
  "keep-alive"
]);
function formatHttpResponse(status, statusText, headers, body) {
  const bodyBytes = new Uint8Array(body);
  let headerStr = `HTTP/1.1 ${status} ${statusText}\r
`;
  headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headerStr += `${key}: ${value}\r
`;
    }
  });
  headerStr += `Content-Length: ${bodyBytes.length}\r
`;
  headerStr += "\r\n";
  const headerBytes = new TextEncoder().encode(headerStr);
  const result = new Uint8Array(headerBytes.length + bodyBytes.length);
  result.set(headerBytes);
  result.set(bodyBytes, headerBytes.length);
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
  resolve(path2) {
    for (const m of this.mounts) {
      if (m.prefix === "/") {
        return { backend: m.backend, relativePath: path2 };
      }
      if (path2 === m.prefix || path2.startsWith(m.prefix + "/")) {
        let rel = path2.slice(m.prefix.length);
        if (!rel.startsWith("/")) rel = "/" + rel;
        return { backend: m.backend, relativePath: rel };
      }
    }
    throw new Error(`ENOENT: no mount for path: ${path2}`);
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
  open(path2, flags, mode) {
    const { backend, relativePath } = this.resolve(path2);
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
  stat(path2) {
    const { backend, relativePath } = this.resolve(path2);
    return backend.stat(relativePath);
  }
  lstat(path2) {
    const { backend, relativePath } = this.resolve(path2);
    return backend.lstat(relativePath);
  }
  mkdir(path2, mode) {
    const { backend, relativePath } = this.resolve(path2);
    backend.mkdir(relativePath, mode);
  }
  rmdir(path2) {
    const { backend, relativePath } = this.resolve(path2);
    backend.rmdir(relativePath);
  }
  unlink(path2) {
    const { backend, relativePath } = this.resolve(path2);
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
  symlink(target, path2) {
    const { backend, relativePath } = this.resolve(path2);
    backend.symlink(target, relativePath);
  }
  readlink(path2) {
    const { backend, relativePath } = this.resolve(path2);
    return backend.readlink(relativePath);
  }
  chmod(path2, mode) {
    const { backend, relativePath } = this.resolve(path2);
    backend.chmod(relativePath, mode);
  }
  chown(path2, uid, gid) {
    const { backend, relativePath } = this.resolve(path2);
    backend.chown(relativePath, uid, gid);
  }
  access(path2, mode) {
    const { backend, relativePath } = this.resolve(path2);
    backend.access(relativePath, mode);
  }
  utimensat(path2, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    const { backend, relativePath } = this.resolve(path2);
    backend.utimensat(relativePath, atimeSec, atimeNsec, mtimeSec, mtimeNsec);
  }
  // --- Directory operations ---
  opendir(path2) {
    const { backend, relativePath } = this.resolve(path2);
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
    const fs3 = new _SharedFS(buffer);
    fs3.w32(SB_MAGIC, MAGIC);
    fs3.w32(SB_VERSION, VERSION);
    fs3.w32(SB_BLOCK_SIZE, BLOCK_SIZE);
    fs3.w32(SB_TOTAL_BLOCKS, totalBlocks);
    fs3.w32(SB_TOTAL_INODES, totalInodes);
    fs3.w32(SB_INODE_BITMAP_START, inodeBitmapStart);
    fs3.w32(SB_BLOCK_BITMAP_START, blockBitmapStart);
    fs3.w32(SB_INODE_TABLE_START, inodeTableStart);
    fs3.w32(SB_DATA_START, dataStart);
    fs3.w32(SB_INODE_BITMAP_BLOCKS, inodeBitmapBlocks);
    fs3.w32(SB_BLOCK_BITMAP_BLOCKS, blockBitmapBlocks);
    fs3.w32(SB_INODE_TABLE_BLOCKS, inodeTableBlocks);
    fs3.w32(SB_MAX_SIZE_BLOCKS, maxBlocks);
    fs3.w32(SB_GROW_CHUNK_BLOCKS, 256);
    const bbStart = blockBitmapStart * BLOCK_SIZE;
    for (let b = 0; b < dataStart; b++) {
      const wordIdx = (bbStart >> 2) + (b >> 5);
      fs3.i32[wordIdx] |= 1 << (b & 31);
    }
    const freeDataBlocks = totalBlocks - dataStart;
    Atomics.store(fs3.i32, SB_FREE_BLOCKS >> 2, freeDataBlocks);
    const ibStart = inodeBitmapStart * BLOCK_SIZE;
    fs3.i32[ibStart >> 2] |= 3;
    Atomics.store(fs3.i32, SB_FREE_INODES >> 2, totalInodes - 2);
    const rootOff = fs3.inodeOffset(ROOT_INO);
    fs3.w32(rootOff + INO_MODE, S_IFDIR2 | 493);
    fs3.w32(rootOff + INO_LINK_COUNT, 2);
    const rootBlock = fs3.blockAlloc();
    if (rootBlock < 0) throw new SFSError(ENOSPC);
    fs3.w32(rootOff + INO_DIRECT, rootBlock);
    const dBase = rootBlock * BLOCK_SIZE;
    const dotRecLen = align4(DIRENT_HEADER_SIZE + 1);
    const dotdotRecLen = align4(DIRENT_HEADER_SIZE + 2);
    fs3.w32(dBase, ROOT_INO);
    fs3.view.setUint16(dBase + 4, dotRecLen, true);
    fs3.view.setUint16(dBase + 6, 1, true);
    fs3.u8[dBase + DIRENT_HEADER_SIZE] = 46;
    const ddOff = dBase + dotRecLen;
    fs3.w32(ddOff, ROOT_INO);
    fs3.view.setUint16(ddOff + 4, dotdotRecLen, true);
    fs3.view.setUint16(ddOff + 6, 2, true);
    fs3.u8[ddOff + DIRENT_HEADER_SIZE] = 46;
    fs3.u8[ddOff + DIRENT_HEADER_SIZE + 1] = 46;
    fs3.w64(rootOff + INO_SIZE, dotRecLen + dotdotRecLen);
    Atomics.store(fs3.i32, SB_GENERATION >> 2, 1);
    return fs3;
  }
  static mount(buffer) {
    const fs3 = new _SharedFS(buffer);
    if (fs3.r32(SB_MAGIC) !== MAGIC) throw new SFSError(EINVAL, "Bad magic");
    if (fs3.r32(SB_VERSION) !== VERSION)
      throw new SFSError(EINVAL, "Bad version");
    if (fs3.r32(SB_BLOCK_SIZE) !== BLOCK_SIZE)
      throw new SFSError(EINVAL, "Bad block size");
    return fs3;
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
  pathResolve(path2, followSymlinks) {
    if (!path2.startsWith("/")) return ENOENT;
    let ino = ROOT_INO;
    const parts = path2.split("/").filter((p) => p.length > 0);
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
  pathResolveParent(path2) {
    if (!path2.startsWith("/"))
      throw new SFSError(EINVAL, "Path must be absolute");
    const parts = path2.split("/").filter((p) => p.length > 0);
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
  open(path2, flags, createMode = 420) {
    const accMode = flags & O_ACCMODE;
    const creating = (flags & O_CREAT2) !== 0;
    let ino = this.pathResolve(path2, true);
    if (ino < 0 && ino === ENOENT && creating) {
      const { parentIno, name } = this.pathResolveParent(path2);
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
  stat(path2) {
    const ino = this.pathResolve(path2, true);
    if (ino < 0) throw new SFSError(ino);
    this.inodeReadLock(ino);
    try {
      return this.buildStat(ino);
    } finally {
      this.inodeReadUnlock(ino);
    }
  }
  lstat(path2) {
    const ino = this.pathResolve(path2, false);
    if (ino < 0) throw new SFSError(ino);
    this.inodeReadLock(ino);
    try {
      return this.buildStat(ino);
    } finally {
      this.inodeReadUnlock(ino);
    }
  }
  unlink(path2) {
    const { parentIno, name } = this.pathResolveParent(path2);
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
  mkdir(path2, mode = 493) {
    const { parentIno, name } = this.pathResolveParent(path2);
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
  rmdir(path2) {
    const { parentIno, name } = this.pathResolveParent(path2);
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
  chmod(path2, mode) {
    const ino = this.pathResolve(path2, true);
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
  utimens(path2, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    const ino = this.pathResolve(path2, true);
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
  readlink(path2) {
    const ino = this.pathResolve(path2, false);
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
  opendir(path2) {
    const ino = this.pathResolve(path2, true);
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
  readdir(path2) {
    const dd = this.opendir(path2);
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
  writeFile(path2, data) {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    const fd = this.open(path2, O_WRONLY | O_CREAT2 | O_TRUNC2);
    try {
      this.write(fd, bytes);
    } finally {
      this.close(fd);
    }
  }
  readFile(path2) {
    const fd = this.open(path2, O_RDONLY2);
    try {
      const st = this.fstat(fd);
      const buf = new Uint8Array(st.size);
      this.read(fd, buf);
      return buf;
    } finally {
      this.close(fd);
    }
  }
  readFileText(path2) {
    return decoder.decode(this.readFile(path2));
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
  constructor(fs3) {
    this.fs = fs3;
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
  registerLazyFile(path2, url, size, mode = 493) {
    const parts = path2.split("/").filter(Boolean);
    let current = "";
    for (let i = 0; i < parts.length - 1; i++) {
      current += "/" + parts[i];
      try {
        this.fs.mkdir(current, 493);
      } catch {
      }
    }
    const fd = this.fs.open(path2, 577, mode);
    this.fs.close(fd);
    const st = this.fs.stat(path2);
    this.lazyFiles.set(st.ino, { path: path2, url, size });
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
    for (const [ino, { path: path2, url, size }] of this.lazyFiles) {
      entries.push({ ino, path: path2, url, size });
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
  async ensureMaterialized(path2) {
    if (this.lazyFiles.size === 0 && this.lazyArchiveInodes.size === 0) return false;
    try {
      const st = this.fs.stat(path2);
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
  open(path2, flags, mode) {
    return this.fs.open(path2, flags, mode);
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
  stat(path2) {
    const result = this.adaptStat(this.fs.stat(path2));
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
  lstat(path2) {
    const result = this.adaptStat(this.fs.lstat(path2));
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
  mkdir(path2, mode) {
    this.fs.mkdir(path2, mode);
  }
  rmdir(path2) {
    this.fs.rmdir(path2);
  }
  unlink(path2) {
    if (this.lazyArchiveInodes.size > 0) {
      try {
        const st = this.fs.lstat(path2);
        const group = this.lazyArchiveInodes.get(st.ino);
        if (group) {
          const entry = group.entries.get(path2);
          if (entry) entry.deleted = true;
          this.lazyArchiveInodes.delete(st.ino);
        }
      } catch {
      }
    }
    this.fs.unlink(path2);
  }
  rename(oldPath, newPath) {
    this.fs.rename(oldPath, newPath);
  }
  link(existingPath, newPath) {
    this.fs.link(existingPath, newPath);
  }
  symlink(target, path2) {
    this.fs.symlink(target, path2);
  }
  readlink(path2) {
    return this.fs.readlink(path2);
  }
  chmod(path2, mode) {
    this.fs.chmod(path2, mode);
  }
  chown(_path, _uid, _gid) {
  }
  // access: check if path exists by stat'ing it (stat throws on error)
  access(path2, _mode) {
    this.fs.stat(path2);
  }
  utimensat(path2, atimeSec, atimeNsec, mtimeSec, mtimeNsec) {
    this.fs.utimens(path2, atimeSec, atimeNsec, mtimeSec, mtimeNsec);
  }
  opendir(path2) {
    return this.fs.opendir(path2);
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

// src/vfs/load-image.ts
var import_fzstd = require("fzstd");
function decompressVfsImage(buf) {
  if (buf.byteLength >= 4) {
    const magic = buf[0] | buf[1] << 8 | buf[2] << 16 | buf[3] << 24;
    if (magic === (4247762216 | 0)) {
      return (0, import_fzstd.decompress)(buf);
    }
  }
  return buf;
}
async function loadVfsImage(url, options) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load VFS image from ${url} (${response.status} ${response.statusText})`
    );
  }
  const buf = new Uint8Array(await response.arrayBuffer());
  const image = decompressVfsImage(buf);
  return MemoryFileSystem.fromImage(image, options);
}

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
function isRootPath(path2) {
  return path2 === "/" || path2 === "" || path2 === ".";
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
  getDevice(path2) {
    const name = path2.startsWith("/") ? path2.slice(1) : path2;
    const dev = this.devices.get(name);
    if (!dev) throw new Error("ENOENT");
    return dev;
  }
  open(path2, _flags, _mode) {
    const name = path2.startsWith("/") ? path2.slice(1) : path2;
    if (isRootPath(path2) || SUBDIRS.includes(name)) {
      const handle2 = this.nextHandle++;
      this.handles.set(handle2, { device: null });
      return handle2;
    }
    const device = this.getDevice(path2);
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
  stat(path2) {
    const now = Date.now();
    if (isRootPath(path2)) {
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
    const name = path2.startsWith("/") ? path2.slice(1) : path2;
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
    const dev = this.getDevice(path2);
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
  lstat(path2) {
    return this.stat(path2);
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
  access(path2, _mode) {
    this.stat(path2);
  }
  utimensat(_path, _atimeSec, _atimeNsec, _mtimeSec, _mtimeNsec) {
  }
  // Directory iteration for /dev and subdirectories
  dirHandles = /* @__PURE__ */ new Map();
  nextDirHandle = 1;
  opendir(path2) {
    const name = path2.startsWith("/") ? path2.slice(1) : path2;
    let entries;
    if (isRootPath(path2)) {
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
    const ERRNO_NAMES2 = {
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
    const name = ERRNO_NAMES2[negErrno2] || `errno(${negErrno2})`;
    return new Error(name);
  }
  // --- File handle operations ---
  open(path2, flags, mode) {
    this.channel.setArg(0, flags);
    this.channel.setArg(1, mode);
    const pathLen = this.channel.writeString(path2);
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
  stat(path2) {
    const pathLen = this.channel.writeString(path2);
    this.channel.setArg(0, pathLen);
    this.call(9 /* STAT */);
    return this.channel.readStatResult();
  }
  lstat(path2) {
    const pathLen = this.channel.writeString(path2);
    this.channel.setArg(0, pathLen);
    this.call(10 /* LSTAT */);
    return this.channel.readStatResult();
  }
  mkdir(path2, mode) {
    this.channel.setArg(0, mode);
    const pathLen = this.channel.writeString(path2);
    this.channel.setArg(1, pathLen);
    this.call(11 /* MKDIR */);
  }
  rmdir(path2) {
    const pathLen = this.channel.writeString(path2);
    this.channel.setArg(0, pathLen);
    this.call(12 /* RMDIR */);
  }
  unlink(path2) {
    const pathLen = this.channel.writeString(path2);
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
  access(path2, mode) {
    this.channel.setArg(0, mode);
    const pathLen = this.channel.writeString(path2);
    this.channel.setArg(1, pathLen);
    this.call(15 /* ACCESS */);
  }
  utimensat(_path, _atimeSec, _atimeNsec, _mtimeSec, _mtimeNsec) {
  }
  // --- Directory iteration ---
  opendir(path2) {
    const pathLen = this.channel.writeString(path2);
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
var NodeTimeProvider = class {
  // Offset from hrtime (monotonic) to epoch, computed once at startup.
  _epochOffsetNs;
  // hrtime at provider creation, used as process start for CPUTIME clocks.
  _startNs;
  constructor() {
    const hrt = process.hrtime.bigint();
    const wallNs = BigInt(Date.now()) * 1000000n;
    this._epochOffsetNs = wallNs - hrt;
    this._startNs = hrt;
  }
  clockGettime(clockId) {
    const ns = process.hrtime.bigint();
    if (clockId === 2 || clockId === 3) {
      const elapsed = ns - this._startNs;
      return { sec: Number(elapsed / 1000000000n), nsec: Number(elapsed % 1000000000n) };
    }
    if (clockId === 1) {
      return { sec: Number(ns / 1000000000n), nsec: Number(ns % 1000000000n) };
    }
    const realNs = ns + this._epochOffsetNs;
    return { sec: Number(realNs / 1000000000n), nsec: Number(realNs % 1000000000n) };
  }
  nanosleep(sec, nsec) {
    const ms = sec * 1e3 + Math.floor(nsec / 1e6);
    if (ms > 0) {
      const sab = new SharedArrayBuffer(4);
      Atomics.wait(new Int32Array(sab), 0, 0, ms);
    }
  }
};
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

// src/binary-resolver.ts
var import_node_fs2 = require("fs");
var import_node_path = require("path");
var import_node_url2 = require("url");
var import_meta2 = {};
var cachedRepoRoot = null;
function findRepoRoot(startFrom) {
  if (cachedRepoRoot && !startFrom) return cachedRepoRoot;
  const here = startFrom ?? (import_meta2.url ? (0, import_node_path.dirname)((0, import_node_url2.fileURLToPath)(import_meta2.url)) : process.cwd());
  let dir = (0, import_node_path.resolve)(here);
  for (let i = 0; i < 20; i++) {
    if ((0, import_node_fs2.existsSync)((0, import_node_path.join)(dir, "binaries.lock")) && (0, import_node_fs2.existsSync)((0, import_node_path.join)(dir, "abi/manifest.schema.json"))) {
      if (!startFrom) cachedRepoRoot = dir;
      return dir;
    }
    const parent = (0, import_node_path.dirname)(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    "Could not find repo root (expected binaries.lock + abi/manifest.schema.json)"
  );
}
var ARCH_SEGMENTS = /* @__PURE__ */ new Set(["wasm32", "wasm64"]);
function applyDefaultArch(relPath) {
  if (!relPath.startsWith("programs/")) return relPath;
  const tail = relPath.slice("programs/".length);
  const firstSeg = tail.split("/", 1)[0];
  if (ARCH_SEGMENTS.has(firstSeg)) return relPath;
  return `programs/wasm32/${tail}`;
}
function resolveBinary(relPath) {
  const repo = findRepoRoot();
  const adjusted = applyDefaultArch(relPath);
  const local = (0, import_node_path.join)(repo, "local-binaries", adjusted);
  if ((0, import_node_fs2.existsSync)(local)) return local;
  const fetched = (0, import_node_path.join)(repo, "binaries", adjusted);
  if ((0, import_node_fs2.existsSync)(fetched)) return fetched;
  throw new Error(
    `Binary not found: ${relPath}
  checked: ${local}
  checked: ${fetched}
  Run scripts/fetch-binaries.sh or place a file at local-binaries/${adjusted}.`
  );
}
function tryResolveBinary(relPath) {
  try {
    return resolveBinary(relPath);
  } catch {
    return null;
  }
}
function binariesDir() {
  return (0, import_node_path.join)(findRepoRoot(), "binaries");
}
function localBinariesDir() {
  return (0, import_node_path.join)(findRepoRoot(), "local-binaries");
}

// src/constants.ts
var WASM_PAGE_SIZE = 65536;
var CH_HEADER_SIZE = 72;
var CH_DATA_SIZE3 = 65536;
var CH_TOTAL_SIZE2 = CH_HEADER_SIZE + CH_DATA_SIZE3;
var DEFAULT_MAX_PAGES = 16384;
var PAGES_PER_THREAD = 4;

// src/thread-allocator.ts
var ThreadPageAllocator = class {
  nextPage;
  freePages = [];
  constructor(maxPages) {
    this.nextPage = maxPages - 2 - PAGES_PER_THREAD;
  }
  /** Allocate pages for a new thread. Zeros the channel and TLS regions. */
  allocate(memory) {
    let basePage;
    if (this.freePages.length > 0) {
      basePage = this.freePages.pop();
    } else {
      basePage = this.nextPage;
      this.nextPage -= PAGES_PER_THREAD;
    }
    const channelOffset = basePage * WASM_PAGE_SIZE;
    const tlsAllocAddr = (basePage - 2) * WASM_PAGE_SIZE;
    const preCheck = new DataView(memory.buffer);
    let nonZeroCount = 0;
    for (let i = 0; i < 64; i += 4) {
      if (preCheck.getUint32(tlsAllocAddr + i, true) !== 0) nonZeroCount++;
    }
    if (nonZeroCount > 0) {
      const vals = [];
      for (let i = 0; i < 64; i += 4) {
        vals.push(`0x${preCheck.getUint32(tlsAllocAddr + i, true).toString(16).padStart(8, "0")}`);
      }
      console.error(`[thread-alloc] WARNING: TLS page 0x${tlsAllocAddr.toString(16)} has ${nonZeroCount}/16 non-zero dwords BEFORE zeroing!`);
      console.error(`[thread-alloc]   data: ${vals.join(" ")}`);
    }
    new Uint8Array(memory.buffer, channelOffset, CH_TOTAL_SIZE2).fill(0);
    new Uint8Array(memory.buffer, tlsAllocAddr, WASM_PAGE_SIZE).fill(0);
    return { basePage, channelOffset, tlsAllocAddr };
  }
  /** Return pages to the free list after thread exit. */
  free(basePage) {
    this.freePages.push(basePage);
  }
};

// src/index.ts
init_wasi_shim();
init_wasi_detect();

// src/node-kernel-host.ts
var import_node_fs3 = require("fs");
var import_node_path2 = require("path");
var import_node_url3 = require("url");
var import_node_url4 = require("url");
var import_node_module2 = require("module");
var import_node_worker_threads2 = require("worker_threads");
var import_meta3 = {};
var __dirname = (0, import_node_path2.dirname)((0, import_node_url3.fileURLToPath)(import_meta3.url));
var NodeKernelHost = class {
  worker;
  pendingRequests = /* @__PURE__ */ new Map();
  exitResolvers = /* @__PURE__ */ new Map();
  _nextRequestId = 1;
  options;
  constructor(options) {
    this.options = options ?? {};
  }
  /** Initialize the kernel by spawning a dedicated worker_thread */
  async init(kernelWasmBytes) {
    const wasmBytes = kernelWasmBytes ?? loadKernelWasm();
    this.worker = spawnKernelWorkerThread();
    this.worker.on("message", (msg) => {
      this.handleWorkerMessage(msg);
    });
    this.worker.on("error", (err) => {
      const error = err instanceof Error ? err : new Error(String(err));
      for (const [, { reject }] of this.pendingRequests) {
        reject(error);
      }
      this.pendingRequests.clear();
    });
    await new Promise((resolve3) => {
      const readyHandler = (msg) => {
        if (msg.type === "ready") {
          this.worker.removeListener("message", readyHandler);
          resolve3();
        }
      };
      this.worker.on("message", readyHandler);
      const initMsg = {
        type: "init",
        kernelWasmBytes: wasmBytes,
        config: {
          maxWorkers: this.options.maxWorkers ?? 4,
          maxPages: this.options.maxPages,
          dataBufferSize: this.options.dataBufferSize ?? 65536,
          useSharedMemory: true
        },
        execPrograms: this.options.execPrograms
      };
      this.worker.postMessage(initMsg);
    });
  }
  /**
   * Spawn a new process. Returns a promise that resolves with the exit code.
   */
  async spawn(programBytes, argv, options) {
    const requestId = this._nextRequestId++;
    const pid = await this.request(requestId, {
      type: "spawn",
      requestId,
      programBytes,
      argv,
      env: options?.env,
      cwd: options?.cwd,
      pty: options?.pty,
      stdin: options?.stdin,
      maxAddr: options?.maxAddr
    });
    const exitPromise = new Promise((resolve3) => {
      this.exitResolvers.set(pid, resolve3);
    });
    if (options?.onStarted) {
      await options.onStarted(pid);
    }
    return exitPromise;
  }
  /** Append data to a process's stdin buffer (process sees more data, no EOF) */
  appendStdinData(pid, data) {
    this.sendToWorker({ type: "append_stdin_data", pid, data });
  }
  /** Set a process's stdin data (complete buffer with implicit EOF) */
  setStdinData(pid, data) {
    this.sendToWorker({ type: "set_stdin_data", pid, data });
  }
  /** Write data to the PTY master for a process */
  ptyWrite(pid, data) {
    this.sendToWorker({ type: "pty_write", pid, data });
  }
  /** Resize the PTY for a process */
  ptyResize(pid, rows, cols) {
    this.sendToWorker({ type: "pty_resize", pid, rows, cols });
  }
  /** Terminate a specific process */
  async terminateProcess(pid, status = -1) {
    const requestId = this._nextRequestId++;
    await this.request(requestId, {
      type: "terminate_process",
      requestId,
      pid,
      status
    });
    const resolver = this.exitResolvers.get(pid);
    this.exitResolvers.delete(pid);
    if (resolver) resolver(status);
  }
  /** Destroy the kernel and release all resources */
  async destroy() {
    const requestId = this._nextRequestId++;
    try {
      await this.request(requestId, { type: "destroy", requestId });
    } catch {
    }
    this.worker.terminate();
    this.exitResolvers.clear();
    this.pendingRequests.clear();
  }
  // ── Private ──
  sendToWorker(msg) {
    this.worker.postMessage(msg);
  }
  request(requestId, msg) {
    return new Promise((resolve3, reject) => {
      this.pendingRequests.set(requestId, { resolve: resolve3, reject });
      this.sendToWorker(msg);
    });
  }
  handleWorkerMessage(msg) {
    switch (msg.type) {
      case "response": {
        const pending = this.pendingRequests.get(msg.requestId);
        if (pending) {
          this.pendingRequests.delete(msg.requestId);
          if (msg.error) {
            pending.reject(new Error(msg.error));
          } else {
            pending.resolve(msg.result);
          }
        }
        break;
      }
      case "exit": {
        const resolver = this.exitResolvers.get(msg.pid);
        if (resolver) {
          this.exitResolvers.delete(msg.pid);
          resolver(msg.status);
        }
        break;
      }
      case "stdout":
        this.options.onStdout?.(msg.pid, msg.data);
        break;
      case "stderr":
        this.options.onStderr?.(msg.pid, msg.data);
        break;
      case "pty_output":
        this.options.onPtyOutput?.(msg.pid, msg.data);
        break;
      case "resolve_exec":
        this.handleResolveExec(msg);
        break;
    }
  }
  async handleResolveExec(msg) {
    let programBytes = null;
    if (this.options.onResolveExec) {
      programBytes = await this.options.onResolveExec(msg.path);
    }
    this.sendToWorker({
      type: "resolve_exec_response",
      requestId: msg.requestId,
      programBytes
    });
  }
};
function loadKernelWasm() {
  const buf = (0, import_node_fs3.readFileSync)(resolveBinary("kernel.wasm"));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
function spawnKernelWorkerThread() {
  const entryTs = (0, import_node_path2.join)(__dirname, "node-kernel-worker-entry.ts");
  const entryJs = (0, import_node_path2.join)(__dirname, "node-kernel-worker-entry.js");
  const distJs = entryTs.replace(/\/src\/([^/]+)\.ts$/, "/dist/$1.js");
  if ((0, import_node_fs3.existsSync)(distJs)) {
    return new import_node_worker_threads2.Worker(distJs);
  }
  if ((0, import_node_fs3.existsSync)(entryJs)) {
    return new import_node_worker_threads2.Worker(entryJs);
  }
  const require2 = (0, import_node_module2.createRequire)(import_meta3.url);
  const tsxApiPath = require2.resolve("tsx/esm/api");
  const tsxApiUrl = (0, import_node_url4.pathToFileURL)(tsxApiPath).href;
  const entryUrl = (0, import_node_url4.pathToFileURL)(entryTs).href;
  const bootstrap = [
    `import { register } from '${tsxApiUrl}';`,
    `register();`,
    `await import('${entryUrl}');`
  ].join("\n");
  return new import_node_worker_threads2.Worker(bootstrap, { eval: true });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrowserTimeProvider,
  CH_TOTAL_SIZE,
  CentralizedKernelWorker,
  ChannelStatus,
  DEFAULT_MAX_PAGES,
  DeviceFileSystem,
  DynamicLinker,
  FetchNetworkBackend,
  HostFileSystem,
  MemoryFileSystem,
  MockWorkerAdapter,
  MockWorkerHandle,
  NodeKernelHost,
  NodePlatformIO,
  NodeTimeProvider,
  NodeWorkerAdapter,
  OPFS_CHANNEL_SIZE,
  OpfsChannel,
  OpfsChannelStatus,
  OpfsFileSystem,
  OpfsOpcode,
  PAGES_PER_THREAD,
  SharedLockTable,
  SharedPipeBuffer,
  SyscallChannel,
  TcpNetworkBackend,
  ThreadPageAllocator,
  VirtualPlatformIO,
  WASM_PAGE_SIZE,
  WasiExit,
  WasiShim,
  WasmPosixKernel,
  binariesDir,
  centralizedThreadWorkerMain,
  centralizedWorkerMain,
  decompressVfsImage,
  findRepoRoot,
  isWasiModule,
  loadSharedLibrary,
  loadSharedLibrarySync,
  loadVfsImage,
  localBinariesDir,
  parseDylinkSection,
  resolveBinary,
  tryResolveBinary,
  wasiModuleDefinesMemory,
  wasiModuleImportsMemory
});
//# sourceMappingURL=index.cjs.map