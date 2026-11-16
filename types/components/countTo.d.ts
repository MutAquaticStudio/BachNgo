/**
 * Animate a number inside an element (seats left, stock left). Writes the final value instantly with reduced motion.
 * @param {HTMLElement} el
 * @param {number} to
 * @param {{format?: (n:number)=>string, duration?: number}} [opts]
 */
export declare function countTo(el: HTMLElement, to: number, { format, duration }?: {
    format?: (n: number) => string;
    duration?: number;
}): {
    destroy(): void;
};
