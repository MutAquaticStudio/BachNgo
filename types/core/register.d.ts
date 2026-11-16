import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
/**
 * Register the GSAP plugins the kit needs. Safe to call many times.
 * Every component calls this for you, so you only need it to add extra plugins.
 * @param {object[]} [extra] more plugins to register
 */
export declare function registerKit(extra?: object[]): typeof globalThis.gsap;
export { gsap, ScrollTrigger, Flip, SplitText };
