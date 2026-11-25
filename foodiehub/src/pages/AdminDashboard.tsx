import {
  BarChart3,
  Database,
  Download,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiRequest, DISH_IMAGE_GALLERY, formatINR } from '../api';
import { DishImage } from '../components/DishImage';
import { InvoiceModal } from '../components/InvoiceModal';
import type {
  AdminAnalytics,
  Category,
  CustomerSummary,
  FoodItem,
  Order,
  OrderStatus,
  User,
} from '../types';

type AdminTab = 'overview' | 'foods' | 'categories' | 'orders' | 'customers' | 'reports';

const ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

interface AdminDashboardProps {
  currentUser: User | null;
  authToken: string | null;
  onAdminAuthSuccess: (token: string, user: User) => void;
  onLogout: () => void;
  onCatalogMutated: () => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function AdminDashboard({
  currentUser,
  authToken,
  onAdminAuthSuccess,
  onLogout,
  onCatalogMutated,
  onNotify,
}: AdminDashboardProps) {
  const isAdmin = Boolean(currentUser && currentUser.role === 'admin' && authToken);

  // Admin auth/setup state
  const [adminStatus, setAdminStatus] = useState<{
    loaded: boolean;
    configured: boolean;
    envManaged: boolean;
    adminEmail?: string | null;
  }>({ loaded: false, configured: true, envManaged: false, adminEmail: null });
  const [authName, setAuthName] = useState('FoodieHub Admin');
  const [authEmail, setAuthEmail] = useState('admin@foodiehub.in');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Admin data state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Filters
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Food Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [formFoodName, setFormFoodName] = useState('');
  const [formFoodCategory, setFormFoodCategory] = useState<number>(1);
  const [formFoodPrice, setFormFoodPrice] = useState('');
  const [formFoodDesc, setFormFoodDesc] = useState('');
  const [formFoodImage, setFormFoodImage] = useState<string>(DISH_IMAGE_GALLERY[0].url);
  const [formFoodAvailable, setFormFoodAvailable] = useState(true);
  const [savingFood, setSavingFood] = useState(false);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Invoice Modal
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      apiRequest<{ configured: boolean; envManaged: boolean; adminEmail?: string | null }>(
        '/api/auth/admin-status'
      )
        .then((res) => {
          setAdminStatus({
            loaded: true,
            configured: res.configured,
            envManaged: res.envManaged,
            adminEmail: res.adminEmail,
          });
          if (res.adminEmail) {
            setAuthEmail(res.adminEmail);
          }
        })
        .catch(() => {
          setAdminStatus({ loaded: true, configured: true, envManaged: false });
        });
    }
  }, [isAdmin]);

  const loadAdminData = useCallback(async () => {
    if (!authToken) return;
    setLoadingData(true);
    try {
      const [analyticsRes, foodsRes, catRes, ordersRes, custRes] = await Promise.all([
        apiRequest<AdminAnalytics>('/api/admin/analytics', { token: authToken }),
        apiRequest<{ foods: FoodItem[] }>('/api/foods'),
        apiRequest<{ categories: Category[] }>('/api/categories'),
        apiRequest<{ orders: Order[] }>(
          `/api/admin/orders?search=${encodeURIComponent(orderSearch)}&status=${encodeURIComponent(
            orderStatusFilter
          )}`,
          { token: authToken }
        ),
        apiRequest<{ customers: CustomerSummary[] }>(
          `/api/admin/customers?search=${encodeURIComponent(customerSearch)}`,
          { token: authToken }
        ),
      ]);
      setAnalytics(analyticsRes);
      setFoods(foodsRes.foods);
      setCategories(catRes.categories);
      setOrders(ordersRes.orders);
      setCustomers(custRes.customers);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoadingData(false);
    }
  }, [authToken, orderSearch, orderStatusFilter, customerSearch, onNotify]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  const handleAdminAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (!adminStatus.configured) {
        const res = await apiRequest<{ token: string; user: User }>('/api/auth/admin/setup', {
          method: 'POST',
          body: { name: authName, email: authEmail, password: authPassword },
        });
        onAdminAuthSuccess(res.token, res.user);
        onNotify('success', 'Admin account initialized and signed in.');
      } else {
        const res = await apiRequest<{ token: string; user: User }>('/api/auth/admin/login', {
          method: 'POST',
          body: { email: authEmail, password: authPassword },
        });
        onAdminAuthSuccess(res.token, res.user);
        onNotify('success', 'Signed in to Admin Console.');
      }
      setAuthPassword('');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Food CRUD handlers
  const openAddFoodModal = () => {
    setEditingFood(null);
    setFormFoodName('');
    setFormFoodCategory(categories[0]?.category_id ?? 1);
    setFormFoodPrice('');
    setFormFoodDesc('');
    setFormFoodImage(DISH_IMAGE_GALLERY[0].url);
    setFormFoodAvailable(true);
    setFoodModalOpen(true);
  };

  const openEditFoodModal = (food: FoodItem) => {
    setEditingFood(food);
    setFormFoodName(food.food_name);
    setFormFoodCategory(food.category_id);
    setFormFoodPrice(String(food.price));
    setFormFoodDesc(food.description);
    setFormFoodImage(food.image_url);
    setFormFoodAvailable(food.availability === 1);
    setFoodModalOpen(true);
  };

  const handleSaveFood = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setSavingFood(true);
    try {
      const payload = {
        category_id: formFoodCategory,
        food_name: formFoodName,
        description: formFoodDesc,
        price: Number(formFoodPrice),
        image_url: formFoodImage,
        availability: formFoodAvailable ? 1 : 0,
      };
      if (editingFood) {
        await apiRequest(`/api/admin/foods/${editingFood.food_id}`, {
          method: 'PUT',
          token: authToken,
          body: payload,
        });
        onNotify('success', `Updated "${formFoodName}".`);
      } else {
        await apiRequest('/api/admin/foods', {
          method: 'POST',
          token: authToken,
          body: payload,
        });
        onNotify('success', `Added "${formFoodName}" to menu.`);
      }
      setFoodModalOpen(false);
      await Promise.all([loadAdminData(), onCatalogMutated()]);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not save food item.');
    } finally {
      setSavingFood(false);
    }
  };

  const handleToggleAvailability = async (food: FoodItem) => {
    if (!authToken) return;
    try {
      await apiRequest(`/api/admin/foods/${food.food_id}`, {
        method: 'PUT',
        token: authToken,
        body: {
          category_id: food.category_id,
          food_name: food.food_name,
          description: food.description,
          price: food.price,
          image_url: food.image_url,
          availability: food.availability === 1 ? 0 : 1,
        },
      });
      await Promise.all([loadAdminData(), onCatalogMutated()]);
      onNotify(
        'info',
        `${food.food_name} marked as ${food.availability === 1 ? 'Unavailable' : 'Available'}.`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not update availability.');
    }
  };

  const handleDeleteFood = async (food: FoodItem) => {
    if (!authToken) return;
    try {
      await apiRequest(`/api/admin/foods/${food.food_id}`, {
        method: 'DELETE',
        token: authToken,
      });
      await Promise.all([loadAdminData(), onCatalogMutated()]);
      onNotify('success', `Deleted "${food.food_name}".`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to delete food item.');
    }
  };

  // Category CRUD
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken || !newCategoryName.trim()) return;
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        token: authToken,
        body: { category_name: newCategoryName.trim() },
      });
      setNewCategoryName('');
      await Promise.all([loadAdminData(), onCatalogMutated()]);
      onNotify('success', 'New category created.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to add category.');
    }
  };

  const handleSaveCategoryRename = async (categoryId: number) => {
    if (!authToken || !editingCatName.trim()) return;
    try {
      await apiRequest(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        token: authToken,
        body: { category_name: editingCatName.trim() },
      });
      setEditingCatId(null);
      await Promise.all([loadAdminData(), onCatalogMutated()]);
      onNotify('success', 'Category renamed.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to rename category.');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!authToken) return;
    try {
      await apiRequest(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        token: authToken,
      });
      await Promise.all([loadAdminData(), onCatalogMutated()]);
      onNotify('success', 'Category deleted.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to delete category.');
    }
  };

  // Order status update
  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    if (!authToken) return;
    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        token: authToken,
        body: { order_status: status },
      });
      await loadAdminData();
      onNotify('success', `Order #${orderId} updated to "${status}".`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to update order status.');
    }
  };

  // Unauthenticated / First-run setup gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
        <div className="border border-zinc-200 rounded-2xl p-6 sm:p-8 bg-white">
          <div className="w-11 h-11 rounded-xl bg-zinc-950 text-orange-400 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" />
          </div>

          {!adminStatus.loaded ? (
            <p className="text-sm text-zinc-600">Checking admin configuration...</p>
          ) : !adminStatus.configured ? (
            <>
              <h1 className="font-display text-2xl font-bold text-zinc-950">
                First-Run Admin Setup
              </h1>
              <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                No admin password has been claimed yet. Choose your administrator email and password
                below to secure the FoodieHub management console.
              </p>

              <form onSubmit={handleAdminAuthSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Admin Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Create Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Initializing Admin...' : 'Claim Admin Access'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-zinc-950">Admin Console Sign In</h1>
              <p className="text-xs text-zinc-600 mt-1.5">
                Authorized personnel only. Manage dishes, categories, customer records, orders, and
                revenue analytics.
              </p>

              <form onSubmit={handleAdminAuthSubmit} className="mt-6 space-y-4">
                {!adminStatus.envManaged && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    {adminStatus.envManaged ? 'Admin Passcode' : 'Admin Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 bg-zinc-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Verifying...' : 'Sign In to Admin'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  const filteredFoods = foods.filter((f) => {
    const matchesCat =
      foodCategoryFilter === 'all' || String(f.category_id) === foodCategoryFilter;
    const matchesSearch =
      !foodSearch.trim() ||
      f.food_name.toLowerCase().includes(foodSearch.toLowerCase()) ||
      f.category_name.toLowerCase().includes(foodSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const navTabs: Array<{ id: AdminTab; label: string; Icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { id: 'foods', label: 'Food Items', Icon: UtensilsCrossed },
    { id: 'categories', label: 'Categories', Icon: FolderKanban },
    { id: 'orders', label: 'Orders', Icon: ShoppingBag },
    { id: 'customers', label: 'Customers', Icon: Users },
    { id: 'reports', label: 'Sales & SQL', Icon: BarChart3 },
  ];

  const maxDailyRevenue = Math.max(
    1,
    ...(analytics?.dailySales.map((d) => d.revenue) ?? [1])
  );
  const maxCategoryRevenue = Math.max(
    1,
    ...(analytics?.salesByCategory.map((c) => c.revenue) ?? [1])
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 flex flex-col lg:flex-row">
      {/* Admin Dark Sidebar */}
      <aside className="lg:w-60 bg-zinc-950 text-zinc-200 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 flex flex-col justify-between">
        <div className="p-4 lg:p-5">
          <div className="px-2 pb-4 border-b border-zinc-800 hidden lg:block">
            <p className="font-display text-sm font-bold text-white">Kitchen Operations</p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{currentUser?.email}</p>
          </div>

          <nav
            className="flex lg:flex-col gap-1 overflow-x-auto lg:mt-4"
            aria-label="Admin sections"
          >
            {navTabs.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-orange-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800 hidden lg:block">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div>
            <p className="text-xs text-zinc-500">
              FoodieHub Admin /{' '}
              <span className="text-zinc-900 font-semibold">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </span>
            </p>
            <h1 className="font-display text-2xl font-bold text-zinc-950 mt-0.5">
              {navTabs.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadAdminData}
              className="px-3.5 py-2 border border-zinc-300 bg-white hover:border-zinc-950 text-xs font-semibold text-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              {loadingData ? 'Syncing...' : 'Refresh Data'}
            </button>
            <button
              type="button"
              onClick={openAddFoodModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Item</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <p className="text-xs font-medium text-zinc-500">Total Revenue</p>
                <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                  {formatINR(analytics.summary.total_revenue)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Excludes cancelled orders</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <p className="text-xs font-medium text-zinc-500">Total Orders</p>
                <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                  {analytics.summary.total_orders}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Stored in Orders table</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <p className="text-xs font-medium text-zinc-500">Registered Customers</p>
                <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                  {analytics.summary.total_customers}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Active customer accounts</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <p className="text-xs font-medium text-zinc-500">Menu Food Items</p>
                <p className="font-mono text-2xl font-bold text-zinc-950 mt-1 tabular-nums">
                  {analytics.summary.total_food_items}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Across {categories.length} categories</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Daily Revenue SVG Chart */}
              <div className="xl:col-span-7 bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-zinc-950">
                      Daily Revenue Trend
                    </h2>
                    <p className="text-xs text-zinc-500">Grouped by order date (INR)</p>
                  </div>
                </div>

                {analytics.dailySales.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-8 text-center">No sales records yet.</p>
                ) : (
                  <div className="h-56 flex items-end gap-2 pt-4">
                    {analytics.dailySales.map((day) => {
                      const heightPct = Math.max(8, Math.round((day.revenue / maxDailyRevenue) * 100));
                      return (
                        <div
                          key={day.day}
                          className="flex-1 flex flex-col items-center gap-2 min-w-0 group"
                        >
                          <div className="w-full flex flex-col items-center justify-end h-44">
                            <span className="text-[11px] font-mono tabular-nums text-zinc-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {formatINR(day.revenue)}
                            </span>
                            <div
                              className="w-full max-w-[38px] bg-orange-600 hover:bg-zinc-950 rounded-t-md transition-colors"
                              style={{ height: `${heightPct}%` }}
                              title={`${day.day}: ${formatINR(day.revenue)} (${day.orders_count} orders)`}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500 truncate w-full text-center tabular-nums">
                            {day.day.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Status Overview + Category Breakdown */}
              <div className="xl:col-span-5 bg-white border border-zinc-200 rounded-xl p-5 space-y-5">
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    Order Status Overview
                  </h2>
                  <p className="text-xs text-zinc-500">Live distribution across all orders</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {ORDER_STATUSES.map((status) => {
                    const count =
                      analytics.statusBreakdown.find((s) => s.order_status === status)?.count ?? 0;
                    return (
                      <div
                        key={status}
                        className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-zinc-700 truncate">{status}</span>
                        <span className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Most Popular Dishes & Recent Orders */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-5 bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-200">
                  <h2 className="font-display text-base font-bold text-zinc-950">
                    Most Popular Food Items
                  </h2>
                  <p className="text-xs text-zinc-500">Aggregated from Order_Items × Food_Items</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="text-left py-2.5 px-4 font-semibold">Dish</th>
                        <th className="text-right py-2.5 px-3 font-semibold">Sold</th>
                        <th className="text-right py-2.5 px-4 font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {analytics.popularDishes.map((dish) => (
                        <tr key={dish.food_id} className="hover:bg-zinc-50">
                          <td className="py-2.5 px-4">
                            <p className="font-medium text-zinc-950">{dish.food_name}</p>
                            <p className="text-xs text-zinc-500">{dish.category_name}</p>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-700">
                            {dish.units_sold}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-950">
                            {formatINR(dish.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="xl:col-span-7 bg-white border border-zinc-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-zinc-950">Recent Orders</h2>
                    <p className="text-xs text-zinc-500">Latest customer transactions</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    Manage All Orders
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                      <tr>
                        <th className="text-left py-2.5 px-4 font-semibold">Order</th>
                        <th className="text-left py-2.5 px-3 font-semibold">Customer</th>
                        <th className="text-left py-2.5 px-3 font-semibold">Status</th>
                        <th className="text-right py-2.5 px-4 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {analytics.recentOrders.map((ord) => (
                        <tr key={ord.order_id} className="hover:bg-zinc-50">
                          <td className="py-2.5 px-4 font-mono font-semibold text-zinc-950 tabular-nums">
                            #{ord.order_id}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-medium text-zinc-900">{ord.customer_name}</p>
                            <p className="text-xs text-zinc-500">{ord.payment_method}</p>
                          </td>
                          <td className="py-2.5 px-3 text-xs font-medium text-zinc-800">
                            {ord.order_status}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-950">
                            {formatINR(ord.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOOD ITEMS CRUD */}
        {activeTab === 'foods' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-zinc-200 rounded-xl p-4">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>

              <select
                value={foodCategoryFilter}
                onChange={(e) => setFoodCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-600"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={String(cat.category_id)}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Dish</th>
                      <th className="text-left py-3 px-3 font-semibold">Category</th>
                      <th className="text-right py-3 px-3 font-semibold">Price</th>
                      <th className="text-left py-3 px-3 font-semibold">Availability</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredFoods.map((food) => (
                      <tr key={food.food_id} className="hover:bg-zinc-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <DishImage
                              src={food.image_url}
                              alt={food.food_name}
                              className="w-12 h-10 rounded-md object-cover shrink-0 bg-zinc-100"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-950">{food.food_name}</p>
                              <p className="text-xs text-zinc-500 line-clamp-1 max-w-md">
                                {food.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium text-zinc-700">
                          {food.category_name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-zinc-950">
                          {formatINR(food.price)}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(food)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                              food.availability === 1
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                            }`}
                          >
                            {food.availability === 1 ? 'Available' : 'Sold Out'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditFoodModal(food)}
                              className="p-2 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg cursor-pointer"
                              aria-label={`Edit ${food.food_name}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFood(food)}
                              className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              aria-label={`Delete ${food.food_name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES CRUD */}
        {activeTab === 'categories' && (
          <div className="max-w-3xl space-y-5">
            <form
              onSubmit={handleAddCategory}
              className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name (e.g., South Indian Combos)"
                className="flex-1 px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Add Category
              </button>
            </form>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">ID</th>
                    <th className="text-left py-3 px-3 font-semibold">Category Name</th>
                    <th className="text-right py-3 px-3 font-semibold">Dishes</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {categories.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500 tabular-nums">
                        #{cat.category_id}
                      </td>
                      <td className="py-3 px-3">
                        {editingCatId === cat.category_id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              className="px-2.5 py-1 border border-orange-500 rounded text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveCategoryRename(cat.category_id)}
                              className="px-2.5 py-1 bg-zinc-950 text-white text-xs rounded cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="px-2 py-1 text-xs text-zinc-500 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-zinc-950">{cat.category_name}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-700">
                        {cat.item_count ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.category_id);
                              setEditingCatName(cat.category_name);
                            }}
                            className="p-2 text-zinc-600 hover:text-zinc-950 rounded-lg cursor-pointer"
                            aria-label={`Rename ${cat.category_name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.category_id)}
                            className="p-2 text-zinc-500 hover:text-red-600 rounded-lg cursor-pointer"
                            aria-label={`Delete ${cat.category_name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by Order ID, customer, email..."
                  className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-600"
              >
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                      <th className="text-left py-3 px-3 font-semibold">Customer & Address</th>
                      <th className="text-left py-3 px-3 font-semibold">Items</th>
                      <th className="text-left py-3 px-3 font-semibold">Payment</th>
                      <th className="text-right py-3 px-3 font-semibold">Total</th>
                      <th className="text-left py-3 px-3 font-semibold">Order Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orders.map((ord) => (
                      <tr key={ord.order_id} className="hover:bg-zinc-50 align-top">
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-950 tabular-nums">
                          #{ord.order_id}
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          <p className="font-semibold text-zinc-950">{ord.customer_name}</p>
                          <p className="text-xs text-zinc-500">{ord.phone}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                            {ord.delivery_address}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-xs text-zinc-700">
                          {ord.items.map((item) => (
                            <div key={item.order_item_id} className="tabular-nums">
                              {item.quantity}× {item.food_name}
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-3 text-xs">
                          <p className="font-medium text-zinc-900">{ord.payment_method}</p>
                          <p className="text-zinc-500 mt-0.5">{ord.payment_status ?? 'Pending'}</p>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-zinc-950">
                          {formatINR(ord.total_amount)}
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={ord.order_status}
                            onChange={(e) =>
                              handleStatusChange(ord.order_id, e.target.value as OrderStatus)
                            }
                            className="px-2.5 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold bg-white text-zinc-900 focus:outline-none focus:border-orange-600 cursor-pointer"
                            aria-label={`Update status for order ${ord.order_id}`}
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInvoiceOrder(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-zinc-300 hover:border-zinc-950 rounded-lg text-xs font-semibold text-zinc-800 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMERS */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, email, phone..."
                  className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">User ID</th>
                      <th className="text-left py-3 px-3 font-semibold">Customer</th>
                      <th className="text-left py-3 px-3 font-semibold">Phone</th>
                      <th className="text-left py-3 px-3 font-semibold">Delivery Address</th>
                      <th className="text-right py-3 px-3 font-semibold">Orders</th>
                      <th className="text-right py-3 px-4 font-semibold">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {customers.map((cust) => (
                      <tr key={cust.user_id} className="hover:bg-zinc-50">
                        <td className="py-3 px-4 font-mono text-xs text-zinc-500 tabular-nums">
                          #{cust.user_id}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-zinc-950">{cust.name}</p>
                          <p className="text-xs text-zinc-500">{cust.email}</p>
                        </td>
                        <td className="py-3 px-3 text-xs font-mono text-zinc-700 tabular-nums">
                          {cust.phone}
                        </td>
                        <td className="py-3 px-3 text-xs text-zinc-600 max-w-xs">{cust.address}</td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-800">
                          {cust.order_count}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-zinc-950">
                          {formatINR(cust.total_spent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SALES & SQL REPORTS */}
        {activeTab === 'reports' && analytics && (
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-zinc-950">
                    Revenue Breakdown by Category
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Computed using SQL LEFT JOIN across Categories, Food_Items, Order_Items, and Orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const header = 'Category ID,Category Name,Units Sold,Revenue (INR)\n';
                    const rows = analytics.salesByCategory
                      .map((c) => `${c.category_id},"${c.category_name.replace(/"/g, '""')}",${c.units_sold},${c.revenue}`)
                      .join('\n');
                    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'foodiehub_sales_report.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                    onNotify('success', 'Exported foodiehub_sales_report.csv');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-zinc-300 hover:border-zinc-950 text-xs font-semibold text-zinc-900 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV Report</span>
                </button>
              </div>

              <div className="space-y-3">
                {analytics.salesByCategory.map((cat) => {
                  const pct = Math.round((cat.revenue / maxCategoryRevenue) * 100);
                  return (
                    <div key={cat.category_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900">{cat.category_name}</span>
                        <span className="font-mono text-zinc-700 tabular-nums">
                          {cat.units_sold} units · {formatINR(cat.revenue)}
                        </span>
                      </div>
                      <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-600 rounded-full"
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-orange-400" />
                <h2 className="font-display text-lg font-bold text-white">
                  Normalized Relational Database Schema
                </h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                FoodieHub enforces relational integrity with Primary Keys, Foreign Keys (PRAGMA
                foreign_keys = ON), CHECK constraints, and atomic SQL transactions on order placement
                and cancellation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                {[
                  {
                    table: 'Users',
                    cols: 'user_id (PK), name, email (UNIQUE), password_hash, phone, address, role',
                  },
                  {
                    table: 'Categories',
                    cols: 'category_id (PK), category_name (UNIQUE)',
                  },
                  {
                    table: 'Food_Items',
                    cols: 'food_id (PK), category_id (FK → Categories), food_name, description, price, image_url, availability',
                  },
                  {
                    table: 'Orders',
                    cols: 'order_id (PK), user_id (FK → Users), order_date, total_amount, delivery_address, payment_method, order_status',
                  },
                  {
                    table: 'Order_Items',
                    cols: 'order_item_id (PK), order_id (FK → Orders), food_id (FK → Food_Items), quantity, price',
                  },
                  {
                    table: 'Payments',
                    cols: 'payment_id (PK), order_id (FK → Orders), payment_method, payment_status, amount, payment_date',
                  },
                ].map((schema) => (
                  <div key={schema.table} className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <p className="text-orange-400 font-semibold mb-1.5">{schema.table}</p>
                    <p className="text-zinc-300 leading-relaxed">{schema.cols}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Food Item Modal */}
      {foodModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={editingFood ? 'Edit Food Item' : 'Add New Food Item'}
        >
          <div className="bg-white rounded-xl border border-zinc-200 max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-zinc-950">
                {editingFood ? `Edit ${editingFood.food_name}` : 'Add New Food Item'}
              </h3>
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-zinc-950 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={formFoodName}
                  onChange={(e) => setFormFoodName(e.target.value)}
                  placeholder="e.g. Chicken 65 Biriyani"
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Category</label>
                  <select
                    value={formFoodCategory}
                    onChange={(e) => setFormFoodCategory(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Price (INR ₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={formFoodPrice}
                    onChange={(e) => setFormFoodPrice(e.target.value)}
                    placeholder="180"
                    className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm font-mono focus:outline-none focus:border-orange-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={formFoodDesc}
                  onChange={(e) => setFormFoodDesc(e.target.value)}
                  placeholder="Describe ingredients, spices, and accompaniment..."
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Dish Photo Preset or Image URL
                </label>
                <select
                  value={
                    DISH_IMAGE_GALLERY.some((g) => g.url === formFoodImage) ? formFoodImage : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') setFormFoodImage(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white mb-2 focus:outline-none focus:border-orange-600"
                >
                  {DISH_IMAGE_GALLERY.map((item) => (
                    <option key={item.url} value={item.url}>
                      Preset: {item.label}
                    </option>
                  ))}
                  <option value="custom">Custom HTTPS URL</option>
                </select>
                <input
                  type="text"
                  required
                  value={formFoodImage}
                  onChange={(e) => setFormFoodImage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-600"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFoodAvailable}
                  onChange={(e) => setFormFoodAvailable(e.target.checked)}
                  className="accent-orange-600"
                />
                <span>Available for ordering</span>
              </label>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 text-xs font-semibold text-zinc-700 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFood}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingFood ? 'Saving...' : editingFood ? 'Update Dish' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
}
