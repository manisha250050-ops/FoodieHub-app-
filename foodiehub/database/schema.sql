-- FoodieHub: Online Food Ordering Database System
-- Relational Schema (SQLite & MySQL-compatible structure)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Food_Items (
  food_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  food_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL CHECK (price > 0),
  image_url TEXT NOT NULL,
  availability INTEGER NOT NULL DEFAULT 1 CHECK (availability IN (0, 1)),
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Orders (
  order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  order_date TEXT NOT NULL DEFAULT (datetime('now')),
  total_amount REAL NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash on Delivery', 'UPI Demo', 'Card Demo')),
  order_status TEXT NOT NULL DEFAULT 'Order Placed' CHECK (
    order_status IN (
      'Order Placed',
      'Confirmed',
      'Preparing',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    )
  ),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Order_Items (
  order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  food_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price REAL NOT NULL CHECK (price >= 0),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES Food_Items(food_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash on Delivery', 'UPI Demo', 'Card Demo')),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded', 'Failed')),
  amount REAL NOT NULL CHECK (amount >= 0),
  payment_date TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_food_category ON Food_Items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON Orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON Orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON Order_Items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_food ON Order_Items(food_id);
