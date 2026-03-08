import type { KernelConfig, PlatformIO } from "./types";

export class WasmPosixKernel {
  private config: KernelConfig;
  private io: PlatformIO;

  constructor(config: KernelConfig, io: PlatformIO) {
    this.config = config;
    this.io = io;
  }

  async init(): Promise<void> {
    // Will load kernel wasm, set up SharedArrayBuffer channels
  }
}
