#!/usr/bin/env node
/**
 * Inspecte le graphe latent : distribution des similarites, etendue du
 * nuage de points, familles, et paires de mots les plus proches.
 *
 *   node inspect-graph.js <oeuvre.html>
 *
 * L'oeuvre doit exposer window.__ST (l'objet de statistiques) — le copier
 * depuis le source si ce n'est pas deja le cas.
 *
 * LECTURE : les paires les plus proches doivent etre SEMANTIQUEMENT
 * justes ("close ~ eyes", "comes ~ back"). Si elles sont arbitraires, la
 * matrice PPMI ou l'iteration des vecteurs propres est fautive — l'espace
 * latent est decoratif et toute la piece s'effondre.
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
if (!FILE) { console.error('usage : node inspect-graph.js <oeuvre.html>'); process.exit(2); }

(async () => {
  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + path.resolve(FILE), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  await page.waitForTimeout(2500);

  const r = await page.evaluate(() => {
    const ST = window.__ST;
    if (!ST) return { err: "window.__ST absent — exposer ST dans l'oeuvre pour inspecter le graphe" };
    const sims = [...ST.sim.values()].filter(v => v > 0).sort((a, b) => b - a);
    const cnt = t => sims.filter(v => v > t).length;
    const q = p => sims[Math.floor(sims.length * p)] || 0;
    const coords = [...ST.coords.values()];
    const xs = coords.map(c => c.x), ys = coords.map(c => c.y);
    return {
      vocab: ST.vocab.length,
      paires: sims.length,
      seuils: { '>0.9': cnt(0.9), '>0.6': cnt(0.6), '>0.28': cnt(0.28) },
      quantiles: { max: +sims[0].toFixed(3), p01: +q(0.01).toFixed(3),
                   p10: +q(0.10).toFixed(3), median: +q(0.5).toFixed(3) },
      nuage: coords.length ? {
        xmin: +Math.min(...xs).toFixed(2), xmax: +Math.max(...xs).toFixed(2),
        ymin: +Math.min(...ys).toFixed(2), ymax: +Math.max(...ys).toFixed(2) } : null,
      fragments: ST.frags.length,
      clusters: ST.clusterLabel,
      top: [...ST.sim.entries()].filter(e => e[1] > 0.6)
        .sort((a, b) => b[1] - a[1]).slice(0, 14)
        .map(e => e[0].split('\u0000').join(' ~ ') + '  ' + e[1].toFixed(3)),
    };
  });

  if (r.err) { console.error(r.err); await browser.close(); process.exit(2); }
  console.log(JSON.stringify(r, null, 2));
  console.log('\nLes paires du haut doivent etre semantiquement justes.');
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
