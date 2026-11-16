/**
 * Smooth (inertial) scrolling with Lenis, wired into GSAP's ticker so ScrollTrigger stays in sync.
 * Lenis is an optional peer dependency: pass the class in.
 *   import Lenis from 'lenis'; smoothScroll(Lenis);
 * @param {new (o?: object) => any} Lenis
 * @param {{lerp?: number}} [opts]
 */
export declare function smoothScroll(Lenis: new (o?: object) => any, { lerp }?: {
    lerp?: number;
}): {
    lenis: any;
    destroy(): void;
};
