#!/usr/bin/env node
// Screenshot an HTML artifact with headless Chrome for visual review.
// Usage: node shot.js <file.html> [--interact] [--settle ms]
// Prints INSPECT: <png> lines — pass those paths to vision_analyze.
const fs = require('fs');
const path = require('path');

const htmlArg = process.argv[2];
if (!htmlArg) { console.error('usage: node shot.js <file.html> [--interact] [--settle ms]'); process.exit(2); }
const interact = process.argv.includes('--interact');
const si = process.argv.indexOf('--settle');
const settle = si > -1 ? parseInt(process.argv[si + 1], 10) : 6000;

const htmlAbs = path.resolve(htmlArg);
if (!fs.existsSync(htmlAbs)) { console.error('not found: ' + htmlAbs); process.exit(2); }
const outAbs = htmlAbs.replace(/\.html?$/i, '') + '-shot.png';
const out2Abs = outAbs.replace(/\.png$/, '-interact.png');

function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const roots = [(process.env.HOME || '/root') + '/.cache/puppeteer/chrome', '/root/.cache/puppeteer/chrome'];
  for (const root of roots) {
    try {
      for (const ver of fs.readdirSync(root)) {
        const p = path.join(root, ver, 'chrome-linux64/chrome');
        if (fs.existsSync(p)) return p;
      }
    } catch (e) {}
  }
  return null;
}

function loadPuppeteer() {
  for (const spec of ['puppeteer', 'puppeteer-core', '/workspace/node_modules/puppeteer-core']) {
    try { return require(spec); } catch (e) {}
  }
  console.error('puppeteer-core not installed — run: cd /workspace && npm i puppeteer-core');
  process.exit(2);
}

// vision_analyze receives docker paths mangled into backslash names
// ('/a/b.png' -> '\a\b.png'); lay literal-name copies where it resolves from.
function layVisionCopies(pngAbs) {
  const mangled = pngAbs.replace(/\//g, '\\');
  for (const dir of ['/', '/root', '/workspace']) {
    try { fs.copyFileSync(pngAbs, path.join(dir, mangled)); } catch (e) {}
  }
}

(async () => {
  const chrome = findChrome();
  if (!chrome) { console.error('no cached Chrome under ~/.cache/puppeteer/chrome'); process.exit(2); }
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: chrome,
    args: ['--no-sandbox', '--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 780, height: 700, deviceScaleFactor: 1.5 });
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE-ERR:', m.text()); });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file://' + htmlAbs, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, settle));
  await page.screenshot({ path: outAbs });
  layVisionCopies(outAbs);
  console.log('INSPECT:', outAbs);
  if (interact) {
    await page.mouse.move(390, 350);
    await page.mouse.down(); await page.mouse.up();
    for (let i = 0; i < 24; i++) {
      await page.mouse.move(390 + Math.sin(i / 3) * 200, 350 + Math.cos(i / 4) * 140);
      await new Promise(r => setTimeout(r, 50));
    }
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: out2Abs });
    layVisionCopies(out2Abs);
    console.log('INSPECT:', out2Abs);
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
