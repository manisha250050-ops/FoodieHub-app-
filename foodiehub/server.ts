import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import db, { initializeDatabase } from './server/db.ts';
import {
  constantTimeEqualText,
  hashPassword,
  requireAdmin,
  requireAuth,
  signToken,
  verifyPassword,
  type AuthenticatedRequest,
  type AuthenticatedUser,
} from './server/auth.ts';

initializeDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Helper validators
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isSafeImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('/src/assets/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

const ALLOWED_PAYMENT_METHODS = ['Cash on Delivery', 'UPI Demo', 'Card Demo'] as const;
const ALLOWED_ORDER_STATUSES = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;

interface OrderRow {
  order_id: number;
  user_id: number;
  customer_name: string;
  phone: string;
  order_date: string;
  total_amount: number;
  delivery_address: string;
  payment_method: string;
  order_status: string;
  payment_status: string | null;
  payment_date: string | null;
  customer_email?: string;
}

function attachOrderItems(orders: OrderRow[]) {
  if (orders.length === 0) return [];
  const stmt = db.prepare(`
    SELECT
      oi.order_item_id,
      oi.order_id,
      oi.food_id,
      f.food_name,
      f.image_url,
      oi.quantity,
      oi.price
    FROM Order_Items oi
    INNER JOIN Food_Items f ON oi.food_id = f.food_id
    WHERE oi.order_id = ?
    ORDER BY oi.order_item_id ASC
  `);
  return orders.map((order) => ({
    ...order,
    items: stmt.all(order.order_id),
  }));
}

// ---------------------------------------------------------------------------
// Health & Public Reference
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/categories', (_req, res) => {
  const categories = db
    .prepare(`
      SELECT
        c.category_id,
        c.category_name,
        COUNT(f.food_id) AS item_count
      FROM Categories c
      LEFT JOIN Food_Items f ON c.category_id = f.category_id
      GROUP BY c.category_id, c.category_name
      ORDER BY c.category_id ASC
    `)
    .all();
  res.json({ categories });
});

app.get('/api/foods', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
  const availableOnly = req.query.available_only === 'true';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'featured';

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (categoryId && Number.isInteger(categoryId) && categoryId > 0) {
    conditions.push('f.category_id = ?');
    params.push(categoryId);
  }
  if (availableOnly) {
    conditions.push('f.availability = 1');
  }
  if (search) {
    conditions.push('(LOWER(f.food_name) LIKE ? OR LOWER(f.description) LIKE ? OR LOWER(c.category_name) LIKE ?)');
    const like = `%${search.toLowerCase()}%`;
    params.push(like, like, like);
  }

  let orderBy = 'f.food_id ASC';
  if (sort === 'price_asc') orderBy = 'f.price ASC, f.food_id ASC';
  if (sort === 'price_desc') orderBy = 'f.price DESC, f.food_id ASC';
  if (sort === 'name_asc') orderBy = 'f.food_name ASC';

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const foods = db
    .prepare(`
      SELECT
        f.food_id,
        f.category_id,
        c.category_name,
        f.food_name,
        f.description,
        f.price,
        f.image_url,
        f.availability
      FROM Food_Items f
      INNER JOIN Categories c ON f.category_id = c.category_id
      ${whereClause}
      ORDER BY ${orderBy}
    `)
    .all(...params);

  res.json({ foods });
});

// ---------------------------------------------------------------------------
// Customer & Admin Authentication
// ---------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';

  if (name.length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }
  if (phone.length < 7) {
    res.status(400).json({ error: 'Please provide a valid phone number.' });
    return;
  }
  if (address.length < 6) {
    res.status(400).json({ error: 'Please provide a complete delivery address.' });
    return;
  }

  const existing = db.prepare('SELECT user_id FROM Users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = hashPassword(password);
  const result = db
    .prepare(`
      INSERT INTO Users (name, email, password_hash, phone, address, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
    `)
    .run(name, email, passwordHash, phone, address);

  const user = db
    .prepare('SELECT user_id, name, email, phone, address, role, created_at FROM Users WHERE user_id = ?')
    .get(result.lastInsertRowid) as AuthenticatedUser;

  const token = signToken(user);
  res.status(201).json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const row = db
    .prepare('SELECT user_id, name, email, password_hash, phone, address, role, created_at FROM Users WHERE email = ?')
    .get(email) as (AuthenticatedUser & { password_hash: string }) | undefined;

  if (!row || row.role !== 'customer' || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const { password_hash: _ignored, ...user } = row;
  const token = signToken(user);
  res.json({ token, user });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';

  if (name.length < 2 || phone.length < 7 || address.length < 6) {
    res.status(400).json({ error: 'Valid name, phone, and address are required.' });
    return;
  }

  db.prepare('UPDATE Users SET name = ?, phone = ?, address = ? WHERE user_id = ?').run(
    name,
    phone,
    address,
    req.user!.user_id
  );

  const updated = db
    .prepare('SELECT user_id, name, email, phone, address, role, created_at FROM Users WHERE user_id = ?')
    .get(req.user!.user_id) as AuthenticatedUser;

  res.json({ user: updated });
});

app.put('/api/auth/password', requireAuth, (req: AuthenticatedRequest, res) => {
  const currentPassword = typeof req.body?.current_password === 'string' ? req.body.current_password : '';
  const newPassword = typeof req.body?.new_password === 'string' ? req.body.new_password : '';

  if (!currentPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Current password and a new password (min 6 characters) are required.' });
    return;
  }

  const row = db
    .prepare('SELECT user_id, password_hash FROM Users WHERE user_id = ?')
    .get(req.user!.user_id) as { user_id: number; password_hash: string } | undefined;

  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }

  const nextHash = hashPassword(newPassword);
  db.prepare('UPDATE Users SET password_hash = ? WHERE user_id = ?').run(nextHash, req.user!.user_id);

  res.json({ updated: true });
});

// Admin Auth Status & First-Run Setup / Login
app.get('/api/auth/admin-status', (_req, res) => {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim() ?? '';
  if (envPasscode.length > 0) {
    res.json({ configured: true, envManaged: true });
    return;
  }
  const admin = db
    .prepare("SELECT user_id, email, password_hash FROM Users WHERE role = 'admin' LIMIT 1")
    .get() as { user_id: number; email: string; password_hash: string } | undefined;

  const hasValidHash = Boolean(admin && admin.password_hash.startsWith('scrypt$'));
  res.json({
    configured: hasValidHash,
    envManaged: false,
    adminEmail: hasValidHash ? admin!.email : null,
  });
});

app.post('/api/auth/admin/setup', (req, res) => {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim() ?? '';
  if (envPasscode.length > 0) {
    res.status(409).json({ error: 'Admin passcode is managed by environment configuration.' });
    return;
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : 'FoodieHub Admin';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'admin@foodiehub.in';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Valid admin email is required.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Admin password must be at least 6 characters.' });
    return;
  }

  const setupTx = db.transaction(() => {
    const existingAdmin = db
      .prepare("SELECT user_id, password_hash FROM Users WHERE role = 'admin' LIMIT 1")
      .get() as { user_id: number; password_hash: string } | undefined;

    if (existingAdmin && existingAdmin.password_hash.startsWith('scrypt$')) {
      return { conflict: true as const };
    }

    const emailTaken = db.prepare('SELECT user_id FROM Users WHERE email = ?').get(email);
    if (emailTaken) {
      return { emailConflict: true as const };
    }

    const hash = hashPassword(password);
    const info = db
      .prepare(`
        INSERT INTO Users (name, email, password_hash, phone, address, role)
        VALUES (?, ?, ?, '+91 44 2815 0000', 'FoodieHub Central Kitchen, Chennai', 'admin')
      `)
      .run(name || 'FoodieHub Admin', email, hash);

    const adminUser = db
      .prepare('SELECT user_id, name, email, phone, address, role, created_at FROM Users WHERE user_id = ?')
      .get(info.lastInsertRowid) as AuthenticatedUser;

    return { conflict: false as const, adminUser };
  });

  const outcome = setupTx();
  if ('conflict' in outcome && outcome.conflict) {
    res.status(409).json({ error: 'Admin credentials have already been claimed. Please sign in.' });
    return;
  }
  if ('emailConflict' in outcome && outcome.emailConflict) {
    res.status(409).json({ error: 'That email belongs to an existing customer account. Choose a dedicated admin email.' });
    return;
  }

  const token = signToken(outcome.adminUser!);
  res.status(201).json({ token, user: outcome.adminUser });
});

app.post('/api/auth/admin/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!password) {
    res.status(400).json({ error: 'Admin password is required.' });
    return;
  }

  const envPasscode = process.env.ADMIN_PASSCODE?.trim() ?? '';
  if (envPasscode.length > 0) {
    if (!constantTimeEqualText(password, envPasscode)) {
      res.status(401).json({ error: 'Invalid admin credentials.' });
      return;
    }

    let adminUser = db
      .prepare("SELECT user_id, name, email, phone, address, role, created_at FROM Users WHERE role = 'admin' LIMIT 1")
      .get() as AuthenticatedUser | undefined;

    if (!adminUser) {
      const info = db
        .prepare(`
          INSERT INTO Users (name, email, password_hash, phone, address, role)
          VALUES ('FoodieHub Admin', 'admin@foodiehub.in', '!ENV_MANAGED', '+91 44 2815 0000', 'FoodieHub Central Kitchen, Chennai', 'admin')
        `)
        .run();
      adminUser = db
        .prepare('SELECT user_id, name, email, phone, address, role, created_at FROM Users WHERE user_id = ?')
        .get(info.lastInsertRowid) as AuthenticatedUser;
    }

    const token = signToken(adminUser);
    res.json({ token, user: adminUser });
    return;
  }

  const row = db
    .prepare(
      "SELECT user_id, name, email, password_hash, phone, address, role, created_at FROM Users WHERE role = 'admin' AND email = ?"
    )
    .get(email) as (AuthenticatedUser & { password_hash: string }) | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: 'Invalid admin email or password.' });
    return;
  }

  const { password_hash: _ignored, ...adminUser } = row;
  const token = signToken(adminUser);
  res.json({ token, user: adminUser });
});

// ---------------------------------------------------------------------------
// Customer Order Placement, Tracking & Cancellation
// ---------------------------------------------------------------------------
app.post('/api/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const customerName = typeof req.body?.customer_name === 'string' ? req.body.customer_name.trim() : '';
  const deliveryAddress =
    typeof req.body?.delivery_address === 'string' ? req.body.delivery_address.trim() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const paymentMethod = req.body?.payment_method;
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

  if (customerName.length < 2) {
    res.status(400).json({ error: 'Customer name is required.' });
    return;
  }
  if (deliveryAddress.length < 6) {
    res.status(400).json({ error: 'Complete delivery address is required.' });
    return;
  }
  if (phone.length < 7) {
    res.status(400).json({ error: 'Valid phone number is required.' });
    return;
  }
  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    res.status(400).json({ error: 'Invalid payment method selected.' });
    return;
  }
  if (rawItems.length === 0) {
    res.status(400).json({ error: 'Your cart is empty.' });
    return;
  }

  // Merge duplicate food_ids safely and validate positive integer quantities
  const mergedQuantities = new Map<number, number>();
  for (const entry of rawItems) {
    const foodId = Number(entry?.food_id);
    const quantity = Number(entry?.quantity);
    if (!Number.isInteger(foodId) || foodId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
      res.status(400).json({ error: 'Invalid cart item quantity or food ID.' });
      return;
    }
    mergedQuantities.set(foodId, (mergedQuantities.get(foodId) ?? 0) + quantity);
  }

  try {
    const createdOrderId = db.transaction(() => {
      const foodLookup = db.prepare(
        'SELECT food_id, food_name, price, availability FROM Food_Items WHERE food_id = ?'
      );

      let subtotal = 0;
      const verifiedItems: Array<{ food_id: number; quantity: number; price: number }> = [];

      for (const [foodId, quantity] of mergedQuantities.entries()) {
        const food = foodLookup.get(foodId) as
          | { food_id: number; food_name: string; price: number; availability: number }
          | undefined;

        if (!food) {
          throw new Error(`FOOD_NOT_FOUND:${foodId}`);
        }
        if (food.availability !== 1) {
          throw new Error(`FOOD_UNAVAILABLE:${food.food_name}`);
        }

        // Authoritative backend price calculation
        subtotal += food.price * quantity;
        verifiedItems.push({ food_id: food.food_id, quantity, price: food.price });
      }

      const gst = Math.round(subtotal * 0.05);
      const deliveryFee = subtotal >= 299 ? 0 : 30;
      const totalAmount = subtotal + gst + deliveryFee;

      const orderResult = db
        .prepare(`
          INSERT INTO Orders (user_id, customer_name, phone, order_date, total_amount, delivery_address, payment_method, order_status)
          VALUES (?, ?, ?, datetime('now'), ?, ?, ?, 'Order Placed')
        `)
        .run(req.user!.user_id, customerName, phone, totalAmount, deliveryAddress, paymentMethod);

      const newOrderId = Number(orderResult.lastInsertRowid);

      const insertItem = db.prepare(`
        INSERT INTO Order_Items (order_id, food_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `);

      for (const item of verifiedItems) {
        insertItem.run(newOrderId, item.food_id, item.quantity, item.price);
      }

      const paymentStatus = paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid';
      db.prepare(`
        INSERT INTO Payments (order_id, payment_method, payment_status, amount, payment_date)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(newOrderId, paymentMethod, paymentStatus, totalAmount);

      return newOrderId;
    })();

    const orderRow = db
      .prepare(`
        SELECT o.*, p.payment_status, p.payment_date
        FROM Orders o
        LEFT JOIN Payments p ON o.order_id = p.order_id
        WHERE o.order_id = ?
      `)
      .get(createdOrderId) as OrderRow;

    const [fullOrder] = attachOrderItems([orderRow]);
    res.status(201).json({ order: fullOrder });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.startsWith('FOOD_NOT_FOUND:')) {
      res.status(400).json({ error: 'One or more items in your cart no longer exist.' });
      return;
    }
    if (message.startsWith('FOOD_UNAVAILABLE:')) {
      const name = message.split(':')[1] || 'Item';
      res.status(409).json({ error: `${name} is currently out of stock. Please remove it from your cart.` });
      return;
    }
    res.status(500).json({ error: 'Unable to place order. Please try again.' });
  }
});

app.get('/api/orders/my', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(`
      SELECT o.*, p.payment_status, p.payment_date
      FROM Orders o
      LEFT JOIN Payments p ON o.order_id = p.order_id
      WHERE o.user_id = ?
      ORDER BY o.order_id DESC
    `)
    .all(req.user!.user_id) as OrderRow[];

  res.json({ orders: attachOrderItems(rows) });
});

app.get('/api/orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  const row = db
    .prepare(`
      SELECT o.*, u.email AS customer_email, p.payment_status, p.payment_date
      FROM Orders o
      INNER JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      WHERE o.order_id = ?
    `)
    .get(orderId) as OrderRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  if (req.user!.role !== 'admin' && row.user_id !== req.user!.user_id) {
    res.status(403).json({ error: 'You do not have permission to view this order.' });
    return;
  }

  const [order] = attachOrderItems([row]);
  res.json({ order });
});

app.patch('/api/orders/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }

  const order = db.prepare('SELECT order_id, user_id, order_status FROM Orders WHERE order_id = ?').get(orderId) as
    | { order_id: number; user_id: number; order_status: string }
    | undefined;

  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  if (req.user!.role !== 'admin' && order.user_id !== req.user!.user_id) {
    res.status(403).json({ error: 'Not authorized to cancel this order.' });
    return;
  }
  if (!['Order Placed', 'Confirmed'].includes(order.order_status)) {
    res.status(409).json({
      error: `Order cannot be cancelled once it is "${order.order_status}".`,
    });
    return;
  }

  db.transaction(() => {
    db.prepare("UPDATE Orders SET order_status = 'Cancelled' WHERE order_id = ?").run(orderId);
    db.prepare(`
      UPDATE Payments
      SET payment_status = CASE WHEN payment_status = 'Paid' THEN 'Refunded' ELSE 'Failed' END
      WHERE order_id = ?
    `).run(orderId);
  })();

  const updatedRow = db
    .prepare(`
      SELECT o.*, p.payment_status, p.payment_date
      FROM Orders o
      LEFT JOIN Payments p ON o.order_id = p.order_id
      WHERE o.order_id = ?
    `)
    .get(orderId) as OrderRow;

  const [fullOrder] = attachOrderItems([updatedRow]);
  res.json({ order: fullOrder });
});

// ---------------------------------------------------------------------------
// Admin Protected Routes
// ---------------------------------------------------------------------------
app.get('/api/admin/analytics', requireAuth, requireAdmin, (_req, res) => {
  const totalCustomers = (
    db.prepare("SELECT COUNT(*) AS count FROM Users WHERE role = 'customer'").get() as { count: number }
  ).count;

  const totalFoodItems = (db.prepare('SELECT COUNT(*) AS count FROM Food_Items').get() as { count: number }).count;

  const salesSummary = db
    .prepare(`
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(CASE WHEN order_status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS total_revenue
      FROM Orders
    `)
    .get() as { total_orders: number; total_revenue: number };

  const statusBreakdown = db
    .prepare(`
      SELECT order_status, COUNT(*) AS count
      FROM Orders
      GROUP BY order_status
    `)
    .all();

  const popularDishes = db
    .prepare(`
      SELECT
        f.food_id,
        f.food_name,
        c.category_name,
        f.price,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.quantity * oi.price) AS revenue
      FROM Order_Items oi
      INNER JOIN Orders o ON oi.order_id = o.order_id
      INNER JOIN Food_Items f ON oi.food_id = f.food_id
      INNER JOIN Categories c ON f.category_id = c.category_id
      WHERE o.order_status != 'Cancelled'
      GROUP BY f.food_id, f.food_name, c.category_name, f.price
      ORDER BY units_sold DESC, revenue DESC
      LIMIT 6
    `)
    .all();

  const salesByCategory = db
    .prepare(`
      SELECT
        c.category_id,
        c.category_name,
        COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN oi.quantity ELSE 0 END), 0) AS units_sold,
        COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN oi.quantity * oi.price ELSE 0 END), 0) AS revenue
      FROM Categories c
      LEFT JOIN Food_Items f ON c.category_id = f.category_id
      LEFT JOIN Order_Items oi ON f.food_id = oi.food_id
      LEFT JOIN Orders o ON oi.order_id = o.order_id
      GROUP BY c.category_id, c.category_name
      ORDER BY revenue DESC, c.category_name ASC
    `)
    .all();

  const dailySales = db
    .prepare(`
      SELECT
        substr(order_date, 1, 10) AS day,
        COUNT(*) AS orders_count,
        COALESCE(SUM(CASE WHEN order_status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS revenue
      FROM Orders
      GROUP BY substr(order_date, 1, 10)
      ORDER BY day ASC
      LIMIT 14
    `)
    .all();

  const recentOrderRows = db
    .prepare(`
      SELECT o.*, u.email AS customer_email, p.payment_status, p.payment_date
      FROM Orders o
      INNER JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      ORDER BY o.order_id DESC
      LIMIT 6
    `)
    .all() as OrderRow[];

  res.json({
    summary: {
      total_customers: totalCustomers,
      total_food_items: totalFoodItems,
      total_orders: salesSummary.total_orders,
      total_revenue: salesSummary.total_revenue,
    },
    statusBreakdown,
    popularDishes,
    salesByCategory,
    dailySales,
    recentOrders: attachOrderItems(recentOrderRows),
  });
});

app.get('/api/admin/customers', requireAuth, requireAdmin, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const params: string[] = [];
  let searchFilter = '';
  if (search) {
    searchFilter = 'AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.phone) LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const customers = db
    .prepare(`
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.created_at,
        COUNT(o.order_id) AS order_count,
        COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent
      FROM Users u
      LEFT JOIN Orders o ON u.user_id = o.user_id
      WHERE u.role = 'customer' ${searchFilter}
      GROUP BY u.user_id, u.name, u.email, u.phone, u.address, u.created_at
      ORDER BY u.user_id DESC
    `)
    .all(...params);

  res.json({ customers });
});

app.get('/api/admin/orders', requireAuth, requireAdmin, (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (status && ALLOWED_ORDER_STATUSES.includes(status as (typeof ALLOWED_ORDER_STATUSES)[number])) {
    conditions.push('o.order_status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push(
      '(CAST(o.order_id AS TEXT) LIKE ? OR LOWER(o.customer_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(o.phone) LIKE ?)'
    );
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`
      SELECT o.*, u.email AS customer_email, p.payment_status, p.payment_date
      FROM Orders o
      INNER JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      ${whereClause}
      ORDER BY o.order_id DESC
    `)
    .all(...params) as OrderRow[];

  res.json({ orders: attachOrderItems(rows) });
});

app.patch('/api/admin/orders/:id/status', requireAuth, requireAdmin, (req, res) => {
  const orderId = Number(req.params.id);
  const newStatus = req.body?.order_status;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: 'Invalid order ID.' });
    return;
  }
  if (!ALLOWED_ORDER_STATUSES.includes(newStatus)) {
    res.status(400).json({ error: 'Invalid order status.' });
    return;
  }

  const existing = db.prepare('SELECT order_id, payment_method FROM Orders WHERE order_id = ?').get(orderId) as
    | { order_id: number; payment_method: string }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  db.transaction(() => {
    db.prepare('UPDATE Orders SET order_status = ? WHERE order_id = ?').run(newStatus, orderId);
    if (newStatus === 'Delivered') {
      db.prepare("UPDATE Payments SET payment_status = 'Paid' WHERE order_id = ?").run(orderId);
    } else if (newStatus === 'Cancelled') {
      db.prepare(`
        UPDATE Payments
        SET payment_status = CASE WHEN payment_status = 'Paid' THEN 'Refunded' ELSE 'Failed' END
        WHERE order_id = ?
      `).run(orderId);
    }
  })();

  const updatedRow = db
    .prepare(`
      SELECT o.*, u.email AS customer_email, p.payment_status, p.payment_date
      FROM Orders o
      INNER JOIN Users u ON o.user_id = u.user_id
      LEFT JOIN Payments p ON o.order_id = p.order_id
      WHERE o.order_id = ?
    `)
    .get(orderId) as OrderRow;

  const [fullOrder] = attachOrderItems([updatedRow]);
  res.json({ order: fullOrder });
});

app.post('/api/admin/foods', requireAuth, requireAdmin, (req, res) => {
  const categoryId = Number(req.body?.category_id);
  const foodName = typeof req.body?.food_name === 'string' ? req.body.food_name.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const price = Number(req.body?.price);
  const imageUrl = typeof req.body?.image_url === 'string' ? req.body.image_url.trim() : '';
  const availability = req.body?.availability === 0 || req.body?.availability === false ? 0 : 1;

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    res.status(400).json({ error: 'Valid category is required.' });
    return;
  }
  if (foodName.length < 2 || description.length < 5) {
    res.status(400).json({ error: 'Food name and description are required.' });
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.status(400).json({ error: 'Price must be greater than zero.' });
    return;
  }
  if (!isSafeImageUrl(imageUrl)) {
    res.status(400).json({ error: 'Please select a valid dish image or HTTPS image URL.' });
    return;
  }

  const category = db.prepare('SELECT category_id FROM Categories WHERE category_id = ?').get(categoryId);
  if (!category) {
    res.status(400).json({ error: 'Selected category does not exist.' });
    return;
  }

  const info = db
    .prepare(`
      INSERT INTO Food_Items (category_id, food_name, description, price, image_url, availability)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(categoryId, foodName, description, price, imageUrl, availability);

  const food = db
    .prepare(`
      SELECT f.*, c.category_name
      FROM Food_Items f
      INNER JOIN Categories c ON f.category_id = c.category_id
      WHERE f.food_id = ?
    `)
    .get(info.lastInsertRowid);

  res.status(201).json({ food });
});

app.put('/api/admin/foods/:id', requireAuth, requireAdmin, (req, res) => {
  const foodId = Number(req.params.id);
  const categoryId = Number(req.body?.category_id);
  const foodName = typeof req.body?.food_name === 'string' ? req.body.food_name.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const price = Number(req.body?.price);
  const imageUrl = typeof req.body?.image_url === 'string' ? req.body.image_url.trim() : '';
  const availability = req.body?.availability === 0 || req.body?.availability === false ? 0 : 1;

  if (!Number.isInteger(foodId) || foodId <= 0) {
    res.status(400).json({ error: 'Invalid food ID.' });
    return;
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0 || foodName.length < 2 || description.length < 5) {
    res.status(400).json({ error: 'Category, food name, and description are required.' });
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.status(400).json({ error: 'Price must be greater than zero.' });
    return;
  }
  if (!isSafeImageUrl(imageUrl)) {
    res.status(400).json({ error: 'Please select a valid dish image or HTTPS image URL.' });
    return;
  }

  const existing = db.prepare('SELECT food_id FROM Food_Items WHERE food_id = ?').get(foodId);
  if (!existing) {
    res.status(404).json({ error: 'Food item not found.' });
    return;
  }

  db.prepare(`
    UPDATE Food_Items
    SET category_id = ?, food_name = ?, description = ?, price = ?, image_url = ?, availability = ?
    WHERE food_id = ?
  `).run(categoryId, foodName, description, price, imageUrl, availability, foodId);

  const food = db
    .prepare(`
      SELECT f.*, c.category_name
      FROM Food_Items f
      INNER JOIN Categories c ON f.category_id = c.category_id
      WHERE f.food_id = ?
    `)
    .get(foodId);

  res.json({ food });
});

app.delete('/api/admin/foods/:id', requireAuth, requireAdmin, (req, res) => {
  const foodId = Number(req.params.id);
  if (!Number.isInteger(foodId) || foodId <= 0) {
    res.status(400).json({ error: 'Invalid food ID.' });
    return;
  }

  const usedInOrders = db
    .prepare('SELECT COUNT(*) AS count FROM Order_Items WHERE food_id = ?')
    .get(foodId) as { count: number };

  if (usedInOrders.count > 0) {
    res.status(409).json({
      error:
        'This dish appears in historical order records and cannot be deleted due to foreign key integrity. Mark it unavailable instead.',
    });
    return;
  }

  const info = db.prepare('DELETE FROM Food_Items WHERE food_id = ?').run(foodId);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Food item not found.' });
    return;
  }

  res.json({ deleted: true, food_id: foodId });
});

app.post('/api/admin/categories', requireAuth, requireAdmin, (req, res) => {
  const categoryName = typeof req.body?.category_name === 'string' ? req.body.category_name.trim() : '';
  if (categoryName.length < 2) {
    res.status(400).json({ error: 'Category name must be at least 2 characters.' });
    return;
  }

  const existing = db
    .prepare('SELECT category_id FROM Categories WHERE LOWER(category_name) = ?')
    .get(categoryName.toLowerCase());
  if (existing) {
    res.status(409).json({ error: 'Category already exists.' });
    return;
  }

  const info = db.prepare('INSERT INTO Categories (category_name) VALUES (?)').run(categoryName);
  const category = db
    .prepare('SELECT category_id, category_name, 0 AS item_count FROM Categories WHERE category_id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json({ category });
});

app.put('/api/admin/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const categoryId = Number(req.params.id);
  const categoryName = typeof req.body?.category_name === 'string' ? req.body.category_name.trim() : '';
  if (!Number.isInteger(categoryId) || categoryId <= 0 || categoryName.length < 2) {
    res.status(400).json({ error: 'Valid category ID and name are required.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT category_id FROM Categories WHERE LOWER(category_name) = ? AND category_id != ?')
    .get(categoryName.toLowerCase(), categoryId);
  if (duplicate) {
    res.status(409).json({ error: 'Another category already has that name.' });
    return;
  }

  const info = db
    .prepare('UPDATE Categories SET category_name = ? WHERE category_id = ?')
    .run(categoryName, categoryId);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  res.json({ category: { category_id: categoryId, category_name: categoryName } });
});

app.delete('/api/admin/categories/:id', requireAuth, requireAdmin, (req, res) => {
  const categoryId = Number(req.params.id);
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    res.status(400).json({ error: 'Invalid category ID.' });
    return;
  }

  const itemCount = db
    .prepare('SELECT COUNT(*) AS count FROM Food_Items WHERE category_id = ?')
    .get(categoryId) as { count: number };

  if (itemCount.count > 0) {
    res.status(409).json({
      error: 'Cannot delete a category that still contains food items. Reassign or remove its items first.',
    });
    return;
  }

  const info = db.prepare('DELETE FROM Categories WHERE category_id = ?').run(categoryId);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  res.json({ deleted: true, category_id: categoryId });
});

app.use('/api', (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err && typeof err === 'object' && 'type' in err && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON request body.' });
    return;
  }
  res.status(500).json({ error: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Frontend Hosting (Vite Middleware in Dev / Static Dist in Prod)
// ---------------------------------------------------------------------------
async function startServer() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FoodieHub server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
