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

/** Byte offsets matching `wasm_posix_shared::channel`. */
const STATUS_OFFSET = 0;
const SYSCALL_OFFSET = 4;
const ARGS_OFFSET = 8;
const ARGS_COUNT = 6;
const RETURN_OFFSET = 32;
const ERRNO_OFFSET = 36;
const DATA_OFFSET = 40;

export const enum ChannelStatus {
  Idle = 0,
  Pending = 1,
  Complete = 2,
  Error = 3,
}

export class SyscallChannel {
  private readonly view: DataView;
  private readonly i32Array: Int32Array;
  private readonly buffer: SharedArrayBuffer | ArrayBuffer;
  private readonly byteOffset: number;

  constructor(buffer: SharedArrayBuffer | ArrayBuffer, byteOffset = 0) {
    this.buffer = buffer;
    this.byteOffset = byteOffset;
    this.view = new DataView(buffer, byteOffset);
    // Int32Array for Atomics operations on the status field.
    // We create it over the entire channel so index 0 corresponds to
    // STATUS_OFFSET (byte 0) in Int32Array element terms.
    this.i32Array = new Int32Array(buffer, byteOffset);
  }

  // ---- Status field (offset 0, 4 bytes) ----

  get status(): ChannelStatus {
    if (this.isShared) {
      return Atomics.load(this.i32Array, STATUS_OFFSET / 4) as ChannelStatus;
    }
    return this.view.getUint32(STATUS_OFFSET, true) as ChannelStatus;
  }

  set status(value: ChannelStatus) {
    if (this.isShared) {
      Atomics.store(this.i32Array, STATUS_OFFSET / 4, value);
    } else {
      this.view.setUint32(STATUS_OFFSET, value, true);
    }
  }

  // ---- Syscall number (offset 4, 4 bytes) ----

  get syscallNumber(): number {
    return this.view.getUint32(SYSCALL_OFFSET, true);
  }

  // ---- Arguments (offset 8, 6 x 4 bytes) ----

  getArg(index: number): number {
    if (index < 0 || index >= ARGS_COUNT) {
      throw new RangeError(
        `Argument index ${index} out of range [0, ${ARGS_COUNT})`,
      );
    }
    return this.view.getInt32(ARGS_OFFSET + index * 4, true);
  }

  // ---- Return value (offset 32, 4 bytes) ----

  setReturn(value: number): void {
    this.view.setInt32(RETURN_OFFSET, value, true);
  }

  // ---- Errno (offset 36, 4 bytes) ----

  setErrno(value: number): void {
    this.view.setUint32(ERRNO_OFFSET, value, true);
  }

  // ---- Data transfer buffer (offset 40..end) ----

  get dataBuffer(): Uint8Array {
    return new Uint8Array(
      this.buffer,
      this.byteOffset + DATA_OFFSET,
    );
  }

  // ---- Atomic operations for SharedArrayBuffer paths ----

  /**
   * Set status to Complete and wake any thread waiting on the status field.
   * Only meaningful when the underlying buffer is a SharedArrayBuffer.
   */
  notifyComplete(): void {
    if (!this.isShared) {
      this.status = ChannelStatus.Complete;
      return;
    }
    Atomics.store(this.i32Array, STATUS_OFFSET / 4, ChannelStatus.Complete);
    Atomics.notify(this.i32Array, STATUS_OFFSET / 4);
  }

  /**
   * Set status to Error and wake any thread waiting on the status field.
   * Only meaningful when the underlying buffer is a SharedArrayBuffer.
   */
  notifyError(): void {
    if (!this.isShared) {
      this.status = ChannelStatus.Error;
      return;
    }
    Atomics.store(this.i32Array, STATUS_OFFSET / 4, ChannelStatus.Error);
    Atomics.notify(this.i32Array, STATUS_OFFSET / 4);
  }

  /**
   * Block the current thread until the channel status transitions to
   * Complete or Error. Returns the final status.
   *
   * Only works with SharedArrayBuffer (requires Atomics.wait support).
   */
  waitForComplete(): ChannelStatus {
    if (!this.isShared) {
      return this.status;
    }

    // Spin on Atomics.wait until status is no longer Pending.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const current = Atomics.load(
        this.i32Array,
        STATUS_OFFSET / 4,
      ) as ChannelStatus;
      if (
        current === ChannelStatus.Complete ||
        current === ChannelStatus.Error
      ) {
        return current;
      }
      // Wait for a change from the current value. Timeout after 1 second
      // and re-check to avoid indefinite blocking on spurious wakeups.
      Atomics.wait(this.i32Array, STATUS_OFFSET / 4, current, 1000);
    }
  }

  // ---- Helpers ----

  private get isShared(): boolean {
    return this.buffer instanceof SharedArrayBuffer;
  }
}
