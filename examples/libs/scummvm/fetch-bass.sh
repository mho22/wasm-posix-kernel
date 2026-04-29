#!/usr/bin/env bash
#
# Fetch the freeware Beneath a Steel Sky game data and stage it under
# examples/browser/public/assets/bass/ for the ScummVM browser demo.
#
# The demo's main.ts lazy-registers each file in the VFS at
# /usr/local/games/bass/<file>, so the browser only fetches each file
# the first time the engine reads it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ASSET_DIR="$REPO_ROOT/examples/browser/public/assets/bass"

# Pinned URL + sha to ScummVM's official freeware mirror. The CD package
# is the canonical freeware bundle; we use the floppy-style game files
# inside (sky.cpt, sky.dnr, sky.dsk, sky.exe, voice samples, music) and
# omit the MP3-encoded CD voice tracks since we disabled the MP3 codec
# in the ScummVM build.
BASS_URL="${BASS_URL:-https://downloads.scummvm.org/frs/extras/Beneath%20a%20Steel%20Sky/bass-cd-1.2.tbz2}"
BASS_SHA256="${BASS_SHA256:-}"  # filled by hand after first successful fetch

if [ -d "$ASSET_DIR" ] && [ "$(ls -A "$ASSET_DIR" 2>/dev/null)" ]; then
    echo "==> BASS assets already staged at $ASSET_DIR — skipping."
    exit 0
fi

mkdir -p "$ASSET_DIR"
TARBALL="/tmp/bass-cd-1.2.tbz2"

echo "==> Downloading Beneath a Steel Sky freeware..."
curl -fsSL "$BASS_URL" -o "$TARBALL"

if [ -n "$BASS_SHA256" ]; then
    echo "==> Verifying sha256..."
    echo "$BASS_SHA256  $TARBALL" | shasum -a 256 -c -
else
    echo "==> (no BASS_SHA256 declared; record the sha after first run)"
    shasum -a 256 "$TARBALL"
fi

echo "==> Extracting to $ASSET_DIR..."
tar xjf "$TARBALL" -C "$ASSET_DIR" --strip-components=1
rm "$TARBALL"

echo "==> BASS files staged:"
ls -lh "$ASSET_DIR"
