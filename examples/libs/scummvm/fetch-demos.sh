#!/usr/bin/env bash
# Fetch freely-redistributable game data for the ScummVM browser demo.
#
# Sources are official ScummVM mirrors. SHA256 pins are filled in on
# the first successful fetch — if upstream rotates the artefact, the
# pin trips and a maintainer must inspect.
#
# Output: examples/browser/public/assets/scummvm/{sky,tentacle-demo,monkey-demo}/
#
# Usage: bash examples/libs/scummvm/fetch-demos.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
DEST="$REPO_ROOT/examples/browser/public/assets/scummvm"
CACHE="$DEST/.cache"

mkdir -p "$DEST" "$CACHE"

# (URL, dest-subdir, sha256-pin-or-empty)
SETS=(
    "https://downloads.scummvm.org/frs/extras/Beneath%20a%20Steel%20Sky/bass-cd-1.2.zip|sky|"
    "https://downloads.scummvm.org/frs/demos/scumm/tentacle-pc-demo-en.zip|tentacle-demo|"
    "https://downloads.scummvm.org/frs/demos/scumm/monkey-pc-demo-en.zip|monkey-demo|"
)

verify_sha256 () {
    local file="$1" expected="$2"
    [ -z "$expected" ] && return 0
    local actual
    actual="$(shasum -a 256 "$file" | awk '{print $1}')"
    if [ "$actual" != "$expected" ]; then
        echo "!! sha256 mismatch for $(basename "$file")"
        echo "   expected: $expected"
        echo "   actual:   $actual"
        return 1
    fi
}

for entry in "${SETS[@]}"; do
    IFS='|' read -r url subdir pin <<< "$entry"
    base="$(basename "$url" | sed 's/%20/_/g')"
    cache_file="$CACHE/$base"
    target="$DEST/$subdir"

    if [ ! -f "$cache_file" ]; then
        echo "==> Fetching $base..."
        curl -fsSL "$url" -o "$cache_file"
    fi
    verify_sha256 "$cache_file" "$pin"

    if [ ! -d "$target" ] || [ -z "$(ls -A "$target" 2>/dev/null)" ]; then
        mkdir -p "$target"
        echo "==> Unpacking $base into $target..."
        unzip -qo "$cache_file" -d "$target"
    fi

    echo "==> $subdir ready ($(du -sh "$target" 2>/dev/null | awk '{print $1}'))"
done

# Compute and print sha256s so a maintainer can paste them into the
# SETS table after first successful fetch.
echo
echo "==> Pin candidates (paste into SETS):"
for entry in "${SETS[@]}"; do
    IFS='|' read -r url subdir pin <<< "$entry"
    base="$(basename "$url" | sed 's/%20/_/g')"
    cache_file="$CACHE/$base"
    [ -f "$cache_file" ] && shasum -a 256 "$cache_file" | awk -v s="$subdir" '{print "    "s" "$1}'
done

echo "==> Demo data ready under $DEST"
