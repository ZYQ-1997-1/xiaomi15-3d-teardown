import fs from 'node:fs';
import { launchBrowser, indexUrl } from './browser.mjs';
fs.mkdirSync('qa/shots', { recursive: true });
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const logs = [];
page.on('pageerror', (e) => logs.push(e.message));
await page.goto(indexUrl, { waitUntil: 'load' });
await page.waitForFunction(() => window.__XM15_DEBUG__ && window.__XM15_DEBUG__.getState().ready, null, { timeout: 40000 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'qa/shots/30-mobile-final.png' });
await page.click('#btnList');
await page.waitForTimeout(600);
await page.screenshot({ path: 'qa/shots/31-mobile-list-final.png' });
await page.click('.part-item[data-id="screen"]');
await page.waitForTimeout(700);
await page.screenshot({ path: 'qa/shots/32-mobile-detail-final.png' });
await page.click('#detailClose');
await page.waitForTimeout(300);
await page.click('#btnExplode');
await page.waitForFunction(() => {
  const d = window.__XM15_DEBUG__;
  return d.getState().parts.filter((p) => p.id !== 'frame').every((p) => p.p > 0.9);
}, null, { timeout: 60000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: 'qa/shots/33-mobile-exploded-final.png' });
const info = await page.evaluate(() => {
  const d = window.__XM15_DEBUG__;
  const b = d.partsById.get('camera');
  const v = new d.THREE.Vector3().copy(b.anchor).add(b.group.position).project(d.camera);
  return {
    cameraNdc: [Number(v.x.toFixed(2)), Number(v.y.toFixed(2))],
    radius: Number(d.controls.radius.toFixed(1)),
    hintTouchVisible: getComputedStyle(document.querySelector('.hint--touch')).display,
    hintWheelVisible: getComputedStyle(document.querySelector('.hint--wheel')).display,
  };
});
console.log(JSON.stringify({ info, logs }, null, 2));
await browser.close();
