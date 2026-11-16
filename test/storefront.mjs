// End-to-end check of the storefront: loader, hero scroll, collage parallax, hall, detail page (flight, content, swap, close), brand weave.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.env.SHOTS || 'test/shots-store'; mkdirSync(out, { recursive: true });
const url = 'file://' + resolve('storefront/dist/storefront.single.html');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = []; let failed = 0;
const check = (n, ok, x = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!ok) failed++; };

for (const [label, vp] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 400, height: 800 }]]) {
  const page = await browser.newPage({ viewport: vp });
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text().slice(0, 160)}`); });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // --- loading screen
  await page.waitForTimeout(250);
  const ld1 = await page.evaluate(() => ({ vis: !document.getElementById('loader').hidden, num: document.getElementById('ldNum').textContent }));
  await page.screenshot({ path: `${out}/${label}-0-loader.png` });
  await page.waitForTimeout(450);
  const ld2 = await page.evaluate(() => document.getElementById('ldNum').textContent);
  check(`${label}: loader is visible and counting`, ld1.vis && Number(ld2) > Number(ld1.num), `${ld1.num} -> ${ld2}`);
  await page.waitForFunction(() => window.__app && window.__app.ready, null, { timeout: 15000 });
  check(`${label}: loader leaves`, await page.evaluate(() => document.getElementById('loader').hidden));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${out}/${label}-1-hero.png` });

  // --- scroll effects
  const clip = async (y) => { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(1100); return page.evaluate(() => getComputedStyle(document.getElementById('mimg')).clipPath); };
  const c0 = await clip(0), c1 = await clip(vp.height * 0.95);
  check(`${label}: hero frame opens on scroll`, c0 !== c1 && /inset\(0px/.test(c1), `${c0} -> ${c1}`);
  const prog = await page.evaluate(() => getComputedStyle(document.getElementById('prog')).transform);
  check(`${label}: scroll progress bar grows`, prog !== 'none' && !/matrix\(0,/.test(prog), prog);
  await page.evaluate(() => document.querySelector('.stmt').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${label}-2-statement.png` });
  const tx = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('track')).transform).m41);
  check(`${label}: marquee moves`, Math.abs(tx) > 1, 'x=' + Math.round(tx));
  const lines = await page.evaluate(() => document.querySelectorAll('#lead > div, #lead [class*="line"]').length);
  check(`${label}: lead text split into reveal lines`, lines >= 2, lines + ' lines');
  // parallax: item y differs between two scroll positions beyond scroll delta
  await page.evaluate(() => document.getElementById('collage').scrollIntoView({ block: 'start' })); await page.waitForTimeout(900);
  const ty1 = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.item[data-speed="1.35"], .item:nth-child(2)')).transform).m42);
  await page.evaluate(() => window.scrollBy(0, 360)); await page.waitForTimeout(900);
  const ty2 = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.item[data-speed="1.35"], .item:nth-child(2)')).transform).m42);
  check(`${label}: collage parallax moves items`, Math.abs(ty2 - ty1) > 5, `${Math.round(ty1)} -> ${Math.round(ty2)}`);
  await page.screenshot({ path: `${out}/${label}-3-collage.png` });

  // --- detail page via collage (shared-element flight)
  await page.evaluate(() => document.getElementById('collage').scrollIntoView({ block: 'start' })); await page.waitForTimeout(600);
  const first = page.locator('.item img').first(); await first.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  await first.click(); await page.waitForTimeout(380);
  await page.screenshot({ path: `${out}/${label}-4-flight.png` });
  await page.waitForTimeout(1500);
  const det = await page.evaluate(() => { const i = document.querySelector('#slot img'), s = document.getElementById('slot'); const r = i && i.getBoundingClientRect(), sr = s.getBoundingClientRect(); return { open: !document.getElementById('detail').hidden, title: document.getElementById('dTitle').textContent, lands: !!r && Math.abs(r.width - sr.width) < 4 && Math.abs(r.height - sr.height) < 4, hash: location.hash }; });
  check(`${label}: detail page opens`, det.open && det.title.length > 0, det.title);
  check(`${label}: image flew into the detail slot`, det.lands);
  check(`${label}: URL hash names the product`, /^#p-/.test(det.hash), det.hash);
  await page.screenshot({ path: `${out}/${label}-5-detail.png` });
  await page.evaluate(() => { const d = document.getElementById('detail'); d.scrollTop = 700; }); await page.waitForTimeout(1200);
  const stepsOn = await page.evaluate(() => document.querySelectorAll('#dSteps li.on').length);
  check(`${label}: detail scroll lights process steps`, stepsOn >= 1, stepsOn + ' on');
  await page.screenshot({ path: `${out}/${label}-6-detail-scrolled.png` });
  // swap to related with weave
  const before = await page.textContent('#dTitle');
  await page.evaluate(() => { const d = document.getElementById('detail'); d.scrollTop = d.scrollHeight; }); await page.waitForTimeout(700);
  await page.click('#dNext'); await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${label}-7-swap-a.png` });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${label}-7-swap-b.png` });
  await page.waitForTimeout(2600);
  const after = await page.textContent('#dTitle');
  check(`${label}: next product swaps with weave`, before !== after, `${before} -> ${after}`);
  // add to cart from detail
  const dis = await page.evaluate(() => document.getElementById('dBuy').disabled);
  // close (no flight origin after swap -> fade)
  await page.evaluate(() => { document.getElementById('detail').scrollTop = 0; }); await page.waitForTimeout(300);
  await page.click('#dBack'); await page.waitForTimeout(1200);
  check(`${label}: detail closes`, await page.evaluate(() => document.getElementById('detail').hidden && !location.hash.startsWith('#p-')));

  // --- reopen with flight back
  await page.evaluate(() => document.getElementById('collage').scrollIntoView({ block: 'start' })); await page.waitForTimeout(700);
  const img2 = page.locator('.item img').nth(1); await img2.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  await img2.click(); await page.waitForTimeout(2000);
  await page.click('#dBack'); await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/${label}-8-flight-back.png` });
  await page.waitForTimeout(1200);
  check(`${label}: flight back restores collage image`, await page.evaluate(() => document.getElementById('detail').hidden && [...document.querySelectorAll('.item img')].every((i) => i.style.visibility === '')));

  // --- hall detail (3D piece flies to detail)
  const hallOn = await page.evaluate(() => !document.getElementById('gal').hidden);
  if (hallOn) {
    await page.evaluate(() => document.getElementById('stick').scrollIntoView({ block: 'start' })); await page.waitForTimeout(1800);
    await page.screenshot({ path: `${out}/${label}-9-hall.png` });
    await page.click('#lMore'); await page.waitForTimeout(350);
    await page.screenshot({ path: `${out}/${label}-10-hall-flight.png` });
    await page.waitForTimeout(1600);
    check(`${label}: hall piece opens detail`, await page.evaluate(() => !document.getElementById('detail').hidden && !!document.querySelector('#slot img')));
    await page.keyboard.press('Escape'); await page.waitForTimeout(1600);
    check(`${label}: Esc closes detail`, await page.evaluate(() => document.getElementById('detail').hidden));
  }

  // --- brand weave
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  await page.click('.tab[data-k="object"]'); await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/${label}-11-brand-weave.png` });
  await page.waitForTimeout(1800);
  check(`${label}: brand switch retheme`, (await page.textContent('#wmText')) === 'Bách Ngộ Object' && (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim())) === '#dfe6e2');
  check(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.close();
}
check('no page or console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed'); process.exit(failed ? 1 : 0);
