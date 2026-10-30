#!/usr/bin/env node
/**
 * Verifie qu'une oeuvre HTML est autonome : elle doit fonctionner SANS reseau.
 *
 *   node verify-offline.js <chemin/vers/oeuvre.html>
 *
 * Coupe toute requete sortante (contexte offline + route handler qui avorte
 * tout ce qui n'est pas file://), puis verifie :
 *   - aucune requete reseau bloquee (= l'oeuvre ne tente rien)
 *   - aucune erreur JavaScript
 *   - les polices declarees sont bien chargees
 *   - la page produit du contenu (vocabulaire, liens, lignes generees)
 *
 * Sort avec le code 0 si tout passe, 1 sinon.
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
if (!FILE) { console.error('usage : node verify-offline.js <oeuvre.html>'); process.exit(2); }

(async () => {
  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader',
           '--enable-unsafe-swiftshader', '--font-render-hinting=none'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, offline: true });
  const page = await ctx.newPage();

  const blocked = [];
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (!u.startsWith('file://') && !u.startsWith('data:')) { blocked.push(u); return route.abort(); }
    route.continue();
  });

  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto('file://' + path.resolve(FILE), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  await page.waitForTimeout(8000);

  const st = await page.evaluate(() => (window.__stats ? window.__stats() : {}));
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const probe = fam => document.fonts.check(`16px "${fam}"`);
    return {
      cormorant: probe('Cormorant Garamond'),
      plex: probe('IBM Plex Mono'),
      loaded: document.fonts.size,
    };
  });

  console.log('--- AUTONOMIE ---');
  console.log('requetes bloquees :', blocked.length, blocked.slice(0, 5));
  console.log('erreurs JS        :', errors.length, errors.slice(0, 3));
  console.log('polices           :', JSON.stringify(fonts));
  console.log('vocabulaire       :', st.vocab, 'mots');
  console.log('liens PPMI        :', st.edges);
  console.log('familles          :', (st.clusters || []).join(' / '));
  console.log('phrases           :', st.lines);
  console.log('derniere phrase   :', JSON.stringify(st.lastText));
  console.log('debordement vers  :', st.verse ? st.verse.overflow : 'n/a');

  const ok = blocked.length === 0 && errors.length === 0 &&
             fonts.cormorant && fonts.plex &&
             st.vocab > 0 && st.lines > 0 && !(st.verse && st.verse.overflow);
  console.log('\nRESULTAT:', ok ? 'AUTONOME OK' : 'ECHEC');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
