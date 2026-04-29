/**
 * SDL2 smoke — runs `sdl2-smoke.wasm` (programs/sdl2-smoke.c) which:
 *
 *   - SDL_Init(SDL_INIT_VIDEO) — picks up the fbposix driver.
 *   - SDL_CreateWindow(640x400) — opens /dev/fb0 + mmaps it.
 *   - SDL_FillRect / SDL_UpdateWindowSurface — lands BGRA pixels in
 *     the framebuffer mmap (zero-copy at native size).
 *   - prints "ok" and exits.
 *
 * We assert exit-code 0 and "ok" on stdout. Pixel-level verification
 * lives in the framebuffer integration test; this smoke is the
 * SDL2-stack-up-and-running test.
 *
 * The test is gated on the SDL2-smoke binary existing — it skips if
 * SDL2 hasn't been built (bash examples/libs/sdl2/build-sdl2.sh).
 */
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { runCentralizedProgram } from "./centralized-test-helper";
import { tryResolveBinary } from "../src/binary-resolver";

const sdl2SmokePath = tryResolveBinary("programs/sdl2-smoke.wasm") ?? "";

describe.skipIf(!sdl2SmokePath || !existsSync(sdl2SmokePath))("SDL2 smoke", () => {
  it("creates a 640x400 window and lands BGRA pixels in /dev/fb0", async () => {
    const result = await runCentralizedProgram({
      programPath: sdl2SmokePath,
      argv: ["sdl2-smoke"],
      env: ["SDL_VIDEODRIVER=fbposix"],
      timeout: 10_000,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("ok");
  });
});
