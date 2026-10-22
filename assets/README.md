# Demo assets

These images are the user-supplied visual references used by the demo:

- `screen-lock.jpg` — front panel / lock-screen image
- `logo-wordmark.png` — XIAOMI wordmark, background removed
- `chip-snapdragon.png` — Snapdragon 8 Elite sticker, rounded mask

They are **not** covered by the repository's MIT license. See
`../THIRD_PARTY_NOTICES.md`. If you do not have redistribution rights, remove
the files and the corresponding `js/*-image.js` data-URL modules; the page
falls back to procedural screen/wordmark/chip artwork.

The base64 copies in `js/screen-image.js`, `js/logo-image.js` and
`js/chip-image.js` are generated from these files and should be removed or
regenerated together with them.
