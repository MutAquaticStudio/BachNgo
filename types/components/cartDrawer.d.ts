/**
 * Slide-in cart drawer with a scrim. Lines slide in one after another. Esc closes. Focus goes in and returns.
 * @param {{drawer: HTMLElement, scrim?: HTMLElement, openers?: Element[], closers?: Element[], items?: string}} o
 * @returns {{open: ()=>void, close: ()=>void, toggle: ()=>void, isOpen: ()=>boolean, destroy: ()=>void}}
 */
export declare function cartDrawer({ drawer, scrim, openers, closers, items }: {
    drawer: HTMLElement;
    scrim?: HTMLElement;
    openers?: Element[];
    closers?: Element[];
    items?: string;
}): {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
    destroy: () => void;
};
