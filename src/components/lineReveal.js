import { gsap, SplitText, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';
import { els } from '../core/utils.js';

/**
 * Text appears line by line from behind a mask. Re-splits on resize so lines stay correct.
 * Works with Vietnamese diacritics (SplitText splits on lines, not glyphs).
 * @param {string|Element|Element[]} target
 * @param {{stagger?: number, start?: string, once?: boolean, scroller?: string|Element}} [opts]
 */
export function lineReveal(target, { stagger = 0.08, start = 'top 88%', once = true, scroller } = {}) {
  registerKit();
  const list = els(target);
  if (reduced()) return { destroy() {} };
  const splits = [];
  const ctx = gsap.context(() => {
    list.forEach((el) => {
      const run = () => SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110, duration: dur.slow * 0.8, ease: ease.ui, stagger,
            scrollTrigger: { trigger: el, start, once, scroller },
          });
        },
      });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => splits.push(run()));
      else splits.push(run());
    });
  });
  return { destroy: () => { ctx.revert(); splits.forEach((s) => s && s.revert && s.revert()); } };
}
