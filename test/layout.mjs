// Layout guard: collage items must never overlap (including parallax drift), and the ticker ribbon must stay legible.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.env.SHOTS || 'test/shots-store'; mkdirSync(out, { recursive: true });
const url = 'file://' + resolve('storefront/dist/storefront.single.html');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let failed = 0; const errors = [];
const check = (n, ok, x = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!ok) failed++; };

for (const [label, vp] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 400, height: 800 }]]) {
  const page = await browser.newPage({ viewport: vp });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__app && window.__app.ready, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  for (const brand of ['atelier', 'bags', 'object', 'hangout']) {
    if (brand !== 'atelier') { await page.evaluate(() => window.scrollTo(0, 0)); await page.click(`.tab[data-k="${brand}"]`); await page.waitForTimeout(2600); }
    const top = await page.evaluate(() => document.getElementById('collage').getBoundingClientRect().top + scrollY);
    let worst = 0, pairs = '', cut = false, n = 0;
    for (let y = top - vp.height; y < top + (await page.evaluate(() => document.getElementById('collage').offsetHeight)); y += 220) {
      await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(260);
      const r = await page.evaluate(() => Array.from(document.querySelectorAll('.item')).map((e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }));
      n = r.length;
      for (let i = 0; i < r.length; i++) {
        if (r[i][0] < -1 || r[i][2] > vp.width + 1) cut = true;
        for (let j = i + 1; j < r.length; j++) {
          const w = Math.min(r[i][2], r[j][2]) - Math.max(r[i][0], r[j][0]), h = Math.min(r[i][3], r[j][3]) - Math.max(r[i][1], r[j][1]);
          if (w > 0 && h > 0 && w * h > worst) { worst = w * h; pairs = `${i}-${j}`; }
        }
      }
    }
    check(`${label}/${brand}: no collage items overlap (${n} items)`, worst === 0, worst ? `overlap ${Math.round(worst)}px² between ${pairs}` : '');
    check(`${label}/${brand}: collage items stay inside the page`, !cut);
    if (brand === 'atelier' || brand === 'bags') {
      await page.evaluate(() => document.getElementById('collage').scrollIntoView({ block: 'start' })); await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}/layout-${label}-${brand}-collage.png` });
    }
  }
  // ticker ribbon
  await page.evaluate(() => window.scrollTo(0, 0)); await page.click('.tab[data-k="atelier"]'); await page.waitForTimeout(2600);
  await page.evaluate(() => document.querySelector('.off').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200);
  const rib = await page.evaluate(() => { const m = document.getElementById('marq'), cs = getComputedStyle(m); const f = document.querySelector('.off img').getBoundingClientRect(), b = m.getBoundingClientRect(); return { bg: cs.backgroundColor, blend: cs.mixBlendMode, color: cs.color, insideImage: b.top > f.top && b.bottom < f.bottom + 2 }; });
  check(`${label}: ticker ribbon is solid and not blended`, rib.blend === 'normal' && rib.bg !== 'rgba(0, 0, 0, 0)', JSON.stringify(rib));
  check(`${label}: ticker sits over the lower part of the photo`, rib.insideImage);
  await page.screenshot({ path: `${out}/layout-${label}-ticker.png` });
  await page.close();
}
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed'); process.exit(failed ? 1 : 0);
