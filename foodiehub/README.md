# FoodieHub — Online Food Ordering Database System

A full-stack online food ordering platform built with **React**, **Tailwind CSS**, **Node.js / Express**, and an embedded **SQLite relational database** (`better-sqlite3`) featuring normalized tables, primary & foreign keys, atomic transactions, customer accounts, demo payments, live order tracking, printable invoices, and an admin management & analytics dashboard.

## Features

- **Customer Storefront**: Hero search, category browsing, live menu filtering & sorting, availability indicators, and slide-over shopping cart with GST & delivery fee calculation.
- **Customer Authentication & Profile**: Secure registration & sign-in (`scrypt` password hashing + HMAC-SHA256 bearer sessions) and editable delivery address/phone profile.
- **Checkout & Demo Payments**: Supports **Cash on Delivery**, **UPI Demo**, and **Card Demo** (never collects or stores real card numbers). Authoritative pricing is validated and totaled on the server inside an atomic SQL transaction.
- **Order Tracking & Invoices**: 6-stage status progression (`Order Placed` -> `Confirmed` -> `Preparing` -> `Out for Delivery` -> `Delivered` / `Cancelled`), eligible order cancellation, and printable GST invoices.
- **Admin Dashboard**: Protected by first-run password claim (or `ADMIN_PASSCODE` environment variable). Includes revenue & order KPIs, daily revenue & category sales charts, popular dishes leaderboard, full CRUD for food items and categories, live order status updates, customer directory, and relational schema reference.

## Database Structure

SQL scripts live in `/database`:
- `database/schema.sql` — Creates `Users`, `Categories`, `Food_Items`, `Orders`, `Order_Items`, and `Payments` with primary keys, foreign keys, and `CHECK` constraints.
- `database/seed.sql` — Seeds 10 categories, 28 Indian & fusion food items (INR), 5 sample customers, and 10 sample orders with line items and payment records.
- `database/queries.sql` — Reference SQL operations (`INSERT`, `SELECT`, `UPDATE`, `DELETE`, `INNER JOIN`, `LEFT JOIN`, `GROUP BY`, `SUM`).

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Optional environment configuration**:
   Copy `.env.example` to `.env`. If you set `ADMIN_PASSCODE`, admin login uses that passcode; if left empty, the Admin Console renders a one-time First-Run Admin Setup form to claim your admin password securely.
3. **Start the full-stack development server** (port `3000`):
   ```bash
   npm run dev
   ```
4. **Build for production**:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```
