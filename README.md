# Zeevan

Zeevan is a heritage pantry e-commerce app for discovering staples, managing delivery addresses, checking out with Razorpay, and tracking orders—on **iOS**, **Android**, and **web** from a single Expo (React Native) codebase. An Express + MongoDB API powers auth, catalog, cart sync, payments, admin ops, and live delivery features.

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| **Client** | Expo SDK 53, React Native 0.79, React 19 | Cross-platform UI (native + web) |
| **Navigation** | React Navigation 7 (native stack) | Screen routing, deep links |
| **Styling** | Design tokens (`src/theme/tokens.js`), `useTheme()` | Navy + brass palette, locked spacing/type |
| **State** | React Context | Auth, cart, wishlist, cart drawer, theme |
| **Persistence** | AsyncStorage, Secure Store | Session, theme mode, drafts |
| **Maps** | react-native-maps, Leaflet (web) | Delivery tracking |
| **Payments** | Razorpay (client key + server verify/webhook) | Checkout |
| **API** | Express 5, Mongoose 8 | REST backend |
| **Database** | MongoDB | Users, products, orders, analytics |
| **Media** | Cloudinary | Product images, avatars |
| **Email** | Nodemailer (SMTP) | Verify email, password reset |
| **Auth** | JWT (access + refresh), bcrypt | Login, sessions, roles |
| **Build** | EAS (optional), `expo export --platform web` | Native builds, static web |
| **Quality** | ESLint, `check:tokens`, Husky pre-commit | Lint + design-token drift warnings |

## Quick start

### Prerequisites

- Node.js 20+ and npm
- MongoDB (local or Atlas)
- [Expo Go](https://expo.dev/go) or simulators for mobile; Chrome for web

### 1. Clone and install

```bash
git clone <repo-url> zeevan
cd zeevan
npm install
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit both files—see [Environment](#environment). Minimum for local dev:

- `MONGO_URI` in `backend/.env`
- `JWT_SECRET` in `backend/.env`
- `EXPO_PUBLIC_API_URL=http://127.0.0.1:5001` in root `.env`

### 3. Start the API

```bash
cd backend
npm run dev
```

API listens on **http://127.0.0.1:5001** by default. Routes are mounted at `/` and `/api/*` (e.g. `/products` and `/api/products`).

### 4. Start the app

In a second terminal, from the repo root:

```bash
npm run start
```

Then press **`w`** for web, **`i`** for iOS simulator, or **`a`** for Android emulator.

Or run web directly:

```bash
npm run web
```

Restart Expo after changing any `EXPO_PUBLIC_*` variable.

### First admin user

The **first registered account** is promoted to admin automatically. Use that account to access admin screens.

### API URL troubleshooting

If you see “Route not found” or network errors:

1. Confirm the backend is running (`npm run dev` in `backend/`).
2. Set `EXPO_PUBLIC_API_URL=http://127.0.0.1:5001` (no trailing slash unless your deploy uses a path prefix).
3. For production web builds, set the same variable to your public API origin before `npm run export:web`.

## Project structure

### Frontend (`src/`)

| Path | Purpose |
| --- | --- |
| `App.js` | Providers, fonts, deep linking, startup shell |
| `app.config.js` | Expo config; injects `EXPO_PUBLIC_*` into `extra.publicConfig` |
| `src/navigation/` | `AppNavigator`, account routes, stack groups |
| `src/screens/` | Route screens (home, PDP, cart, auth, account, admin, editorial) |
| `src/components/` | UI primitives (`ui/`), product cards, cart drawer, web header |
| `src/context/` | Auth, Cart, Wishlist, CartDrawer, Theme |
| `src/services/` | API clients (`apiBase.js`, orders, users, payments) |
| `src/theme/` | `tokens.js` (canonical design tokens), `customerAlchemy.js`, web chrome |
| `src/hooks/` | Auth submit, debounced search, keyboard shortcuts |
| `src/content/` | Copy strings (`appContent.js`) |
| `src/constants/` | Runtime config, auth feature flags |
| `scripts/` | `check-tokens.js`, web export post-process |

### Backend (`backend/`)

| Path | Purpose |
| --- | --- |
| `backend/server.js` | Express app, CORS, route mounting, port |
| `backend/src/config/` | MongoDB, Cloudinary |
| `backend/src/controllers/` | Users, products, orders, admin, analytics, home view |
| `backend/src/routes/` | REST route definitions |
| `backend/src/models/` | Mongoose schemas |
| `backend/src/middleware/` | JWT auth, errors |
| `backend/src/services/` | Razorpay, Google Directions |
| `backend/src/utils/` | JWT, email, mail transport |

### Docs

| Path | Purpose |
| --- | --- |
| `docs/architecture.md` | System diagram and context overview |
| `docs/audit-2026-05.md` | Codebase audit (May 2026) |
| `docs/ui-migration.md` | Premium → canonical UI checklist |
| `docs/token-violations-baseline.txt` | Design-token drift baseline |

## Environment

Copy the examples—**never commit real secrets**.

| File | Description |
| --- | --- |
| [`.env.example`](./.env.example) | Expo app / build-time public config (`EXPO_PUBLIC_*`, EAS) |
| [`backend/.env.example`](./backend/.env.example) | API server secrets and integrations |

The backend also reads a root `.env` if present (shared monorepo setup).

## Scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start Expo dev server (all platforms) |
| `npm run web` | Start Expo for web only |
| `npm run export:web` | Production static web build + post-process |
| `npm run check:tokens` | Audit off-palette colors and off-scale spacing (warn baseline) |
| `npm test` | Unit tests with coverage + design-token audit |
| `npm run test:unit` | Jest unit tests (cart, coupons, auth, orders) + HTML/LCOV coverage in `coverage/` |
| `npm run test:e2e` | Playwright web E2E (auth, checkout, smoke) |
| `npm run test:e2e:headed` | E2E with visible browser |
| `npm run lint` | ESLint via Expo |
| `cd backend && npm run dev` | API with nodemon |

Other useful scripts: `npm run doctor`, `npm run deploy:check`, `npm run build:android`, `npm run build:ios`.

### E2E tests (Playwright)

1. Start MongoDB, API (`cd backend && npm run dev`), and web (`npm run web` or `npx serve -s dist -l 8081` after `npm run export:web`).
2. Seed a fixture product: `node backend/scripts/seed-e2e.js`
3. Set `EXPO_PUBLIC_API_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `EXPO_PUBLIC_RAZORPAY_KEY_ID` for checkout tests.
4. Run: `npx playwright install && npm run test:e2e`

See [docs/smoke-test.md](./docs/smoke-test.md) for the manual checklist; `tests/e2e/` automates the critical paths.

### Unit tests (Jest)

Money-critical paths: cart line pricing (`src/utils/productCart.js`), product normalization (`src/services/normalizeProduct.js`), coupon math (`backend/src/utils/coupon.js`), auth session (`src/context/AuthContext.js`), and order creation (`backend/src/controllers/orderController.js`).

```bash
npm run test:unit
open coverage/lcov-report/index.html   # optional HTML report
```

CI uploads the `coverage/` artifact from [`.github/workflows/unit-tests.yml`](./.github/workflows/unit-tests.yml).

## Contributing

- **Branches:** `feat/`, `fix/`, `chore/` (e.g. `feat/account-wishlist-sync`)
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- **Pull requests:** Use the template at [`.github/pull_request_template.md`](./.github/pull_request_template.md)
- **Design tokens:** Prefer `useTheme()` → `{ c, S, R, SH, T }`; run `npm run check:tokens` before pushing
- **UI imports:** Prefer `@/components/ui` over deprecated `Premium*` components ([`docs/ui-migration.md`](./docs/ui-migration.md))

## Architecture decisions

High-level system design, context boundaries, and links to audits live in **[`docs/architecture.md`](./docs/architecture.md)**.

## New developer: first commit in ~30 minutes

1. **Clone** the repo and run `npm install` (root + `backend/`).
2. **Copy env files:** `cp .env.example .env` and `cp backend/.env.example backend/.env`.
3. **Set minimum backend vars:** `MONGO_URI`, `JWT_SECRET` (use a long random string).
4. **Set minimum app vars:** `EXPO_PUBLIC_API_URL=http://127.0.0.1:5001`.
5. **Start MongoDB** locally or paste an Atlas URI into `MONGO_URI`.
6. **Terminal A:** `cd backend && npm run dev` — wait for “MongoDB connected”.
7. **Terminal B:** `npm run web` — open the URL Expo prints (usually `http://localhost:8081`).
8. **Register** a test user (first user = admin).
9. **Smoke checks:** browse home → open a product → add to cart → run `npm test` and `npm run lint`.
10. **Branch:** `git checkout -b chore/onboarding-smoke-test`, make a tiny doc fix if you like, commit with `docs: note local setup verified`, push, open a PR using the template.

You do not need Razorpay, SMTP, or Cloudinary for basic browsing; those unlock checkout, email flows, and image uploads respectively.
