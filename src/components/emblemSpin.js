import { gsap, ScrollTrigger, registerKit } from '../core/register.js';
import { reduced } from '../core/motion.js';

/**
 * A fixed emblem that turns with scroll: faster when you scroll fast, direction follows the scroll direction.
 * @param {HTMLElement} el
 * @param {{perPixel?: number}} [opts]
 */
export function emblemSpin(el, { perPixel = 0.08 } = {}) {
  registerKit();
  if (reduced()) return { destroy() {} };
  const set = gsap.quickTo(el, 'rotation', { duration: 0.6, ease: 'power3' });
  let rot = 0;
  const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { rot += self.getVelocity() * perPixel * 0.016; set(rot); } });
  return { destroy: () => st.kill() };
}
