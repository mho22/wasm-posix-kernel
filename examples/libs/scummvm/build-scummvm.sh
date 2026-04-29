#!/usr/bin/env bash
# Cross-compile ScummVM (2.8.x) for the wasm-posix-kernel toolchain
# against our SDL2 (with the fbposix video driver) build.
#
# Output: examples/libs/scummvm/scummvm.wasm
#
# Prereqs:
#   1. SDL2 already built — bash examples/libs/sdl2/build-sdl2.sh
#   2. zlib already in the sysroot (shipped)
#
# Usage: bash examples/libs/scummvm/build-scummvm.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"

source "$REPO_ROOT/sdk/activate.sh"

SCUMMVM_VERSION="${SCUMMVM_VERSION:-2.8.1}"
SRC="$HERE/scummvm-${SCUMMVM_VERSION}"

if [ ! -f "$REPO_ROOT/local-binaries/lib/libSDL2.a" ]; then
    echo "==> SDL2 not built — running build-sdl2.sh first"
    bash "$REPO_ROOT/examples/libs/sdl2/build-sdl2.sh"
fi

if [ ! -d "$SRC" ]; then
    echo "==> Fetching ScummVM ${SCUMMVM_VERSION}..."
    curl -fsSL \
        "https://github.com/scummvm/scummvm/archive/refs/tags/v${SCUMMVM_VERSION}.tar.gz" \
        | tar -xz -C "$HERE"
fi

# Apply patches idempotently.
for p in "$HERE/patches/"*.patch; do
    [ -f "$p" ] || continue
    if (cd "$SRC" && git init -q 2>/dev/null; git add -A 2>/dev/null; git apply --check "$p" 2>/dev/null); then
        echo "    $(basename "$p")"
        (cd "$SRC" && git apply "$p")
    fi
done

cd "$SRC"

# ScummVM ships a hand-rolled configure (not autoconf). Pass our
# wasm32posix-cc explicitly and point at the installed SDL2 prefix.
echo "==> Configuring ScummVM..."
./configure \
    --host=wasm32 \
    --prefix=/usr/local \
    --backend=sdl \
    --enable-static --disable-debug \
    --with-sdl-prefix="$REPO_ROOT/local-binaries" \
    --disable-mt32emu --disable-fluidsynth \
    --disable-sndio --disable-alsa \
    --disable-flac --disable-vorbis --disable-mad \
    --enable-zlib \
    --disable-mpeg2 --disable-faad --disable-fribidi \
    --disable-libcurl --disable-sdlnet \
    --disable-tts \
    --disable-all-engines \
    --enable-engine=sky \
    --enable-engine=scumm \
    CC=wasm32posix-cc \
    CXX=wasm32posix-c++ \
    AR=wasm32posix-ar \
    RANLIB=wasm32posix-ranlib

echo "==> Building ScummVM (this can take several minutes)..."
make -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"

cp scummvm "$HERE/scummvm.wasm"

# ScummVM doesn't fork; no asyncify pass needed. (vs dash, which does.)

source "$REPO_ROOT/scripts/install-local-binary.sh"
install_local_binary scummvm "$HERE/scummvm.wasm"

ls -la "$HERE/scummvm.wasm"
echo "==> ScummVM ${SCUMMVM_VERSION} built."
