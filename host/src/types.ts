export interface KernelConfig {
  maxWorkers: number;
  dataBufferSize: number;
  useSharedMemory: boolean;
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
  open(path: string, flags: number, mode: number): Promise<number>;
  close(handle: number): Promise<number>;
  read(
    handle: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
  ): Promise<number>;
  write(
    handle: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
  ): Promise<number>;
  seek(handle: number, offset: number, whence: number): Promise<number>;
  fstat(handle: number): Promise<StatResult>;
}
