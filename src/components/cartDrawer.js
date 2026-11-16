import { gsap, registerKit } from '../core/register.js';
import { dur, ease, reduced } from '../core/motion.js';

/**
 * Slide-in cart drawer with a scrim. Lines slide in one after another. Esc closes. Focus goes in and returns.
 * @param {{drawer: HTMLElement, scrim?: HTMLElement, openers?: Element[], closers?: Element[], items?: string}} o
 * @returns {{open: ()=>void, close: ()=>void, toggle: ()=>void, isOpen: ()=>boolean, destroy: ()=>void}}
 */
export function cartDrawer({ drawer, scrim, openers = [], closers = [], items = 'li' }) {
  registerKit();
  let openState = false, lastFocus = null;
  drawer.hidden = true; if (scrim) scrim.hidden = true;
  const focusable = () => drawer.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])');
  const open = () => {
    if (openState) return;
    openState = true; lastFocus = document.activeElement;
    drawer.hidden = false; if (scrim) scrim.hidden = false;
    if (!reduced()) {
      gsap.fromTo(drawer, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: ease.ui });
      if (scrim) gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: dur.base / 2 });
      gsap.from(drawer.querySelectorAll(items), { x: 24, opacity: 0, duration: dur.base, ease: ease.ui, stagger: 0.06, delay: 0.15 });
    }
    const f = focusable(); f && f.focus();
  };
  const close = () => {
    if (!openState) return;
    openState = false;
    const done = () => { drawer.hidden = true; if (scrim) scrim.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus(); };
    if (reduced()) return done();
    gsap.to(drawer, { xPercent: 100, duration: 0.35, ease: ease.in, onComplete: done });
    if (scrim) gsap.to(scrim, { opacity: 0, duration: 0.3 });
  };
  const toggle = () => (openState ? close() : open());
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  openers.forEach((o) => o.addEventListener('click', open));
  closers.forEach((c) => c.addEventListener('click', close));
  if (scrim) scrim.addEventListener('click', close);
  return {
    open, close, toggle, isOpen: () => openState,
    destroy() { document.removeEventListener('keydown', onKey); openers.forEach((o) => o.removeEventListener('click', open)); closers.forEach((c) => c.removeEventListener('click', close)); },
  };
}
