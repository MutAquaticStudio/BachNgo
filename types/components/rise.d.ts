/**
 * Elements slide up a little when they enter the viewport. Content stays visible (only translate),
 * so a screenshot or a failed script still shows everything.
 * @param {string|Element|Element[]} target
 * @param {{y?: number, start?: string, root?: Element}} [opts]
 */
export declare function rise(target: string | Element | Element[], { y, start, root }?: {
    y?: number;
    start?: string;
    root?: Element;
}): {
    destroy(): void;
};
