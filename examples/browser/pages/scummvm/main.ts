/**
 * ScummVM browser demo — runs an unmodified ScummVM 2.8 build inside
 * the wasm-posix-kernel.
 *
 * Pipeline:
 *   1. BrowserKernel boots; lazy-register the chosen game's data dir.
 *   2. Spawn scummvm.wasm with --path=/usr/local/share/scummvm/<game>.
 *   3. ScummVM links libSDL2.a built with the fbposix video driver,
 *      which mmaps /dev/fb0 and pumps events from stdin (terminfo)
 *      and /dev/input/mice (PS/2). The kernel forwards the fb binding
 *      to the main thread; attachCanvas runs a RAF loop over the
 *      bound region.
 *   4. Keyboard events on the canvas land on stdin in raw termios
 *      (escape sequences, not Linux scancodes — fbposix expects
 *      terminfo-style input, distinct from fbDOOM).
 *   5. Mouse events go through pointer-lock + kernel.injectMouseEvent
 *      (PS/2 frames into /dev/input/mice).
 */
import { BrowserKernel } from "../../lib/browser-kernel";
import { attachCanvas } from "../../../../host/src/framebuffer/canvas-renderer";
import scummvmWasmUrl from "../../../../binaries/programs/wasm32/scummvm.wasm?url";
import kernelWasmUrl from "@kernel-wasm?url";

const buttons = document.querySelectorAll<HTMLButtonElement>(".scummvm-games button");
const canvas = document.getElementById("fb") as HTMLCanvasElement;
const statusEl = document.getElementById("status")!;

/**
 * KeyboardEvent.code → byte sequence for stdin in raw termios.
 *
 * fbposix's PumpEvents reads stdin and decodes ANSI escape sequences
 * (CSI / SS3) into SDL_Scancode. This map mirrors what xterm / VT100
 * sends, so an unmodified SDL2 build sees normal terminal input.
 */
const KEY_BYTES: Record<string, number[]> = {
  ArrowUp:    [0x1b, 0x5b, 0x41],
  ArrowDown:  [0x1b, 0x5b, 0x42],
  ArrowRight: [0x1b, 0x5b, 0x43],
  ArrowLeft:  [0x1b, 0x5b, 0x44],
  Home:       [0x1b, 0x5b, 0x48],
  End:        [0x1b, 0x5b, 0x46],
  PageUp:     [0x1b, 0x5b, 0x35, 0x7e],
  PageDown:   [0x1b, 0x5b, 0x36, 0x7e],
  Insert:     [0x1b, 0x5b, 0x32, 0x7e],
  Delete:     [0x1b, 0x5b, 0x33, 0x7e],
  Enter:      [0x0d],
  Backspace:  [0x7f],
  Tab:        [0x09],
  Escape:     [0x1b],
  Space:      [0x20],
  F1:  [0x1b, 0x4f, 0x50],
  F2:  [0x1b, 0x4f, 0x51],
  F3:  [0x1b, 0x4f, 0x52],
  F4:  [0x1b, 0x4f, 0x53],
  F5:  [0x1b, 0x5b, 0x31, 0x35, 0x7e],
  F6:  [0x1b, 0x5b, 0x31, 0x37, 0x7e],
  F7:  [0x1b, 0x5b, 0x31, 0x38, 0x7e],
  F8:  [0x1b, 0x5b, 0x31, 0x39, 0x7e],
  F9:  [0x1b, 0x5b, 0x32, 0x30, 0x7e],
  F10: [0x1b, 0x5b, 0x32, 0x31, 0x7e],
  F11: [0x1b, 0x5b, 0x32, 0x33, 0x7e],
  F12: [0x1b, 0x5b, 0x32, 0x34, 0x7e],
};

buttons.forEach((btn) => {
  btn.addEventListener("click", () => start(btn.dataset.game!));
});

let running = false;

async function start(game: string) {
  if (running) return;
  running = true;
  buttons.forEach((b) => (b.disabled = true));
  statusEl.textContent = `Booting kernel for ${game}…`;

  const kernel = new BrowserKernel({
    onStdout: (data) => {
      console.log("[scummvm stdout]", new TextDecoder().decode(data));
    },
    onStderr: (data) => {
      console.warn("[scummvm stderr]", new TextDecoder().decode(data));
    },
  });

  const kernelBytes = await fetch(kernelWasmUrl).then((r) => r.arrayBuffer());
  await kernel.init(kernelBytes);

  // Lazy-register the chosen game data directory. fetch-demos.sh
  // populates these; if missing, surface a helpful error.
  const ASSET_BASE = `/assets/scummvm/${game}`;
  try {
    const indexResp = await fetch(`${ASSET_BASE}/index.json`);
    if (!indexResp.ok) throw new Error(`HTTP ${indexResp.status}`);
    const files: Array<{ path: string; size: number; mode?: number }> = await indexResp.json();
    kernel.registerLazyFiles(
      files.map((f) => ({
        path: `/usr/local/share/scummvm/${game}/${f.path}`,
        url: `${ASSET_BASE}/${f.path}`,
        size: f.size,
        mode: f.mode ?? 0o444,
      })),
    );
  } catch (err) {
    statusEl.textContent =
      `Couldn't load ${ASSET_BASE}/index.json — run examples/libs/scummvm/fetch-demos.sh.`;
    console.error("Game data fetch failed:", err);
    buttons.forEach((b) => (b.disabled = false));
    running = false;
    return;
  }

  statusEl.textContent = "Loading scummvm.wasm…";
  const scummvmBytes = await fetch(scummvmWasmUrl).then((r) => r.arrayBuffer());

  statusEl.textContent = "Spawning ScummVM…";
  const pid = kernel.nextPid;
  const exitPromise = kernel.spawn(
    scummvmBytes,
    [
      "scummvm",
      "--path",
      `/usr/local/share/scummvm/${game}`,
      "--auto-detect",
      "--no-fullscreen",
      "--no-console",
    ],
    { env: ["HOME=/home", "TERM=linux", "SDL_VIDEODRIVER=fbposix"], cwd: "/home" },
  );

  attachCanvas(canvas, kernel.framebuffers, pid, {
    getProcessMemory: (p) => kernel.getProcessMemory(p),
  });

  // Keyboard
  canvas.focus();
  canvas.addEventListener("keydown", (e) => {
    const bytes = KEY_BYTES[e.code]
      ?? (e.key.length === 1 ? [e.key.charCodeAt(0)] : null);
    if (bytes) {
      kernel.appendStdinData(pid, new Uint8Array(bytes));
      e.preventDefault();
    }
  });
  canvas.addEventListener("click", () => {
    canvas.focus();
    if (canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
  });

  // Mouse — pointer-lock + injectMouseEvent.
  // PS/2 byte 0 button bits: 0=left, 1=right, 2=middle.
  let buttonState = 0;
  const browserButtonToPS2 = (b: number): number => {
    // BrowserMouseEvent.button: 0=left, 1=middle, 2=right.
    if (b === 0) return 0x01;
    if (b === 1) return 0x04;
    if (b === 2) return 0x02;
    return 0;
  };
  const sendMouseEvent = (dx: number, dy: number) => {
    // Browser deltaY is positive-down; PS/2 is positive-up. Negate.
    kernel.injectMouseEvent(pid, dx, -dy, buttonState);
  };
  canvas.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      sendMouseEvent(e.movementX, e.movementY);
    }
  });
  canvas.addEventListener("mousedown", (e) => {
    buttonState |= browserButtonToPS2(e.button);
    sendMouseEvent(0, 0);
    e.preventDefault();
  });
  canvas.addEventListener("mouseup", (e) => {
    buttonState &= ~browserButtonToPS2(e.button);
    sendMouseEvent(0, 0);
    e.preventDefault();
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  statusEl.textContent =
    "Running. Click canvas → pointer lock. Esc / arrow keys / Enter / F5 work.";

  exitPromise
    .then((status) => {
      statusEl.textContent = `ScummVM exited with status ${status}.`;
      running = false;
      buttons.forEach((b) => (b.disabled = false));
    })
    .catch((err) => {
      statusEl.textContent = `ScummVM error: ${err.message ?? err}`;
      running = false;
      buttons.forEach((b) => (b.disabled = false));
    });
}
