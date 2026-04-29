# ScummVM browser demo assets

This directory holds:

- `scummvm.wasm` — produced by `bash examples/libs/scummvm/build-scummvm.sh`.
- `sky/` — Beneath a Steel Sky (full game, freeware).
- `tentacle-demo/` — Day of the Tentacle demo (freely redistributable).
- `monkey-demo/` — Monkey Island demo (freely redistributable).

Populate with:

```bash
bash examples/libs/scummvm/fetch-demos.sh
```

That script fetches the assets from the official ScummVM mirrors. None
of them are checked into the repository.
