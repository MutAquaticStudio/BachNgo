import { gsap, ScrollTrigger, registerKit } from '../core/register.js';
import { reduced } from '../core/motion.js';
import { els } from '../core/utils.js';

/**
 * Maison-AUGE-style hero. A photo frame sits over the bottom of a giant wordmark.
 * Scrolling pins the section, the frame opens to full bleed and the photo settles from a slight zoom.
 *
 * Markup: root > [media (clip layer) > img], optional caption elements.
 * The wordmark itself can live inside root or be a fixed layer elsewhere; pass its measured bottom via insetTop.
 *
 * @param {{
 *  root: HTMLElement, media: HTMLElement, img?: HTMLElement,
 *  fade?: string|Element[],      // elements that fade out while opening (caption, hint)
 *  push?: string|Element|null,   // element that slides up and fades (the wordmark, if it is inside root)
 *  insetTop?: ()=>number,        // px from the top of root where the frame starts (wordmark baseline)
 *  insetBottom?: number,         // px left under the frame for the caption
 *  insetSide?: (w:number)=>number,
 *  offset?: ()=>number,          // height of a sticky header above root
 *  length?: string               // scroll distance, default '95%'
 * }} o
 */
export function heroFrame(o) {
  registerKit();
  const {
    root, media, img = media.querySelector('img'), fade = [], push = null,
    insetTop = () => root.clientHeight * 0.3, insetBottom = 70,
    insetSide = (w) => Math.round(w * (w < 760 ? 0.05 : 0.1)), offset = () => 0, length = '95%',
  } = o;
  const clip = () => `inset(${Math.round(insetTop())}px ${insetSide(root.clientWidth)}px ${insetBottom}px ${insetSide(root.clientWidth)}px)`;
  media.style.clipPath = clip();
  if (reduced()) return { refresh() { media.style.clipPath = clip(); }, destroy() {} };

  let ctx;
  const build = () => {
    ctx && ctx.revert();
    ctx = gsap.context(() => {
      gsap.set(img, { scale: 1.06 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root, start: () => 'top top+=' + offset(), end: '+=' + length, scrub: 0.5, pin: true,
          anticipatePin: 1, invalidateOnRefresh: true,
        },
      });
      tl.fromTo(media, { clipPath: clip }, { clipPath: 'inset(0px 0px 0px 0px)', ease: 'power2.inOut', duration: 1 }, 0);
      tl.to(img, { scale: 1, ease: 'none', duration: 1 }, 0);
      if (push) tl.to(push, { yPercent: -70, opacity: 0, ease: 'power1.in', duration: 0.7 }, 0);
      const f = els(fade);
      if (f.length) tl.to(f, { opacity: 0, duration: 0.3 }, 0);
    }, root);
  };
  build();
  return { refresh: () => { build(); ScrollTrigger.refresh(); }, destroy: () => ctx && ctx.revert() };
}
