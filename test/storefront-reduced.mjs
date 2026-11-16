// A visitor whose device asks for reduced motion must be offered a choice, and both answers must work.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.env.SHOTS || 'test/shots-store'; mkdirSync(out, { recursive: true });
const url = 'file://' + resolve('storefront/dist/storefront.single.html');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = []; let failed = 0;
const check = (n, ok, x = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!ok) failed++; };
const open = async (choice) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
  await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(500);
  check(`reduced/${choice}: gate asks first`, await page.evaluate(() => !document.getElementById('gate').hidden));
  await page.screenshot({ path: `${out}/reduced-0-gate.png` });
  await page.click(choice === 'full' ? '#gateFull' : '#gateKeep');
  return page;
};

// choose FULL: every effect must be back
let page = await open('full');
await page.waitForTimeout(700);
const n1 = await page.evaluate(() => document.getElementById('ldNum').textContent); await page.waitForTimeout(500);
const n2 = await page.evaluate(() => document.getElementById('ldNum').textContent);
check('reduced/full: loader counts', Number(n2) > Number(n1), `${n1} -> ${n2}`);
await page.waitForFunction(() => window.__app && window.__app.ready, null, { timeout: 15000 }); await page.waitForTimeout(1500);
check('reduced/full: 3D hall is on', await page.evaluate(() => !document.getElementById('gal').hidden));
await page.evaluate(() => window.scrollTo(0, 760)); await page.waitForTimeout(1200);
check('reduced/full: hero opens on scroll', /inset\(0px/.test(await page.evaluate(() => getComputedStyle(document.getElementById('mimg')).clipPath)));
await page.evaluate(() => document.getElementById('collage').scrollIntoView({ block: 'start' })); await page.waitForTimeout(700);
await page.locator('.item img').first().click(); await page.waitForTimeout(450);
await page.screenshot({ path: `${out}/reduced-1-full-flight.png` });
await page.waitForTimeout(2200);
check('reduced/full: detail opens after the flight', await page.evaluate(() => !document.getElementById('detail').hidden && !!document.querySelector('#slot img')));
await page.context().close();

// choose KEEP: static but fully usable
page = await open('keep');
await page.waitForFunction(() => window.__app && window.__app.ready, null, { timeout: 15000 }); await page.waitForTimeout(800);
check('reduced/keep: grid replaces the 3D hall', await page.evaluate(() => document.getElementById('gal').hidden && !document.getElementById('listWrap').hidden));
await page.evaluate(() => document.querySelector('#list .card img').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
await page.locator('#list .card img').first().click(); await page.waitForTimeout(800);
check('reduced/keep: detail still opens', await page.evaluate(() => !document.getElementById('detail').hidden && !!document.querySelector('#slot img')));
await page.keyboard.press('Escape'); await page.waitForTimeout(600);
check('reduced/keep: detail closes', await page.evaluate(() => document.getElementById('detail').hidden));
await page.context().close();

check('no page or console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed'); process.exit(failed ? 1 : 0);
