/**
 * Shared-element transition (Maison AUGE project pages): a clicked image flies to a full-bleed hero slot,
 * and flies back on close. Uses a clone so the page behind never reflows.
 *
 * CSS needed:  .shared-full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
 *
 * @param {{overlay: HTMLElement, slot: HTMLElement, duration?: number}} o
 *   overlay: the fixed detail layer (toggled with [hidden]); slot: where the image lands.
 * @returns {{open: (src: HTMLImageElement)=>Promise<void>, close: ()=>Promise<void>, isOpen: ()=>boolean}}
 */
export declare function sharedElement({ overlay, slot, duration }: {
    overlay: HTMLElement;
    slot: HTMLElement;
    duration?: number;
}): {
    open: (src: HTMLImageElement) => Promise<void>;
    close: () => Promise<void>;
    isOpen: () => boolean;
};
