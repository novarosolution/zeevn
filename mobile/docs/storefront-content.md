# Storefront content guide (native app)

The premium app storefront (Home, Shop, Account, Wishlist, bottom navigation) reads **all of its copy,
festival looks and layout choices from one file**:

`mobile/src/content/storefrontContent.js`

Products, prices, categories, ratings, stock and delivery estimates always come from the API
(the admin console), never from this file.

> Scope: these screens are **native only** (iOS / Android). The website keeps its own screens and is
> not affected by anything in `src/components/store/`.

## What lives where

| You want to change… | Edit |
| --- | --- |
| Festival dates (Diwali, …) | `FESTIVAL_CALENDAR` |
| Switch the festival look without an app release | Admin console → Home view editor → **Festival look** |
| Force or disable a festival look in the build | `STORE_FESTIVAL_OVERRIDE` |
| Festival greeting, countdown, hero banner copy + colours, bento tiles, "Diwali Picks" | the theme object (`diwaliTheme`, `everydayTheme`) |
| Which Home sections show, and in what order | `STORE_HOME.layout` (a theme can bring its own `layout`) |
| Home header copy (location label, sign-in, greeting), search hints, delivery chip | `STORE_HEADER`, `STORE_FREE_DELIVERY` |
| Home section headings, eyebrows, "See all" labels | `STORE_SECTIONS` |
| Live order card, "How it's made" labels, support card, rating line | `STORE_HOME.tracker`, `.process`, `.compare`, `.reviews`, `.help` |
| "How it's made" steps and photos, "Ours vs ordinary" rows | **Admin console → Home view** (Process journey / Compare section) — not in the app build |
| Customer review quotes | `HOME_TESTIMONIALS` in `src/content/appContent.js` (shared with the website) |
| Certification badges ("Standards we cook to") | `CERTIFICATIONS_STRIP` in `src/content/certificationsContent.js` |
| Product tile copy (ADD, % OFF, Out of stock, spoken labels) | `STORE_CARD` |
| Category tabs under the search bar | `STORE_TABS` (+ `STORE_LINE_PAGES` for each tab's landing copy) |
| Promo carousel cards | `STORE_PROMOS` (admin hero slides override these when set) |
| "Why Zeevan" trust row | `STORE_TRUST` |
| Shop screen labels, sort/filter copy | `STORE_SHOP` |
| Account page (banner, tiles, list rows) | `STORE_PROFILE` |
| Wishlist copy | `STORE_WISHLIST` |
| Product detail copy (price, sizes, sections, reviews, buy dock) | `STORE_PRODUCT` |
| Bag + checkout copy (free-delivery bar, coupon, bill, address form, payment) | `STORE_CART` |
| Orders ("Order Again") and order-confirmed copy | `STORE_ORDERS` |
| Bottom navigation tabs and which screens light them up | `STORE_NAV` |

Colours and spacing are not in the content file. They live in `src/theme/storefront.js`
(light and dark palettes, radii, shadows, type).

## Festivals

The active look is picked in this order:

1. `festivalKey` on the server's home-view config, set from the admin console (see below). `""` (Auto) or a
   key the app does not know skips this step.
2. `STORE_FESTIVAL_OVERRIDE` — `"auto"` follows the calendar, `"everyday"` never shows a festival,
   or force `"diwali"`
3. The first window in `FESTIVAL_CALENDAR` that contains today's date
4. `everyday`

### Switch the festival from the admin console (no app release)

Admin console → **Home view editor** → **Festival look** → pick **Auto (follow calendar)**, **Everyday**
or **Diwali** → **Save changes**.

- The value is saved as `festivalKey` on the home-view config (`PUT /admin/home-view`) and served by the public
  `GET /home-view` that the app already calls. The server rejects anything except `""`, `everyday`
  and `diwali`. A value stored earlier for a look that has since been retired (Navratri) is read as Auto.
- **Auto** hands control back to `STORE_FESTIVAL_OVERRIDE` and the calendar below.
- Customers see the change when Home next refreshes. Pulling down on Home always asks the server; opening the
  app after it was closed for more than 30 minutes does too. Sooner than that the app first shows its saved
  copy of the home config.

Only *choosing* between the existing looks is remote. The themes and the calendar are part of the app build,
so changing their contents (copy, colours, dates) still needs a new app release (or an OTA update).

```js
export const FESTIVAL_CALENDAR = [
  { key: "diwali", from: "2026-10-10", to: "2026-11-12" }, // local dates, inclusive
];
```

**Update these dates every year.** After the window ends the app falls back to the everyday look by itself.
Diwali 2026: Dhanteras 6 Nov · Lakshmi Puja 8 Nov · Bhai Dooj 11 Nov, so the look opens four weeks ahead
for gifting and closes the day after Bhai Dooj.

### What a theme controls

A theme is plain data (see `diwaliTheme`) — changing it never needs a component edit:

| Field | What it does |
| --- | --- |
| `greeting` | The badge at the top of the header ("Shubh Deepavali", plus the user's first name when signed in). Leave `""` for no badge. |
| `occasion` | Optional countdown beside the badge: `{ date, days(n), tomorrow, today }` → "21 days to Diwali" → "Diwali is tomorrow" → "Happy Diwali". Disappears after the day. |
| `header` | `gradient` / `gradientDark` behind the greeting (end on the page colour) and `accent` (badge colour, light + dark). |
| `banner` | Hero card: `eyebrow`, `title`, `subtitle`, `cta`, `route` (where the button goes — Diwali opens Gift Sets) and `palette.light` / `palette.dark` (gradient, text, button and gold colours). |
| `tabBadges` | A small gold badge on a category tab, e.g. `{ gifts: "Diwali" }`. |
| `ornament` | Hero + header artwork: `"diya"` (fairy lights, rangoli, three flickering diyas, rising embers) or `"none"` (calm olive sprigs). |
| `layout` | Optional section order for this theme (see *Home layout*). |
| `bento` | The festive collection: heading (`eyebrow`, `title`, `action`, `route`), the tiles, and optional `colors` to recolour them. |
| `picks` | The tabbed "Picks" rail: `title`, `caption` and the pick tabs. |
| `shopBanner` | The strip at the top of the Shop screen. |

### Retire a festival (e.g. Navratri)

Navratri was retired this way; do the same for any look you no longer want:

1. Delete its theme object and its entry in `FESTIVAL_THEMES` and `FESTIVAL_CALENDAR` (`storefrontContent.js`).
2. Remove its key from `FESTIVAL_KEY_VALUES` (`backend/src/utils/festivalKey.js`) and its option from `festivalOptions`
   (`src/content/appContent.js`).
3. Nothing else: the app ignores a key it does not know, and the server reads a stored retired key as Auto.

### Add a new festival (e.g. Holi)

1. Copy `diwaliTheme`, rename it `holiTheme`, change `key`, `greeting`, `occasion`, `ornament`
   (`"diya"` or `"none"`), the `header` gradients, `banner` (copy + `palette`), `bento` and `picks`.
2. Register it: `export const FESTIVAL_THEMES = { everyday, diwali, holi: holiTheme }`.
3. Add its window to `FESTIVAL_CALENDAR`.
4. To make it selectable in the admin console, add its key to `FESTIVAL_KEY_VALUES` in
   `backend/src/utils/festivalKey.js` (server validation) and to `festivalOptions` in `ADMIN_HOME_VIEW_COPY`
   (`src/content/appContent.js`).

### Home layout

`STORE_HOME.layout` lists the sections of the Home **All** tab, top to bottom. Delete a key to hide a section,
move it to reorder:

```js
export const STORE_HOME = {
  layout: [
    "tracker", "banner", "promos", "categories", "bento", "bestsellers", "picks", "lines",
    "process", "compare", "reviews", "trust", "help", "footer",
  ],
};
```

| Key | Section |
| --- | --- |
| `tracker` | Live order card — only while a signed-in customer has an order in progress (status, hint, six-step progress, "Track") |
| `banner` | The festival (or brand) hero |
| `promos` | Rewards card (shows the customer's points when signed in) + admin hero slides + delivery card |
| `categories` | "Shop by category" grid |
| `bento` | Festive (or range) collection with its own heading |
| `bestsellers` | Best-rated products rail, top three wear a gold #1 / #2 / #3 medal (`STORE_SECTIONS.bestsellers.rankTop`) |
| `picks` | Tabbed festive picks |
| `lines` | One rail per range, headed by the range icon |
| `process` | "How it's made" — the Bilona journey as step cards |
| `compare` | "Ours vs ordinary" comparison table |
| `reviews` | Customer reviews, with a rating line computed from the catalog |
| `trust` | "Why Zeevan" promises and the certification badges |
| `help` | Closing "Need a hand?" support card |
| `footer` | The Zeevan wordmark sign-off — keep it last |

A festival theme can set its own `layout`; Diwali puts its gifting collections (`bento`, `picks`) above the
category grid. A section with nothing to show (no products, no matching picks, no active order) is skipped
automatically.

Sections rise into view once, as you scroll to them, and tiles inside them stagger in. With the phone's
**Reduce Motion** setting on, everything appears without movement and the ornaments hold still.

### Story sections managed in the admin console

`process` and `compare` read their content from the same Home-view config the website uses
(Admin console → **Home view** → *Process journey* and *Compare section*): headline, subtitle, every step or row,
and a photo per step. They follow each section's own **Enabled** switch and the "show home sections" switch.
Until the admin uploads a photo, a step shows a drawn icon on a soft colour wash; the churning step (`process-04`)
uses the bundled churn photo (`STORE_HOME.process.fallbackImages`). `STORE_HOME.process` / `.compare` only hold the
small labels around that content ("Step 3 of 6", icons, fallback names).

Reviews come from `HOME_TESTIMONIALS` (`appContent.js`); the quotes there are the website's placeholder set —
replace them with real customer words before you rely on them.

### How bento tiles and picks choose products

Each tile has a `match` rule; the app finds a real product for it from the live catalog:

- `{ lineKey: "ghee" }` — a product from that range (`ghee`, `tel`, `masala`, `honey`, `gifts`)
- `{ lineKey: "ghee", index: 1 }` — the second product from that range (avoids repeating the same photo)
- `{ lineKeys: ["tel", "masala"] }` — products from several ranges
- `{ featured: true }` — products flagged *special* in the admin, best rated first

A tile's `route` is passed straight to `navigation.navigate(name, params)`; for Shop use
`{ name: "Shop", params: { pill: "Ghee" } }` or `{ params: { category: "Gift Sets" } }`.
If the catalog has no product for a rule, the tile shows an icon instead of a photo.

## Icons

Everywhere in this file an icon is one of:

- `{ glyph: "ghee" }` — Zeevan's own range icons (`all`, `ghee`, `tel`, `masala`, `honey`, `gifts`)
- `{ ion: "home-outline" }` — any Ionicons name
- `{ mci: "cow" }` — any MaterialCommunityIcons name

## Wishlist

Hearts are saved **on the device** (AsyncStorage key `@zeevan_wishlist_v1`), not on the server. Saved products
are resolved against the live catalog, so a removed product simply disappears from the list.

## Product, bag, checkout and orders

The same storefront look carries through the buying flow. Each screen keeps its data and side effects
(API calls, cart, coupon, Razorpay / COD, address validation, order actions) and hands a plain props object to a
native-only component:

| Screen | Native component | Copy |
| --- | --- | --- |
| `ProductScreen` | `StoreProduct` (+ `StoreProductSkeleton`, `StoreProductNotFound`) | `STORE_PRODUCT` |
| `CartScreen` (bag **and** `CheckoutScreen`, which reuses it) | `StoreCart` — modes `bag`, `checkout`, `gate` (signed-out guest) | `STORE_CART` |
| `MyOrdersScreen` ("Order Again" tab) | `StoreOrders` | `STORE_ORDERS` |
| `OrderConfirmedScreen` | `StoreOrderConfirmed` | `STORE_ORDERS.confirmed` |

Things worth knowing:

- **Product page.** Section content (specs, ingredients, nutrition, storage, shipping, FAQ, story…) still comes from
  the product / `productPageContent.js`; `STORE_PRODUCT.sections` only names the accordions. A section is shown only
  when the product has content for it. The buy dock replaces the floating nav on this screen (same footprint and
  position), so the page ends with `STORE_NAV_HEIGHT` + safe-area padding.
- **Free-delivery bar.** `STORE_CART.freeDelivery.threshold` is the numeric twin of `STORE_FREE_DELIVERY`
  ("Free delivery over ₹1,499"). Change both together. The *actual* delivery fee still comes from the delivery-zone
  quote in `CartScreen`, shown in the bill.
- **Bag, checkout, orders and confirmation** all keep the floating nav; the pay bar docks just above it.
- **After checkout** the app shows a full-screen popup (hosted by `OrderCelebrationOverlay`, no floating nav) —
  on native it renders `StoreOrderPlaced`, which shares its hero with the confirmation route and reads
  `STORE_ORDERS.confirmed`.
- **Payment pending / live map.** `StoreOrders` embeds the existing `PaymentStatusBanner` and `OrderLiveMapCard`
  unchanged, so Razorpay resume and live tracking behave exactly as before.

## Files at a glance

```
mobile/src/
  content/storefrontContent.js     ← all copy + festival config (edit this)
  theme/storefront.js              ← colours, radii, shadows, type (light + dark)
  utils/storefront.js              ← catalog helpers (pricing, ranges, ETA, phone format)
  components/store/                ← the premium UI components (native only; entry.web.js stubs keep web untouched)
  components/store/FestiveBanner.js ← Home hero (copy + colours come from the theme)
  components/store/StoreHeader.js  ← Home header (location, rewards, festival badge, greeting, chips)
  components/store/StoreTracker.js ← live order card + `useActiveOrders`
  components/store/StoreProcess.js ← "How it's made" step carousel
  components/store/StoreCompare.js ← "Ours vs ordinary" table
  components/store/StoreReviews.js ← customer review carousel
  components/store/TrustFooter.js  ← "Why Zeevan", certification marquee, help card, footer
  components/store/HomeArt.js      ← animated artwork: diyas, fairy lights, rangoli, embers, sheen
  components/store/HomeMotion.js   ← scroll reveal / stagger / count-up helpers
  screens/WishlistScreen.js        ← wishlist route
  context/WishlistContext.js       ← wishlist storage
  components/store/StoreProduct.js ← product detail (native)
  components/store/StoreCart.js    ← bag / checkout / sign-in gate (native)
  components/store/StoreOrders.js  ← Your orders · Order Again (native)
  components/store/StoreOrderConfirmed.js ← order confirmed (native)
  components/store/ScreenHeader.js, StoreField.js, StoreBanner.js ← shared header, text field, status banner
```
