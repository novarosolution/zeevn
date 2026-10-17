# Delivery server ops checklist

## Env (Render / EC2)

Required:

- `MONGODB_URI` / `MONGO_URI` (whatever `src/config/db.js` reads)
- `JWT_SECRET`
- `PORT` (default `5001`)

Recommended:

- CORS origins include `https://zeevan.shop` and local web (`src/config/corsOrigins.js`)
- Geocoding key if address → lat/lng is enabled
- Razorpay keys for paid checkout

Live tracking uses Socket.io at path `/socket.io` on the same HTTP server.

## One-time setup

```bash
cd backend
node scripts/ensureDeliveryIndexes.js
node scripts/seed-delivery-zones.js
```

## Health

- `GET /health` — `{ ok, db, socket }`
- `GET /api/health` — same

## Key APIs

| Method | Path | Who |
|--------|------|-----|
| GET | `/delivery/check?postalCode=&city=&itemsTotal=` | Public |
| GET/POST/PATCH/DELETE | `/admin/delivery-zones` | Admin |
| GET | `/admin/delivery-partners` | Admin |
| PATCH | `/delivery/location` | Delivery partner (rate-limited) |
| GET | `/delivery/orders` | Delivery partner |

## Notes

- Checkout rejects unserviceable pincodes (`DELIVERY_NOT_SERVICEABLE`).
- Fee comes from the matched zone; `freeAbove` waives fee.
- Assigning a partner validates zone `partnerIds` when set.
- Status → `ready_for_pickup` / `shipped` / `out_for_delivery` auto-assigns least-loaded partner if none set.
