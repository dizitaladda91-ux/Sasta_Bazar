# SASTA BAZAAR - Everyday Luxury
### 100% Custom Full-Stack E-Commerce Platform (React + Node.js/Express)
**No Shopify dependency, no monthly fees, 100% custom code owned by you.**

---

## 🏗️ Architecture Overview

```
├── client (Frontend: React + Vite + Tailwind CSS + Lucide Icons)
│   ├── Port: http://localhost:3000
│   ├── Pages: Home, Shop, Collection, Product Details, Cart, Wishlist, Search, Track Order, Admin
│   └── Next.js API route: /api/*
│
├── server (Backend: Node.js + Express REST API)
│   ├── Runtime: Next.js API route on the same origin
│   ├── Storage: PostgreSQL (schema in server/db/schema.sql)
│   │   ├── users, addresses
│   │   ├── categories, products, variants
│   │   ├── orders, order_items, coupons
│   │   └── reviews, inquiries, subscribers
│   └── Endpoints:
│       ├── GET  /api/products          (Search, filter by category/price/stock, sorting)
│       ├── GET  /api/products/:handle   (Product details)
│       ├── GET  /api/categories        (Category counts)
│       ├── POST /api/orders            (Checkout order creation & calculation)
│       ├── GET  /api/orders/:orderId   (Track live courier status)
│       ├── POST /api/contact           (Customer support inquiry)
│       ├── POST /api/newsletter        (10% coupon generation & subscriber storage)
│       ├── GET  /api/admin/stats       (Revenue, orders, products metrics)
│       ├── GET  /api/admin/orders      (Admin order management)
│       ├── PATCH /api/admin/orders/:id (Update status: Processing -> Dispatched -> Delivered)
│       ├── POST /api/admin/products    (Add new product to live catalog)
│       └── DELETE /api/admin/products/:id (Delete product from catalog)
```

---

## 🚀 Database Setup

Create a project in Supabase. In the Supabase dashboard, open **Connect** and copy
the **Session pooler** connection string (port `5432`). Copy `.env.example` to
`.env`, then replace `<project-ref>`, `<region>`, and `<database-password>` in
`DATABASE_URL` with the values from your project. Keep `DATABASE_SSL=true`.
Download the project's root CA certificate from **Database Settings → SSL Configuration**
and set `DATABASE_SSL_CA` to its local path (for example, `./supabase-ca.crt`).
The certificate must match the Supabase project used by `DATABASE_URL`.

The storefront and Express API run together as a Next.js app. `pages/api/[[...path]].js`
forwards `/api/*` requests to the existing Express routes. Set `DATABASE_URL`,
`DATABASE_SSL=true`, and `DATABASE_SSL_CA_BASE64` in the Vercel project environment.
`DATABASE_SSL_CA_BASE64` is the base64-encoded contents of the Supabase root certificate.
The frontend uses the same-origin `/api` path. Public storefront settings use `NEXT_PUBLIC_`
variables; database credentials must stay server-only without that prefix.
If your database password contains URL-reserved characters, URL-encode it first.

The backend connects to Supabase's PostgreSQL database using the `pg` driver;
keep the database connection string on the server and never expose it in frontend
code. After saving `.env`, initialize the schema and import the existing JSON
catalog, orders, users, inquiries, and subscribers:

The PostgreSQL pool is capped at three connections per server instance. Keep
`PG_POOL_MAX` at or below three and use the database provider's pooled connection
string when deploying multiple serverless instances.

```powershell
npm run db:init
```

The import is safe to rerun: existing products, accounts, orders, inquiries, and subscribers
are not duplicated. Legacy account passwords are hashed with bcryptjs; the demo account
using the plaintext password `password123` is not imported.
Variant stock initializes to `0` because the current JSON catalog does not contain
stock counts; existing availability flags are retained separately.

## 🚀 How to Run

From the project directory, run:
```powershell
# Starts the Next.js storefront and API together:
npm run dev
```

- **Frontend Storefront:** [http://localhost:3000](http://localhost:3000)
- **Store Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Order Tracking:** [http://localhost:3000/track-order](http://localhost:3000/track-order)
- **Backend API:** [http://localhost:3000/api/products](http://localhost:3000/api/products)

## Authentication and Stripe setup

Copy `.env.example` to `.env` and set the database connection, a strong random
`JWT_SECRET`, Stripe test/live keys, and `ALLOWED_ORIGINS`. Keep secret values
server-only; only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and the API URL belong in
the browser bundle. In Vercel, configure the same values in Project Settings →
Environment Variables, including `JWT_SECRET`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `ALLOWED_ORIGINS`, and a random `CRON_SECRET` containing
at least 32 characters. For shared API rate limits, also set
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; local development uses
in-memory rate limits when both are absent. `ALLOWED_ORIGINS` is a comma-separated allowlist; include
the production storefront origin and any local development origin you use.
Next.js applies storefront CSP/security headers, while Helmet applies API headers.

Initialize the database and create or update the administrator account:

```powershell
npm run db:init
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="use-a-unique-password-of-at-least-8-characters"
npm run admin:create
```

The app uses an httpOnly `sb_token` cookie. User profile and order history APIs
derive identity from that cookie. Guest order tracking requires both the order
ID and checkout email. Card payments create Pending orders; fulfillment starts
only after Stripe's signed payment webhook confirms success.

For local Stripe testing, start the app, then run the Stripe CLI in another
terminal:

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the CLI's `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` and restart
the app. Use Stripe's test publishable and secret keys, then complete a checkout
with a Stripe test card such as `4242 4242 4242 4242`.

For production, add a webhook endpoint in the Stripe Dashboard at
`https://<your-vercel-domain>/api/webhooks/stripe`. Subscribe to
`payment_intent.succeeded`, `payment_intent.payment_failed`,
`payment_intent.canceled`, and `charge.refunded`. Copy the endpoint's signing
secret into the Vercel `STRIPE_WEBHOOK_SECRET` environment variable and redeploy.
Vercel Cron is configured in `vercel.json` to call
`/api/cron/release-stale-orders` daily at midnight UTC. Hobby allows one cron
execution per day (with up to 59 minutes of scheduling delay), so unpaid inventory
reservations can remain held until the next run. Use a Pro plan and a 15-minute
schedule if stale reservations must be released promptly. Vercel sends the configured
`CRON_SECRET` as a bearer token. The endpoint cancels unpaid Stripe intents
before releasing their inventory; orders with successful payments are left for
the Stripe webhook. For a manual run, use `npm run orders:release-stale`.

Administrators can issue partial refunds in GBP or refund the remaining balance.
Refunds are capped at the remaining order total; a full refund restores reserved
inventory only when the order has not been dispatched or delivered.
To test refunds safely, use Stripe test keys and complete a test checkout (for
example, with `4242 4242 4242 4242`). Sign in to `/admin`, choose **Refund**, enter
a partial amount or leave it blank for the remaining balance, then confirm. Verify
the refund in Stripe's test-mode dashboard and confirm `refunded_amount` and
`payment_status` in the order record. Never test refunds with live payment data.

---

## 🛒 Features Built Just Like Shopify (Custom Coding)

1. **Independent Product Management**:
   - Add new suits, lehengas, or hijabs directly from the Admin Panel (`/admin`).
   - Edit prices, compare-at prices, sizes, and images without touching code.
2. **Real Order Placement & Tracking**:
   - Customers place orders on `/cart` with full shipping calculation (£40 free shipping rule).
   - Instant order confirmation with generated ID (e.g. `SB-982143`).
   - Customers track their order status on `/track-order`.
   - Store owners update statuses (Processing &rarr; Dispatched &rarr; Delivered) in the Admin Dashboard.
3. **Customer Inquiries & Newsletter Leads**:
   - Contact form messages stored in PostgreSQL.
   - Newsletter signups automatically receive the `WELCOME10` 10% discount coupon code and persist in PostgreSQL.
