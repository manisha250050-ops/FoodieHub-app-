import { ArrowRight, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DishImage } from '../components/DishImage';
import { FoodCard } from '../components/FoodCard';
import type { CartItem, Category, FoodItem } from '../types';

interface HomePageProps {
  categories: Category[];
  foods: FoodItem[];
  cart: CartItem[];
  onAddToCart: (food: FoodItem) => void;
  onUpdateQty: (foodId: number, delta: number) => void;
  onExploreMenu: (options?: { categoryId?: number | null; search?: string }) => void;
}

export function HomePage({
  categories,
  foods,
  cart,
  onAddToCart,
  onUpdateQty,
  onExploreMenu,
}: HomePageProps) {
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    onExploreMenu({ search: heroSearch.trim(), categoryId: null });
  };

  // Curated 6 featured dishes showcasing variety across Indian classics, burger, pizza, dessert
  const featuredDishes = [
    foods.find((f) => f.food_name === 'Chicken Biriyani'),
    foods.find((f) => f.food_name === 'Masala Dosa'),
    foods.find((f) => f.food_name === 'Paneer Butter Masala'),
    foods.find((f) => f.food_name === 'Chicken Burger'),
    foods.find((f) => f.food_name === 'Paneer Tikka Pizza'),
    foods.find((f) => f.food_name === 'Warm Gulab Jamun'),
  ].filter((item): item is FoodItem => Boolean(item));

  const displayFeatured = featuredDishes.length >= 6 ? featuredDishes : foods.slice(0, 6);

  const getCartQty = (foodId: number) =>
    cart.find((item) => item.food.food_id === foodId)?.quantity ?? 0;

  return (
    <div className="bg-white">
      {/* Section 1: Split Editorial Hero */}
      <section className="bg-zinc-950 text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-widest uppercase text-orange-400 mb-3">
                Chennai Kitchen · Fresh Daily Preparation
              </p>
              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)', textWrap: 'balance' }}
              >
                Authentic Indian dishes, delivered hot to your door.
              </h1>
              <p className="mt-5 text-base text-zinc-300 leading-relaxed max-w-xl">
                Order aromatic biriyanis, crisp South Indian dosas, wood-fired pizzas, and handcrafted
                beverages with live order status tracking and instant digital billing.
              </p>

              <form onSubmit={handleHeroSearch} className="mt-7 flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search Chicken Biriyani, Masala Dosa, Pizza..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
                    aria-label="Search dishes"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 h-72 sm:h-96 lg:h-full min-h-[340px]">
                <DishImage
                  src="/src/assets/images/hero_indian_feast_1795337580993.jpg"
                  alt="Authentic Indian feast with Chicken Biriyani, Paneer Butter Masala, Masala Dosa, and Garlic Naan"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs text-orange-300 font-medium">Signature Platter</p>
                    <p className="font-display text-lg font-semibold">
                      Hyderabadi Dum Biriyani & Classic Sides
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold bg-zinc-950/85 border border-zinc-700 px-3 py-1 rounded-lg tabular-nums">
                    From ₹50
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Service KPI Strip */}
          <div className="mt-12 pt-8 border-t border-zinc-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-display text-lg font-bold text-white tabular-nums">28+ Dishes</p>
              <p className="text-xs text-zinc-400 mt-1">Across 10 curated culinary categories</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white tabular-nums">30 Min Avg</p>
              <p className="text-xs text-zinc-400 mt-1">Prepared fresh to order in our kitchen</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white tabular-nums">Free Delivery</p>
              <p className="text-xs text-zinc-400 mt-1">On all orders ₹299 and above</p>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">Live Tracking</p>
              <p className="text-xs text-zinc-400 mt-1">6-stage kitchen to doorstep status</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-b border-zinc-100">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
              Browse by Category
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Jump directly to breakfast tiffins, royal biriyanis, fast food, or chilled coolers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExploreMenu({ categoryId: null, search: '' })}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <button
              key={cat.category_id}
              type="button"
              onClick={() => onExploreMenu({ categoryId: cat.category_id, search: '' })}
              className="group text-left p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-white hover:border-orange-500 transition-colors cursor-pointer"
            >
              <p className="font-display text-sm font-semibold text-zinc-950 group-hover:text-orange-600 transition-colors truncate">
                {cat.category_name}
              </p>
              <p className="text-xs text-zinc-500 mt-1 tabular-nums">
                {cat.item_count ?? 0} {(cat.item_count ?? 0) === 1 ? 'dish' : 'dishes'}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Featured Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950">
              Featured Kitchen Favorites
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Most ordered dishes prepared with freshly ground spices and local ingredients.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExploreMenu({ categoryId: null, search: '' })}
            className="px-4 py-2 border border-zinc-300 hover:border-zinc-950 text-zinc-900 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Explore All {foods.length} Dishes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayFeatured.map((food) => (
            <FoodCard
              key={food.food_id}
              food={food}
              cartQuantity={getCartQty(food.food_id)}
              onAddToCart={onAddToCart}
              onUpdateQty={onUpdateQty}
            />
          ))}
        </div>
      </section>

      {/* Section 4: Special Offer & Culinary Highlight */}
      <section className="bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">
                Daily Kitchen Offer
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-white mt-2"
                style={{ textWrap: 'balance' }}
              >
                Zero delivery fee on orders above ₹299, plus instant GST invoice on every order.
              </h2>
              <p className="text-sm text-zinc-300 mt-3 max-w-2xl leading-relaxed">
                Pair a Chicken Biriyani (₹180) with Paneer Butter Masala (₹160) or Fresh Lime Juice
                (₹50) and unlock complimentary delivery across all zones. Pay seamlessly via UPI Demo,
                Card Demo, or Cash on Delivery.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onExploreMenu({ categoryId: null, search: '' })}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Build Your Meal
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-zinc-800 aspect-[4/3]">
                <DishImage
                  src="/src/assets/images/dish_paneer_butter_masala_1795337580614.jpg"
                  alt="Paneer Butter Masala served in copper kadai with garlic naan"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
