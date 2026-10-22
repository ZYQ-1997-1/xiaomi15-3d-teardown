/**
 * Regenerate the base64 image modules from assets/.
 *
 * Usage: npm run embed
 *
 * The page stays fully local/offline: the generated JS files assign data URLs
 * to window.XM15.SCREEN_IMAGE / LOGO_IMAGE / CHIP_IMAGE.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const items = [
  {
    src: 'assets/screen-lock.jpg',
    out: 'js/screen-image.js',
    key: 'SCREEN_IMAGE',
    type: 'image/jpeg',
    comment: 'User-supplied Xiaomi 15 screen, cropped to the display interior.',
  },
  {
    src: 'assets/logo-wordmark.png',
    out: 'js/logo-image.js',
    key: 'LOGO_IMAGE',
    type: 'image/png',
    comment: 'User-supplied XIAOMI wordmark, background removed.',
  },
  {
    src: 'assets/chip-snapdragon.png',
    out: 'js/chip-image.js',
    key: 'CHIP_IMAGE',
    type: 'image/png',
    comment: 'User-supplied Snapdragon 8 Elite sticker.',
  },
];

for (const item of items) {
  const src = path.join(root, item.src);
  if (!fs.existsSync(src)) {
    console.warn(`skip ${item.src}: file not found`);
    continue;
  }
  const b64 = fs.readFileSync(src).toString('base64');
  const code =
    `/* ${item.comment} */\n` +
    `(function(){\n` +
    `  const XM15 = (window.XM15 = window.XM15 || {});\n` +
    `  XM15.${item.key} = "data:${item.type};base64,${b64}";\n` +
    `})();\n`;
  fs.writeFileSync(path.join(root, item.out), code);
  console.log(`${item.out}: ${(code.length / 1024).toFixed(1)} KB`);
}
