/** Resolve a selector, element or list to an array of elements. */
export function els(target, root = document) {
  if (!target) return [];
  if (typeof target === 'string') return Array.from(root.querySelectorAll(target));
  if (target instanceof Element) return [target];
  return Array.from(target);
}

/**
 * Scale text so it spans the width of its container, like the Maison AUGE wordmark.
 * Re-fits on resize and when web fonts finish loading.
 * @param {HTMLElement} el element whose font-size will be set; must contain the text
 * @param {{container?: HTMLElement, gutter?: number, onFit?: (px:number)=>void}} [opts]
 * @returns {{refit: ()=>number, destroy: ()=>void}}
 */
export function fitText(el, { container = el.parentElement, gutter = 16, onFit } = {}) {
  const prev = el.style.display;
  const refit = () => {
    el.style.display = 'inline-block';
    el.style.fontSize = '100px';
    const w = el.getBoundingClientRect().width || 1;
    const px = (100 * (container.clientWidth - gutter * 2)) / w;
    el.style.fontSize = px + 'px';
    el.style.display = prev;
    if (onFit) onFit(px);
    return px;
  };
  refit();
  const ro = new ResizeObserver(refit);
  ro.observe(container);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  return { refit, destroy: () => ro.disconnect() };
}
