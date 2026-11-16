/**
 * A needle that follows the pointer and leans in the direction it moves. Grows over [data-cursor="link"].
 * Does nothing on touch devices or with reduced motion.
 * @param {{color?: string}} [opts]
 */
export declare function needleCursor({ color }?: {
    color?: string;
}): {
    destroy(): void;
};
