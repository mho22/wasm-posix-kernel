#!/usr/bin/env bash
#
# Build ScummVM (scummvm.wasm) for wasm-posix-kernel.
#
# Engine subset: sky + queen + lure (the freeware-redistributable
# adventure-game subset chosen in docs/plans/2026-04-29-scummvm-design.md).
#
# Honors the dep-resolver build-script contract. When invoked via
# `cargo xtask build-deps resolve scummvm`, env vars are set by the
# resolver; for ad-hoc invocation the script falls back to in-tree
# layouts and the sysroot-staged libs.
#
#     WASM_POSIX_DEP_OUT_DIR        # where to `make install`
#     WASM_POSIX_DEP_VERSION        # upstream version (e.g. 2.8.0)
#     WASM_POSIX_DEP_SOURCE_URL     # tarball URL
#     WASM_POSIX_DEP_SOURCE_SHA256  # expected sha256 of the tarball
#     WASM_POSIX_DEP_ZLIB_DIR       # zlib prefix
#     WASM_POSIX_DEP_LIBPNG_DIR     # libpng prefix
#     WASM_POSIX_DEP_FREETYPE_DIR   # freetype prefix
#     WASM_POSIX_DEP_SDL2_DIR       # SDL2 prefix
#
# Prerequisites: SDL2 must be available with `wasmposix` video, `oss`
# audio, and mice+termios input drivers (sibling task; see plan).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SRC_DIR="$SCRIPT_DIR/scummvm-src"

# shellcheck source=/dev/null
source "$REPO_ROOT/sdk/activate.sh"

SCUMMVM_VERSION="${WASM_POSIX_DEP_VERSION:-${SCUMMVM_VERSION:-2.8.0}}"
INSTALL_DIR="${WASM_POSIX_DEP_OUT_DIR:-$SCRIPT_DIR/scummvm-install}"
SOURCE_URL="${WASM_POSIX_DEP_SOURCE_URL:-https://github.com/scummvm/scummvm/archive/refs/tags/v${SCUMMVM_VERSION}.tar.gz}"
SOURCE_SHA256="${WASM_POSIX_DEP_SOURCE_SHA256:-}"

BUILD_DIR="$SCRIPT_DIR/scummvm-build"

if ! command -v wasm32posix-c++ &>/dev/null; then
    echo "ERROR: wasm32posix-c++ not found. Source sdk/activate.sh first." >&2
    exit 1
fi

# --- Locate dependencies ---
SYSROOT="${WASM_POSIX_SYSROOT:-$REPO_ROOT/sysroot}"

resolve_dep() {
    local name="$1" var="$2" probe="$3"
    local prefix="${!var:-}"
    if [ -z "$prefix" ]; then
        if [ -f "$SYSROOT/$probe" ]; then
            prefix="$SYSROOT"
        else
            echo "ERROR: $name not found. Set $var or stage $probe into $SYSROOT/." >&2
            exit 1
        fi
    fi
    echo "$prefix"
}

ZLIB_PREFIX="$(resolve_dep    zlib     WASM_POSIX_DEP_ZLIB_DIR     lib/libz.a)"
LIBPNG_PREFIX="$(resolve_dep  libpng   WASM_POSIX_DEP_LIBPNG_DIR   lib/libpng16.a)"
FREETYPE_PREFIX="$(resolve_dep freetype WASM_POSIX_DEP_FREETYPE_DIR lib/libfreetype.a)"
SDL2_PREFIX="$(resolve_dep    SDL2     WASM_POSIX_DEP_SDL2_DIR     lib/libSDL2.a)"

# --- Fetch + verify source ---
if [ ! -d "$SRC_DIR" ]; then
    echo "==> Downloading ScummVM $SCUMMVM_VERSION..."
    TARBALL="/tmp/scummvm-${SCUMMVM_VERSION}.tar.gz"
    curl -fsSL "$SOURCE_URL" -o "$TARBALL"
    if [ -n "$SOURCE_SHA256" ]; then
        echo "==> Verifying source sha256..."
        echo "$SOURCE_SHA256  $TARBALL" | shasum -a 256 -c -
    else
        echo "==> (no SOURCE_SHA256 declared; skipping verification — set one in deps.toml after first build)"
    fi
    mkdir -p "$SRC_DIR"
    tar xf "$TARBALL" -C "$SRC_DIR" --strip-components=1
    rm "$TARBALL"
fi

# --- Apply project-local cross-compile patches idempotently (fbdoom pattern) ---
if [ -d "$SCRIPT_DIR/patches" ]; then
    for p in "$SCRIPT_DIR/patches"/*.patch; do
        [ -e "$p" ] || break  # no patches yet
        if (cd "$SRC_DIR" && git apply --check "$p" 2>/dev/null); then
            echo "==> Applying patch $(basename "$p")..."
            (cd "$SRC_DIR" && git apply "$p")
        fi
    done
fi

# Fresh build dir (ScummVM's configure caches paths; rerunning from a stale
# build dir with a different INSTALL_DIR installs to the wrong prefix).
rm -rf "$BUILD_DIR" "$INSTALL_DIR"
mkdir -p "$BUILD_DIR"

# ScummVM uses its own custom configure shell script (NOT autoconf). It
# accepts --host= and inspects $CC / $CXX / $CFLAGS / $CXXFLAGS / $LDFLAGS
# from the environment. Cross-builds also need explicit --enable-static
# and the SDL2 prefix on PATH so its sdl2-config probe finds the right
# one (NOT the host's Homebrew one).
echo "==> Configuring ScummVM..."
(
    cd "$BUILD_DIR"

    # Make our SDL2's sdl2-config win over any host copy. ScummVM's configure
    # runs `sdl2-config --version` to detect SDL2 — order on PATH matters.
    export PATH="$SDL2_PREFIX/bin:$PATH"

    CC=wasm32posix-cc \
    CXX=wasm32posix-c++ \
    AR=wasm32posix-ar \
    RANLIB=wasm32posix-ranlib \
    CXXFLAGS="-O2 -I$ZLIB_PREFIX/include -I$LIBPNG_PREFIX/include -I$LIBPNG_PREFIX/include/libpng16 -I$FREETYPE_PREFIX/include/freetype2" \
    CFLAGS="-O2 -I$ZLIB_PREFIX/include -I$LIBPNG_PREFIX/include -I$LIBPNG_PREFIX/include/libpng16 -I$FREETYPE_PREFIX/include/freetype2" \
    LDFLAGS="-L$ZLIB_PREFIX/lib -L$LIBPNG_PREFIX/lib -L$FREETYPE_PREFIX/lib -L$SDL2_PREFIX/lib" \
    "$SRC_DIR/configure" \
        --host=wasm32-unknown-linux-musl \
        --backend=sdl \
        --prefix="$INSTALL_DIR" \
        --enable-static \
        --disable-debug \
        --disable-all-engines \
        --enable-engine=sky \
        --enable-engine=queen \
        --enable-engine=lure \
        --enable-zlib \
        --enable-png \
        --enable-freetype2 \
        --disable-mt32emu \
        --disable-fluidsynth \
        --disable-libcurl \
        --disable-cloud \
        --disable-libsmpeg \
        --disable-mpeg2 \
        --disable-theoradec \
        --disable-faad \
        --disable-mad \
        --disable-flac \
        --disable-vorbis \
        --disable-jpeg \
        --disable-libunity \
        --disable-taskbar \
        --disable-discord \
        --disable-tts \
        --disable-eventrecorder \
        --disable-readline \
        --disable-update-checking \
        --disable-detection-static

    echo "==> Building ScummVM..."
    make -j"$(sysctl -n hw.ncpu 2>/dev/null || nproc)"
)

# Per project convention, every shipped binary goes through fork-instrument.
# ScummVM doesn't fork — but the instrumentation pass is also where wasm
# module finalization happens, so we keep the convention.
if [ -x "$REPO_ROOT/tools/bin/wasm-fork-instrument" ]; then
    echo "==> Running wasm-fork-instrument..."
    "$REPO_ROOT/tools/bin/wasm-fork-instrument" "$BUILD_DIR/scummvm" "$BUILD_DIR/scummvm.wasm" \
        || cp "$BUILD_DIR/scummvm" "$BUILD_DIR/scummvm.wasm"
else
    echo "==> wasm-fork-instrument not available; using build artifact as-is."
    cp "$BUILD_DIR/scummvm" "$BUILD_DIR/scummvm.wasm"
fi

# Stage the binary into INSTALL_DIR/bin/ for the resolver layout, and also
# into the conventional binaries/programs/wasm32/ tree the demo page
# imports from (matches fbdoom).
mkdir -p "$INSTALL_DIR/bin" "$REPO_ROOT/binaries/programs/wasm32"
cp "$BUILD_DIR/scummvm.wasm" "$INSTALL_DIR/bin/scummvm.wasm"
cp "$BUILD_DIR/scummvm.wasm" "$REPO_ROOT/binaries/programs/wasm32/scummvm.wasm"

if [ -f "$BUILD_DIR/scummvm.wasm" ]; then
    echo "==> ScummVM build complete!"
    ls -lh "$BUILD_DIR/scummvm.wasm"
else
    echo "ERROR: Build failed — $BUILD_DIR/scummvm.wasm not found." >&2
    exit 1
fi
