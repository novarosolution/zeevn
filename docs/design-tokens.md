# Design Tokens

Zeevan uses a single token source: `src/theme/tokens.js`. UI code must consume token references (for example via `useTheme()` and `S/R/SH/T`) and avoid raw style literals.

## Core Exports

- `COLORS`
- `SPACING`
- `RADII`
- `SHADOWS`
- `TYPE`
- `MOTION`

## Color Palette (Only Allowed Values)

| Token | Value |
| --- | --- |
| `bg` | `#FAFAF7` |
| `surface` | `#FFFFFF` |
| `surfaceAlt` | `#F4F2EC` |
| `bgDeep` | `#0E1729` |
| `bgDeepAlt` | `#14203A` |
| `ink` | `#0E0E0E` |
| `inkSoft` | `#4A4A4A` |
| `inkBody` | `#5C5C5C` |
| `inkMuted` | `#8A8A8A` |
| `inkInverse` | `#FFFFFF` |
| `inkInverseSoft` | `rgba(255,255,255,0.72)` |
| `inkInverseMuted` | `rgba(255,255,255,0.46)` |
| `line` | `#E8E6E1` |
| `lineSoft` | `rgba(14,23,41,0.06)` |
| `lineInverse` | `rgba(255,255,255,0.08)` |
| `accent` | `#C8A97E` |
| `accentOnLight` | `#8A6F45` |
| `accentSoft` | `rgba(200,169,126,0.16)` |
| `sale` | `#B23A3A` |
| `success` | `#2E7D5B` |
| `warning` | `#B17B27` |

## Spacing Scale

Allowed spacing values: `4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96` (plus `0` for reset cases only).

## Radius Scale

Allowed radius values: `6, 10, 14, 18, 24, 999`.

## Shadow Tokens

Use only:

- `soft`: `0 1px 2px rgba(14,23,41,0.04)`
- `lifted`: `0 8px 24px rgba(14,23,41,0.06)`
- `popover`: `0 12px 32px rgba(14,23,41,0.10)`

Native equivalents map to:

- `shadowColor`, `shadowOpacity`, `shadowRadius`, `shadowOffset`, `elevation`
- Allowed native sets are derived from the three shadow tokens above.

## Type Tokens

- `serifFamily`: `Playfair Display`
- `uiFamily`: `Inter`
- Scale range: `11` to `44`
- Allowed weights: `400`, `500`, `600`, `700`
- Letter-spacing is defined per scale entry in `TYPE`

## Motion Tokens

- `fast`: `120ms`
- `base`: `220ms`
- `slow`: `320ms`
- `page`: `240ms`
- `spring`: `damping 14`, `stiffness 220`, `mass 0.9`

## Forbidden Colors

Never introduce:

- Bright pinks
- Peach pastels
- Blinkit-yellow tones
- Bright greens (except the `success` token)
- Pure black (`#000` / `#000000`)

Rules:

- Sale red is only for discount badges and discount price signals.
- Brass on small text over white must use `accentOnLight` (`#8A6F45`), not `accent` (`#C8A97E`).

## Color Usage Guide

- Use `ink` for primary body text on light surfaces.
- Use `inkBody` (`#5C5C5C`) for muted body text on light surfaces with readable contrast.
- Use `inkMuted` (`#8A8A8A`) for iconography only on light surfaces (not for body copy).
- Use `accent` (`#C8A97E`) for accents on deep navy and large text on dark backgrounds.
- Use `accentOnLight` (`#8A6F45`) for small brass text on white/light backgrounds.

## Enforcement

- `npm run check:tokens` scans style literals for:
  - Off-palette hex/rgba values
  - Spacing literals outside the spacing scale for margin/padding/gap props
  - `fontWeight` values outside `400/500/600/700`
  - Shadow literals outside the defined shadow token values
- Current mode is warn-only baseline (`exit 0`), suitable for migration.
- Enable strict mode in CI later with `TOKEN_CHECK_STRICT=1 npm run check:tokens`.
- Baseline report path: `docs/token-violations-baseline.txt`.
