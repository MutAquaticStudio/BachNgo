import { gsap, registerKit } from '../core/register.js';
import { ease, reduced } from '../core/motion.js';

/**
 * Page transition made of vertical "warp threads" that cover the screen, then open again.
 * Even strips grow from the top, odd from the bottom, so the page looks woven.
 * @param {{count?: number, colors?: [string,string], parent?: HTMLElement, zIndex?: number}} [opts]
 * @returns {{run: (swap: ()=>void|Promise<void>)=>Promise<void>, setColors: (a:string,b:string)=>void, destroy: ()=>void}}
 */
export function weave({ count = 12, colors = ['#172840', '#0f1a2a'], parent = document.body, zIndex = 2000 } = {}) {
  registerKit();
  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText = `position:fixed;inset:0;z-index:${zIndex};display:flex;pointer-events:none`;
  const strips = Array.from({ length: count }, (_, i) => {
    const s = document.createElement('i');
    s.style.cssText = `flex:1;transform:scaleY(0);background:${colors[i % 2]}`;
    wrap.appendChild(s);
    return s;
  });
  parent.appendChild(wrap);
  let busy = false;
  const setColors = (a, b) => strips.forEach((s, i) => (s.style.background = i % 2 ? b : a));
  const run = async (swap) => {
    if (busy) return;
    busy = true;
    if (reduced()) { await swap(); busy = false; return; }
    await new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.set(strips, { transformOrigin: (i) => (i % 2 ? '50% 100%' : '50% 0%') });
      tl.to(strips, { scaleY: 1, duration: 0.5, ease: ease.inOut, stagger: { each: 0.04, from: 'start' } });
      tl.add(async () => { tl.pause(); await swap(); tl.resume(); });
      tl.set(strips, { transformOrigin: (i) => (i % 2 ? '50% 0%' : '50% 100%') });
      tl.to(strips, { scaleY: 0, duration: 0.5, ease: ease.inOut, stagger: { each: 0.04, from: 'end' } });
    });
    busy = false;
  };
  return { run, setColors, destroy: () => wrap.remove() };
}
