import { gsap, registerKit } from '../core/register.js';
import { reduced, coarse } from '../core/motion.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * A needle that follows the pointer and leans in the direction it moves. Grows over [data-cursor="link"].
 * Does nothing on touch devices or with reduced motion.
 * @param {{color?: string}} [opts]
 */
export function needleCursor({ color = 'currentColor' } = {}) {
  registerKit();
  if (coarse() || reduced()) return { destroy() {} };
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;left:0;top:0;z-index:3000;pointer-events:none;color:' + color + ';mix-blend-mode:difference';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '40'); svg.setAttribute('height', '40'); svg.setAttribute('viewBox', '-20 -20 40 40');
  svg.innerHTML = '<g><path d="M-16 0 L10 0" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-11" cy="0" rx="3" ry="1.1" fill="#000"/></g>';
  el.appendChild(svg); document.body.appendChild(el);
  const g = svg.firstChild;
  const xTo = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' });
  let lx = 0, ly = 0, ang = 0;
  const move = (e) => {
    xTo(e.clientX); yTo(e.clientY);
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.hypot(dx, dy) > 4) { ang = (Math.atan2(dy, dx) * 180) / Math.PI; gsap.to(g, { rotation: ang, duration: 0.3, transformOrigin: '50% 50%', overwrite: true }); }
    lx = e.clientX; ly = e.clientY;
    const t = e.target.closest && e.target.closest('[data-cursor="link"], a, button');
    gsap.to(el, { scale: t ? 1.7 : 1, duration: 0.2, overwrite: 'auto' });
  };
  window.addEventListener('pointermove', move);
  return { destroy() { window.removeEventListener('pointermove', move); el.remove(); } };
}
