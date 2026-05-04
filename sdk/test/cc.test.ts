import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildClangArgs } from '../src/bin/cc.ts';

describe('buildClangArgs', () => {
  const toolchain = {
    llvmDir: '/opt/llvm/bin',
    cc: '/opt/llvm/bin/clang',
    cxx: '/opt/llvm/bin/clang++',
    ar: '/opt/llvm/bin/llvm-ar',
    ranlib: '/opt/llvm/bin/llvm-ranlib',
    nm: '/opt/llvm/bin/llvm-nm',
    sysroot: '/tmp/sysroot',
    glueDir: '/tmp/glue',
  };

  it('compile-only: adds compile flags, no link flags', () => {
    const args = buildClangArgs(['-c', 'foo.c', '-o', 'foo.o'], toolchain);
    expect(args).toContain('--target=wasm32-unknown-unknown');
    expect(args).toContain('--sysroot=/tmp/sysroot');
    expect(args).toContain('-c');
    expect(args).toContain('foo.c');
    expect(args).not.toContain('-Wl,--entry=_start');
    expect(args.join(' ')).not.toContain('syscall_glue.c');
  });

  it('compile+link: adds both compile and link flags plus glue', () => {
    const args = buildClangArgs(['foo.c', '-o', 'foo.wasm'], toolchain);
    expect(args).toContain('--target=wasm32-unknown-unknown');
    expect(args).toContain('-Wl,--entry=_start');
    expect(args).toContain('-Wl,--import-memory');
    expect(args.join(' ')).toContain('channel_syscall.c');
    expect(args.join(' ')).toContain('compiler_rt.c');
    expect(args.join(' ')).toContain('crt1.o');
    expect(args.join(' ')).toContain('libc.a');
  });

  it('link-only: object files without -c get link flags plus compile flags for glue', () => {
    const args = buildClangArgs(['foo.o', 'bar.o', '-o', 'out.wasm'], toolchain);
    expect(args).toContain('-Wl,--entry=_start');
    expect(args.join(' ')).toContain('libc.a');
    expect(args).toContain('--target=wasm32-unknown-unknown');
    // Compile flags are present because glue .c files are compiled during linking
    expect(args).toContain('-fno-trapping-math');
    expect(args.join(' ')).toContain('channel_syscall.c');
  });

  it('preprocess-only: no link flags', () => {
    const args = buildClangArgs(['-E', 'foo.c'], toolchain);
    expect(args).not.toContain('-Wl,--entry=_start');
  });

  it('filters ignored flags', () => {
    const args = buildClangArgs(['-c', '-pthread', '-fPIC', 'foo.c'], toolchain);
    expect(args).not.toContain('-pthread');
    expect(args).not.toContain('-fPIC');
  });
});

describe('buildClangArgs GL auto-link', () => {
  // Use a real sysroot dir so existsSync passes for the GL archives.
  const tmp = mkdtempSync(join(tmpdir(), 'wpk-cc-'));
  mkdirSync(join(tmp, 'sysroot', 'lib'), { recursive: true });
  writeFileSync(join(tmp, 'sysroot', 'lib', 'libEGL.a'), '');
  writeFileSync(join(tmp, 'sysroot', 'lib', 'libGLESv2.a'), '');

  const toolchain = {
    llvmDir: '/opt/llvm/bin',
    cc: '/opt/llvm/bin/clang',
    cxx: '/opt/llvm/bin/clang++',
    ar: '/opt/llvm/bin/llvm-ar',
    ranlib: '/opt/llvm/bin/llvm-ranlib',
    nm: '/opt/llvm/bin/llvm-nm',
    sysroot: join(tmp, 'sysroot'),
    glueDir: '/tmp/glue',
  };

  function writeSrc(name: string, contents: string): string {
    const p = join(tmp, name);
    writeFileSync(p, contents);
    return p;
  }

  it('auto-links libEGL.a + libGLESv2.a when source includes <EGL/...>', () => {
    const src = writeSrc('use_egl.c', '#include <EGL/egl.h>\nint main(void){return 0;}\n');
    const args = buildClangArgs([src, '-o', 'a.wasm'], toolchain);
    expect(args.join(' ')).toContain('libEGL.a');
    expect(args.join(' ')).toContain('libGLESv2.a');
  });

  it('does not auto-link for plain hello world', () => {
    const src = writeSrc('plain.c', '#include <stdio.h>\nint main(void){}\n');
    const args = buildClangArgs([src, '-o', 'a.wasm'], toolchain);
    expect(args.join(' ')).not.toContain('libEGL.a');
    expect(args.join(' ')).not.toContain('libGLESv2.a');
  });

  it('strips -lEGL / -lGLESv2 and substitutes archive paths', () => {
    const src = writeSrc('plain2.c', 'int main(void){}\n');
    const args = buildClangArgs([src, '-lEGL', '-lGLESv2', '-o', 'a.wasm'], toolchain);
    expect(args).not.toContain('-lEGL');
    expect(args).not.toContain('-lGLESv2');
    expect(args.join(' ')).toContain('libEGL.a');
    expect(args.join(' ')).toContain('libGLESv2.a');
  });

  afterAll(() => {
    rmSync(tmp, { recursive: true, force: true });
  });
});
