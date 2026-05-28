# Pre-deploy smoke test (~15 minutes)

Run this checklist **before every production deploy** (or after any change to auth, cart, checkout, or payments). Target: **web** on staging with **Razorpay test keys** and **SMTP** configured (or dev `devLink` for email in non-production).

**Sign-off:** Tester name · Date · Build/commit · Environment URL · Pass / Fail

| Prerequisite | Check |
| --- | --- |
| API running (`cd backend && npm run dev`) | ☐ |
| App running (`npm run web` or staging URL) | ☐ |
| `EXPO_PUBLIC_API_URL` points at that API | ☐ |
| `EXPO_PUBLIC_RAZORPAY_KEY_ID` = Razorpay **test** key | ☐ |
| Fresh test email inbox (or devLink toast if SMTP off) | ☐ |

**Web paths** below match Expo linking (`App.js`). On native, use the same screens via navigation (no URL bar).

---

## Auth flow (5 min)

- [ ] Open `/register`
- [ ] Register with a new email + strong password
- [ ] Receive verification email within 60s  
  _If SMTP is off in dev: use `devLink` from API response / toast instead of inbox._
- [ ] Click verification link → lands on `/verify-email`
- [ ] Verified state shown, redirects to `/home` (or Home screen on native)
- [ ] Sign out
- [ ] Sign in with the new credentials (`/login`)
- [ ] Refresh page → session persists
- [ ] `/forgot-password` sends email (or shows `devLink` in non-prod)
- [ ] Reset link works (`/reset-password?token=…`)

---

## Shopping flow (5 min)

- [ ] Home loads in < 3s (`/` or Home)
- [ ] Add product to cart from home
- [ ] Toast confirms add
- [ ] Cart drawer (web) or cart screen (mobile) reflects the add
- [ ] Quantity stepper works
- [ ] Remove item works
- [ ] Wishlist heart works on a product card
- [ ] Pincode delivery check on a product page works (`/product/:productId`)

---

## Checkout flow (5 min)

- [ ] Cart → Checkout (`/cart` then proceed to checkout)
- [ ] Address form auto-fills city/state from pincode
- [ ] **Razorpay TEST MODE:** pay with the standard test card (`4111 1111 1111 1111`, any future expiry, any CVV)
- [ ] Order success page shows order ID
- [ ] Order appears in **Account → Orders** (`/profile` → Orders on web)
- [ ] Order detail shows correct items, address, total
- [ ] Invoice download works  
  _If still on placeholder UI, confirm the button responds and note in sign-off._

---

## Failures

If any box fails, **do not deploy**. File an issue with: step number, URL, screenshot, browser/device, and API/network errors from devtools.

## Automated checks (before deploy)

```bash
npm run check:contrast    # WCAG AA token pairs
npm run test:a11y         # axe on 6 routes (needs dist served)
npm run measure:final     # Lighthouse desktop + mobile + bundle table
npm run test:unit && npm run lint
```

Serve static web build for a11y/Lighthouse:

```bash
npm run export:web
npx serve dist -l 8080
# another terminal:
A11Y_BASE_URL=http://127.0.0.1:8080 npm run test:a11y
LHCI_BASE_URL=http://127.0.0.1:8080 npm run measure:final
```

## Keyboard & screen reader (manual)

- [ ] Tab through header → main → footer on Home, Shop, Login (focus visible)
- [ ] Login: email → password → submit without mouse; errors announced
- [ ] Cart drawer: Esc closes; trap focus while open (web)
- [ ] Checkout: address fields labeled; Razorpay iframe reachable
- [ ] VoiceOver / NVDA: Login headings read as h1; cart “Add to bag” button name includes product

## Related docs

- [README](../README.md) — local setup
- [architecture.md](./architecture.md) — system overview
- [decisions/0001-oauth.md](./decisions/0001-oauth.md) — email-only sign-in (no Google/Apple)
