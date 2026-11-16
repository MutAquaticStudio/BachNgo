import { gsap, ScrollTrigger, registerKit } from '../core/register.js';
import { reduced } from '../core/motion.js';

/**
 * Smooth (inertial) scrolling with Lenis, wired into GSAP's ticker so ScrollTrigger stays in sync.
 * Lenis is an optional peer dependency: pass the class in.
 *   import Lenis from 'lenis'; smoothScroll(Lenis);
 * @param {new (o?: object) => any} Lenis
 * @param {{lerp?: number}} [opts]
 */
export function smoothScroll(Lenis, { lerp = 0.1 } = {}) {
  registerKit();
  if (reduced() || !Lenis) return { lenis: null, destroy() {} };
  const lenis = new Lenis({ lerp });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return { lenis, destroy() { gsap.ticker.remove(tick); lenis.destroy(); } };
}
