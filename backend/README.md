# E-commerce Backend (Express + MongoDB)

Beginner-friendly backend for an e-commerce app using Express.js, Mongoose, and JWT authentication.

## Folder Structure

```txt
backend
├── server.js
├── .env.example
└── src
    ├── config
    │   └── db.js
    ├── controllers
    │   ├── orderController.js
    │   ├── productController.js
    │   └── userController.js
    ├── middleware
    │   ├── authMiddleware.js
    │   └── errorMiddleware.js
    ├── models
    │   ├── Order.js
    │   ├── Product.js
    │   └── User.js
    ├── routes
    │   ├── orderRoutes.js
    │   ├── productRoutes.js
    │   └── userRoutes.js
    └── utils
        └── generateToken.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Update `.env` values:
- `PORT` (default set to `5001`)
- Mongo connection string: `MONGO_URI` (preferred), or `MONGODB_URI`, `DATABASE_URL`, `DB_URI`
- Optional DB name override: `MONGO_DB_NAME` or `DB_NAME`
- Example local DB: `mongodb://127.0.0.1:27017/zeevan`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID` — public key id from the Razorpay dashboard (test or live).
- `RAZORPAY_KEY_SECRET` — secret key, **server-only**.
- `RAZORPAY_WEBHOOK_SECRET` — webhook secret you set when creating the
  webhook in the Razorpay dashboard. Point the webhook URL at
  `https://<your-host>/orders/razorpay-webhook` (or `/api/orders/razorpay-webhook`)
  and subscribe to `payment.captured`, `payment.failed`, and `order.paid`.

> The same `RAZORPAY_KEY_ID` value should be exposed to the mobile/web client
> as `EXPO_PUBLIC_RAZORPAY_KEY_ID` so the SDK can open Checkout. The
> `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must NEVER ship to the
> client.

4. Start server:

```bash
npm run dev
```

## APIs

- `GET /products`
- `POST /users/register`
- `POST /users/login`
- `POST /orders` (Protected: requires `Authorization: Bearer <token>`)
- `POST /orders/:id/verify-payment` (Protected) — Razorpay handler payload.
- `POST /orders/:id/cancel-pending` (Protected) — abandon an unpaid order.
- `POST /orders/razorpay-webhook` (Public) — Razorpay webhook receiver,
  signed with `RAZORPAY_WEBHOOK_SECRET`.
- `GET /admin/products` (Admin)
- `POST /admin/products` (Admin)
- `PUT /admin/products/:id` (Admin)
- `DELETE /admin/products/:id` (Admin)
- `GET /admin/orders` (Admin)
- `PATCH /admin/orders/:id/status` (Admin)
- `GET /admin/users` (Admin)
- `PATCH /admin/users/:id/role` (Admin)
- `GET /admin/analytics` (Admin) — optional query filters:
  - No query: legacy behaviour (all-time metrics plus rolling 7/14-day chart trends).
  - `preset`: `today`, `7d`, `30d`, `90d`, `1y`, `mtd`, `ytd`, `all`, or combine `from`/`to` for a custom range.
  - `from`, `to`: `YYYY-MM-DD` (UTC day boundaries) — both required together.
  - `bucket`: `day` or `month` for the returned `trends.rangeSeries` (defaults to `month` when the span exceeds ~120 days).

### Admin note

- The very first registered user is automatically created as admin.

### Sample request bodies

Register:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

Login:

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

Create order:

```json
{
  "products": [
    { "product": "PRODUCT_ID_1", "quantity": 2 },
    { "product": "PRODUCT_ID_2", "quantity": 1 }
  ]
}
```
