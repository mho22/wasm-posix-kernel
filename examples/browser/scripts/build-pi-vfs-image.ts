/**
 * Build a pre-built VFS image containing:
 *   - npm 10.9.2 (so the user can `npm install` more packages if they want)
 *   - a staged @earendil-works/pi-coding-agent install
 *   - workspace skeleton at /work
 *   - dash + coreutils + grep + sed so Pi's `bash` tool actually runs
 *     (Pi spawns getShellConfig().shell which probes /bin/bash first)
 *
 * Produced by:
 *   1. host-side `npm install @earendil-works/pi-coding-agent` into a tmp prefix
 *      (--os=linux --cpu=x64 --omit=optional --omit=dev), unless --prefix=DIR is
 *      passed in which case that pre-existing tree is reused.
 *   2. Walking the install into the VFS image.
 *
 * Output: examples/browser/public/pi.vfs
 *
 * Usage:
 *   npx tsx examples/browser/scripts/build-pi-vfs-image.ts
 *   npx tsx examples/browser/scripts/build-pi-vfs-image.ts --prefix=/tmp/pi-host-install-XXXX
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MemoryFileSystem } from "../../../host/src/vfs/memory-fs";
import { COREUTILS_NAMES } from "../lib/init/shell-binaries";
import {
  ensureDir,
  ensureDirRecursive,
  symlink,
  walkAndWrite,
  writeVfsBinary,
  writeVfsFile,
  saveImage,
} from "./vfs-image-helpers";

const SCRIPT_DIR = new URL(".", import.meta.url).pathname;
const REPO_ROOT = join(SCRIPT_DIR, "..", "..", "..");
const NPM_DIST = join(REPO_ROOT, "examples", "libs", "npm", "dist");
const OUT_FILE = join(REPO_ROOT, "examples", "browser", "public", "pi.vfs");

const DASH_WASM = join(REPO_ROOT, "examples", "libs", "dash", "bin", "dash.wasm");
const COREUTILS_WASM = join(REPO_ROOT, "examples", "libs", "coreutils", "bin", "coreutils.wasm");
const GREP_WASM = join(REPO_ROOT, "examples", "libs", "grep", "bin", "grep.wasm");
const SED_WASM = join(REPO_ROOT, "examples", "libs", "sed", "bin", "sed.wasm");

const NPM_MOUNT = "/usr/local/lib/npm";
const WORK_MOUNT = "/work";
const PI_PKG = "@earendil-works/pi-coding-agent";

function parsePrefixArg(): string | null {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--prefix=")) return arg.slice("--prefix=".length);
  }
  return null;
}

function hostNpmInstall(): string {
  const prefix = mkdtempSync(join(tmpdir(), "pi-host-install-"));
  writeFileSync(
    join(prefix, "package.json"),
    JSON.stringify({ name: "pi-host-stage", version: "0.0.1", private: true }) + "\n",
  );
  console.log(`==> host npm install ${PI_PKG} → ${prefix} (--os=linux --cpu=x64)…`);
  execFileSync(
    "npm",
    [
      "install",
      PI_PKG,
      "--prefix", prefix,
      "--omit=optional",
      "--omit=dev",
      "--os=linux",
      "--cpu=x64",
      "--no-fund",
      "--no-audit",
      "--no-progress",
      "--loglevel=warn",
    ],
    { stdio: "inherit", env: { ...process.env, npm_config_loglevel: "warn" } },
  );
  return prefix;
}

async function main() {
  if (!existsSync(join(NPM_DIST, "bin", "npm-cli.js"))) {
    console.error(`npm dist not found at ${NPM_DIST}/bin/npm-cli.js`);
    console.error("Run: bash examples/libs/npm/build-npm.sh");
    process.exit(1);
  }

  const argPrefix = parsePrefixArg();
  const prefix = argPrefix ?? hostNpmInstall();
  const nodeModulesDir = join(prefix, "node_modules");
  const cliPath = join(nodeModulesDir, "@earendil-works/pi-coding-agent/dist/cli.js");
  if (!existsSync(cliPath)) {
    console.error(`[FAIL] cli.js missing at ${cliPath}`);
    process.exit(1);
  }

  // 256 MiB SAB: npm dist (~17 MB) + pi tree (~150 MB with full transitive
  // deps — undici, aws-sdk, etc.) + agent scratch space. The staging tree is
  // bigger than the plan's 50–60 MB estimate because npm pulls the full
  // dependency closure including aws-sdk for the @earendil-works/pi-ai
  // bedrock provider. With a smaller SAB the walk silently truncates past
  // the alphabet position the buffer fills up at — see vfs-image-helpers.ts
  // `walkAndWrite` (its per-file try/catch swallows the ENOSPC).
  const sab = new SharedArrayBuffer(256 * 1024 * 1024);
  const fs = MemoryFileSystem.create(sab);

  // Filesystem skeleton
  ensureDirRecursive(fs, "/usr/local/lib");
  ensureDir(fs, "/usr/bin");
  ensureDir(fs, "/bin");
  ensureDir(fs, "/work");
  ensureDir(fs, "/root");
  ensureDirRecursive(fs, "/root/.pi/agent");
  ensureDir(fs, "/tmp");
  // /etc/ssl/certs needs to exist before kernel-worker auto-writes the bundled
  // CA cert into /etc/ssl/certs/ca-certificates.crt on init.
  ensureDirRecursive(fs, "/etc/ssl/certs");
  fs.chmod("/tmp", 0o777);
  fs.chmod("/work", 0o777);
  fs.chmod("/root", 0o755);

  // npm dist — skip man/docs/changelog (not used at install/runtime)
  console.log(`==> mounting npm dist at ${NPM_MOUNT}…`);
  const npmWritten = walkAndWrite(fs, NPM_DIST, NPM_MOUNT, {
    exclude: (rel) =>
      rel === "man" || rel.startsWith("man/") ||
      rel === "docs" || rel.startsWith("docs/"),
  });
  console.log(`  ${npmWritten} npm files written`);

  // Staged install → /work/node_modules
  console.log(`==> mounting ${nodeModulesDir} at ${WORK_MOUNT}/node_modules…`);
  const pkgWritten = walkAndWrite(fs, nodeModulesDir, `${WORK_MOUNT}/node_modules`);
  console.log(`  ${pkgWritten} pi tree files written`);

  // Workspace package.json
  writeVfsFile(
    fs,
    `${WORK_MOUNT}/package.json`,
    JSON.stringify({ name: "pi-workspace", version: "0.0.1", private: true }, null, 2) + "\n",
    0o644,
  );

  // Shell stack — dash at /bin/bash so Pi's getShellConfig (probes
  // existsSync("/bin/bash") first) finds it; coreutils + grep + sed give the
  // agent a usable POSIX environment for ls/cat/grep/find-via-ls-R/etc.
  populateShellBinaries(fs);

  await saveImage(fs, OUT_FILE);
}

/**
 * Mount dash + coreutils + grep + sed eagerly. dash is renamed to
 * /bin/bash so Pi's getShellConfig() finds it; dash accepts `sh -c` semantics
 * identically. Coreutils ships ~95 GNU utilities as symlinks to the multicall
 * binary. grep/sed get their own slot at /usr/bin.
 *
 * The LLM doesn't know it's dash, but dash is a strict POSIX sh — bash-isms
 * (arrays, `[[ ]]`, brace expansion) won't work. In practice the model writes
 * portable commands; if it doesn't, the failure is visible and it self-corrects.
 */
function populateShellBinaries(fs: MemoryFileSystem): void {
  // Required binaries — fail loudly if missing so the user runs the right build target.
  const required: Array<[string, string]> = [
    [DASH_WASM, "./run.sh build dash"],
    [COREUTILS_WASM, "./run.sh build coreutils"],
    [GREP_WASM, "./run.sh build grep"],
    [SED_WASM, "./run.sh build sed"],
  ];
  for (const [path, hint] of required) {
    if (!existsSync(path)) {
      throw new Error(`Missing wasm binary for pi VFS: ${path}\nBuild it with: ${hint}`);
    }
  }

  console.log("==> mounting shell stack (dash + coreutils + grep + sed)…");

  // dash at /bin/bash so Pi's bash tool finds it; also symlinked as /bin/sh
  // and /bin/dash for shebangs and direct invocation.
  const dashBytes = readFileSync(DASH_WASM);
  writeVfsBinary(fs, "/bin/bash", new Uint8Array(dashBytes));
  symlink(fs, "/bin/bash", "/bin/sh");
  symlink(fs, "/bin/bash", "/bin/dash");
  symlink(fs, "/bin/bash", "/usr/bin/bash");
  symlink(fs, "/bin/bash", "/usr/bin/sh");

  // coreutils multicall binary + symlinks for every utility name (+ `[`).
  const coreutilsBytes = readFileSync(COREUTILS_WASM);
  writeVfsBinary(fs, "/bin/coreutils", new Uint8Array(coreutilsBytes));
  for (const name of [...COREUTILS_NAMES, "["]) {
    symlink(fs, "/bin/coreutils", `/bin/${name}`);
    symlink(fs, "/bin/coreutils", `/usr/bin/${name}`);
  }

  // grep + egrep/fgrep aliases.
  const grepBytes = readFileSync(GREP_WASM);
  writeVfsBinary(fs, "/usr/bin/grep", new Uint8Array(grepBytes));
  symlink(fs, "/usr/bin/grep", "/bin/grep");
  symlink(fs, "/usr/bin/grep", "/usr/bin/egrep");
  symlink(fs, "/usr/bin/grep", "/bin/egrep");
  symlink(fs, "/usr/bin/grep", "/usr/bin/fgrep");
  symlink(fs, "/usr/bin/grep", "/bin/fgrep");

  // sed.
  const sedBytes = readFileSync(SED_WASM);
  writeVfsBinary(fs, "/usr/bin/sed", new Uint8Array(sedBytes));
  symlink(fs, "/usr/bin/sed", "/bin/sed");

  console.log(
    `  shell stack mounted: dash ${(dashBytes.length / 1024).toFixed(0)}KB, ` +
    `coreutils ${(coreutilsBytes.length / 1024).toFixed(0)}KB, ` +
    `grep ${(grepBytes.length / 1024).toFixed(0)}KB, ` +
    `sed ${(sedBytes.length / 1024).toFixed(0)}KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
