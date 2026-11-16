import { gsap, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';

/**
 * A needle pulls a dashed thread along an SVG path.
 * Markup: a visible <path> (dashed, masked), a <path pathLength="1" stroke-dasharray="1"> inside the <mask>, and a <g> for the needle.
 * @param {{path: SVGPathElement, mask: SVGPathElement, needle: SVGGElement, duration?: number}} o
 * @returns {{play: ()=>void, set: (p:number)=>void, destroy: ()=>void}}
 */
export function heroThread({ path, mask, needle, duration = dur.thread }) {
  registerKit();
  const L = path.getTotalLength();
  const state = { p: 1 };
  const place = (p) => {
    const len = Math.max(0, Math.min(L, p * L));
    const a = path.getPointAtLength(len);
    const b0 = path.getPointAtLength(Math.max(0, len - 2));
    const b1 = path.getPointAtLength(Math.min(L, len + 2));
    const ang = (Math.atan2(b1.y - b0.y, b1.x - b0.x) * 180) / Math.PI;
    needle.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`);
    mask.style.strokeDashoffset = String(1 - p);
  };
  needle.style.opacity = 1;
  place(1);
  let tween;
  const play = () => {
    if (reduced()) return place(1);
    if (tween) tween.kill();
    state.p = 0;
    place(0);
    tween = gsap.to(state, { p: 1, duration, ease: ease.soft, onUpdate: () => place(state.p) });
  };
  return { play, set: place, destroy: () => tween && tween.kill() };
}
