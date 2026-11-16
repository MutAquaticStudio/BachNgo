import { stitchRule } from './stitchRule.js';
import { rise } from './rise.js';
import { lineReveal } from './lineReveal.js';
import { parallax } from './parallax.js';
import { productCard } from './productCard.js';
import { provenance } from './provenance.js';
import { marquee } from './marquee.js';
import { emblemSpin } from './emblemSpin.js';

/** name used in data-kit="..." -> factory */
export const registry = {
  'stitch-rule': (el) => stitchRule(el),
  rise: (el) => rise(el),
  'line-reveal': (el) => lineReveal(el),
  parallax: (el) => parallax(el),
  'product-card': (el) => productCard(el),
  provenance: (el) => provenance(el),
  marquee: (el) => marquee(el),
  'emblem-spin': (el) => emblemSpin(el),
};

/**
 * Wire components from markup: <div data-kit="rise">, <hr data-kit="stitch-rule">, ...
 * Add your own with registry['my-thing'] = (el) => ({ destroy(){} }).
 * @param {ParentNode} [root]
 * @returns {{destroy: ()=>void}}
 */
export function autoInit(root = document) {
  const made = [];
  root.querySelectorAll('[data-kit]').forEach((el) => {
    el.dataset.kit.split(/\s+/).forEach((name) => {
      const f = registry[name];
      if (f) made.push(f(el));
    });
  });
  return { destroy: () => made.forEach((m) => m && m.destroy && m.destroy()) };
}
