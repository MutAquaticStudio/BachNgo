import { gsap, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';

/**
 * Animate a number inside an element (seats left, stock left). Writes the final value instantly with reduced motion.
 * @param {HTMLElement} el
 * @param {number} to
 * @param {{format?: (n:number)=>string, duration?: number}} [opts]
 */
export function countTo(el, to, { format = (n) => String(Math.round(n)), duration = dur.base } = {}) {
  registerKit();
  const from = parseFloat(el.dataset.value ?? el.textContent) || 0;
  el.dataset.value = String(to);
  if (reduced()) { el.textContent = format(to); return { destroy() {} }; }
  const o = { n: from };
  const tw = gsap.to(o, { n: to, duration, ease: ease.ui, onUpdate: () => (el.textContent = format(o.n)) });
  return { destroy: () => tw.kill() };
}
