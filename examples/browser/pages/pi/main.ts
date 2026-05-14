/**
 * Pi coding agent browser demo — @earendil-works/pi-coding-agent running on
 * QuickJS-NG inside the POSIX kernel.
 *
 * The page loads:
 *   - host/wasm/wasm_posix_kernel.wasm  → kernel
 *   - examples/libs/quickjs/bin/node.wasm → node runtime
 *   - examples/browser/public/pi.vfs → npm + pi-coding-agent install
 *
 * Routing: dnsAliases configures the TLS backend so the `llm.local`
 * sentinel hostname resolves through host fetch + CORS proxy to the
 * agent's LLM endpoint at api.anthropic.com.
 *
 * Tool surface (passed via Pi's `--tools` allowlist): read, edit, write, bash,
 * ls. The `bash` tool spawns /bin/bash (which is dash.wasm — Pi probes
 * existsSync("/bin/bash") first; dash accepts `-c` identically). coreutils +
 * grep + sed are baked into the VFS so common shell invocations work. Pi's
 * `grep` and `find` *tools* are intentionally excluded from the allowlist —
 * they try to ensureTool() native rg/fd binaries from GitHub which won't run
 * here; the model uses the bash tool with `grep -rn` / `ls -R | grep` instead.
 *
 * /work in the in-memory VFS persists only for the session's lifetime.
 */
import { BrowserKernel } from "../../lib/browser-kernel";
import { PtyTerminal } from "../../lib/pty-terminal";
import { MemoryFileSystem } from "../../../../host/src/vfs/memory-fs";
import kernelWasmUrl from "../../../../host/wasm/wasm_posix_kernel.wasm?url";
import nodeWasmUrl from "../../../../examples/libs/quickjs/bin/node.wasm?url";
import "@xterm/xterm/css/xterm.css";

const VFS_IMAGE_URL = import.meta.env.BASE_URL + "pi.vfs";
const PI_CLI_PATH = "/work/node_modules/@earendil-works/pi-coding-agent/dist/cli.js";

const DNS_ALIASES: Record<string, string> = {
  "llm.local": "https://api.anthropic.com",
};

const terminalContainer = document.getElementById("terminal") as HTMLDivElement;

async function loadBinaries(): Promise<{
  kernelBytes: ArrayBuffer;
  nodeBytes: ArrayBuffer;
  vfsImageBuf: ArrayBuffer;
  banner: string;
}> {
  const [kernelBytes, nodeBytes, vfsImageBuf] = await Promise.all([
    fetch(kernelWasmUrl).then((r) => r.arrayBuffer()),
    fetch(nodeWasmUrl).then((r) => r.arrayBuffer()),
    fetch(VFS_IMAGE_URL).then((r) => {
      if (!r.ok) {
        throw new Error(
          `Failed to load VFS image from ${VFS_IMAGE_URL} (${r.status}). ` +
            "Run `./run.sh pi-vfs` to build it.",
        );
      }
      return r.arrayBuffer();
    }),
  ]);
  const banner = [
    `Kernel: ${(kernelBytes.byteLength / 1024).toFixed(0)}KB`,
    `node.wasm: ${(nodeBytes.byteLength / (1024 * 1024)).toFixed(1)}MB`,
    `pi VFS: ${(vfsImageBuf.byteLength / (1024 * 1024)).toFixed(1)}MB`,
  ].join(", ");
  return { kernelBytes, nodeBytes, vfsImageBuf, banner };
}

async function startAgent() {
  terminalContainer.innerHTML = "";
  let ptyTerminal: PtyTerminal | null = null;

  try {
    const { kernelBytes, nodeBytes, vfsImageBuf, banner } = await loadBinaries();

    const memfs = MemoryFileSystem.fromImage(new Uint8Array(vfsImageBuf), {
      maxByteLength: 256 * 1024 * 1024,
    });

    const kernel = new BrowserKernel({ memfs, dnsAliases: DNS_ALIASES });
    await kernel.init(kernelBytes);

    ptyTerminal = new PtyTerminal(terminalContainer, kernel);
    ptyTerminal.terminal.writeln(banner);
    ptyTerminal.terminal.writeln(
      "\x1b[90m[pi] Tools enabled: read, edit, write, bash, ls. " +
        "The `bash` tool runs dash (POSIX sh) with coreutils + grep + sed " +
        "in PATH. Files in /work persist for this session only.\r\n" +
        "Type \x1b[33m/login\x1b[90m in the prompt below to enter your API key " +
        "(stored at /root/.pi/agent/auth.json — gone on reload).\x1b[0m",
    );
    ptyTerminal.terminal.focus();

    const exitCode = await ptyTerminal.spawn(
      nodeBytes,
      // --tools allowlist: only the tools that actually work in this VFS.
      // Pi's grep/find tools spawn ripgrep/fd, which we don't ship; bash + ls
      // + read/edit/write cover everything we need.
      ["node", PI_CLI_PATH, "--tools", "read,edit,write,bash,ls"],
      {
        cwd: "/work",
        env: [
          // Deliberately NOT setting ANTHROPIC_API_KEY — Pi falls back to
          // its /login flow in the TUI, which writes /root/.pi/agent/auth.json
          // inside the in-memory VFS. That file disappears on reload, so the
          // key never persists outside this tab's lifetime.
          "ANTHROPIC_BASE_URL=http://llm.local/v1",
          "HOME=/root",
          "PWD=/work",
          "TMPDIR=/tmp",
          "TERM=xterm-256color",
          "LANG=en_US.UTF-8",
          "PATH=/usr/local/bin:/usr/bin:/bin",
          // /bin/bash is dash.wasm (POSIX sh). Pi's getShellConfig probes
          // existsSync("/bin/bash") first, so we don't strictly need SHELL,
          // but set it anyway for any tool that consults the env var.
          "SHELL=/bin/bash",
          "PI_TELEMETRY=0",
          "SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt",
          "SSL_CERT_DIR=/etc/ssl/certs",
        ],
      },
    );
    ptyTerminal.terminal.writeln(`\r\n[pi exited with code ${exitCode}]`);
  } catch (e) {
    if (ptyTerminal) {
      ptyTerminal.terminal.writeln(`\r\nError: ${e}`);
    }
    console.error(e);
  }
}

startAgent();
