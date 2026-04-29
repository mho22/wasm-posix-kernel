#![no_std]

/// Kernel ABI version.
///
/// This number is baked into every compiled user program (wasm custom section
/// `wasm-posix-abi`) and exported by the kernel as `__abi_version`. The host
/// refuses to launch binaries whose ABI does not match the running kernel.
///
/// **Bump this whenever the binary-level contract between user programs and
/// the kernel changes in a way that breaks backward compatibility.**
///
/// The structural snapshot at `abi/snapshot.json` is the source of truth for
/// what that contract covers — field offsets of marshalled structs, channel
/// header layout, syscall numbers, kernel export signatures, and asyncify
/// save-slot conventions. CI regenerates the snapshot and compares it to
/// the committed copy; any diff requires bumping `ABI_VERSION` in the same
/// commit.
///
/// See `docs/abi-versioning.md` for the full policy.
pub const ABI_VERSION: u32 = 7;

/// Syscall numbers for the POSIX kernel interface.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum Syscall {
    Open = 1,
    Close = 2,
    Read = 3,
    Write = 4,
    Seek = 5,
    Fstat = 6,
    Dup = 7,
    Dup2 = 8,
    Pipe = 9,
    Fcntl = 10,
    Stat = 11,
    Lstat = 12,
    Mkdir = 13,
    Rmdir = 14,
    Unlink = 15,
    Rename = 16,
    Link = 17,
    Symlink = 18,
    Readlink = 19,
    Chmod = 20,
    Chown = 21,
    Access = 22,
    Getcwd = 23,
    Chdir = 24,
    Opendir = 25,
    Readdir = 26,
    Closedir = 27,
    Getpid = 28,
    Getppid = 29,
    Getuid = 30,
    Geteuid = 31,
    Getgid = 32,
    Getegid = 33,
    Exit = 34,
    Kill = 35,
    Sigaction = 36,
    Sigprocmask = 37,
    Raise = 38,
    Alarm = 39,
    ClockGettime = 40,
    Nanosleep = 41,
    Isatty = 42,
    GetEnv = 43,
    SetEnv = 44,
    UnsetEnv = 45,
    Mmap = 46,
    Munmap = 47,
    Brk = 48,
    Mprotect = 49,
    Socket = 50,
    Bind = 51,
    Listen = 52,
    Accept = 53,
    Connect = 54,
    Send = 55,
    Recv = 56,
    Shutdown = 57,
    Getsockopt = 58,
    Setsockopt = 59,
    Poll = 60,
    Socketpair = 61,
    Sendto = 62,
    Recvfrom = 63,
    Pread = 64,
    Pwrite = 65,
    Time = 66,
    Gettimeofday = 67,
    Usleep = 68,
    Openat = 69,
    Tcgetattr = 70,
    Tcsetattr = 71,
    Ioctl = 72,
    Signal = 73,
    Umask = 74,
    Uname = 75,
    Sysconf = 76,
    Dup3 = 77,
    Pipe2 = 78,
    Ftruncate = 79,
    Fsync = 80,
    Writev = 81,
    Readv = 82,
    Getrlimit = 83,
    Setrlimit = 84,
    Truncate = 85,
    Fdatasync = 86,
    Fchmod = 87,
    Fchown = 88,
    Getpgrp = 89,
    Setpgid = 90,
    Getsid = 91,
    Setsid = 92,
    Fstatat = 93,
    Unlinkat = 94,
    Mkdirat = 95,
    Renameat = 96,
    Faccessat = 97,
    Fchmodat = 98,
    Fchownat = 99,
    Linkat = 100,
    Symlinkat = 101,
    Readlinkat = 102,
    Select = 103,
    Setuid = 104,
    Setgid = 105,
    Seteuid = 106,
    Setegid = 107,
    Getrusage = 108,
    Realpath = 109,
    Sigsuspend = 110,
    Pause = 111,
    Pathconf = 112,
    Fpathconf = 113,
    Getsockname = 114,
    Getpeername = 115,
    Rewinddir = 116,
    Telldir = 117,
    Seekdir = 118,
    Getdents64 = 122,
    ClockGetres = 123,
    ClockNanosleep = 124,
    Utimensat = 125,
    Mremap = 126,
    Fchdir = 127,
    Madvise = 128,
    Statfs = 129,
    Fstatfs = 130,
    Setresuid = 131,
    Getresuid = 132,
    Setresgid = 133,
    Getresgid = 134,
    Getgroups = 135,
    Setgroups = 136,
    Sendmsg = 137,
    Recvmsg = 138,
    Wait4 = 139,
    Getaddrinfo = 140,
}

impl Syscall {
    /// Convert a raw u32 value to a Syscall variant.
    pub fn from_u32(val: u32) -> Option<Syscall> {
        match val {
            1 => Some(Syscall::Open),
            2 => Some(Syscall::Close),
            3 => Some(Syscall::Read),
            4 => Some(Syscall::Write),
            5 => Some(Syscall::Seek),
            6 => Some(Syscall::Fstat),
            7 => Some(Syscall::Dup),
            8 => Some(Syscall::Dup2),
            9 => Some(Syscall::Pipe),
            10 => Some(Syscall::Fcntl),
            11 => Some(Syscall::Stat),
            12 => Some(Syscall::Lstat),
            13 => Some(Syscall::Mkdir),
            14 => Some(Syscall::Rmdir),
            15 => Some(Syscall::Unlink),
            16 => Some(Syscall::Rename),
            17 => Some(Syscall::Link),
            18 => Some(Syscall::Symlink),
            19 => Some(Syscall::Readlink),
            20 => Some(Syscall::Chmod),
            21 => Some(Syscall::Chown),
            22 => Some(Syscall::Access),
            23 => Some(Syscall::Getcwd),
            24 => Some(Syscall::Chdir),
            25 => Some(Syscall::Opendir),
            26 => Some(Syscall::Readdir),
            27 => Some(Syscall::Closedir),
            28 => Some(Syscall::Getpid),
            29 => Some(Syscall::Getppid),
            30 => Some(Syscall::Getuid),
            31 => Some(Syscall::Geteuid),
            32 => Some(Syscall::Getgid),
            33 => Some(Syscall::Getegid),
            34 => Some(Syscall::Exit),
            35 => Some(Syscall::Kill),
            36 => Some(Syscall::Sigaction),
            37 => Some(Syscall::Sigprocmask),
            38 => Some(Syscall::Raise),
            39 => Some(Syscall::Alarm),
            40 => Some(Syscall::ClockGettime),
            41 => Some(Syscall::Nanosleep),
            42 => Some(Syscall::Isatty),
            43 => Some(Syscall::GetEnv),
            44 => Some(Syscall::SetEnv),
            45 => Some(Syscall::UnsetEnv),
            46 => Some(Syscall::Mmap),
            47 => Some(Syscall::Munmap),
            48 => Some(Syscall::Brk),
            49 => Some(Syscall::Mprotect),
            50 => Some(Syscall::Socket),
            51 => Some(Syscall::Bind),
            52 => Some(Syscall::Listen),
            53 => Some(Syscall::Accept),
            54 => Some(Syscall::Connect),
            55 => Some(Syscall::Send),
            56 => Some(Syscall::Recv),
            57 => Some(Syscall::Shutdown),
            58 => Some(Syscall::Getsockopt),
            59 => Some(Syscall::Setsockopt),
            60 => Some(Syscall::Poll),
            61 => Some(Syscall::Socketpair),
            62 => Some(Syscall::Sendto),
            63 => Some(Syscall::Recvfrom),
            64 => Some(Syscall::Pread),
            65 => Some(Syscall::Pwrite),
            66 => Some(Syscall::Time),
            67 => Some(Syscall::Gettimeofday),
            68 => Some(Syscall::Usleep),
            69 => Some(Syscall::Openat),
            70 => Some(Syscall::Tcgetattr),
            71 => Some(Syscall::Tcsetattr),
            72 => Some(Syscall::Ioctl),
            73 => Some(Syscall::Signal),
            74 => Some(Syscall::Umask),
            75 => Some(Syscall::Uname),
            76 => Some(Syscall::Sysconf),
            77 => Some(Syscall::Dup3),
            78 => Some(Syscall::Pipe2),
            79 => Some(Syscall::Ftruncate),
            80 => Some(Syscall::Fsync),
            81 => Some(Syscall::Writev),
            82 => Some(Syscall::Readv),
            83 => Some(Syscall::Getrlimit),
            84 => Some(Syscall::Setrlimit),
            85 => Some(Syscall::Truncate),
            86 => Some(Syscall::Fdatasync),
            87 => Some(Syscall::Fchmod),
            88 => Some(Syscall::Fchown),
            89 => Some(Syscall::Getpgrp),
            90 => Some(Syscall::Setpgid),
            91 => Some(Syscall::Getsid),
            92 => Some(Syscall::Setsid),
            93 => Some(Syscall::Fstatat),
            94 => Some(Syscall::Unlinkat),
            95 => Some(Syscall::Mkdirat),
            96 => Some(Syscall::Renameat),
            97 => Some(Syscall::Faccessat),
            98 => Some(Syscall::Fchmodat),
            99 => Some(Syscall::Fchownat),
            100 => Some(Syscall::Linkat),
            101 => Some(Syscall::Symlinkat),
            102 => Some(Syscall::Readlinkat),
            103 => Some(Syscall::Select),
            104 => Some(Syscall::Setuid),
            105 => Some(Syscall::Setgid),
            106 => Some(Syscall::Seteuid),
            107 => Some(Syscall::Setegid),
            108 => Some(Syscall::Getrusage),
            109 => Some(Syscall::Realpath),
            110 => Some(Syscall::Sigsuspend),
            111 => Some(Syscall::Pause),
            112 => Some(Syscall::Pathconf),
            113 => Some(Syscall::Fpathconf),
            114 => Some(Syscall::Getsockname),
            115 => Some(Syscall::Getpeername),
            116 => Some(Syscall::Rewinddir),
            117 => Some(Syscall::Telldir),
            118 => Some(Syscall::Seekdir),
            122 => Some(Syscall::Getdents64),
            123 => Some(Syscall::ClockGetres),
            124 => Some(Syscall::ClockNanosleep),
            125 => Some(Syscall::Utimensat),
            126 => Some(Syscall::Mremap),
            127 => Some(Syscall::Fchdir),
            128 => Some(Syscall::Madvise),
            129 => Some(Syscall::Statfs),
            130 => Some(Syscall::Fstatfs),
            131 => Some(Syscall::Setresuid),
            132 => Some(Syscall::Getresuid),
            133 => Some(Syscall::Setresgid),
            134 => Some(Syscall::Getresgid),
            135 => Some(Syscall::Getgroups),
            136 => Some(Syscall::Setgroups),
            137 => Some(Syscall::Sendmsg),
            138 => Some(Syscall::Recvmsg),
            139 => Some(Syscall::Wait4),
            140 => Some(Syscall::Getaddrinfo),
            _ => None,
        }
    }
}

/// Status of the shared-memory syscall channel.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum ChannelStatus {
    Idle = 0,
    Pending = 1,
    Complete = 2,
    Error = 3,
}

impl ChannelStatus {
    /// Convert a raw u32 value to a ChannelStatus variant.
    pub fn from_u32(val: u32) -> Option<ChannelStatus> {
        match val {
            0 => Some(ChannelStatus::Idle),
            1 => Some(ChannelStatus::Pending),
            2 => Some(ChannelStatus::Complete),
            3 => Some(ChannelStatus::Error),
            _ => None,
        }
    }
}

/// Standard POSIX errno values.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum Errno {
    EPERM = 1,
    ENOENT = 2,
    ESRCH = 3,
    EINTR = 4,
    EIO = 5,
    ENXIO = 6,
    E2BIG = 7,
    EBADF = 9,
    ECHILD = 10,
    EAGAIN = 11,
    ENOMEM = 12,
    EACCES = 13,
    EFAULT = 14,
    EBUSY = 16,
    EEXIST = 17,
    EXDEV = 18,
    ENOTDIR = 20,
    EISDIR = 21,
    EINVAL = 22,
    ENFILE = 23,
    EMFILE = 24,
    ENOTTY = 25,
    EFBIG = 27,
    ENOSPC = 28,
    ESPIPE = 29,
    EROFS = 30,
    EMLINK = 31,
    EPIPE = 32,
    ERANGE = 34,
    EDEADLK = 35,
    ENAMETOOLONG = 36,
    ENOSYS = 38,
    ENOTEMPTY = 39,
    ELOOP = 40,
    ENOMSG = 42,
    EIDRM = 43,
    ENODATA = 61,
    EOVERFLOW = 75,
    ENOTSOCK = 88,
    EDESTADDRREQ = 89,
    EMSGSIZE = 90,
    EPROTOTYPE = 91,
    ENOPROTOOPT = 92,
    EPROTONOSUPPORT = 93,
    EOPNOTSUPP = 95,
    EAFNOSUPPORT = 97,
    EADDRINUSE = 98,
    EADDRNOTAVAIL = 99,
    ENETUNREACH = 101,
    ECONNABORTED = 103,
    ECONNRESET = 104,
    ECONNREFUSED = 111,
    EISCONN = 106,
    ENOTCONN = 107,
    ESHUTDOWN = 108,
    ETIMEDOUT = 110,
    EALREADY = 114,
    EINPROGRESS = 115,
}

impl Errno {
    /// Convert a raw u32 value to an Errno variant.
    pub fn from_u32(val: u32) -> Option<Errno> {
        match val {
            1 => Some(Errno::EPERM),
            2 => Some(Errno::ENOENT),
            3 => Some(Errno::ESRCH),
            4 => Some(Errno::EINTR),
            5 => Some(Errno::EIO),
            6 => Some(Errno::ENXIO),
            7 => Some(Errno::E2BIG),
            9 => Some(Errno::EBADF),
            10 => Some(Errno::ECHILD),
            11 => Some(Errno::EAGAIN),
            12 => Some(Errno::ENOMEM),
            13 => Some(Errno::EACCES),
            14 => Some(Errno::EFAULT),
            16 => Some(Errno::EBUSY),
            17 => Some(Errno::EEXIST),
            18 => Some(Errno::EXDEV),
            20 => Some(Errno::ENOTDIR),
            21 => Some(Errno::EISDIR),
            22 => Some(Errno::EINVAL),
            23 => Some(Errno::ENFILE),
            24 => Some(Errno::EMFILE),
            25 => Some(Errno::ENOTTY),
            27 => Some(Errno::EFBIG),
            28 => Some(Errno::ENOSPC),
            29 => Some(Errno::ESPIPE),
            30 => Some(Errno::EROFS),
            31 => Some(Errno::EMLINK),
            32 => Some(Errno::EPIPE),
            34 => Some(Errno::ERANGE),
            35 => Some(Errno::EDEADLK),
            36 => Some(Errno::ENAMETOOLONG),
            38 => Some(Errno::ENOSYS),
            39 => Some(Errno::ENOTEMPTY),
            40 => Some(Errno::ELOOP),
            42 => Some(Errno::ENOMSG),
            43 => Some(Errno::EIDRM),
            61 => Some(Errno::ENODATA),
            75 => Some(Errno::EOVERFLOW),
            88 => Some(Errno::ENOTSOCK),
            89 => Some(Errno::EDESTADDRREQ),
            90 => Some(Errno::EMSGSIZE),
            91 => Some(Errno::EPROTOTYPE),
            92 => Some(Errno::ENOPROTOOPT),
            93 => Some(Errno::EPROTONOSUPPORT),
            95 => Some(Errno::EOPNOTSUPP),
            97 => Some(Errno::EAFNOSUPPORT),
            98 => Some(Errno::EADDRINUSE),
            99 => Some(Errno::EADDRNOTAVAIL),
            101 => Some(Errno::ENETUNREACH),
            103 => Some(Errno::ECONNABORTED),
            104 => Some(Errno::ECONNRESET),
            106 => Some(Errno::EISCONN),
            111 => Some(Errno::ECONNREFUSED),
            107 => Some(Errno::ENOTCONN),
            108 => Some(Errno::ESHUTDOWN),
            110 => Some(Errno::ETIMEDOUT),
            114 => Some(Errno::EALREADY),
            115 => Some(Errno::EINPROGRESS),
            _ => None,
        }
    }
}

/// File open flags (O_*).
pub mod flags {
    pub const O_RDONLY: u32 = 0;
    pub const O_WRONLY: u32 = 1;
    pub const O_RDWR: u32 = 2;
    pub const O_ACCMODE: u32 = 3;
    pub const O_CREAT: u32 = 0o100;
    pub const O_EXCL: u32 = 0o200;
    pub const O_TRUNC: u32 = 0o1000;
    pub const O_APPEND: u32 = 0o2000;
    pub const O_NONBLOCK: u32 = 0o4000;
    pub const O_ASYNC: u32 = 0o20000;
    pub const O_DIRECTORY: u32 = 0o200000;
    pub const O_NOFOLLOW: u32 = 0o400000;
    pub const O_CLOEXEC: u32 = 0o2000000;
    pub const O_CLOFORK: u32 = 0o40000000;
    pub const AT_FDCWD: i32 = -100;
    pub const AT_SYMLINK_NOFOLLOW: u32 = 0x100;
    pub const AT_REMOVEDIR: u32 = 0x200;
}

/// File descriptor flags (FD_*).
pub mod fd_flags {
    pub const FD_CLOEXEC: u32 = 1;
    pub const FD_CLOFORK: u32 = 2;
}

/// fcntl command constants (F_*).
pub mod fcntl_cmd {
    pub const F_DUPFD: u32 = 0;
    pub const F_GETFD: u32 = 1;
    pub const F_SETFD: u32 = 2;
    pub const F_GETFL: u32 = 3;
    pub const F_SETFL: u32 = 4;
    pub const F_GETLK: u32 = 12;
    pub const F_SETLK: u32 = 13;
    pub const F_SETLKW: u32 = 14;
    pub const F_SETOWN: u32 = 8;
    pub const F_GETOWN: u32 = 9;
    pub const F_DUPFD_CLOEXEC: u32 = 1030;
    pub const F_DUPFD_CLOFORK: u32 = 1028;
    pub const F_OFD_GETLK: u32 = 36;
    pub const F_OFD_SETLK: u32 = 37;
    pub const F_OFD_SETLKW: u32 = 38;
}

/// Lock type constants for advisory record locking.
pub mod lock_type {
    pub const F_RDLCK: u32 = 0;
    pub const F_WRLCK: u32 = 1;
    pub const F_UNLCK: u32 = 2;
}

/// BSD flock() operation constants.
pub mod flock_op {
    pub const LOCK_SH: u32 = 1;
    pub const LOCK_EX: u32 = 2;
    pub const LOCK_UN: u32 = 8;
    pub const LOCK_NB: u32 = 4;
}

/// Memory mapping constants.
pub mod mmap {
    // Protection flags (largely ignored in Wasm, but tracked for compatibility)
    pub const PROT_NONE: u32 = 0;
    pub const PROT_READ: u32 = 1;
    pub const PROT_WRITE: u32 = 2;
    pub const PROT_EXEC: u32 = 4;

    // Map flags
    pub const MAP_SHARED: u32 = 0x01;
    pub const MAP_PRIVATE: u32 = 0x02;
    pub const MAP_FIXED: u32 = 0x10;
    pub const MAP_ANONYMOUS: u32 = 0x20;
    pub const MAP_ANON: u32 = MAP_ANONYMOUS;

    // Return value for failure (usize::MAX — works for both wasm32 and wasm64)
    pub const MAP_FAILED: usize = usize::MAX;
}

/// Socket constants.
pub mod socket {
    pub const AF_UNIX: u32 = 1;
    pub const AF_INET: u32 = 2;
    pub const AF_INET6: u32 = 10;
    pub const SOCK_STREAM: u32 = 1;
    pub const SOCK_DGRAM: u32 = 2;
    pub const SOCK_NONBLOCK: u32 = 0o4000;
    pub const SOCK_CLOEXEC: u32 = 0o2000000;
    pub const SOL_SOCKET: u32 = 1;
    pub const SCM_RIGHTS: u32 = 1;
    pub const SO_REUSEADDR: u32 = 2;
    pub const SO_ERROR: u32 = 4;
    pub const SO_KEEPALIVE: u32 = 9;
    pub const SO_RCVBUF: u32 = 8;
    pub const SO_SNDBUF: u32 = 7;
    pub const SO_TYPE: u32 = 3;
    pub const SO_DOMAIN: u32 = 39;
    pub const SO_ACCEPTCONN: u32 = 30;
    pub const SHUT_RD: u32 = 0;
    pub const SHUT_WR: u32 = 1;
    pub const SHUT_RDWR: u32 = 2;
    pub const SO_BROADCAST: u32 = 6;
    pub const SO_LINGER: u32 = 13;
    // time64 values used by musl on wasm32 (where __LONG_MAX == 0x7fffffff)
    pub const SO_RCVTIMEO: u32 = 66;
    pub const SO_SNDTIMEO: u32 = 67;
    pub const IPPROTO_TCP: u32 = 6;
    pub const TCP_NODELAY: u32 = 1;
    pub const TCP_CORK: u32 = 3;
    pub const TCP_KEEPIDLE: u32 = 4;
    pub const TCP_KEEPINTVL: u32 = 5;
    pub const TCP_KEEPCNT: u32 = 6;
    pub const TCP_DEFER_ACCEPT: u32 = 9;
    pub const TCP_INFO: u32 = 11;
    pub const TCP_QUICKACK: u32 = 12;
    pub const TCP_USER_TIMEOUT: u32 = 18;
    pub const MSG_OOB: u32 = 1;
    pub const MSG_PEEK: u32 = 2;
    pub const MSG_DONTWAIT: u32 = 64;
    pub const MSG_NOSIGNAL: u32 = 0x4000;
}

/// Poll constants.
pub mod poll {
    pub const POLLIN: i16 = 0x0001;
    pub const POLLPRI: i16 = 0x0002;
    pub const POLLOUT: i16 = 0x0004;
    pub const POLLERR: i16 = 0x0008;
    pub const POLLHUP: i16 = 0x0010;
    pub const POLLNVAL: i16 = 0x0020;
}

/// Seek whence constants.
pub mod seek {
    pub const SEEK_SET: u32 = 0;
    pub const SEEK_CUR: u32 = 1;
    pub const SEEK_END: u32 = 2;
}

/// Access mode constants for access()/faccessat().
pub mod access {
    pub const F_OK: u32 = 0;
    pub const R_OK: u32 = 4;
    pub const W_OK: u32 = 2;
    pub const X_OK: u32 = 1;
}

/// Directory entry type constants (DT_*).
pub mod dirent {
    pub const DT_UNKNOWN: u32 = 0;
    pub const DT_FIFO: u32 = 1;
    pub const DT_CHR: u32 = 2;
    pub const DT_DIR: u32 = 4;
    pub const DT_BLK: u32 = 6;
    pub const DT_REG: u32 = 8;
    pub const DT_LNK: u32 = 10;
    pub const DT_SOCK: u32 = 12;
}

/// File mode and type constants (S_*).
pub mod mode {
    // File type mask and values
    pub const S_IFMT: u32 = 0o170000;
    pub const S_IFSOCK: u32 = 0o140000;
    pub const S_IFLNK: u32 = 0o120000;
    pub const S_IFREG: u32 = 0o100000;
    pub const S_IFBLK: u32 = 0o060000;
    pub const S_IFDIR: u32 = 0o040000;
    pub const S_IFCHR: u32 = 0o020000;
    pub const S_IFIFO: u32 = 0o010000;

    // Owner permissions
    pub const S_IRWXU: u32 = 0o700;
    pub const S_IRUSR: u32 = 0o400;
    pub const S_IWUSR: u32 = 0o200;
    pub const S_IXUSR: u32 = 0o100;

    // Group permissions
    pub const S_IRWXG: u32 = 0o070;
    pub const S_IRGRP: u32 = 0o040;
    pub const S_IWGRP: u32 = 0o020;
    pub const S_IXGRP: u32 = 0o010;

    // Other permissions
    pub const S_IRWXO: u32 = 0o007;
    pub const S_IROTH: u32 = 0o004;
    pub const S_IWOTH: u32 = 0o002;
    pub const S_IXOTH: u32 = 0o001;
}

/// Shared-memory channel layout offsets and sizes.
///
/// Channel layout (i64 args for wasm32/wasm64 dual ABI):
///   Offset  Size  Field
///   0       4B    status (i32 atomic — must stay i32 for Atomics.wait32)
///   4       4B    syscall number (i32)
///   8       48B   arguments (6 × i64)
///   56      8B    return value (i64)
///   64      4B    errno (i32)
///   68      4B    reserved/pad
///   72      64KB  data transfer buffer
pub mod channel {
    /// Byte offset of the status field (i32, atomic).
    pub const STATUS_OFFSET: usize = 0;
    /// Byte offset of the syscall number field (i32).
    pub const SYSCALL_OFFSET: usize = 4;
    /// Byte offset of the first argument slot (i64 each, 8 bytes).
    pub const ARGS_OFFSET: usize = 8;
    /// Number of argument slots.
    pub const ARGS_COUNT: usize = 6;
    /// Size of each argument slot in bytes.
    pub const ARG_SIZE: usize = 8;
    /// Byte offset of the return value field (i64).
    pub const RETURN_OFFSET: usize = 56;
    /// Byte offset of the errno field (i32).
    pub const ERRNO_OFFSET: usize = 64;
    /// Byte offset of the data buffer region.
    pub const DATA_OFFSET: usize = 72;
    /// Size of the data buffer.
    pub const DATA_SIZE: usize = 65536;
    /// Total header size before data buffer.
    pub const HEADER_SIZE: usize = 72;
    /// Minimum total size of a channel in bytes (header + 64 KiB data buffer).
    pub const MIN_CHANNEL_SIZE: usize = HEADER_SIZE + DATA_SIZE;

    // Signal delivery area — last 48 bytes of the data buffer.
    // After each syscall, if a signal with a Handler disposition is pending,
    // the kernel writes delivery info here so the glue code can invoke it.
    /// Base offset of signal delivery area.
    pub const SIG_BASE: usize = DATA_OFFSET + DATA_SIZE - 48;
    /// Signal number to deliver (u32). 0 = no signal.
    pub const SIG_SIGNUM: usize = SIG_BASE;
    /// Handler function table index (u32).
    pub const SIG_HANDLER: usize = SIG_BASE + 4;
    /// sa_flags from sigaction (u32).
    pub const SIG_FLAGS: usize = SIG_BASE + 8;
    /// Saved blocked mask before handler (u64, little-endian).
    pub const SIG_OLD_MASK: usize = SIG_BASE + 16;
}

/// Stat structure for the Wasm POSIX interface.
///
/// Uses `repr(C)` for a stable, predictable memory layout that can be
/// shared across the Wasm shared-memory boundary.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct WasmStat {
    pub st_dev: u64,
    pub st_ino: u64,
    pub st_mode: u32,
    pub st_nlink: u32,
    pub st_uid: u32,
    pub st_gid: u32,
    pub st_size: u64,
    pub st_atime_sec: u64,
    pub st_atime_nsec: u32,
    pub st_mtime_sec: u64,
    pub st_mtime_nsec: u32,
    pub st_ctime_sec: u64,
    pub st_ctime_nsec: u32,
    pub _pad: u32,
}

/// Directory entry structure for the Wasm POSIX interface.
///
/// Uses `repr(C)` for a stable, predictable memory layout that can be
/// shared across the Wasm shared-memory boundary.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct WasmDirent {
    pub d_ino: u64,
    pub d_type: u32,
    pub d_namlen: u32,
}

/// flock structure for advisory record locking.
///
/// Matches musl wasm32 layout: `short l_type, short l_whence` (with padding
/// to align off_t fields to 8 bytes), `off_t l_start`, `off_t l_len`,
/// `pid_t l_pid`, plus trailing padding for 8-byte struct alignment.
///
/// Verified offsets: l_type=0, l_whence=2, l_start=8, l_len=16, l_pid=24.
/// Total size: 32 bytes.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct WasmFlock {
    pub l_type: i16,    // F_RDLCK, F_WRLCK, F_UNLCK (short)
    pub l_whence: i16,  // SEEK_SET, SEEK_CUR, SEEK_END (short)
    pub _pad1: u32,     // padding to align l_start to 8 bytes
    pub l_start: i64,   // offset (off_t = long long on wasm32)
    pub l_len: i64,     // length (0 = to end of file)
    pub l_pid: u32,     // process ID (pid_t = int)
    pub _pad2: u32,     // trailing padding for struct alignment
}

/// POSIX signal constants.
pub mod signal {
    // Standard POSIX signals
    pub const SIGHUP: u32 = 1;
    pub const SIGINT: u32 = 2;
    pub const SIGQUIT: u32 = 3;
    pub const SIGILL: u32 = 4;
    pub const SIGTRAP: u32 = 5;
    pub const SIGABRT: u32 = 6;
    pub const SIGBUS: u32 = 7;
    pub const SIGFPE: u32 = 8;
    pub const SIGKILL: u32 = 9;
    pub const SIGUSR1: u32 = 10;
    pub const SIGUSR2: u32 = 12;
    pub const SIGPIPE: u32 = 13;
    pub const SIGALRM: u32 = 14;
    pub const SIGTERM: u32 = 15;
    pub const SIGCHLD: u32 = 17;
    pub const SIGCONT: u32 = 18;
    pub const SIGSTOP: u32 = 19;
    pub const SIGTSTP: u32 = 20;
    pub const SIGXCPU: u32 = 24;
    pub const SIGXFSZ: u32 = 25;
    pub const SIGWINCH: u32 = 28;

    // One past the maximum signal number (matches musl _NSIG=65).
    // Valid signals are 1..NSIG-1 (i.e. 1..64 inclusive).
    pub const NSIG: u32 = 65;

    // Signal handler special values
    pub const SIG_DFL: u32 = 0;
    pub const SIG_IGN: u32 = 1;

    // sigprocmask how values
    pub const SIG_BLOCK: u32 = 0;
    pub const SIG_UNBLOCK: u32 = 1;
    pub const SIG_SETMASK: u32 = 2;

    // sigaction sa_flags
    pub const SA_RESTART: u32 = 0x10000000;
    pub const SA_NOCLDSTOP: u32 = 1;
    pub const SA_NOCLDWAIT: u32 = 2;
    pub const SA_SIGINFO: u32 = 4;
    pub const SA_RESTORER: u32 = 0x04000000;

    // Default actions
    pub const SA_DEFAULT_TERM: u32 = 0;   // Terminate
    pub const SA_DEFAULT_IGN: u32 = 1;    // Ignore
    pub const SA_DEFAULT_CORE: u32 = 2;   // Core dump (treated as terminate in Wasm)
    pub const SA_DEFAULT_STOP: u32 = 3;   // Stop (not supported in Wasm)
    pub const SA_DEFAULT_CONT: u32 = 4;   // Continue (not supported in Wasm)
}

/// Resource limit constants for getrlimit/setrlimit.
pub mod rlimit {
    pub const RLIMIT_CPU: u32 = 0;
    pub const RLIMIT_FSIZE: u32 = 1;
    pub const RLIMIT_DATA: u32 = 2;
    pub const RLIMIT_STACK: u32 = 3;
    pub const RLIMIT_CORE: u32 = 4;
    pub const RLIMIT_NOFILE: u32 = 7;
    pub const RLIMIT_AS: u32 = 9;
    pub const RLIMIT_NPROC: u32 = 6;
    pub const RLIM_NLIMITS: usize = 16;
    pub const RLIM_INFINITY: u64 = u64::MAX;
}

/// getrusage who constants.
pub mod rusage {
    pub const RUSAGE_SELF: i32 = 0;
    pub const RUSAGE_CHILDREN: i32 = -1;
}

/// select() constants.
pub mod select {
    pub const FD_SETSIZE: usize = 1024;
    /// Size of fd_set in bytes (FD_SETSIZE / 8).
    pub const FD_SET_BYTES: usize = FD_SETSIZE / 8;
}

/// Clock ID constants for clock_gettime/clock_settime.
pub mod clock {
    pub const CLOCK_REALTIME: u32 = 0;
    pub const CLOCK_MONOTONIC: u32 = 1;
    pub const CLOCK_PROCESS_CPUTIME_ID: u32 = 2;
    pub const CLOCK_THREAD_CPUTIME_ID: u32 = 3;
}

/// Timespec structure for the Wasm POSIX interface.
///
/// Uses `repr(C)` for a stable, predictable memory layout that can be
/// shared across the Wasm shared-memory boundary.
#[derive(Debug, Clone, Copy)]
#[repr(C)]
pub struct WasmTimespec {
    pub tv_sec: i64,
    pub tv_nsec: i64,
}

/// Poll file descriptor structure for the Wasm POSIX interface.
///
/// Uses `repr(C)` for a stable, predictable memory layout that can be
/// shared across the Wasm shared-memory boundary.
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct WasmPollFd {
    pub fd: i32,
    pub events: i16,
    pub revents: i16,
}

/// Statfs structure for the Wasm POSIX interface.
///
/// Uses `repr(C)` for a stable, predictable memory layout matching
/// musl's struct statfs on 32-bit targets.
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct WasmStatfs {
    pub f_type: u32,
    pub f_bsize: u32,
    pub f_blocks: u64,
    pub f_bfree: u64,
    pub f_bavail: u64,
    pub f_files: u64,
    pub f_ffree: u64,
    pub f_fsid: u64,
    pub f_namelen: u32,
    pub f_frsize: u32,
    pub f_flags: u32,
    pub _pad: u32,
}

/// ABI-surface constants captured by the structural ABI snapshot.
///
/// Any addition, removal, or value change in this module is, by definition,
/// an ABI change and requires bumping [`ABI_VERSION`].
pub mod abi {
    /// A slot, relative to the asyncify buffer base, where the parent
    /// process serializes register-like state before an asyncify-driven
    /// fork so the child can restore it on rewind.
    ///
    /// Offsets are negative (saved before the buffer). Widths are in bytes.
    pub struct AsyncifySaveSlot {
        pub name: &'static str,
        pub offset_wasm32: i32,
        pub offset_wasm64: i32,
        pub width_wasm32: u32,
        pub width_wasm64: u32,
        pub meaning: &'static str,
    }

    /// Save slots used by the asyncify fork path.
    ///
    /// These values must agree with the ones read by
    /// `host/src/worker-main.ts` (`saveParentTls`, the rewind path) and
    /// anything else that reinstates parent state in a fork child.
    pub const ASYNCIFY_SAVE_SLOTS: &[AsyncifySaveSlot] = &[
        AsyncifySaveSlot {
            name: "__tls_base",
            offset_wasm32: -4,
            offset_wasm64: -8,
            width_wasm32: 4,
            width_wasm64: 8,
            meaning: "parent TLS base (__tls_base) saved for child rewind",
        },
        AsyncifySaveSlot {
            name: "__stack_pointer",
            offset_wasm32: -8,
            offset_wasm64: -16,
            width_wasm32: 4,
            width_wasm64: 8,
            meaning: "parent shadow-stack pointer (__stack_pointer) saved for child rewind",
        },
    ];

    /// Name of the wasm custom section in which user programs embed their
    /// ABI version (single little-endian u32). The kernel host rejects
    /// binaries whose value does not match [`crate::ABI_VERSION`].
    pub const ABI_CUSTOM_SECTION: &str = "wasm-posix-abi";

    /// Name of the wasm global exported by the kernel that carries its
    /// [`crate::ABI_VERSION`] at load time (i32, immutable).
    pub const ABI_KERNEL_EXPORT: &str = "__abi_version";

    /// Globals that each user process instance is expected to expose so
    /// the host can thread channel / TLS state through fork and exec.
    pub const PROCESS_EXPECTED_GLOBALS: &[&str] = &[
        "__channel_base",
        "__tls_base",
    ];

    /// Patterns (applied as prefix match) for kernel-wasm exports that
    /// are implementation details of the toolchain, not part of the
    /// host/kernel ABI. The snapshot excludes any export whose name
    /// starts with one of these.
    ///
    /// Adding or removing a pattern is itself an ABI-relevant change —
    /// it affects what the snapshot tracks. The check will flag it.
    pub const EXPORT_DENY_PREFIXES: &[&str] = &[
        "__wasm_call_",
        "__wasm_init_",
        "__wasm_apply_",
        "__llvm_",
    ];

    /// Exact-name variant of [`EXPORT_DENY_PREFIXES`] — exports we
    /// never track regardless of toolchain tweaks.
    pub const EXPORT_DENY_EXACT: &[&str] = &[
        "__dso_handle",
        "__data_end",
        "__heap_base",
        "__heap_end",
        "__memory_base",
        "__table_base",
        "__global_base",
    ];

    /// Prefix patterns for exports whose *value* is part of the ABI,
    /// not just their type. The snapshot captures the initial value of
    /// matching immutable globals.
    ///
    /// Today this is just `__abi_*`. The convention: anything that
    /// declares "this value is the contract" gets an `__abi_` prefix
    /// and is tracked for value-identity. Everything else is tracked
    /// for existence + type, because its value is linker- or
    /// runtime-determined and would churn without encoding real ABI
    /// changes.
    pub const ABI_VALUE_CAPTURE_PREFIXES: &[&str] = &[
        "__abi_",
    ];

    /// Decide whether a kernel-wasm export name should appear in the
    /// snapshot. Implementation-detail symbols (per
    /// [`EXPORT_DENY_PREFIXES`] / [`EXPORT_DENY_EXACT`]) are filtered
    /// out; everything else is kept.
    pub fn export_is_tracked(name: &str) -> bool {
        if EXPORT_DENY_EXACT.iter().any(|&n| n == name) {
            return false;
        }
        if EXPORT_DENY_PREFIXES.iter().any(|&p| name.starts_with(p)) {
            return false;
        }
        true
    }

    /// Decide whether the initial value of a matching immutable global
    /// should be captured in the snapshot.
    pub fn export_value_is_tracked(name: &str) -> bool {
        ABI_VALUE_CAPTURE_PREFIXES
            .iter()
            .any(|&p| name.starts_with(p))
    }
}

/// Linux fbdev ABI constants and marshalled structs.
///
/// These mirror what musl exposes via `<linux/fb.h>` to programs built with
/// `wasm32posix-cc`. Field order, sizes, and offsets must match the Linux
/// ABI exactly: any change here is a binary-level break and requires
/// bumping [`ABI_VERSION`] (see crate root) and updating
/// `abi/snapshot.json` in the same commit.
pub mod fbdev {
    /// `FBIOGET_VSCREENINFO` — read variable screen info.
    pub const FBIOGET_VSCREENINFO: u32 = 0x4600;
    /// `FBIOPUT_VSCREENINFO` — write variable screen info (mode set).
    pub const FBIOPUT_VSCREENINFO: u32 = 0x4601;
    /// `FBIOGET_FSCREENINFO` — read fixed screen info.
    pub const FBIOGET_FSCREENINFO: u32 = 0x4602;
    /// `FBIOPAN_DISPLAY` — pan / present.
    pub const FBIOPAN_DISPLAY: u32 = 0x4606;

    /// `FB_TYPE_PACKED_PIXELS`.
    pub const FB_TYPE_PACKED_PIXELS: u32 = 0;
    /// `FB_VISUAL_TRUECOLOR`.
    pub const FB_VISUAL_TRUECOLOR: u32 = 2;

    /// Linux `struct fb_bitfield` — one channel of pixel layout.
    /// Total: 12 bytes. No padding.
    #[derive(Debug, Clone, Copy, Default)]
    #[repr(C)]
    pub struct FbBitfield {
        pub offset: u32,
        pub length: u32,
        pub msb_right: u32,
    }

    /// Linux `struct fb_var_screeninfo` — variable screen info.
    ///
    /// Total: 160 bytes. Field offsets are part of the ABI.
    #[derive(Debug, Clone, Copy, Default)]
    #[repr(C)]
    pub struct FbVarScreenInfo {
        pub xres: u32,                // 0
        pub yres: u32,                // 4
        pub xres_virtual: u32,        // 8
        pub yres_virtual: u32,        // 12
        pub xoffset: u32,             // 16
        pub yoffset: u32,             // 20
        pub bits_per_pixel: u32,      // 24
        pub grayscale: u32,           // 28
        pub red: FbBitfield,          // 32 (12)
        pub green: FbBitfield,        // 44 (12)
        pub blue: FbBitfield,         // 56 (12)
        pub transp: FbBitfield,       // 68 (12)
        pub nonstd: u32,              // 80
        pub activate: u32,            // 84
        pub height: u32,              // 88
        pub width: u32,               // 92
        pub accel_flags: u32,         // 96
        pub pixclock: u32,            // 100
        pub left_margin: u32,         // 104
        pub right_margin: u32,        // 108
        pub upper_margin: u32,        // 112
        pub lower_margin: u32,        // 116
        pub hsync_len: u32,           // 120
        pub vsync_len: u32,           // 124
        pub sync: u32,                // 128
        pub vmode: u32,               // 132
        pub rotate: u32,              // 136
        pub colorspace: u32,          // 140
        pub reserved: [u32; 4],       // 144 (16)
                                      // total: 160
    }

    /// Linux `struct fb_fix_screeninfo` — fixed screen info (32-bit user-space
    /// flavour, total 80 bytes).
    ///
    /// On native Linux this struct uses native pointer width for `smem_start`
    /// and `mmio_start`. fbDOOM only reads `id`, `smem_len`, `line_length`,
    /// `type`, and `visual` — we report 0 for the address-shaped fields,
    /// keeping the struct 32-bit-flavoured to match what musl's
    /// `<linux/fb.h>` exposes to user-space programs built with `wasm32posix-cc`.
    /// The trailing `_pad_to_80` aligns this to the 80-byte size that musl
    /// programs (and the kernel ABI snapshot) expect.
    #[derive(Debug, Clone, Copy, Default)]
    #[repr(C)]
    pub struct FbFixScreenInfo {
        pub id: [u8; 16],             // 0
        pub smem_start: u32,          // 16  (always 0 in our model)
        pub smem_len: u32,            // 20
        pub fb_type: u32,             // 24  (FB_TYPE_PACKED_PIXELS)
        pub type_aux: u32,            // 28
        pub visual: u32,              // 32  (FB_VISUAL_TRUECOLOR)
        pub xpanstep: u16,            // 36
        pub ypanstep: u16,            // 38
        pub ywrapstep: u16,           // 40
        pub _pad: u16,                // 42
        pub line_length: u32,         // 44
        pub mmio_start: u32,          // 48  (always 0)
        pub mmio_len: u32,            // 52
        pub accel: u32,               // 56
        pub capabilities: u16,        // 60
        pub reserved: [u16; 3],       // 62 (6)
        pub _pad_to_80: [u8; 12],     // 68 (12) → 80
    }
}

/// GLES / EGL ABI: ioctl numbers, opcode enum, query enum, and marshalled
/// argument structs for `/dev/dri/renderD128`.
///
/// These are part of the kernel↔user-space ABI: any change requires bumping
/// `ABI_VERSION` (see crate root) and updating `abi/snapshot.json`.
pub mod gl {
    /// Cmdbuf mmap length (1 MiB). Single fixed size in v1; see
    /// the design doc §3 "Cmdbuf overflow".
    pub const CMDBUF_LEN: usize = 1 << 20;

    /// Version of the GLES op-table. Bumped independently of `ABI_VERSION`
    /// when the cmdbuf opcode set changes; the libGLESv2 stub records this
    /// at compile time and the host refuses to decode a mismatched cmdbuf.
    pub const OP_VERSION: u32 = 1;

    // --- ioctl request numbers (DRM 'D' magic, starting at 0x40) -----------

    // GLIO_INIT takes a pointer to a `u32` carrying the client's compile-time
    // `OP_VERSION`. The kernel rejects mismatches with `ENOSYS` so a process
    // built against an older op-table can't talk to a newer kernel (and vice
    // versa) without the divergence being caught at first contact rather than
    // surfacing later as a silent decode error. See A6's GLIO_INIT handler.
    pub const GLIO_INIT:            u32 = 0x40;
    pub const GLIO_TERMINATE:       u32 = 0x41;
    pub const GLIO_CREATE_CONTEXT:  u32 = 0x42;
    pub const GLIO_DESTROY_CONTEXT: u32 = 0x43;
    pub const GLIO_CREATE_SURFACE:  u32 = 0x44;
    pub const GLIO_DESTROY_SURFACE: u32 = 0x45;
    pub const GLIO_MAKE_CURRENT:    u32 = 0x46;
    pub const GLIO_SUBMIT:          u32 = 0x47;
    pub const GLIO_PRESENT:         u32 = 0x48;
    pub const GLIO_QUERY:           u32 = 0x49;

    // --- surface kind tags -------------------------------------------------

    pub const WPK_SURFACE_DEFAULT: u32 = 1;   // "the bound canvas"
    pub const WPK_SURFACE_PBUFFER: u32 = 2;   // off-screen pbuffer

    /// Upper bound on `GlQueryInfo.out_buf_len`. The kernel allocates a
    /// scratch buffer of this size before forwarding the query to the
    /// host; capping prevents a malicious wasm process from passing
    /// `0xFFFFFFFE` and OOMing the kernel worker.
    ///
    /// 64 KiB comfortably fits every realistic sync-query output: shader
    /// info logs (typically ~1 KB), program info logs, `glGetString`
    /// results, framebuffer-completeness, and `glReadPixels` of a 64×64
    /// RGBA thumbnail (16 KB). Demos that need to read back a full
    /// framebuffer should do it in tiles.
    pub const MAX_QUERY_OUT_LEN: u32 = 64 * 1024;

    // --- cmdbuf opcodes (see host/src/webgl/ops.ts for the TS mirror) ------
    //
    // Layout: TLV `{u16 op, u16 payload_len, payload[payload_len]}` little-
    // endian. Payload formats are documented inline next to the libGLESv2
    // stub call sites in glue/libglesv2_stub.c.

    pub const OP_CLEAR:                       u16 = 0x0001;
    pub const OP_CLEAR_COLOR:                 u16 = 0x0002;
    pub const OP_VIEWPORT:                    u16 = 0x0003;
    pub const OP_SCISSOR:                     u16 = 0x0004;
    pub const OP_ENABLE:                      u16 = 0x0005;
    pub const OP_DISABLE:                     u16 = 0x0006;
    pub const OP_BLEND_FUNC:                  u16 = 0x0007;
    pub const OP_DEPTH_FUNC:                  u16 = 0x0008;
    pub const OP_CULL_FACE:                   u16 = 0x0009;
    pub const OP_FRONT_FACE:                  u16 = 0x000A;
    pub const OP_LINE_WIDTH:                  u16 = 0x000B;
    pub const OP_PIXEL_STOREI:                u16 = 0x000C;

    pub const OP_GEN_BUFFERS:                 u16 = 0x0100;
    pub const OP_DELETE_BUFFERS:              u16 = 0x0101;
    pub const OP_BIND_BUFFER:                 u16 = 0x0102;
    pub const OP_BUFFER_DATA:                 u16 = 0x0103;
    pub const OP_BUFFER_SUB_DATA:             u16 = 0x0104;

    pub const OP_GEN_TEXTURES:                u16 = 0x0200;
    pub const OP_DELETE_TEXTURES:             u16 = 0x0201;
    pub const OP_BIND_TEXTURE:                u16 = 0x0202;
    pub const OP_TEX_IMAGE_2D:                u16 = 0x0203;
    pub const OP_TEX_SUB_IMAGE_2D:            u16 = 0x0204;
    pub const OP_TEX_PARAMETERI:              u16 = 0x0205;
    pub const OP_ACTIVE_TEXTURE:              u16 = 0x0206;
    pub const OP_GENERATE_MIPMAP:             u16 = 0x0207;

    pub const OP_CREATE_SHADER:               u16 = 0x0300;
    pub const OP_SHADER_SOURCE:               u16 = 0x0301;
    pub const OP_COMPILE_SHADER:              u16 = 0x0302;
    pub const OP_DELETE_SHADER:               u16 = 0x0303;
    pub const OP_CREATE_PROGRAM:              u16 = 0x0304;
    pub const OP_ATTACH_SHADER:               u16 = 0x0305;
    pub const OP_LINK_PROGRAM:                u16 = 0x0306;
    pub const OP_USE_PROGRAM:                 u16 = 0x0307;
    pub const OP_BIND_ATTRIB_LOCATION:        u16 = 0x0308;
    pub const OP_DELETE_PROGRAM:              u16 = 0x0309;

    pub const OP_UNIFORM1I:                   u16 = 0x0400;
    pub const OP_UNIFORM1F:                   u16 = 0x0401;
    pub const OP_UNIFORM2F:                   u16 = 0x0402;
    pub const OP_UNIFORM3F:                   u16 = 0x0403;
    pub const OP_UNIFORM4F:                   u16 = 0x0404;
    pub const OP_UNIFORM_MATRIX4FV:           u16 = 0x0405;
    /// `glUniform4fv(location, count, value)` — vector form. es2gears uses
    /// this for the directional light position. `OP_UNIFORM4F` (scalar) is a
    /// different signature; both are needed.
    pub const OP_UNIFORM4FV:                  u16 = 0x0406;

    pub const OP_ENABLE_VERTEX_ATTRIB_ARRAY:  u16 = 0x0500;
    pub const OP_DISABLE_VERTEX_ATTRIB_ARRAY: u16 = 0x0501;
    pub const OP_VERTEX_ATTRIB_POINTER:       u16 = 0x0502;
    pub const OP_DRAW_ARRAYS:                 u16 = 0x0503;
    pub const OP_DRAW_ELEMENTS:               u16 = 0x0504;

    pub const OP_GEN_VERTEX_ARRAYS:           u16 = 0x0600;
    pub const OP_DELETE_VERTEX_ARRAYS:        u16 = 0x0601;
    pub const OP_BIND_VERTEX_ARRAY:           u16 = 0x0602;

    pub const OP_GEN_FRAMEBUFFERS:            u16 = 0x0700;
    pub const OP_BIND_FRAMEBUFFER:            u16 = 0x0701;
    pub const OP_FRAMEBUFFER_TEXTURE_2D:      u16 = 0x0702;
    pub const OP_GEN_RENDERBUFFERS:           u16 = 0x0703;
    pub const OP_BIND_RENDERBUFFER:           u16 = 0x0704;
    pub const OP_RENDERBUFFER_STORAGE:        u16 = 0x0705;
    pub const OP_FRAMEBUFFER_RENDERBUFFER:    u16 = 0x0706;

    // --- sync query op tags (used in GlQueryInfo.op) -----------------------

    pub const QOP_GET_ERROR:             u32 = 0x01;
    pub const QOP_GET_STRING:            u32 = 0x02;
    pub const QOP_GET_INTEGERV:          u32 = 0x03;
    pub const QOP_GET_FLOATV:            u32 = 0x04;
    pub const QOP_GET_UNIFORM_LOC:       u32 = 0x05;
    pub const QOP_GET_ATTRIB_LOC:        u32 = 0x06;
    pub const QOP_GET_SHADERIV:          u32 = 0x07;
    pub const QOP_GET_SHADER_INFO_LOG:   u32 = 0x08;
    pub const QOP_GET_PROGRAMIV:         u32 = 0x09;
    pub const QOP_GET_PROGRAM_INFO_LOG:  u32 = 0x0A;
    pub const QOP_READ_PIXELS:           u32 = 0x0B;
    pub const QOP_CHECK_FB_STATUS:       u32 = 0x0C;

    // --- marshalled ioctl argument structs ---------------------------------

    /// Argument to `GLIO_SUBMIT`. Total: 8 bytes.
    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    pub struct GlSubmitInfo {
        /// Byte offset within the cmdbuf at which to start decoding.
        pub offset: u32,
        /// Number of bytes to decode (must end on a TLV boundary).
        pub length: u32,
    }

    /// Argument to `GLIO_CREATE_CONTEXT`. Total: 16 bytes.
    /// Mirrors a tiny subset of EGL config attrs; v1 only consults
    /// `client_version`.
    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    pub struct GlContextAttrs {
        /// EGL client version (2 → GLES 2, 3 → GLES 3).
        pub client_version: u32,
        /// Reserved for `share_context`, debug bit, robustness bit, etc.
        pub reserved: [u32; 3],
    }

    /// Argument to `GLIO_CREATE_SURFACE`. Total: 32 bytes.
    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    pub struct GlSurfaceAttrs {
        /// `WPK_SURFACE_DEFAULT` or `WPK_SURFACE_PBUFFER`.
        pub kind: u32,
        /// Pbuffer width (default-canvas surfaces ignore this).
        pub width: u32,
        /// Pbuffer height (default-canvas surfaces ignore this).
        pub height: u32,
        /// EGL config id (opaque; v1 reports a single config "1").
        pub config_id: u32,
        /// Reserved.
        pub reserved: [u32; 4],
    }

    /// Argument to `GLIO_QUERY`. Total: 24 bytes.
    /// `in_buf_ptr` / `out_buf_ptr` are wasm-process addresses; the kernel
    /// validates them before forwarding to `HostIO::gl_query`.
    #[repr(C)]
    #[derive(Clone, Copy, Default)]
    pub struct GlQueryInfo {
        /// One of the `QOP_*` tags above.
        pub op: u32,
        /// Process-relative pointer to the input bytes (NUL for ops
        /// that take no input, e.g. `QOP_GET_ERROR`).
        pub in_buf_ptr: u32,
        /// Length of input in bytes.
        pub in_buf_len: u32,
        /// Process-relative pointer to the output buffer.
        pub out_buf_ptr: u32,
        /// Capacity of the output buffer in bytes.
        pub out_buf_len: u32,
        /// Reserved for a future async-completion handle.
        pub reserved: u32,
    }
}

#[cfg(test)]
mod fbdev_tests {
    use super::fbdev::*;
    use core::mem::size_of;

    #[test]
    fn struct_sizes_match_linux_abi() {
        assert_eq!(size_of::<FbBitfield>(), 12);
        assert_eq!(size_of::<FbVarScreenInfo>(), 160);
        assert_eq!(size_of::<FbFixScreenInfo>(), 80);
    }
}

#[cfg(test)]
mod gl_tests {
    use super::gl::*;
    use core::mem::size_of;

    #[test]
    fn struct_sizes_match_abi() {
        assert_eq!(size_of::<GlSubmitInfo>(),    8);
        assert_eq!(size_of::<GlContextAttrs>(), 16);
        assert_eq!(size_of::<GlSurfaceAttrs>(), 32);
        assert_eq!(size_of::<GlQueryInfo>(),    24);
    }

    #[test]
    fn cmdbuf_len_is_one_mib() {
        assert_eq!(CMDBUF_LEN, 1024 * 1024);
    }

    #[test]
    fn opcodes_are_unique() {
        // Anti-collision sentinel: if two opcodes are accidentally the
        // same value, this test surfaces it before the host bridge does.
        let ops: &[u16] = &[
            OP_CLEAR, OP_CLEAR_COLOR, OP_VIEWPORT, OP_SCISSOR,
            OP_ENABLE, OP_DISABLE, OP_BLEND_FUNC, OP_DEPTH_FUNC,
            OP_CULL_FACE, OP_FRONT_FACE, OP_LINE_WIDTH, OP_PIXEL_STOREI,
            OP_GEN_BUFFERS, OP_DELETE_BUFFERS, OP_BIND_BUFFER,
            OP_BUFFER_DATA, OP_BUFFER_SUB_DATA,
            OP_GEN_TEXTURES, OP_DELETE_TEXTURES, OP_BIND_TEXTURE,
            OP_TEX_IMAGE_2D, OP_TEX_SUB_IMAGE_2D, OP_TEX_PARAMETERI,
            OP_ACTIVE_TEXTURE, OP_GENERATE_MIPMAP,
            OP_CREATE_SHADER, OP_SHADER_SOURCE, OP_COMPILE_SHADER,
            OP_DELETE_SHADER, OP_CREATE_PROGRAM, OP_ATTACH_SHADER,
            OP_LINK_PROGRAM, OP_USE_PROGRAM, OP_BIND_ATTRIB_LOCATION,
            OP_DELETE_PROGRAM,
            OP_UNIFORM1I, OP_UNIFORM1F, OP_UNIFORM2F, OP_UNIFORM3F,
            OP_UNIFORM4F, OP_UNIFORM4FV, OP_UNIFORM_MATRIX4FV,
            OP_ENABLE_VERTEX_ATTRIB_ARRAY, OP_DISABLE_VERTEX_ATTRIB_ARRAY,
            OP_VERTEX_ATTRIB_POINTER, OP_DRAW_ARRAYS, OP_DRAW_ELEMENTS,
            OP_GEN_VERTEX_ARRAYS, OP_DELETE_VERTEX_ARRAYS, OP_BIND_VERTEX_ARRAY,
            OP_GEN_FRAMEBUFFERS, OP_BIND_FRAMEBUFFER, OP_FRAMEBUFFER_TEXTURE_2D,
            OP_GEN_RENDERBUFFERS, OP_BIND_RENDERBUFFER, OP_RENDERBUFFER_STORAGE,
            OP_FRAMEBUFFER_RENDERBUFFER,
        ];
        let mut sorted = ops.to_vec();
        sorted.sort();
        sorted.dedup();
        assert_eq!(sorted.len(), ops.len(), "duplicate opcode in OP_* table");
    }
}
