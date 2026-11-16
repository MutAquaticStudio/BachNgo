import { gsap, ScrollTrigger, registerKit } from '../core/register.js';
import { reduced } from '../core/motion.js';

/**
 * Provenance thread: a line grows down the page and each maker lights up as the line reaches it.
 * Markup: root > [data-fill] (the growing line) and root > ol > li (one per maker).
 * Adds the class "on" to reached <li>. Without motion, every node is already on.
 * @param {HTMLElement} root
 */
export function provenance(root, { scroller } = {}) {
  registerKit();
  const fill = root.querySelector('[data-fill]');
  const nodes = Array.from(root.querySelectorAll('li'));
  if (reduced()) { nodes.forEach((n) => n.classList.add('on')); return { destroy() {} }; }
  gsap.set(fill, { scaleY: 0, transformOrigin: 'top' });
  nodes[0] && nodes[0].classList.add('on');
  const st = ScrollTrigger.create({
    trigger: root, start: 'top 70%', end: 'bottom 55%', scrub: 0.4, scroller,
    onUpdate(self) {
      gsap.set(fill, { scaleY: self.progress });
      nodes.forEach((n, i) => n.classList.toggle('on', self.progress >= i / Math.max(1, nodes.length - 1) - 0.02));
    },
  });
  return { destroy: () => st.kill() };
}
