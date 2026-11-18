# Homepage editorial photography (temporary licensed imagery)

## Why this change

The public live-mode script previously replaced the main hero and the editorial section with the store's **brand SVG**. Enlarging the original logo as if it were a product picture made the page look pixelated and repetitive. The hero is now intentionally a **photographic editorial** image, separate from any catalog product and its stock status.

## Images (Unsplash License — commercial use allowed)

- **Hero:** [Daria Nepriakhina — Still life in pink](https://unsplash.com/photos/pink-glass-perfume-bottle-bUjiFIn3PLk), delivered from `https://images.unsplash.com/photo-1508771400123-e194ad75c0e3`.
- **Editorial:** [Dário Gomes — pink perfume bottle with white flower](https://unsplash.com/photos/pink-perfume-bottle-with-white-flower-MoPGCgHPS6I), delivered from `https://images.unsplash.com/photo-1630573133526-8d090e0269af`.
- [Unsplash License](https://unsplash.com/license).

Both are decorative **editorial references**, **not** actual products sold by the Lojinha da Kátia; users should not infer that the photographed brands are stocked. Review the imagery with the shop owner before the production release. Replace these with official owner-approved brand photography later.

## Technical choices

- Images are loaded over HTTPS from Unsplash with a high-quality, sized URL.
- `fetchpriority=high` and `loading=eager` for the above-the-fold hero; lazy loading for below-the-fold editorial.
- CSS gives the hero a deliberate cropped portrait composition, responsive layout and reduced-motion support.
- `assets/js/live.js` no longer overwrites these photo URLs with a huge logo.
- The shop logo stays in the navigation and footer. Product-specific images and **available/published** flags continue coming from the Spring Boot API; no stock or price changed.
- Images are externally hosted: if the remote provider is unavailable, image loading fails independently of the API. For long-term reliability, use approved local assets in the repository and CDN once the photography is finalized.
