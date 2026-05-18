# Observability & graceful failures

Errors should be **visible** (banner, fallback UI, Sentry) and **recoverable** (retry, offline queue) — not silent crashes.

## Client

### Sentry

| Item | Detail |
|------|--------|
| SDK | `@sentry/react-native` (iOS/Android), `@sentry/react` (web via `sentry.web.js`) |
| Init | `index.js` → `initSentry()` |
| Tags | `appVersion`, `platform`, `route`, `userIdHash` (hashed id/email) |
| Events | Unhandled errors (boundaries), network failures, slow renders (>400ms layout) |

Env (root `.env`):

```bash
EXPO_PUBLIC_SENTRY_DSN=https://…@sentry.io/…
EXPO_PUBLIC_SENTRY_ENVIRONMENT=production
```

### Error boundaries

| Boundary | File | Scope |
|----------|------|--------|
| App | `src/components/errors/AppErrorBoundary.js` | Whole tree — “Something went wrong” + **Try again** |
| Route | `src/components/errors/RouteErrorBoundary.js` | Each screen via `withPageTransition` in `AppNavigator.js` |
| UI | `src/components/errors/ErrorFallback.js` | Design-system `Button` + copy from `OBSERVABILITY_UI` |

### Offline & write queue

| Piece | File |
|-------|------|
| Connectivity | `src/context/ConnectivityContext.js` + `ConnectivityBridge.js` |
| Banner | `src/components/errors/OfflineBanner.js` |
| Queue | `src/utils/criticalWriteQueue.js` — cart sync + address save |
| Replay | On reconnect, `flushCriticalWriteQueue` runs automatically |

### API client

`src/services/apiClient.js`:

- Propagates `X-Request-Id` from responses
- `captureNetworkFailure` on fetch errors
- 5xx → Sentry + `err.requestId` on thrown `Error`

### Source maps (CI)

After `export:web`, with `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`:

```bash
npm run sentry:upload-sourcemaps
```

## Backend

### Structured logging (pino)

- Logger: `backend/src/utils/logger.js`
- Request log: `backend/src/middleware/requestLogger.js` — JSON in prod, pretty in dev
- 4xx → `warn` with redacted body; 5xx → `error` + stack + redacted body (`redactPii.js`)

### Request ID

- Middleware: `backend/src/middleware/requestId.js`
- Header: `X-Request-Id` on every response (client may echo on retries)

### Health

```http
GET /health
GET /api/health
```

```json
{
  "status": "ok",
  "mongo": "up",
  "smtp": "configured",
  "razorpay": "configured",
  "timestamp": "…"
}
```

Returns **503** when Mongo is not connected.

### Sentry (backend)

- `backend/src/observability/sentry.js` — init from `SENTRY_DSN`
- Wired in `errorMiddleware.js` for unhandled 5xx

### Razorpay webhooks

| Concern | Implementation |
|---------|----------------|
| Raw body | Mounted on `server.js` **before** `express.json()` |
| Idempotency | `WebhookEvent` model + `dedupeKey` — duplicate → `200 duplicate` |
| Failures | Status `failed` in DB; `startWebhookReplayLoop()` retries every 60s |
| Handler | `backend/src/controllers/orders/webhookHandler.js` |

## Verify locally

```bash
# API health
curl -s http://127.0.0.1:5001/health | jq

# Backend smoke (non-prod, ENABLE_TEST_ROUTES)
curl -s http://127.0.0.1:5001/test/observability-smoke | jq

# Client: set EXPO_PUBLIC_SENTRY_DSN, trigger a screen error, or call captureMessage in dev
```

## First errors in Sentry

1. Create a Sentry project (React Native + Node).
2. Set DSNs in `.env` and `backend/.env`.
3. Run smoke: `curl …/test/observability-smoke` → event **Zeevan observability smoke test** with tag `smoke:true`.
4. On client, temporarily throw in a screen or use boundary retry after a forced error.

Without DSN, dev console shows `[sentry] captureException (no DSN):` — safe for local work.

## Files touched (summary)

### Client (new/updated)

- `index.js`, `App.js`, `src/navigation/AppNavigator.js`
- `src/observability/*`, `src/components/errors/*`
- `src/context/ConnectivityContext.js`, `ConnectivityBridge.js`
- `src/utils/criticalWriteQueue.js`, `src/services/apiClient.js`
- `src/context/CartContext.js`, `src/utils/savedAddresses.js`, `src/context/AuthContext.js`
- `src/hooks/useSlowRenderProbe.js`, `src/components/motion/PageTransition.js`
- `src/content/appContent.js` (`OBSERVABILITY_UI`)
- `scripts/sentry-upload-sourcemaps.js`, `.env.example`

### Backend (new/updated)

- `backend/server.js`
- `backend/src/utils/logger.js`, `redactPii.js`
- `backend/src/middleware/requestId.js`, `requestLogger.js`, `errorMiddleware.js`
- `backend/src/routes/healthRoutes.js`, `testRoutes.js` (smoke)
- `backend/src/observability/sentry.js`
- `backend/src/models/WebhookEvent.js`
- `backend/src/services/webhookReplayService.js`
- `backend/src/controllers/orders/webhookHandler.js`, `payment.js`
- `backend/src/routes/orderRoutes.js`
- `backend/.env.example`, `render.yaml`
