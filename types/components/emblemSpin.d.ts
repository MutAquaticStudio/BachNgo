/**
 * A fixed emblem that turns with scroll: faster when you scroll fast, direction follows the scroll direction.
 * @param {HTMLElement} el
 * @param {{perPixel?: number}} [opts]
 */
export declare function emblemSpin(el: HTMLElement, { perPixel }?: {
    perPixel?: number;
}): {
    destroy(): void;
};
