# Home Redesign - May 2026

This report captures the latest full-pass home update and verification run.

## Screenshots (Top + Mid + Bottom)

Legacy baseline:

- iPhone top: `docs/images/home-redesign-2026-05/iphone-top.png`
- iPhone mid: `docs/images/home-redesign-2026-05/iphone-mid.png`
- Tablet top: `docs/images/home-redesign-2026-05/tablet-top.png`
- Tablet mid: `docs/images/home-redesign-2026-05/tablet-mid.png`
- Desktop top: `docs/images/home-redesign-2026-05/desktop-top.png`
- Desktop mid: `docs/images/home-redesign-2026-05/desktop-mid.png`

Polish pass (`2026-05-20`):

- iPhone 14 top: `docs/home-redesign-screenshots/2026-05-20/iphone-14-top.png`
- iPhone 14 mid: `docs/home-redesign-screenshots/2026-05-20/iphone-14-mid.png`
- iPhone 14 bottom: `docs/home-redesign-screenshots/2026-05-20/iphone-14-bottom.png`
- iPad top: `docs/home-redesign-screenshots/2026-05-20/ipad-top.png`
- iPad mid: `docs/home-redesign-screenshots/2026-05-20/ipad-mid.png`
- iPad bottom: `docs/home-redesign-screenshots/2026-05-20/ipad-bottom.png`
- Desktop top: `docs/home-redesign-screenshots/2026-05-20/desktop-top.png`
- Desktop mid: `docs/home-redesign-screenshots/2026-05-20/desktop-mid.png`
- Desktop bottom: `docs/home-redesign-screenshots/2026-05-20/desktop-bottom.png`

## Verification

- `npm run lint`: PASS
- `npm run export:web`: PASS

## Lighthouse (Exported Build - Post Polish)

Run target: static export served via `serve`, audited with `npx lighthouse`.

- Performance: **50** (desktop preset: **82**)
- Accessibility: **91**
- Best Practices: **96**
- SEO: **92**
- LCP: **13199 ms** (desktop preset: **2908 ms**)
- FCP: **3603 ms** (desktop preset: **888 ms**)
- TBT: **406 ms** (desktop preset: **11 ms**)
- CLS: **0.0097**

Threshold checks:

- Performance >= 85: **NOT MET**
- Accessibility >= 95: **NOT MET**

Notes:

- Home web bundle remains heavy (`_expo/static/js/web/index-*.js` ~7.9 MB combined), which dominates cold-load lighthouse metrics.
- Performance target held below threshold after polish; no new hero/visual regressions were introduced, but JavaScript execution cost remains the dominant blocker.

## Content + Composition Tracker

- `HOME_STATS_STRIP` rendered on home: **NO**
- `HOME_TESTIMONIALS` rendered on home: **NO**
- `HOME_TRUST_BANNER` rendered on home: **NO**
- `HOME_OFFERS_BAND` rendered on home: **YES**
- `HOME_REORDER_STRIP` copy normalized: **YES**
- `HOME_DEALS_RAIL` copy normalized: **YES**

## Files Updated In This Pass

- `src/screens/home/HomeScreenBody.js`
- `src/web/lenis.ts`
- `src/theme/web.js`
- `src/screens/home/hooks/useCartFeedback.js`
- `src/components/home/HomeMicroBar.js`
- `src/components/home/HomeSearchHeader.js`
- `src/components/home/HomeDealsRail.js`
- `src/components/home/HomeReorderStrip.js`
- `src/components/home/HomeOffersBand.js`
- `src/components/home/HomeCategoryGrid.js`
- `src/components/home/HomeMarketingHero.js`
- `src/components/home/HomePageFooter.js`
- `src/components/productCard/ProductCardInner.js`
- `src/components/productCard/productCardStyles.js`
- `src/components/ui/SectionHeader.js`
- `src/content/appContent.js`
- `scripts/capture-home-screenshots.mjs`
- `docs/home-redesign-2026-05.md`
