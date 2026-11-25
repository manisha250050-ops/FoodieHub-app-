import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './api';
import { CartDrawer } from './components/CartDrawer';
import { Navbar } from './components/Navbar';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import type { AppRoute, CartItem, Category, FoodItem, Order, ToastMessage, User } from './types';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');

  // Public catalog state
  const [categories, setCategories] = useState<Category[]>([]);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [menuFoods, setMenuFoods] = useState<FoodItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Menu filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // Cart state (client-side shopping bag)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // In-memory auth session state (Bearer token kept strictly in React memory)
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Customer Orders state
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((type: ToastMessage['type'], text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const [catRes, foodRes] = await Promise.all([
        apiRequest<{ categories: Category[] }>('/api/categories'),
        apiRequest<{ foods: FoodItem[] }>('/api/foods'),
      ]);
      setCategories(catRes.categories);
      setAllFoods(foodRes.foods);
    } catch {
      notify('error', 'Failed to load restaurant menu from database.');
    }
  }, [notify]);

  const loadFilteredMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategoryId) params.set('category_id', String(selectedCategoryId));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (availableOnly) params.set('available_only', 'true');
      if (sortBy) params.set('sort', sortBy);

      const res = await apiRequest<{ foods: FoodItem[] }>(`/api/foods?${params.toString()}`);
      setMenuFoods(res.foods);
    } catch {
      notify('error', 'Could not fetch filtered dishes.');
    } finally {
      setMenuLoading(false);
    }
  }, [selectedCategoryId, searchQuery, availableOnly, sortBy, notify]);

  const loadCustomerOrders = useCallback(async (tokenOverride?: string) => {
    const activeToken = tokenOverride ?? customerToken;
    if (!activeToken) return;
    try {
      const res = await apiRequest<{ orders: Order[] }>('/api/orders/my', {
        token: activeToken,
      });
      setCustomerOrders(res.orders);
    } catch {
      // Handled gracefully
    }
  }, [customerToken]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadFilteredMenu();
  }, [loadFilteredMenu]);

  // Cart operations
  const handleAddToCart = (food: FoodItem) => {
    if (food.availability !== 1) {
      notify('error', `${food.food_name} is currently out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.food.food_id === food.food_id);
      if (existing) {
        return prev.map((item) =>
          item.food.food_id === food.food_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { food, quantity: 1 }];
    });
    notify('success', `Added ${food.food_name} to your cart.`);
  };

  const handleUpdateQty = (foodId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.food.food_id === foodId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (foodId: number) => {
    setCart((prev) => prev.filter((item) => item.food.food_id !== foodId));
  };

  const handleExploreMenu = (options?: { categoryId?: number | null; search?: string }) => {
    if (options?.categoryId !== undefined) {
      setSelectedCategoryId(options.categoryId);
    }
    if (options?.search !== undefined) {
      setSearchQuery(options.search);
    }
    setRoute('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomerAuthSuccess = async (token: string, user: User) => {
    setCustomerToken(token);
    setCustomerUser(user);
    await loadCustomerOrders(token);
  };

  const handleCustomerLogout = () => {
    setCustomerToken(null);
    setCustomerUser(null);
    setCustomerOrders([]);
    setSelectedOrder(null);
    notify('info', 'Signed out of your customer account.');
  };

  const handleAdminAuthSuccess = (token: string, user: User) => {
    setAdminToken(token);
    setAdminUser(user);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    notify('info', 'Signed out of Admin Console.');
  };

  const handleOrderPlaced = async (order: Order) => {
    setCart([]);
    setSelectedOrder(order);
    await loadCustomerOrders();
    setRoute('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <Navbar
        route={route}
        onNavigate={(next) => {
          setRoute(next);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        currentUser={customerUser}
      />

      <main className="flex-1">
        {route === 'home' && (
          <HomePage
            categories={categories}
            foods={allFoods}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
            onExploreMenu={handleExploreMenu}
          />
        )}

        {route === 'menu' && (
          <MenuPage
            categories={categories}
            foods={menuFoods}
            loading={menuLoading}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availableOnly={availableOnly}
            onAvailableOnlyChange={setAvailableOnly}
            sortBy={sortBy}
            onSortChange={setSortBy}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQty={handleUpdateQty}
          />
        )}

        {route === 'checkout' && (
          <CheckoutPage
            cart={cart}
            currentUser={customerUser}
            authToken={customerToken}
            onAuthSuccess={handleCustomerAuthSuccess}
            onOrderPlaced={handleOrderPlaced}
            onBackToMenu={() => setRoute('menu')}
            onNotify={notify}
          />
        )}

        {route === 'orders' && (
          <OrderTrackingPage
            currentUser={customerUser}
            authToken={customerToken}
            orders={customerOrders}
            selectedOrder={selectedOrder}
            onSelectOrder={setSelectedOrder}
            onRefreshOrders={() => loadCustomerOrders()}
            onGoToAccount={() => setRoute('account')}
            onNotify={notify}
          />
        )}

        {route === 'account' && (
          <AccountPage
            currentUser={customerUser}
            authToken={customerToken}
            ordersCount={customerOrders.length}
            onAuthSuccess={handleCustomerAuthSuccess}
            onUserUpdated={setCustomerUser}
            onLogout={handleCustomerLogout}
            onViewOrders={() => setRoute('orders')}
            onNotify={notify}
          />
        )}

        {route === 'admin' && (
          <AdminDashboard
            currentUser={adminUser}
            authToken={adminToken}
            onAdminAuthSuccess={handleAdminAuthSuccess}
            onLogout={handleAdminLogout}
            onCatalogMutated={async () => {
              await Promise.all([loadCatalog(), loadFilteredMenu()]);
            }}
            onNotify={notify}
          />
        )}
      </main>

      {route !== 'admin' && (
        <footer className="border-t border-zinc-200 bg-zinc-50 py-8 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <p className="font-medium text-zinc-700">
              FoodieHub · Online Food Ordering Database System
            </p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setRoute('menu')}
                className="hover:text-zinc-950 transition-colors cursor-pointer"
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setRoute('orders')}
                className="hover:text-zinc-950 transition-colors cursor-pointer"
              >
                Track Order
              </button>
              <button
                type="button"
                onClick={() => setRoute('admin')}
                className="hover:text-zinc-950 transition-colors cursor-pointer"
              >
                Admin Console
              </button>
            </div>
          </div>
        </footer>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onBrowseMenu={() => setRoute('menu')}
        onProceedCheckout={() => setRoute('checkout')}
      />

      {/* Toast Notification Stack */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none no-print"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm bg-white ${
              toast.type === 'error'
                ? 'border-red-200 text-red-900'
                : toast.type === 'success'
                  ? 'border-emerald-200 text-zinc-950'
                  : 'border-zinc-200 text-zinc-900'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            )}
            {toast.type === 'error' && (
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            )}
            {toast.type === 'info' && <Info className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />}
            <p className="flex-1 text-xs font-medium leading-relaxed">{toast.text}</p>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
