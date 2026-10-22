# code-only-3d-teardown

把一个真实产品做成纯代码、可离线打开的 Three.js 3D 拆解页。

## Install

Copy this folder into a DSH skill directory:

```bash
mkdir -p .dsh/skills
cp -r code-only-3d-teardown .dsh/skills/
```

Or use the project-local path:

```text
<project>/.dsh/skills/code-only-3d-teardown/
```

DSH hot-loads the skill; no restart is needed.

## Use

Mention “3D 拆解 / 爆炸图 / 产品结构 / Three.js 产品展示 / 纯代码建模” and the
skill will guide the workflow. It is also a good fit when a user supplies
official renders and expects measured proportions rather than guessed geometry.

## Contents

- `SKILL.md` — workflow and hard-won pitfalls
- `references/measurement.md` — proportions from official images
- `references/case-study-xiaomi15.md` — the reference build
- `references/qa-checklist.md` — release checks
- `scripts/build-three.mjs` — ESM → classic Three.js
- `scripts/build-single.mjs` — single-file HTML packaging
- `scripts/qa-browser.mjs` — portable Playwright launcher
