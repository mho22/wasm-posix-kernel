#!/usr/bin/env bash
#
# Build freetype (libfreetype.a) for wasm32-posix-kernel.
#
# Honors the dep-resolver build-script contract (see
# docs/package-management.md). When invoked via
# `cargo xtask build-deps resolve freetype`, env vars are set by the
# resolver and the build installs into the shared cache:
#
#     WASM_POSIX_DEP_OUT_DIR        # where to `make install`
#     WASM_POSIX_DEP_VERSION        # upstream version
#     WASM_POSIX_DEP_SOURCE_URL     # tarball URL
#     WASM_POSIX_DEP_SOURCE_SHA256  # expected sha256 of the tarball
#     WASM_POSIX_DEP_ZLIB_DIR       # resolved zlib prefix (direct dep)
#     WASM_POSIX_DEP_LIBPNG_DIR     # resolved libpng prefix (direct dep)
#
# For ad-hoc / legacy invocation (`bash build-freetype.sh`), the script
# falls back to the in-tree `freetype-install/` layout and the
# zlib + libpng artifacts staged under `$REPO_ROOT/sysroot`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SRC_DIR="$SCRIPT_DIR/freetype-src"

# Activate the worktree-local SDK toolchain so wasm32posix-* tools resolve
# to this worktree (no global npm-link required).
# shellcheck source=/dev/null
source "$REPO_ROOT/sdk/activate.sh"

# --- Inputs from resolver, with legacy fallbacks ---
FREETYPE_VERSION="${WASM_POSIX_DEP_VERSION:-${FREETYPE_VERSION:-2.13.2}}"
INSTALL_DIR="${WASM_POSIX_DEP_OUT_DIR:-$SCRIPT_DIR/freetype-install}"
SOURCE_URL="${WASM_POSIX_DEP_SOURCE_URL:-https://download.savannah.gnu.org/releases/freetype/freetype-${FREETYPE_VERSION}.tar.xz}"
SOURCE_SHA256="${WASM_POSIX_DEP_SOURCE_SHA256:-12991c4e55c506dd7f9b765933e62fd2be2e06d421505d7950a132e4f1bb484d}"

# autoconf bakes --prefix into the Makefile; rebuild fresh per run.
BUILD_DIR="$SCRIPT_DIR/freetype-build"

if ! command -v wasm32posix-cc &>/dev/null; then
    echo "ERROR: wasm32posix-cc not found. Source sdk/activate.sh first." >&2
    exit 1
fi

# --- Locate zlib + libpng ---
SYSROOT="${WASM_POSIX_SYSROOT:-$REPO_ROOT/sysroot}"

ZLIB_PREFIX="${WASM_POSIX_DEP_ZLIB_DIR:-}"
if [ -z "$ZLIB_PREFIX" ]; then
    if [ -f "$SYSROOT/lib/libz.a" ]; then
        ZLIB_PREFIX="$SYSROOT"
    else
        echo "ERROR: zlib not found. Set WASM_POSIX_DEP_ZLIB_DIR or stage libz.a into $SYSROOT/lib/." >&2
        exit 1
    fi
fi

LIBPNG_PREFIX="${WASM_POSIX_DEP_LIBPNG_DIR:-}"
if [ -z "$LIBPNG_PREFIX" ]; then
    if [ -f "$SYSROOT/lib/libpng16.a" ]; then
        LIBPNG_PREFIX="$SYSROOT"
    else
        echo "ERROR: libpng not found. Set WASM_POSIX_DEP_LIBPNG_DIR or stage libpng16.a into $SYSROOT/lib/." >&2
        exit 1
    fi
fi

# --- Fetch + verify source ---
if [ ! -d "$SRC_DIR" ]; then
    echo "==> Downloading freetype $FREETYPE_VERSION..."
    TARBALL="/tmp/freetype-${FREETYPE_VERSION}.tar.xz"
    curl -fsSL "$SOURCE_URL" -o "$TARBALL"
    if [ -n "$SOURCE_SHA256" ]; then
        echo "==> Verifying source sha256..."
        echo "$SOURCE_SHA256  $TARBALL" | shasum -a 256 -c -
    else
        echo "==> (no SOURCE_SHA256 declared; skipping verification)"
    fi
    mkdir -p "$SRC_DIR"
    tar xf "$TARBALL" -C "$SRC_DIR" --strip-components=1
    rm "$TARBALL"
fi

# Fresh build + install dir each run.
rm -rf "$BUILD_DIR" "$INSTALL_DIR"
mkdir -p "$BUILD_DIR"

# Freetype's configure auto-detects optional deps via pkg-config and host
# libs. On macOS it'll happily pick up Homebrew's harfbuzz, brotli, bzip2 —
# all wrong for our wasm sysroot. Disable each explicitly. We keep zlib and
# libpng (the two we actually ship) and disable harfbuzz to avoid a circular
# dep (harfbuzz optionally links freetype).
echo "==> Configuring freetype for wasm32 (zlib=$ZLIB_PREFIX libpng=$LIBPNG_PREFIX)..."
(
    cd "$BUILD_DIR"
    CFLAGS="-O2" \
    "$SRC_DIR/configure" \
        --host=wasm32-unknown-none \
        --prefix="$INSTALL_DIR" \
        --enable-static \
        --disable-shared \
        --with-zlib=yes \
        --with-png=yes \
        --with-bzip2=no \
        --with-brotli=no \
        --with-harfbuzz=no \
        CC=wasm32posix-cc \
        AR=wasm32posix-ar \
        RANLIB=wasm32posix-ranlib \
        CPPFLAGS="-I$ZLIB_PREFIX/include -I$LIBPNG_PREFIX/include -I$LIBPNG_PREFIX/include/libpng16" \
        LDFLAGS="-L$ZLIB_PREFIX/lib -L$LIBPNG_PREFIX/lib" \
        ZLIB_CFLAGS="-I$ZLIB_PREFIX/include" \
        ZLIB_LIBS="-L$ZLIB_PREFIX/lib -lz" \
        LIBPNG_CFLAGS="-I$LIBPNG_PREFIX/include/libpng16" \
        LIBPNG_LIBS="-L$LIBPNG_PREFIX/lib -lpng16 -L$ZLIB_PREFIX/lib -lz"

    echo "==> Building freetype..."
    make -j"$(sysctl -n hw.ncpu 2>/dev/null || nproc)"

    echo "==> Installing to $INSTALL_DIR..."
    make install
)

# Drop host-side helpers (freetype-config) — consumers go through pkg-config.
rm -rf "$INSTALL_DIR/bin" "$INSTALL_DIR/share"

if [ -f "$INSTALL_DIR/lib/libfreetype.a" ]; then
    echo "==> freetype build complete!"
    ls -lh "$INSTALL_DIR/lib/"libfreetype*.a
else
    echo "ERROR: Build failed — library not found at $INSTALL_DIR/lib/libfreetype.a" >&2
    exit 1
fi
