# File-size exceptions (post extraction May 2026)

Target: no file under `src/` exceeds **600 lines**, except entries below.

## Intentional style registries

| File | Lines (approx.) | Reason |
|------|-----------------|--------|
| `src/screens/home/homeScreenStyles.js` | 2295 | `createHomeStyles` StyleSheet registry for home; split per-section in a follow-up PR |
| `src/components/productCard/productCardStyles.js` | 1165 | `createStyles` for all ProductCard layout variants |

## Remaining large modules (next splits)

| File | Lines (approx.) | Planned split |
|------|-----------------|---------------|
| `src/screens/home/HomeScreenBody.js` | 1847 | `useHomeScreenState`, `HomeScreenScroll`, `HomeScreenChrome` |
| `src/components/ProductCard.js` | 1000 | `ProductCardImage`, `ProductCardBody`, `ProductCardPrice`, `ProductCardActions` |

## Backend

`backend/src/controllers/orderController.js` is a **shim** re-exporting `orders/*` (all modules &lt; 220 lines each).
