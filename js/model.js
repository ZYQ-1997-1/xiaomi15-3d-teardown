/* =========================================================================
   Xiaomi 15 · 3D Teardown Lab
   model.js — every mesh is generated procedurally from primitives.
   No external models, no texture files: the screen wallpaper, battery label
   and Leica decal are painted onto <canvas> at runtime.
   ========================================================================= */
(function () {
  'use strict';

  const XM15 = (window.XM15 = window.XM15 || {});
  const T = window.THREE;
  const PHONE = XM15.PHONE;

  /* ----------------------------------------------------------------------
     small math / geometry helpers
     ---------------------------------------------------------------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function roundedRectShape(w, h, r) {
    const shape = new T.Shape();
    const x = -w / 2;
    const y = -h / 2;
    const rr = Math.min(r, w / 2, h / 2);
    shape.moveTo(x + rr, y);
    shape.lineTo(x + w - rr, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + rr);
    shape.lineTo(x + w, y + h - rr);
    shape.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    shape.lineTo(x + rr, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - rr);
    shape.lineTo(x, y + rr);
    shape.quadraticCurveTo(x, y, x + rr, y);
    return shape;
  }

  function slabGeometry(w, h, d, r, opts) {
    opts = opts || {};
    const b = Math.min(
      opts.bevel != null ? opts.bevel : 0.045,
      d * 0.32,
      r * 0.45,
      w * 0.08,
      h * 0.08
    );
    const shape = roundedRectShape(w - 2 * b, h - 2 * b, Math.max(0.001, r - b));
    const geo = new T.ExtrudeGeometry(shape, {
      depth: Math.max(0.002, d - 2 * b),
      bevelEnabled: b > 0.001,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: opts.bevelSegments != null ? opts.bevelSegments : 3,
      curveSegments: opts.curveSegments != null ? opts.curveSegments : 24,
      steps: 1,
    });
    geo.translate(0, 0, b - d / 2);
    geo.computeVertexNormals();
    return geo;
  }

  function frameGeometry(w, h, d, r, wall) {
    // The bevel must stay well below both the extrusion depth and the wall
    // thickness, otherwise the inner hole collapses into a solid plate.
    const b = Math.min(0.035, d * 0.28, wall * 0.28);
    const shape = roundedRectShape(w - 2 * b, h - 2 * b, r - b);
    const iw = w - wall * 2;
    const ih = h - wall * 2;
    const hole = roundedRectShape(iw + 2 * b, ih + 2 * b, Math.max(0.1, r - wall + b));
    shape.holes.push(hole);
    const geo = new T.ExtrudeGeometry(shape, {
      depth: Math.max(0.002, d - 2 * b),
      bevelEnabled: b > 0.001,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 2,
      curveSegments: 32,
      steps: 1,
    });
    geo.translate(0, 0, b - d / 2);
    geo.computeVertexNormals();
    return geo;
  }

  function slab(w, h, d, r, material, opts) {
    return new T.Mesh(slabGeometry(w, h, d, r, opts), material);
  }

  function box(w, h, d, material) {
    return new T.Mesh(new T.BoxGeometry(w, h, d), material);
  }

  function cyl(rt, rb, h, seg, material) {
    return new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), material);
  }

  /* ----------------------------------------------------------------------
     materials (each part creates its own instances so highlighting is local)
     ---------------------------------------------------------------------- */
  function metal(color, opts) {
    opts = opts || {};
    return new T.MeshPhysicalMaterial({
      color: color,
      metalness: opts.metalness != null ? opts.metalness : 1,
      roughness: opts.roughness != null ? opts.roughness : 0.3,
      clearcoat: opts.clearcoat != null ? opts.clearcoat : 0.4,
      clearcoatRoughness: opts.clearcoatRoughness != null ? opts.clearcoatRoughness : 0.28,
      envMapIntensity: opts.envMapIntensity != null ? opts.envMapIntensity : 1.25,
    });
  }

  function glassy(color, opts) {
    opts = opts || {};
    return new T.MeshPhysicalMaterial({
      color: color,
      metalness: opts.metalness != null ? opts.metalness : 0.55,
      roughness: opts.roughness != null ? opts.roughness : 0.3,
      clearcoat: opts.clearcoat != null ? opts.clearcoat : 0.9,
      clearcoatRoughness: opts.clearcoatRoughness != null ? opts.clearcoatRoughness : 0.16,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1,
      depthWrite: opts.depthWrite !== false,
      envMapIntensity: opts.envMapIntensity != null ? opts.envMapIntensity : 1.3,
      side: opts.side || T.FrontSide,
    });
  }

  function plastic(color, opts) {
    opts = opts || {};
    return new T.MeshStandardMaterial({
      color: color,
      metalness: opts.metalness != null ? opts.metalness : 0.1,
      roughness: opts.roughness != null ? opts.roughness : 0.62,
      emissive: opts.emissive != null ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 0,
    });
  }

  /* ----------------------------------------------------------------------
     canvas helpers
     ---------------------------------------------------------------------- */
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function rrPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const FONT_STACK =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Microsoft YaHei", "PingFang SC", Arial, sans-serif';

  function text(ctx, str, x, y, size, color, weight, align, spacing) {
    ctx.save();
    ctx.font = `${weight || 400} ${size}px ${FONT_STACK}`;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    if (spacing) ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function texture(canvas, opts) {
    opts = opts || {};
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = opts.linear ? T.NoColorSpace : T.SRGBColorSpace;
    tex.anisotropy = opts.anisotropy || 8;
    tex.needsUpdate = true;
    return tex;
  }

  function drawLucide(ctx, path, cx, cy, size, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(size / 24, size / 24);
    ctx.lineWidth = opts.lineWidth || 1.8;
    ctx.strokeStyle = opts.stroke || '#ffffff';
    ctx.fillStyle = opts.fill || 'none';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const p = new Path2D(path);
    if (opts.fill && opts.fill !== 'none') ctx.fill(p);
    ctx.stroke(p);
    ctx.restore();
  }

  const GLYPHS = {
    phone:
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    message:
      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    camera:
      'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
    globe:
      'M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    image:
      'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z',
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    music: 'M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
    calendar:
      'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    bag: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
    battery:
      'M17 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM21 10v4',
    wifi: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0',
  };

  /* ----------------------------------------------------------------------
     textures painted at runtime
     ---------------------------------------------------------------------- */
  function createScreenTexture() {
    const W = 1024;
    const H = 2224;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');

    // ---- wallpaper base
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#071127');
    bg.addColorStop(0.45, '#0a0c1c');
    bg.addColorStop(1, '#05070f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ---- soft HyperOS-ish colour ribbons
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(70px)';
    const blob = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    blob(250, 330, 330, 'rgba(30, 96, 240, 0.75)');
    blob(790, 250, 300, 'rgba(126, 58, 230, 0.60)');
    blob(640, 950, 380, 'rgba(0, 156, 190, 0.34)');
    blob(180, 1350, 320, 'rgba(255, 96, 42, 0.20)');
    blob(860, 1580, 300, 'rgba(84, 60, 220, 0.26)');
    ctx.restore();

    // thin flowing highlight lines
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(120, 210, 255, 0.20)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(-40, 520 + i * 26);
      ctx.bezierCurveTo(260, 380 + i * 30, 700, 720 + i * 24, 1080, 460 + i * 26);
      ctx.stroke();
    }
    ctx.restore();

    // ---- status bar
    text(ctx, '09:41', 62, 104, 40, 'rgba(255,255,255,0.96)', 600);
    drawLucide(ctx, GLYPHS.wifi, 826, 96, 27, { stroke: 'rgba(255,255,255,0.92)', lineWidth: 2 });
    // signal bars
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let i = 0; i < 4; i++) {
      const h = 10 + i * 6;
      rrPath(ctx, 860 + i * 13, 106 - h, 8, h, 2);
      ctx.fill();
    }
    text(ctx, '5G', 922, 96, 26, 'rgba(255,255,255,0.9)', 600);
    // battery
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2.5;
    rrPath(ctx, 952, 80, 50, 26, 8);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    rrPath(ctx, 957, 85, 33, 16, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    rrPath(ctx, 1005, 87, 5, 12, 2);
    ctx.fill();

    // ---- punch hole
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(512, 92, 27, 0, Math.PI * 2);
    ctx.fill();
    const holeRing = ctx.createRadialGradient(512, 92, 18, 512, 92, 34);
    holeRing.addColorStop(0, 'rgba(40,60,85,0.0)');
    holeRing.addColorStop(1, 'rgba(90,140,190,0.18)');
    ctx.fillStyle = holeRing;
    ctx.beginPath();
    ctx.arc(512, 92, 34, 0, Math.PI * 2);
    ctx.fill();

    // ---- clock / date / weather
    text(ctx, '09:41', 512, 400, 190, 'rgba(255,255,255,0.97)', 200);
    text(ctx, '10月21日  星期二', 512, 512, 38, 'rgba(225,235,250,0.75)', 400);
    text(ctx, '23°', 434, 620, 80, 'rgba(255,255,255,0.94)', 300);
    text(ctx, '多云', 524, 626, 34, 'rgba(225,235,250,0.7)', 400);
    drawLucide(ctx, GLYPHS.sun, 366, 622, 46, { stroke: 'rgba(255,205,120,0.9)', lineWidth: 1.8 });
    text(ctx, '北京市 · 空气质量优', 512, 700, 26, 'rgba(200,215,235,0.5)', 400);

    // ---- app grid
    const APPS = [
      { label: '电话', glyph: 'phone', g1: '#31d158', g2: '#0f9d3a' },
      { label: '信息', glyph: 'message', g1: '#4cd964', g2: '#17963c' },
      { label: '相机', glyph: 'camera', g1: '#5b6472', g2: '#242932' },
      { label: '浏览器', glyph: 'globe', g1: '#39a8ff', g2: '#0b63d6' },
      { label: '相册', glyph: 'image', g1: '#ff7a8a', g2: '#e02c4f' },
      { label: '设置', glyph: 'settings', g1: '#8d939e', g2: '#4a4f58' },
      { label: '音乐', glyph: 'music', g1: '#ff5b6b', g2: '#c31432' },
      { label: '天气', glyph: 'sun', g1: '#4ba6ff', g2: '#1559ce' },
      { label: '日历', glyph: 'calendar', g1: '#ff6b5e', g2: '#c0281c' },
      { label: '时钟', glyph: 'clock', g1: '#3c414b', g2: '#14171d' },
      { label: '地图', glyph: 'pin', g1: '#4cd964', g2: '#0e8a36' },
      { label: '应用商店', glyph: 'bag', g1: '#ffb03a', g2: '#e07700' },
    ];
    const cols = 4;
    const iconSize = 158;
    const gapX = 34;
    const rowH = 248;
    const startX = (W - (cols * iconSize + (cols - 1) * gapX)) / 2;
    const startY = 790;

    APPS.forEach((app, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (iconSize + gapX);
      const y = startY + row * rowH;
      const cx = x + iconSize / 2;
      const cy = y + iconSize / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      const g = ctx.createLinearGradient(x, y, x + iconSize, y + iconSize);
      g.addColorStop(0, app.g1);
      g.addColorStop(1, app.g2);
      rrPath(ctx, x, y, iconSize, iconSize, 38);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      // inner highlight
      const g2 = ctx.createLinearGradient(x, y, x, y + iconSize);
      g2.addColorStop(0, 'rgba(255,255,255,0.22)');
      g2.addColorStop(0.5, 'rgba(255,255,255,0.03)');
      g2.addColorStop(1, 'rgba(0,0,0,0.12)');
      rrPath(ctx, x, y, iconSize, iconSize, 38);
      ctx.fillStyle = g2;
      ctx.fill();

      // glyph
      if (app.glyph === 'camera') {
        drawLucide(ctx, GLYPHS.camera, cx, cy - 2, 84, { stroke: 'rgba(255,255,255,0.94)', lineWidth: 1.6 });
        ctx.strokeStyle = 'rgba(255,255,255,0.94)';
        ctx.lineWidth = 5.2;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 26, 0, Math.PI * 2);
        ctx.stroke();
      } else if (app.glyph === 'image') {
        drawLucide(ctx, GLYPHS.image, cx, cy - 2, 86, { stroke: 'rgba(255,255,255,0.94)', lineWidth: 1.7 });
        ctx.strokeStyle = 'rgba(255,255,255,0.94)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 34, cy + 27);
        ctx.lineTo(cx - 10, cy + 2);
        ctx.lineTo(cx + 8, cy + 20);
        ctx.lineTo(cx + 24, cy + 7);
        ctx.lineTo(cx + 38, cy + 27);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.94)';
        ctx.beginPath();
        ctx.arc(cx - 24, cy - 22, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (app.glyph === 'settings') {
        drawLucide(ctx, GLYPHS.settings, cx, cy, 88, { stroke: 'rgba(255,255,255,0.92)', lineWidth: 1.5 });
      } else if (app.glyph === 'music') {
        drawLucide(ctx, GLYPHS.music, cx, cy, 84, { stroke: 'rgba(255,255,255,0.94)', lineWidth: 1.8 });
      } else if (app.glyph === 'calendar') {
        drawLucide(ctx, GLYPHS.calendar, cx, cy, 82, { stroke: 'rgba(255,255,255,0.92)', lineWidth: 1.7 });
        text(ctx, '21', cx, cy + 17, 36, 'rgba(255,255,255,0.95)', 600, 'center');
      } else if (app.glyph === 'clock') {
        drawLucide(ctx, GLYPHS.clock, cx, cy, 84, { stroke: 'rgba(255,255,255,0.92)', lineWidth: 1.8 });
      } else if (app.glyph === 'sun') {
        drawLucide(ctx, GLYPHS.sun, cx, cy - 4, 80, { stroke: 'rgba(255,238,170,0.95)', lineWidth: 1.8 });
        drawLucide(ctx, GLYPHS.cloud, cx + 8, cy + 30, 66, { stroke: 'rgba(255,255,255,0.92)', lineWidth: 2 });
      } else {
        drawLucide(ctx, GLYPHS[app.glyph], cx, cy, 84, { stroke: 'rgba(255,255,255,0.94)', lineWidth: 1.8 });
      }

      text(ctx, app.label, cx, y + iconSize + 34, 27, 'rgba(235,242,255,0.82)', 400, 'center');
    });

    // ---- page dots
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.arc(470 + i * 42, 1712, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- dock
    const dockX = 56;
    const dockY = 1760;
    const dockW = W - 112;
    const dockH = 236;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 24;
    rrPath(ctx, dockX, dockY, dockW, dockH, 74);
    ctx.fillStyle = 'rgba(190,215,255,0.11)';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    rrPath(ctx, dockX, dockY, dockW, dockH, 74);
    ctx.stroke();

    const dockApps = [
      { glyph: 'phone', g1: '#31d158', g2: '#0f9d3a' },
      { glyph: 'message', g1: '#4cd964', g2: '#17963c' },
      { glyph: 'globe', g1: '#39a8ff', g2: '#0b63d6' },
      { glyph: 'image', g1: '#ff7a8a', g2: '#e02c4f' },
    ];
    const dockIcon = 152;
    const dockGap = (dockW - 4 * dockIcon) / 5;
    dockApps.forEach((app, i) => {
      const x = dockX + dockGap + i * (dockIcon + dockGap);
      const y = dockY + (dockH - dockIcon) / 2;
      const cx = x + dockIcon / 2;
      const cy = y + dockIcon / 2;
      const g = ctx.createLinearGradient(x, y, x + dockIcon, y + dockIcon);
      g.addColorStop(0, app.g1);
      g.addColorStop(1, app.g2);
      rrPath(ctx, x, y, dockIcon, dockIcon, 36);
      ctx.fillStyle = g;
      ctx.fill();
      const hl = ctx.createLinearGradient(x, y, x, y + dockIcon);
      hl.addColorStop(0, 'rgba(255,255,255,0.22)');
      hl.addColorStop(1, 'rgba(0,0,0,0.12)');
      rrPath(ctx, x, y, dockIcon, dockIcon, 36);
      ctx.fillStyle = hl;
      ctx.fill();
      if (app.glyph === 'image') {
        drawLucide(ctx, GLYPHS.image, cx, cy, 80, { stroke: 'rgba(255,255,255,0.94)', lineWidth: 1.8 });
      } else {
        drawLucide(ctx, GLYPHS[app.glyph], cx, cy, 80, { stroke: 'rgba(255,255,255,0.94)', lineWidth: 1.8 });
      }
    });

    // ---- gesture bar
    rrPath(ctx, (W - 300) / 2, 2160, 300, 13, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fill();

    return texture(c, { anisotropy: 16 });
  }

  function createBackDecal() {
    // Official XIAOMI wordmark, drawn from the supplied logo image so the
    // rounded proprietary lettering is preserved exactly.
    const W = 256;
    const H = 1024;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const tex = texture(c, { anisotropy: 8 });

    if (XM15.LOGO_IMAGE) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, W, H);
        const scale = Math.min((H * 0.9) / img.width, (W * 0.62) / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.globalAlpha = 0.62;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
        tex.needsUpdate = true;
      };
      img.src = XM15.LOGO_IMAGE;
      return tex;
    }

    // fallback only if the supplied logo is unavailable
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(204, 211, 223, 0.5)';
    ctx.font = `600 108px "Century Gothic", "Avenir Next", "Trebuchet MS", ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '10px';
    ctx.fillText('XIAOMI', 0, 4);
    ctx.restore();
    tex.needsUpdate = true;
    return tex;
  }

  function createBatteryLabel() {
    const W = 640;
    const H = 1006;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#203249');
    bg.addColorStop(0.5, '#162435');
    bg.addColorStop(1, '#0d1722');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // subtle diagonal sheen
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sheen = ctx.createLinearGradient(0, 0, W, H);
    sheen.addColorStop(0, 'rgba(90,150,210,0.0)');
    sheen.addColorStop(0.45, 'rgba(90,150,210,0.14)');
    sheen.addColorStop(0.55, 'rgba(90,150,210,0.02)');
    sheen.addColorStop(1, 'rgba(90,150,210,0.0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // frame
    ctx.strokeStyle = 'rgba(160,200,240,0.22)';
    ctx.lineWidth = 3;
    rrPath(ctx, 22, 22, W - 44, H - 44, 20);
    ctx.stroke();

    // Xiaomi mark
    rrPath(ctx, 54, 58, 62, 62, 18);
    ctx.fillStyle = '#ff6900';
    ctx.fill();
    text(ctx, 'mi', 85, 91, 38, '#ffffff', 700, 'center');
    text(ctx, 'XIAOMI', 136, 92, 32, 'rgba(235,244,255,0.9)', 600, 'left', 6);

    text(ctx, '单电芯硅碳电池', 54, 170, 35, 'rgba(235,244,255,0.92)', 600);
    text(ctx, 'Silicon-Carbon Li-ion Battery', 54, 210, 22, 'rgba(170,195,220,0.6)', 400);

    // capacity
    text(ctx, '5400', 58, 330, 112, 'rgba(240,248,255,0.96)', 700);
    text(ctx, 'mAh', 330, 342, 42, 'rgba(170,200,230,0.75)', 500);
    text(ctx, '20.9Wh   3.87V', 58, 414, 27, 'rgba(180,205,230,0.7)', 500, 'left', 1);

    // spec rows
    const rows = [
      ['额定容量', '5260mAh'],
      ['典型容量', '5400mAh'],
      ['电池类型', '单电芯硅碳'],
      ['生产日期', '2024.10'],
      ['执行标准', 'GB 31241-2022'],
    ];
    rows.forEach((r, i) => {
      const y = 486 + i * 47;
      text(ctx, r[0], 58, y, 21, 'rgba(170,195,220,0.62)', 400);
      text(ctx, r[1], 320, y, 21, 'rgba(220,235,250,0.86)', 500);
      ctx.strokeStyle = 'rgba(150,180,210,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(58, y + 24);
      ctx.lineTo(W - 58, y + 24);
      ctx.stroke();
    });

    // warnings
    ctx.strokeStyle = 'rgba(255,190,80,0.8)';
    ctx.lineWidth = 3;
    [0, 1, 2].forEach((i) => {
      const x = 70 + i * 76;
      const y = 800;
      ctx.beginPath();
      ctx.moveTo(x + 24, y);
      ctx.lineTo(x + 47, y + 42);
      ctx.lineTo(x + 1, y + 42);
      ctx.closePath();
      ctx.stroke();
      text(ctx, '!', x + 24, y + 31, 20, 'rgba(255,190,80,0.9)', 700, 'center');
    });
    ctx.font = `400 18px ${FONT_STACK}`;
    ctx.fillStyle = 'rgba(190,210,230,0.55)';
    ctx.textAlign = 'left';
    ctx.fillText('请勿刺穿、挤压或投入火中', 306, 815);
    ctx.fillText('请使用原装充电器充电', 306, 842);

    // barcode
    ctx.fillStyle = 'rgba(230,240,250,0.72)';
    let bx = 58;
    for (let i = 0; i < 54; i++) {
      const w = 1 + ((i * 7) % 4);
      ctx.fillRect(bx, 886, w, 58);
      bx += w + 2 + ((i * 3) % 3);
    }
    text(ctx, 'Xiaomi 15 · 5400mAh', 58, 972, 20, 'rgba(180,200,220,0.5)', 400, 'left', 2);

    return texture(c, { anisotropy: 8 });
  }

  function createLeicaMark() {
    // LEICA / VARIO-SUMMILUX marking, arranged in three centered lines.
    const W = 512;
    const H = 240;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(238, 242, 248, 0.92)';
    ctx.font = `600 58px ${FONT_STACK}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '10px';
    ctx.fillText('LEICA', W / 2, 72);
    ctx.fillStyle = 'rgba(210, 218, 230, 0.7)';
    ctx.font = `500 20px ${FONT_STACK}`;
    ctx.letterSpacing = '2px';
    ctx.fillText('VARIO-SUMMILUX', W / 2, 146);
    ctx.fillStyle = 'rgba(196, 206, 220, 0.58)';
    ctx.font = `500 18px ${FONT_STACK}`;
    ctx.letterSpacing = '1.2px';
    ctx.fillText('1:1.62-2.2/14-60 ASPH.', W / 2, 178);
    return texture(c, { anisotropy: 8 });
  }

  function createCameraSheen() {
    // Split-tone camera glass: a silver upper-right reflection cut by a soft
    // diagonal boundary, leaving the lower-left of the island black.
    const S = 512;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);

    const silver = ctx.createLinearGradient(S * 0.9, S * 0.02, S * 0.25, S * 0.95);
    silver.addColorStop(0, 'rgba(238, 245, 255, 0.66)');
    silver.addColorStop(0.42, 'rgba(195, 208, 228, 0.36)');
    silver.addColorStop(0.72, 'rgba(145, 164, 188, 0.12)');
    silver.addColorStop(1, 'rgba(100, 120, 145, 0)');
    ctx.fillStyle = silver;
    ctx.fillRect(0, 0, S, S);

    // diagonal alpha mask
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createLinearGradient(S * 0.88, S * 0.04, S * 0.3, S * 0.96);
    mask.addColorStop(0, 'rgba(255,255,255,1)');
    mask.addColorStop(0.48, 'rgba(255,255,255,0.98)');
    mask.addColorStop(0.66, 'rgba(255,255,255,0.42)');
    mask.addColorStop(0.8, 'rgba(255,255,255,0)');
    mask.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = 'source-over';

    const streak = ctx.createLinearGradient(S * 0.74, S * 0.02, S * 0.46, S * 0.9);
    streak.addColorStop(0, 'rgba(255,255,255,0.42)');
    streak.addColorStop(0.38, 'rgba(255,255,255,0.18)');
    streak.addColorStop(0.66, 'rgba(255,255,255,0.03)');
    streak.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(0, 0, S, S);

    const glare = ctx.createRadialGradient(S * 0.79, S * 0.2, 0, S * 0.79, S * 0.2, S * 0.28);
    glare.addColorStop(0, 'rgba(255,255,255,0.24)');
    glare.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glare;
    ctx.fillRect(0, 0, S, S);

    return texture(c, { anisotropy: 8 });
  }

  function createIrSensorTexture() {
    // IR / laser-focus sensor window pattern inside the camera island.
    const S = 256;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);

    const core = ctx.createRadialGradient(128, 128, 0, 128, 128, 82);
    core.addColorStop(0, 'rgba(120, 58, 70, 0.55)');
    core.addColorStop(0.55, 'rgba(60, 32, 42, 0.28)');
    core.addColorStop(1, 'rgba(20, 20, 26, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(128, 128, 82, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(170, 178, 192, 0.38)';
    ctx.lineWidth = 2;
    [118, 92, 66].forEach((r) => {
      ctx.beginPath();
      ctx.arc(128, 128, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(205, 200, 210, 0.5)';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.beginPath();
        ctx.arc(98 + col * 20, 98 + row * 20, 3.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(230, 130, 130, 0.65)';
    ctx.beginPath();
    ctx.arc(128, 128, 5.5, 0, Math.PI * 2);
    ctx.fill();

    return texture(c, { anisotropy: 8 });
  }

  function createChipDecal() {
    const W = 512;
    const H = 512;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    // engraved look
    ctx.strokeStyle = 'rgba(220,235,250,0.35)';
    ctx.lineWidth = 2;
    rrPath(ctx, 24, 24, W - 48, H - 48, 12);
    ctx.stroke();
    text(ctx, 'SNAPDRAGON', 256, 170, 44, 'rgba(230,240,252,0.72)', 700, 'center', 8);
    text(ctx, '8 ELITE', 256, 262, 84, 'rgba(240,248,255,0.82)', 700, 'center', 4);
    text(ctx, 'SM8750  ·  3nm', 256, 346, 24, 'rgba(200,220,240,0.45)', 400, 'center', 2);
    // pin-1
    ctx.fillStyle = 'rgba(230,240,250,0.35)';
    ctx.beginPath();
    ctx.arc(68, 68, 8, 0, Math.PI * 2);
    ctx.fill();
    return texture(c, { anisotropy: 4 });
  }

  function makeGlowTexture() {
    const S = 256;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.04)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  function createGrilleTexture() {
    const S = 256;
    const c = makeCanvas(S, S);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        ctx.beginPath();
        ctx.arc(24 + x * 30, 24 + y * 30, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fill();
      }
    }
    return texture(c, { anisotropy: 4 });
  }

  XM15.makeGlowTexture = makeGlowTexture;

  /* ======================================================================
     PART BUILDERS
     ====================================================================== */

  function buildScreen() {
    const g = new T.Group();

    // inner black liner under the panel
    const linerMat = plastic(0x05070b, { roughness: 0.8 });
    const liner = slab(6.94, 14.98, 0.04, 1.0, linerMat, { bevel: 0.02 });
    liner.position.z = 0.255;
    g.add(liner);

    // LTPO panel with a painted home screen
    let screenTex;
    if (XM15.SCREEN_IMAGE) {
      // User-supplied Xiaomi 15 lock-screen wallpaper (embedded as data URL).
      screenTex = new T.TextureLoader().load(XM15.SCREEN_IMAGE);
      screenTex.colorSpace = T.SRGBColorSpace;
      screenTex.anisotropy = 16;
    } else {
      screenTex = createScreenTexture();
    }
    const panelMat = new T.MeshBasicMaterial({ map: screenTex, toneMapped: false });
    const panel = new T.Mesh(new T.PlaneGeometry(6.9, 14.94), panelMat);
    panel.position.z = 0.305;
    g.add(panel);

    // cover glass
    const coverMat = new T.MeshPhysicalMaterial({
      color: 0x0a1018,
      metalness: 0.25,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      envMapIntensity: 1.8,
    });
    const cover = slab(7.06, 15.11, 0.1, 1.0, coverMat, { bevel: 0.025, bevelSegments: 2 });
    cover.position.z = 0.345;
    cover.renderOrder = 3;
    g.add(cover);

    // anti-reflective sheen
    const sheenMat = new T.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0.02,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      envMapIntensity: 2,
    });
    const sheen = new T.Mesh(new T.PlaneGeometry(6.9, 14.94), sheenMat);
    sheen.position.z = 0.398;
    sheen.renderOrder = 4;
    g.add(sheen);

    // The supplied screen image already contains the correctly placed and
    // sized punch-hole camera; no separate 3D hole overlay is used.
    // ultrasonic fingerprint sensor (on the back of the panel)
    const fpBoard = slab(0.92, 1.25, 0.05, 0.18, plastic(0x113d2b, { metalness: 0.2, roughness: 0.5 }), { bevel: 0.015 });
    fpBoard.position.set(0, -5.15, 0.25);
    g.add(fpBoard);
    const fpRing = new T.Mesh(
      new T.TorusGeometry(0.3, 0.025, 8, 40),
      new T.MeshStandardMaterial({ color: 0x0b3f36, metalness: 0.6, roughness: 0.3, emissive: 0x0a5a4a, emissiveIntensity: 0.4 })
    );
    fpRing.position.set(0, -5.15, 0.278);
    g.add(fpRing);

    // display flex cable
    const flex = box(1.1, 1.6, 0.025, plastic(0xb56a1c, { roughness: 0.55 }));
    flex.position.set(-1.9, -6.6, 0.265);
    flex.rotation.z = 0.12;
    g.add(flex);

    // earpiece grille slot on the glass (top)
    const slot = slab(1.0, 0.05, 0.02, 0.02, plastic(0x020304), { bevel: 0.006 });
    slot.position.set(0, 7.52, 0.398);
    g.add(slot);

    return g;
  }

  function buildFrame() {
    const g = new T.Group();
    const frameMat = metal(0x3b414b, { roughness: 0.24, clearcoat: 0.55, envMapIntensity: 1.45 });
    const body = new T.Mesh(frameGeometry(7.18, 15.23, 0.64, 1.05, 0.17), frameMat);
    g.add(body);

    // antenna break lines on both sides
    const breakMat = plastic(0x0a0c10, { roughness: 0.85 });
    [-1, 1].forEach((side) => {
      [6.15, -6.15, 1.0, -3.4].forEach((y) => {
        const line = box(0.012, 0.055, 0.46, breakMat);
        line.position.set(side * 3.591, y, 0.02);
        g.add(line);
      });
    });

    // exposed pentalobe screws (visible after the back cover is removed)
    const screwMat = metal(0x6f7784, { roughness: 0.36 });
    const slotMat = plastic(0x14171c, { roughness: 0.7 });
    [
      [-2.95, 6.55],
      [2.95, 6.55],
      [-2.95, -6.55],
      [2.95, -6.55],
    ].forEach(([x, y]) => {
      const s = cyl(0.105, 0.105, 0.035, 20, screwMat);
      s.rotation.x = Math.PI / 2;
      s.position.set(x, y, -0.325);
      g.add(s);
      const slot = box(0.17, 0.018, 0.012, slotMat);
      slot.position.set(x, y, -0.345);
      g.add(slot);
      const slot2 = box(0.018, 0.17, 0.012, slotMat);
      slot2.position.set(x, y, -0.345);
      g.add(slot2);
    });

    // inner rim ledge
    const ledgeMat = plastic(0x0b0d11, { roughness: 0.75 });
    const ledge = new T.Mesh(frameGeometry(6.98, 15.03, 0.03, 0.98, 0.055), ledgeMat);
    ledge.position.z = 0.285;
    g.add(ledge);

    // bottom microphone pinhole (between USB-C and SIM tray)
    const micMat = plastic(0x010203, { roughness: 0.9 });
    const bottomMic = cyl(0.032, 0.032, 0.012, 12, micMat);
    bottomMic.position.set(-1.0, -7.612, 0.12);
    g.add(bottomMic);

    // bottom antenna / plastic break lines
    [1.0, -1.7].forEach((x) => {
      const seam = box(0.028, 0.018, 0.5, breakMat);
      seam.position.set(x, -7.611, 0.02);
      g.add(seam);
    });

    return g;
  }

  function createBackGlare() {
    // Soft, desaturated diagonal glass reflection. Edges fade to zero so the
    // plane never shows a rectangular boundary over the rounded back cover.
    const W = 512;
    const H = 1024;
    const c = makeCanvas(W, H);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const lg = ctx.createLinearGradient(0, 0, W, H * 0.78);
    lg.addColorStop(0, 'rgba(190, 215, 245, 0)');
    lg.addColorStop(0.34, 'rgba(195, 220, 250, 0.04)');
    lg.addColorStop(0.5, 'rgba(238, 246, 255, 0.22)');
    lg.addColorStop(0.66, 'rgba(190, 215, 245, 0.05)');
    lg.addColorStop(1, 'rgba(190, 215, 245, 0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'destination-in';
    const rg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, H * 0.62);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.72, 'rgba(255,255,255,0.55)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    return texture(c, { anisotropy: 8 });
  }

  function buildBack() {
    const g = new T.Group();
    const backMat = glassy(0x0b0c0f, {
      metalness: 0.18,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.65,
    });
    backMat.userData.noGlow = true;
    backMat.userData.backGlass = true;
    const back = slab(7.06, 15.11, 0.12, 1.0, backMat, { bevel: 0.028, bevelSegments: 2 });
    back.position.z = -0.35;
    g.add(back);

    // vertical "xiaomi" wordmark, lower-left when viewed from the back
    const decalTex = createBackDecal();
    const decal = new T.Mesh(
      new T.PlaneGeometry(0.58, 2.7),
      new T.MeshBasicMaterial({ map: decalTex, transparent: true, depthWrite: false, toneMapped: false })
    );
    decal.position.set(2.42, -5.42, -0.415);
    decal.rotation.y = Math.PI;
    g.add(decal);

    // glass reflection layer (opacity is animated on hover in app.js)
    const glare = new T.Mesh(
      new T.PlaneGeometry(6.75, 14.55),
      new T.MeshBasicMaterial({
        map: createBackGlare(),
        transparent: true,
        opacity: 0.012,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    glare.name = 'backGlare';
    glare.rotation.y = Math.PI;
    glare.position.set(0, 0, -0.418);
    glare.renderOrder = 2;
    g.add(glare);

    // subtle camera-island shadow plate
    const shadowPlate = slab(4.5, 4.55, 0.015, 1.0, plastic(0x05060a, { roughness: 0.5 }), { bevel: 0.01 });
    shadowPlate.position.set(0.91, 4.59, -0.414);
    g.add(shadowPlate);

    // independent vertical flash strip: outside the island, on the right upper side
    const flashFrame = slab(0.24, 0.62, 0.02, 0.08, metal(0xb08a50, { roughness: 0.32, clearcoat: 0.35 }), { bevel: 0.006 });
    flashFrame.position.set(-1.72, 6.25, -0.4135);
    g.add(flashFrame);

    const flashDiffuserMat = new T.MeshStandardMaterial({
      color: 0xead6a8,
      metalness: 0.05,
      roughness: 0.32,
      emissive: 0xffc27a,
      emissiveIntensity: 0.35,
    });
    flashDiffuserMat.userData.noGlow = true;
    const flashBar = slab(0.14, 0.5, 0.012, 0.06, flashDiffuserMat, { bevel: 0.005 });
    flashBar.position.set(-1.72, 6.25, -0.4215);
    g.add(flashBar);

    const ledMat = new T.MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false });
    [-0.16, 0, 0.16].forEach((dy) => {
      const led = new T.Mesh(new T.CircleGeometry(0.035, 16), ledMat);
      led.rotation.y = Math.PI;
      led.position.set(-1.72, 6.25 + dy, -0.4285);
      g.add(led);
    });

    return g;
  }

  function buildCamera() {
    const g = new T.Group();
    const cx = 0.91;
    const cy = 4.59;
    const iw = 4.3;
    const ih = 4.35;

    // The whole camera island is one raised block: a metal base with a black
    // glass face. Individual lenses/flash sit flush inside the glass.
    const baseMat = metal(0x6f747d, { roughness: 0.26, clearcoat: 0.45, envMapIntensity: 1.35 });
    const base = slab(iw + 0.16, ih + 0.16, 0.28, 1.05, baseMat, { bevel: 0.05, bevelSegments: 4 });
    base.position.set(cx, cy, -0.58);
    g.add(base);

    const islandMat = new T.MeshPhysicalMaterial({
      color: 0x010101,
      metalness: 0.1,
      roughness: 0.035,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 2.0,
    });
    islandMat.userData.noGlow = true;
    const island = slab(iw, ih, 0.26, 1.0, islandMat, { bevel: 0.045, bevelSegments: 4 });
    island.position.set(cx, cy, -0.6);
    g.add(island);

    // thin polished rim around the glass face
    const rim = new T.Mesh(
      frameGeometry(iw + 0.1, ih + 0.1, 0.03, 1.0, 0.045),
      metal(0xbfc4ca, { roughness: 0.18, clearcoat: 0.6, envMapIntensity: 1.6 })
    );
    rim.position.set(cx, cy, -0.731);
    g.add(rim);

    const lensGlowTex = XM15.makeGlowTexture();

    const flatRing = (inner, outer, z, material) => {
      const ring = new T.Mesh(new T.RingGeometry(inner, outer, 64), material);
      ring.rotation.y = Math.PI;
      ring.position.z = z;
      return ring;
    };

    const trimMat = metal(0x747a84, { roughness: 0.24, clearcoat: 0.4, envMapIntensity: 1.35 });
    const darkTrimMat = metal(0x25282e, { roughness: 0.32 });

    // Flush lens: recessed under the glass, with only a very thin trim ring.
    const lens = (x, y, r, tint) => {
      const lg = new T.Group();
      lg.position.set(x, y, 0);

      const outerTrim = flatRing(r + 0.004, r + 0.06, -0.7324, trimMat);
      lg.add(outerTrim);
      const innerTrim = flatRing(r * 0.86, r * 0.89, -0.733, darkTrimMat);
      lg.add(innerTrim);

      // subtle blue lens-coating ring, flat with the glass
      const coating = flatRing(
        r * 0.52,
        r * 0.55,
        -0.7343,
        new T.MeshBasicMaterial({
          color: 0x1f6f92,
          transparent: true,
          opacity: 0.36,
          blending: T.AdditiveBlending,
          toneMapped: false,
        })
      );
      lg.add(coating);

      const coatingArc = new T.Mesh(
        new T.TorusGeometry(r * 0.72, 0.007, 8, 32, Math.PI * 0.9),
        new T.MeshBasicMaterial({
          color: 0x7fd4ff,
          transparent: true,
          opacity: 0.3,
          blending: T.AdditiveBlending,
          toneMapped: false,
        })
      );
      coatingArc.rotation.y = Math.PI;
      coatingArc.rotation.z = 0.5;
      coatingArc.position.z = -0.7344;
      lg.add(coatingArc);

      const glassMat = new T.MeshPhysicalMaterial({
        color: tint,
        metalness: 0.9,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.015,
        envMapIntensity: 2.6,
        iridescence: 0.7,
        iridescenceIOR: 1.6,
        iridescenceThicknessRange: [120, 420],
      });
      glassMat.userData.noGlow = true;
      const glass = new T.Mesh(new T.CircleGeometry(r, 64), glassMat);
      glass.rotation.y = Math.PI;
      glass.position.z = -0.7338;
      lg.add(glass);

      // blue glass reflection
      const glow = new T.Mesh(
        new T.CircleGeometry(r * 0.94, 48),
        new T.MeshBasicMaterial({
          map: lensGlowTex,
          color: 0x2f86b8,
          transparent: true,
          opacity: 0.12,
          blending: T.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
      );
      glow.rotation.y = Math.PI;
      glow.position.set(-r * 0.08, r * 0.08, -0.7344);
      lg.add(glow);

      const core = new T.Mesh(
        new T.CircleGeometry(r * 0.5, 48),
        new T.MeshPhysicalMaterial({
          color: 0x03070d,
          metalness: 0.85,
          roughness: 0.06,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
          envMapIntensity: 1.8,
          iridescence: 0.5,
          iridescenceIOR: 1.5,
          iridescenceThicknessRange: [150, 360],
        })
      );
      core.rotation.y = Math.PI;
      core.position.z = -0.7342;
      lg.add(core);

      const highlight = new T.Mesh(
        new T.CircleGeometry(r * 0.105, 20),
        new T.MeshBasicMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.4, toneMapped: false })
      );
      highlight.rotation.y = Math.PI;
      highlight.position.set(-r * 0.3, r * 0.32, -0.7345);
      lg.add(highlight);

      return lg;
    };

    // 2x2 layout seen from the back: main top-left, IR sensor top-right,
    // 60mm telephoto bottom-left, 14mm ultra-wide bottom-right.
    // (From the rear, world +X appears on the viewer's left.)
    g.add(lens(cx + 0.98, cy + 1.0, 0.67, 0x0a2440));
    g.add(lens(cx + 0.98, cy - 1.0, 0.6, 0x101e36));
    g.add(lens(cx - 0.98, cy - 1.0, 0.58, 0x0a2038));

    // IR + laser-focus sensor window in the top-right quadrant.
    const fx = cx - 0.98;
    const fy = cy + 1.0;
    const sensorRing = flatRing(0.62, 0.7, -0.7324, trimMat);
    sensorRing.position.x = fx;
    sensorRing.position.y = fy;
    g.add(sensorRing);

    const sensorGlassMat = new T.MeshPhysicalMaterial({
      color: 0x1b1920,
      metalness: 0.3,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.6,
    });
    sensorGlassMat.userData.noGlow = true;
    const sensorGlass = new T.Mesh(new T.CircleGeometry(0.62, 64), sensorGlassMat);
    sensorGlass.rotation.y = Math.PI;
    sensorGlass.position.set(fx, fy, -0.7338);
    g.add(sensorGlass);

    const sensorInnerRing = flatRing(0.33, 0.37, -0.7341, metal(0x62666f, { roughness: 0.26 }));
    sensorInnerRing.position.x = fx;
    sensorInnerRing.position.y = fy;
    g.add(sensorInnerRing);

    const irPattern = new T.Mesh(
      new T.CircleGeometry(0.6, 64),
      new T.MeshBasicMaterial({
        map: createIrSensorTexture(),
        transparent: true,
        opacity: 1,
        depthWrite: false,
        toneMapped: false,
      })
    );
    irPattern.rotation.y = Math.PI;
    irPattern.position.set(fx, fy, -0.7344);
    g.add(irPattern);

    // three-line LEICA marking across the middle band of the island;
    // rotated 90° on the portrait phone so it reads in landscape.
    const leica = new T.Mesh(
      new T.PlaneGeometry(1.5, 0.52),
      new T.MeshBasicMaterial({ map: createLeicaMark(), transparent: true, depthWrite: false, toneMapped: false })
    );
    leica.position.set(cx, cy + 0.01, -0.7347);
    leica.rotation.y = Math.PI;
    leica.rotation.z = Math.PI / 2;
    g.add(leica);

    // camera-module microphone pinhole (front opening), inset at the left side
    const micRing = flatRing(0.06, 0.075, -0.7345, metal(0x5f646c, { roughness: 0.28 }));
    micRing.position.x = cx + 1.9;
    micRing.position.y = cy;
    g.add(micRing);
    const micHole = new T.Mesh(
      new T.CircleGeometry(0.055, 20),
      new T.MeshBasicMaterial({ color: 0x000000, toneMapped: false })
    );
    micHole.rotation.y = Math.PI;
    micHole.position.set(cx + 1.9, cy, -0.7348);
    g.add(micHole);

    return g;
  }

  function buildBattery() {
    const g = new T.Group();
    const cy = -1.25;
    const batteryMat = plastic(0x17232f, { metalness: 0.35, roughness: 0.5 });
    const body = slab(5.85, 9.2, 0.44, 0.26, batteryMat, { bevel: 0.04, bevelSegments: 3 });
    body.position.set(0, cy, 0.02);
    g.add(body);

    // silver edge band
    const band = new T.Mesh(frameGeometry(5.9, 9.24, 0.08, 0.28, 0.025), metal(0x8a939e, { roughness: 0.4 }));
    band.position.set(0, cy, -0.19);
    g.add(band);

    // label
    const label = new T.Mesh(
      new T.PlaneGeometry(5.35, 8.65),
      new T.MeshStandardMaterial({
        map: createBatteryLabel(),
        roughness: 0.62,
        metalness: 0.05,
        emissive: 0x233a4f,
        emissiveIntensity: 0.18,
      })
    );
    label.position.set(0, cy, 0.247);
    g.add(label);

    // top contact flex
    const flexMat = plastic(0xb56a1c, { roughness: 0.5 });
    const flex = box(1.5, 0.65, 0.03, flexMat);
    flex.position.set(0, cy + 4.72, 0.2);
    g.add(flex);
    const connectorMat = plastic(0x0d0f12, { roughness: 0.7 });
    const connector = box(0.75, 0.3, 0.12, connectorMat);
    connector.position.set(0, cy + 4.42, 0.2);
    g.add(connector);

    // pull tab
    const tabMat = plastic(0x161a20, { roughness: 0.7 });
    const tab = box(1.05, 0.6, 0.03, tabMat);
    tab.position.set(0, cy - 4.82, 0.235);
    g.add(tab);
    const tabHole = new T.Mesh(
      new T.TorusGeometry(0.12, 0.018, 8, 24),
      plastic(0x2a3038, { roughness: 0.6 })
    );
    tabHole.position.set(0, cy - 4.86, 0.253);
    g.add(tabHole);

    // side pressure marks
    const seamMat = plastic(0x0b1016, { roughness: 0.8 });
    [-1, 1].forEach((s) => {
      const seam = box(0.015, 8.5, 0.02, seamMat);
      seam.position.set(s * 2.93, cy, 0.24);
      g.add(seam);
    });

    return g;
  }

  function buildChip() {
    const g = new T.Group();
    const cx = -0.85;
    const cy = 6.1;

    // package substrate
    const pkg = slab(1.46, 1.46, 0.09, 0.1, plastic(0x0b0d12, { metalness: 0.25, roughness: 0.48 }), { bevel: 0.015 });
    pkg.position.set(cx, cy, -0.34);
    g.add(pkg);

    // gold contact pads peeking around the package
    const pinMat = metal(0xd8b46a, { roughness: 0.3, clearcoat: 0.4 });
    const strips = [
      [0, 0.72, 1.3, 0.045], [0, -0.72, 1.3, 0.045],
      [-0.72, 0, 0.045, 1.3], [0.72, 0, 0.045, 1.3],
    ];
    strips.forEach(([dx, dy, w, h]) => {
      const strip = box(w, h, 0.016, pinMat);
      strip.position.set(cx + dx, cy + dy, -0.386);
      g.add(strip);
    });

    // red Snapdragon 8 Elite sticker, supplied by the user
    let stickerTex;
    if (XM15.CHIP_IMAGE) {
      stickerTex = new T.TextureLoader().load(XM15.CHIP_IMAGE);
      stickerTex.colorSpace = T.SRGBColorSpace;
      stickerTex.anisotropy = 16;
    } else {
      stickerTex = createChipDecal();
    }
    const sticker = new T.Mesh(
      new T.PlaneGeometry(1.4, 1.4),
      new T.MeshBasicMaterial({ map: stickerTex, transparent: true, depthWrite: false, toneMapped: false })
    );
    sticker.rotation.y = Math.PI;
    sticker.position.set(cx, cy, -0.388);
    g.add(sticker);

    const rim = new T.Mesh(
      frameGeometry(1.5, 1.5, 0.018, 0.1, 0.03),
      metal(0x7d8792, { roughness: 0.32, clearcoat: 0.4 })
    );
    rim.rotation.y = Math.PI;
    rim.position.set(cx, cy, -0.386);
    g.add(rim);

    // small underfill bead at the base
    const bead = slab(1.5, 1.5, 0.03, 0.12, plastic(0x11141a, { roughness: 0.6 }), { bevel: 0.01 });
    bead.position.set(cx, cy, -0.305);
    g.add(bead);

    return g;
  }

  function buildMainboard() {
    const g = new T.Group();
    const cy = 5.55;
    const cz = -0.22;

    const pcbMat = plastic(0x0d2a23, { metalness: 0.25, roughness: 0.62 });
    const pcb = slab(5.7, 4.2, 0.12, 0.16, pcbMat, { bevel: 0.025 });
    pcb.position.set(0, cy, cz);
    g.add(pcb);

    // silkscreen border
    const silkMat = new T.MeshBasicMaterial({ color: 0x4e7a6a, transparent: true, opacity: 0.55, toneMapped: false });
    const silk = new T.Mesh(frameGeometry(5.45, 3.95, 0.006, 0.14, 0.02), silkMat);
    silk.position.set(0, cy, -0.282);
    g.add(silk);

    // removable SoC socket: the Snapdragon package itself is the separate
    // "chip" part, so the mainboard exposes a socket and gold contact ring.
    const socket = slab(1.56, 1.56, 0.06, 0.1, plastic(0x07090d, { roughness: 0.55 }), { bevel: 0.015 });
    socket.position.set(-0.85, cy + 0.55, -0.29);
    g.add(socket);

    const socketRim = new T.Mesh(
      frameGeometry(1.55, 1.55, 0.02, 0.1, 0.03),
      metal(0x6d7681, { roughness: 0.35, clearcoat: 0.4 })
    );
    socketRim.rotation.y = Math.PI;
    socketRim.position.set(-0.85, cy + 0.55, -0.325);
    g.add(socketRim);

    const padMat = metal(0xd8b46a, { roughness: 0.3, clearcoat: 0.4 });
    for (let i = 0; i < 6; i++) {
      const dx = -1.38 + i * 0.212;
      [-0.72, 0.72].forEach((dy) => {
        const pad = box(0.075, 0.035, 0.016, padMat);
        pad.position.set(-0.85 + dx, cy + 0.55 + dy, -0.328);
        g.add(pad);
      });
    }
    for (let i = 0; i < 6; i++) {
      const dy = -1.38 + i * 0.212;
      [-0.72, 0.72].forEach((dx) => {
        const pad = box(0.035, 0.075, 0.016, padMat);
        pad.position.set(-0.85 + dx, cy + 0.55 + dy, -0.328);
        g.add(pad);
      });
    }

    // RAM package
    const ram = slab(0.95, 0.85, 0.09, 0.06, metal(0x9aa4b0, { roughness: 0.45 }), { bevel: 0.015 });
    ram.position.set(1.25, cy + 0.85, -0.3);
    g.add(ram);

    // UFS
    const ufs = slab(0.9, 1.05, 0.09, 0.06, metal(0x7f8a96, { roughness: 0.48 }), { bevel: 0.015 });
    ufs.position.set(1.2, cy - 0.45, -0.3);
    g.add(ufs);

    // secondary RF shields
    const shield2 = slab(1.15, 0.9, 0.08, 0.08, metal(0x8e99a5, { roughness: 0.44 }), { bevel: 0.015 });
    shield2.position.set(-1.9, cy - 1.1, -0.3);
    g.add(shield2);
    const shield3 = slab(0.9, 1.15, 0.08, 0.08, metal(0x8e99a5, { roughness: 0.44 }), { bevel: 0.015 });
    shield3.position.set(0.2, cy - 1.45, -0.3);
    g.add(shield3);

    // capacitors & passives
    const capMat = plastic(0x2b2f36, { roughness: 0.5 });
    const capMat2 = plastic(0x6d4b2a, { roughness: 0.55 });
    const caps = [
      [-2.3, 1.35], [-2.1, 1.1], [-2.4, 0.9], [-1.5, 1.55], [-1.15, 1.62],
      [-0.3, 1.55], [0.35, 1.5], [0.85, 1.45], [1.7, 1.5], [2.2, 1.2],
      [2.4, 0.7], [2.3, 0.2], [-2.4, -0.3], [-2.2, -0.65], [-1.6, -0.5],
      [0.2, -0.1], [0.5, -0.9], [1.9, -1.35], [2.3, -1.1], [-0.7, -1.7],
    ];
    caps.forEach(([x, y], i) => {
      const c = box(0.09 + (i % 3) * 0.036, 0.055, 0.05, i % 4 === 0 ? capMat2 : capMat);
      c.position.set(x, cy + y, -0.296);
      g.add(c);
    });

    // BTB connectors along bottom edge
    [-2.1, -0.7, 0.9, 2.2].forEach((x, i) => {
      const conn = box(0.55, 0.22, 0.14, plastic(0x111318, { roughness: 0.6 }));
      conn.position.set(x, cy - 1.85, -0.29);
      g.add(conn);
      const pins = box(0.42, 0.05, 0.02, metal(0xc8a565, { roughness: 0.35 }));
      pins.position.set(x, cy - 1.85, -0.375);
      g.add(pins);
    });

    // flex ribbons leaving the board
    const flexMat = plastic(0xb56a1c, { roughness: 0.55 });
    const ribbon1 = new T.Mesh(new T.BoxGeometry(0.6, 1.2, 0.02), flexMat);
    ribbon1.position.set(1.9, cy + 1.35, -0.2);
    ribbon1.rotation.z = -0.22;
    g.add(ribbon1);
    const ribbon2 = new T.Mesh(new T.BoxGeometry(0.45, 1.1, 0.02), flexMat);
    ribbon2.position.set(-2.2, cy + 1.4, -0.2);
    ribbon2.rotation.z = 0.28;
    g.add(ribbon2);

    // mounting screws
    const screwMat = metal(0x6e7885, { roughness: 0.36 });
    [[-2.55, 1.75], [2.55, 1.75], [-2.55, -1.75], [2.55, -1.75]].forEach(([x, y]) => {
      const s = cyl(0.075, 0.075, 0.03, 16, screwMat);
      s.rotation.x = Math.PI / 2;
      s.position.set(x, cy + y, -0.3);
      g.add(s);
    });

    // tiny shielding fence
    const fenceMat = metal(0xb0bac6, { roughness: 0.4 });
    const fence = box(0.03, 1.0, 0.07, fenceMat);
    fence.position.set(-2.85, cy + 0.4, -0.31);
    g.add(fence);

    return g;
  }

  function buildVC() {
    const g = new T.Group();
    const cy = 0.35;
    const copper = metal(0xb46f3c, { roughness: 0.34, metalness: 1, clearcoat: 0.25, envMapIntensity: 1.4 });
    const copperDark = metal(0x7a472a, { roughness: 0.5, metalness: 1 });

    const plate = slab(6.0, 9.15, 0.055, 0.24, copper, { bevel: 0.02, bevelSegments: 2 });
    plate.position.set(0, cy, -0.235);
    g.add(plate);

    const border = new T.Mesh(frameGeometry(6.02, 9.17, 0.012, 0.25, 0.07), copperDark);
    border.position.set(0, cy, -0.262);
    g.add(border);

    // 3D IceLoop: ring channel + two return tubes
    const loop = new T.Mesh(new T.TorusGeometry(1.05, 0.055, 12, 64), copperDark);
    loop.position.set(0, cy + 0.9, -0.267);
    g.add(loop);
    const tubeMat = metal(0xa86336, { roughness: 0.4, metalness: 1 });
    [-1, 1].forEach((s) => {
      const tube = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 2.1, 12), tubeMat);
      tube.position.set(s * 1.05, cy - 0.25, -0.267);
      g.add(tube);
      const elbow = new T.Mesh(new T.TorusGeometry(0.16, 0.045, 8, 24, Math.PI / 2), tubeMat);
      elbow.position.set(s * 1.05, cy + 0.8, -0.267);
      elbow.rotation.z = s > 0 ? Math.PI : Math.PI / 2;
      g.add(elbow);
    });

    // embossed channels
    const channelMat = plastic(0x6b3a1f, { roughness: 0.6 });
    for (let i = 0; i < 5; i++) {
      const ch = box(4.6 - i * 0.3, 0.035, 0.008, channelMat);
      ch.position.set(0, cy - 2.9 + i * 0.55, -0.266);
      g.add(ch);
    }

    // graphite heat spreader under the loop
    const graphite = slab(5.6, 8.7, 0.012, 0.2, plastic(0x1c2027, { roughness: 0.6 }));
    graphite.position.set(0, cy, -0.2);
    g.add(graphite);

    return g;
  }

  function buildCoil() {
    const g = new T.Group();
    const cy = -0.85;
    const cz = -0.298;

    // flex substrate
    const substrate = new T.Mesh(
      new T.CircleGeometry(2.62, 64),
      plastic(0x2a1a10, { roughness: 0.6, metalness: 0.2 })
    );
    substrate.rotation.y = Math.PI;
    substrate.position.set(0, cy, cz - 0.012);
    g.add(substrate);

    const coilMat = metal(0xb87333, { roughness: 0.32, metalness: 1, clearcoat: 0.2 });
    [2.42, 2.16, 1.9, 1.64, 1.38].forEach((r) => {
      const ring = new T.Mesh(new T.TorusGeometry(r, 0.032, 10, 96), coilMat);
      ring.position.set(0, cy, cz);
      g.add(ring);
    });

    // spokes
    const spokeMat = metal(0x8c5228, { roughness: 0.45 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = box(0.035, 0.5, 0.012, spokeMat);
      spoke.position.set(Math.cos(a) * 2.42, cy + Math.sin(a) * 2.42, cz);
      spoke.rotation.z = a;
      g.add(spoke);
    }

    // NFC antenna trace
    const nfc = new T.Mesh(
      new T.TorusGeometry(2.55, 0.012, 6, 96, Math.PI * 1.3),
      metal(0xc9a35a, { roughness: 0.4 })
    );
    nfc.rotation.z = -0.5;
    nfc.position.set(0, cy, cz - 0.018);
    g.add(nfc);

    // control chip + NTC
    const chip = box(0.34, 0.24, 0.05, plastic(0x111318, { roughness: 0.55 }));
    chip.position.set(1.75, cy + 1.5, cz - 0.02);
    g.add(chip);
    [-1.4, 1.5].forEach((x) => {
      const ntc = cyl(0.05, 0.05, 0.07, 12, plastic(0x1d2b33, { roughness: 0.5 }));
      ntc.rotation.x = Math.PI / 2;
      ntc.position.set(x, cy - 1.8, cz - 0.03);
      g.add(ntc);
    });

    return g;
  }

  function buildPowerButton() {
    const g = new T.Group();
    const btnMat = metal(0x59616c, { roughness: 0.2, clearcoat: 0.5, envMapIntensity: 1.5 });
    const cap = slab(0.3, 0.95, 0.15, 0.12, btnMat, { bevel: 0.02 });
    cap.rotation.y = Math.PI / 2;
    cap.position.set(3.635, 1.9, -0.02);
    g.add(cap);

    // orange accent ring / line
    const accentMat = new T.MeshStandardMaterial({
      color: 0xff6900,
      metalness: 0.4,
      roughness: 0.35,
      emissive: 0xff4d00,
      emissiveIntensity: 0.35,
    });
    const accent = box(0.012, 0.78, 0.055, accentMat);
    accent.position.set(3.716, 1.9, 0.025);
    g.add(accent);

    // inner switch
    const switchMat = plastic(0x1a1e24, { roughness: 0.7 });
    const sw = box(0.1, 0.55, 0.22, switchMat);
    sw.position.set(3.5, 1.9, -0.02);
    g.add(sw);

    return g;
  }

  function buildVolumeKeys() {
    const g = new T.Group();
    const btnMat = metal(0x59616c, { roughness: 0.2, clearcoat: 0.5, envMapIntensity: 1.5 });
    [3.48, 2.58].forEach((y) => {
      const cap = slab(0.3, 0.8, 0.15, 0.1, btnMat, { bevel: 0.018 });
      cap.rotation.y = Math.PI / 2;
      cap.position.set(3.635, y, -0.02);
      g.add(cap);
    });
    // symbol engravings
    const symMat = plastic(0x1c2026, { roughness: 0.75 });
    [3.48, 2.58].forEach((y, i) => {
      const bar = box(0.008, 0.22, 0.018, symMat);
      bar.position.set(3.717, y, 0.055);
      g.add(bar);
      if (i === 0) {
        const bar2 = box(0.008, 0.22, 0.018, symMat);
        bar2.rotation.x = Math.PI / 2;
        bar2.position.set(3.717, y, 0.055);
        g.add(bar2);
      }
    });
    return g;
  }

  function buildUSBPort() {
    const g = new T.Group();

    // bottom daughter board
    const boardMat = plastic(0x0d2a23, { roughness: 0.58, metalness: 0.25 });
    const board = slab(2.4, 1.15, 0.09, 0.12, boardMat, { bevel: 0.02 });
    board.position.set(0, -6.95, -0.05);
    g.add(board);

    // USB-C shell
    const shellShape = roundedRectShape(0.98, 0.35, 0.16);
    const holeShape = roundedRectShape(0.78, 0.15, 0.07);
    shellShape.holes.push(holeShape);
    const shellGeo = new T.ExtrudeGeometry(shellShape, {
      depth: 0.42,
      bevelEnabled: false,
      curveSegments: 24,
      steps: 1,
    });
    shellGeo.rotateX(Math.PI / 2);
    const shellMat = metal(0x9aa3ae, { roughness: 0.28, clearcoat: 0.4 });
    const shell = new T.Mesh(shellGeo, shellMat);
    shell.position.set(0, -7.3, 0.0);
    g.add(shell);

    // inner cavity
    const cavityMat = plastic(0x050608, { roughness: 0.8 });
    const cavity = box(0.76, 0.34, 0.2, cavityMat);
    cavity.position.set(0, -7.48, 0.0);
    g.add(cavity);
    const tongue = box(0.62, 0.055, 0.1, plastic(0x232a32, { roughness: 0.5 }));
    tongue.position.set(0, -7.55, 0.0);
    g.add(tongue);

    // 24 gold pins
    const pinMat = metal(0xd8b46a, { roughness: 0.3 });
    for (let i = 0; i < 12; i++) {
      const x = -0.36 + i * 0.065;
      const pin = box(0.022, 0.02, 0.09, pinMat);
      pin.position.set(x, -7.6, -0.06);
      g.add(pin);
      const pin2 = box(0.022, 0.02, 0.09, pinMat);
      pin2.position.set(x, -7.6, 0.06);
      g.add(pin2);
    }

    // red waterproof gasket
    const gasket = new T.Mesh(
      frameGeometry(1.16, 0.52, 0.022, 0.18, 0.05),
      plastic(0x5a1c1c, { roughness: 0.6 })
    );
    gasket.rotation.x = Math.PI / 2;
    gasket.position.set(0, -7.36, 0.0);
    g.add(gasket);

    // board-to-board connector + chip
    const chip = box(0.4, 0.3, 0.07, plastic(0x101216, { roughness: 0.6 }));
    chip.position.set(0.85, -6.85, -0.14);
    g.add(chip);
    const conn = box(0.55, 0.2, 0.12, plastic(0x17191e, { roughness: 0.65 }));
    conn.position.set(-0.8, -6.7, -0.12);
    g.add(conn);
    const mic = cyl(0.055, 0.055, 0.05, 12, metal(0x6e7680, { roughness: 0.4 }));
    mic.position.set(-1.0, -7.05, -0.1);
    g.add(mic);

    return g;
  }

  function buildBottomSpeaker() {
    const g = new T.Group();

    // speaker capsule
    const bodyMat = plastic(0x181b21, { roughness: 0.65 });
    const capsule = slab(1.45, 0.82, 0.55, 0.18, bodyMat, { bevel: 0.04 });
    capsule.position.set(2.05, -6.88, -0.08);
    g.add(capsule);

    const cone = new T.Mesh(
      new T.CylinderGeometry(0.29, 0.32, 0.05, 32),
      plastic(0x0c0e12, { roughness: 0.7 })
    );
    cone.rotation.x = Math.PI / 2;
    cone.position.set(2.05, -6.9, -0.36);
    g.add(cone);
    const coneRing = new T.Mesh(
      new T.TorusGeometry(0.3, 0.03, 8, 40),
      metal(0x3a4048, { roughness: 0.4 })
    );
    coneRing.position.set(2.05, -6.9, -0.385);
    g.add(coneRing);

    // grille holes on the bottom edge (single row of eight, matching the photo)
    const holeMat = plastic(0x010203, { roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const hole = cyl(0.045, 0.045, 0.025, 12, holeMat);
      hole.position.set(1.18 + i * 0.23, -7.605, -0.02);
      g.add(hole);
    }

    // contact pads
    const padMat = metal(0xd0aa62, { roughness: 0.35 });
    [-0.35, 0.0, 0.35].forEach((x) => {
      const pad = box(0.12, 0.02, 0.1, padMat);
      pad.position.set(2.05 + x, -7.0, -0.38);
      g.add(pad);
    });

    return g;
  }

  function buildEarpiece() {
    const g = new T.Group();

    const body = slab(1.35, 0.4, 0.42, 0.14, plastic(0x181b21, { roughness: 0.65 }), { bevel: 0.03 });
    body.position.set(0, 7.25, 0.02);
    g.add(body);

    const diaphragm = new T.Mesh(
      new T.CircleGeometry(0.2, 32),
      metal(0x5a626e, { roughness: 0.4 })
    );
    diaphragm.position.set(-0.3, 7.28, 0.24);
    g.add(diaphragm);

    // top micro-slit grille
    const slotMat = plastic(0x020304, { roughness: 0.9 });
    const slot = slab(1.2, 0.045, 0.04, 0.02, slotMat, { bevel: 0.008 });
    slot.position.set(0, 7.6, 0.11);
    g.add(slot);
    const mesh = new T.Mesh(
      new T.PlaneGeometry(1.12, 0.035),
      new T.MeshBasicMaterial({ map: createGrilleTexture(), transparent: true, color: 0x9aa4b0, toneMapped: false })
    );
    mesh.position.set(0, 7.622, 0.11);
    mesh.rotation.x = -Math.PI / 2;
    g.add(mesh);

    // sealing foam
    const foamMat = plastic(0x2a2f36, { roughness: 0.85 });
    const foam = box(1.5, 0.1, 0.5, foamMat);
    foam.position.set(0, 7.06, 0.02);
    g.add(foam);

    return g;
  }

  function buildSimTray() {
    const g = new T.Group();

    // Filled SIM tray insert: a solid metal/plastic face framed by a thin seam,
    // not an open empty slot.
    const seam = new T.Mesh(
      frameGeometry(1.34, 0.38, 0.012, 0.1, 0.03),
      plastic(0x050608, { roughness: 0.8 })
    );
    seam.rotation.x = Math.PI / 2;
    seam.position.set(-2.35, -7.611, -0.03);
    g.add(seam);

    const trayMat = metal(0x8f959d, { roughness: 0.3, clearcoat: 0.35 });
    const tray = slab(1.22, 0.3, 0.02, 0.07, trayMat, { bevel: 0.008 });
    tray.rotation.x = Math.PI / 2;
    tray.position.set(-2.35, -7.619, -0.03);
    g.add(tray);

    // subtle engraved tray seam, still a filled surface
    const engraveMat = plastic(0x4a5059, { roughness: 0.7 });
    const engrave = box(0.5, 0.012, 0.012, engraveMat);
    engrave.position.set(-2.52, -7.63, -0.03);
    g.add(engrave);

    const pin = new T.Mesh(
      new T.CircleGeometry(0.034, 16),
      plastic(0x000000, { roughness: 1 })
    );
    pin.rotation.x = -Math.PI / 2;
    pin.position.set(-3.03, -7.632, -0.03);
    g.add(pin);

    return g;
  }

  /* ======================================================================
     ASSEMBLY
     ====================================================================== */
  const BUILDERS = {
    screen: buildScreen,
    frame: buildFrame,
    back: buildBack,
    camera: buildCamera,
    battery: buildBattery,
    mainboard: buildMainboard,
    chip: buildChip,
    vc: buildVC,
    coil: buildCoil,
    power: buildPowerButton,
    volume: buildVolumeKeys,
    usb: buildUSBPort,
    speaker: buildBottomSpeaker,
    earpiece: buildEarpiece,
    sim: buildSimTray,
  };

  XM15.buildModel = function buildModel() {
    const root = new T.Group();
    root.name = 'Xiaomi15';
    const parts = Object.create(null);

    XM15.PARTS.forEach((meta) => {
      const builder = BUILDERS[meta.id];
      if (!builder) return;
      const group = builder();
      group.name = 'part-' + meta.id;

      // Move all geometry under a pivot placed at the part centre. This lets
      // selected parts rotate around themselves (e.g. flip the camera module
      // to reveal its lenses) without swinging around the phone origin.
      const initialBox = new T.Box3().setFromObject(group);
      const pivotCenter = initialBox.getCenter(new T.Vector3());
      const pivot = new T.Group();
      pivot.position.copy(pivotCenter);
      Array.from(group.children).forEach((child) => {
        group.remove(child);
        child.position.sub(pivotCenter);
        pivot.add(child);
      });
      group.add(pivot);
      root.add(group);

      const box3 = new T.Box3().setFromObject(group);
      const size = box3.getSize(new T.Vector3());
      const center = box3.getCenter(new T.Vector3());
      const anchor = meta.anchor
        ? new T.Vector3(meta.anchor[0], meta.anchor[1], meta.anchor[2])
        : center.clone();

      const meshes = [];
      const materials = [];
      const seen = new Set();
      group.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.userData.partId = meta.id;
        meshes.push(obj);
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if (m && !seen.has(m)) {
            seen.add(m);
            materials.push(m);
          }
        });
      });

      parts[meta.id] = {
        meta: meta,
        group: group,
        pivot: pivot,
        box: box3,
        size: size,
        center: center,
        anchor: anchor,
        meshes: meshes,
        materials: materials,
        basePositions: group.position.clone(),
      };
    });

    return { root: root, parts: parts };
  };
})();
