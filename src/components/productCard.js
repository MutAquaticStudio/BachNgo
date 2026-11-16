import { gsap, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * Product card hover: the card lifts, the photo drifts, a "1 OF 1" tag slides in and a stitched border starts to march.
 * Markup: el > [data-art] (photo box, overflow hidden) and optionally [data-tag]. A stitched border is added for you.
 * Works on focus too, so keyboard users get the same feedback.
 * @param {HTMLElement} el
 * @param {{lift?: number}} [opts]
 */
export function productCard(el, { lift = 6 } = {}) {
  registerKit();
  const art = el.querySelector('[data-art] img, [data-art]');
  const tag = el.querySelector('[data-tag]');
  let svg = el.querySelector('[data-edge]');
  if (!svg) {
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('data-edge', '');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none';
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('width', '100%'); r.setAttribute('height', '100%');
    r.style.cssText = 'fill:none;stroke:currentColor;stroke-width:1.6;stroke-dasharray:7 7;opacity:.35';
    svg.appendChild(r);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(svg);
  }
  const rect = svg.querySelector('rect');
  if (reduced()) return { destroy() {} };
  let march;
  const ctx = gsap.context(() => {
    if (tag) gsap.set(tag, { xPercent: -130 });
    march = gsap.to(rect, { strokeDashoffset: -28, duration: 1.1, ease: 'none', repeat: -1, paused: true });
  }, el);
  const inn = () => {
    gsap.to(el, { y: -lift, duration: dur.fast, ease: ease.ui });
    gsap.to(rect, { opacity: 1, duration: dur.fast });
    if (tag) gsap.to(tag, { xPercent: 0, duration: dur.fast, ease: ease.ui });
    if (art) gsap.to(art, { scale: 1.05, duration: dur.base, ease: ease.ui });
    march.play();
  };
  const out = () => {
    gsap.to(el, { y: 0, duration: dur.fast, ease: ease.ui });
    gsap.to(rect, { opacity: 0.35, duration: dur.fast });
    if (tag) gsap.to(tag, { xPercent: -130, duration: dur.fast, ease: ease.in });
    if (art) gsap.to(art, { scale: 1, duration: dur.base, ease: ease.ui });
    march.pause();
  };
  ['pointerenter', 'focusin'].forEach((e) => el.addEventListener(e, inn));
  ['pointerleave', 'focusout'].forEach((e) => el.addEventListener(e, out));
  return { destroy() { ctx.revert(); ['pointerenter', 'focusin'].forEach((e) => el.removeEventListener(e, inn)); ['pointerleave', 'focusout'].forEach((e) => el.removeEventListener(e, out)); } };
}
