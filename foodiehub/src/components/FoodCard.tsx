import { CheckCircle2, Minus, Plus, XCircle } from 'lucide-react';
import { formatINR } from '../api';
import type { FoodItem } from '../types';
import { DishImage } from './DishImage';

interface FoodCardProps {
  food: FoodItem;
  cartQuantity: number;
  onAddToCart: (food: FoodItem) => void;
  onUpdateQty: (foodId: number, delta: number) => void;
}

export function FoodCard({ food, cartQuantity, onAddToCart, onUpdateQty }: FoodCardProps) {
  const isAvailable = food.availability === 1;

  return (
    <article className="group bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        <DishImage
          src={food.image_url}
          alt={food.food_name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
            !isAvailable ? 'grayscale opacity-75' : ''
          }`}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-semibold tracking-wide text-zinc-500 uppercase truncate">
              {food.category_name}
            </span>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Available</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-500 font-medium shrink-0">
                <XCircle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                <span>Sold Out</span>
              </span>
            )}
          </div>

          <h3 className="font-display text-base font-semibold text-zinc-950 leading-snug">
            {food.food_name}
          </h3>
          <p className="text-sm text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
            {food.description}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
          <span className="font-mono text-base font-bold text-zinc-950 tabular-nums">
            {formatINR(food.price)}
          </span>

          {!isAvailable ? (
            <button
              type="button"
              disabled
              className="px-3.5 py-2 text-xs font-semibold text-zinc-400 bg-zinc-100 rounded-lg cursor-not-allowed whitespace-nowrap shrink-0"
            >
              Unavailable
            </button>
          ) : cartQuantity > 0 ? (
            <div className="inline-flex items-center border border-orange-600 rounded-lg bg-orange-50">
              <button
                type="button"
                onClick={() => onUpdateQty(food.food_id, -1)}
                className="p-2 text-orange-700 hover:bg-orange-100 rounded-l-lg transition-colors cursor-pointer"
                aria-label={`Decrease ${food.food_name} quantity`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2.5 text-xs font-bold text-orange-900 font-mono tabular-nums">
                {cartQuantity}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(food.food_id, 1)}
                className="p-2 text-orange-700 hover:bg-orange-100 rounded-r-lg transition-colors cursor-pointer"
                aria-label={`Increase ${food.food_name} quantity`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(food)}
              className="px-4 py-2 bg-zinc-950 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
