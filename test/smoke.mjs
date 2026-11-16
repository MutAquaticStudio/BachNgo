// Smoke test: opens the single-file demo, scrolls through every section, exercises each interactive component.
// Run: node build.mjs && node test/smoke.mjs   (needs Playwright; chromium preinstalled in this environment)
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const out = process.env.SHOTS || 'test/shots';
mkdirSync(out, { recursive: true });
const url = 'file://' + resolve('demo/dist/demo.single.html');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
let failed = 0;
const check = (name, ok, extra = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failed++; };

for (const [label, vp] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 400, height: 800 }]]) {
  const page = await browser.newPage({ viewport: vp });
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text().slice(0, 160)}`); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__kit && window.__kit.ready);
  await page.waitForTimeout(1500);

  check(`${label}: wordmark fits width`, await page.evaluate(() => { const s = document.querySelector('#wmText').getBoundingClientRect(); return s.width > innerWidth * 0.85; }));
  check(`${label}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: `${out}/${label}-1-hero.png` });

  // hero frame opens on scroll
  const clipAt = async (y) => { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(900); return page.evaluate(() => getComputedStyle(document.querySelector('#media')).clipPath); };
  const c0 = await clipAt(0), c1 = await clipAt(vp.height * 0.95);
  check(`${label}: hero frame starts inset`, /inset\(\d+(\.\d+)?px/.test(c0) && !/inset\(0px 0px 0px 0px\)/.test(c0), c0);
  check(`${label}: hero frame opens to full bleed`, /inset\(0px( 0px){3}\)|inset\(0px\)/.test(c1) || /^inset\(0(px)?[^)]*\)$/.test(c1), c1);
  await page.screenshot({ path: `${out}/${label}-2-open.png` });

  // marquee moves
  
  await page.evaluate(() => window.scrollTo(0, innerHeight * 3));
  await page.waitForTimeout(700);
  const mx = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('#ticker [data-track]')).transform).m41);
  check(`${label}: ticker is moving`, Math.abs(mx) > 1, 'x=' + Math.round(mx));

  // provenance lights up
  await page.evaluate(() => document.querySelector('#prov').scrollIntoView({ block: 'center' }));
  await page.evaluate(() => window.scrollBy(0, 250));
  await page.waitForTimeout(1200);
  const on = await page.evaluate(() => document.querySelectorAll('#prov li.on').length);
  check(`${label}: provenance nodes light up`, on >= 2, on + ' on');
  await page.screenshot({ path: `${out}/${label}-3-prov.png` });

  // add to cart -> drawer + counter
  await page.evaluate(() => document.querySelector('.add').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  await page.click('.add');
  await page.waitForTimeout(900);
  check(`${label}: cart drawer opens`, await page.evaluate(() => !document.querySelector('#drawer').hidden));
  check(`${label}: cart counter counts`, (await page.textContent('#cartN')) === '1');
  await page.screenshot({ path: `${out}/${label}-4-cart.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  check(`${label}: Esc closes drawer`, await page.evaluate(() => document.querySelector('#drawer').hidden));

  // shared element: click collage image -> detail, then close
  await page.evaluate(() => document.querySelector('#collage').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(800);
  const img = page.locator('.item img').first();
  await img.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await img.click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/${label}-5-flight.png` });
  await page.waitForTimeout(1200);
  const slotImg = await page.evaluate(() => { const i = document.querySelector('#slot img'); if (!i) return null; const r = i.getBoundingClientRect(), s = document.querySelector('#slot').getBoundingClientRect(); return { w: Math.round(r.width), sw: Math.round(s.width), h: Math.round(r.height), sh: Math.round(s.height) }; });
  check(`${label}: image lands in detail slot`, slotImg && Math.abs(slotImg.w - slotImg.sw) < 4 && Math.abs(slotImg.h - slotImg.sh) < 4, JSON.stringify(slotImg));
  await page.screenshot({ path: `${out}/${label}-6-detail.png` });
  await page.click('#dClose');
  await page.waitForTimeout(1400);
  check(`${label}: detail closes and image returns`, await page.evaluate(() => document.querySelector('#detail').hidden && !document.querySelector('#slot img') && document.querySelector('.item img').style.visibility === ''));

  // weave transition swaps palette
  const bg0 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  await page.evaluate(() => document.querySelector('#goWeave').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  await page.click('#goWeave');
  await page.waitForTimeout(420);
  await page.screenshot({ path: `${out}/${label}-7-weave.png` });
  await page.waitForTimeout(1800);
  const bg1 = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  check(`${label}: weave swapped palette`, bg0 !== bg1, `${bg0} -> ${bg1}`);
  await page.close();
}
check('no page or console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
