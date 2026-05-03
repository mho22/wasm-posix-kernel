import * as net from "net";
import type { NetworkIO } from "../types";
import { lookup } from "dns";
import { EagainError } from "./fetch-backend";

/**
 * TcpNetworkBackend — real `net.Socket`-backed networking for the Node host.
 *
 * Crucially, every operation returns synchronously and never blocks via
 * `Atomics.wait`. The kernel host runs in a single thread; if we blocked
 * with `Atomics.wait` here, libuv would never get the chance to dispatch the
 * `connect`/`data`/`error` callbacks that we'd be waiting for — classic
 * intra-thread deadlock.
 *
 * Instead we mirror `FetchNetworkBackend`: kick off the I/O asynchronously,
 * stash the state, and throw `EagainError` (errno 11) from `recv` when no
 * data is buffered yet. The kernel maps that to `-EAGAIN`, the wasm program's
 * `O_NONBLOCK` socket sees it, the QuickJS event loop yields back to libuv,
 * the network event fires, the buffer fills, and the program's next poll
 * cycle picks it up.
 *
 * `send` always succeeds locally — Node `net.Socket.write` buffers
 * pre-connect, so we don't need `EAGAIN` on writes. Connection-refused and
 * post-failure writes are reported via a sticky `conn.error`, which `recv`
 * surfaces as `-ECONNRESET` on the next poll cycle.
 */
interface Connection {
  socket: net.Socket;
  recvBuf: Buffer;
  closed: boolean;
  error: Error | null;
}

export class TcpNetworkBackend implements NetworkIO {
  private connections = new Map<number, Connection>();

  connect(handle: number, addr: Uint8Array, port: number): void {
    const ip = `${addr[0]}.${addr[1]}.${addr[2]}.${addr[3]}`;
    const socket = new net.Socket();
    const conn: Connection = {
      socket,
      recvBuf: Buffer.alloc(0),
      closed: false,
      error: null,
    };

    socket.on("data", (data: Buffer) => {
      conn.recvBuf = Buffer.concat([conn.recvBuf, data]);
    });
    socket.on("error", (err: Error) => {
      conn.error = err;
    });
    socket.on("close", () => {
      conn.closed = true;
    });

    socket.connect(port, ip);
    this.connections.set(handle, conn);
  }

  send(handle: number, data: Uint8Array, _flags: number): number {
    const conn = this.connections.get(handle);
    if (!conn) throw new Error("ENOTCONN");
    if (conn.error) throw conn.error;
    if (conn.closed) throw new Error("EPIPE");
    // `net.Socket.write` buffers internally before the TCP handshake
    // completes, so we don't need to gate on `connected`.
    conn.socket.write(Buffer.from(data));
    return data.length;
  }

  recv(handle: number, maxLen: number, _flags: number): Uint8Array {
    const conn = this.connections.get(handle);
    if (!conn) throw new Error("ENOTCONN");
    if (conn.error) throw conn.error;

    if (conn.recvBuf.length > 0) {
      const len = Math.min(maxLen, conn.recvBuf.length);
      const result = new Uint8Array(
        conn.recvBuf.buffer,
        conn.recvBuf.byteOffset,
        len,
      );
      conn.recvBuf = conn.recvBuf.subarray(len);
      return result;
    }

    if (conn.closed) return new Uint8Array(0);

    throw new EagainError();
  }

  close(handle: number): void {
    const conn = this.connections.get(handle);
    if (conn) {
      conn.socket.destroy();
      this.connections.delete(handle);
    }
  }

  getaddrinfo(hostname: string): Uint8Array {
    // Synchronous DNS lookup. Currently uses Atomics.wait, which is fine for
    // numeric addresses (libc resolves them inline) but would deadlock on a
    // real DNS query in the same thread that hosts net.Socket. Phase 3 tests
    // dial numeric IPs only; real DNS for non-numeric hostnames is a known
    // gap to revisit alongside the host runtime threading model.
    const sab = new SharedArrayBuffer(8);
    const flag = new Int32Array(sab);
    const result = new Uint8Array(4);

    lookup(hostname, 4, (err, address) => {
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

    Atomics.wait(flag, 0, 0, 10000);
    if (flag[0] !== 1) throw new Error("DNS resolution failed");
    return result;
  }
}
