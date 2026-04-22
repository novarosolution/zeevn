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
- `MONGO_URI`
- `JWT_SECRET`

4. Start server:

```bash
npm run dev
```

## APIs

- `GET /products`
- `POST /users/register`
- `POST /users/login`
- `POST /orders` (Protected: requires `Authorization: Bearer <token>`)
- `GET /admin/products` (Admin)
- `POST /admin/products` (Admin)
- `PUT /admin/products/:id` (Admin)
- `DELETE /admin/products/:id` (Admin)
- `GET /admin/orders` (Admin)
- `PATCH /admin/orders/:id/status` (Admin)
- `GET /admin/users` (Admin)
- `PATCH /admin/users/:id/role` (Admin)

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
