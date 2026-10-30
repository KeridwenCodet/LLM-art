/**
 * Compare la CONTINUITE VISUELLE de deux versions d'une oeuvre canvas.
 *
 * Usage : node compare-pixels.js <avant.html> <apres.html>
 *
 * Mesure la variation entre images consecutives dans la region du champ.
 * Le rapport pic/moyenne revele « une image sur vingt part en vrille ».
 *
 * ATTENTION : la scene est transparente. Il faut composer le canvas sur le
 * fond REEL avant de lire les pixels, sinon getImageData renvoie du RGB non
 * premultiplie et la mesure est fausse.
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

const BG = '#05050a';

async function measure(browser, file, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + file, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, { timeout: 20000 });
  await page.waitForTimeout(6000);

  const r = await page.evaluate(async (bg) => {
    const src = document.getElementById('stage');
    const k = src.width / src.clientWidth;
    const reg = { x: 40 * k, y: 100 * k, w: 620 * k, h: 400 * k };
    const W = 300, h = Math.round(reg.h * (W / reg.w));
    const c = document.createElement('canvas');
    c.width = W; c.height = h;
    const g = c.getContext('2d');
    const shot = () => {
      g.clearRect(0, 0, W, h);
      g.fillStyle = bg; g.fillRect(0, 0, W, h);   // composer sur le fond REEL
      g.drawImage(src, reg.x, reg.y, reg.w, reg.h, 0, 0, W, h);
      return g.getImageData(0, 0, W, h).data;
    };
    const diff = (a, b) => {
      let s = 0;
      for (let i = 0; i < a.length; i += 4) {
        s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      }
      return s / (a.length / 4) / 3;
    };
    let prev = shot(), max = 0, sum = 0, n = 0;
    const sq = [];
    for (let i = 0; i < 120; i++) {
      await new Promise(res => requestAnimationFrame(res));
      const cur = shot();
      const d = diff(prev, cur);
      if (d > max) max = d;
      sum += d; n++; sq.push(d);
      prev = cur;
    }
    const mean = sum / n;
    const variance = sq.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return { max, mean, std: Math.sqrt(variance), ratio: mean > 0 ? max / mean : 0 };
  }, BG);

  await page.close();
  console.log(`${label}`);
  console.log(`  variation entre images : moy ${r.mean.toFixed(3)} | max ${r.max.toFixed(3)} | ecart-type ${r.std.toFixed(3)}`);
  console.log(`  pire pic / moyenne     : ${r.ratio.toFixed(2)}x`);
  return r;
}

(async () => {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) { console.error('usage : node compare-pixels.js <avant.html> <apres.html>'); process.exit(2); }
  const browser = await chromium.launch({
    executablePath: findChrome(),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  console.log('--- CONTINUITE VISUELLE DU CHAMP ---');
  const o = await measure(browser, a, 'AVANT (saut direct)');
  const n = await measure(browser, b, 'APRES (lissage)');
  console.log(`\npic de variation : ${(o.max / n.max).toFixed(2)}x plus faible`);
  console.log(`pic/moyenne      : ${o.ratio.toFixed(2)}x -> ${n.ratio.toFixed(2)}x`);
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
