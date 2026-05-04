/**
 * DOOM browser demo — runs an unmodified fbDOOM build inside the
 * wasm-posix-kernel.
 *
 * Pipeline:
 *   1. BrowserKernel boots; lazy-register doom1.wad.
 *   2. Spawn fbdoom.wasm with `-iwad /usr/local/games/doom/doom1.wad`.
 *   3. fbdoom mmaps /dev/fb0; the kernel forwards the binding to the main
 *      thread; attachCanvas runs a RAF loop over the bound region.
 *   4. Keyboard events on the canvas become AT-set-1 scancodes (the
 *      Linux MEDIUMRAW protocol); fbDOOM's i_input_tty decodes them.
 */
import { BrowserKernel } from "../../lib/browser-kernel";
import { attachCanvas } from "../../../../host/src/framebuffer/canvas-renderer";
import fbdoomWasmUrl from "../../../../examples/libs/fbdoom/fbdoom.wasm?url";
import kernelWasmUrl from "../../../../host/wasm/wasm_posix_kernel.wasm?url";

const startBtn = document.getElementById("start") as HTMLButtonElement;
const canvas = document.getElementById("fb") as HTMLCanvasElement;
const statusEl = document.getElementById("status")!;

const WAD_VFS_PATH = "/usr/local/games/doom/doom1.wad";
const WAD_URL = "/assets/doom/doom1.wad";

/**
 * Browser `KeyboardEvent.code` → Linux *keycode* (the values in
 * `<linux/input-event-codes.h>`, KEY_*). fbDOOM's `at_to_doom` table
 * is keyed on those codes — for the printable / Esc / Enter / Space
 * range they happen to match AT set-1 scancodes (KEY_ESC=1=0x01,
 * KEY_ENTER=28=0x1c, KEY_SPACE=57=0x39), but arrows differ:
 *   - AT set-1 keypad up:   0x48   →   at_to_doom[0x48] = 0  (no key)
 *   - Linux keycode UP:    103     →   at_to_doom[103]   = KEY_UPARROW
 * So we send Linux keycodes. WASD aliases to the same arrow keycodes
 * since fbDOOM dispatches movement on KEY_*ARROW only.
 *
 * Press / release encoding is standard Linux MEDIUMRAW: bit 7 clear
 * for press, bit 7 set for release. fbDOOM's `*pressed = (data &
 * 0x80) == 0x80` followed by `if (!pressed)` triggering ev_keydown
 * matches that — the variable is named confusingly but the logic
 * is correct.
 */
const SCANCODE: Record<string, number> = {
  Escape: 1,
  Digit1: 2, Digit2: 3, Digit3: 4, Digit4: 5, Digit5: 6,
  Digit6: 7, Digit7: 8, Digit8: 9, Digit9: 10, Digit0: 11,
  Minus: 12, Equal: 13, Backspace: 14, Tab: 15,
  KeyQ: 16, KeyE: 18, KeyR: 19, KeyT: 20,
  KeyY: 21, KeyU: 22, KeyI: 23, KeyO: 24, KeyP: 25,
  BracketLeft: 26, BracketRight: 27, Enter: 28, ControlLeft: 29,
  KeyF: 33, KeyG: 34,
  KeyH: 35, KeyJ: 36, KeyK: 37, KeyL: 38, Semicolon: 39,
  Quote: 40, Backquote: 41, ShiftLeft: 42, Backslash: 43,
  KeyZ: 44, KeyX: 45, KeyC: 46, KeyV: 47, KeyB: 48,
  KeyN: 49, KeyM: 50, Comma: 51, Period: 52, Slash: 53,
  ShiftRight: 54, NumpadMultiply: 55, AltLeft: 56, Space: 57,
  CapsLock: 58, F1: 59, F2: 60, F3: 61, F4: 62, F5: 63,
  F6: 64, F7: 65, F8: 66, F9: 67, F10: 68,
  // Right modifiers — Linux keycodes for the right-side variants.
  ControlRight: 97, AltRight: 100,
  // Arrows + WASD movement aliases — Linux input KEY_UP/DOWN/LEFT/RIGHT
  // are 103, 108, 105, 106. fbDOOM's at_to_doom maps these to its
  // KEY_UPARROW/DOWNARROW/LEFTARROW/RIGHTARROW.
  ArrowUp:    103, KeyW: 103,
  ArrowDown:  108, KeyS: 108,
  ArrowLeft:  105, KeyA: 105,
  ArrowRight: 106, KeyD: 106,
};

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  statusEl.textContent = "Booting kernel…";

  // Capture stderr/stdout for visibility while bringing the demo up.
  const kernel = new BrowserKernel({
    onStdout: (data) => {
      console.log("[doom stdout]", new TextDecoder().decode(data));
    },
    onStderr: (data) => {
      console.warn("[doom stderr]", new TextDecoder().decode(data));
    },
  });

  const kernelBytes = await fetch(kernelWasmUrl).then((r) => r.arrayBuffer());
  await kernel.init(kernelBytes);

  // Lazy-register the WAD: fetched on first read, no upfront cost.
  // doom1.wad is gitignored; users provide it per
  // examples/browser/public/assets/doom/README.md.
  // Probe the size with a HEAD request so the VFS knows the file size
  // up front (registerLazyFile requires a size).
  let wadSize = 0;
  try {
    const head = await fetch(WAD_URL, { method: "HEAD" });
    if (!head.ok) throw new Error(`HTTP ${head.status}`);
    wadSize = Number(head.headers.get("content-length") ?? 0);
    if (!wadSize) throw new Error("Content-Length missing");
  } catch (err) {
    statusEl.textContent =
      `Couldn't find ${WAD_URL} — see examples/browser/public/assets/doom/README.md.`;
    console.error("WAD HEAD probe failed:", err);
    startBtn.disabled = false;
    return;
  }
  kernel.registerLazyFiles([
    { path: WAD_VFS_PATH, url: WAD_URL, size: wadSize, mode: 0o444 },
  ]);
  // The lazy-fetch path materializes on-exec, but the WAD is a *data*
  // file fbDOOM will open() at runtime. Pull it into the VFS now so
  // the synchronous read path inside the kernel never has to fetch.
  statusEl.textContent = `Loading WAD (${(wadSize / (1024 * 1024)).toFixed(1)}MB)…`;
  await kernel.ensureMaterialized(WAD_VFS_PATH);

  statusEl.textContent = "Loading fbdoom.wasm…";
  const fbdoomBytes = await fetch(fbdoomWasmUrl).then((r) => r.arrayBuffer());

  statusEl.textContent = "Spawning fbdoom…";
  // Capture the pid the kernel will assign before spawn() bumps nextPid.
  const pid = kernel.nextPid;
  const exitPromise = kernel.spawn(
    fbdoomBytes,
    ["fbdoom", "-iwad", WAD_VFS_PATH],
    { env: ["HOME=/home", "TERM=linux"], cwd: "/home" },
  );

  attachCanvas(canvas, kernel.framebuffers, pid, {
    getProcessMemory: (p) => kernel.getProcessMemory(p),
  });

  // Audio output → AudioContext. fbDOOM's i_kernel_sound module mixes
  // 8-bit mono SFX plus OPL2-synthesized music (MUS → MIDI → OPL via
  // i_oplmusic) into a 16-bit stereo @ 44.1 kHz buffer and writes it to
  // /dev/dsp every game tic (~28 ms). We poll the kernel ring every
  // ~50 ms, decode S16 → Float32, and chain the chunks onto the
  // AudioContext clock so playback is gapless. The first user-gesture
  // boot button click already happened (it's how we got here), so
  // resume() succeeds without a separate prompt.
  const audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  let audioCursor = audioCtx.currentTime;
  let audioSampleRate = 44100;
  let audioChannels = 2;
  let audioStopped = false;

  // Pull audio every 50 ms. The kernel ring is 256 KiB ≈ 1.5 s of
  // stereo S16 @ 44.1 kHz, so a missed tick or two is harmless. The
  // ring drops oldest frames on overflow rather than blocking, which
  // matches what real OSS hardware does — DOOM never stalls on audio.
  const AUDIO_POLL_MS = 50;
  const AUDIO_DRAIN_BYTES = 32 * 1024; // ~190 ms at 44.1 kHz stereo S16.

  const audioTimer = window.setInterval(async () => {
    if (audioStopped || audioCtx.state !== "running") return;
    let drain;
    try {
      drain = await kernel.drainAudio(AUDIO_DRAIN_BYTES);
    } catch {
      return; // worker torn down, etc. — let the exit promise handle it.
    }
    const { bytes, sampleRate, channels } = drain;
    if (bytes.byteLength === 0) return;
    if (sampleRate > 0) audioSampleRate = sampleRate;
    if (channels > 0) audioChannels = channels;

    // Decode interleaved S16_LE → planar Float32 for AudioBuffer.
    const bytesPerFrame = 2 * audioChannels;
    const frames = Math.floor(bytes.byteLength / bytesPerFrame);
    if (frames === 0) return;
    const buffer = audioCtx.createBuffer(audioChannels, frames, audioSampleRate);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let ch = 0; ch < audioChannels; ch++) {
      const dst = buffer.getChannelData(ch);
      for (let i = 0; i < frames; i++) {
        const sample = view.getInt16((i * audioChannels + ch) * 2, true);
        dst[i] = sample / 32768;
      }
    }

    // Schedule on the AudioContext clock, holding a tiny lookahead so
    // brief drain hiccups don't underrun. We *also* cap the lookahead:
    // if the producer ever drifts ahead of real time (e.g. game tics
    // briefly run faster than wall-clock), the AudioContext queue
    // would otherwise grow without bound, making SFX play hundreds of
    // ms after their visual trigger and eventually getting dropped on
    // ring overflow. When we're more than maxLookahead ahead, we drop
    // the freshly drained chunk and resync — a brief silence is far
    // less perceptible than permanent latency.
    const now = audioCtx.currentTime;
    const lookahead = 0.04; // 40 ms — > 1 poll interval.
    const maxLookahead = 0.15; // 150 ms — drop & resync past this.
    if (audioCursor < now + lookahead) {
      audioCursor = now + lookahead;
    } else if (audioCursor > now + maxLookahead) {
      audioCursor = now + lookahead;
      return; // skip this chunk to let real time catch up
    }
    const node = audioCtx.createBufferSource();
    node.buffer = buffer;
    node.connect(audioCtx.destination);
    node.start(audioCursor);
    audioCursor += frames / audioSampleRate;
  }, AUDIO_POLL_MS);

  // Keyboard input → AT-set-1 scancode bytes on stdin. fbDOOM's
  // `kbd_read` reads the high bit as the *press* flag (inverse of
  // standard MEDIUMRAW), so we set it on keydown and clear it on
  // keyup. We also de-dup keydown autorepeat — fbDOOM treats every
  // press as a fresh edge, which would re-arm the move and freeze
  // the player on auto-repeat.
  canvas.focus();
  const heldKeys = new Set<string>();
  const sendScancode = (code: number, pressed: boolean) => {
    // Linux MEDIUMRAW: high bit clear = press, set = release.
    const byte = pressed ? code & 0x7f : code | 0x80;
    kernel.appendStdinData(pid, new Uint8Array([byte]));
  };
  canvas.addEventListener("keydown", (e) => {
    const code = SCANCODE[e.code];
    if (code === undefined) return;
    e.preventDefault();
    if (heldKeys.has(e.code)) return; // ignore autorepeat
    heldKeys.add(e.code);
    sendScancode(code, true);
  });
  canvas.addEventListener("keyup", (e) => {
    const code = SCANCODE[e.code];
    if (code === undefined) return;
    e.preventDefault();
    heldKeys.delete(e.code);
    sendScancode(code, false);
  });
  // Releasing focus (e.g. Cmd-tab while moving) leaves the held set
  // out of sync; flush it on blur so the player doesn't keep walking.
  canvas.addEventListener("blur", () => {
    for (const k of heldKeys) {
      const code = SCANCODE[k];
      if (code !== undefined) sendScancode(code, false);
    }
    heldKeys.clear();
    if (mouseButtons !== 0) {
      mouseButtons = 0;
      kernel.injectMouseEvent(0, 0, 0);
    }
  });

  // Mouse input → /dev/input/mice PS/2 packets. We use Pointer Lock so the
  // browser delivers unbounded relative motion (movementX/Y) instead of
  // clamped clientX/Y, matching what a real mouse delivers over PS/2.
  // Browser MouseEvent.button: 0=L, 1=M, 2=R. PS/2 byte0 button bits:
  // bit0=L, bit1=R, bit2=M. Browser deltaY is positive-down — invert
  // before sending so the kernel queue holds PS/2 (positive-up) deltas.
  let mouseButtons = 0;
  const buttonBit = (b: number) => (b === 0 ? 1 : b === 2 ? 2 : b === 1 ? 4 : 0);
  canvas.addEventListener("click", () => {
    canvas.focus();
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });
  canvas.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas) return;
    const dx = e.movementX | 0;
    const dy = -(e.movementY | 0);
    if (dx === 0 && dy === 0) return;
    kernel.injectMouseEvent(dx, dy, mouseButtons);
  });
  canvas.addEventListener("mousedown", (e) => {
    if (document.pointerLockElement !== canvas) return;
    const bit = buttonBit(e.button);
    if (bit === 0) return;
    e.preventDefault();
    mouseButtons |= bit;
    kernel.injectMouseEvent(0, 0, mouseButtons);
  });
  canvas.addEventListener("mouseup", (e) => {
    const bit = buttonBit(e.button);
    if (bit === 0) return;
    e.preventDefault();
    mouseButtons &= ~bit;
    kernel.injectMouseEvent(0, 0, mouseButtons);
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  statusEl.textContent =
    "Running. Click the canvas to capture keyboard + mouse. Esc to release pointer.";

  exitPromise
    .then((status) => {
      statusEl.textContent = `fbdoom exited with status ${status}.`;
    })
    .catch((err) => {
      statusEl.textContent = `fbdoom error: ${err.message ?? err}`;
    })
    .finally(() => {
      audioStopped = true;
      window.clearInterval(audioTimer);
      void audioCtx.close().catch(() => {});
    });
});
