# DOOM WAD asset

The DOOM browser demo (`examples/browser/pages/doom/`) loads a DOOM
IWAD from `/assets/doom/doom1.wad` at runtime via the in-memory VFS's
`registerLazyFile` mechanism.

The WAD itself is **not committed** to this repo (binary asset, ~4 MB).
`examples/libs/fbdoom/build-fbdoom.sh` fetches the original **DOOM
shareware IWAD** (v1.9, ~4 MB, freely redistributable under id
Software's shareware licence) into this directory automatically. The
download URL and SHA-256 are pinned in the build script, so the
result is reproducible.

If a `doom1.wad` is already present here, the build script leaves it
alone — drop in your own copy of the shareware IWAD if you prefer.
