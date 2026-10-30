/**
 * Mesure le scintillement temporel des halos.
 *
 * Usage : node verify-flicker.js <chemin/vers/Latent.html>
 *
 * Echantillonne l'etat interne (alpha + rayon de chaque halo) image par
 * image et signale les sauts. Un rendu qui lit directement le tableau des
 * probabilites fait sauter les halos a chaque nouveau fragment.
 *
 * Attend un hook window.__stats() exposant { halos: { <cle>: {a, r} } }.
 */
const path = require('path');
const fs = require('fs');

function loadPlaywright() {
  const candidates = [
    'playwright-core',
    '/workspace/node_modules/playwright-core',
    '/workspace/Latent/node_modules/playwright-core',
    path.join(process.cwd(), 'node_modules', 'playwright-core'),
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* suivant */ }
  }
  throw new Error('playwright-core introuvable');
}

const { chromium } = loadPlaywright();

function findChrome() {
  const roots = ['/opt/playwright', '/usr/lib', '/usr/local'];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { continue; }
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.name === 'chrome' || e.name === 'chromium' || e.name === 'headless_shell') {
          try { fs.accessSync(p, fs.constants.X_OK); return p; } catch (err) { /* suivant */ }
        }
      }
    }
  }
  return undefined;
}

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('usage : node verify-flicker.js <fichier.html>'); process.exit(2); }

  const browser = await chromium.launch({
    executablePath: findChrome(),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));

  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  await page.waitForTimeout(6000);

  const res = await page.evaluate(async () => {
    const LIM_A = 0.09, LIM_R = 30;
    let prev = null, maxA = 0, maxR = 0, sumA = 0, n = 0, active = 0;
    for (let i = 0; i < 500; i++) {
      await new Promise(r => requestAnimationFrame(r));
      const st = window.__stats();
      const halos = st.halos || {};
      const keys = Object.keys(halos);
      active += keys.length;
      if (prev) {
        for (const k of keys) {
          if (!prev[k]) continue;
          const da = Math.abs(halos[k].a - prev[k].a);
          const dr = Math.abs(halos[k].r - prev[k].r);
          if (da > maxA) maxA = da;
          if (dr > maxR) maxR = dr;
          sumA += da; n++;
        }
      }
      prev = halos;
    }
    return { maxA, maxR, avgA: n ? sumA / n : 0, active: active / 500, LIM_A, LIM_R };
  });

  await browser.close();

  console.log('--- SCINTILLEMENT DES HALOS ---');
  console.log(`images echantillonnees : 500`);
  console.log(`halos actifs (moyenne) : ${res.active.toFixed(1)}`);
  console.log(`variation alpha  moy   : ${res.avgA.toFixed(4)}`);
  console.log(`variation alpha  max   : ${res.maxA.toFixed(4)}   (limite ${res.LIM_A})`);
  console.log(`variation rayon  max   : ${res.maxR.toFixed(2)}`);
  console.log(`erreurs JS             : ${errors.length}`);

  const ok = res.maxA <= res.LIM_A && res.maxR <= res.LIM_R && errors.length === 0;
  console.log(`\nRESULTAT: ${ok ? 'HALOS STABLES' : 'SCINTILLEMENT DETECTE'}`);
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
