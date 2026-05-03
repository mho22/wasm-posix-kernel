/**
 * Tracks live `/dev/dri/renderD128` GLES sessions reported by the kernel.
 *
 * One binding per process (single-owner enforced kernel-side via
 * `GL_DEVICE_OWNER`). Each binding owns:
 *
 *   - the cmdbuf region (a slice of the process's wasm Memory SAB),
 *   - a lazily-built `WebGL2RenderingContext` once a canvas is attached,
 *   - per-process handle maps that translate cmdbuf-side u32 names to
 *     real `WebGL*` objects (buffers, textures, shaders, programs, VAOs,
 *     framebuffers, renderbuffers, uniform locations).
 *
 * The cmdbuf view is built lazily on the first `host_gl_submit` and
 * invalidated on `WebAssembly.Memory.grow()` via `rebindMemory(pid)`,
 * mirroring the framebuffer registry's pattern.
 *
 * Uniform-location indexing uses a monotonic `nextUniformLoc` counter
 * (never decremented) rather than `Map.size`. Map.size shrinks on delete
 * and would collide with prior indices that the C side may still hold.
 * Indices are int-keyed (not stringified) so the cmdbuf u32 round-trips
 * cleanly without `Map<string, ...>` / `Map<number, ...>` mismatches.
 */
export type GlContextHandle = number;
export type GlSurfaceHandle = number;

export type GlBindingInput = {
  pid: number;
  /** Wasm-process address where the cmdbuf was mmap'd (set by the
   *  kernel's `host_gl_bind` call). */
  cmdbufAddr: number;
  /** Cmdbuf length in bytes (always `shared::gl::CMDBUF_LEN` = 1 MiB
   *  in v1). */
  cmdbufLen: number;
};

/**
 * Sink for GL lifecycle events when the binding lives on a thread
 * without a usable canvas (browsers without `transferControlToOffscreen`,
 * or any embedder that wants the GL context on the main thread). The
 * worker entry installs one of these per-pid via `attachMainForward`;
 * the channel's methods are expected to `postMessage` the call to a
 * sibling thread that owns the actual `WebGL2RenderingContext`.
 *
 * Bytes handed to `onSubmit` are owned by the channel — the caller has
 * already copied them out of the (shared) cmdbuf, so the channel can
 * transfer or retain them freely.
 */
export type GlForwardChannel = {
  onCreateContext(ctxId: number): void;
  onDestroyContext(): void;
  onSubmit(bytes: Uint8Array): void;
};

export type GlBinding = GlBindingInput & {
  /** Lazy view of `[cmdbufAddr, cmdbufAddr+cmdbufLen)` of the process's
   *  wasm Memory SAB. Built on the first submit and dropped to `null`
   *  by `rebindMemory` after a `Memory.grow()`. */
  cmdbufView: Uint8Array | null;

  /** Live WebGL2 context, lazily constructed at `host_gl_create_context`
   *  time once the embedder has attached a canvas. */
  gl: WebGL2RenderingContext | null;
  /** The canvas backing this binding's WebGL2 context. Set by
   *  `attachCanvas` before the program calls `eglCreateContext`. */
  canvas: HTMLCanvasElement | OffscreenCanvas | null;

  /** EGL context handle (opaque u32 the C side picks). */
  contextId: GlContextHandle | null;
  /** EGL surface handle (opaque u32 the C side picks). */
  surfaceId: GlSurfaceHandle | null;

  /** Cmdbuf-name (u32) → real GL object maps. */
  buffers: Map<number, WebGLBuffer>;
  textures: Map<number, WebGLTexture>;
  shaders: Map<number, WebGLShader>;
  programs: Map<number, WebGLProgram>;
  vaos: Map<number, WebGLVertexArrayObject>;
  fbos: Map<number, WebGLFramebuffer>;
  rbos: Map<number, WebGLRenderbuffer>;
  /** Number-keyed (NOT string-keyed) so the cmdbuf int round-trips
   *  cleanly. Indices are assigned by `++nextUniformLoc` and never
   *  reused so insert/delete cycles cannot collide. */
  uniformLocations: Map<number, WebGLUniformLocation>;
  /** Monotonic counter for `uniformLocations`; never decremented. */
  nextUniformLoc: number;

  /** Last `glUseProgram` target, kept for handlers that need the
   *  current program (e.g. uniform setters). */
  currentProgram: WebGLProgram | null;

  /** When set, the worker has no local canvas for this pid; GL lifecycle
   *  events are instead pushed to the channel so a sibling thread can
   *  drive a `WebGL2RenderingContext` on the embedder's behalf. The
   *  kernel's `host_gl_*` arms in `kernel.ts` short-circuit to the
   *  channel before touching `b.gl` or the cmdbuf-local dispatch table. */
  forward: GlForwardChannel | null;
};

export type GlChangeEvent = "bind" | "unbind";
export type GlChangeListener = (pid: number, ev: GlChangeEvent) => void;

export class GlContextRegistry {
  private bindings = new Map<number, GlBinding>();
  private listeners = new Set<GlChangeListener>();
  /** Forward channels installed before `host_gl_bind` fires for the pid.
   *  Drained into the binding by `bind()`. Lets the embedder set up
   *  forwarding without racing the program's first `open("/dev/dri/...")`. */
  private pendingForwards = new Map<number, GlForwardChannel>();

  bind(b: GlBindingInput): void {
    const forward = this.pendingForwards.get(b.pid) ?? null;
    this.pendingForwards.delete(b.pid);
    this.bindings.set(b.pid, {
      ...b,
      cmdbufView: null,
      gl: null,
      canvas: null,
      contextId: null,
      surfaceId: null,
      buffers: new Map(),
      textures: new Map(),
      shaders: new Map(),
      programs: new Map(),
      vaos: new Map(),
      fbos: new Map(),
      rbos: new Map(),
      uniformLocations: new Map(),
      nextUniformLoc: 0,
      currentProgram: null,
      forward,
    });
    for (const l of this.listeners) l(b.pid, "bind");
  }

  unbind(pid: number): void {
    this.pendingForwards.delete(pid);
    if (!this.bindings.delete(pid)) return;
    for (const l of this.listeners) l(pid, "unbind");
  }

  get(pid: number): GlBinding | undefined {
    return this.bindings.get(pid);
  }

  list(): GlBinding[] {
    return [...this.bindings.values()];
  }

  /**
   * Drop the cached cmdbuf view for `pid`. Callers (the host's
   * memory-replaced flow) invoke this after `WebAssembly.Memory.grow()`
   * invalidates the prior buffer reference. The next `host_gl_submit`
   * rebuilds the view from the new SAB.
   */
  rebindMemory(pid: number): void {
    const b = this.bindings.get(pid);
    if (b) b.cmdbufView = null;
  }

  /**
   * Wire a canvas to this binding. Must happen before the program
   * calls `eglCreateContext` (which triggers `host_gl_create_context`).
   * The WebGL2 context itself is built lazily at create-context time.
   */
  attachCanvas(
    pid: number,
    canvas: HTMLCanvasElement | OffscreenCanvas,
  ): void {
    const b = this.bindings.get(pid);
    if (b) b.canvas = canvas;
  }

  detachCanvas(pid: number): void {
    const b = this.bindings.get(pid);
    if (b) {
      b.canvas = null;
      b.gl = null;
    }
  }

  /**
   * Mark this pid as forwarding GL lifecycle to a sibling thread (the
   * main-thread fallback for browsers without OffscreenCanvas). Safe to
   * call before `bind()` — the channel is held in a pending map and
   * applied when the kernel reports the binding.
   */
  attachMainForward(pid: number, channel: GlForwardChannel): void {
    const b = this.bindings.get(pid);
    if (b) {
      b.forward = channel;
    } else {
      this.pendingForwards.set(pid, channel);
    }
  }

  detachMainForward(pid: number): void {
    this.pendingForwards.delete(pid);
    const b = this.bindings.get(pid);
    if (b) b.forward = null;
  }

  onChange(fn: GlChangeListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}
