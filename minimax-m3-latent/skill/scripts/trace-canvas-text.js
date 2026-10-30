#!/usr/bin/env node
/**
 * Trace tous les textes dessines sur un canvas et signale ceux qui sortent
 * du cadre. Permet de verifier l'alignement d'un panneau et de prouver
 * qu'aucun debordement n'existe, sans dependre d'une capture compressee.
 *
 *   node trace-canvas-text.js <oeuvre.html> [largeur] [hauteur]
 *
 * L'oeuvre doit exposer window.__stats() (avec viewport et verse) ou, a
 * defaut, la trace affiche tout ce qui est dessine hors cadre.
 */
const path = require('path');
const fs = require('fs');

function resolvePlaywright() {
  const candidates = [
    'playwright-core',
    path.join(process.cwd(), 'node_modules', 'playwright-core'),
    path.join(__dirname, '..', '..', '..', 'node_modules', 'playwright-core'),
    '/workspace/node_modules/playwright-core',
    '/opt/playwright/node_modules/playwright-core',
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* suivant */ }
  }
  console.error("playwright-core introuvable. Essaie : npm i playwright-core");
  process.exit(2);
}
const { chromium } = resolvePlaywright();

function findChromium() {
  const roots = ['/opt/playwright', '/root/.cache/ms-playwright'];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root)) {
      if (!d.startsWith('chromium')) continue;
      const p = path.join(root, d, 'chrome-linux64', 'chrome');
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined;
}

const FILE = process.argv[2];
const W = parseInt(process.argv[3] || '1440', 10);
const H = parseInt(process.argv[4] || '900', 10);
if (!FILE) { console.error('usage : node trace-canvas-text.js <oeuvre.html>'); process.exit(2); }

(async () => {
  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto('file://' + path.resolve(FILE), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  await page.waitForTimeout(7000);

  const out = await page.evaluate(async () => {
    const log = [];
    const orig = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, x, y, ...rest) {
      if (this.canvas && this.canvas.id === 'stage') {
        log.push({ t: String(t), x: Math.round(x), y: Math.round(y),
                   font: this.font, w: Math.round(this.measureText(String(t)).width) });
      }
      return orig.call(this, t, x, y, ...rest);
    };
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    CanvasRenderingContext2D.prototype.fillText = orig;
    const L = window.__layout ? window.__layout() : null;
    return { log, L };
  });

  const { log, L } = out;
  const VW = L ? L.W : W, VH = L ? L.H : H;
  console.log(`viewport ${VW}x${VH}`);
  console.log('textes traces :', log.length);

  const overX = log.filter(e => e.x + e.w > VW - 8 || e.x < 4);
  const overY = log.filter(e => e.y < 4 || e.y > VH - 4);
  console.log('\n--- hors cadre horizontal (' + overX.length + ') ---');
  for (const e of overX.slice(0, 20)) console.log(`  x=${e.x} w=${e.w} (fin ${e.x + e.w}/${VW}) "${e.t}"`);
  console.log('\n--- hors cadre vertical (' + overY.length + ') ---');
  for (const e of overY.slice(0, 20)) console.log(`  y=${e.y}/${VH} "${e.t}"`);

  if (L && L.panel) {
    const P = L.panel;
    const inPanel = log.filter(e => e.x >= P.x && e.x <= P.x + P.w);
    console.log(`\n--- dans le panneau (${inPanel.length}) ---`);
    for (const e of inPanel) console.log(`  x=${e.x} y=${e.y} w=${e.w} [${e.font}] "${e.t}"`);
  }

  const ok = overX.length === 0 && overY.length === 0;
  console.log('\nRESULTAT:', ok ? 'AUCUN DEBORDEMENT' : 'DEBORDEMENT DETECTE');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
