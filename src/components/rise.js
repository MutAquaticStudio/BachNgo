import { gsap, ScrollTrigger, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';
import { els } from '../core/utils.js';

/**
 * Elements slide up a little when they enter the viewport. Content stays visible (only translate),
 * so a screenshot or a failed script still shows everything.
 * @param {string|Element|Element[]} target
 * @param {{y?: number, start?: string, root?: Element, scroller?: string|Element}} [opts]
 */
export function rise(target, { y = 26, start = 'top 94%', root = document, scroller } = {}) {
  registerKit();
  const list = els(target, root);
  if (reduced()) return { destroy() {} };
  const ctx = gsap.context(() => {
    list.forEach((el) =>
      gsap.from(el, { y, duration: dur.base, ease: ease.ui, scrollTrigger: { trigger: el, start, once: true, scroller } }),
    );
  });
  return { destroy: () => ctx.revert() };
}
