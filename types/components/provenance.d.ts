/**
 * Provenance thread: a line grows down the page and each maker lights up as the line reaches it.
 * Markup: root > [data-fill] (the growing line) and root > ol > li (one per maker).
 * Adds the class "on" to reached <li>. Without motion, every node is already on.
 * @param {HTMLElement} root
 */
export declare function provenance(root: HTMLElement): {
    destroy(): void;
};
