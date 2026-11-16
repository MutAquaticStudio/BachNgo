/**
 * Text appears line by line from behind a mask. Re-splits on resize so lines stay correct.
 * Works with Vietnamese diacritics (SplitText splits on lines, not glyphs).
 * @param {string|Element|Element[]} target
 * @param {{stagger?: number, start?: string, once?: boolean}} [opts]
 */
export declare function lineReveal(target: string | Element | Element[], { stagger, start, once }?: {
    stagger?: number;
    start?: string;
    once?: boolean;
}): {
    destroy(): void;
};
