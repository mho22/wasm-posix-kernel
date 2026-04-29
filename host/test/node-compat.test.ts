/**
 * Node.js compatibility layer tests.
 *
 * Tests the node.wasm binary which provides Node.js API compatibility
 * via QuickJS-NG. This is NOT Node.js — it's a compatibility layer.
 */

import { describe, it, expect } from "vitest";
import { runCentralizedProgram } from "./centralized-test-helper";
import { tryResolveBinary } from "../src/binary-resolver";

const nodeWasm = tryResolveBinary("programs/quickjs/node.wasm");
const hasNode = !!nodeWasm;

describe.skipIf(!hasNode)("Node.js compat (node.wasm)", () => {
  it("evaluates a simple expression", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: ["node", "-e", 'console.log("hello node")'],
    });
    expect(result.stdout).toContain("hello node");
    expect(result.exitCode).toBe(0);
  });

  it("has process global", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        'console.log("arch:", process.arch); console.log("platform:", process.platform); console.log("version:", process.version)',
      ],
    });
    expect(result.stdout).toContain("arch: wasm32");
    expect(result.stdout).toContain("platform: linux");
    expect(result.stdout).toContain("version: v22.0.0");
    expect(result.exitCode).toBe(0);
  });

  it("has Buffer global", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var b = Buffer.from("hello")',
          'console.log("isBuffer:", Buffer.isBuffer(b))',
          'console.log("toString:", b.toString())',
          'console.log("hex:", b.toString("hex"))',
          'console.log("length:", b.length)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("isBuffer: true");
    expect(result.stdout).toContain("toString: hello");
    expect(result.stdout).toContain("hex: 68656c6c6f");
    expect(result.stdout).toContain("length: 5");
    expect(result.exitCode).toBe(0);
  });

  it("require('path') works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var path = require("path")',
          'console.log("join:", path.join("/usr", "bin", "node"))',
          'console.log("dirname:", path.dirname("/usr/bin/node"))',
          'console.log("basename:", path.basename("/usr/bin/node"))',
          'console.log("extname:", path.extname("file.js"))',
          'console.log("isAbsolute:", path.isAbsolute("/usr"))',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("join: /usr/bin/node");
    expect(result.stdout).toContain("dirname: /usr/bin");
    expect(result.stdout).toContain("basename: node");
    expect(result.stdout).toContain("extname: .js");
    expect(result.stdout).toContain("isAbsolute: true");
    expect(result.exitCode).toBe(0);
  });

  it("require('fs') works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var fs = require("fs")',
          'fs.writeFileSync("/tmp/node-test.txt", "hello fs")',
          'var data = fs.readFileSync("/tmp/node-test.txt", "utf8")',
          'console.log("read:", data)',
          'console.log("exists:", fs.existsSync("/tmp/node-test.txt"))',
          'fs.unlinkSync("/tmp/node-test.txt")',
          'console.log("deleted:", !fs.existsSync("/tmp/node-test.txt"))',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("read: hello fs");
    expect(result.stdout).toContain("exists: true");
    expect(result.stdout).toContain("deleted: true");
    expect(result.exitCode).toBe(0);
  });

  it("require('events') works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var EventEmitter = require("events").EventEmitter',
          'var ee = new EventEmitter()',
          'var received = false',
          'ee.on("test", function(val) { received = val })',
          'ee.emit("test", 42)',
          'console.log("received:", received)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("received: 42");
    expect(result.exitCode).toBe(0);
  });

  it("require('os') works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var os = require("os")',
          'console.log("platform:", os.platform())',
          'console.log("arch:", os.arch())',
          'console.log("EOL:", JSON.stringify(os.EOL))',
          'console.log("tmpdir:", os.tmpdir())',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain('platform: linux');
    expect(result.stdout).toContain('arch: wasm32');
    expect(result.stdout).toContain('EOL: "\\n"');
    expect(result.stdout).toContain('tmpdir: /tmp');
    expect(result.exitCode).toBe(0);
  });

  it("require('util') works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var util = require("util")',
          'console.log("format:", util.format("hello %s %d", "world", 42))',
          'console.log("inspect:", util.inspect({a: 1, b: [2, 3]}))',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("format: hello world 42");
    expect(result.stdout).toContain("inspect:");
    expect(result.exitCode).toBe(0);
  });

  it("require with node: prefix works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var path = require("node:path")',
          'var fs = require("node:fs")',
          'console.log("path.sep:", path.sep)',
          'console.log("fs.constants:", typeof fs.constants)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("path.sep: /");
    expect(result.stdout).toContain("fs.constants: object");
    expect(result.exitCode).toBe(0);
  });

  it("process.argv works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: ["node", "-e", 'console.log("argv:", JSON.stringify(process.argv))'],
    });
    expect(result.stdout).toContain("argv:");
    // argv should be an array
    const match = result.stdout.match(/argv: (\[.*\])/);
    expect(match).toBeTruthy();
    const argv = JSON.parse(match![1]);
    expect(Array.isArray(argv)).toBe(true);
    expect(result.exitCode).toBe(0);
  });

  it("prints version with --version", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: ["node", "--version"],
    });
    expect(result.stdout).toContain("v22.0.0");
    expect(result.exitCode).toBe(0);
  });

  it("require('assert') works", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var assert = require("assert")',
          'assert.strictEqual(1, 1)',
          'assert.deepStrictEqual({a: 1}, {a: 1})',
          'console.log("assert: ok")',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("assert: ok");
    expect(result.exitCode).toBe(0);
  });

  // -----------------------------------------------------------------
  // crypto module — libcrypto-backed via qjs:crypto-bridge.
  // Phase B of the Claude Code port (docs/plans/2026-04-29-claude-code-cli-plan.md).
  // -----------------------------------------------------------------
  it("crypto.createHash('sha256') matches RFC 6234 vector", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var h = c.createHash("sha256").update("abc").digest("hex")',
          'console.log("sha256:", h)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain(
      "sha256: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(result.exitCode).toBe(0);
  });

  it("crypto.createHash('sha1') matches FIPS 180-1 vector", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var h = c.createHash("sha1").update("abc").digest("hex")',
          'console.log("sha1:", h)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain(
      "sha1: a9993e364706816aba3e25717850c26c9cd0d89d",
    );
    expect(result.exitCode).toBe(0);
  });

  it("crypto.createHash chains update calls", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          // a + b + c == abc
          'var h = c.createHash("sha256").update("a").update("b").update("c").digest("hex")',
          'console.log("chain:", h)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain(
      "chain: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(result.exitCode).toBe(0);
  });

  it("crypto.createHmac('sha256') matches RFC 4231 test case 4", async () => {
    // RFC 4231 case 4: key = 0x01 .. 0x19 (25 bytes), data = 0xcd x 50.
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var key = Buffer.alloc(25); for (var i=0;i<25;i++) key[i]=i+1',
          'var data = Buffer.alloc(50); data.fill(0xcd)',
          'var h = c.createHmac("sha256", key).update(data).digest("hex")',
          'console.log("hmac:", h)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain(
      "hmac: 82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b",
    );
    expect(result.exitCode).toBe(0);
  });

  it("crypto.randomUUID returns a valid v4 UUID", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var u = c.randomUUID()',
          'console.log("uuid:", u)',
        ].join(";"),
      ],
    });
    const m = result.stdout.match(
      /uuid: ([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/,
    );
    expect(m).not.toBeNull();
    expect(result.exitCode).toBe(0);
  });

  it("crypto.randomBytes returns the requested length", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var b = c.randomBytes(32)',
          'console.log("len:", b.length)',
          'console.log("hex_len:", b.toString("hex").length)',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("len: 32");
    expect(result.stdout).toContain("hex_len: 64");
    expect(result.exitCode).toBe(0);
  });

  it("crypto.createHash digest() with no encoding returns Buffer", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var b = c.createHash("sha256").update("abc").digest()',
          'console.log("isBuffer:", Buffer.isBuffer(b))',
          'console.log("len:", b.length)',
          'console.log("hex:", b.toString("hex"))',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("isBuffer: true");
    expect(result.stdout).toContain("len: 32");
    expect(result.stdout).toContain(
      "hex: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(result.exitCode).toBe(0);
  });

  it("crypto.timingSafeEqual on equal/unequal buffers", async () => {
    const result = await runCentralizedProgram({
      programPath: nodeWasm!,
      argv: [
        "node", "-e",
        [
          'var c = require("crypto")',
          'var a = Buffer.from([1,2,3,4]); var b = Buffer.from([1,2,3,4])',
          'console.log("eq:", c.timingSafeEqual(a, b))',
          'var d = Buffer.from([1,2,3,5])',
          'console.log("ne:", c.timingSafeEqual(a, d))',
        ].join(";"),
      ],
    });
    expect(result.stdout).toContain("eq: true");
    expect(result.stdout).toContain("ne: false");
    expect(result.exitCode).toBe(0);
  });
});
