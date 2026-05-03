/**
 * Main-thread fallback for browsers without `OffscreenCanvas`
 * (Safari ≤ 15.4, embedded webviews, etc.). The kernel worker has no
 * canvas it can `getContext('webgl2')` against, so it ships GL lifecycle
 * events here over postMessage; this module owns a sibling
 * `GlContextRegistry` + `WebGL2RenderingContext` and replays them.
 *
 * Wire shape (matches `examples/browser/lib/kernel-worker-protocol.ts`):
 *
 *   `{ type: 'gl_forward_create_context',  pid, ctxId }`
 *   `{ type: 'gl_forward_destroy_context', pid }`
 *   `{ type: 'gl_forward_submit',          pid, bytes }`
 *   `{ type: 'gl_forward_unbind',          pid }`
 *
 * All four are kernel-worker → main-thread; the worker entry posts them
 * out of the `GlForwardChannel` it installed via
 * `kernelWorker.kernel.gl.attachMainForward(pid, channel)`.
 *
 * Sync queries (`host_gl_query`) cannot work in this mode — postMessage
 * is async and the kernel call returns a number synchronously. The
 * worker-side `host_gl_query` arm short-circuits to -EPERM (-1) when
 * the local binding has no `gl`, which is always the case in forward
 * mode. Programs that rely on sync queries (eglQueryString,
 * glGetString) will see degraded behavior; that's the fallback's
 * documented price.
 */
import { GlContextRegistry } from "./registry.js";
import { decodeAndDispatch } from "./bridge.js";

/** Subset of `Worker` used by `setupMainForward`. Lets tests pass a
 *  fake without dragging in `lib.dom`. */
export interface ForwardWorkerLike {
  addEventListener(
    type: "message",
    listener: (e: MessageEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (e: MessageEvent) => void,
  ): void;
}

/** Forwarded GL events emitted by the worker entry. */
export type GlForwardMessage =
  | { type: "gl_forward_create_context"; pid: number; ctxId: number }
  | { type: "gl_forward_destroy_context"; pid: number }
  | { type: "gl_forward_submit"; pid: number; bytes: Uint8Array }
  | { type: "gl_forward_unbind"; pid: number };

/**
 * Start listening for forwarded GL events for `pid`. The returned
 * disposer removes the listener and drops the local binding.
 *
 * The local registry is one-pid-deep (each fallback canvas is its own
 * process); callers wanting multi-pid forwarding instantiate one
 * `setupMainForward` per pid. That mirrors how the OffscreenCanvas
 * path already works — one canvas, one process.
 */
export function setupMainForward(
  worker: ForwardWorkerLike,
  canvas: HTMLCanvasElement,
  pid: number,
): () => void {
  const reg = new GlContextRegistry();
  // cmdbufAddr/Len are unused on this side — the worker ships pre-sliced
  // bytes via `gl_forward_submit`. We bind the pid up-front so
  // attachCanvas can wire the surface before the first message lands.
  reg.bind({ pid, cmdbufAddr: 0, cmdbufLen: 0 });
  reg.attachCanvas(pid, canvas);

  const onMessage = (e: MessageEvent) => {
    const msg = e.data as GlForwardMessage | { type?: string };
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;
    if (!("pid" in msg) || (msg as { pid: number }).pid !== pid) return;
    const b = reg.get(pid);
    if (!b) return;
    switch (msg.type) {
      case "gl_forward_create_context": {
        b.contextId = (msg as Extract<GlForwardMessage, { type: "gl_forward_create_context" }>).ctxId;
        const ctx = canvas.getContext("webgl2", {
          antialias: false,
          premultipliedAlpha: false,
        }) as WebGL2RenderingContext | null;
        b.gl = ctx;
        return;
      }
      case "gl_forward_destroy_context": {
        b.gl = null;
        b.contextId = null;
        b.currentProgram = null;
        return;
      }
      case "gl_forward_submit": {
        const bytes = (msg as Extract<GlForwardMessage, { type: "gl_forward_submit" }>).bytes;
        if (!b.gl) return;
        b.cmdbufView = bytes;
        decodeAndDispatch(b, 0, bytes.byteLength);
        return;
      }
      case "gl_forward_unbind": {
        reg.unbind(pid);
        return;
      }
    }
  };

  worker.addEventListener("message", onMessage);
  return () => {
    worker.removeEventListener("message", onMessage);
    reg.unbind(pid);
  };
}
