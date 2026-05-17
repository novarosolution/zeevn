# Design system final sweep report

**Date:** 2026-05-16 (updated after remediation pass)  
**Scope:** `src/` (components, screens, theme, styles, hooks)  
**Auditor:** Automated grep + remediation

## Remediation pass (latest)

- **`theme/tokens.js`**: `primary` / soft / borders remapped to **brass**; CTAs to **ink**; `danger` / `discount` kept for sale/errors; shadows use `#0E0E0E`.
- **`customerAlchemy.js`**: `ALCHEMY.gold*` → brass; surfaces aligned to design system.
- **`BottomNavBar`**: Brass active pill, ink cart badge, a11y labels.
- **`screenLayout.js`**, **`web.js`**, **`OrderLiveMapCard.web`**, **`AppFooter`**, **`AuthGateShell`**: Red chrome removed or tokenized.
- **`OPS_UI`** in `appContent.js`; wired to admin dashboard + delivery ops.
- **Admin lists**: `OpsListSkeleton` on orders / products / users; dead red badge code removed from orders.
- **Forbidden red grep**: ~35 files → **~21** (remaining are hardcoded rgba in large legacy screens; many `c.primary*` usages now brass automatically).

---

## Files audited

| Area | Paths | File count (approx.) |
|------|--------|----------------------|
| Ops shell | `src/components/ops/*` | 10 |
| Admin screens | `src/screens/admin/*` | 12 |
| Delivery | `src/screens/DeliveryDashboardScreen.js` | 1 |
| Design system UI | `src/components/ui/*` | 20+ |
| Account / editorial | `src/screens/account/*`, `src/screens/editorial/*` | 14 |
| Customer screens | `src/screens/*.js` (non-admin) | 22 |
| Theme / layout | `src/theme/*`, `src/styles/*` | 10+ |
| Legacy chrome | `CustomerScreenShell`, `Premium*`, `ProductCard`, payments, home | 40+ |

**Total files touched by grep scans:** ~120 under `src/`.

---

## 1) Color audit

### Replacements made (this sweep)

| File | Line(s) | Before | After | Notes |
|------|---------|--------|-------|-------|
| `src/screens/admin/AdminOrdersScreen.js` | ~54–119 | Local `AdminPaymentStatusChip` using `rgba(220, 38, 38, 0.08)` + red animated status pill | **Removed** — uses `OrderStatusBadge` + `PaymentStatusBadge` | Eliminates forbidden red in admin orders |
| `src/screens/admin/AdminProductsScreen.js` | 301–302 | `borderTopColor: rgba(220, 38, 38, 0.4)` / pink tint | `semantic.border.subtle` + hairline | Neutral panel chrome |
| `src/theme/web.js` | 102–108 | `::selection` / `:focus-visible` red rgba | Brass selection `rgba(184, 134, 11, 0.22)`; focus `rgba(14, 23, 41, 0.38)` (ink) | Web-only global focus |
| `src/screens/DeliveryDashboardScreen.js` | 451 | `borderRadius: 8` (off-scale) | `RADII.sm` (10) | Radius token |

### Ops / admin / delivery — clean

- `src/components/ops/**` — **no** `rgba(220,38,38)`, `#DC2626`, or `#EF4444` after sweep.
- `AdminDashboardScreen.js`, `DeliveryDashboardScreen.js` — use `semanticPalette` only (ink, accent/brass, sale for errors).

### Remaining forbidden / legacy red (not replaced — migration backlog)

These still reference legacy `c.primary` / bright red hex (grep hit count ≈ **35 files**, **~130+ line-level matches**):

| Category | Representative files | Typical usage |
|----------|---------------------|---------------|
| **Theme source** | `src/theme/tokens.js` (9), `src/theme/customerAlchemy.js` (5) | `primary: "#DC2626"`, `primarySoft: "#FEF2F2"`, `onPrimaryMuted: "#FEE2E2"` — **root cause**; must map `primary` → ink/brass in a dedicated token migration |
| **Layout helpers** | `src/theme/screenLayout.js` (3) | `customerPanelVariant("danger")` red borders |
| **Large screens** | `ProfileScreen.js` (17), `MyOrdersScreen.js` (9), `HomeScreen.js` (3), `SettingsScreen.js` (6) | Gold/red “heritage” chrome, track lines, banners |
| **Product / cart** | `ProductCard.js`, `PremiumProductCard.js` | Accent borders, CTA glow |
| **Payments** | `PaymentMethodSelector.js`, `PaymentStatusBanner.js` | Selected method gold/red tint |
| **Nav / shell** | `BottomNavBar.js`, `CustomerScreenShell.js`, `AuthGateShell.js` | Active tab / admin variant gradients |
| **Maps** | `OrderLiveMapCard.web.js` (`#DC2626` marker), `.native.js` | Map marker stroke |
| **Docs only** | `src/styles/designSystem.js` | Comments listing forbidden values (intentional) |

### Pastel pink / peach (`#FEF2F2`, `#FEE2E2`, `#FECACA`, cream gradients)

| File | Notes |
|------|--------|
| `src/theme/tokens.js` | `primarySoft`, `primaryBorder`, `onPrimaryMuted`, `brandYellowSoft` — pink surfaces tied to legacy primary |
| `src/screens/MyOrdersScreen.js` | Invoice HTML/CSS: `#FEF2F2`, `#FFFCF6`, `#FFF7E5`, etc. — **print template**, not RN theme |
| `src/screens/SupportScreen.js` | `rgba(255, 248, 235, 0.86)` peach panel |
| `src/components/payments/*` | Cream/gold selection backgrounds |
| `src/theme/screenLayout.js` | `customerPanel` light gradient `rgba(250,248,244,0.98)` — warm peach; should move to `surface` / `surfaceAlt` |

### Pure black `#000` / `#000000`

| File | Count | Recommendation |
|------|-------|----------------|
| `src/theme/tokens.js` | `shadow: "#000000"`, shadowColor in elevation presets | Use `#0E0E0E` (ink) or transparent black `rgba(14,14,14,0.x)` |
| `src/theme/adminLayout.js` | `shadowColor: "#000"` | → ink-based shadow |
| `HomeScreen.js`, `ProductCard.js`, `PremiumStatCard.js`, etc. | iOS `shadowColor` | Replace with `SHADOWS.*` presets |

---

## 2) Font audit

### Rule

Every `<Text>` should set `fontFamily` from `TYPE.serifFamily` or `TYPE.uiFamily` / `fonts.*` explicitly; no `fontWeight: '900'`; serif headings `letterSpacing: -0.02` to `-0.025em`; overlines `0.10–0.18em`, uppercase, weight 600.

### Ops / admin / delivery compliance

| File | Status |
|------|--------|
| `OpsStatCard.js`, `OpsLayout.js`, `DeliveryActiveCard.js`, `AdminDashboardScreen.js`, `DeliveryDashboardScreen.js` | ✅ Use `TYPE.*` + `fonts.semibold` for overlines |
| Other admin tool screens | ⚠️ Still use `fonts.bold` / `fonts.extrabold` in local `StyleSheet`s |

### `fonts.extrabold` (Inter 800 — avoid per checklist)

**~70 occurrences** across 20+ files, including:

- `AdminAnalyticsScreen.js`, `AdminInventoryScreen.js`, `AdminHomeViewScreen.js`
- `ProfileScreen.js`, `MyOrdersScreen.js`, `WebAppHeader.js`, `BottomNavBar.js`
- `PremiumStatCard.js`, `PaymentMethodSelector.js`, `OrderLiveMapCard.*.js`

**TODO:** Replace with `fonts.semibold` (600) or `fonts.bold` (700); map display numbers to `TYPE.serifFamily`.

### Serif letter-spacing

Not applied globally. New ops headings use default TYPE scale; **TODO:** add shared `serifHeadingStyle` in `designSystem.js` and apply to h1–h3.

---

## 3) Spacing audit

### Off-scale literals (sample)

| Pattern | Finding |
|---------|---------|
| `margin/padding: 15, 18, 25, 36` | **No matches** in `src/` (good) |
| `gap: 12` in `AdminDashboardScreen.js` styles | Matches `SPACING.md` (12) — acceptable; prefer `SPACING.md` token reference in StyleSheet |
| `padding: 16` inline in ops | Uses `SPACING.base` via Card padding — OK |

**TODO:** Run codemod to replace magic numbers in legacy screens with `SPACING` from `useTheme()`.

---

## 4) Shadow audit

### Canonical presets

Defined in `src/styles/designSystem.js` → `SHADOWS.soft | lifted | popover` (exposed via `useTheme()`).

### Custom `shadowOpacity` / `shadowRadius`

**~90+ occurrences** outside `designSystem.js`, including:

- `HomeScreen.js` (heavy — 15+ blocks)
- `ProductCard.js`, `PremiumProductCard.js`
- `ProfileScreen.js`, `MyOrdersScreen.js`
- `PremiumStatCard.js`, `PremiumStickyBar.js`, `BottomNavBar.js`
- `QCommerceSearchField.js`, `Toast.js`

**Ops components:** `Card.js` uses `SHADOWS.soft` ✅

**TODO:** Migrate legacy StyleSheets to spread `...SHADOWS.soft` (or `.lifted` / `.popover`).

---

## 5) Radius audit

| Token | Value |
|-------|-------|
| `RADII.xs` | 6 |
| `RADII.sm` | 10 |
| `RADII.md` | 14 |
| `RADII.lg` | 18 |
| `RADII.xl` | 24 |
| `RADII.pill` | 999 |

### Fixes this sweep

- `DeliveryDashboardScreen.js:451` — `8` → `RADII.sm`

### Remaining

Legacy `semanticRadius.*` in `tokens.js` still used widely (maps to similar values). **TODO:** alias `semanticRadius` → `RADII` and grep `borderRadius: [0-9]` outside tokens.

---

## 6) Icon consistency

- **Library:** `@expo/vector-icons` / `Ionicons` project-wide ✅
- **Stroke:** Ops/delivery use `*-outline` variants ✅
- **Filled icons:** Still used for active states in `BottomNavBar`, `ProductCard` CTAs, `HomeScreen` — **TODO:** restrict filled to active-only per checklist

---

## 7) Active state pattern

| Area | Status |
|------|--------|
| Ops sidebar (`OpsLayout.js`) | ✅ Brass left border + `surfaceAlt` background |
| Delivery active order | ✅ `semanticPalette.accent` border on card |
| `BottomNavBar.js` | ❌ Still `rgba(220, 38, 38, 0.14)` + `c.primary` for active tab |
| `PremiumChip` tone `gold` | ❌ Maps to red soft backgrounds in admin filters |

**TODO:** Bottom nav + chips → brass underline/dot pattern from `semanticPalette.accent`.

---

## 8) Loading states

| Screen group | Loading pattern |
|--------------|-----------------|
| `AdminDashboardScreen`, `DeliveryDashboardScreen` | ✅ `Skeleton` |
| Most admin tools | `PremiumLoader` (shim OK) |
| `AdminOrdersScreen`, `AdminUsersScreen`, `AdminProductsScreen` | ⚠️ No explicit loader on first fetch (list empty until loaded) |
| `CategoriesScreen`, `LoginScreen`, `RegisterScreen`, editorial screens | ⚠️ Not verified — likely legacy spinner or none |

**TODO:** Add `Skeleton` or `ProgressRing` to admin list screens on `loading && items.length === 0`.

---

## 9) Empty states

Screens **with** empty handling (grep): 20 screens including admin tools, cart, search, notifications, delivery.

Screens **likely missing** `<EmptyState>` for list zero-case:

- `CategoriesScreen.js`, `ForgotPasswordScreen.js` (N/A)
- Editorial static pages (N/A)
- `AdminOrdersScreen` — ✅ `PremiumEmptyState` on filter miss
- `AdminAddProductScreen.js`, `AdminHomeViewScreen.js` — verify per list

---

## 10) Accessibility

### Ops improvements (this sweep)

| File | Change |
|------|--------|
| `OpsLayout.js` | `accessibilityLabel={item.label}` on sidebar `NavItem` |
| `OpsPagination.js` | Prev/next `accessibilityLabel` ✅ |
| `OpsLayout.js` drawer close | `accessibilityLabel="Close menu"` ✅ |

### Gaps

| Rule | Status |
|------|--------|
| All `Pressable`s have role + label | ❌ Not true project-wide; ops tool rows in `AdminDashboard` use `Pressable` without explicit labels (title in child text only) |
| One h1 per screen | ⚠️ `PageHeader` title acts as h1; nested screens may duplicate |
| 4.5:1 contrast | ⚠️ `inkSoft` on `surfaceAlt` should be verified; sale red on white OK for errors only |
| Reduced motion | `useReducedMotion` hook used in motion components; ops cards static ✅ |
| 44×44 touch targets | `Button` sizes OK; some chip rows rely on `hitSlop` — audit per screen |

---

## 11) Content centralization

### Ops / delivery hardcoded strings (not in `appContent.js`)

| File | Examples |
|------|----------|
| `AdminDashboardScreen.js` | "Products", "Orders", "Quick open", "All tools", stat captions |
| `DeliveryDashboardScreen.js` | "Route map", "Assigned orders", "No active deliveries", waiting copy |
| `DeliveryActiveCard.js` | "Active delivery", "Elapsed", "Open route" |
| `OpsDataTable.js` | `emptyMessage` default prop |

**TODO:** Add `OPS_UI` / extend `DELIVERY_DASHBOARD_COPY` in `src/content/appContent.js`.

### Legacy screens

Hundreds of hardcoded `<Text>` strings remain in `HomeScreen.js`, `ProfileScreen.js`, `MyOrdersScreen.js`, admin tool StyleSheets, etc. Full grep → `appContent.js` migration is a **multi-PR effort**.

---

## 12) Bottom nav clearance

| Mechanism | Location |
|-----------|----------|
| `customerScrollPaddingBottom(insets)` | `src/theme/screenLayout.js` — `navHeight (64) + safeBottom + spacing.md` |
| `Screen` component | Uses `customerScrollPaddingBottom` in scroll content ✅ |
| Ops admin/delivery | `Screen` via `OpsLayout` — **no bottom nav** on web; delivery adds `BottomNavBar` on native only |

**DeliveryDashboardScreen:** Native shows `BottomNavBar` but `OpsLayout`/`Screen` padding may not add extra clearance when bar is present — **TODO:** pass `contentContainerStyle.paddingBottom` = `customerScrollPaddingBottom(insets)` when `BottomNavBar` visible.

**Admin screens:** Use `adminScrollPaddingBottom` — correct (no floating customer nav).

---

## Summary

| Checklist item | Ops/admin/delivery | Full codebase |
|----------------|-------------------|---------------|
| 1 Color | ✅ Clean in ops | ❌ ~35 files legacy red/pink |
| 2 Font | ✅ Mostly | ❌ extrabold widespread |
| 3 Spacing | ✅ | ⚠️ use SPACING refs in StyleSheets |
| 4 Shadow | ✅ Card | ❌ ~90 custom shadows |
| 5 Radius | ✅ Fixed one | ⚠️ semanticRadius migration |
| 6 Icons | ✅ outline in ops | ⚠️ filled overuse elsewhere |
| 7 Active brass | ✅ ops nav | ❌ bottom nav still red |
| 8 Loading | ✅ dashboard/delivery | ⚠️ some admin lists |
| 9 Empty | ✅ delivery + most admin | ⚠️ spot-check add/home |
| 10 A11y | ⚠️ partial | ❌ project-wide pass needed |
| 11 Content | ❌ ops strings local | ❌ large backlog |
| 12 Nav padding | ✅ admin | ⚠️ delivery + native nav |

---

## Recommended next PRs (priority)

1. **Token migration** — Remap `lightColors.primary` / `primarySoft` to ink/brass/sale in `tokens.js`; codemod `c.primary` decorative uses → `semanticPalette.accent` or `ink`.
2. **BottomNavBar active state** — Brass indicator; remove red rgba.
3. **`customerPanel` / `screenLayout`** — Remove red `danger` variant borders; use `sale` only for errors.
4. **Admin list loaders** — Skeleton rows on `AdminOrders`, `AdminUsers`, `AdminProducts`.
5. **`OPS_UI` content** — Centralize ops strings.
6. **Shadow codemod** — Replace custom shadow blocks with `SHADOWS.*`.
7. **Font pass** — Remove `fonts.extrabold`; enforce TYPE families.

---

## Files modified during this sweep

- `src/screens/admin/AdminOrdersScreen.js`
- `src/screens/admin/AdminProductsScreen.js`
- `src/screens/DeliveryDashboardScreen.js`
- `src/theme/web.js`
- `src/components/ops/OpsLayout.js`
- `docs/design-sweep-report.md` (this report)
