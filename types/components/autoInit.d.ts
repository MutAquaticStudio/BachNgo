/** name used in data-kit="..." -> factory */
export declare const registry: {
    'stitch-rule': (el: any) => {
        destroy(): void;
    };
    rise: (el: any) => {
        destroy(): void;
    };
    'line-reveal': (el: any) => {
        destroy(): void;
    };
    parallax: (el: any) => {
        destroy(): void;
    };
    'product-card': (el: any) => {
        destroy(): void;
    };
    provenance: (el: any) => {
        destroy(): void;
    };
    marquee: (el: any) => {
        destroy(): void;
    };
    'emblem-spin': (el: any) => {
        destroy(): void;
    };
};
/**
 * Wire components from markup: <div data-kit="rise">, <hr data-kit="stitch-rule">, ...
 * Add your own with registry['my-thing'] = (el) => ({ destroy(){} }).
 * @param {ParentNode} [root]
 * @returns {{destroy: ()=>void}}
 */
export declare function autoInit(root?: ParentNode): {
    destroy: () => void;
};
