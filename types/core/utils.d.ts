/** Resolve a selector, element or list to an array of elements. */
export declare function els(target: any, root?: Document): any[];
/**
 * Scale text so it spans the width of its container, like the Maison AUGE wordmark.
 * Re-fits on resize and when web fonts finish loading.
 * @param {HTMLElement} el element whose font-size will be set; must contain the text
 * @param {{container?: HTMLElement, gutter?: number, onFit?: (px:number)=>void}} [opts]
 * @returns {{refit: ()=>number, destroy: ()=>void}}
 */
export declare function fitText(el: HTMLElement, { container, gutter, onFit }?: {
    container?: HTMLElement;
    gutter?: number;
    onFit?: (px: number) => void;
}): {
    refit: () => number;
    destroy: () => void;
};
