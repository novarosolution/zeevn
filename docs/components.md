# UI Primitives

Canonical import path:

`import { Button, Card, Input } from "@/components/ui";`

## Primitives

- `Screen`: safe area page wrapper, semantic background, bottom-nav clearance, optional header.
- `PageHeader`: back chevron, breadcrumb text row, serif `h1`, right actions slot.
- `Button`: variants `primary|secondary|ghost|destructive`, sizes `sm|md|lg`.
- `IconButton`: fixed `40x40` hit target; pass `accessibilityLabel`.
- `Input`: border + focus ring + sale error state, supports `aria-describedby` via `describedBy`.
- `Select`: native sheet selector on mobile, custom listbox on web.
- `Checkbox`: brass-bordered checkbox with checked state.
- `Radio`: brass-bordered radio option.
- `Card`: surface background, `lineSoft` border, 14 radius, optional press state.
- `Badge`: variants `neutral|brass|navy|sale|success`, sizes `sm|md`.
- `Toast`: bottom-center toast, navy background, slide/fade motion.
- `Modal`: focus trap + ESC close on web, surface panel, popover shadow.
- `Drawer`: edge slide panel with focus trap + ESC close on web.
- `Skeleton`: tokenized skeleton shimmer, reduced-motion safe.
- `ProgressRing`: SVG ring, brass arc, supports determinate + spinning.
- `EmptyState`: icon + serif heading + body + optional CTA buttons.
- `SectionHeader`: overline + serif `h3` + trailing action link.
- `Breadcrumb`: compact breadcrumb list with navigable segments.
- `Tabs`: pill tabs with brass active state.
- `Tooltip`: web-only tooltip with micro text on dark surface.
- `Pagination`: previous/next chevrons + page number.
- `Rating`: 5-star brass rating with half-star rendering.
- `AppImage`: required image wrapper; requires `alt` or `decorative`.

## Legacy Premium* shims

All `Premium*` files in `src/components/ui` are deprecated thin re-exports of canonical primitives.

- Use canonical primitives for all new work.
- ESLint warns on `Premium*` imports via `no-restricted-imports`.
