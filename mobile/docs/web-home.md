# Website Home (web only)

The website's Home (`KankregHomeScreen`, web branch) is a stack of full-width sections. The native app has its own
Home (`components/store/*`, see `storefront-content.md`); nothing here touches it.

## Design language

| Piece | Where |
| --- | --- |
| Gold / olive accents, radii, shadows, gradients, heading scale | `src/theme/webPremium.js` (`WP`, `webTitleSize`, `webHeroSize`) |
| Base colours (page, cards, ink) | `src/theme/kankregWeb.js` → `KANKREG_PALETTE` (the site palette; `WP.paper` / `WP.card` follow it) |
| Hover / press CSS (gold-sheen buttons, tile lift, link arrow, hero progress bar) | `src/utils/webPremiumCss.js` — opt in with `className="zv-btn"`, `zv-tile`, `zv-tile-img`, `zv-link`, `zv-glass`; reduced-motion switches it all off |
| Eyebrow, serif title, section head, pill link | `src/components/home/webPremiumParts.js` (`WebEyebrow`, `WebSectionTitle`, `WebSectionHead`, `WebPillLink`) |
| Labels the redesign added | `src/content/webHomeContent.js` (`WEB_HOME_PREMIUM`) |
| Headings / body fonts | Fraunces + Hanken Grotesk, loaded from Google Fonts by `src/theme/webFonts.web.js` |

Gold is for accents only (eyebrows, sale pills, the hero button); the brand green is the primary action colour; the
quality band is the one dark break in an otherwise light page.

## Sections, top to bottom (desktop ≥ 1080 px)

| Section | File | Notes |
| --- | --- | --- |
| Hero | `WebPremiumHero.web.js` | Full-bleed slider from the admin hero slides (packaging slide first). Gold eyebrow, big headline, **Shop** (goes to the slide's range) + **Our story** (About), `01 / 04` counter, progress segments, arrows, and a frosted trust bar from `HOME_TRUST_STRIP`. Auto-advances every 6.5 s, pauses on hover, honours Reduce Motion. Phone web gets a compact 250 px band without the bar. |
| Intro + line tiles | `WebHomeIntroBand.js` | Welcome headline and four photo tiles (ghee, tel, masala, honey) from `ZEEVAN_PRODUCT_LINES` + `homeLineImages`. Off with `HOME_SCREEN_UI.web.showIntroBand: false`. |
| Promise band | `WebHomePromiseBand.web.js` | Copy in `content/homePromiseContent.js`. `showPromiseBand`. |
| Bestsellers | `KankregHomeScreen.js` + `HomeCatalogProductViews.js` | Header = `WebSectionHead`; if the admin's eyebrow equals the title it falls back to "Most loved". Products from the catalog. |
| Coming soon shelf | `HomeComingSoonStrip.js` | Slim cream-and-gold notice listing products marked *coming soon*. |
| Why Zeevan | `WebWhyChooseSection.web.js` | Copy in `content/whyChooseContent.js`. `showWhyChoose`. |
| Native ingredients | `WebNativeIngredientsSection.web.js` | Copy in `content/nativeIngredientsContent.js`. `showNativeIngredients`. |
| Products in focus | `WebLineFocusSection.web.js` | A four-up row per range; a short row (e.g. 3 products) is completed by an "Explore all …" photo tile. Phone web uses the horizontal rail. |
| Quality | `WebQualityAssuranceSection.web.js` | Deep-olive band, four cards. Copy in `content/qualityAssuranceContent.js`. `showQualityAssurance`. |
| Testimonials | `HomeTestimonials.js` | A grid from 900 px up, a one-card slider below. Copy in `appContent` → `HOME_TESTIMONIALS`. |
| Certifications | `WebCertificationsStrip.web.js` | Badges are muted until hovered. `showCertificationsStrip`. |

Spacing between the main blocks is the `72` gap passed to `KankregPageWrap` in `KankregHomeScreen.js`.

## Product tile (Home, Shop, rails)

`HomeEditorialProductCard` in `HomeCatalogProductViews.js`: a cream photo stage with a gold "% OFF" pill, the brand
badge and a rating chip on it; then category · size, the name in the serif face, price with the struck MRP, and a green
**Add to bag** pill that becomes a **− qty +** stepper. States: *sold out* (dimmed photo, grey pill), *coming soon*
(blurred photo under an olive veil, gold pill + launch note, outlined button). A tile narrower than 200 px (the Shop
grid beside its filters) switches to the compact type and a one-word **Add**.

## Checking it

- Run the web app against a local API (`expo start --web --no-dev --port <p>` with `EXPO_PUBLIC_API_URL` set — see the
  note in the project memory about `.env` overriding it in dev bundles).
- The Google Fonts URL contains `9..144`; some sandboxed browsers block URLs containing `..`, so headings fall back to
  Times there. Serve the TTFs from `node_modules/@expo-google-fonts/*` locally and add them with `new FontFace(...)`
  to see the real typography.
- Widths worth looking at: 1440, 1120, 768 (phone layout from 1079 px down) and 390; light and dark.
