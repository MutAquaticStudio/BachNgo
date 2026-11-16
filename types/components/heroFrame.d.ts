/**
 * Maison-AUGE-style hero. A photo frame sits over the bottom of a giant wordmark.
 * Scrolling pins the section, the frame opens to full bleed and the photo settles from a slight zoom.
 *
 * Markup: root > [media (clip layer) > img], optional caption elements.
 * The wordmark itself can live inside root or be a fixed layer elsewhere; pass its measured bottom via insetTop.
 *
 * @param {{
 *  root: HTMLElement, media: HTMLElement, img?: HTMLElement,
 *  fade?: string|Element[],      // elements that fade out while opening (caption, hint)
 *  push?: string|Element|null,   // element that slides up and fades (the wordmark, if it is inside root)
 *  insetTop?: ()=>number,        // px from the top of root where the frame starts (wordmark baseline)
 *  insetBottom?: number,         // px left under the frame for the caption
 *  insetSide?: (w:number)=>number,
 *  offset?: ()=>number,          // height of a sticky header above root
 *  length?: string               // scroll distance, default '95%'
 * }} o
 */
export declare function heroFrame(o: {
    root: HTMLElement;
    media: HTMLElement;
    img?: HTMLElement;
    fade?: string | Element[];
    push?: string | Element | null;
    insetTop?: () => number;
    insetBottom?: number;
    insetSide?: (w: number) => number;
    offset?: () => number;
    length?: string;
}): {
    refresh(): void;
    destroy(): void;
};
