/** Original, self-hosted outline icons for the public storefront.
 * No emoji, external icon fonts, runtime network requests, or user-supplied SVG.
 * All icons are decorative: accessible names live on their controls.
 */
const svg = inner => '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+inner+'</svg>';

export const UI_ICONS = Object.freeze({
 search: svg('<circle cx="10.75" cy="10.75" r="6.5"/><path d="m15.6 15.6 4.65 4.65"/>'),
 bag: svg('<path d="M5.7 8.5h12.6l-.95 11H6.65l-.95-11Z"/><path d="M9 9V7.3a3 3 0 0 1 6 0V9"/>'),
 menu: svg('<path class="menu-line menu-line--top" d="M4.5 7h15"/><path class="menu-line menu-line--middle" d="M4.5 12h15"/><path class="menu-line menu-line--bottom" d="M4.5 17h15"/>'),
 close: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
 plus: svg('<path d="M12 5v14M5 12h14"/>'),
 minus: svg('<path d="M5 12h14"/>')
});
