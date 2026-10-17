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
| Festival dates (Navratri, Diwali, …) | `FESTIVAL_CALENDAR` |
| Switch the festival look without an app release | Admin console → Home view editor → **Festival look** |
| Force or disable a festival look in the build | `STORE_FESTIVAL_OVERRIDE` |
| Festival greeting, banner text, bento tiles, "Festive Picks" | the theme object (`navratriTheme`, `diwaliTheme`, `everydayTheme`) |
| Home header copy, search hints, delivery chip | `STORE_HEADER`, `STORE_FREE_DELIVERY` |
| Category tabs under the search bar | `STORE_TABS` (+ `STORE_LINE_PAGES` for each tab's landing copy) |
| Promo carousel cards | `STORE_PROMOS` (admin hero slides override these when set) |
| "Why Zeevan" trust row | `STORE_TRUST` |
| Shop screen labels, sort/filter copy | `STORE_SHOP` |
| Account page (banner, tiles, list rows) | `STORE_PROFILE` |
| Wishlist copy | `STORE_WISHLIST` |
| Bottom navigation tabs and which screens light them up | `STORE_NAV` |

Colours and spacing are not in the content file. They live in `src/theme/storefront.js`
(light and dark palettes, radii, shadows, type).

## Festivals

The active look is picked in this order:

1. `festivalKey` on the server's home-view config, set from the admin console (see below). `""` (Auto) or a
   key the app does not know skips this step.
2. `STORE_FESTIVAL_OVERRIDE` — `"auto"` follows the calendar, `"everyday"` never shows a festival,
   or force `"navratri"` / `"diwali"`
3. The first window in `FESTIVAL_CALENDAR` that contains today's date
4. `everyday`

### Switch the festival from the admin console (no app release)

Admin console → **Home view editor** → **Festival look** → pick **Auto (follow calendar)**, **Everyday**,
**Navratri** or **Diwali** → **Save changes**.

- The value is saved as `festivalKey` on the home-view config (`PUT /admin/home-view`) and served by the public
  `GET /home-view` that the app already calls. The server rejects anything except `""`, `everyday`, `navratri`
  and `diwali`.
- **Auto** hands control back to `STORE_FESTIVAL_OVERRIDE` and the calendar below.
- Customers see the change when Home next refreshes. Pulling down on Home always asks the server; opening the
  app after it was closed for more than 30 minutes does too. Sooner than that the app first shows its saved
  copy of the home config.

Only *choosing* between the existing looks is remote. The themes and the calendar are part of the app build,
so changing their contents (copy, colours, dates) still needs a new app release (or an OTA update).

```js
export const FESTIVAL_CALENDAR = [
  { key: "navratri", from: "2026-10-10", to: "2026-10-20" }, // local dates, inclusive
  { key: "diwali", from: "2026-10-28", to: "2026-11-12" },
];
```

**Update these dates every year.** After the window ends the app falls back to the everyday look by itself.

### Add a new festival (e.g. Holi)

1. Copy `navratriTheme`, rename it `holiTheme`, change `key`, `greeting`, `ornament`
   (`"marigold"`, `"diya"` or `"none"`), the `header` gradients, `banner`, `bento` and `picks`.
2. Register it: `export const FESTIVAL_THEMES = { everyday, navratri, diwali, holi: holiTheme }`.
3. Add its window to `FESTIVAL_CALENDAR`.
4. To make it selectable in the admin console, add its key to `FESTIVAL_KEY_VALUES` in
   `backend/src/utils/festivalKey.js` (server validation) and to `festivalOptions` in `ADMIN_HOME_VIEW_COPY`
   (`src/content/appContent.js`).

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

## Files at a glance

```
mobile/src/
  content/storefrontContent.js     ← all copy + festival config (edit this)
  theme/storefront.js              ← colours, radii, shadows, type (light + dark)
  utils/storefront.js              ← catalog helpers (pricing, ranges, ETA, phone format)
  components/store/                ← the premium UI components (native only; entry.web.js stubs keep web untouched)
  screens/WishlistScreen.js        ← wishlist route
  context/WishlistContext.js       ← wishlist storage
```
