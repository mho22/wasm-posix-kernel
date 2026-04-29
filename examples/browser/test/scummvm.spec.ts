/**
 * Playwright smoke for the ScummVM demo page.
 *
 * Skips when Vite can't resolve the scummvm.wasm import (i.e. the
 * binary hasn't been built — `bash examples/libs/scummvm/build-scummvm.sh`)
 * or when the demo data hasn't been fetched (no `index.json` under
 * `/assets/scummvm/<game>/`).
 *
 * Run:  cd examples/browser && npx playwright test scummvm.spec.ts
 */
import { test, expect, type Page } from "@playwright/test";

async function gotoOrSkip(page: Page, path: string) {
  await page.goto(path);
  await page.waitForTimeout(2000);
  const hasErrorOverlay = await page.evaluate(() =>
    !!document.querySelector("vite-error-overlay"),
  );
  if (hasErrorOverlay) {
    test.skip(true, "scummvm.wasm not built — Vite import error");
  }
}

test.describe("scummvm", () => {
  test("@slow tentacle-demo title screen renders pixels", async ({ page }) => {
    await gotoOrSkip(page, "/pages/scummvm/");

    // Probe the demo data index. If absent (fetch-demos.sh not run),
    // skip rather than fail.
    const ok = await page.evaluate(async () => {
      const r = await fetch("/assets/scummvm/tentacle-demo/index.json");
      return r.ok;
    });
    if (!ok) {
      test.skip(true, "tentacle-demo data not present — run fetch-demos.sh");
    }

    await page.click('button[data-game="tentacle-demo"]');
    const canvas = page.locator("#fb");
    await expect(canvas).toBeVisible();

    // Wait for SDL_Init + first frame. ScummVM's launcher picks the
    // demo automatically with --auto-detect; the title screen lands
    // within ~10 s on a warm cache.
    await page.waitForTimeout(10_000);

    // Sample a 64x64 region near the centre. A title screen carries
    // appreciable colour entropy; an all-black / all-blue surface
    // would have ≤ 2 distinct colours.
    const distinct = await canvas.evaluate((cv: HTMLCanvasElement) => {
      const ctx = cv.getContext("2d");
      if (!ctx) return 0;
      const id = ctx.getImageData(cv.width / 2 - 32, cv.height / 2 - 32, 64, 64);
      const seen = new Set<number>();
      for (let i = 0; i < id.data.length; i += 4) {
        seen.add(
          id.data[i] | (id.data[i + 1] << 8) | (id.data[i + 2] << 16),
        );
      }
      return seen.size;
    });
    expect(distinct).toBeGreaterThan(8);
  });
});
