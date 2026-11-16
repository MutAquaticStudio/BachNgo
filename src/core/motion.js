/** Motion tokens shared by every component. Change them in one place. */
export const dur = { fast: 0.24, base: 0.6, slow: 1.2, thread: 2.4 };
export const ease = {
  ui: 'power2.out',
  in: 'power2.in',
  inOut: 'power3.inOut',
  soft: 'power2.inOut',
  linear: 'none',
};

let override = null;
/**
 * Override the system setting for this page. true = play full motion, false = reduce, null = follow the system.
 * Use it only after the visitor chose (for example a "play full effects" button), never silently.
 * @param {boolean|null} v
 */
export const forceMotion = (v) => { override = v; };

/** True when motion should be reduced: the visitor's choice if they made one, otherwise the OS setting. */
export const reduced = () =>
  override !== null ? !override : typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True on devices without hover (phones, tablets). */
export const coarse = () => typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
