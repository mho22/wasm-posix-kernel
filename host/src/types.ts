export interface KernelConfig {
  maxWorkers: number;
  dataBufferSize: number;
  useSharedMemory: boolean;
  /** Log every syscall with decoded args and return values to stderr */
  enableSyscallLog?: boolean;
  /** Log syscalls only for processes with this ptrWidth (4 or 8). Useful when
   *  one wasm64 process in a multi-process demo is misbehaving and the rest
   *  are wasm32 — enabling enableSyscallLog drowns the trace in unrelated
   *  syscalls. */
  syscallLogPtrWidth?: 4 | 8;
}

export interface StatResult {
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

export interface PlatformIO {
  open(path: string, flags: number, mode: number): number;
  close(handle: number): number;
  read(
    handle: number,
    buffer: Uint8Array,
    offset: number | null,
    length: number,
  ): number;
  write(
    handle: number,
    buffer: Uint8Array,
    offset: number | null,
    length: number,
  ): number;
  seek(handle: number, offset: number, whence: number): number;
  fstat(handle: number): StatResult;

  // Path-based operations
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

  // Directory iteration
  opendir(path: string): number;
  readdir(
    handle: number,
  ): { name: string; type: number; ino: number } | null;
  closedir(handle: number): void;

  // File operations
  ftruncate(handle: number, length: number): void;
  fsync(handle: number): void;
  fchmod(handle: number, mode: number): void;
  fchown(handle: number, uid: number, gid: number): void;

  // Time
  clockGettime(clockId: number): { sec: number; nsec: number };
  nanosleep(sec: number, nsec: number): void;

  // Process (optional — only needed when process management is available)
  waitpid?(pid: number, options: number): { pid: number; status: number };

  // Networking (optional — only needed for AF_INET support)
  network?: NetworkIO;
}

export interface NetworkIO {
  connect(handle: number, addr: Uint8Array, port: number): void;
  /**
   * Status of an in-flight connect started by `connect()`.
   * Returns:
   *   0           — TCP handshake completed; socket is connected.
   *   positive N  — handshake failed with errno N (e.g., 111 for ECONNREFUSED).
   *   -11         — handshake still pending (EAGAIN).
   * Backends that complete connects synchronously (e.g. `FetchNetworkBackend`,
   * which doesn't open a real TCP connection) may return 0 immediately.
   */
  connectStatus(handle: number): number;
  send(handle: number, data: Uint8Array, flags: number): number;
  recv(handle: number, maxLen: number, flags: number): Uint8Array;
  close(handle: number): void;
  getaddrinfo(hostname: string): Uint8Array; // Returns 4-byte IPv4
}
