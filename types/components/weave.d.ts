/**
 * Page transition made of vertical "warp threads" that cover the screen, then open again.
 * Even strips grow from the top, odd from the bottom, so the page looks woven.
 * @param {{count?: number, colors?: [string,string], parent?: HTMLElement}} [opts]
 * @returns {{run: (swap: ()=>void|Promise<void>)=>Promise<void>, setColors: (a:string,b:string)=>void, destroy: ()=>void}}
 */
export declare function weave({ count, colors, parent }?: {
    count?: number;
    colors?: [string, string];
    parent?: HTMLElement;
}): {
    run: (swap: () => void | Promise<void>) => Promise<void>;
    setColors: (a: string, b: string) => void;
    destroy: () => void;
};
