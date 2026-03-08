/**
 * Node.js platform I/O backend.
 *
 * Implements the PlatformIO interface using synchronous Node.js `fs`
 * operations. Synchronous methods are used because the kernel runs in
 * a worker context and we need deterministic, blocking behavior that
 * aligns with the Wasm import calling convention.
 */

import * as fs from "node:fs";
import type { PlatformIO, StatResult } from "../types";

export class NodePlatformIO implements PlatformIO {
  async open(path: string, flags: number, mode: number): Promise<number> {
    return fs.openSync(path, flags, mode);
  }

  async close(handle: number): Promise<number> {
    fs.closeSync(handle);
    return 0;
  }

  async read(
    handle: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
  ): Promise<number> {
    return fs.readSync(handle, buffer, 0, length, offset);
  }

  async write(
    handle: number,
    buffer: Uint8Array,
    offset: number,
    length: number,
  ): Promise<number> {
    return fs.writeSync(handle, buffer, 0, length, offset);
  }

  async seek(
    handle: number,
    offset: number,
    whence: number,
  ): Promise<number> {
    // Node.js does not have a direct seekSync equivalent. We calculate
    // the new position ourselves by reading the current stats when
    // needed and using pread/pwrite for positional I/O.
    //
    // SEEK_SET=0, SEEK_CUR=1, SEEK_END=2
    switch (whence) {
      case 0: // SEEK_SET
        return offset;
      case 1: // SEEK_CUR — not directly supportable without tracking
        // position state; return the offset as a relative delta indicator.
        // The caller (kernel) maintains the canonical position.
        return offset;
      case 2: {
        // SEEK_END — compute from file size
        const stat = fs.fstatSync(handle);
        return stat.size + offset;
      }
      default:
        throw new Error(`Invalid whence value: ${whence}`);
    }
  }

  async fstat(handle: number): Promise<StatResult> {
    const stat = fs.fstatSync(handle);
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
      ctimeMs: stat.ctimeMs,
    };
  }
}
