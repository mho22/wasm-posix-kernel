import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runCentralizedProgram } from "./centralized-test-helper";

const __dirname = dirname(fileURLToPath(import.meta.url));
const QJS = join(__dirname, "../../examples/libs/quickjs/bin/qjs.wasm");
const NODE = join(__dirname, "../../examples/libs/quickjs/bin/node.wasm");
const HAS_QJS = existsSync(QJS);
const HAS_NODE = existsSync(NODE);

describe.skipIf(!HAS_QJS)("qjs.wasm eval smoke", () => {
  it.each([
    ["print(1+1)", "2"],
    ["print('hello')", "hello"],
    ["print([1,2,3].map(x=>x*2).join(','))", "2,4,6"],
  ])("qjs -e %s prints %s", async (src, expected) => {
    const r = await runCentralizedProgram({
      programPath: QJS,
      argv: ["qjs", "-e", src],
      timeout: 20_000,
    });
    expect(r.stderr).not.toContain("Maximum call stack size");
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe(expected);
  });
});

describe.skipIf(!HAS_NODE)("node.wasm eval smoke", () => {
  it("node -e console.log(1+1) prints 2", async () => {
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", "console.log(1+1)"],
      timeout: 20_000,
    });
    expect(r.stderr).not.toContain("Maximum call stack size");
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("2");
  });
});
