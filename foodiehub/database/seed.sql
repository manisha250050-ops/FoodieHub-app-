-- FoodieHub Sample Seed Data (10 categories, 28 food items, 5 customers, 10 orders)

INSERT INTO Categories (category_name) VALUES
  ('Breakfast'),
  ('Lunch'),
  ('Dinner'),
  ('Fast Food'),
  ('Pizza'),
  ('Burger'),
  ('Desserts'),
  ('Beverages'),
  ('Biriyani & Rice'),
  ('Starters & Tandoor');

INSERT INTO Food_Items (category_id, food_name, description, price, image_url, availability) VALUES
  (1, 'Masala Dosa', 'Crisp golden fermented crepe stuffed with spiced potato masala, served with sambar and coconut chutney.', 70, '/src/assets/images/dish_masala_dosa_1795337580549.jpg', 1),
  (1, 'Idli Sambar Trio', 'Three pillowy steamed rice cakes paired with drumstick sambar and two fresh chutneys.', 60, '/src/assets/images/dish_masala_dosa_1795337580549.jpg', 1),
  (1, 'Medu Vada Plate', 'Two crunchy lentil doughnuts tempered with curry leaves, black pepper, and ginger.', 65, '/src/assets/images/dish_masala_dosa_1795337580549.jpg', 1),
  (1, 'Chole Bhature', 'Spiced chickpea curry simmered in roasted spices served with two fluffy golden bhaturas.', 110, '/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg', 1),

  (2, 'Paneer Butter Masala', 'Soft cottage cheese cubes simmered in a rich tomato-cashew butter gravy finished with cream.', 160, '/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg', 1),
  (2, 'Veg Fried Rice', 'Wok-tossed long-grain basmati rice with crunchy seasonal vegetables, spring onions, and soy glaze.', 120, '/src/assets/images/dish_veg_fried_rice_1795337580111.jpg', 1),
  (2, 'South Indian Mini Thali', 'Curated lunch platter with sambar, rasam, poriyal, curd rice, papad, and a sweet bite.', 190, '/src/assets/images/dish_masala_dosa_1795337580549.jpg', 1),

  (3, 'Dal Makhani & Garlic Naan', 'Slow-simmered black lentils finished with butter and served alongside two charred garlic naans.', 175, '/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg', 1),
  (3, 'Kadai Chicken Masala', 'Succulent chicken tossed with roasted coriander seeds, bell peppers, and onion-tomato masala.', 210, '/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg', 1),
  (3, 'Butter Chicken & Jeera Rice', 'Char-grilled tandoori chicken in velvety makhani sauce paired with fragrant cumin rice.', 230, '/src/assets/images/dish_chicken_biriyani_1795337580667.jpg', 1),

  (9, 'Chicken Biriyani', 'Aromatic basmati rice layered with spiced chicken, caramelized onions, saffron, and mint raita.', 180, '/src/assets/images/dish_chicken_biriyani_1795337580667.jpg', 1),
  (9, 'Hyderabadi Mutton Biriyani', 'Slow-cooked dum biriyani with tender marinated mutton, whole spices, and fried shallots.', 260, '/src/assets/images/dish_chicken_biriyani_1795337580667.jpg', 1),
  (9, 'Paneer Dum Biriyani', 'Fragrant saffron basmati rice cooked on dum with grilled masala paneer and cashews.', 165, '/src/assets/images/dish_chicken_biriyani_1795337580667.jpg', 1),

  (4, 'Veg Hakka Noodles', 'Street-style stir-fried noodles tossed with shredded cabbage, peppers, carrots, and chili garlic.', 130, '/src/assets/images/dish_veg_fried_rice_1795337580111.jpg', 1),
  (4, 'Gobi Manchurian Dry', 'Crisp cauliflower florets glazed in a tangy ginger-garlic soy reduction and scallions.', 115, '/src/assets/images/dish_veg_fried_rice_1795337580111.jpg', 1),
  (4, 'Crispy Masala Fries', 'Golden skin-on potato fries dusted with house chaat masala and served with smoky dip.', 85, '/src/assets/images/dish_chicken_burger_1795337580165.jpg', 1),

  (5, 'Paneer Tikka Pizza', 'Wood-fired hand-stretched crust topped with tandoori paneer, roasted peppers, red onion, and mozzarella.', 240, '/src/assets/images/dish_tandoori_pizza_1795337579979.jpg', 1),
  (5, 'Classic Margherita Pizza', 'San Marzano tomato base, fresh mozzarella di bufala, extra virgin olive oil, and basil.', 190, '/src/assets/images/dish_tandoori_pizza_1795337579979.jpg', 1),
  (5, 'Peri Peri Chicken Pizza', 'Spicy peri-peri roasted chicken, charred jalapenos, sweet corn, and blistered cheese.', 270, '/src/assets/images/dish_tandoori_pizza_1795337579979.jpg', 1),

  (6, 'Chicken Burger', 'Crispy buttermilk-spiced chicken fillet, melted cheddar, pickled onions, and smoky mayo in brioche.', 130, '/src/assets/images/dish_chicken_burger_1795337580165.jpg', 1),
  (6, 'Crispy Paneer Burger', 'Panko-crusted herb paneer patty layered with tandoori slaw, cheddar, and brioche bun.', 120, '/src/assets/images/dish_chicken_burger_1795337580165.jpg', 1),
  (6, 'Double Cheese Smash Burger', 'Double seared patty, double aged cheddar, caramelized onions, and house mustard relish.', 160, '/src/assets/images/dish_chicken_burger_1795337580165.jpg', 1),

  (7, 'Warm Gulab Jamun', 'Soft khoya dumplings steeped in rose-cardamom saffron syrup, finished with slivered pistachios.', 75, '/src/assets/images/dish_gulab_jamun_1795337580180.jpg', 1),
  (7, 'Saffron Rasmalai', 'Chilled cottage cheese discs soaked in thickened kesar-pistachio milk.', 95, '/src/assets/images/dish_gulab_jamun_1795337580180.jpg', 0),

  (8, 'Fresh Lime Juice', 'Chilled hand-pressed lime cooler with bruised mint leaves and light cane syrup.', 50, '/src/assets/images/dish_fresh_lime_juice_1795337580925.jpg', 1),
  (8, 'Mint Masala Soda', 'Sparkling lime soda spiced with roasted cumin, black salt, and garden mint.', 60, '/src/assets/images/dish_fresh_lime_juice_1795337580925.jpg', 1),

  (10, 'Tandoori Paneer Tikka', 'Charcoal-roasted paneer cubes marinated in hung curd, Kashmiri chili, and ajwain.', 170, '/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg', 1),
  (10, 'Smoky Chicken Tikka', 'Boneless chicken skewers grilled over embers with mint-coriander chutney.', 195, '/src/assets/images/dish_chicken_biriyani_1795337580667.jpg', 1);

INSERT INTO Users (name, email, password_hash, phone, address, role) VALUES
  ('Arjun Mehta', 'arjun.mehta@example.in', '!DEMO_SEED_LOCKED', '+91 98401 11223', '42 Cathedral Road, Gopalapuram, Chennai 600086', 'customer'),
  ('Priya Krishnan', 'priya.krishnan@example.in', '!DEMO_SEED_LOCKED', '+91 98840 44556', '18 Indiranagar 100 Feet Rd, Bengaluru 560038', 'customer'),
  ('Rohan Kulkarni', 'rohan.kulkarni@example.in', '!DEMO_SEED_LOCKED', '+91 97650 77889', '74 Bandra West, Pali Hill, Mumbai 400050', 'customer'),
  ('Sneha Reddy', 'sneha.reddy@example.in', '!DEMO_SEED_LOCKED', '+91 99490 22334', '12 Jubilee Hills Road No. 36, Hyderabad 500033', 'customer'),
  ('Vikram Nair', 'vikram.nair@example.in', '!DEMO_SEED_LOCKED', '+91 98110 66778', '9 Hauz Khas Enclave, New Delhi 110016', 'customer');

INSERT INTO Orders (user_id, customer_name, phone, order_date, total_amount, delivery_address, payment_method, order_status) VALUES
  (1, 'Arjun Mehta', '+91 98401 11223', datetime('now', '-6 days'), 460, '42 Cathedral Road, Gopalapuram, Chennai 600086', 'UPI Demo', 'Delivered'),
  (2, 'Priya Krishnan', '+91 98840 44556', datetime('now', '-5 days'), 405, '18 Indiranagar 100 Feet Rd, Bengaluru 560038', 'Card Demo', 'Delivered'),
  (3, 'Rohan Kulkarni', '+91 97650 77889', datetime('now', '-4 days'), 320, '74 Bandra West, Pali Hill, Mumbai 400050', 'Cash on Delivery', 'Delivered'),
  (4, 'Sneha Reddy', '+91 99490 22334', datetime('now', '-3 days'), 545, '12 Jubilee Hills Road No. 36, Hyderabad 500033', 'UPI Demo', 'Delivered'),
  (5, 'Vikram Nair', '+91 98110 66778', datetime('now', '-2 days'), 240, '9 Hauz Khas Enclave, New Delhi 110016', 'Card Demo', 'Cancelled'),
  (1, 'Arjun Mehta', '+91 98401 11223', datetime('now', '-1 day'), 360, '42 Cathedral Road, Gopalapuram, Chennai 600086', 'UPI Demo', 'Delivered'),
  (2, 'Priya Krishnan', '+91 98840 44556', datetime('now', '-12 hours'), 310, '18 Indiranagar 100 Feet Rd, Bengaluru 560038', 'Cash on Delivery', 'Out for Delivery'),
  (3, 'Rohan Kulkarni', '+91 97650 77889', datetime('now', '-4 hours'), 420, '74 Bandra West, Pali Hill, Mumbai 400050', 'UPI Demo', 'Preparing'),
  (4, 'Sneha Reddy', '+91 99490 22334', datetime('now', '-2 hours'), 290, '12 Jubilee Hills Road No. 36, Hyderabad 500033', 'Card Demo', 'Confirmed'),
  (5, 'Vikram Nair', '+91 98110 66778', datetime('now', '-30 minutes'), 260, '9 Hauz Khas Enclave, New Delhi 110016', 'Cash on Delivery', 'Order Placed');

INSERT INTO Order_Items (order_id, food_id, quantity, price) VALUES
  (1, 11, 2, 180),
  (1, 25, 2, 50),
  (2, 5, 1, 160),
  (2, 6, 1, 120),
  (2, 23, 1, 75),
  (2, 25, 1, 50),
  (3, 1, 2, 70),
  (3, 20, 1, 130),
  (3, 25, 1, 50),
  (4, 17, 1, 240),
  (4, 11, 1, 180),
  (4, 23, 1, 75),
  (4, 25, 1, 50),
  (5, 17, 1, 240),
  (6, 11, 2, 180),
  (7, 20, 2, 130),
  (7, 25, 1, 50),
  (8, 12, 1, 260),
  (8, 5, 1, 160),
  (9, 18, 1, 190),
  (9, 25, 2, 50),
  (10, 1, 2, 70),
  (10, 6, 1, 120);

INSERT INTO Payments (order_id, payment_method, payment_status, amount, payment_date) VALUES
  (1, 'UPI Demo', 'Paid', 460, datetime('now', '-6 days')),
  (2, 'Card Demo', 'Paid', 405, datetime('now', '-5 days')),
  (3, 'Cash on Delivery', 'Paid', 320, datetime('now', '-4 days')),
  (4, 'UPI Demo', 'Paid', 545, datetime('now', '-3 days')),
  (5, 'Card Demo', 'Refunded', 240, datetime('now', '-2 days')),
  (6, 'UPI Demo', 'Paid', 360, datetime('now', '-1 day')),
  (7, 'Cash on Delivery', 'Pending', 310, datetime('now', '-12 hours')),
  (8, 'UPI Demo', 'Paid', 420, datetime('now', '-4 hours')),
  (9, 'Card Demo', 'Paid', 290, datetime('now', '-2 hours')),
  (10, 'Cash on Delivery', 'Pending', 260, datetime('now', '-30 minutes'));
