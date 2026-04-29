#!/usr/bin/env bash
# Cross-compile SDL2 (2.30.x) for the wasm-posix-kernel toolchain with
# our custom `fbposix` video driver targeting /dev/fb0.
#
# Output: local-binaries/lib/libSDL2.a + headers + sdl2.pc.
#
# Usage: bash examples/libs/sdl2/build-sdl2.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"

source "$REPO_ROOT/sdk/activate.sh"

SDL_VERSION="${SDL_VERSION:-2.30.7}"
SRC="$HERE/SDL-${SDL_VERSION}"

if [ ! -d "$SRC" ]; then
    echo "==> Fetching SDL2 ${SDL_VERSION}..."
    curl -fsSL "https://github.com/libsdl-org/SDL/releases/download/release-${SDL_VERSION}/SDL2-${SDL_VERSION}.tar.gz" \
        | tar -xz -C "$HERE"
    mv "$HERE/SDL2-${SDL_VERSION}" "$SRC"
fi

# Apply patches idempotently — same pattern as fbdoom's build script.
echo "==> Applying patches..."
for p in "$HERE/patches/"*.patch; do
    [ -f "$p" ] || continue
    if (cd "$SRC" && git init -q 2>/dev/null; git add -A 2>/dev/null; git apply --check "$p" 2>/dev/null); then
        echo "    $(basename "$p")"
        (cd "$SRC" && git apply "$p")
    else
        echo "    $(basename "$p") (already applied or stale — skipping)"
    fi
done

# Drop the fbposix driver source into the SDL tree before configure.
# Idempotent: rm + cp ensures a clean overlay each build.
echo "==> Installing fbposix driver into SDL source tree..."
rm -rf "$SRC/src/video/fbposix"
cp -R "$HERE/fbposix" "$SRC/src/video/fbposix"

# Some SDL2 releases ship configure as a generated artefact; some don't.
# If autoconf is available and configure is missing or older than
# configure.ac, regenerate it. Otherwise rely on the shipped one.
if [ ! -x "$SRC/configure" ] || [ "$SRC/configure.ac" -nt "$SRC/configure" ]; then
    if command -v autoreconf >/dev/null; then
        echo "==> Regenerating configure..."
        (cd "$SRC" && autoreconf -fi)
    fi
fi

mkdir -p "$HERE/build"
cd "$HERE/build"

# Configure cache. SDL2's configure runs many AC_TRY_RUN feature checks
# that fail under cross-build because they execute against the host's
# libc. Pin the answers explicitly per CLAUDE.md cross-compile guidance.
CACHE_VARS=(
    ac_cv_func_clock_gettime=yes
    ac_cv_func_nanosleep=yes
    ac_cv_func_pthread_create=yes
    ac_cv_func_mmap=yes
    ac_cv_func_munmap=yes
    ac_cv_have_dev_dsp=yes
    ac_cv_func_feenableexcept=no
    ac_cv_func_sched_setaffinity=no
    ac_cv_func_sched_get_priority_max=no
    sdl_cv_lazymem=yes
)

echo "==> Configuring..."
env "${CACHE_VARS[@]}" \
    "$SRC/configure" \
    --host=wasm32-unknown-none \
    --prefix=/usr/local \
    CC=wasm32posix-cc \
    AR=wasm32posix-ar \
    RANLIB=wasm32posix-ranlib \
    PKG_CONFIG=wasm32posix-pkg-config \
    --disable-shared --enable-static \
    --disable-video-x11 --disable-video-wayland --disable-video-kmsdrm \
    --disable-video-cocoa --disable-video-vivante --disable-video-rpi \
    --disable-video-offscreen --disable-video-vulkan --disable-video-opengl \
    --disable-video-opengles --disable-video-opengles2 \
    --disable-video-directfb \
    --enable-video-fbposix \
    --disable-audio-pulseaudio --disable-audio-pipewire --disable-audio-jack \
    --disable-audio-alsa --enable-audio-oss --enable-audio-dummy \
    --disable-joystick --disable-haptic --disable-sensor \
    --enable-threads --enable-timers \
    --disable-loadso \
    --disable-render-d3d --disable-render-metal \
    --enable-render-software \
    --disable-power --disable-filesystem --enable-file

echo "==> Building..."
make -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"

echo "==> Installing..."
rm -rf "$HERE/install"
make install DESTDIR="$HERE/install"

# Surface to local-binaries/ so consumers can pkg-config it.
mkdir -p "$REPO_ROOT/local-binaries/lib/pkgconfig"
mkdir -p "$REPO_ROOT/local-binaries/include/SDL2"
cp "$HERE/install/usr/local/lib/libSDL2.a" "$REPO_ROOT/local-binaries/lib/"
[ -f "$HERE/install/usr/local/lib/libSDL2main.a" ] && \
    cp "$HERE/install/usr/local/lib/libSDL2main.a" "$REPO_ROOT/local-binaries/lib/" || true
cp -R "$HERE/install/usr/local/include/SDL2/." "$REPO_ROOT/local-binaries/include/SDL2/"

# Rewrite the prefix in sdl2.pc so wasm32posix-pkg-config can find it
# under local-binaries/.
sed -e "s|^prefix=.*|prefix=$REPO_ROOT/local-binaries|" \
    "$HERE/install/usr/local/lib/pkgconfig/sdl2.pc" \
    > "$REPO_ROOT/local-binaries/lib/pkgconfig/sdl2.pc"

ls -la "$REPO_ROOT/local-binaries/lib/libSDL2.a"
echo "==> SDL2 ${SDL_VERSION} built and installed."
