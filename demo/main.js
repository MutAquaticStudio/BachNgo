import Lenis from 'lenis';
import {
  registerKit, gsap, ScrollTrigger, fitText, smoothScroll, heroFrame, marquee, emblemSpin, parallax, autoInit,
  productCard, provenance, weave, sharedElement, cartDrawer, needleCursor, countTo, dur, ease,
} from '../src/index.js';

registerKit();
const $ = (s) => document.querySelector(s);

const scroll = smoothScroll(Lenis);
const wm = $('#wordmark');
const fit = fitText($('#wmText'), { container: wm, gutter: 16 });
const frame = heroFrame({
  root: $('#hero'), media: $('#media'), fade: ['#cap'],
  insetTop: () => wm.getBoundingClientRect().height * 0.9, insetBottom: 70,
});
marquee($('#ticker'), { speed: 90 });
emblemSpin($('#emblem'));
parallax($('#collage'));
autoInit(document);
document.querySelectorAll('[data-card]').forEach((c) => productCard(c));
provenance($('#prov'));
needleCursor();

/* cart */
const cart = {};
const drawer = cartDrawer({ drawer: $('#drawer'), scrim: $('#scrim'), openers: [$('#cartBtn')], closers: [$('#drawerClose')] });
function renderCart() {
  const ul = $('#cartList'); ul.innerHTML = '';
  Object.entries(cart).forEach(([name, q]) => { const li = document.createElement('li'); li.innerHTML = '<span></span><b></b>'; li.firstChild.textContent = name; li.lastChild.textContent = '× ' + q; ul.appendChild(li); });
  if (!ul.children.length) ul.innerHTML = '<li><span class="mono">Giỏ đang trống</span></li>';
}
renderCart();
let total = 0;
document.querySelectorAll('.add').forEach((b) => b.addEventListener('click', () => {
  cart[b.dataset.name] = (cart[b.dataset.name] || 0) + 1; total += 1;
  countTo($('#cartN'), total);
  if (b.dataset.stock) { const s = $('#stock'); countTo(s, Math.max(0, parseFloat(s.dataset.value) - 1)); }
  renderCart(); drawer.open();
}));

/* shared element */
const shared = sharedElement({ overlay: $('#detail'), slot: $('#slot') });
document.querySelectorAll('.item img').forEach((img) => img.addEventListener('click', () => {
  $('#dTitle').textContent = img.dataset.title;
  scroll.lenis && scroll.lenis.stop();
  gsap.fromTo('#detail', { opacity: 0 }, { opacity: 1, duration: 0.5 });
  shared.open(img);
}));
$('#dClose').addEventListener('click', async () => {
  gsap.to('#detail > :not(.slot)', { opacity: 0, duration: 0.2 });
  await shared.close();
  gsap.set('#detail > :not(.slot)', { opacity: 1 });
  scroll.lenis && scroll.lenis.start();
});

/* weave: switch palette (Object -> Atelier -> Object) */
const palettes = [
  { bg: '#dfe6e2', bg2: '#cdd6d1', fg: '#14233a', muted: '#4f5d70', line: 'rgba(20,35,58,.26)', accent: '#b4501f', ink: '#fff5ec' },
  { bg: '#0f1a2a', bg2: '#172840', fg: '#efe9dd', muted: '#9aa7b8', line: 'rgba(239,233,221,.24)', accent: '#d8793a', ink: '#1a0d04' },
];
let pi = 0;
const w = weave({ colors: [palettes[1].bg2, palettes[1].bg] });
$('#goWeave').addEventListener('click', () => {
  const next = palettes[(pi + 1) % 2];
  w.setColors(next.bg2, next.bg);
  w.run(() => {
    pi = (pi + 1) % 2;
    Object.entries(next).forEach(([k, v]) => document.documentElement.style.setProperty('--' + k, v));
    scroll.lenis ? scroll.lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0);
  });
});
$('#replayHero').addEventListener('click', () => (scroll.lenis ? scroll.lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: 'smooth' })));

window.addEventListener('load', () => { frame.refresh(); ScrollTrigger.refresh(); });
window.__kit = { ready: true };
