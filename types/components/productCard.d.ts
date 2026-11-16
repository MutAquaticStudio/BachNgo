/**
 * Product card hover: the card lifts, the photo drifts, a "1 OF 1" tag slides in and a stitched border starts to march.
 * Markup: el > [data-art] (photo box, overflow hidden) and optionally [data-tag]. A stitched border is added for you.
 * Works on focus too, so keyboard users get the same feedback.
 * @param {HTMLElement} el
 * @param {{lift?: number}} [opts]
 */
export declare function productCard(el: HTMLElement, { lift }?: {
    lift?: number;
}): {
    destroy(): void;
};
