import { useEffect, useLayoutEffect, useRef } from 'react';

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
export function useKit(factory, opts, deps = []) {
  const ref = useRef(null);
  useIso(() => {
    if (!ref.current) return undefined;
    const inst = factory(ref.current, opts);
    return () => inst && inst.destroy && inst.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
