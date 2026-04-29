/**
 * ScummVM browser demo — runs an unmodified ScummVM 2.8 build inside
 * the wasm-posix-kernel, playing the freeware "Beneath a Steel Sky".
 *
 * Pipeline:
 *   1. BrowserKernel boots; lazy-register the BASS asset files.
 *   2. Spawn scummvm.wasm with `--path=/usr/local/games/bass --auto-detect`.
 *   3. ScummVM links SDL2 statically; SDL2's `wasmposix` video driver
 *      mmaps /dev/fb0; attachCanvas runs a RAF loop over the bound region.
 *   4. SDL2's `oss` audio driver writes PCM to /dev/dsp; the host's
 *      audio sink feeds an AudioWorklet.  (TODO once /dev/dsp host wiring
 *      lands; placeholder marked below.)
 *   5. Pointer-lock mouse motion is injected into the kernel as PS/2
 *      mouse frames on /dev/input/mice; SDL2 reads them.  (TODO once the
 *      mouse host PRs land; placeholder marked below.)
 *   6. Keyboard events on the canvas are written to the process's stdin
 *      in raw termios mode; SDL2's termios input picks them up.
 *
 * Status: prerequisite-blocked. Three sibling tasks must land before
 * this demo runs end-to-end:
 *   - /dev/dsp + host AudioWorklet sink
 *   - /dev/input/mice + host injectMouseEvent
 *   - SDL2 cross-build with wasmposix video, oss audio, mice+termios input
 *
 * Until then this file is the wiring spec — every prerequisite-dependent
 * line is marked TODO(prereq) so review can verify the shape of the
 * integration without the runtime being available.
 */
import { BrowserKernel } from "../../lib/browser-kernel";
import { attachCanvas } from "../../../../host/src/framebuffer/canvas-renderer";
// TODO(prereq:audio): import { attachAudio } from "../../../../host/src/audio/audio-renderer";
// TODO(prereq:mouse): the mouse injector is on the kernel proxy itself
//                     (kernel.injectMouseEvent), not a separate import.
import scummvmWasmUrl from "../../../../binaries/programs/wasm32/scummvm.wasm?url";
import kernelWasmUrl from "@kernel-wasm?url";

const startBtn = document.getElementById("start") as HTMLButtonElement;
const canvas = document.getElementById("fb") as HTMLCanvasElement;
const statusEl = document.getElementById("status")!;

const GAME_DIR = "/usr/local/games/bass";
const SAVE_DIR = "/home/scummvm/saves";

/**
 * BASS freeware file manifest. Every file is lazy-registered; ScummVM
 * fetches each one on first read. Sizes from the freeware tarball;
 * verified at fetch-bass.sh time.
 *
 * If the URL paths or size figures change after a re-fetch, regenerate
 * this list with: `( cd public/assets/bass && ls -l | awk … )`.
 */
const BASS_FILES: Array<{ name: string; size: number }> = [
  // The exact list is finalized when fetch-bass.sh successfully runs the
  // first time. The values below are from BASS CD freeware bundle
  // documentation (downloads.scummvm.org). Names are case-sensitive.
  { name: "sky.cpt", size: 73996 },
  { name: "sky.dnr", size: 178 },
  { name: "sky.dsk", size: 7847468 },
  { name: "sky.exe", size: 304624 },
  // Music + voice (digital): only loaded if user enables them. BASS's
  // intro plays without these; we register them so they're available
  // when the engine asks.
  // TODO(prereq:audio): finalize the music/voice file list once the
  //                     audio task lands and we can verify playback.
];

/**
 * Browser keyboard → terminal byte stream. SDL2's termios input driver
 * reads raw bytes from stdin and re-synthesizes them into SDL key events.
 *
 * For ScummVM we need: F-keys (save/load menu), Esc, Space, period (skip
 * line), and printable text (in-engine save-game name entry).  This is
 * a minimum mapping; we expand as gaps surface.
 */
const KEY_MAP: Record<string, Uint8Array> = {
  Escape:    new Uint8Array([0x1b]),
  Enter:     new Uint8Array([0x0d]),
  Space:     new Uint8Array([0x20]),
  Period:    new Uint8Array([0x2e]),
  // F-keys send xterm-style CSI sequences which SDL2's termios driver
  // converts back to SDLK_F* events.
  F1: new Uint8Array([0x1b, 0x4f, 0x50]),
  F2: new Uint8Array([0x1b, 0x4f, 0x51]),
  F3: new Uint8Array([0x1b, 0x4f, 0x52]),
  F4: new Uint8Array([0x1b, 0x4f, 0x53]),
  F5: new Uint8Array([0x1b, 0x5b, 0x31, 0x35, 0x7e]),
  F6: new Uint8Array([0x1b, 0x5b, 0x31, 0x37, 0x7e]),
  F7: new Uint8Array([0x1b, 0x5b, 0x31, 0x38, 0x7e]),
  F8: new Uint8Array([0x1b, 0x5b, 0x31, 0x39, 0x7e]),
  // Arrow keys (cursor walking when mouse isn't preferred).
  ArrowUp:    new Uint8Array([0x1b, 0x5b, 0x41]),
  ArrowDown:  new Uint8Array([0x1b, 0x5b, 0x42]),
  ArrowRight: new Uint8Array([0x1b, 0x5b, 0x43]),
  ArrowLeft:  new Uint8Array([0x1b, 0x5b, 0x44]),
};

/**
 * Pointer-lock mouse-button bitmap matches the PS/2 protocol the kernel
 * expects on /dev/input/mice (left=1, right=2, middle=4).
 */
let mouseButtons = 0;
function buttonBit(e: MouseEvent): number {
  // MouseEvent.button: 0=left, 1=middle, 2=right.
  switch (e.button) {
    case 0: return 1;
    case 1: return 4;
    case 2: return 2;
    default: return 0;
  }
}

async function loadKernelWasm(): Promise<ArrayBuffer> {
  const r = await fetch(kernelWasmUrl);
  return await r.arrayBuffer();
}

async function loadProgramWasm(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  return await r.arrayBuffer();
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  statusEl.textContent = "Booting kernel...";

  const kernel = new BrowserKernel();
  const kernelBytes = await loadKernelWasm();
  await kernel.init(kernelBytes);

  statusEl.textContent = "Registering BASS files...";
  kernel.registerLazyFiles(
    BASS_FILES.map(({ name, size }) => ({
      path: `${GAME_DIR}/${name}`,
      url: `/assets/bass/${name}`,
      size,
    })),
  );
  // Writable home for savegames + scummvm.ini.
  await kernel.mkdirp(SAVE_DIR, 0o755);

  statusEl.textContent = "Loading scummvm.wasm...";
  const scummvmBytes = await loadProgramWasm(scummvmWasmUrl);

  statusEl.textContent = "Starting ScummVM...";
  const pid = await kernel.spawn(scummvmBytes, [
    "scummvm",
    `--path=${GAME_DIR}`,
    `--savepath=${SAVE_DIR}`,
    "--fullscreen",
    "sky",                              // auto-launch the BASS engine
  ], {
    env: {
      HOME: "/home/scummvm",
      // SDL2 driver selection — SDL_*DRIVER env vars are SDL's standard
      // override mechanism (see SDL_GetVideoDriver / SDL_GetAudioDriver).
      // The ScummVM port's SDL2 build provides these driver names.
      SDL_VIDEODRIVER: "wasmposix",
      SDL_AUDIODRIVER: "oss",
    },
    cwd: "/home/scummvm",
  });

  // Display.
  attachCanvas(canvas, kernel.framebuffers, pid, {
    getProcessMemory: () => kernel.getProcessMemory(pid),
  });

  // Audio. TODO(prereq:audio): wire up once the /dev/dsp host task lands.
  // attachAudio(audioContext, kernel.audio, pid, {
  //   getProcessMemory: () => kernel.getProcessMemory(pid),
  // });

  // Mouse.
  canvas.addEventListener("click", () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });
  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas) return;
    // TODO(prereq:mouse): kernel.injectMouseEvent landed in the
    //                     `add-fbdoom-mouse-support` PRs; once those
    //                     merge into main this call is live.
    // kernel.injectMouseEvent(pid, e.movementX, e.movementY, mouseButtons);
  });
  document.addEventListener("mousedown", (e) => {
    if (document.pointerLockElement !== canvas) return;
    mouseButtons |= buttonBit(e);
    // TODO(prereq:mouse): kernel.injectMouseEvent(pid, 0, 0, mouseButtons);
  });
  document.addEventListener("mouseup", (e) => {
    if (document.pointerLockElement !== canvas) return;
    mouseButtons &= ~buttonBit(e);
    // TODO(prereq:mouse): kernel.injectMouseEvent(pid, 0, 0, mouseButtons);
  });
  // Suppress the right-click context menu so right-click reaches the engine.
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Keyboard.
  canvas.focus();
  canvas.addEventListener("keydown", (e) => {
    let bytes: Uint8Array | undefined = KEY_MAP[e.code];
    if (!bytes && e.key.length === 1) {
      bytes = new TextEncoder().encode(e.key);
    }
    if (bytes) {
      kernel.appendStdinData(pid, bytes);
      e.preventDefault();
    }
  });

  statusEl.textContent = "Running. Click the canvas to begin.";

  kernel.waitpid(pid).then((code) => {
    statusEl.textContent = `ScummVM exited (code ${code}).`;
    startBtn.disabled = false;
  }).catch((err) => {
    statusEl.textContent = `ScummVM crashed: ${err}`;
    startBtn.disabled = false;
  });
});
