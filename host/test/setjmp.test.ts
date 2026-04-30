import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runCentralizedProgram } from "./centralized-test-helper";

// Regression guard: setjmp pulls in env.__c_longjmp tag import + exercises the
// worker error-surface (if either regresses, this fails or hangs).
function hasCompiler(): boolean {
  try {
    execFileSync("wasm32posix-cc", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const SOURCE = `
#include <setjmp.h>
#include <stdio.h>
int main(void) {
    jmp_buf jb;
    int v = setjmp(jb);
    if (v == 0) longjmp(jb, 42);
    printf("after=%d\\n", v);
    return 0;
}
`;

describe.skipIf(!hasCompiler())("setjmp/longjmp", () => {
  it("returns control through longjmp without instantiation error", async () => {
    const dir = join(tmpdir(), "wasm-setjmp-test");
    mkdirSync(dir, { recursive: true });
    const src = join(dir, "setjmp_test.c");
    const out = join(dir, "setjmp_test.wasm");
    writeFileSync(src, SOURCE);
    execFileSync("wasm32posix-cc", [src, "-o", out], { stdio: "pipe" });

    const { exitCode, stdout } = await runCentralizedProgram({ programPath: out });
    expect(stdout).toContain("after=42");
    expect(exitCode).toBe(0);
  }, 30_000);
});
