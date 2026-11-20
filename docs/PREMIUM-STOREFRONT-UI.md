# Premium storefront navigation and icon refresh

## Intent
Refine the public storefront without changing the approved brand identity, catalog, WhatsApp workflow, session handling, or data contracts. The reference direction draws from the calm editorial typography and restrained iconography of **Byredo**, the storytelling and whitespace of **Ffern**, and the expressive but readable fragrance navigation of **D.S. & Durga**. These references inform general UX principles, not copied layouts or brand assets.

## Implemented
- Replaced platform-dependent text glyphs (magnifier, bag, hamburger, close, quantity controls) with original, self-hosted inline SVGs in a unified 24 × 24 coordinate system, 1.75px stroke.
- Matched header tap targets at 44 × 44 CSS pixels, balanced the visual weight of search, bag, and mobile menu, and retained visible keyboard focus outlines.
- Added a modest active nav indicator and 2-column tablet / 1-column mobile navigation, with real `aria-expanded`, Escape close, click-outside close, and active page feedback.
- Search links to `catalogo.html#search`, where the field is focused on arrival. It does not pretend to open a search overlay.
- Retained the demonstration-only bag: tiny quantity pill is hidden at zero; controls are 44 × 44; `<dialog>` remains native. In **live mode the bag and related demo interactions remain removed**. There is no checkout.
- Replaced diagonal emoji-style arrows in public hero/institutional CTAs with matching outline vector arrows.
- Kept reduced-motion support, same-origin/CSP constraints, responsive typography and backend-driven availability.

## Verification
Run `npm ci`, `npm run check`, `npm test`, `npm run build`, and then `API_BASE_URL=/api/v1 npm run build:release` before publication. If using Windows PowerShell, set `$env:API_BASE_URL='/api/v1'` first.

Manual QA still required on **320px, 375px, 768px, 1024px, and desktop**:
1. Search and menu icons are centered, matching in size and line weight. No blue emoji arrow.
2. All navigation buttons meet 44px tap size and have visible focus rings.
3. Menu opens/closes via keyboard, click, and Escape; menu collapses on resize.
4. Search navigation places focus in the catalog input without disrupting filters.
5. Demo mode bag: add item, decrement/increment, close dialog; counter updates; zero hidden.
6. Live build: no demo bag, no fictitious prices/stock, product availability comes only from API.
7. Verify actual Cloudflare deployment on an iPad and test contrast and screen-reader labels.

Do **not** merge to `main` or publish a release without the existing CI/homologation/release approvals.
