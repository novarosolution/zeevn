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

| Legacy import | Canonical | Consumer files (approx.) |
|---------------|-----------|---------------------------|
| `PremiumButton` | `Button` | 22 screens/components |
| `PremiumInput` | `Input` | 15 |
| `PremiumCard` | `Card` (+ adapter props via shim) | 19 |
| `PremiumEmptyState` | `EmptyState` | 13 |
| `PremiumSectionHeader` | `SectionHeader` | 11 |
| `PremiumErrorBanner` | `ErrorBanner` | 12 |
| `PremiumChip` | `Chip` | 10 |
| `PremiumLoader` | `Loader` | 10 |
| `PremiumStatCard` | `StatCard` | 4 |
| `PremiumStickyBar` | `StickyBar` | 2 |
| `PremiumSwitch` | `Switch` | 4 |
| `PremiumConfirmDialog` | `ConfirmDialog` | 2 |
| Raw `<button>` (login) | `Checkbox` | 1 (`LoginScreen`) |
| `IconGhostButton` | `IconButton` | 3 account components |

---

## Screens (50) — migration checklist

Legend: `[ ]` not started · `[~]` in progress · `[x]` migrated to canonical imports

### Shop & discovery

- [ ] `HomeScreen.js` — PremiumEmptyState → EmptyState
- [ ] `SearchScreen.js` — (uses EmptyState path if any)
- [ ] `ProductScreen.js` — audit Premium vs ui
- [ ] `CategoriesScreen.js`
- [ ] `ReviewsScreen.js`
- [ ] `TrustInfoScreen.js`
- [ ] `CartScreen.js` — Button, Card, EmptyState
- [ ] `NotFoundScreen.js` — Button

### Auth

- [ ] `LoginScreen.js` — Button; Remember Me → Checkbox
- [ ] `RegisterScreen.js` — Button, Toast
- [ ] `ForgotPasswordScreen.js` — Button, Input, Toast
- [ ] `ResetPasswordScreen.js` — Button, Input
- [ ] `VerifyEmailScreen.js` — Button

### Account (`Profile` stack)

- [ ] `account/AccountOverviewScreen.js`
- [ ] `account/AccountOrdersScreen.js`
- [ ] `account/AccountOrderDetailScreen.js`
- [ ] `account/AccountWishlistScreen.js` — Button, Toast
- [ ] `account/AccountAddressesScreen.js`
- [ ] `account/AccountPaymentScreen.js`
- [ ] `account/AccountProfileScreen.js` — Button, Toast, PremiumSwitch → Switch
- [ ] `account/AccountNotificationPrefsScreen.js` — Button, Toast
- [ ] `account/AccountActivityScreen.js`

### Legacy account (redirects)

- [ ] `ProfileScreen.js` — PremiumButton, Card, Chip, StatCard, SectionHeader, ErrorBanner
- [ ] `EditProfileScreen.js` — PremiumInput, Button, Loader, ErrorBanner, SectionHeader, StickyBar
- [ ] `ManageAddressScreen.js` — Premium* set
- [ ] `SettingsScreen.js` — PremiumCard, SectionHeader, Switch, ErrorBanner
- [ ] `MyOrdersScreen.js` — full Premium set
- [ ] `NotificationsScreen.js`
- [ ] `RedeemRewardsScreen.js` — full Premium set
- [ ] `SupportScreen.js` — PremiumEmptyState, Input, Button, Card, ErrorBanner

### Editorial

- [ ] `editorial/AboutScreen.js`
- [ ] `editorial/ContactScreen.js` — Input
- [ ] `editorial/FaqScreen.js`
- [ ] `editorial/PolicyScreen.js`
- [ ] `editorial/BlogIndexScreen.js`
- [ ] `editorial/BlogPostScreen.js` — Button

### Admin

- [ ] `admin/AdminDashboardScreen.js`
- [ ] `admin/AdminProductsScreen.js` — PremiumInput, Button, Card, Chip, EmptyState, ErrorBanner
- [ ] `admin/AdminAddProductScreen.js` — PremiumInput, Button, Chip, SectionHeader, ErrorBanner
- [ ] `admin/AdminInventoryScreen.js`
- [ ] `admin/AdminOrdersScreen.js` — PremiumConfirmDialog → ConfirmDialog
- [ ] `admin/AdminUsersScreen.js` — PremiumConfirmDialog
- [ ] `admin/AdminNotificationsScreen.js`
- [ ] `admin/AdminAnalyticsScreen.js`
- [ ] `admin/AdminCouponsScreen.js`
- [ ] `admin/AdminRewardsScreen.js`
- [ ] `admin/AdminSupportScreen.js`
- [ ] `admin/AdminHomeViewScreen.js`
- [ ] `AdminScreen.js` — Premium* dashboard

### Ops

- [ ] `DeliveryDashboardScreen.js` — PremiumSwitch → Switch

---

## Shared components (non-screen)

- [ ] `components/AuthGateShell.js` — PremiumButton → Button
- [ ] `components/home/HomeSectionHeader.js` — PremiumSectionHeader → SectionHeader
- [ ] `components/home/HomeReorderStrip.js` — PremiumCard → Card
- [ ] `components/orders/OrderLiveMapCard.*.js` — PremiumButton, Card, SectionHeader
- [ ] `components/payments/PaymentStatusBanner.js` — PremiumButton, ErrorBanner
- [ ] `components/account/notifications/NotificationToggleRow.js` — PremiumSwitch
- [ ] `components/ui/InteractiveListRow.js` — PremiumCard → Card
- [ ] `components/account/shared/IconGhostButton.js` — → IconButton (optional)

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
- After migration complete: change to **error**

---

## Commits (this migration kickoff)

1. `feat(ui): add canonical Chip, Loader, Switch, Modal, and form primitives`
2. `refactor(ui): Premium shims delegate to components/ui`
3. `chore: babel @ alias, jsconfig, eslint warn on Premium imports`
4. `docs: add ui-migration tracker`
