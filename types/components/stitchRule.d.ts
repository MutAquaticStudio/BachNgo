/**
 * A dashed "running stitch" divider that draws itself left to right.
 * CSS needed:  .stitch-rule{height:2px;background:repeating-linear-gradient(90deg,currentColor 0 14px,transparent 14px 24px)}
 * @param {string|Element|Element[]} target
 * @param {{duration?: number, start?: string}} [opts]
 */
export declare function stitchRule(target: string | Element | Element[], { duration, start }?: {
    duration?: number;
    start?: string;
}): {
    destroy(): void;
};
