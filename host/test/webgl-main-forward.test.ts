import { describe, expect, it } from "vitest";
import { GlContextRegistry } from "../src/webgl/registry.js";
import {
  setupMainForward,
  type ForwardWorkerLike,
  type GlForwardMessage,
} from "../src/webgl/main-forward.js";
import * as O from "../src/webgl/ops.js";

/** Minimal `Worker`-shaped stand-in. Captures the message listener so
 *  the test can synthesize `MessageEvent`-shaped payloads. */
class FakeWorker implements ForwardWorkerLike {
  listener: ((e: MessageEvent) => void) | null = null;
  addEventListener(_t: "message", l: (e: MessageEvent) => void): void {
    this.listener = l;
  }
  removeEventListener(_t: "message", l: (e: MessageEvent) => void): void {
    if (this.listener === l) this.listener = null;
  }
  fire(data: GlForwardMessage): void {
    if (!this.listener) throw new Error("FakeWorker: no listener");
    this.listener({ data } as MessageEvent);
  }
}

/** Recording stub for `WebGL2RenderingContext`; mirrors the pattern in
 *  webgl-bridge.test.ts but only covers the ops used here. */
class RecordingGl {
  log: Array<[string, unknown[]]> = [];
  clear(m: number) { this.log.push(["clear", [m]]); }
  clearColor(r: number, g: number, b: number, a: number) {
    this.log.push(["clearColor", [r, g, b, a]]);
  }
}

/** Fake `HTMLCanvasElement` whose `getContext('webgl2', ...)` returns
 *  the supplied stub. setupMainForward calls getContext on
 *  `gl_forward_create_context`, so we record the call to confirm that. */
function fakeCanvas(stub: RecordingGl): { canvas: HTMLCanvasElement; getContextCalls: unknown[][] } {
  const calls: unknown[][] = [];
  const canvas = {
    getContext(...args: unknown[]) {
      calls.push(args);
      return stub;
    },
  } as unknown as HTMLCanvasElement;
  return { canvas, getContextCalls: calls };
}

/** Build a minimal cmdbuf with one OP_CLEAR(0x4000) entry. */
function clearCmdbuf(): Uint8Array {
  const bytes = new Uint8Array(8);
  const v = new DataView(bytes.buffer);
  v.setUint16(0, O.OP_CLEAR, true);
  v.setUint16(2, 4, true);
  v.setUint32(4, 0x4000, true);
  return bytes;
}

describe("setupMainForward", () => {
  it("builds gl on gl_forward_create_context and discards on destroy", () => {
    const worker = new FakeWorker();
    const stub = new RecordingGl();
    const { canvas, getContextCalls } = fakeCanvas(stub);
    const dispose = setupMainForward(worker, canvas, 7);

    worker.fire({ type: "gl_forward_create_context", pid: 7, ctxId: 99 });
    expect(getContextCalls.length).toBe(1);
    expect(getContextCalls[0][0]).toBe("webgl2");

    worker.fire({ type: "gl_forward_destroy_context", pid: 7 });
    // After destroy, a stray submit must NOT decode (no gl).
    worker.fire({ type: "gl_forward_submit", pid: 7, bytes: clearCmdbuf() });
    expect(stub.log).toEqual([]);

    dispose();
  });

  it("forwards submit bytes through decodeAndDispatch", () => {
    const worker = new FakeWorker();
    const stub = new RecordingGl();
    const { canvas } = fakeCanvas(stub);
    const dispose = setupMainForward(worker, canvas, 7);

    worker.fire({ type: "gl_forward_create_context", pid: 7, ctxId: 1 });
    worker.fire({ type: "gl_forward_submit", pid: 7, bytes: clearCmdbuf() });
    expect(stub.log).toEqual([["clear", [0x4000]]]);

    dispose();
  });

  it("ignores messages for other pids", () => {
    const worker = new FakeWorker();
    const stub = new RecordingGl();
    const { canvas, getContextCalls } = fakeCanvas(stub);
    const dispose = setupMainForward(worker, canvas, 7);

    worker.fire({ type: "gl_forward_create_context", pid: 99, ctxId: 1 });
    expect(getContextCalls.length).toBe(0);

    dispose();
  });

  it("dispose() unregisters the listener", () => {
    const worker = new FakeWorker();
    const stub = new RecordingGl();
    const { canvas } = fakeCanvas(stub);
    const dispose = setupMainForward(worker, canvas, 7);
    expect(worker.listener).not.toBeNull();
    dispose();
    expect(worker.listener).toBeNull();
  });
});

describe("GlContextRegistry forward channel", () => {
  it("attachMainForward applies eagerly when binding exists", () => {
    const reg = new GlContextRegistry();
    reg.bind({ pid: 7, cmdbufAddr: 0, cmdbufLen: 4 });
    const calls: string[] = [];
    reg.attachMainForward(7, {
      onCreateContext: () => calls.push("create"),
      onDestroyContext: () => calls.push("destroy"),
      onSubmit: () => calls.push("submit"),
    });
    expect(reg.get(7)!.forward).not.toBeNull();
    reg.get(7)!.forward!.onCreateContext(1);
    expect(calls).toEqual(["create"]);
  });

  it("attachMainForward defers until bind() when binding is absent", () => {
    const reg = new GlContextRegistry();
    const channel = {
      onCreateContext: () => {},
      onDestroyContext: () => {},
      onSubmit: () => {},
    };
    reg.attachMainForward(7, channel);
    expect(reg.get(7)).toBeUndefined();
    reg.bind({ pid: 7, cmdbufAddr: 0, cmdbufLen: 4 });
    expect(reg.get(7)!.forward).toBe(channel);
  });

  it("detachMainForward clears both pending and active channels", () => {
    const reg = new GlContextRegistry();
    const channel = {
      onCreateContext: () => {},
      onDestroyContext: () => {},
      onSubmit: () => {},
    };
    reg.attachMainForward(7, channel);
    reg.detachMainForward(7);
    reg.bind({ pid: 7, cmdbufAddr: 0, cmdbufLen: 4 });
    expect(reg.get(7)!.forward).toBeNull();

    reg.attachMainForward(7, channel);
    expect(reg.get(7)!.forward).toBe(channel);
    reg.detachMainForward(7);
    expect(reg.get(7)!.forward).toBeNull();
  });

  it("unbind() drops the forward channel", () => {
    const reg = new GlContextRegistry();
    reg.bind({ pid: 7, cmdbufAddr: 0, cmdbufLen: 4 });
    reg.attachMainForward(7, {
      onCreateContext: () => {},
      onDestroyContext: () => {},
      onSubmit: () => {},
    });
    reg.unbind(7);
    expect(reg.get(7)).toBeUndefined();
    // Re-bind: forward must NOT carry over.
    reg.bind({ pid: 7, cmdbufAddr: 0, cmdbufLen: 4 });
    expect(reg.get(7)!.forward).toBeNull();
  });
});
