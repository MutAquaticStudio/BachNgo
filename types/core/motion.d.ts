/** Motion tokens shared by every component. Change them in one place. */
export declare const dur: {
    fast: number;
    base: number;
    slow: number;
    thread: number;
};
export declare const ease: {
    ui: string;
    in: string;
    inOut: string;
    soft: string;
    linear: string;
};
/** True when the visitor asked the OS for less motion. */
export declare const reduced: () => boolean;
/** True on devices without hover (phones, tablets). */
export declare const coarse: () => boolean;
