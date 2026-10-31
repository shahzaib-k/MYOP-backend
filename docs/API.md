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
| POST | `/me/push-token` | Any logged-in user | `token` (an Expo push token) |

`register` and `login` return `{ user, token }`. Registration always creates a
`customer`; admins are created from `.env` on boot or by another admin.

`POST /me/push-token` registers the calling device for push notifications —
call it once permission is granted and again whenever `expo-notifications`
reports a new token. Tokens are stored per user (`users/{id}/pushTokens`, a
plain array) and are pruned automatically once Expo reports one as
`DeviceNotRegistered`.

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
| POST | `/` | Admin | `name`, `price`, `category`, `image`, `description`, `available?` |
| PUT | `/:id` | Admin | partial update (`available` may be sent on its own) |
| DELETE | `/:id` | Admin | |

`category` must match an existing, active category or the request fails with 400.

**Availability.** Every food in a response carries `available` (boolean). Items saved before the flag existed have no stored value and are returned as `available: true`. `available` must be a real boolean (`true`/`false`) when sent. A sold-out item (`available: false`):
- is still returned by `GET /api/foods` so clients can show it greyed out;
- is never returned as a platter suggestion, add-on or cheaper alternative by `/api/recommendations/*`;
- makes `POST /api/orders` fail with 400 (`Sold out right now: <names>. Remove them to place your order.`).

---

## Orders — `/api/orders` (all endpoints require login)

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/` | Customer/Admin | `items: [{ foodId, quantity }]`, `paymentMethod` (`cod` \| `card`, required), `budget?`, `totalPrice?` |
| POST | `/:id/confirm-payment` | Owner or admin | card orders only; reads the PaymentIntent from Stripe and sets `paymentStatus` |
| GET | `/` | Owner | own orders only; `?status=&search=&page=&limit=&sort=` |
| GET | `/:id` | Owner or admin | |
| PUT | `/:id/cancel` | Owner or admin | only from `pending` or `preparing` |
| DELETE | `/:id` | Admin | |

Server-side rules on create:

- Item names, prices and categories are read from the `foods` node — client prices are ignored.
- `totalPrice` is recalculated; if the client sends a different value the order is rejected.
- `budget` (optional) is stored; an order above it is rejected with `budget` and `totalPrice` in `errors`.
- `userId` comes from the token and `status` is always `pending`.

Payments: every order has `paymentMethod` (`cod` | `card`) and `paymentStatus`
(`pending` | `paid` | `failed`). A `card` order is created with a Stripe
PaymentIntent (sandbox keys only — the server rejects non-`sk_test_` keys) and the
create response includes `payment: { clientSecret, publishableKey }` for the app's
payment sheet. Cancelling an unpaid card order cancels its PaymentIntent. Refunds
for already-paid orders are not automated. Older orders without these fields are
cash on delivery.

Status flow: `pending → preparing → completed`, with `cancelled` reachable from
`pending` or `preparing`. Every change is appended to `statusHistory`.

A push notification is sent to the order's owner when the order is created,
and again on every status change made by someone else (an admin update, or a
customer cancelling from a different session) — see `services/notificationService.js`.
Delivery is best-effort and never blocks or fails the request.

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
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@platter.com
ADMIN_PASSWORD=...
EXPO_ACCESS_TOKEN=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_CURRENCY=pkr
```

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, that admin account is created on
server start when it does not already exist — but only on a traditional/local
start (`node index.js`), since that logic runs in `app.listen()`'s callback,
which serverless hosts like Vercel never execute. Create the admin manually
(see `services/authService.js`'s `registerUserWithRole`) if deploying there.

`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` come
from the same Firebase service account JSON as `config/serviceAccountKey.json`
(Project settings → Service accounts → Generate new private key). They're read
from env vars rather than that file so the app works on hosts that only
provide env vars — `FIREBASE_PRIVATE_KEY`'s `\n` sequences are unescaped
defensively in `config/firebase.js`, so pasting it either as one line with
literal `\n`s or as a real multi-line value both work.

`EXPO_ACCESS_TOKEN` authenticates outgoing push notifications with Expo's push
service. Optional, but Expo may rate-limit unauthenticated requests.

## Deploying to Vercel

`app.js` exports the Express app with no `.listen()` call; `index.js` adds
`.listen()` for local/traditional hosting, and `api/index.js` re-exports the
same app for Vercel's serverless runtime. `vercel.json` rewrites every path to
that one function, since Vercel doesn't know Express handles its own routing
internally. Set every variable above (except `PORT`, which Vercel provides
itself) in the Vercel project's Environment Variables settings before
deploying — there is no `.env` file in that environment.

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
