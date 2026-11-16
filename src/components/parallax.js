import { gsap, registerKit } from '../core/register.js';
import { reduced } from '../core/motion.js';
import { els } from '../core/utils.js';

/**
 * Collage parallax: each [data-speed] child drifts at its own pace while its section is on screen.
 * speed 1 = normal, 1.3 = faster, 0.8 = slower.
 * @param {HTMLElement} root
 * @param {{selector?: string, strength?: number}} [opts] strength = px of drift per 1.0 speed difference
 */
export function parallax(root, { selector = '[data-speed]', strength = 140 } = {}) {
  registerKit();
  if (reduced()) return { destroy() {} };
  const ctx = gsap.context(() => {
    els(selector, root).forEach((el) => {
      const s = parseFloat(el.dataset.speed || '1');
      const d = (s - 1) * strength;
      gsap.fromTo(el, { y: -d }, {
        y: d, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }, root);
  return { destroy: () => ctx.revert() };
}
