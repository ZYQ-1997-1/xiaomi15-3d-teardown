# Measuring real proportions from renders

The goal is not pixel-perfect CAD, but the **ratio** between the part and the
known body dimensions must be defensible. A 10% error on a camera island is
immediately visible.

## 1. Pick the right reference

Use references in this order:

1. **Orthographic dimension drawing** (best for ratios) — usually has the
   official length/width/thickness annotated.
2. **Straight-on product render** (best for surface details, colors and
   branding).
3. **Perspective lifestyle photos** (worst for ratios; only for texture cues).

Do not measure a perspective photo if an orthographic drawing exists.

## 2. Establish the scale

From the official dimensions (Xiaomi 15 example):

```text
phone length = 152.3 mm
phone width  = 71.2 mm
phone depth  = 8.08 mm
```

In the orthographic drawing, measure the phone's short-side pixel height
`P_phone`. Then:

```text
mm_per_px = 71.2 / P_phone
part_mm   = P_part_px * mm_per_px
margin_mm = P_margin_px * mm_per_px
```

For a portrait render, measure the phone body width in pixels, then the part
width in pixels. If a part is rotated 90° in the drawing, swap the axes before
computing.

## 3. A reusable Python/Pillow measurement loop

This is enough for manual bounding boxes; use OpenCV contours if you need
automation.

```python
from PIL import Image
img = Image.open("reference.png").convert("RGB")
# inspect a grid first:
# draw vertical/horizontal lines every 50 px with PIL.ImageDraw, then read
# off the body bounds and part bounds.
P_phone = 445       # measured px, phone short side
P_part  = 177       # measured px, camera island width
part_mm = P_part / P_phone * 71.2   # -> 28.3 mm
```

Prefer measuring several times at 2–4× zoom; anti-aliasing and shadows make
edges fuzzy.

## 4. Xiaomi 15 worked example

Measured from the official portrait render and the dimension diagram:

```text
phone width        71.2 mm
camera island      43.0 × 43.5 mm
island / width     60.4%
top margin          8.5 mm
left margin         5.0 mm
phone length       152.3 mm
```

This is much larger than a naive 3.3 cm guess. When a product has a small body
and a visually dominant camera island, **do not scale the island down to make
the phone look balanced**; the reference is the target.

## 5. From millimeters to Three.js units

Use centimeters as world units for a phone-sized object:

```text
1 cm = 1 world unit
phone height 15.23
phone width   7.12
island width  4.30
island height 4.35
```

Place the island using measured margins:

```text
center_x = phone_half_width - left_margin - island_width / 2
center_y = phone_half_height - top_margin - island_height / 2
```

Remember that a back-view camera maps world `+X` to the viewer's **left**;
write this mapping down before placing asymmetric parts (flash, SIM tray,
buttons).

## 6. Common mistakes

- Measuring a perspective render and treating it as orthographic.
- Using the camera island's inner glass rectangle instead of its outer metal
  frame.
- Forgetting that a landscape dimension diagram mirrors left/right relative to
  the portrait back.
- Making individual lenses protrude because the reference shows large lens
  rings; usually the rings are flush under one glass cover.
- Putting the flash inside the island because the diagram labels are close;
  read the leader lines, not proximity.
