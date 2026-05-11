# UI Overhaul Baseline Report

## Route-To-Shell Matrix

| Area | Route | Shell | Header | Footer | Bottom Nav | Auth Gate |
| --- | --- | --- | --- | --- | --- | --- |
| Auth | `Login` | `CustomerScreenShell` | no | `AppFooter` | no | public |
| Auth | `Register` | `CustomerScreenShell` | no | `AppFooter` | no | public |
| Customer | `Home` | custom home shell | home header | `HomePageFooter` | yes (mobile) | mixed |
| Customer | `Product` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | optional |
| Customer | `Cart` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | mixed |
| Customer | `Profile` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Customer | `EditProfile` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Customer | `MyOrders` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Customer | `Notifications` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Customer | `Settings` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Customer | `ManageAddress` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Customer | `Support` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | required |
| Delivery | `DeliveryDashboard` | `CustomerScreenShell` | `ScreenPageHeader` | `AppFooter` | yes (mobile) | role based |
| Admin | `AdminDashboard` | `CustomerScreenShell` | admin variant | none/mixed | no | role based |
| Admin | `AdminProducts` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminInventory` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminAddProduct` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminOrders` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminUsers` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminNotifications` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminAnalytics` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminCoupons` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminSupport` | `CustomerScreenShell` | admin variant | mixed | no | role based |
| Admin | `AdminHomeView` | `CustomerScreenShell` | admin variant | mixed | no | role based |

## Baseline Issues Checklist

- [x] Shared shell exists but used inconsistently across app areas.
- [x] Header/footer variants are mixed and not governed by route groups.
- [x] Mobile bottom navigation behavior is not centrally defined.
- [x] Theme token usage is inconsistent in shared components.
- [x] Auth/role checks are distributed at screen level.
- [x] Route stack is flat; no dedicated area stacks for auth/customer/admin/delivery.

## Redesign Acceptance Checklist

- [ ] Every route maps to a single shell contract.
- [ ] Top chrome and footer behavior are deterministic by route area.
- [ ] Token-only style primitives are used in shared components.
- [ ] Responsive breakpoints and content widths use one contract.
- [ ] Auth and role gating are centralized by navigator grouping.
- [ ] Core customer/admin/delivery screens use consistent spacing and hierarchy.
