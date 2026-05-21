# Final polish report (May 2026)

## Lighthouse scores

Measured on static export (`npm run export:web`) served with `npx serve -s dist`, home route `/`, Puppeteer wait script, May 20 2026.

| Profile | Before (perf pass) | Final | Target | Status |
|---------|------------------|-------|--------|--------|
| **Desktop performance** | 85 | **80** | ≥ 85 | Close — LCP ~2.8s (preload + WebP hero) |
| **Mobile performance** | — | **45–51** | ≥ 75 | RN-Web + LH mobile throttling; LCP often mis-reports (15s+) |
| **Accessibility (both)** | 91 | **96** | ≥ 90 | Pass |

| Metric | Before desktop | Final desktop | Final mobile |
|--------|----------------|---------------|--------------|
| FCP | 607 ms | 615 ms | 930 ms |
| LCP | 2549 ms | 2840 ms | 15123 ms* |
| CLS | 0.054 | 0.059 | 0.070 |
| TBT | 14 ms | 51 ms | 602 ms |

\*Mobile LCP inflated on local static serve — see [known-issues.md](./known-issues.md). Validate on deployed CDN with WebP heroes for production sign-off.

## Bundle size (gzip)

| Chunk | Size |
|-------|------|
| **Entry** `index-*.js` | **1019 KB** |
| Secondary index chunk | 668 KB |
| Leaflet (lazy) | 53 KB |
| Admin analytics (lazy) | 52 KB |
| Account navigator (lazy) | 47 KB |
| Product screen (lazy) | 36 KB |
| ScrollTrigger (lazy) | 18 KB |
| Admin/delivery screens | 6 KB each |

**Remaining bloat:** dual index chunks (~1.7 MB gzip combined), `appContent.js` (~71 KB raw), `lucide-react-native`, `react-native-chart-kit` (admin analytics only — already lazy).

## Code-splitting confirmed

- `src/navigation/lazyOpsScreens.web.js` — all admin + delivery routes
- `src/navigation/lazyCustomerScreens.web.js` — account, editorial, PLP
- `OrderLiveMapCard.web.js` — Leaflet lazy
- `loadGsap.web.js` — GSAP dynamic import

## A11y

| Check | Result |
|-------|--------|
| `npm run test:a11y` (6 routes) | **Pass** — see [a11y-report.json](../a11y-report.json) |
| `npm run check:contrast` | **Pass** — `inkMuted` darkened to `#757575` |
| Keyboard / SR | Manual checklist in [smoke-test.md](../smoke-test.md) |

Routes: `/`, `/login`, `/shop`, `/search`, `/cart`, `/register`.

Fixes: `DecorativeExpoImage` for labeled controls; SPA serve `-s` for deep links.

## Observability

| Item | Location |
|------|----------|
| Sentry client | `src/observability/sentry.web.js`, `index.js` |
| Sentry backend | `backend/src/observability/sentry.js` |
| App error boundary | `src/components/errors/AppErrorBoundary.js` |
| Route error boundary | `src/components/errors/RouteErrorBoundary.js` |
| Health | `GET /health`, `GET /api/health` |
| Web Vitals RUM | `src/utils/reportWebVitals.web.js` + `web-vitals` |

## Assets & fonts

- Hero: WebP srcset in `public/assets/hero/`; preload in `post-export-web.js`
- Products: Cloudinary `f_webp` via `buildResponsiveImageSources()`
- Fonts: woff2 self-hosted, `font-display: swap`, preload Inter 400/500 + Playfair 600

## Phase links (this initiative)

1. Home redesign + design tokens — `docs/home-redesign-2026-05.md`
2. Performance baseline & code-split — `docs/perf/summary.json`
3. Auth + account hub — auth screens, `AccountShell`
4. PLP / search / category — `src/components/plp/`
5. Editorial pages — `src/screens/editorial/`
6. Admin + delivery ops UI — `OpsLayout`, `lazyOpsScreens.web.js`
7. **Final polish** — this report, a11y scripts, contrast audit, RUM
