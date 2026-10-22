# Publishing to GitHub

This repo is prepared as a **source-available, non-commercial** project.
Publishing requires a GitHub account and a local Git credential. The code
itself has no CI secrets. Commercial use is prohibited; see `LICENSE`.

## 1. Create the empty repository

On GitHub, create a **public** repository, for example:

```text
xiaomi15-3d-teardown
```

Do **not** initialize it with a README, license or `.gitignore`; this repo has
them already.

## 2. Set the remote and push

From this directory:

```bash
git remote add origin https://github.com/<your-user>/xiaomi15-3d-teardown.git
git push -u origin main --tags
```

If Git asks for credentials, use Git Credential Manager, an SSH key, or a
fine-grained token with `Contents: Read and write`. Do not commit a token.

## 3. Enable GitHub Pages

After the first push:

1. Repository → Settings → Pages.
2. Build and deployment → Source: **Deploy from a branch**.
3. Branch: **main**, folder: **/(root)**.
4. The site will be available under `https://<your-user>.github.io/xiaomi15-3d-teardown/`.

GitHub Pages serves the root `index.html` and the local `css/js/vendor/assets`
directories directly. No build step is needed on the server.

## 4. Create a release

Build first:

```bash
npm run build
```

Then attach:

- `dist/Xiaomi15-3D-Teardown.html`
- `dist/Xiaomi15-3D-Teardown-v1.0.1.zip`
- `dist/code-only-3d-teardown.skill.zip`

Use tag `v1.0.1` and a short description. The tag is created locally by the
initial packaging step. The previous v1.0.0 release/assets are removed when
the non-commercial license correction is published.

## 5. Asset licensing gate

Before making the repository public, confirm you have permission to redistribute:

- `assets/screen-lock.jpg` / `js/screen-image.js`
- `assets/logo-wordmark.png` / `js/logo-image.js`
- `assets/chip-snapdragon.png` / `js/chip-image.js`
- `preview*.png`

These are marked as demo assets in `THIRD_PARTY_NOTICES.md` and are not covered
by the project's Non-Commercial Source License. If you do not have permission,
replace them with self-made neutral assets or remove them and keep the
procedural fallback. The code remains functional without the supplied images.
