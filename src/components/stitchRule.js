import { gsap, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';
import { els } from '../core/utils.js';

/**
 * A dashed "running stitch" divider that draws itself left to right.
 * CSS needed:  .stitch-rule{height:2px;background:repeating-linear-gradient(90deg,currentColor 0 14px,transparent 14px 24px)}
 * @param {string|Element|Element[]} target
 * @param {{duration?: number, start?: string}} [opts]
 */
export function stitchRule(target, { duration = dur.slow, start = 'top 95%', scroller } = {}) {
  registerKit();
  const list = els(target);
  if (reduced()) return { destroy() {} };
  const ctx = gsap.context(() => {
    list.forEach((el) =>
      gsap.fromTo(
        el,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration, ease: ease.inOut, scrollTrigger: { trigger: el, start, once: true, scroller } },
      ),
    );
  });
  return { destroy: () => ctx.revert() };
}
