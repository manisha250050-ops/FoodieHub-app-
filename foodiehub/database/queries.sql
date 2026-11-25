-- FoodieHub Reference SQL Queries
-- Demonstrates all relational database operations used by the application

-- 1. INSERT new customer details
INSERT INTO Users (name, email, password_hash, phone, address, role)
VALUES (?, ?, ?, ?, ?, 'customer');

-- 2. SELECT food items with category join and filters
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
WHERE f.availability = 1
ORDER BY f.food_id ASC;

-- 3. UPDATE food details
UPDATE Food_Items
SET category_id = ?, food_name = ?, description = ?, price = ?, image_url = ?, availability = ?
WHERE food_id = ?;

-- 4. DELETE food items
DELETE FROM Food_Items
WHERE food_id = ?;

-- 5. INSERT customer order (wrapped in a database transaction with Order_Items & Payments)
INSERT INTO Orders (user_id, customer_name, phone, order_date, total_amount, delivery_address, payment_method, order_status)
VALUES (?, ?, ?, datetime('now'), ?, ?, ?, 'Order Placed');

-- 6. JOIN orders with customers
SELECT
  o.order_id,
  o.order_date,
  o.total_amount,
  o.order_status,
  o.payment_method,
  u.user_id,
  u.name AS customer_name,
  u.email AS customer_email,
  p.payment_status
FROM Orders o
INNER JOIN Users u ON o.user_id = u.user_id
LEFT JOIN Payments p ON o.order_id = p.order_id
ORDER BY o.order_date DESC;

-- 7. JOIN orders with food items
SELECT
  oi.order_id,
  f.food_id,
  f.food_name,
  oi.quantity,
  oi.price,
  (oi.quantity * oi.price) AS line_total
FROM Order_Items oi
INNER JOIN Food_Items f ON oi.food_id = f.food_id
WHERE oi.order_id = ?;

-- 8. Calculate total sales (excluding cancelled orders)
SELECT
  COUNT(*) AS total_orders,
  COALESCE(SUM(CASE WHEN order_status != 'Cancelled' THEN total_amount ELSE 0 END), 0) AS total_revenue
FROM Orders;

-- 9. Find most popular food items
SELECT
  f.food_id,
  f.food_name,
  c.category_name,
  SUM(oi.quantity) AS total_units_sold,
  SUM(oi.quantity * oi.price) AS total_item_revenue
FROM Order_Items oi
INNER JOIN Orders o ON oi.order_id = o.order_id
INNER JOIN Food_Items f ON oi.food_id = f.food_id
INNER JOIN Categories c ON f.category_id = c.category_id
WHERE o.order_status != 'Cancelled'
GROUP BY f.food_id, f.food_name, c.category_name
ORDER BY total_units_sold DESC
LIMIT 6;

-- 10. Display customer order history
SELECT
  o.order_id,
  o.order_date,
  o.total_amount,
  o.order_status,
  o.delivery_address,
  o.payment_method,
  p.payment_status
FROM Orders o
LEFT JOIN Payments p ON o.order_id = p.order_id
WHERE o.user_id = ?
ORDER BY o.order_date DESC;
