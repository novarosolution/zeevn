# Core Web Vitals (customer web)

## Routes measured

| Route | Path |
|-------|------|
| Home | `/` |
| Shop | `/shop` → `Categories` screen |
| Product | `/product/:productId` |
| Cart | `/cart` |
| Login | `/login` |

## Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | < 600ms |

## Baseline vs targets (local `serve -s dist`, May 2026)

Measured after hero WebP + code-splitting; 3-run median unless noted.

| Route | Perf score | LCP | CLS | TTFB | Notes |
|-------|------------|-----|-----|------|--------|
| `/` | — | NO_LCP* | — | ~3ms | *LH ran before hero painted; use `scripts/lhci-puppeteer.js` |
| `/shop` | ~79 | **2.78s** | **0** | ~3ms | Slightly above 2.5s LCP target |
| `/login` | ~80 | **2.81s** | **0** | ~4ms | |
| `/cart` | ~80 | **2.78s** | **0** | ~3ms | |

**Targets:** LCP &lt; 2.5s · INP &lt; 200ms · CLS &lt; 0.1 · TTFB &lt; 600ms (hosting-dependent).

**Gap to close:** trim main bundle (~3.1MB index JS), defer non-critical font weights (600–800 still in bundle), ensure hero preload hits before React paint, remove Leaflet CSS from initial chunk if still linked.

## How to measure

```bash
npm run optimize:assets
npm run export:web
npx serve dist -l 8080
# In another terminal:
LHCI_BASE_URL=http://127.0.0.1:8080 npm run lighthouse:autorun
```

Set `EXPO_PUBLIC_WEB_VITALS_ENDPOINT` to POST RUM payloads in production.

## Optimizations applied

### LCP (home hero)
- `scripts/optimize-hero-images.js` — WebP srcset in `public/assets/hero/`
- `WebLcpImage` — `<img fetchpriority="high">`, explicit dimensions, `loading="lazy"` for non-first slides
- `preloadHomeHeroLcp()` — `<link rel="preload" as="image">` on home focus

### Fonts
- Self-hosted Inter 400/500 + Playfair 600/700 in `public/fonts/`
- `font-display: swap` via `injectSelfHostedFontFaces()`
- Preload critical weights in document head

### JS bundle
- `lazyOpsScreens.js` — React.lazy for admin + delivery routes
- `loadGsap.web.js` — dynamic `import('gsap')` (header, home, reveals)
- `OrderLiveMapCard.web.js` — lazy wrapper around Leaflet implementation

### Images
- `OptimizedImage` — web `loading="lazy"` + box sizing for CLS
- Hero uses WebP; product CDN images still lazy via expo-image / OptimizedImage where adopted

### CLS
- Hero slide height reserved via `heroSlideHeight` + aspect ratio on `WebLcpImage`
- Skeletons should match card dimensions (ongoing on PLP)

### Reporting
- `web-vitals` → `initWebVitalsReporting()` (console in dev, optional `EXPO_PUBLIC_WEB_VITALS_ENDPOINT`)

### PWA
- `public/sw.js` — shell SWR, image SWR, API network-first for product detail

### CI
- `.github/workflows/lighthouse-ci.yml` + `lighthouserc.cjs` — fails PR if performance < 0.75 or LCP > 2.5s or CLS > 0.1

## Remaining edge cases

- Product cards / PDP gallery: adopt `OptimizedImage` with explicit width/height everywhere
- Bundled PNG marketing assets outside hero: run WebP conversion script
- `useFonts` still loads via `@expo-google-fonts` until fully switched to local `expo-font` requires
- INP: reduce main-thread GSAP on first paint (already deferred)
- TTFB: depends on hosting/CDN — not controlled in app code
