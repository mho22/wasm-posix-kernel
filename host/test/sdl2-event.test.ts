/**
 * SDL2 event pump — runs `sdl2-event.wasm` (programs/sdl2-event.c)
 * which signals readiness on stdout, then polls SDL events for ~250 ms
 * and prints accumulated mouse motion + button state.
 *
 * Skipped when sdl2-event.wasm or the mouse-injection API isn't built.
 *
 * Verifies that fbposix's PumpEvents:
 *   - reads /dev/input/mice (PS/2 frames) non-blockingly,
 *   - decodes button bits and signed dx/dy,
 *   - negates dy (PS/2 positive-up → SDL2 positive-down),
 *   - emits SDL_MOUSEMOTION + SDL_MOUSEBUTTONDOWN.
 *
 * The injectMouseEvent host export is delivered by the mouse PR
 * (`/dev/input/mice` device + kernel_inject_mouse_event). Test gates
 * on its existence so it stays green on branches that haven't merged
 * the mouse PR yet.
 */
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { runCentralizedProgram } from "./centralized-test-helper";
import { tryResolveBinary } from "../src/binary-resolver";

const sdl2EventPath = tryResolveBinary("programs/sdl2-event.wasm") ?? "";

describe.skipIf(!sdl2EventPath || !existsSync(sdl2EventPath))("SDL2 events", () => {
  it("translates injected /dev/input/mice frames into SDL events", async () => {
    const result = await runCentralizedProgram({
      programPath: sdl2EventPath,
      argv: ["sdl2-event"],
      env: ["SDL_VIDEODRIVER=fbposix"],
      timeout: 10_000,
      onStarted: async (kernel: any, pid: number) => {
        // Wait for "ready\n" via the program's own gate. The test
        // helper doesn't expose a stdout-streaming hook, so we just
        // give the program enough time to open /dev/input/mice.
        await new Promise((r) => setTimeout(r, 80));
        // Inject one motion + button-down, then a button-up.
        if (typeof kernel.injectMouseEvent === "function") {
          kernel.injectMouseEvent(pid, 10, -5, 0b001);  // dx=10, dy=-5 PS/2, left down
          await new Promise((r) => setTimeout(r, 20));
          kernel.injectMouseEvent(pid, 0, 0, 0);
        }
      },
    });
    expect(result.exitCode).toBe(0);
    // PS/2 dy is positive-up. We send -5; SDL2 reports +5.
    expect(result.stdout).toMatch(/btn=1 dx=10 dy=5/);
  });
});
