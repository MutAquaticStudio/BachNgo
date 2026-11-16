/**
 * A needle pulls a dashed thread along an SVG path.
 * Markup: a visible <path> (dashed, masked), a <path pathLength="1" stroke-dasharray="1"> inside the <mask>, and a <g> for the needle.
 * @param {{path: SVGPathElement, mask: SVGPathElement, needle: SVGGElement, duration?: number}} o
 * @returns {{play: ()=>void, destroy: ()=>void}}
 */
export declare function heroThread({ path, mask, needle, duration }: {
    path: SVGPathElement;
    mask: SVGPathElement;
    needle: SVGGElement;
    duration?: number;
}): {
    play: () => void;
    destroy: () => void;
};
