import { gsap, heroThread, ease, reduced } from '../../src/index.js';

/**
 * Loading screen: a needle stitches a thread across the screen while a big counter runs 000 -> 100.
 * The counter follows a short timed ramp and only reaches 100 once the real work (fonts, photos) is done.
 * Exit: the strips fold away like cloth being drawn up, then the page below is revealed.
 * @returns {{ready: (work: Promise<any>) => Promise<void>}}
 */
export function createLoader() {
  const root = document.getElementById('loader');
  const strips = Array.from(root.querySelectorAll('.ld-strips i'));
  const num = document.getElementById('ldNum');
  const thread = heroThread({ path: document.getElementById('ldPath'), mask: document.getElementById('ldMaskPath'), needle: document.getElementById('ldNeedle') });
  const st = { p: 0 };
  const show = () => { num.textContent = String(Math.round(st.p * 100)).padStart(3, '0'); thread.set(st.p); };
  document.documentElement.style.overflow = 'hidden';
  thread.set(0);

  async function ready(work) {
    const min = reduced() ? 0 : 2.0;
    const ramp = reduced() ? null : gsap.to(st, { p: 0.9, duration: min, ease: 'power1.inOut', onUpdate: show });
    await Promise.all([work, new Promise((res) => setTimeout(res, min * 1000))]);
    if (ramp) ramp.kill();
    await new Promise((res) => {
      if (reduced()) { st.p = 1; show(); res(); return; }
      gsap.to(st, { p: 1, duration: 0.45, ease: 'power1.inOut', onUpdate: show, onComplete: res });
    });
    await new Promise((res) => {
      if (reduced()) { gsap.to(root, { opacity: 0, duration: 0.3, onComplete: res }); return; }
      const tl = gsap.timeline({ onComplete: res });
      tl.to('#ldUi', { opacity: 0, y: -24, duration: 0.35, ease: ease.in });
      tl.to(strips, { scaleY: 0, duration: 0.8, ease: ease.inOut, stagger: { each: 0.05, from: 'edges' } }, '-=0.1');
    });
    root.hidden = true;
    document.documentElement.style.overflow = '';
  }
  return { ready };
}
