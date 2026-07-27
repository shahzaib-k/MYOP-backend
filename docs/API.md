# Make Your Own Platter — API Reference

Base URL: `http://localhost:5000`
All endpoints live under `/api` and return:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": {} }
```

Protected endpoints need a bearer token:

```
Authorization: Bearer <token>
```

Roles: `customer` (mobile app) and `admin` (admin panel).

---

## Auth — `/api/auth`

| Method | Endpoint | Access | Body |
| --- | --- | --- | --- |
| POST | `/register` | Public | `name`, `email`, `password` (min 6), `phone?` |
| POST | `/login` | Public | `email`, `password` |
| GET | `/me` | Any logged-in user | — |
| PUT | `/me` | Any logged-in user | `name?`, `phone?` |
| PUT | `/me/password` | Any logged-in user | `currentPassword`, `newPassword` |

`register` and `login` return `{ user, token }`. Registration always creates a
`customer`; admins are created from `.env` on boot or by another admin.

---

## Categories — `/api/categories`

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/` | Public | `?activeOnly=true` hides disabled categories |
| GET | `/:id` | Public | |
| POST | `/` | Admin | `name` (unique), `description?`, `image?`, `isActive?` |
| PUT | `/:id` | Admin | any of the above fields |
| DELETE | `/:id` | Admin | Blocked (409) while food items still use the category |

---

## Foods — `/api/foods`

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/` | Public | |
| GET | `/category/:category` | Public | category **name** |
| POST | `/` | Admin | `name`, `price`, `category`, `image`, `description` |
| PUT | `/:id` | Admin | partial update |
| DELETE | `/:id` | Admin | |

`category` must match an existing, active category or the request fails with 400.

---

## Orders — `/api/orders` (all endpoints require login)

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/` | Customer/Admin | `items: [{ foodId, quantity }]`, `budget?`, `totalPrice?` |
| GET | `/` | Owner | own orders only; `?status=&search=&page=&limit=&sort=` |
| GET | `/:id` | Owner or admin | |
| PUT | `/:id/cancel` | Owner or admin | only from `pending` or `preparing` |
| DELETE | `/:id` | Admin | |

Server-side rules on create:

- Item names, prices and categories are read from the `foods` node — client prices are ignored.
- `totalPrice` is recalculated; if the client sends a different value the order is rejected.
- `budget` (optional) is stored; an order above it is rejected with `budget` and `totalPrice` in `errors`.
- `userId` comes from the token and `status` is always `pending`.

Status flow: `pending → preparing → completed`, with `cancelled` reachable from
`pending` or `preparing`. Every change is appended to `statusHistory`.

---

## Recommendations — `/api/recommendations` (public)

### `POST /platter`

```json
{ "budget": 500, "categories": ["Burgers", "Drinks"], "maxItems": 6 }
```

Returns a suggested platter that spends as much of the budget as possible while
keeping at most two items per category:

```json
{ "items": [...], "totalPrice": 470, "budget": 500, "remainingBudget": 30 }
```

### `POST /review`

```json
{ "budget": 500, "items": [{ "foodId": "-Nxyz", "quantity": 2 }] }
```

Recalculates the platter from live prices and returns
`totalPrice`, `remainingBudget`, `withinBudget`, `amountOverBudget`,
`addOns` (items that fit the leftover budget) and `alternatives`
(cheaper same-category swaps with `savings`, when over budget).

---

## Admin — `/api/admin` (admin only)

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/dashboard` | totals, orders by status, revenue, top selling items, recent orders |
| GET | `/orders` | `?status=&search=&userId=&startDate=&endDate=&page=&limit=&sort=` |
| GET | `/orders/:id` | |
| PUT | `/orders/:id/status` | `{ "status": "preparing" }`, transition-checked |
| GET | `/users` | `?role=customer\|admin` |
| POST | `/users` | `name`, `email`, `password`, `role?` — used to create other admins |
| PUT | `/users/:id/status` | `{ "isActive": false }`; cannot target your own account |

`search` matches order id, user id, customer name/email and food item names.
Order lists are paginated: `data.pagination = { page, limit, totalItems, totalPages }`.

---

## Environment

```
PORT=5000
FIREBASE_DATABASE_URL=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@platter.com
ADMIN_PASSWORD=...
```

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, that admin account is created on
server start when it does not already exist.

## Firebase indexes

Add these to your Realtime Database rules to avoid unindexed-query warnings:

```json
{
  "rules": {
    "users": { ".indexOn": ["email"] },
    "foods": { ".indexOn": ["category"] }
  }
}
```
