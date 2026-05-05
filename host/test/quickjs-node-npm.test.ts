import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCentralizedProgram } from "./centralized-test-helper";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NODE = join(__dirname, "../../examples/libs/quickjs/bin/node.wasm");
const NPM_DIST = join(__dirname, "../../examples/libs/npm/dist");
const NPM_CLI = join(NPM_DIST, "bin/npm-cli.js");
const HAS_NODE = existsSync(NODE);
const HAS_NPM = existsSync(NPM_CLI);

/* These tests exercise the bootstrap.js + node-main.c changes that make
   npm 10.9.2 boot under our QuickJS Node-compat layer. They cover the
   CommonJS require subsystem (script-relative basedir, console.error/warn
   shims, package.json#main resolution, shared module cache, fs/promises
   builtin), the events module export shape (must be the EventEmitter class
   itself so `class T extends require('events')` reaches its own prototype),
   and the C-side ESM module normalizer that resolves bare specifiers
   (`import('chalk')`), `#imports` subpaths, and `node:` builtins for
   dynamic import() inside CJS modules. */
describe.skipIf(!HAS_NODE || !HAS_NPM)("npm 10.9.2 bootstrap (Phase 5)", () => {
  it("require('events') is the EventEmitter class — `class T extends require('events')` reaches derived methods", { timeout: 15_000 }, async () => {
    const src = `
      const EE = require('events');
      class T extends EE {
        finish() { return 'finish-ok'; }
        ping() { return 'ping-ok'; }
      }
      const t = new T();
      const protoNames = Object.getOwnPropertyNames(Object.getPrototypeOf(t)).sort().join(',');
      console.log(JSON.stringify({
        finish: typeof t.finish,
        ping: typeof t.ping,
        finishCall: t.finish(),
        pingCall: t.ping(),
        emitInherited: typeof t.emit,
        protoNamesContainsFinish: protoNames.includes('finish'),
      }));
    `;
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", src],
      timeout: 15_000,
    });
    expect(r.exitCode).toBe(0);
    const out = JSON.parse(r.stdout.trim());
    expect(out).toEqual({
      finish: "function",
      ping: "function",
      finishCall: "finish-ok",
      pingCall: "ping-ok",
      emitInherited: "function",
      protoNamesContainsFinish: true,
    });
  });

  it("process.emit('output', ...) reaches a pre-installed listener (proc-log compat)", { timeout: 15_000 }, async () => {
    const src = `
      const { output } = require('${NPM_DIST}/node_modules/proc-log');
      process.on('output', (...args) => process.stdout.write('SAW:' + JSON.stringify(args) + '\\n'));
      output.standard('hello');
    `;
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", src],
      timeout: 15_000,
    });
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('SAW:["standard","hello"]');
  });

  it("console.error / console.warn shims write to stderr-stream", { timeout: 15_000 }, async () => {
    const src = `
      console.error('err-line');
      console.warn('warn-line');
      process.stdout.write('done\\n');
    `;
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", src],
      timeout: 15_000,
    });
    expect(r.exitCode).toBe(0);
    expect(r.stdout + r.stderr).toContain("err-line");
    expect(r.stdout + r.stderr).toContain("warn-line");
    expect(r.stdout).toContain("done");
  });

  it("require('node:fs/promises') is a builtin module", { timeout: 15_000 }, async () => {
    const src = `
      const fsp = require('node:fs/promises');
      console.log(JSON.stringify({
        readFile: typeof fsp.readFile,
        writeFile: typeof fsp.writeFile,
        mkdir: typeof fsp.mkdir,
      }));
    `;
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", src],
      timeout: 15_000,
    });
    expect(r.exitCode).toBe(0);
    const out = JSON.parse(r.stdout.trim());
    expect(out.readFile).toBe("function");
    expect(out.writeFile).toBe("function");
    expect(out.mkdir).toBe("function");
  });

  it("require resolves a directory to package.json#main (graceful-fs shape)", { timeout: 15_000 }, async () => {
    const src = `
      // graceful-fs is a real npm dep with package.json#main = 'graceful-fs.js'
      // Pre-fix: the resolver returned the directory itself; loadFile got null;
      // exports was {} and gracefulify was undefined.
      const gfs = require('${NPM_DIST}/node_modules/graceful-fs');
      console.log(JSON.stringify({ gracefulify: typeof gfs.gracefulify }));
    `;
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", src],
      timeout: 15_000,
    });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout.trim())).toEqual({ gracefulify: "function" });
  });

  it("module cache is shared across requires (no infinite recursion on circular deps)", { timeout: 15_000 }, async () => {
    const src = `
      // npm's lib/npm.js ↔ lib/utils/queryable.js are circular; pre-fix the
      // module cache lived inside _makeRequire so each module got its own
      // cache, causing 'Maximum call stack size exceeded' on circular requires.
      const npmJs = require('${NPM_DIST}/lib/npm.js');
      console.log(JSON.stringify({ ctor: typeof npmJs }));
    `;
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", "-e", src],
      timeout: 15_000,
    });
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout.trim())).toEqual({ ctor: "function" });
  });

  it("`node ${NPM_CLI} --version` prints 10.9.2 (full e2e)", { timeout: 30_000 }, async () => {
    const r = await runCentralizedProgram({
      programPath: NODE,
      argv: ["node", NPM_CLI, "--version"],
      timeout: 30_000,
    });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("10.9.2");
  });
});
