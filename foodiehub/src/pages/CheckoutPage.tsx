import { ArrowLeft, Banknote, CheckCircle2, CreditCard, Lock, Smartphone } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest, formatINR } from '../api';
import type { CartItem, Order, PaymentMethod, User } from '../types';

interface CheckoutPageProps {
  cart: CartItem[];
  currentUser: User | null;
  authToken: string | null;
  onAuthSuccess: (token: string, user: User) => void;
  onOrderPlaced: (order: Order) => void;
  onBackToMenu: () => void;
  onNotify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function CheckoutPage({
  cart,
  currentUser,
  authToken,
  onAuthSuccess,
  onOrderPlaced,
  onBackToMenu,
  onNotify,
}: CheckoutPageProps) {
  const [customerName, setCustomerName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.address ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI Demo');
  const [demoUpiId, setDemoUpiId] = useState('customer@okdemo');
  const [submitting, setSubmitting] = useState(false);

  // Inline quick auth state when customer is not yet logged in
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCustomerName((prev) => prev || currentUser.name);
      setPhone((prev) => prev || currentUser.phone);
      setDeliveryAddress((prev) => prev || currentUser.address);
    }
  }, [currentUser]);

  const subtotal = cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const deliveryFee = subtotal === 0 || subtotal >= 299 ? 0 : 30;
  const totalAmount = subtotal + gst + deliveryFee;

  const handleQuickAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: {
            name: authName,
            email: authEmail,
            password: authPassword,
            phone: authPhone,
            address: authAddress,
          },
        });
        onAuthSuccess(res.token, res.user);
        setCustomerName(res.user.name);
        setPhone(res.user.phone);
        setDeliveryAddress(res.user.address);
        onNotify('success', `Welcome ${res.user.name}! Your account is ready to place the order.`);
      } else {
        const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: { email: authEmail, password: authPassword },
        });
        onAuthSuccess(res.token, res.user);
        setCustomerName(res.user.name);
        setPhone(res.user.phone);
        setDeliveryAddress(res.user.address);
        onNotify('success', `Signed in as ${res.user.name}.`);
      }
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken || !currentUser) {
      onNotify('error', 'Please sign in or create an account to place your order.');
      return;
    }
    if (cart.length === 0) {
      onNotify('error', 'Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest<{ order: Order }>('/api/orders', {
        method: 'POST',
        token: authToken,
        body: {
          customer_name: customerName,
          phone,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          items: cart.map((item) => ({
            food_id: item.food.food_id,
            quantity: item.quantity,
          })),
        },
      });
      onNotify('success', `Order #${res.order.order_id} confirmed and sent to kitchen!`);
      onOrderPlaced(res.order);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-zinc-950">Checkout</h1>
        <p className="text-sm text-zinc-600 mt-2">
          Your shopping cart is currently empty. Add dishes from the menu before checking out.
        </p>
        <button
          type="button"
          onClick={onBackToMenu}
          className="mt-6 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Browse Food Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={onBackToMenu}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-950 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Menu</span>
      </button>

      <h1 className="font-display text-3xl font-bold text-zinc-950 mb-8">Checkout & Demo Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {!currentUser || currentUser.role !== 'customer' ? (
            <section className="border border-zinc-200 rounded-xl p-6 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <h2 className="font-display text-lg font-bold text-zinc-950">
                    1. Customer Sign In or Registration
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Required to link your order to your database customer profile for live tracking.
                  </p>
                </div>
                <div className="inline-flex p-1 bg-zinc-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      authMode === 'register' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
                    }`}
                  >
                    Register
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      authMode === 'login' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <form onSubmit={handleQuickAuth} className="mt-5 space-y-4">
                {authMode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Kavya Sundaram"
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.in"
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                </div>

                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Default Delivery Address
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      placeholder="Flat 4B, Anna Nagar East, Chennai 600102"
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {authLoading
                    ? 'Processing...'
                    : authMode === 'register'
                      ? 'Create Customer Account & Continue'
                      : 'Sign In & Continue'}
                </button>
              </form>
            </section>
          ) : (
            <form onSubmit={handleConfirmOrder} className="space-y-6">
              <section className="border border-zinc-200 rounded-xl p-6 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h2 className="font-display text-lg font-bold text-zinc-950">
                    Delivery Details
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Signed in as {currentUser.name}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                  />
                </div>
              </section>

              <section className="border border-zinc-200 rounded-xl p-6 bg-white space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h2 className="font-display text-lg font-bold text-zinc-950">
                    Demo Payment Method
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Simulated payment gateway for academic demonstration. No real financial details are collected or stored.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        id: 'UPI Demo',
                        label: 'UPI Demo',
                        desc: 'Instant simulated UPI',
                        Icon: Smartphone,
                      },
                      {
                        id: 'Card Demo',
                        label: 'Card Demo',
                        desc: 'Simulated card auth',
                        Icon: CreditCard,
                      },
                      {
                        id: 'Cash on Delivery',
                        label: 'Cash on Delivery',
                        desc: 'Pay at doorstep',
                        Icon: Banknote,
                      },
                    ] as const
                  ).map(({ id, label, desc, Icon }) => {
                    const active = paymentMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'border-orange-600 bg-orange-50/70'
                            : 'border-zinc-200 hover:border-zinc-400 bg-white'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mb-2 ${active ? 'text-orange-600' : 'text-zinc-500'}`}
                          aria-hidden="true"
                        />
                        <p className="text-sm font-semibold text-zinc-950">{label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'UPI Demo' && (
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Simulated Demo UPI ID
                    </label>
                    <input
                      type="text"
                      value={demoUpiId}
                      onChange={(e) => setDemoUpiId(e.target.value)}
                      className="w-full sm:w-72 px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-mono"
                    />
                    <p className="text-xs text-zinc-500 mt-1.5">
                      Marked as Paid immediately in the Payments table upon order confirmation.
                    </p>
                  </div>
                )}

                {paymentMethod === 'Card Demo' && (
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Card Demo mode simulates an instant gateway approval without requesting or storing any real
                      card numbers, CVV, or expiry dates.
                    </p>
                  </div>
                )}
              </section>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Confirming Order in Database...' : `Confirm Order · ${formatINR(totalAmount)}`}
              </button>
            </form>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-5 border border-zinc-200 rounded-xl p-6 bg-zinc-50 sticky top-24">
          <h2 className="font-display text-lg font-bold text-zinc-950 pb-4 border-b border-zinc-200">
            Order Summary
          </h2>
          <ul className="divide-y divide-zinc-200 my-2">
            {cart.map(({ food, quantity }) => (
              <li key={food.food_id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{food.food_name}</p>
                  <p className="text-xs text-zinc-500 tabular-nums">
                    Qty {quantity} × {formatINR(food.price)}
                  </p>
                </div>
                <span className="font-mono font-semibold text-zinc-950 tabular-nums shrink-0">
                  {formatINR(food.price * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-zinc-200 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Item Subtotal</span>
              <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Taxes (5% GST)</span>
              <span className="font-mono tabular-nums">{formatINR(gst)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}
              </span>
            </div>
            <div className="pt-3 border-t border-zinc-300 flex justify-between text-base font-bold text-zinc-950">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums">{formatINR(totalAmount)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
