import { Search, SlidersHorizontal, X } from 'lucide-react';
import { FoodCard } from '../components/FoodCard';
import type { CartItem, Category, FoodItem } from '../types';

interface MenuPageProps {
  categories: Category[];
  foods: FoodItem[];
  loading: boolean;
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  availableOnly: boolean;
  onAvailableOnlyChange: (v: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  cart: CartItem[];
  onAddToCart: (food: FoodItem) => void;
  onUpdateQty: (foodId: number, delta: number) => void;
}

export function MenuPage({
  categories,
  foods,
  loading,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  availableOnly,
  onAvailableOnlyChange,
  sortBy,
  onSortChange,
  cart,
  onAddToCart,
  onUpdateQty,
}: MenuPageProps) {
  const getCartQty = (foodId: number) =>
    cart.find((item) => item.food.food_id === foodId)?.quantity ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-950">Food Menu</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Browse freshly cooked dishes across {categories.length} categories. Prices include kitchen packaging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-orange-600"
              aria-label="Search food menu"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <label className="inline-flex items-center gap-2 px-3 py-2 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-800 bg-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => onAvailableOnlyChange(e.target.checked)}
              className="accent-orange-600 rounded"
            />
            <span>Available only</span>
          </label>

          <div className="inline-flex items-center gap-2 border border-zinc-300 rounded-lg px-3 py-2 bg-white">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="text-xs font-medium text-zinc-800 bg-transparent focus:outline-none cursor-pointer"
              aria-label="Sort dishes"
            >
              <option value="featured">Featured Order</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="py-5 flex items-center gap-2 overflow-x-auto border-b border-zinc-100">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategoryId === null
              ? 'bg-zinc-950 text-white'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          All Dishes
        </button>
        {categories.map((cat) => {
          const active = selectedCategoryId === cat.category_id;
          return (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => onSelectCategory(cat.category_id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {cat.category_name}
            </button>
          );
        })}
      </div>

      {/* Food Grid */}
      {loading ? (
        <div className="py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="border border-zinc-200 rounded-xl overflow-hidden bg-white animate-pulse">
              <div className="aspect-[4/3] bg-zinc-200" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-zinc-200 rounded w-1/3" />
                <div className="h-5 bg-zinc-200 rounded w-2/3" />
                <div className="h-4 bg-zinc-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : foods.length === 0 ? (
        <div className="py-16 text-center border border-zinc-200 rounded-xl mt-8 bg-zinc-50">
          <h3 className="font-display text-lg font-semibold text-zinc-950">No matching dishes found</h3>
          <p className="text-sm text-zinc-600 mt-1">
            Try clearing your search keyword or switching to All Dishes.
          </p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onSelectCategory(null);
              onAvailableOnlyChange(false);
            }}
            className="mt-4 px-4 py-2 bg-zinc-950 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food) => (
            <FoodCard
              key={food.food_id}
              food={food}
              cartQuantity={getCartQty(food.food_id)}
              onAddToCart={onAddToCart}
              onUpdateQty={onUpdateQty}
            />
          ))}
        </div>
      )}
    </div>
  );
}
