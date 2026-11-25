export type UserRole = 'customer' | 'admin';

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  item_count?: number;
}

export interface FoodItem {
  food_id: number;
  category_id: number;
  category_name: string;
  food_name: string;
  description: string;
  price: number;
  image_url: string;
  availability: 0 | 1;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

export type PaymentMethod = 'Cash on Delivery' | 'UPI Demo' | 'Card Demo';

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItemDetail {
  order_item_id: number;
  order_id: number;
  food_id: number;
  food_name: string;
  image_url: string;
  quantity: number;
  price: number;
}

export interface Order {
  order_id: number;
  user_id: number;
  customer_name: string;
  customer_email?: string;
  phone: string;
  order_date: string;
  total_amount: number;
  delivery_address: string;
  payment_method: PaymentMethod;
  order_status: OrderStatus;
  payment_status: 'Pending' | 'Paid' | 'Refunded' | 'Failed' | null;
  payment_date: string | null;
  items: OrderItemDetail[];
}

export interface CustomerSummary extends User {
  order_count: number;
  total_spent: number;
}

export interface AdminAnalytics {
  summary: {
    total_customers: number;
    total_food_items: number;
    total_orders: number;
    total_revenue: number;
  };
  statusBreakdown: Array<{ order_status: OrderStatus; count: number }>;
  popularDishes: Array<{
    food_id: number;
    food_name: string;
    category_name: string;
    price: number;
    units_sold: number;
    revenue: number;
  }>;
  salesByCategory: Array<{
    category_id: number;
    category_name: string;
    units_sold: number;
    revenue: number;
  }>;
  dailySales: Array<{
    day: string;
    orders_count: number;
    revenue: number;
  }>;
  recentOrders: Order[];
}

export type AppRoute = 'home' | 'menu' | 'checkout' | 'orders' | 'account' | 'admin';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}
