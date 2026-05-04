/**
 * Spinning-cube browser demo.
 *
 * Pipeline:
 *   1. BrowserKernel boots.
 *   2. Pre-pick a pid (kernel.nextPid) and call attachGlCanvas before
 *      spawn(). The canvas is queued in the registry's pendingCanvases
 *      until host_gl_bind fires (mmap of /dev/dri/renderD128 in the
 *      parent's eglInitialize); this avoids a race where eglCreateContext
 *      runs before the main-thread message arrives.
 *   3. Spawn cube.wasm — it pipe()s + fork()s, parent walks
 *      eglGetDisplay → ... → eglMakeCurrent → blocking read on the
 *      pipe per frame; child computes rotation and writes frames.
 *      On its first stdout line the parent prints both pids; we
 *      capture the child pid below for Stop/Resume targeting.
 *   4. Stop/Resume: kernel.sendSignal(childPid, SIGUSR1). The child
 *      is parked in usleep(2) between frames — sendSignalToProcess
 *      wakes pendingSleeps via completeSleepWithSignalCheck, which
 *      delivers the signal cleanly through EINTR. The child's
 *      handler toggles a `paused` flag; while paused it skips frame
 *      writes, so the parent's blocking read parks on the pipe and
 *      the OffscreenCanvas keeps its last committed frame.
 *
 *      Why the child and not the parent: parent is parked in
 *      read(pipe), which lives in pendingPipeReaders. sendSignal
 *      doesn't wake that map, so the signal would queue forever.
 *      The child's usleep is the wake-able park.
 *   5. The gldemo:* Playwright spec waits ~2s, screenshots the canvas,
 *      and asserts a non-trivial fraction of pixels are non-clear.
 */
import { BrowserKernel } from "../../lib/browser-kernel";
import cubeUrl from "@binaries/programs/wasm32/cube.wasm?url";
import kernelWasmUrl from "@kernel-wasm?url";

declare global {
  interface Window {
    __glStarted?: boolean;
    __glPaused?: boolean;
  }
}

const SIGUSR1 = 10;

const startBtn = document.getElementById("start") as HTMLButtonElement;
const stopBtn = document.getElementById("stop") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;
const fpsEl = document.getElementById("fps")!;

let kernel: BrowserKernel | null = null;
let cubePid: number | null = null;
let childPid: number | null = null;
let isPaused = false;

function decodeAndShow(label: string, data: Uint8Array, console_fn: (...args: unknown[]) => void) {
  const text = new TextDecoder().decode(data);
  console_fn(`[cube ${label}]`, text);
  // The parent prints "cube: forked child pid N, parent pid M" once on
  // boot — capture N so Stop/Resume can target the child directly.
  const childMatch = text.match(/forked child pid (\d+)/);
  if (childMatch) childPid = parseInt(childMatch[1], 10);
  // Surface FPS lines into the page.
  const fpsMatch = text.match(/cube:\s+(\d+)\s+fps/);
  if (fpsMatch) fpsEl.textContent = `${fpsMatch[1]} fps`;
}

function setPaused(paused: boolean) {
  isPaused = paused;
  window.__glPaused = paused;
  if (paused) {
    statusEl.textContent = "Paused. Click Resume to keep spinning.";
    startBtn.textContent = "Resume";
    startBtn.disabled = false;
    stopBtn.disabled = true;
    fpsEl.textContent = "paused";
  } else {
    statusEl.textContent = "Cube running.";
    startBtn.textContent = "Start";
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }
}

startBtn.addEventListener("click", async () => {
  // Two roles: cold-start a fresh kernel, or resume a paused process.
  if (kernel !== null && childPid !== null && isPaused) {
    kernel.sendSignal(childPid, SIGUSR1);
    setPaused(false);
    return;
  }

  startBtn.disabled = true;
  statusEl.textContent = "Booting kernel…";

  kernel = new BrowserKernel({
    onStdout: (d) => decodeAndShow("stdout", d, console.log),
    onStderr: (d) => decodeAndShow("stderr", d, console.warn),
  });

  const kernelBytes = await fetch(kernelWasmUrl).then((r) => r.arrayBuffer());
  await kernel.init(kernelBytes);

  statusEl.textContent = "Loading cube.wasm…";
  const cubeBytes = await fetch(cubeUrl).then((r) => r.arrayBuffer());

  // Pre-pick the pid spawn() will use, then attach the canvas before
  // the kernel sees host_gl_bind. attachGlCanvas posts gl_attach_canvas
  // to the worker; the registry queues it in pendingCanvases and drains
  // on bind.
  const pid = kernel.nextPid;
  cubePid = pid;
  const canvas = document.getElementById("gl") as HTMLCanvasElement;
  kernel.attachGlCanvas(pid, canvas);

  statusEl.textContent = "Spawning cube (parent + forked child)…";
  stopBtn.disabled = false;
  window.__glStarted = true;
  setPaused(false);

  kernel.spawn(cubeBytes, ["cube"], { env: ["HOME=/home"] })
    .then((status) => {
      // Natural exit (only via terminateProcess in this UX). Reset state
      // so a fresh Start cycles cleanly.
      statusEl.textContent =
        status === 0
          ? "cube exited cleanly."
          : `cube exited with status ${status}.`;
      cubePid = null;
      childPid = null;
      stopBtn.disabled = true;
      startBtn.disabled = false;
      startBtn.textContent = "Start";
      fpsEl.textContent = "";
      isPaused = false;
      window.__glPaused = false;
    })
    .catch((err) => {
      statusEl.textContent = `cube error: ${err?.message ?? err}`;
      cubePid = null;
      childPid = null;
      stopBtn.disabled = true;
      startBtn.disabled = false;
      startBtn.textContent = "Start";
    });
});

stopBtn.addEventListener("click", () => {
  if (kernel === null || childPid === null || isPaused) return;
  // Toggle the cube's pause flag. SIGUSR1 wakes the child from its
  // per-frame usleep via completeSleepWithSignalCheck; the child's
  // handler flips `paused` and the next iteration skips the write.
  // The parent then parks in read(pipe) until the next Resume.
  kernel.sendSignal(childPid, SIGUSR1);
  setPaused(true);
});
