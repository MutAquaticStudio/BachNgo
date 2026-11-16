/**
 * Collage parallax: each [data-speed] child drifts at its own pace while its section is on screen.
 * speed 1 = normal, 1.3 = faster, 0.8 = slower.
 * @param {HTMLElement} root
 * @param {{selector?: string, strength?: number}} [opts] strength = px of drift per 1.0 speed difference
 */
export declare function parallax(root: HTMLElement, { selector, strength }?: {
    selector?: string;
    strength?: number;
}): {
    destroy(): void;
};
