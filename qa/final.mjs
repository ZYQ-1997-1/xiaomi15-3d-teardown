import fs from 'node:fs';
import { launchBrowser, indexUrl } from './browser.mjs';

const browser = await launchBrowser();
const out = 'qa/shots';
fs.mkdirSync(out, { recursive: true });
const logs = [];
const results = {};

const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('console', (m) => { if (m.type() === 'error') logs.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(indexUrl, { waitUntil: 'load' });
await page.waitForFunction(() => window.__XM15_DEBUG__ && window.__XM15_DEBUG__.getState().ready, null, { timeout: 40000 });
await page.waitForTimeout(900);

// --- official specification sheet
await page.click('#btnSpec');
await page.waitForTimeout(450);
results.specSheet = await page.evaluate(() => ({
  open: !document.getElementById('specModal').hidden,
  blocks: document.querySelectorAll('#specSheet .spec-block').length,
  hasBattery: document.getElementById('specSheet').innerText.includes('5400mAh'),
  hasScreen: document.getElementById('specSheet').innerText.includes('300Hz'),
  source: document.querySelector('.spec-source a')?.getAttribute('href'),
}));
await page.screenshot({ path: `${out}/19-official-spec.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// --- drag orbit
const beforeDrag = await page.evaluate(() => ({
  theta: window.__XM15_DEBUG__.controls.theta,
  phi: window.__XM15_DEBUG__.controls.phi,
}));
await page.mouse.move(760, 600);
await page.mouse.down();
await page.mouse.move(920, 540, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(900);
const afterDrag = await page.evaluate(() => ({
  theta: window.__XM15_DEBUG__.controls.theta,
  phi: window.__XM15_DEBUG__.controls.phi,
  dragging: window.__XM15_DEBUG__.controls.dragging,
}));
results.drag = { beforeDrag, afterDrag, changed: Math.abs(afterDrag.theta - beforeDrag.theta) > 0.05 };

// --- wheel zoom
const beforeWheel = await page.evaluate(() => window.__XM15_DEBUG__.controls.radius);
await page.mouse.move(800, 500);
await page.mouse.wheel(0, -420);
await page.waitForTimeout(700);
const afterWheel = await page.evaluate(() => window.__XM15_DEBUG__.controls.radius);
results.wheel = { beforeWheel, afterWheel, changed: Math.abs(afterWheel - beforeWheel) > 1 };

// reset view then hover + select
await page.click('#btnReset');
await page.waitForTimeout(900);
await page.mouse.move(800, 500);
await page.waitForTimeout(500);
results.hover = await page.evaluate(() => ({
  text: document.getElementById('tooltip').textContent,
  on: document.getElementById('tooltip').classList.contains('is-on'),
}));
await page.screenshot({ path: `${out}/20-hover.png` });

await page.mouse.click(800, 500);
await page.waitForFunction(() => window.__XM15_DEBUG__.partsById.get('screen').anim.p > 0.82, null, { timeout: 30000 });
results.screen = await page.evaluate(() => ({
  selected: window.__XM15_DEBUG__.getState().selected,
  title: document.querySelector('.part-detail h3')?.textContent,
  label: Array.from(document.querySelectorAll('.part-label.is-visible')).map((el) => el.dataset.id),
}));
await page.screenshot({ path: `${out}/21-screen.png` });

// retract
await page.click('.detail-actions .action--primary');
await page.waitForFunction(() => window.__XM15_DEBUG__.partsById.get('screen').anim.target === 0, null, { timeout: 10000 });

// help + auto rotate
await page.click('#btnHelp');
await page.waitForTimeout(350);
results.help = await page.evaluate(() => !document.getElementById('helpModal').hidden);
await page.keyboard.press('Escape');
await page.click('#btnRotate');
await page.waitForTimeout(400);
results.autoRotate = await page.evaluate(() => window.__XM15_DEBUG__.getState().autoRotate);
await page.click('#btnRotate');

// explode all
await page.click('#btnExplode');
await page.waitForFunction(() => {
  const d = window.__XM15_DEBUG__;
  return d.getState().parts.filter((p) => p.id !== 'frame').every((p) => p.p > 0.95);
}, null, { timeout: 60000 });
await page.waitForTimeout(1400);
results.exploded = await page.evaluate(() => {
  const labels = Array.from(document.querySelectorAll('.part-label.is-visible')).map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  const panelRects = ['.parts-panel', '.detail-panel'].map((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { sel, x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const overlaps = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i], b = labels[j];
      const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
      const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      if (ox * oy > 150) overlaps.push([a.id, b.id, Math.round(ox * oy)]);
    }
  }
  const panelHits = [];
  labels.forEach((a) => panelRects.forEach((p) => {
    const ox = Math.max(0, Math.min(a.x + a.w, p.x + p.w) - Math.max(a.x, p.x));
    const oy = Math.max(0, Math.min(a.y + a.h, p.y + p.h) - Math.max(a.y, p.y));
    if (ox * oy > 40) panelHits.push([a.id, p.sel]);
  }));
  return { labels, overlaps, panelHits, progress: document.getElementById('progressText').textContent };
});
await page.screenshot({ path: `${out}/22-exploded.png` });

// click a label (battery)
const batteryLabel = await page.evaluate(() => {
  const el = document.querySelector('.part-label[data-id="battery"]');
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, visible: el.classList.contains('is-visible') };
});
if (batteryLabel.visible) {
  await page.mouse.click(batteryLabel.x, batteryLabel.y);
  await page.waitForTimeout(600);
}
results.labelClick = await page.evaluate(() => ({
  selected: window.__XM15_DEBUG__.getState().selected,
  title: document.querySelector('.part-detail h3')?.textContent,
}));

// double-click empty space -> restore
await page.mouse.dblclick(450, 350);
await page.waitForFunction(() => document.querySelectorAll('.part-label.is-visible').length === 0, null, { timeout: 25000 });
results.restored = await page.evaluate(() => ({
  selected: window.__XM15_DEBUG__.getState().selected,
  maxTarget: Math.max(...window.__XM15_DEBUG__.getState().parts.map((p) => p.target)),
  visibleLabels: document.querySelectorAll('.part-label.is-visible').length,
}));
await page.screenshot({ path: `${out}/23-restored.png` });

// ------------------ mobile ------------------
const mob = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
mob.on('pageerror', (e) => logs.push(`mobile pageerror: ${e.message}`));
await mob.goto(indexUrl, { waitUntil: 'load' });
await mob.waitForFunction(() => window.__XM15_DEBUG__ && window.__XM15_DEBUG__.getState().ready, null, { timeout: 40000 });
await mob.waitForTimeout(900);
results.mobileInitial = await mob.evaluate(() => ({
  explodeVisible: getComputedStyle(document.getElementById('btnExplode')).display !== 'none',
  listButtonVisible: getComputedStyle(document.getElementById('btnList')).display !== 'none',
  listPanelVisible: getComputedStyle(document.getElementById('partsPanel')).display !== 'none',
}));
await mob.screenshot({ path: `${out}/24-mobile-initial.png` });

await mob.click('#btnList');
await mob.waitForTimeout(700);
results.mobileList = await mob.evaluate(() => ({
  open: document.getElementById('partsPanel').classList.contains('is-open'),
  items: document.querySelectorAll('.part-item').length,
}));
await mob.screenshot({ path: `${out}/25-mobile-list.png` });
await mob.click('.part-item[data-id="camera"]');
await mob.waitForTimeout(900);
results.mobileSelect = await mob.evaluate(() => ({
  sheetOpen: document.getElementById('detailPanel').classList.contains('is-open'),
  listOpen: document.getElementById('partsPanel').classList.contains('is-open'),
  title: document.querySelector('.part-detail h3')?.textContent,
}));
await mob.screenshot({ path: `${out}/26-mobile-detail.png` });

await mob.click('#detailClose');
await mob.waitForTimeout(400);
await mob.click('#btnExplode');
await mob.waitForFunction(() => {
  const d = window.__XM15_DEBUG__;
  return d.getState().parts.filter((p) => p.id !== 'frame').every((p) => p.p > 0.9);
}, null, { timeout: 60000 });
await mob.waitForTimeout(1200);
results.mobileExploded = await mob.evaluate(() => {
  const d = window.__XM15_DEBUG__;
  const screen = d.partsById.get('screen');
  const v = new d.THREE.Vector3().copy(screen.anchor).add(screen.group.position).project(d.camera);
  return {
    radius: Number(d.controls.radius.toFixed(1)),
    theta: Number(d.controls.theta.toFixed(2)),
    screenNdcX: Number(v.x.toFixed(2)),
    screenNdcY: Number(v.y.toFixed(2)),
    visibleLabels: document.querySelectorAll('.part-label.is-visible').length,
    bodyOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    detailOpen: document.getElementById('detailPanel').classList.contains('is-open'),
  };
});
await mob.screenshot({ path: `${out}/27-mobile-exploded.png` });

results.logs = logs;
fs.writeFileSync('qa/final-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
