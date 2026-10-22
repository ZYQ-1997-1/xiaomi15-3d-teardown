/**
 * Shared browser launcher for the QA scripts.
 *
 * Install the dev dependency once:
 *   npm install
 *   # if using playwright-core without a bundled browser, install Chrome or
 *   # point CHROME_PATH at an existing Chrome/Chromium/Edge binary.
 *
 * On this project's authoring machine, a locally installed playwright-core
 * outside the repo can be used with NODE_PATH too.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

export const projectRoot = path.resolve(here, '..');
export const indexPath = path.join(projectRoot, 'index.html');
export const indexUrl = pathToFileURL(indexPath).href;

let chromium;
const moduleCandidates = [
  process.env.PLAYWRIGHT_MODULE,
  'playwright',
  'playwright-core',
].filter(Boolean);

for (const id of moduleCandidates) {
  try {
    const mod = require(id);
    if (mod && mod.chromium) {
      chromium = mod.chromium;
      break;
    }
  } catch {
    // try the next resolution strategy
  }
}

if (!chromium) {
  throw new Error(
    'Cannot find Playwright. Run `npm install` (then optionally `npx playwright install chromium`) ' +
    'or set PLAYWRIGHT_MODULE to an installed playwright/playwright-core entry.'
  );
}

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) => {
  try {
    return fs.existsSync(candidate);
  } catch {
    return false;
  }
});

const defaultArgs = [
  '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader',
  '--disable-gpu-sandbox',
  '--no-sandbox',
  '--disable-breakpad',
  '--disable-crash-reporter',
];

export async function launchBrowser(options = {}) {
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: defaultArgs,
    ...options,
  });
}
