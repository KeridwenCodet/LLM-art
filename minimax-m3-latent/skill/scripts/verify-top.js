/**
 * Verifie que le marqueur du mot de tete ne saute pas.
 *
 * Symptome : un cercle qui alterne tres vite entre petit et grand, avec le
 * mot qui se deplace au-dessus. Cause classique : une horloge en
 * millisecondes utilisee dans une sinusoide -> aliasing (la phase avance
 * de plusieurs cycles par image, donc echantillonnee aleatoirement).
 *
 * Mesures :
 *   1. le rayon rendu suit-il exactement 26+15*sin(ts*1.6) ?
 *   2. la pente du rayon (px/s) reste-t-elle bornee a 24 px/s (theorique) ?
 *   3. le mot est-il place juste au-dessus de SON cercle ?
 *   4. la police du marqueur reste-t-elle constante ?
 *
 * On ne compare PAS deux images consecutives : le marqueur disparait
 * parfois une image quand son fondu est complet, et on mesurerait alors un
 * saut imaginaire. On lit l'horloge de l'oeuvre AU MOMENT du dessin.
 *
 * Attend un hook window.__anim() exposant { ts, top, topOut }.
 * Usage : node verify-top.js <Latent.html>
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

const { chromium } = loadPlaywright();

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('usage : node verify-top.js <fichier.html>'); process.exit(2); }

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

  const ev = await page.evaluate(async () => {
    const events = [];
    const origArc = CanvasRenderingContext2D.prototype.arc;
    const origText = CanvasRenderingContext2D.prototype.fillText;

    const readTs = () => {
      try {
        const st = window.__anim && window.__anim();
        return st && typeof st.ts === 'number' ? st.ts : null;
      } catch (e) { return null; }
    };

    CanvasRenderingContext2D.prototype.arc = function (x, y, r) {
      if (r > 10 && r < 42) events.push({ k: 'ring', r, ts: readTs(), now: performance.now(), x, y });
      return origArc.apply(this, arguments);
    };
    CanvasRenderingContext2D.prototype.fillText = function (t, x, y) {
      // seulement la police du marqueur (Cormorant 15px italic)
      if (/15px/.test(this.font)) events.push({ k: 'word', t: String(t), x, y, font: this.font });
      return origText.apply(this, arguments);
    };

    await new Promise(r => setTimeout(r, 9000));
    CanvasRenderingContext2D.prototype.arc = origArc;
    CanvasRenderingContext2D.prototype.fillText = origText;
    return events;
  });

  await browser.close();

  const rings = ev.filter(e => e.k === 'ring');
  const words = ev.filter(e => e.k === 'word');
  console.log('--- MARQUEUR DU MOT DE TETE ---');
  console.log(`cercles dessines         : ${rings.length}`);
  console.log(`mots ecrits              : ${words.length}`);
  if (!rings.length) {
    console.log('\nRESULTAT: AUCUN MARQUEUR DESSINE');
    process.exit(1);
  }

  let maxErr = 0, checked = 0;
  for (const s of rings) {
    if (s.ts === null) continue;
    checked++;
    maxErr = Math.max(maxErr, Math.abs(s.r - (26 + 15 * Math.sin(s.ts * 1.6))));
  }

  let maxSlope = 0, worst = null, maxStep = 0, checkedSlope = 0, wallSlope = 0;
  for (let i = 1; i < rings.length; i++) {
    const dr = Math.abs(rings[i].r - rings[i - 1].r);
    maxStep = Math.max(maxStep, dr);
    const a = rings[i - 1].ts, b = rings[i].ts;
    if (a !== null && b !== null && b > a) {
      checkedSlope++;
      const slope = dr / (b - a);
      if (slope > maxSlope) { maxSlope = slope; worst = { dr: +dr.toFixed(3), dt: +(b - a).toFixed(4) }; }
    }
    const dw = (rings[i].now - rings[i - 1].now) / 1000;
    if (dw > 0) wallSlope = Math.max(wallSlope, dr / dw);
  }
  // 24 px/s theoriques (15*1.6), 40 % de marge
  const LIM_SLOPE = 34;

  // le mot doit etre juste au-dessus de SON cercle (rendu : cercle puis mot)
  let maxDyErr = 0, pairs = 0, lastRing = null;
  for (const e of ev) {
    if (e.k === 'ring') { lastRing = e; continue; }
    if (!lastRing || Math.abs(e.x - lastRing.x) > 2) continue;
    pairs++;
    maxDyErr = Math.max(maxDyErr, Math.abs(e.y - (lastRing.y - lastRing.r - 9)));
  }

  const fonts = [...new Set(words.map(w => w.font))];

  console.log(`rayon min / max          : ${Math.min(...rings.map(s => s.r)).toFixed(2)} / ${Math.max(...rings.map(s => s.r)).toFixed(2)} px`);
  console.log(`ecart rayon vs formule   : ${maxErr.toFixed(4)} px  (${checked} echantillons)`);
  console.log(`pente max du rayon       : ${maxSlope.toFixed(2)} px/s   (limite ${LIM_SLOPE})  [${checkedSlope} paires]`);
  console.log(`  pire saut              : ${worst ? worst.dr + ' px en ' + worst.dt + ' s' : '-'}`);
  console.log(`saut max entre 2 dessins : ${maxStep.toFixed(2)} px`);
  console.log(`ecart max mot/cercle     : ${maxDyErr.toFixed(2)} px  (${pairs} paires)`);
  console.log(`polices du marqueur      : ${fonts.join(' | ')}`);
  console.log(`mots distincts           : ${[...new Set(words.map(w => w.t))].join(' | ')}`);
  console.log(`erreurs JS               : ${errors.length}`);

  const ok = maxErr < 0.01 && maxSlope <= LIM_SLOPE && maxDyErr < 2.0
    && fonts.length === 1 && errors.length === 0;
  console.log(`\nRESULTAT: ${ok ? 'MARQUEUR STABLE' : 'MARQUEUR QUI SAUTE'}`);
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
