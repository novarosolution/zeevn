# UI migration tracker

**Canonical path:** `src/components/ui/` (import via `@/components/ui` after Babel alias)  
**Legacy path:** `Premium*` shims in the same folder (deprecated, ESLint `warn`)  
**Started:** 2026-05-16  
**Branch:** `chore/ui-consolidation-base`

## Canonical API (source of truth)

| Export | File | Notes |
|--------|------|--------|
| Button | `Button.js` | Web: `WebNativeButton` internally |
| IconButton | `IconButton.js` | Web: `WebNativeButton` |
| Input | `Input.js` | Web: `WebNativeTextInput` (non-multiline) |
| Select | `Select.js` | Stub trigger — parent opens picker |
| Checkbox | `Checkbox.js` | Web: native checkbox button |
| Radio | `Radio.js` | Stub option |
| Card | `Card.js` | |
| Badge | `Badge.js` | |
| Toast | `Toast.js` | Web: `#zeevan-toast-root` portal |
| Modal | `Modal.js` | RN Modal passthrough |
| Drawer | `Drawer.js` | Stub; app cart uses `CartDrawer` |
| Skeleton | `Skeleton.js` | |
| EmptyState | `EmptyState.js` | |
| PageHeader | `PageHeader.js` | |
| Screen | `Screen.js` | |
| SectionHeader | `SectionHeader.js` | |
| ProgressRing | `ProgressRing.js` | |
| Chip | `Chip.js` | |
| ErrorBanner | `ErrorBanner.js` | |
| Loader | `Loader.js` | |
| Switch | `Switch.js` | |
| StatCard | `StatCard.js` | |
| StickyBar | `StickyBar.js` | |
| ConfirmDialog | `ConfirmDialog.js` | |

## Duplication table (legacy → canonical)

| Legacy import | Canonical | Status |
|---------------|-----------|--------|
| `PremiumButton` | `Button` | Screen imports migrated |
| `PremiumInput` | `Input` | Screen imports migrated |
| `PremiumCard` | `Card` | Screen imports migrated |
| `PremiumEmptyState` | `EmptyState` | Screen imports migrated |
| `PremiumSectionHeader` | `SectionHeader` | Screen imports migrated |
| `PremiumErrorBanner` | `ErrorBanner` | Screen imports migrated |
| `PremiumChip` | `Chip` | Screen imports migrated |
| `PremiumLoader` | `Loader` | Screen imports migrated |
| `PremiumStatCard` | `StatCard` | Screen imports migrated |
| `PremiumStickyBar` | `StickyBar` | Screen imports migrated |
| `PremiumSwitch` | `Switch` | Screen imports migrated |
| `PremiumConfirmDialog` | `ConfirmDialog` | Screen imports migrated |

Shim re-exports remain in `src/components/ui/index.js` until ESLint rule is bumped to **error**.

---

## Screens (50) — migration checklist

Legend: `[ ]` not started · `[~]` in progress · `[x]` migrated to canonical imports

### Shop & discovery

- [~] `HomeScreen.js` — `EmptyState`; sub-component extraction per audit still pending (`HomeHero`, `HomeProductRails`, …)
- [x] `SearchScreen.js`
- [x] `ProductScreen.js`
- [x] `CategoriesScreen.js`
- [x] `ReviewsScreen.js`
- [x] `TrustInfoScreen.js`
- [x] `CartScreen.js` — `CartItem` shared with drawer; collapsible checkout steps
- [x] `NotFoundScreen.js`

### Auth

- [x] `LoginScreen.js` — `Button`, `Input`, `Checkbox` (remember me)
- [x] `RegisterScreen.js` — `Button`, `Input`, `Toast`, `AuthCheckbox` → `Checkbox`
- [x] `ForgotPasswordScreen.js`
- [x] `ResetPasswordScreen.js`
- [x] `VerifyEmailScreen.js`

### Account (`Profile` stack)

- [x] `account/AccountOverviewScreen.js`
- [x] `account/AccountOrdersScreen.js`
- [x] `account/AccountOrderDetailScreen.js`
- [x] `account/AccountWishlistScreen.js`
- [x] `account/AccountAddressesScreen.js`
- [x] `account/AccountPaymentScreen.js`
- [x] `account/AccountProfileScreen.js` — `Switch`
- [x] `account/AccountNotificationPrefsScreen.js`
- [x] `account/AccountActivityScreen.js`

### Legacy account (redirects)

- [x] `ProfileScreen.js`
- [x] `EditProfileScreen.js`
- [x] `ManageAddressScreen.js`
- [x] `SettingsScreen.js`
- [x] `MyOrdersScreen.js`
- [x] `NotificationsScreen.js`
- [x] `RedeemRewardsScreen.js`
- [x] `SupportScreen.js`

### Editorial

- [x] `editorial/AboutScreen.js`
- [x] `editorial/ContactScreen.js`
- [x] `editorial/FaqScreen.js`
- [x] `editorial/PolicyScreen.js`
- [x] `editorial/BlogIndexScreen.js`
- [x] `editorial/BlogPostScreen.js`

### Admin

- [x] `admin/AdminDashboardScreen.js`
- [x] `admin/AdminProductsScreen.js`
- [x] `admin/AdminAddProductScreen.js`
- [x] `admin/AdminInventoryScreen.js`
- [x] `admin/AdminOrdersScreen.js`
- [x] `admin/AdminUsersScreen.js`
- [x] `admin/AdminNotificationsScreen.js`
- [x] `admin/AdminAnalyticsScreen.js`
- [x] `admin/AdminCouponsScreen.js`
- [x] `admin/AdminRewardsScreen.js`
- [x] `admin/AdminSupportScreen.js`
- [x] `admin/AdminHomeViewScreen.js`
- [x] `AdminScreen.js`

### Ops

- [x] `DeliveryDashboardScreen.js` — `Switch`

---

## Shared components (non-screen)

- [x] `components/AuthGateShell.js` — `Button`, `AUTH_SCREEN.gateShell` copy
- [x] `components/home/HomeSectionHeader.js` — wraps `SectionHeader`
- [x] `components/home/HomeReorderStrip.js` — `Card`
- [x] `components/orders/OrderLiveMapCard.*.js`
- [x] `components/payments/PaymentStatusBanner.js`
- [x] `components/account/notifications/NotificationToggleRow.js` — `Switch`
- [x] `components/ui/InteractiveListRow.js` — `Card`
- [x] `components/cart/CartItem.js` — shared line row (screen + drawer)
- [x] `components/auth/AuthCheckbox.js` — re-exports `Checkbox`

---

## Web primitives (Deliverable 5)

| Component | Web behavior |
|-----------|----------------|
| `Input` | `WebNativeTextInput` when `Platform.OS === 'web'` && !multiline |
| `Button` | `WebNativeButton` + `toWebButtonStyle` on web |
| `IconButton` | `WebNativeButton` on web |
| `Checkbox` | `WebNativeButton` + `role="checkbox"` on web |
| `Toast` | `createPortal` → `#zeevan-toast-root` |

Consumers should **not** import `inputWebHelpers` directly except edge cases (e.g. `WebTextLink` on auth screens).

---

## ESLint

- Rule: `no-restricted-imports` **warn** on `**/components/ui/Premium*`
- Exempt: `src/components/ui/Premium*.js` shim files
- **Next:** After `HomeScreen` extraction + design-token pass, change to **error** and delete shims in a follow-up PR

---

## PR log (suggested split)

| PR | Title | Files (primary) |
|----|-------|-------------------|
| 1 | `refactor(ui): migrate auth screens to ui/* primitives` | `LoginScreen.js`, `RegisterScreen.js`, `ForgotPasswordScreen.js`, `ResetPasswordScreen.js`, `VerifyEmailScreen.js`, `AuthGateShell.js`, `AuthCheckbox.js`, `Checkbox.js`, `appContent.js` |
| 2 | `refactor(ui): migrate HomeScreen empty states + home chrome` | `HomeScreen.js`, `HomeSectionHeader.js`, `HomeReorderStrip.js` |
| 3 | `refactor(ui): unify CartItem for cart screen and drawer` | `CartItem.js`, `CartItemThumb.js`, `CartScreen.js`, `CartDrawer.js` |
| 4 | `refactor(ui): migrate legacy account + admin screens to ui/*` | `ProfileScreen.js`, `MyOrdersScreen.js`, `Admin*.js`, `SettingsScreen.js`, … |
| 5 | `refactor(ui): migrate ops + shared components` | `DeliveryDashboardScreen.js`, `OrderLiveMapCard.*`, `PaymentStatusBanner.js` |

---

## Remaining work

1. **HomeScreen extraction** — split per `docs/audit-2026-05.md` (`HomeHero`, `HomeProductRails`, …).
2. **Token / copy pass** on large screens — hardcoded colors, spacing, and strings (especially `HomeScreen`, `MyOrdersScreen`).
3. **ESLint** — `Premium*` imports → `error` after extraction PR merges.
