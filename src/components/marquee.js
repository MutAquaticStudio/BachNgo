import { gsap, ScrollTrigger, registerKit } from '../core/register.js';
import { reduced } from '../core/motion.js';

/**
 * Endless ticker. Speeds up (and reverses) with scroll velocity, then settles.
 * Markup: el > [data-track] > two identical <span> halves.
 * Tip: give el `mix-blend-mode:difference; color:#fff` so it inverts over photos.
 * @param {HTMLElement} el
 * @param {{speed?: number, scrollBoost?: boolean}} [opts] speed in px per second
 */
export function marquee(el, { speed = 80, scrollBoost = true } = {}) {
  registerKit();
  const track = el.querySelector('[data-track]');
  if (reduced()) return { destroy() {} };
  let tween, st;
  const ctx = gsap.context(() => {
    const half = track.scrollWidth / 2;
    tween = gsap.to(track, { x: -half, duration: half / speed, ease: 'none', repeat: -1 });
    if (scrollBoost) {
      st = ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate(self) {
          const boost = Math.min(5, Math.abs(self.getVelocity()) / 500);
          gsap.to(tween, { timeScale: (self.direction > 0 ? 1 : -1) * (1 + boost), duration: 0.25, overwrite: true });
        },
      });
      ScrollTrigger.addEventListener('scrollEnd', () => gsap.to(tween, { timeScale: 1, duration: 0.9, overwrite: true }));
    }
  }, el);
  return { destroy: () => { ctx.revert(); st && st.kill(); } };
}
