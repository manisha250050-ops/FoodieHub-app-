import { Check, FileText, PackageCheck, Search, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { apiRequest, formatINR, formatOrderDate } from '../api';
import { DishImage } from '../components/DishImage';
import { InvoiceModal } from '../components/InvoiceModal';
import type { Order, OrderStatus, User } from '../types';

const PIPELINE_STEPS: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
];

interface OrderTrackingPageProps {
  currentUser: User | null;
  authToken: string | null;
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order | null) => void;
  onRefreshOrders: () => Promise<void>;
  onGoToAccount: () => void;
  onNotify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function OrderTrackingPage({
  currentUser,
  authToken,
  orders,
  selectedOrder,
  onSelectOrder,
  onRefreshOrders,
  onGoToAccount,
  onNotify,
}: OrderTrackingPageProps) {
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(lookupId.replace('#', '').trim());
    if (!Number.isInteger(id) || id <= 0) {
      onNotify('error', 'Enter a valid numeric Order ID.');
      return;
    }
    if (!authToken) {
      onNotify('error', 'Please sign in to look up your order.');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await apiRequest<{ order: Order }>(`/api/orders/${id}`, {
        token: authToken,
      });
      onSelectOrder(res.order);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!authToken) return;
    setCancellingId(orderId);
    try {
      const res = await apiRequest<{ order: Order }>(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        token: authToken,
      });
      onSelectOrder(res.order);
      await onRefreshOrders();
      onNotify('info', `Order #${orderId} has been cancelled.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const activeOrder = selectedOrder ?? orders[0] ?? null;

  if (!currentUser || currentUser.role !== 'customer') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
          <PackageCheck className="w-7 h-7 text-zinc-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-zinc-950">Track Your Orders</h1>
        <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto">
          Sign in to your customer account to view live kitchen preparation updates, order history, and
          printable GST invoices.
        </p>
        <button
          type="button"
          onClick={onGoToAccount}
          className="mt-6 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const activeStepIdx = activeOrder ? PIPELINE_STEPS.indexOf(activeOrder.order_status) : -1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-950">Order Tracking & History</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Monitor live kitchen status, download invoices, or cancel eligible orders.
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Lookup Order #ID"
              className="pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm w-44 focus:outline-none focus:border-orange-600"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-4 py-2 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {lookupLoading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {orders.length === 0 && !activeOrder ? (
        <div className="border border-zinc-200 rounded-xl p-12 text-center bg-zinc-50">
          <h2 className="font-display text-lg font-semibold text-zinc-950">No orders placed yet</h2>
          <p className="text-sm text-zinc-600 mt-1">
            Once you place an order, its real-time status and invoice will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Order History List */}
          <div className="lg:col-span-4 border border-zinc-200 rounded-xl overflow-hidden bg-white">
            <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-zinc-950">Your Orders</h2>
              <button
                type="button"
                onClick={onRefreshOrders}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                Refresh
              </button>
            </div>
            <ul className="divide-y divide-zinc-100 max-h-[540px] overflow-y-auto">
              {orders.map((ord) => {
                const isSelected = activeOrder?.order_id === ord.order_id;
                return (
                  <li key={ord.order_id}>
                    <button
                      type="button"
                      onClick={() => onSelectOrder(ord)}
                      className={`w-full text-left px-5 py-4 transition-colors cursor-pointer ${
                        isSelected ? 'bg-orange-50/70' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold text-zinc-950 tabular-nums">
                          Order #{ord.order_id}
                        </span>
                        <span className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                          {formatINR(ord.total_amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                        <span>{ord.order_status}</span>
                        <span className="tabular-nums">
                          {formatOrderDate(ord.order_date, false)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: Active Order Live Tracker */}
          {activeOrder && (
            <div className="lg:col-span-8 border border-zinc-200 rounded-xl p-6 bg-white space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-zinc-100">
                <div>
                  <p className="text-xs text-zinc-500 font-mono tabular-nums">
                    Order #{activeOrder.order_id} · Placed{' '}
                    {formatOrderDate(activeOrder.order_date, true)}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-zinc-950 mt-1">
                    {activeOrder.order_status}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(activeOrder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-zinc-300 hover:border-zinc-950 text-xs font-semibold text-zinc-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Invoice</span>
                  </button>

                  {['Order Placed', 'Confirmed'].includes(activeOrder.order_status) && (
                    <button
                      type="button"
                      disabled={cancellingId === activeOrder.order_id}
                      onClick={() => handleCancelOrder(activeOrder.order_id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>
                        {cancellingId === activeOrder.order_id ? 'Cancelling...' : 'Cancel Order'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* 6-Status Visual Pipeline */}
              {activeOrder.order_status === 'Cancelled' ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-900 text-sm">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <p className="font-semibold">Order Cancelled</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Payment status: {activeOrder.payment_status ?? 'Cancelled'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PIPELINE_STEPS.map((step, index) => {
                    const completed = index <= activeStepIdx;
                    const current = index === activeStepIdx;
                    return (
                      <div
                        key={step}
                        className={`p-3 rounded-lg border text-left ${
                          current
                            ? 'border-orange-600 bg-orange-50'
                            : completed
                              ? 'border-emerald-200 bg-emerald-50/50'
                              : 'border-zinc-200 bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-semibold text-zinc-500">
                            0{index + 1}
                          </span>
                          {completed && (
                            <Check
                              className={`w-4 h-4 ${current ? 'text-orange-600' : 'text-emerald-600'}`}
                            />
                          )}
                        </div>
                        <p
                          className={`text-xs font-semibold ${
                            completed ? 'text-zinc-950' : 'text-zinc-400'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery & Payment Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm">
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-1">Delivery Address</p>
                  <p className="font-semibold text-zinc-950">{activeOrder.customer_name}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{activeOrder.phone}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{activeOrder.delivery_address}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-500 mb-1">Payment Summary</p>
                  <p className="text-xs text-zinc-700">
                    Method: <span className="font-semibold text-zinc-950">{activeOrder.payment_method}</span>
                  </p>
                  <p className="text-xs text-zinc-700 mt-1">
                    Status:{' '}
                    <span className="font-semibold text-zinc-950">
                      {activeOrder.payment_status ?? 'Pending'}
                    </span>
                  </p>
                  <p className="text-sm font-bold text-zinc-950 mt-2 font-mono tabular-nums">
                    Total Paid / Due: {formatINR(activeOrder.total_amount)}
                  </p>
                </div>
              </div>

              {/* Ordered Items */}
              <div>
                <h3 className="font-display text-sm font-bold text-zinc-950 mb-3">Ordered Items</h3>
                <ul className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                  {activeOrder.items.map((item) => (
                    <li key={item.order_item_id} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <DishImage
                          src={item.image_url}
                          alt={item.food_name}
                          className="w-12 h-10 rounded-md object-cover shrink-0 bg-zinc-100"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-950 truncate">{item.food_name}</p>
                          <p className="text-xs text-zinc-500 tabular-nums">
                            {item.quantity} × {formatINR(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-zinc-950 tabular-nums shrink-0">
                        {formatINR(item.quantity * item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
    </div>
  );
}
