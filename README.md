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

```powershell
npm run db:init
```

The import is safe to rerun: existing products, accounts, orders, inquiries, and subscribers
are not duplicated. Legacy account passwords are hashed with bcrypt during import.
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
