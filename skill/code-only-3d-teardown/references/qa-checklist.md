# Release QA checklist

Run from the project root.

## Setup

```bash
npm install            # playwright-core only; no runtime deps
# Uses system Chrome/Edge if found; otherwise set:
#   CHROME_PATH=/path/to/chrome
#   PLAYWRIGHT_MODULE=/path/to/playwright-core
npm run qa
npm run qa:mobile
npm run build
```

The page itself uses `file://` and must not need a server.

## Automated checks (included in qa/final.mjs)

- [ ] No `console.error`, no `pageerror`.
- [ ] Official spec sheet opens and contains expected sections/values.
- [ ] Drag changes camera theta; wheel changes radius.
- [ ] Hovering a part sets a hover state and tooltip.
- [ ] Clicking a part explodes it; click again restores it.
- [ ] "Explode all" reaches `N / N` removable parts.
- [ ] Visible labels at full explosion equal the number of parts with
      `p > 0.14` (excluding the fixed frame).
- [ ] No pair of visible labels overlaps.
- [ ] No visible label intersects the left parts panel or right detail panel.
- [ ] Restore returns all parts to `p ≈ 0`, labels disappear.
- [ ] Mobile 390×844: parts sheet, detail sheet, list items and exploded view
      do not overflow the viewport.
- [ ] The page still shows the intended screen image and wordmark.

## Manual visual checks

- [ ] Camera island proportions and margins match the measured values.
- [ ] The island is one raised block; lenses are flush under glass.
- [ ] Exactly one flash strip, outside the island, right/upper side.
- [ ] LEICA text orientation matches the real portrait orientation.
- [ ] Top edge has no extra ports; bottom edge layout matches the reference.
- [ ] SIM tray reads as filled, not an empty slot.
- [ ] Back glass hover is neutral/glass-like, no saturated tint or box.
- [ ] Wordmark is the supplied logo, correctly scaled and positioned.
- [ ] Chip is a separate list item with its own sticker and specs.
- [ ] Single-file build opens offline and makes **0** external requests.

## Packaging

- [ ] `dist/*.html` built from the latest source.
- [ ] `LICENSE`, `THIRD_PARTY_NOTICES.md` and `assets/README.md` present.
- [ ] No `node_modules/`, QA screenshots, logs or tokens committed.
- [ ] README screenshots reflect the current build.
- [ ] GitHub Pages (if enabled) points at the repo root or a built site dir.
