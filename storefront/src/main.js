import Lenis from 'lenis';
import {
  gsap, ScrollTrigger, registerKit, fitText, smoothScroll, heroFrame, marquee, emblemSpin, parallax, lineReveal, rise,
  stitchRule, provenance, weave, sharedElement, cartDrawer, reduced, forceMotion, ease,
} from '../../src/index.js';
import { BRANDS, ITEMS, IMG, preloadImages } from './data.js';
import { createHall } from './hall.js';
import { createLoader } from './loader.js';

registerKit();
const $ = (s) => document.querySelector(s);
const S = { brand: 'atelier', cur: 'VND', cart: {}, left: {}, active: 0, detail: null, srcEl: null };
Object.entries(ITEMS).forEach(([k, it]) => { S.left[k] = it.kind === 'batch' || it.kind === 'ticket' ? it.stock : 1; });

const money = (v) => (S.cur === 'VND' ? new Intl.NumberFormat('vi-VN').format(v) + '₫' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v / 25000));
const statusOf = (k) => { const it = ITEMS[k]; if (it.kind === 'batch') return `Lô nhỏ · còn ${S.left[k]}/${it.of} set`; if (it.kind === 'ticket') return `Còn ${S.left[k]}/${it.of} chỗ`; if (it.kind === 'commission') return 'Nhận theo yêu cầu'; return 'Hỏi giá và thời gian làm'; };
const buyLabel = (k) => { const it = ITEMS[k]; if (it.kind === 'commission') return 'Gửi yêu cầu'; if (it.kind === 'enquire') return 'Hỏi giá'; if (!S.left[k]) return 'Hết chỗ'; return it.kind === 'ticket' ? 'Giữ chỗ' : 'Thêm vào giỏ'; };
const isDisabled = (k) => { const it = ITEMS[k]; return (it.kind === 'batch' || it.kind === 'ticket') && !S.left[k]; };
const priceHtml = (it) => (it.price ? `${money(it.price)}<small>${it.note || ''}</small>` : 'Báo giá<small>liên hệ để biết giá</small>');
const brandOf = (k) => Object.keys(BRANDS).find((b) => BRANDS[b].list.includes(k)) || S.brand;

let scroll, wv, hall, hero, fit, drawer, shared, st, comps = [], dComps = [];
let fs = 100;

/* ---------- toast + cart ---------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  if (!reduced()) gsap.fromTo(t, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25 });
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2400);
}
function addToCart(k) {
  const it = ITEMS[k];
  if (it.kind === 'commission') return toast('Mở form yêu cầu OEM / ODM (demo). Dữ liệu sẽ vào Lead của ERPNext.');
  if (it.kind === 'enquire') return toast(`Mở form hỏi giá cho “${it.title}” (demo).`);
  if (!S.left[k]) return;
  S.left[k] -= 1; S.cart[k] = (S.cart[k] || 0) + 1;
  renderCart(); refreshViews(); toast(`Đã thêm “${it.title}” vào giỏ`);
}
function renderCart() {
  const ul = $('#cartList'); ul.innerHTML = ''; let n = 0, sum = 0;
  Object.keys(S.cart).forEach((k) => {
    const it = ITEMS[k], q = S.cart[k]; n += q; sum += it.price * q;
    const li = document.createElement('li'), img = document.createElement('img'); img.alt = ''; img.src = IMG[it.img].src;
    const mid = document.createElement('div'); mid.innerHTML = '<b></b><span class="mono"></span>';
    mid.querySelector('b').textContent = it.title; mid.querySelector('span').textContent = `${it.brand} · x${q} · ${money(it.price * q)}`;
    const rm = document.createElement('button'); rm.className = 'ibtn'; rm.type = 'button'; rm.textContent = 'Bỏ'; rm.setAttribute('aria-label', 'Bỏ ' + it.title);
    rm.addEventListener('click', () => { S.left[k] += S.cart[k]; delete S.cart[k]; renderCart(); refreshViews(); });
    li.append(img, mid, rm); ul.appendChild(li);
  });
  if (!n) { const e = document.createElement('li'); e.className = 'empty'; e.textContent = 'Giỏ đang trống. Món ở bất kỳ thương hiệu nào đều vào cùng một giỏ. Thử lót ly bộ 6 ở Object hoặc vé Craft Hangout.'; ul.appendChild(e); }
  $('#cartN').textContent = n; $('#dCartN').textContent = n; $('#cartSum').textContent = money(sum);
}
function refreshViews() {
  const keys = BRANDS[S.brand].list; if (keys[S.active]) fillLabel(keys[S.active], S.active, keys.length);
  renderList(); if (S.detail) fillDetailBuy(S.detail);
}

/* ---------- museum label ---------- */
function fillLabel(k, i, n) {
  const it = ITEMS[k];
  $('#lKick').textContent = `${it.brand} · ${i + 1} / ${n}${it.demo ? ' · mẫu ý tưởng' : ''}`;
  $('#lTitle').textContent = it.title; $('#lDesc').textContent = it.desc; $('#lMat').textContent = it.mat; $('#lMaker').textContent = it.maker; $('#lSize').textContent = it.size;
  $('#lBadge').textContent = statusOf(k); $('#lPrice').innerHTML = priceHtml(it);
  const bt = $('#lBuy'); bt.textContent = buyLabel(k); bt.disabled = isDisabled(k); bt.dataset.k = k; $('#lMore').dataset.k = k;
  const dots = $('#gDots').children; for (let d = 0; d < dots.length; d++) dots[d].classList.toggle('on', d === i);
  $('#gCount').textContent = `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
}
function setActive(i, animate) {
  S.active = i; const keys = BRANDS[S.brand].list;
  if (animate && !reduced()) gsap.fromTo('#label', { y: 10, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.4, ease: ease.ui });
  fillLabel(keys[i], i, keys.length);
}
function renderList() {
  if ($('#listWrap').hidden) return;
  const wrap = $('#list'); wrap.innerHTML = '';
  BRANDS[S.brand].list.forEach((k) => {
    const it = ITEMS[k], d = document.createElement('article'); d.className = 'card';
    const img = document.createElement('img'); img.alt = it.title; img.src = IMG[it.img].src; img.style.cursor = 'pointer'; img.addEventListener('click', () => openDetail(k, img));
    const h = document.createElement('h3'); h.textContent = it.title;
    const p = document.createElement('p'); p.className = 'mono'; p.textContent = statusOf(k);
    const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = buyLabel(k) + (it.price ? ' · ' + money(it.price) : ''); b.disabled = isDisabled(k); b.addEventListener('click', () => addToCart(k));
    d.append(img, h, p, b); wrap.appendChild(d);
  });
}

/* ---------- collage ---------- */
/* Grid layout: items sit in different columns of the same row, rows stack with a generous gap, so nothing can overlap
   (parallax drift is at most +-70px, well inside the row gap). Portrait photos get a narrower span. */
const SLOTS = [
  { side: 'L', start: 1, row: 1, mt: '0px', speed: 1.0 }, { side: 'R', row: 1, mt: 'clamp(40px,12vw,180px)', speed: 1.3 },
  { side: 'L', start: 3, row: 2, mt: '0px', speed: 0.85 }, { side: 'R', row: 2, mt: 'clamp(30px,8vw,120px)', speed: 1.4 },
  { side: 'L', start: 1, row: 3, mt: '0px', speed: 1.15 }, { side: 'R', row: 3, mt: 'clamp(40px,10vw,150px)', speed: 0.9, gap: 1 },
];
function buildCollage(b) {
  const box = $('#collage'); box.innerHTML = '';
  const keys = b.list.filter((k) => ITEMS[k].img);
  $('#colKick').textContent = `${b.name} · bộ sưu tập`;
  keys.forEach((k, i) => {
    const it = ITEMS[k], p = SLOTS[i % SLOTS.length], im = IMG[it.img], ar = Math.max(0.6, Math.min(1.6, im.w / im.h));
    let span = ar < 0.8 ? 4 : ar > 1.35 ? 6 : 5;
    span = p.side === 'L' ? Math.min(span, 7 - p.start) : Math.min(span, 6 - (p.gap || 0)); /* left block ends at column 6, right block starts at 7 or later */
    const start = p.side === 'L' ? p.start : 13 - span - (p.gap || 0);
    const el = document.createElement('button'); el.type = 'button'; el.className = 'item'; el.dataset.speed = p.speed; el.setAttribute('aria-label', 'Xem chi tiết ' + it.title);
    el.style.gridColumn = `${start} / span ${span}`; el.style.gridRow = String(p.row); el.style.marginTop = p.mt;
    const img = document.createElement('img'); img.alt = it.title; img.src = im.src; img.style.setProperty('--ar', ar);
    const cp = document.createElement('div'); cp.className = 'cp'; cp.innerHTML = '<b></b><span class="mono"></span>'; cp.firstChild.textContent = it.title; cp.lastChild.textContent = it.code;
    el.append(img, cp); el.addEventListener('click', () => openDetail(k, img)); box.appendChild(el);
  });
}

/* ---------- brand ---------- */
function applyBrand(k) {
  S.brand = k; const b = BRANDS[k], r = document.documentElement.style;
  comps.forEach((c) => c && c.destroy && c.destroy()); comps = [];
  ['bg', 'bg2', 'fg', 'muted', 'line', 'accent', 'thread'].forEach((v) => r.setProperty('--' + v, b[v])); r.setProperty('--accent-ink', b.ink); r.setProperty('--vig', b.dark ? 'rgba(0,0,0,.5)' : 'rgba(20,35,58,.2)');
  r.colorScheme = b.dark ? 'dark' : 'light';
  Array.from($('#tabs').children).forEach((t) => t.setAttribute('aria-selected', t.dataset.k === k ? 'true' : 'false'));
  $('#wmText').textContent = b.wm; $('#mimgEl').src = IMG[b.hero].src; $('#mcap').textContent = b.cap;
  $('#box').textContent = b.box; $('#lead').textContent = b.lead; $('#offImg').src = IMG[b.off].src; $('#offCap').textContent = b.offCap; $('#galKick').textContent = `${b.name} · phòng trưng bày`;
  const tr = $('#track'); tr.innerHTML = ''; for (let i = 0; i < 2; i++) { const s = document.createElement('span'); s.textContent = new Array(5).join(b.marq); tr.appendChild(s); }
  buildCollage(b);
  const keys = b.list, dots = $('#gDots'); dots.innerHTML = ''; keys.forEach(() => dots.appendChild(document.createElement('i')));
  if (hall) { hall.build(keys, b); }
  fit.refit();
  hero && hero.destroy();
  hero = heroFrame({ root: $('#mhero'), media: $('#mimg'), img: $('#mimgEl'), fade: ['#mcap', '#mtag'], push: '#wm', insetTop: () => fs * 0.9, insetBottom: window.innerWidth < 760 ? 64 : 78, offset: () => $('#bar').offsetHeight });
  comps.push(marquee($('#marq'), { speed: 90 }), lineReveal($('#lead')), rise($('#box')), parallax($('#collage')), stitchRule('[data-rule]'));
  setupScroll(); setActive(0, false); renderList();
  ScrollTrigger.refresh();
}
function switchBrand(k) {
  if (k === S.brand) return;
  const b = BRANDS[k]; wv.setColors(b.bg2, b.bg);
  wv.run(() => { scroll.lenis ? scroll.lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0); applyBrand(k); });
}

/* ---------- hall scroll ---------- */
let snapT;
function goTo(i) {
  const n = BRANDS[S.brand].list.length; i = Math.max(0, Math.min(n - 1, i));
  if (!st) return setActive(i, true);
  const y = st.start + (st.end - st.start) * (i / (n - 1));
  scroll.lenis ? scroll.lenis.scrollTo(y, { duration: 0.8 }) : window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
}
function setupScroll() {
  st && st.kill(); st = null; if (!hall) return;
  const n = BRANDS[S.brand].list.length, gal = $('#gal'), head = gal.querySelector('.gal-head').offsetHeight;
  gal.style.height = `calc(${head}px + ${(n - 1) * 85 + 100}vh)`;
  st = ScrollTrigger.create({
    trigger: $('#stick'), endTrigger: gal, start: 'top top+=' + $('#bar').offsetHeight, end: 'bottom bottom',
    onUpdate(s) {
      hall.progress = s.progress; clearTimeout(snapT);
      snapT = setTimeout(() => { if (S.detail || s.progress <= 0.001 || s.progress >= 0.999) return; goTo(Math.round(s.progress * (n - 1))); }, 160);
    },
  });
  hall.progress = 0;
}

/* ---------- product detail page ---------- */
function fillDetailBuy(k) {
  const it = ITEMS[k];
  $('#dBadge').textContent = statusOf(k); $('#dPrice').innerHTML = priceHtml(it);
  const bt = $('#dBuy'); bt.textContent = buyLabel(k); bt.disabled = isDisabled(k); bt.dataset.k = k;
}
function fillDetail(k) {
  const it = ITEMS[k], im = IMG[it.img], bk = brandOf(k), b = BRANDS[bk];
  const ar = Math.max(0.55, Math.min(2.1, im.w / im.h));
  $('#slot').style.setProperty('--ar', ar);
  $('#detail').classList.toggle('portrait', ar < 1.1); $('#detail').classList.toggle('landscape', ar >= 1.1);
  $('#dCrumb').textContent = `${b.name} / ${it.code}`;
  $('#dKick').textContent = `${it.brand} · ${it.code}${it.demo ? ' · mẫu ý tưởng' : ''}`;
  $('#dTitle').textContent = it.title; $('#dStory').textContent = it.desc;
  fillDetailBuy(k);
  const spec = $('#dSpec'); spec.innerHTML = '';
  [['Chất liệu', it.mat], ['Kích thước', it.size], ['Người làm', it.maker], ['Mã', it.code]].forEach(([a, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = a; dd.textContent = v; spec.append(dt, dd); });
  const ol = $('#dSteps'); ol.innerHTML = '';
  (it.steps || []).forEach((s, i) => { const li = document.createElement('li'); li.innerHTML = '<span></span>'; li.firstChild.textContent = 'Bước ' + (i + 1); li.append(s); ol.appendChild(li); });
  const rel = $('#dRel'); rel.innerHTML = '';
  b.list.filter((x) => x !== k).slice(0, 4).forEach((x) => {
    const r = ITEMS[x], c = document.createElement('button'); c.type = 'button'; c.className = 'rc'; c.innerHTML = '<img alt=""><b></b>';
    c.querySelector('img').src = IMG[r.img].src; c.querySelector('b').textContent = r.title; c.addEventListener('click', () => swapDetail(x, c.querySelector('img'))); rel.appendChild(c);
  });
  const list = b.list, next = list[(list.indexOf(k) + 1) % list.length];
  $('#dNext').dataset.k = next; $('#dNextT').textContent = ITEMS[next].title; $('#dNext').hidden = list.length < 2;
  const ni = $('#dNextImg'); ni.src = IMG[ITEMS[next].img].src; ni.style.visibility = '';
}
function revealDetail() {
  const d = $('#detail');
  if (!reduced()) gsap.fromTo('#dKick,#dTitle,#dBadge,.d-buy,.d-spec', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: ease.ui, stagger: 0.07, clearProps: 'transform,opacity' });
  dComps.push(lineReveal($('#dStory'), { scroller: d, start: 'top 98%' }), provenance($('#dProv'), { scroller: d }), rise('.rc', { scroller: d, root: d }));
  ScrollTrigger.refresh();
}
async function openDetail(k, srcEl, instant) {
  if (S.detail) return;
  const d = $('#detail'); S.detail = k; S.srcEl = srcEl || null;
  scroll.lenis && scroll.lenis.stop();
  fillDetail(k); d.scrollTop = 0; d.hidden = false;
  try { if (location.hash !== '#p-' + k) location.hash = 'p-' + k; } catch (e) { /* hash not available */ }
  if (!reduced()) { gsap.set(d, { opacity: 0 }); gsap.set('#dKick,#dTitle,#dBadge,.d-buy,.d-spec', { opacity: 0 }); if (!srcEl || instant) gsap.to(d, { opacity: 1, duration: 0.45 }); }
  const slot = $('#slot'); slot.querySelectorAll('img').forEach((i) => i.remove());
  if (srcEl && !instant) await shared.open(srcEl, { via: 'full', onFull: () => { if (!reduced()) gsap.to(d, { opacity: 1, duration: 0.5 }); } });
  else { const img = new Image(); img.src = IMG[ITEMS[k].img].src; img.alt = ''; img.className = 'shared-full'; slot.appendChild(img); if (!reduced()) gsap.from(img, { opacity: 0, scale: 1.08, duration: 0.8, ease: ease.ui }); }
  if (S.detail === k) revealDetail();
}
async function closeDetail() {
  if (!S.detail) return;
  const d = $('#detail'), src = S.srcEl; dComps.forEach((c) => c && c.destroy && c.destroy()); dComps = [];
  const done = () => { d.hidden = true; gsap.set(d, { clearProps: 'all' }); gsap.set('#detail > *, #dKick,#dTitle,#dBadge,.d-buy,.d-spec', { clearProps: 'opacity,transform' }); S.detail = null; S.srcEl = null; scroll.lenis && scroll.lenis.start(); ScrollTrigger.refresh(); };
  try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) { try { location.hash = ''; } catch (e2) { /* ignore */ } }
  if (src && !reduced()) {
    gsap.to('#detail > *:not(.pad), .d-bar, .d-info', { opacity: 0, duration: 0.2 });
    gsap.to('.d-grid ~ *, #detail > .pad:not(:first-of-type)', { opacity: 0, duration: 0.2 });
    gsap.to(d, { backgroundColor: 'rgba(0,0,0,0)', duration: 0.5 });
    await shared.close(); src.parentNode && src.classList.contains('tmp') && src.remove(); done();
  } else if (!reduced()) {
    await new Promise((res) => gsap.to(d, { opacity: 0, duration: 0.4, onComplete: res })); shared.reset(); done();
  } else { shared.reset(); done(); }
}
async function swapDetail(next, srcImg) {
  if (!S.detail || next === S.detail) return;
  const d = $('#detail');
  if (!srcImg || reduced()) {
    const b = BRANDS[brandOf(next)]; wv.setColors(b.bg2, b.bg);
    await wv.run(async () => { dComps.forEach((c) => c && c.destroy && c.destroy()); dComps = []; shared.reset(); S.detail = null; S.srcEl = null; d.hidden = true; await openDetail(next, null, true); });
    return;
  }
  /* Maison AUGE style: the teaser image grows to cover the screen, the page swaps underneath, then the image settles into the new hero. */
  await shared.open(srcImg, { via: 'full', onFull: () => {
    dComps.forEach((c) => c && c.destroy && c.destroy()); dComps = [];
    S.detail = next; S.srcEl = null; fillDetail(next); d.scrollTop = 0;
    gsap.set('#dKick,#dTitle,#dBadge,.d-buy,.d-spec', { opacity: 0 });
  } });
  if (S.detail === next) { try { location.hash = 'p-' + next; } catch (e) { /* ignore */ } revealDetail(); }
}
function openFromHall(i) {
  const keys = BRANDS[S.brand].list, k = keys[i], rect = hall && hall.rectOf(i);
  if (!rect) return openDetail(k, null, true);
  const tmp = new Image(); tmp.src = IMG[ITEMS[k].img].src; tmp.className = 'tmp'; tmp.alt = '';
  tmp.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;object-fit:cover;pointer-events:none;z-index:-1`;
  document.body.appendChild(tmp); openDetail(k, tmp);
}

/* ---------- boot ---------- */
function init() {
  scroll = smoothScroll(Lenis);
  wv = weave({ colors: [BRANDS.atelier.bg2, BRANDS.atelier.bg], zIndex: 4000 });
  fit = fitText($('#wmText'), { container: $('#mhero'), gutter: 16, onFit: (px) => { fs = px; } });
  hall = reduced() ? null : createHall($('#hall'), $('#stick'));
  if (!hall) { $('#gal').hidden = true; $('#listWrap').hidden = false; }
  shared = sharedElement({ overlay: $('#detail'), slot: $('#slot') });
  drawer = cartDrawer({ drawer: $('#cart'), scrim: $('#scrim'), openers: [$('#cartBtn'), $('#dCart')], closers: [$('#cartClose')] });

  const tabs = $('#tabs');
  Object.keys(BRANDS).forEach((k) => {
    const b = BRANDS[k], el = document.createElement('button'); el.className = 'tab'; el.type = 'button'; el.setAttribute('role', 'tab'); el.dataset.k = k;
    el.innerHTML = '<b></b><span></span>'; el.querySelector('b').textContent = b.name; el.querySelector('span').textContent = b.host; el.addEventListener('click', () => switchBrand(k)); tabs.appendChild(el);
    const c = document.createElement('span'); c.className = 'chip'; c.textContent = b.host; $('#foot').appendChild(c);
  });
  const barH = () => document.documentElement.style.setProperty('--bar-h', $('#bar').offsetHeight + 'px'); barH();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { barH(); applyBrand(S.brand); }, 200); });

  $('#gPrev').addEventListener('click', () => goTo(S.active - 1)); $('#gNext').addEventListener('click', () => goTo(S.active + 1));
  $('#lBuy').addEventListener('click', function () { addToCart(this.dataset.k); }); $('#lMore').addEventListener('click', () => openFromHall(S.active));
  $('#dBuy').addEventListener('click', function () { addToCart(this.dataset.k); });
  $('#dBack').addEventListener('click', closeDetail); $('#dNext').addEventListener('click', function () { swapDetail(this.dataset.k, $('#dNextImg')); });
  $('#cur').addEventListener('click', function () { S.cur = S.cur === 'VND' ? 'USD' : 'VND'; this.textContent = S.cur; renderCart(); refreshViews(); });
  $('#checkout').addEventListener('click', () => toast('Demo: bước này nối với Sales Order và cổng thanh toán.'));
  let escDrawer = false;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') escDrawer = drawer.isOpen(); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.detail && !escDrawer) closeDetail(); });
  window.addEventListener('hashchange', () => { if (!location.hash && S.detail) closeDetail(); });

  applyBrand('atelier'); renderCart();
  emblemSpin($('#emblem'));
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => gsap.set('#prog', { scaleX: s.progress }) });

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.target.id === 'gal' && hall) hall.visible = e.isIntersecting; }), { rootMargin: '100px' });
  if (hall) io.observe($('#gal'));
  const t0 = performance.now();
  gsap.ticker.add((time, delta) => {
    if (!hall || !hall.visible || document.hidden || S.detail) return;
    const idx = hall.frame(Math.min(delta / 1000, 0.05), (performance.now() - t0) / 1000);
    if (idx !== S.active) setActive(idx, true);
  });
}

async function askMotion() {
  if (!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  const g = $('#gate'); g.hidden = false;
  await new Promise((res) => { $('#gateFull').onclick = () => { forceMotion(true); res(); }; $('#gateKeep').onclick = () => res(); });
  g.hidden = true;
}

async function boot() {
  await askMotion();
  const loader = createLoader();
  const work = Promise.all([document.fonts ? document.fonts.ready : null, preloadImages()]).then(init);
  await loader.ready(work);
  ScrollTrigger.refresh();
  if (!reduced()) {
    gsap.fromTo('#wm', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.1, ease: 'power3.out', clearProps: 'clipPath' });
    gsap.from('#mcap', { opacity: 0, y: 16, duration: 0.8, delay: 0.5 });
  }
  const m = /^#p-([\w]+)$/.exec(location.hash || '');
  if (m && ITEMS[m[1]]) openDetail(m[1], null, true);
  window.__app = { ready: true };
}
boot();
