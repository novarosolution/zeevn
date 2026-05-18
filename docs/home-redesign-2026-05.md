# Home Redesign - May 2026

This report captures the final sweep for the home redesign (Blinkit-density, Zeevan-finish).

## Screenshots

### Before (reference placeholders)

- Before screenshots were not present in this workspace snapshot.
- Add archived "before" captures here when available.

### After

- iPhone - top: `docs/images/home-redesign-2026-05/iphone-top.png`
- iPhone - mid-scroll: `docs/images/home-redesign-2026-05/iphone-mid.png`
- iPhone - bottom: `docs/images/home-redesign-2026-05/iphone-bottom.png`
- Tablet: `docs/images/home-redesign-2026-05/tablet.png`
- Desktop: `docs/images/home-redesign-2026-05/desktop.png`

## Final Checks

- `npm run lint`: PASS (0 errors, warnings present in unrelated areas)
- `npm run test:a11y`: FAIL (script missing in `package.json`)
- `npm run check:contrast`: FAIL (script missing in `package.json`)
- `npm run typecheck`: FAIL (script missing in `package.json`)
- `npx tsc --noEmit` fallback: FAIL (`my-app` template TS path/module errors)

## Home Content Tracker Verification

- `HOME_STATS_STRIP` removed from home render: CONFIRMED (not rendered in `HomeScreenBody`)
- `HOME_TESTIMONIALS` removed from home render: CONFIRMED (not rendered in `HomeScreenBody`)
- `HOME_TRUST_BANNER` added: CONFIRMED (inline trust banner in `HomeScreenBody`)
- `HOME_OFFERS_BAND` added: CONFIRMED (`HomeOffersBand` section above footer)
- `HOME_REORDER` copy norm: CONFIRMED (`Order again`, `Your usual basket`)
- `HOME_DEALS_RAIL` copy norm: CONFIRMED (short action copy: `Deals`, `See all deals`)

## Lighthouse + Web Vitals

Run target: static production build (`expo export`) served locally via `serve`.

- Performance: **84**
- Accessibility: **100**
- Best Practices: **96**
- SEO: **82**
- LCP: **2649 ms**
- FCP: **349 ms**
- TBT: **16 ms**
- CLS: **0.0059**

Threshold check requested:

- Performance >= 85: **NOT MET** (missed by 1 point in repeated runs)
- Accessibility >= 95: **MET**

LCP source verification:

- Web LCP image preload is configured via `src/constants/heroLcp.web.js` and `src/utils/webHead.web.js`.
- Lighthouse "largest-contentful-paint-element" audit is currently returning `error` due trace gatherer issue, so element attribution is not emitted in this run.
- Runtime web-vitals logging is active (`src/utils/reportWebVitals.web.js`); observed logs include TTFB/FCP in headless capture.

## Move / Remove / Rename / Add Checklist

- Removed from home flow:
  - Stats strip section in home render path
  - Testimonials section in home render path
  - Legacy multi-band trust/stats/testimonials stack before footer
- Added to home flow:
  - Deals rail below hero
  - Single offers band above footer
  - Footer inline trust pills
  - Inline ATC morph in product cards
- Tightened:
  - Home section spacing rhythm
  - Catalog card density and typography
  - Home header speed/access pattern
  - Palette hardening to brass/navy/red usage rules
