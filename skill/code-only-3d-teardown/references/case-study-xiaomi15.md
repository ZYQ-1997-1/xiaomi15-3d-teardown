# Xiaomi 15 teardown case study

This is the reference build that the skill was extracted from. It is useful as
a concrete example of how feedback changed the model.

## Final part set (15 total, 14 removable)

1. Screen assembly
2. Aluminum frame (fixed reference)
3. Back glass cover
4. Leica camera module
5. Battery
6. Mainboard
7. Snapdragon 8 Elite (separate removable chip)
8. Wing-shaped ring vapor chamber
9. Wireless charging coil
10. Power button
11. Volume rocker
12. USB-C port
13. Bottom speaker
14. Earpiece
15. SIM tray

The chip was added late: the mainboard keeps a gold contact socket, and the
chip package uses the supplied red Snapdragon 8 Elite sticker. Its spec sheet
is separate from the mainboard's.

## Final camera-island design

- One raised black glass island, about **43 × 43.5 mm**, ~60% of the 71.2 mm
  body width.
- Four flush 2×2 circles under the glass:
  - top-left: main camera
  - top-right: IR + laser-focus sensor (dotted red window)
  - bottom-left: 60 mm telephoto
  - bottom-right: 14 mm ultra-wide
- LEICA / VARIO-SUMMILUX / `1:1.62-2.2/14-60 ASPH.` text is vertical in
  portrait, readable when the phone is held horizontally.
- One vertical flash strip **outside** the island, to its right and near the
  top. There is no second flash inside the island.
- A small microphone pinhole sits inside the module on the left.
- Island corner radius follows the frame radius; a rectangular reflection plane
  must never be left on top of the rounded glass.

## Other geometry decisions

- Top edge has **no** microphone/IR opening; only the bottom edge has the
  speaker holes, USB-C, bottom mic and SIM tray.
- SIM tray is a **filled** metal insert with a seam and pinhole, not an empty
  cavity.
- Screen uses the supplied front-panel image cropped to the display interior;
  the punch-hole camera comes from that image, so no separate 3D hole is
  overlaid.
- The back wordmark uses the user-supplied logo image as a transparent PNG,
  rotated 90° and placed small near the lower-left.
- Back glass is neutral dark glass. Hovering it should not add a highly
  saturated emissive wash or a rectangular selection box; use clearcoat/env
  reflection and a soft diagonal glare instead.

## Feedback timeline that mattered

1. Initial camera island was too small; added detail but still guessed the
   scale.
2. User supplied official dimensions and close-ups; measured the island at
   ~43 × 43.5 mm.
3. Flash existed twice (inside island and outside); removed the module flash.
4. Rectangular reflection plane produced right-angle edges on a rounded island;
   removed the plane.
5. Top mic hole existed but the real top edge is clean; removed it.
6. Screen/front camera was independently modeled and misaligned; switched to
   the supplied full front image and removed the 3D punch hole.
7. Logo was approximated with a system font; switched to the supplied logo
   image and extracted transparency.
8. Hover effect was a purple emissive tint plus a large box; replaced with
   neutral glass reflection.
9. Chip was part of the mainboard decal; split into a real removable part with
   its own spec card and sticker.

## Numbers worth reusing

- Body: 152.3 × 71.2 × 8.08 mm; 191 g.
- Screen: 6.36" 1.5K 2670×1200, 120 Hz, 300 Hz touch, 3200 nits.
- Battery: 5400 mAh typ / 5260 mAh min; 90 W wired / 50 W wireless.
- Camera: 50 MP main f/1.62 23 mm 7P OIS; 50 MP 60 mm 6P OIS; 50 MP
  14 mm 6P 115°; 32 MP front.
- Chip: Snapdragon 8 Elite, TSMC 2nd-gen 3 nm, 2 prime + 6 performance cores;
  CPU +45% / −52% power, GPU +44% / −46%, AI +105% / +45% efficiency;
  LPDDR5X, UFS 4.0.
