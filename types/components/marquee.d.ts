/**
 * Endless ticker. Speeds up (and reverses) with scroll velocity, then settles.
 * Markup: el > [data-track] > two identical <span> halves.
 * Tip: give el `mix-blend-mode:difference; color:#fff` so it inverts over photos.
 * @param {HTMLElement} el
 * @param {{speed?: number, scrollBoost?: boolean}} [opts] speed in px per second
 */
export declare function marquee(el: HTMLElement, { speed, scrollBoost }?: {
    speed?: number;
    scrollBoost?: boolean;
}): {
    destroy(): void;
};
