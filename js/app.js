/* =========================================================================
   Xiaomi 15 · 3D Teardown Lab
   app.js — scene, custom orbit controls, part interaction, labels, HUD
   ========================================================================= */
(function () {
  'use strict';

  const XM15 = window.XM15;
  const T = window.THREE;
  const PARTS = XM15.PARTS;
  const REMOVABLE = PARTS.filter((p) => !p.fixed);
  const PRODUCT = XM15.PRODUCT;
  const metaById = new Map(PARTS.map((p) => [p.id, p]));

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad2 = (n) => String(n).padStart(2, '0');
  const Y_AXIS = new T.Vector3(0, 1, 0);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ------------------------------------------------------------------ state */
  const state = {
    selected: null,
    hovered: null,
    hoverSource: null,
    autoRotate: false,
    ready: false,
    firstFrame: false,
    helpOpen: false,
    specOpen: false,
    toastTimer: 0,
    tipTimer: 0,
    frames: 0,
    fpsTime: 0,
    progress: -1,
    press: null,
    hoverLock: false,
    lastPointer: { x: 0, y: 0 },
    initStart: 0,
  };

  const dom = {};
  const partsById = new Map();
  const labelItems = [];
  const pickables = [];
  const tmpVec = new T.Vector3();
  const tmpVec2 = new T.Vector3();

  let renderer = null;
  let scene = null;
  let camera = null;
  let controls = null;
  let clock = null;
  let model = null;
  let raycaster = null;
  let glowTexture = null;
  let stars = null;
  let orbitRings = [];
  let backdropGlows = [];

  /* =====================================================================
     boot
     ===================================================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    cacheDom();
    state.initStart = performance.now();
    startLoadingTips();

    try {
      setupRenderer();
    } catch (err) {
      console.error(err);
      showFatal('无法初始化 WebGL', err && err.message ? err.message : '请确认浏览器已启用硬件加速。');
      return;
    }

    setupScene();
    setupLights();
    setupEnvironment();
    setupWorld();
    setupModel();
    setupLabels();
    setupUI();
    setupControls();
    bindEvents();
    resize();

    clock = new T.Clock();
    raycaster = new T.Raycaster();
    state.fpsTime = performance.now();

    requestAnimationFrame(animate);
  }

  function cacheDom() {
    const ids = [
      'scene', 'labelLayer', 'leaderLines', 'tooltip', 'partList', 'partCount',
      'progressText', 'progressBar', 'detailBody', 'detailPanel', 'detailHint',
      'drawInfo', 'fps', 'calls', 'btnExplode', 'btnRestore', 'btnRotate',
      'btnReset', 'btnHelp', 'btnSpec', 'helpModal', 'helpClose', 'specModal',
      'specClose', 'specSheet', 'detailClose', 'toast', 'loading', 'loadingTip',
      'partsPanel', 'btnList',
    ];
    ids.forEach((id) => {
      dom[id] = document.getElementById(id);
    });
  }

  /* =====================================================================
     renderer / scene / camera
     ===================================================================== */
  function setupRenderer() {
    renderer = new T.WebGLRenderer({
      canvas: dom.scene,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setClearColor(0x000000, 0);

    dom.scene.addEventListener(
      'webglcontextlost',
      (e) => {
        e.preventDefault();
        showToast('WebGL 上下文丢失，请刷新页面');
      },
      false
    );
  }

  function setupScene() {
    scene = new T.Scene();
    scene.fog = new T.FogExp2(0x03060b, 0.0092);

    camera = new T.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 400);
    camera.position.set(11, 7.5, 26);
    camera.lookAt(0, 0.2, 0);
  }

  function setupLights() {
    const hemi = new T.HemisphereLight(0x9cc9ff, 0x080d14, 1.05);
    scene.add(hemi);

    const key = new T.DirectionalLight(0xffffff, 3.1);
    key.position.set(14, 20, 22);
    scene.add(key);

    const fill = new T.DirectionalLight(0x4f8dff, 1.9);
    fill.position.set(-20, -8, -8);
    scene.add(fill);

    const rimCyan = new T.PointLight(0x2fe0ff, 210, 90, 1.7);
    rimCyan.position.set(-18, 12, -16);
    scene.add(rimCyan);

    const rimOrange = new T.PointLight(0xff6a2b, 150, 70, 1.9);
    rimOrange.position.set(18, -12, 12);
    scene.add(rimOrange);

    const top = new T.PointLight(0xffffff, 110, 55, 2);
    top.position.set(0, 23, 6);
    scene.add(top);

    const backKey = new T.DirectionalLight(0xbfe6ff, 1.7);
    backKey.position.set(-14, 16, -20);
    scene.add(backKey);

    const bottom = new T.PointLight(0x1a7fb8, 90, 60, 2);
    bottom.position.set(0, -18, 8);
    scene.add(bottom);
  }

  function setupEnvironment() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const sky = ctx.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#010206');
    sky.addColorStop(0.3, '#071421');
    sky.addColorStop(0.48, '#0d2a3c');
    sky.addColorStop(0.52, '#071019');
    sky.addColorStop(0.72, '#02050a');
    sky.addColorStop(1, '#010103');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(26px)';
    const streak = (x, y, w, h, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, h / w);
      ctx.beginPath();
      ctx.arc(0, 0, w, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    streak(280, 158, 360, 90, 'rgba(70,200,255,0.75)');
    streak(620, 120, 220, 70, 'rgba(255,255,255,0.85)');
    streak(860, 225, 200, 110, 'rgba(255,110,60,0.55)');
    streak(120, 300, 180, 60, 'rgba(70,110,255,0.35)');
    ctx.restore();

    ctx.strokeStyle = 'rgba(120,220,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 236);
    ctx.lineTo(1024, 236);
    ctx.stroke();

    const envTexture = new T.CanvasTexture(canvas);
    envTexture.mapping = T.EquirectangularReflectionMapping;
    envTexture.colorSpace = T.SRGBColorSpace;

    const pmrem = new T.PMREMGenerator(renderer);
    const envRT = pmrem.fromEquirectangular(envTexture);
    scene.environment = envRT.texture;
    pmrem.dispose();
    envTexture.dispose();
  }

  /* =====================================================================
     decorative world
     ===================================================================== */
  function setupWorld() {
    glowTexture = XM15.makeGlowTexture();

    // star field
    const STAR_COUNT = 1500;
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starCol = new Float32Array(STAR_COUNT * 3);
    const color = new T.Color();
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 34 + Math.random() * 70;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi) * 0.75;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      color.setHSL(0.52 + Math.random() * 0.12, 0.6, 0.55 + Math.random() * 0.35);
      starCol[i * 3] = color.r;
      starCol[i * 3 + 1] = color.g;
      starCol[i * 3 + 2] = color.b;
    }
    const starGeo = new T.BufferGeometry();
    starGeo.setAttribute('position', new T.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new T.BufferAttribute(starCol, 3));
    const starMat = new T.PointsMaterial({
      size: 0.28,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: T.AdditiveBlending,
      toneMapped: false,
    });
    stars = new T.Points(starGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);

    // polar grid floor
    const grid = new T.PolarGridHelper(30, 16, 10, 96, 0x1c5c72, 0x0a222c);
    grid.position.y = -10.6;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    grid.material.depthWrite = false;
    grid.material.toneMapped = false;
    scene.add(grid);

    // platform rings
    const ringMat = new T.MeshBasicMaterial({
      color: 0x2a9fc4,
      transparent: true,
      opacity: 0.32,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ring1 = new T.Mesh(new T.TorusGeometry(15, 0.012, 6, 220), ringMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = -10.35;
    scene.add(ring1);

    const ring2 = new T.Mesh(
      new T.TorusGeometry(12, 0.008, 6, 200),
      new T.MeshBasicMaterial({
        color: 0x2a9fc4,
        transparent: true,
        opacity: 0.16,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -10.34;
    scene.add(ring2);

    // tilted holographic orbit rings around the phone
    const orbitMat = new T.MeshBasicMaterial({
      color: 0x1f8fb0,
      transparent: true,
      opacity: 0.17,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const orbit1 = new T.Mesh(new T.TorusGeometry(17.5, 0.014, 5, 240), orbitMat);
    orbit1.rotation.set(1.18, 0.12, 0.4);
    scene.add(orbit1);
    const orbit2 = new T.Mesh(
      new T.TorusGeometry(20.5, 0.01, 5, 240),
      new T.MeshBasicMaterial({
        color: 0x2b6f88,
        transparent: true,
        opacity: 0.1,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    orbit2.rotation.set(1.42, -0.25, -0.2);
    scene.add(orbit2);
    orbitRings = [orbit1, orbit2];

    // soft backlight blooms
    addBackdropGlow(0x0d6a8a, 0, 1, -34, 42, 0.5);
    addBackdropGlow(0x1c4fd8, -22, 13, -24, 24, 0.16);
    addBackdropGlow(0xff5a1e, 22, -13, -20, 20, 0.14);

    // floor light pool
    const pool = new T.Mesh(
      new T.CircleGeometry(18, 64),
      new T.MeshBasicMaterial({
        map: glowTexture,
        color: 0x14627a,
        transparent: true,
        opacity: 0.3,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -10.5;
    pool.scale.setScalar(1.35);
    scene.add(pool);

    // faint vertical light shaft behind the phone
    const shaft = new T.Mesh(
      new T.PlaneGeometry(16, 46),
      new T.MeshBasicMaterial({
        map: glowTexture,
        color: 0x0e4d63,
        transparent: true,
        opacity: 0.28,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
    shaft.position.set(0, 1, -30);
    scene.add(shaft);
  }

  function addBackdropGlow(color, x, y, z, scale, opacity) {
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: glowTexture,
        color: color,
        transparent: true,
        opacity: opacity,
        blending: T.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        toneMapped: false,
      })
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale, 1);
    backdropGlows.push({ sprite, base: opacity, phase: Math.random() * Math.PI * 2 });
    scene.add(sprite);
    return sprite;
  }

  /* =====================================================================
     model + per-part highlight objects
     ===================================================================== */
  function setupModel() {
    model = XM15.buildModel();
    scene.add(model.root);

    PARTS.forEach((meta) => {
      const rec = model.parts[meta.id];
      if (!rec) return;

      rec.anim = { p: 0, target: 0, delay: 0 };
      rec.glow = 0;
      rec.accentColor = new T.Color(meta.accent);
      rec.emissiveState = rec.materials
        .filter((m) => m && m.emissive && !m.userData.noGlow)
        .map((m) => ({
          mat: m,
          color: m.emissive.clone(),
          intensity: m.emissiveIntensity != null ? m.emissiveIntensity : 1,
        }));

      rec.glassMats = rec.materials
        .filter((m) => m && m.userData.backGlass)
        .map((m) => ({
          mat: m,
          env: m.envMapIntensity,
          rough: m.roughness,
        }));
      rec.glare = rec.group.getObjectByName('backGlare');

      // selection bracket
      const size = rec.size;
      const center = rec.center;
      const boxGeo = new T.BoxGeometry(size.x + 0.09, size.y + 0.09, size.z + 0.09);
      const edgeGeo = new T.EdgesGeometry(boxGeo);
      const outlineMat = new T.LineBasicMaterial({
        color: new T.Color(meta.accent),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      });
      const outline = new T.LineSegments(edgeGeo, outlineMat);
      outline.position.copy(center);
      outline.visible = false;
      outline.renderOrder = 8;
      rec.group.add(outline);
      rec.outline = outline;
      boxGeo.dispose();

      // soft halo
      const haloSize = clamp(Math.max(size.x, size.y, size.z) * 0.82, 1.8, 6.2);
      const halo = new T.Sprite(
        new T.SpriteMaterial({
          map: glowTexture,
          color: new T.Color(meta.accent),
          transparent: true,
          opacity: 0,
          blending: T.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          toneMapped: false,
        })
      );
      halo.position.copy(center);
      halo.scale.set(haloSize, haloSize, 1);
      halo.visible = false;
      halo.renderOrder = 2;
      rec.group.add(halo);
      rec.halo = halo;

      partsById.set(meta.id, rec);
      pickables.push(...rec.meshes);
    });
  }

  /* =====================================================================
     labels
     ===================================================================== */
  function setupLabels() {
    PARTS.forEach((meta) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'part-label';
      el.dataset.id = meta.id;
      el.style.setProperty('--accent', meta.accent);
      el.innerHTML =
        `<span class="part-label__idx">${pad2(meta.index)}</span>` +
        `<span class="part-label__text"><b>${meta.name}</b><small>${meta.tag}</small></span>`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPartOnly(meta.id);
        showcaseLabel(meta.id);
      });
      el.addEventListener('mouseenter', () => setHovered(meta.id, 'label'));
      el.addEventListener('mouseleave', () => setHovered(null, null));
      el.style.opacity = '0';
      dom.labelLayer.appendChild(el);

      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('stroke', meta.accent);
      line.setAttribute('stroke-opacity', '0.4');
      line.style.display = 'none';
      dom.leaderLines.appendChild(line);

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '2.4');
      dot.setAttribute('fill', meta.accent);
      dot.setAttribute('fill-opacity', '0.9');
      dot.style.display = 'none';
      dom.leaderLines.appendChild(dot);

      labelItems.push({ id: meta.id, el: el, meta: meta, line: line, dot: dot, ax: 0, ay: 0 });
    });
  }

  function showcaseLabel(id) {
    const rec = partsById.get(id);
    if (!rec) return;
    showToast(`${rec.meta.name} · ${rec.meta.tag}`);
  }

  /* =====================================================================
     custom orbit controls (dependency-free)
     ===================================================================== */
  class OrbitLite {
    constructor(cameraObj, element) {
      this.camera = cameraObj;
      this.dom = element;
      this.target = new T.Vector3(0, 0.2, 0);
      this.targetGoal = this.target.clone();
      this.theta = 0.46;
      this.phi = 1.36;
      this.radius = 30;
      this.thetaGoal = this.theta;
      this.phiGoal = this.phi;
      this.radiusGoal = this.radius;
      this.minRadius = 14;
      this.maxRadius = 56;
      this.minPhi = 0.3;
      this.maxPhi = Math.PI - 0.16;
      this.autoRotate = false;
      this.autoSpeed = 0.14;
      this.dragging = false;
      this.dragDistance = 0;
      this.pointers = new Map();
      this.panMode = false;
      this.pinchStart = 0;
      this.pinchRadius = this.radiusGoal;
      this._rightVec = new T.Vector3();
      this._upVec = new T.Vector3();
      this._bind();
      this.update(0.016);
    }

    _bind() {
      const el = this.dom;
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('pointerdown', (e) => this._down(e));
      el.addEventListener('pointermove', (e) => this._move(e));
      el.addEventListener('pointerup', (e) => this._up(e));
      el.addEventListener('pointercancel', (e) => this._up(e));
      el.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    }

    _down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
      try {
        this.dom.setPointerCapture(e.pointerId);
      } catch (err) {
        /* pointer capture is a nice-to-have */
      }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        this.dragging = true;
        this.dragDistance = 0;
        this.panMode = e.button === 2 || e.shiftKey || e.ctrlKey;
        this.dom.classList.add('is-dragging');
      } else if (this.pointers.size === 2) {
        this.dragDistance = 999;
        const pts = Array.from(this.pointers.values());
        this.pinchStart = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.pinchRadius = this.radiusGoal;
      }
    }

    _move(e) {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;

      if (this.pointers.size >= 2) {
        const pts = Array.from(this.pointers.values());
        if (pts.length >= 2 && this.pinchStart > 0) {
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          if (dist > 4) {
            this.radiusGoal = clamp(
              this.pinchRadius * (this.pinchStart / dist),
              this.minRadius,
              this.maxRadius
            );
          }
        }
        return;
      }

      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      if (this.panMode) {
        this._pan(dx, dy);
      } else {
        this.thetaGoal -= dx * 0.0062;
        this.phiGoal = clamp(this.phiGoal - dy * 0.0055, this.minPhi, this.maxPhi);
      }
    }

    _up(e) {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) {
        this.dragging = false;
        this.panMode = false;
        this.dom.classList.remove('is-dragging');
      }
      if (this.pointers.size < 2) this.pinchStart = 0;
    }

    _wheel(e) {
      e.preventDefault();
      const delta = clamp(e.deltaY, -120, 120);
      this.radiusGoal = clamp(
        this.radiusGoal * Math.exp(delta * 0.0011),
        this.minRadius,
        this.maxRadius
      );
    }

    _pan(dx, dy) {
      const scale = this.radius * 0.0017;
      this._rightVec.setFromMatrixColumn(this.camera.matrixWorld, 0);
      this._upVec.setFromMatrixColumn(this.camera.matrixWorld, 1);
      this.targetGoal.addScaledVector(this._rightVec, -dx * scale);
      this.targetGoal.addScaledVector(this._upVec, dy * scale);
      this.targetGoal.x = clamp(this.targetGoal.x, -9, 9);
      this.targetGoal.y = clamp(this.targetGoal.y, -9, 10);
      this.targetGoal.z = clamp(this.targetGoal.z, -6, 6);
    }

    reset() {
      this.thetaGoal = 0.46;
      this.phiGoal = 1.36;
      this.radiusGoal = 30;
      this.targetGoal.set(0, 0.2, 0);
    }

    update(dt) {
      if (this.autoRotate && this.pointers.size === 0) {
        this.thetaGoal += this.autoSpeed * dt;
      }
      const k = 1 - Math.exp(-dt * 9);
      this.theta += (this.thetaGoal - this.theta) * k;
      this.phi += (this.phiGoal - this.phi) * k;
      this.radius += (this.radiusGoal - this.radius) * k;
      this.target.lerp(this.targetGoal, k);

      const sinPhi = Math.sin(this.phi);
      this.camera.position.set(
        this.target.x + this.radius * sinPhi * Math.sin(this.theta),
        this.target.y + this.radius * Math.cos(this.phi),
        this.target.z + this.radius * sinPhi * Math.cos(this.theta)
      );
      this.camera.lookAt(this.target);
    }
  }

  function setupControls() {
    controls = new OrbitLite(camera, dom.scene);
  }

  /* =====================================================================
     UI
     ===================================================================== */
  function setupUI() {
    buildPartList();
    renderOverview();
    renderSpecSheet();
    updateProgress(true);
    syncList();
  }

  function buildPartList() {
    const frag = document.createDocumentFragment();
    PARTS.forEach((meta) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'part-item';
      btn.dataset.id = meta.id;
      btn.style.setProperty('--accent', meta.accent);
      btn.innerHTML =
        `<span class="part-item__idx">${pad2(meta.index)}</span>` +
        `<span class="part-item__main"><b>${meta.name}</b><small>${meta.en}</small></span>` +
        `<span class="part-item__state"><i></i><span>${meta.fixed ? '基准' : '待拆'}</span></span>`;
      btn.addEventListener('click', () => onListClick(meta.id));
      btn.addEventListener('mouseenter', () => setHovered(meta.id, 'list'));
      btn.addEventListener('mouseleave', () => setHovered(null, null));
      frag.appendChild(btn);
    });
    dom.partList.appendChild(frag);
    dom.partCount.textContent = String(PARTS.length);
  }

  function renderOverview() {
    const specs = PRODUCT.specs
      .map(
        (s) =>
          `<div class="spec-card"><span>${s.k}</span><b>${s.v}</b><small>${s.s}</small></div>`
      )
      .join('');
    dom.detailBody.innerHTML =
      `<div class="overview">` +
      `<div class="overview__kicker"><span class="dot"></span>XIAOMI 15 · ${PRODUCT.year} · 拆解档案</div>` +
      `<h3 class="overview__title">小屏旗舰<br><em>结构全解析</em></h3>` +
      `<p class="overview__desc">${PRODUCT.intro}</p>` +
      `<div class="spec-grid">${specs}</div>` +
      `<div class="overview__hint"><span class="kbd">CLICK</span><span>点击 3D 机身上的任意部件，触发拆解动画并查看结构参数</span></div>` +
      `<button class="official-spec-btn" data-act="spec-sheet"><span class="official-spec-btn__left"><i></i>查看完整官方参数</span><span class="official-spec-btn__right">SPEC SHEET ↗</span></button>` +
      `<p class="overview__note">${PRODUCT.disclaimer}<br>DATA SOURCE · 小米官网 Xiaomi 15 参数页 · ${PRODUCT.official ? PRODUCT.official.updated : ''}</p>` +
      `</div>`;
    dom.detailHint.textContent = '选择部件查看参数';
  }

  function renderSpecSheet() {
    const spec = PRODUCT.official;
    if (!spec || !dom.specSheet) return;
    dom.specSheet.innerHTML = spec.sections
      .map(
        (section) =>
          `<div class="spec-block"><h3>${section.title}</h3>` +
          section.rows
            .map(([key, value]) => `<div class="spec-row"><span>${key}</span><b>${value}</b></div>`)
            .join('') +
          `</div>`
      )
      .join('');
  }

  function renderPartDetail(meta) {
    const rec = partsById.get(meta.id);
    if (!rec) return;
    const exploded = rec.anim.target > 0.5;
    const rows = meta.specs
      .map((s) => `<div class="spec-row"><span>${s.k}</span><b>${s.v}</b></div>`)
      .join('');
    const meter = [1, 2, 3, 4, 5]
      .map((i) => `<i class="${i <= meta.repair ? 'on' : ''}"></i>`)
      .join('');
    const stateText = meta.fixed ? '结构基准' : exploded ? '已拆下' : '装配中';
    const actionLabel = exploded ? '装回机身' : '拆下该部件';
    const actionIcon = exploded
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    const action = meta.fixed
      ? `<button class="action action--primary" disabled>结构基准 · 不可拆解</button>`
      : `<button class="action action--primary" data-act="toggle" data-id="${meta.id}">${actionIcon}${actionLabel}</button>`;

    dom.detailBody.innerHTML =
      `<div class="part-detail" style="--accent:${meta.accent}">` +
      `<div class="part-detail__top">` +
      `<span class="part-detail__idx">${pad2(meta.index)}</span>` +
      `<span class="tag">${meta.category}</span>` +
      `<span class="part-detail__state ${exploded ? 'is-out' : ''}">${stateText}</span>` +
      `</div>` +
      `<h3>${meta.name}</h3>` +
      `<p class="part-detail__en">${meta.en}</p>` +
      `<p class="part-detail__desc">${meta.desc}</p>` +
      `<div class="spec-list">${rows}</div>` +
      `<div class="repair"><div class="repair__head"><span>拆解难度</span><b>${meta.repairText} · ${meta.repair}/5</b></div><div class="repair__meter">${meter}</div></div>` +
      `<div class="detail-actions">${action}<button class="action action--ghost" data-act="focus" data-id="${meta.id}">定位</button></div>` +
      `</div>`;
    dom.detailHint.textContent = `${meta.name} · ${meta.category}`;
  }

  function syncList() {
    const nodes = dom.partList.children;
    PARTS.forEach((meta, i) => {
      const el = nodes[i];
      if (!el) return;
      const rec = partsById.get(meta.id);
      const exploded = rec.anim.target > 0.5;
      el.classList.toggle('is-active', state.selected === meta.id);
      el.classList.toggle('is-exploded', exploded);
      const stateSpan = el.querySelector('.part-item__state span');
      if (stateSpan) {
        stateSpan.textContent = meta.fixed ? '基准' : exploded ? '已拆' : '待拆';
      }
    });
  }

  function updateProgress(force) {
    const count = REMOVABLE.filter((m) => partsById.get(m.id).anim.p > 0.45).length;
    if (!force && count === state.progress) return;
    state.progress = count;
    dom.progressText.textContent = `${count} / ${REMOVABLE.length}`;
    dom.progressBar.style.width = `${(count / REMOVABLE.length) * 100}%`;
  }

  /* =====================================================================
     interactions
     ===================================================================== */
  function onListClick(id) {
    const rec = partsById.get(id);
    if (!rec) return;
    if (rec.meta.fixed) {
      selectPartOnly(id);
      showToast('金属中框是整机结构基准，不参与拆解');
      return;
    }
    if (rec.anim.target > 0.5) {
      selectPartOnly(id);
    } else {
      activatePart(id, false);
    }
  }

  function setDetailSheet(open) {
    dom.detailPanel.classList.toggle('is-open', open);
    document.body.classList.toggle('sheet-open', open && window.innerWidth <= 900);
  }

  function selectPartOnly(id) {
    const meta = metaById.get(id);
    if (!meta) return;
    state.selected = id;
    renderPartDetail(meta);
    syncList();
    if (window.innerWidth <= 900) {
      dom.partsPanel.classList.remove('is-open');
      setDetailSheet(true);
    }
    dom.detailBody.scrollTop = 0;
    scrollListTo(id);
  }

  function activatePart(id, toggle) {
    const rec = partsById.get(id);
    if (!rec) return;
    const meta = rec.meta;
    if (meta.fixed) {
      selectPartOnly(id);
      showToast('金属中框是整机结构基准，不参与拆解');
      return;
    }

    const wasOut = rec.anim.target > 0.5;
    if (toggle && wasOut) {
      rec.anim.target = 0;
      rec.anim.delay = 0;
      state.selected = id;
      renderPartDetail(meta);
      syncList();
      showToast(`已装回 ${meta.name}`);
    } else {
      rec.anim.target = 1;
      rec.anim.delay = 0;
      state.selected = id;
      renderPartDetail(meta);
      syncList();
      showToast(`正在拆下 ${meta.name}`);
      if (window.innerWidth <= 900) {
        dom.partsPanel.classList.remove('is-open');
        setDetailSheet(true);
      }
    }
    scrollListTo(id);
  }

  function scrollListTo(id) {
    const el = dom.partList.querySelector(`[data-id="${id}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function explodeAll() {
    state.selected = null;
    let i = 0;
    REMOVABLE.forEach((meta) => {
      const rec = partsById.get(meta.id);
      rec.anim.target = 1;
      rec.anim.delay = i * 0.075;
      i++;
    });
    controls.radiusGoal = window.innerWidth <= 900 ? 52 : clamp(controls.radiusGoal * 1.22, 34, 42);
    controls.thetaGoal = window.innerWidth <= 900 ? 1.0 : 1.1;
    controls.phiGoal = 1.3;
    controls.targetGoal.set(0, window.innerWidth <= 900 ? 0 : 0.2, 0);
    state.selected = null;
    renderOverview();
    setDetailSheet(false);
    dom.partsPanel.classList.remove('is-open');
    syncList();
    showToast('逐层拆解全部 14 个可拆部件');
  }

  function restoreAll(silent) {
    REMOVABLE.forEach((meta) => {
      const rec = partsById.get(meta.id);
      rec.anim.target = 0;
      rec.anim.delay = 0;
    });
    state.selected = null;
    renderOverview();
    syncList();
    setDetailSheet(false);
    controls.reset();
    if (!silent) showToast('整机已复原');
  }

  function clearSelection() {
    state.selected = null;
    renderOverview();
    syncList();
    setDetailSheet(false);
    dom.partsPanel.classList.remove('is-open');
  }

  function focusPart(id) {
    const rec = partsById.get(id);
    if (!rec) return;
    const pos = partAnchorWorld(rec, new T.Vector3());
    controls.targetGoal.copy(pos).multiplyScalar(0.72);
    controls.targetGoal.y += 0.4;
    controls.radiusGoal = clamp(Math.max(rec.size.x, rec.size.y) * 4.4, 18, 30);
    showToast(`视角已聚焦 ${rec.meta.name}`);
  }

  function setHovered(id, source) {
    state.hovered = id;
    state.hoverSource = source;
    Array.from(dom.partList.children).forEach((el) => {
      el.classList.toggle('is-hover', !!id && el.dataset.id === id);
    });
  }

  function toggleAutoRotate() {
    state.autoRotate = !state.autoRotate;
    controls.autoRotate = state.autoRotate;
    dom.btnRotate.classList.toggle('is-on', state.autoRotate);
    dom.btnRotate.setAttribute('aria-pressed', String(state.autoRotate));
    showToast(state.autoRotate ? '自动旋转已开启' : '自动旋转已关闭');
  }

  function resetView() {
    controls.reset();
    showToast('视角已重置');
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('is-on');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      dom.toast.classList.remove('is-on');
    }, 2200);
  }

  /* =====================================================================
     pointer picking
     ===================================================================== */
  function pickAt(clientX, clientY) {
    const rect = dom.scene.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera({ x: nx, y: ny }, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    return hits.length ? hits[0].object.userData.partId || null : null;
  }

  function updateHover(clientX, clientY) {
    if (controls.dragging) {
      dom.scene.classList.remove('is-hovering');
      dom.tooltip.classList.remove('is-on');
      return;
    }
    const id = pickAt(clientX, clientY);
    if (id !== state.hovered) {
      setHovered(id, 'scene');
    }
    if (id) {
      const meta = metaById.get(id);
      dom.scene.classList.add('is-hovering');
      dom.tooltip.textContent = `${meta.name} · ${meta.tag}`;
      dom.tooltip.style.left = `${clientX}px`;
      dom.tooltip.style.top = `${clientY}px`;
      dom.tooltip.classList.add('is-on');
    } else {
      dom.scene.classList.remove('is-hovering');
      dom.tooltip.classList.remove('is-on');
    }
  }

  function onCanvasPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (window.innerWidth <= 900) {
      dom.partsPanel.classList.remove('is-open');
      dom.btnList.setAttribute('aria-expanded', 'false');
    }
    state.press = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
      id: e.pointerId,
      moved: 0,
    };
    dom.tooltip.classList.remove('is-on');
  }

  function onCanvasPointerMove(e) {
    if (state.press && e.pointerId === state.press.id) {
      state.press.moved = Math.max(
        state.press.moved,
        Math.hypot(e.clientX - state.press.x, e.clientY - state.press.y)
      );
    }
    if (state.hoverLock) return;
    state.hoverLock = true;
    const x = e.clientX;
    const y = e.clientY;
    requestAnimationFrame(() => {
      state.hoverLock = false;
      updateHover(x, y);
    });
  }

  function onCanvasPointerUp(e) {
    if (!state.press) return;
    if (e.pointerId !== state.press.id) return;
    const moved = Math.max(
      state.press.moved,
      Math.hypot(e.clientX - state.press.x, e.clientY - state.press.y)
    );
    const isTap = moved < 6 && performance.now() - state.press.time < 700;
    state.press = null;
    if (!isTap) return;

    const id = pickAt(e.clientX, e.clientY);
    if (id) {
      activatePart(id, true);
      setHovered(id, 'scene');
    } else {
      clearSelection();
    }
  }

  /* =====================================================================
     help / events
     ===================================================================== */
  function openHelp() {
    state.helpOpen = true;
    dom.helpModal.hidden = false;
    dom.helpClose.focus();
  }

  function closeHelp() {
    state.helpOpen = false;
    dom.helpModal.hidden = true;
  }

  function openSpecSheet() {
    state.specOpen = true;
    dom.specModal.hidden = false;
    dom.specClose.focus();
  }

  function closeSpecSheet() {
    state.specOpen = false;
    dom.specModal.hidden = true;
  }

  function bindEvents() {
    dom.btnExplode.addEventListener('click', explodeAll);
    dom.btnRestore.addEventListener('click', () => restoreAll(false));
    dom.btnRotate.addEventListener('click', toggleAutoRotate);
    dom.btnReset.addEventListener('click', resetView);
    dom.btnHelp.addEventListener('click', openHelp);
    dom.btnSpec.addEventListener('click', openSpecSheet);
    dom.helpClose.addEventListener('click', closeHelp);
    dom.specClose.addEventListener('click', closeSpecSheet);
    dom.helpModal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-help]')) closeHelp();
    });
    dom.specModal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-spec]')) closeSpecSheet();
    });
    dom.detailClose.addEventListener('click', () => {
      setDetailSheet(false);
    });
    dom.btnList.addEventListener('click', () => {
      const open = dom.partsPanel.classList.toggle('is-open');
      if (open) setDetailSheet(false);
      dom.btnList.setAttribute('aria-expanded', String(open));
    });

    dom.detailBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      if (btn.dataset.act === 'spec-sheet') {
        openSpecSheet();
        return;
      }
      const id = btn.dataset.id || state.selected;
      if (!id) return;
      if (btn.dataset.act === 'toggle') activatePart(id, true);
      else if (btn.dataset.act === 'focus') focusPart(id);
    });

    dom.scene.addEventListener('pointerdown', onCanvasPointerDown);
    dom.scene.addEventListener('pointermove', onCanvasPointerMove);
    dom.scene.addEventListener('pointerup', onCanvasPointerUp);
    dom.scene.addEventListener('pointercancel', onCanvasPointerUp);
    dom.scene.addEventListener('pointerleave', () => {
      dom.tooltip.classList.remove('is-on');
      dom.scene.classList.remove('is-hovering');
      if (state.hovered && state.hoverSource === 'scene') setHovered(null, null);
    });
    dom.scene.addEventListener('dblclick', (e) => {
      const id = pickAt(e.clientX, e.clientY);
      if (!id) restoreAll(false);
    });

    window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (state.specOpen) {
        if (key === 'escape' || key === 'h') closeSpecSheet();
        return;
      }
      if (state.helpOpen) {
        if (key === 'escape' || key === 'h') closeHelp();
        return;
      }
      if (key === 'escape') {
        if (
          window.innerWidth <= 900 &&
          (dom.detailPanel.classList.contains('is-open') ||
            dom.partsPanel.classList.contains('is-open'))
        ) {
          setDetailSheet(false);
          dom.partsPanel.classList.remove('is-open');
          dom.btnList.setAttribute('aria-expanded', 'false');
        } else clearSelection();
      } else if (key === 'h') {
        openHelp();
      } else if (key === 'e') {
        explodeAll();
      } else if (key === 'r') {
        restoreAll(false);
      } else if (key === ' ') {
        e.preventDefault();
        toggleAutoRotate();
      }
    });
  }

  function resize() {
    if (!renderer || !camera) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    if (w > 900) document.body.classList.remove('sheet-open');
  }

  /* =====================================================================
     loading
     ===================================================================== */
  function startLoadingTips() {
    const tips = [
      '初始化 WebGL 渲染器',
      '生成机身几何体',
      '绘制屏幕与后盖纹理',
      '构建 15 个核心部件',
      '烘焙环境反射材质',
      '准备拆解动画',
    ];
    let i = 0;
    state.tipTimer = window.setInterval(() => {
      if (i >= tips.length - 1) {
        window.clearInterval(state.tipTimer);
        return;
      }
      i++;
      if (dom.loadingTip) dom.loadingTip.textContent = tips[i];
    }, 200);
  }

  function finishLoading() {
    window.clearInterval(state.tipTimer);
    state.ready = true;
    if (!dom.loading) return;
    dom.loading.classList.add('is-done');
    window.setTimeout(() => {
      if (dom.loading && dom.loading.parentNode) dom.loading.parentNode.removeChild(dom.loading);
    }, 850);
    showToast('拖动旋转 · 点击部件开始拆解');
  }

  function showFatal(title, message) {
    window.clearInterval(state.tipTimer);
    if (!dom.loading) return;
    dom.loading.innerHTML =
      `<div class="loading__inner"><div class="loading__brand">${title}</div>` +
      `<p style="max-width:420px;text-align:center;font-size:12px;line-height:1.8;color:#8ba3ba;margin:14px 0 0">${message}</p></div>`;
  }

  /* =====================================================================
     animation loop
     ===================================================================== */
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    controls.update(dt);
    updateParts(dt, time);
    updateLabels();
    updateProgress(false);
    animateWorld(dt, time);

    renderer.render(scene, camera);
    updateFps();

    if (!state.firstFrame) {
      state.firstFrame = true;
      const wait = Math.max(0, 1050 - (performance.now() - state.initStart));
      window.setTimeout(finishLoading, wait);
    }
  }

  function updateParts(dt, time) {
    PARTS.forEach((meta) => {
      const rec = partsById.get(meta.id);
      if (!rec) return;
      const anim = rec.anim;

      if (anim.delay > 0) {
        anim.delay = Math.max(0, anim.delay - dt);
      } else if (Math.abs(anim.target - anim.p) > 0.001) {
        const speed = anim.target > anim.p ? 4.4 : 6.2;
        anim.p += (anim.target - anim.p) * (1 - Math.exp(-dt * speed));
        if (Math.abs(anim.target - anim.p) < 0.002) anim.p = anim.target;
      }

      const e = easeInOutCubic(anim.p);
      const explodeScale = window.innerWidth <= 900 ? 0.78 : 1;
      rec.group.position.set(
        meta.explode[0] * e * explodeScale,
        meta.explode[1] * e * explodeScale,
        meta.explode[2] * e * explodeScale
      );
      if (rec.pivot) {
        rec.pivot.rotation.y = (meta.rotateY || 0) * e;
      }

      const selected = state.selected === meta.id;
      const hovered = state.hovered === meta.id;
      const hot = selected || hovered;
      const glowTarget = hot ? 1 : Math.min(0.1, anim.p * 0.1);
      rec.glow += (glowTarget - rec.glow) * Math.min(1, dt * 9);
      const pulse = 0.74 + 0.26 * Math.sin(time * 2.6 + meta.index * 0.8);

      for (let i = 0; i < rec.emissiveState.length; i++) {
        const s = rec.emissiveState[i];
        s.mat.emissive.copy(s.color).lerp(rec.accentColor, rec.glow * 0.35);
        s.mat.emissiveIntensity = s.intensity + rec.glow * (hot ? 0.22 : 0.08) * pulse;
      }

      // Back cover hover: no colour wash or rectangular bracket, just a
      // brighter, smoother glass reflection.
      if (rec.glassMats) {
        for (let i = 0; i < rec.glassMats.length; i++) {
          const g = rec.glassMats[i];
          g.mat.envMapIntensity = g.env + rec.glow * 0.9;
          g.mat.roughness = Math.max(0.06, g.rough - rec.glow * 0.04);
        }
      }
      if (rec.glare) {
        rec.glare.material.opacity = 0.012 + rec.glow * 0.11;
      }

      const showOutline = hot && !meta.noOutline;
      rec.outline.visible = showOutline;
      if (showOutline) {
        rec.outline.material.opacity = selected ? 0.52 + 0.16 * pulse : 0.24;
      }

      const haloAllowed = Math.max(rec.size.x, rec.size.y) < 6.6;
      const haloVisible = haloAllowed && (anim.p > 0.05 || hot);
      rec.halo.visible = haloVisible;
      if (haloVisible) {
        rec.halo.material.opacity = clamp(
          (selected ? 0.07 : hovered ? 0.045 : 0.025) * Math.max(anim.p, selected ? 0.7 : 0.2) * pulse,
          0,
          0.1
        );
      }
    });
  }

  function partAnchorWorld(rec, out) {
    out.copy(rec.anchor);
    const rot = rec.pivot ? rec.pivot.rotation.y : 0;
    if (rot && Math.abs(rot) > 0.0001) {
      out.sub(rec.pivot.position);
      out.applyAxisAngle(Y_AXIS, rot);
      out.add(rec.pivot.position);
    }
    out.add(rec.group.position);
    return out;
  }

  function hideLabel(item) {
    item.el.classList.remove('is-visible');
    item.el.style.opacity = '0';
    item.el.style.pointerEvents = 'none';
    item.line.style.display = 'none';
    item.dot.style.display = 'none';
  }

  function updateLabels() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const compact = w <= 900;
    let minX = 70;
    let maxX = w - 70;
    if (!compact) {
      if (w > 1140) {
        minX = 24 + 304 + 98;
        maxX = w - 24 - 342 - 98;
      } else {
        minX = 16 + 260 + 86;
        maxX = w - 16 - 300 - 86;
      }
    } else {
      minX = 92;
      maxX = w - 92;
    }
    if (maxX - minX < 180) {
      minX = 60;
      maxX = w - 60;
    }
    minX = Math.max(minX, 60);
    maxX = Math.min(maxX, w - 60);
    dom.leaderLines.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const buckets = new Map();
    const visible = [];

    labelItems.forEach((item) => {
      const rec = partsById.get(item.id);
      const p = rec.anim.p;
      const selected = state.selected === item.id;
      const show = compact
        ? selected || (state.hovered === item.id && p > 0.14)
        : p > 0.14 || (selected && rec.meta.fixed);
      if (!show) {
        hideLabel(item);
        return;
      }

      partAnchorWorld(rec, tmpVec2);
      tmpVec.copy(tmpVec2).project(camera);
      if (tmpVec.z > 1 || tmpVec.z < -1) {
        hideLabel(item);
        return;
      }

      const ax = (tmpVec.x * 0.5 + 0.5) * w;
      const ay = (-tmpVec.y * 0.5 + 0.5) * h;
      if (ax < -60 || ax > w + 60 || ay < -60 || ay > h + 60) {
        hideLabel(item);
        return;
      }

      const x = clamp(ax + item.meta.offset[0], minX, maxX);
      const y = clamp(ay + item.meta.offset[1], 100, h - 100);
      const opacity = clamp((p - 0.08) / 0.3, 0, 1);

      item.ax = ax;
      item.ay = ay;
      item.x = x;
      item.y = y;
      item.opacity = opacity;
      item.el.classList.add('is-visible');
      item.el.classList.toggle('is-active', selected);
      item.el.style.opacity = String(opacity);
      item.el.style.pointerEvents = 'auto';
      visible.push(item);

      const key = Math.floor(x / 240);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(item);
    });

    buckets.forEach((list) => {
      list.sort((a, b) => a.y - b.y);
      let last = 88;
      list.forEach((item) => {
        if (item.y - last < 48) item.y = last + 48;
        last = item.y;
        item.el.style.left = `${item.x}px`;
        item.el.style.top = `${item.y}px`;
      });
    });

    visible.forEach((item) => {
      const dx = item.x - item.ax;
      const dy = item.y - item.ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const shorten = Math.min(34, len * 0.4);
      item.line.setAttribute('x1', (item.ax + ux * 8).toFixed(1));
      item.line.setAttribute('y1', (item.ay + uy * 8).toFixed(1));
      item.line.setAttribute('x2', (item.x - ux * shorten).toFixed(1));
      item.line.setAttribute('y2', (item.y - uy * shorten).toFixed(1));
      item.line.style.display = 'block';
      item.line.style.opacity = String(0.35 + 0.45 * item.opacity);
      item.dot.setAttribute('cx', item.ax.toFixed(1));
      item.dot.setAttribute('cy', item.ay.toFixed(1));
      item.dot.style.display = 'block';
      item.dot.style.opacity = String(0.55 + 0.4 * item.opacity);
    });
  }

  function animateWorld(dt, time) {
    if (stars) stars.rotation.y += dt * 0.008;
    orbitRings.forEach((ring, i) => {
      ring.rotation.z += dt * (i === 0 ? 0.045 : -0.03);
    });
    backdropGlows.forEach((g) => {
      g.sprite.material.opacity = g.base * (0.85 + 0.15 * Math.sin(time * 0.7 + g.phase));
    });
  }

  function updateFps() {
    state.frames++;
    const now = performance.now();
    const elapsed = now - state.fpsTime;
    if (elapsed >= 700) {
      const fps = Math.round((state.frames * 1000) / elapsed);
      dom.fps.textContent = String(clamp(fps, 0, 120));
      const calls = renderer.info.render.calls;
      dom.calls.textContent = String(calls);
      dom.drawInfo.textContent = `${calls} DRAWS`;
      state.frames = 0;
      state.fpsTime = now;
    }
  }

  /* =====================================================================
     debug hook (used by automated visual QA)
     ===================================================================== */
  window.__XM15_DEBUG__ = {
    explodeAll,
    restoreAll,
    activatePart,
    selectPartOnly,
    clearSelection,
    focusPart,
    toggleAutoRotate,
    getState: () => ({
      selected: state.selected,
      hovered: state.hovered,
      ready: state.ready,
      autoRotate: state.autoRotate,
      parts: PARTS.map((p) => ({
        id: p.id,
        p: partsById.get(p.id).anim.p,
        target: partsById.get(p.id).anim.target,
        pos: partsById.get(p.id).group.position.toArray(),
      })),
    }),
    partsById,
    get scene() {
      return scene;
    },
    get camera() {
      return camera;
    },
    get renderer() {
      return renderer;
    },
    get controls() {
      return controls;
    },
    pickAt,
    THREE: T,
  };
})();
