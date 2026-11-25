import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatINR } from '../api';
import type { CartItem } from '../types';
import { DishImage } from './DishImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (foodId: number, delta: number) => void;
  onRemoveItem: (foodId: number) => void;
  onBrowseMenu: () => void;
  onProceedCheckout: () => void;
}

export function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onBrowseMenu,
  onProceedCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const deliveryFee = subtotal === 0 || subtotal >= 299 ? 0 : 30;
  const total = subtotal + gst + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-zinc-200 shadow-2xl">
        <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-950">Your Order Bag</h2>
            <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
              {items.reduce((acc, i) => acc + i.quantity, 0)} items selected
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-950 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
                <ShoppingBag className="w-7 h-7 text-zinc-400" aria-hidden="true" />
              </div>
              <h3 className="font-display text-base font-semibold text-zinc-950">Your cart is empty</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                Explore freshly prepared biriyanis, dosas, pizzas, and beverages to start your order.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBrowseMenu();
                }}
                className="mt-6 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Browse Food Menu
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {items.map(({ food, quantity }) => (
                <li key={food.food_id} className="py-4 flex gap-4">
                  <DishImage
                    src={food.image_url}
                    alt={food.food_name}
                    className="w-20 h-16 rounded-lg object-cover shrink-0 bg-zinc-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 truncate">{food.food_name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
                          {formatINR(food.price)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(food.food_id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        aria-label={`Remove ${food.food_name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(food.food_id, -1)}
                          className="p-1.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-l-lg cursor-pointer"
                          aria-label={`Decrease quantity of ${food.food_name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-zinc-950 tabular-nums font-mono">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(food.food_id, 1)}
                          className="p-1.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-r-lg cursor-pointer"
                          aria-label={`Increase quantity of ${food.food_name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                        {formatINR(food.price * quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Item Subtotal</span>
                <span className="tabular-nums font-medium text-zinc-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Taxes (5% GST)</span>
                <span className="tabular-nums font-medium text-zinc-900">{formatINR(gst)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery Fee {subtotal >= 299 ? '(Free over ₹299)' : ''}</span>
                <span className="tabular-nums font-medium text-zinc-900">
                  {deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex justify-between text-base font-bold text-zinc-950">
                <span>Total Amount</span>
                <span className="tabular-nums">{formatINR(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
