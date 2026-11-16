/**
 * Run any kit component on a ref and clean up on unmount (works with React 18 StrictMode double mount).
 *
 *   const ref = useKit((el) => productCard(el));
 *   return <article ref={ref}>...</article>;
 *
 * @template T extends HTMLElement
 * @param {(el: T, opts?: any) => ({destroy?: ()=>void} | void)} factory
 * @param {any} [opts]
 * @param {any[]} [deps]
 */
export declare function useKit<T>(factory: (el: T, opts?: any) => ({
    destroy?: () => void;
} | void), opts?: any, deps?: any[]): any;
