import { Flip, registerKit } from '../core/register.js';
import { ease, reduced } from '../core/motion.js';

/**
 * Shared-element transition (Maison AUGE project pages): a clicked image flies to a full-bleed hero slot,
 * and flies back on close. Uses a clone so the page behind never reflows.
 *
 * CSS needed:  .shared-full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 *
 * @param {{overlay: HTMLElement, slot: HTMLElement, duration?: number}} o
 *   overlay: the fixed detail layer (toggled with [hidden]); slot: where the image lands.
 * @returns {{open: (src: HTMLImageElement, o?: {via?: 'full', onFull?: ()=>void})=>Promise<void>, close: ()=>Promise<void>, reset: ()=>void, isOpen: ()=>boolean}}
 */
export function sharedElement({ overlay, slot, duration = 0.9 }) {
  registerKit();
  let cur = null;
  const fixedAt = (node, r) => Object.assign(node.style, {
    position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
    margin: 0, zIndex: 2100, objectFit: 'cover',
  });
  const done = (tween) => new Promise((res) => (tween ? tween.eventCallback('onComplete', res) : res()));

  /**
   * @param {HTMLElement} src the image that was clicked
   * @param {{via?: 'full', onFull?: ()=>void}} [o] via 'full': first expand to cover the viewport (Maison AUGE style),
   *   call onFull while it covers everything (swap the page content there), then settle into the slot.
   */
  const open = (src, { via = null, onFull } = {}) => {
    const prev = cur;
    const clone = src.cloneNode(true);
    fixedAt(clone, src.getBoundingClientRect());
    document.body.appendChild(clone);
    src.style.visibility = 'hidden';
    overlay.hidden = false;
    cur = { src, clone };
    const dropPrev = () => { if (prev) { prev.clone.remove(); prev.src.style.visibility = ''; } };
    const settle = () => {
      const state = Flip.getState(clone);
      clone.removeAttribute('style');
      clone.classList.add('shared-full');
      slot.appendChild(clone);
      return done(Flip.from(state, { duration, ease: ease.inOut, absolute: true }));
    };
    if (reduced()) { dropPrev(); onFull && onFull(); clone.removeAttribute('style'); clone.classList.add('shared-full'); slot.appendChild(clone); return Promise.resolve(); }
    if (via === 'full') {
      const state = Flip.getState(clone);
      Object.assign(clone.style, { left: '0px', top: '0px', width: window.innerWidth + 'px', height: window.innerHeight + 'px' });
      return done(Flip.from(state, { duration: duration * 0.85, ease: ease.inOut, absolute: true })).then(() => { dropPrev(); onFull && onFull(); return settle(); });
    }
    dropPrev(); onFull && onFull();
    return settle();
  };

  const close = () => {
    if (!cur) return Promise.resolve();
    const { src, clone } = cur;
    const finish = () => { clone.remove(); src.style.visibility = ''; overlay.hidden = true; cur = null; };
    if (reduced()) { finish(); return Promise.resolve(); }
    const state = Flip.getState(clone);
    document.body.appendChild(clone);
    clone.classList.remove('shared-full');
    fixedAt(clone, src.getBoundingClientRect());
    return done(Flip.from(state, { duration, ease: ease.inOut, absolute: true })).then(finish);
  };
  const reset = () => { if (!cur) { overlay.hidden = true; return; } cur.clone.remove(); cur.src.style.visibility = ''; overlay.hidden = true; cur = null; };
  return { open, close, reset, isOpen: () => !!cur };
}
