import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import type { AppRoute, User } from '../types';

interface NavbarProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
  cartCount: number;
  onOpenCart: () => void;
  currentUser: User | null;
}

export function Navbar({ route, onNavigate, cartCount, onOpenCart, currentUser }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ id: AppRoute; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'orders', label: 'Track Order' },
    { id: 'account', label: currentUser && currentUser.role === 'customer' ? 'My Account' : 'Sign In' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleSelect = (id: AppRoute) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="font-display text-xl font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded"
        >
          Foodie<span className="text-orange-600">Hub</span>
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 rounded ${
                  active ? 'text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-orange-600 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-950 hover:bg-orange-600 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-2"
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Cart</span>
            <span className="tabular-nums font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 text-zinc-700 hover:text-zinc-950 rounded-lg border border-zinc-200 cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <nav
          className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-orange-50 text-orange-700 font-semibold'
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
