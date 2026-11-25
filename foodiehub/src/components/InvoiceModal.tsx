import { Printer, X } from 'lucide-react';
import { formatINR, formatOrderDate } from '../api';
import type { Order } from '../types';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  if (!order) return null;

  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxesAndFees = Math.max(0, order.total_amount - itemsSubtotal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Invoice for Order #${order.order_id}`}
    >
      <div className="bg-white rounded-xl border border-zinc-200 max-w-xl w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between no-print">
          <h3 className="font-display text-base font-bold text-zinc-950">Tax Invoice & Receipt</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 printable-invoice space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <div className="font-display text-2xl font-bold text-zinc-950">
                Foodie<span className="text-orange-600">Hub</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Central Kitchen & Online Food Ordering System
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                INV-{String(order.order_id).padStart(5, '0')}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {formatOrderDate(order.order_date, true)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Billed & Delivered To</p>
              <p className="font-semibold text-zinc-950">{order.customer_name}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{order.phone}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{order.delivery_address}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium text-zinc-500 mb-1">Order & Payment</p>
              <p className="text-xs text-zinc-800">
                Order Status: <span className="font-semibold">{order.order_status}</span>
              </p>
              <p className="text-xs text-zinc-800 mt-0.5">
                Method: <span className="font-semibold">{order.payment_method}</span>
              </p>
              <p className="text-xs text-zinc-800 mt-0.5">
                Payment Status: <span className="font-semibold">{order.payment_status ?? 'Pending'}</span>
              </p>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600 border-b border-zinc-200">
                <tr>
                  <th className="text-left py-2.5 px-4 font-semibold">Item</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Qty</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Rate</th>
                  <th className="text-right py-2.5 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.items.map((item) => (
                  <tr key={item.order_item_id}>
                    <td className="py-2.5 px-4 text-zinc-900 font-medium">{item.food_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-700">
                      {formatINR(item.price)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-950">
                      {formatINR(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Items Subtotal</span>
                <span className="font-mono tabular-nums">{formatINR(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>GST & Delivery</span>
                <span className="font-mono tabular-nums">{formatINR(taxesAndFees)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-base text-zinc-950">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">{formatINR(order.total_amount)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 text-center pt-4 border-t border-zinc-100">
            Thank you for ordering with FoodieHub. This is a computer-generated invoice.
          </p>
        </div>
      </div>
    </div>
  );
}
