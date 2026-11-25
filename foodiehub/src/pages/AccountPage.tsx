import { LogOut, User as UserIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../api';
import type { User } from '../types';

interface AccountPageProps {
  currentUser: User | null;
  authToken: string | null;
  ordersCount: number;
  onAuthSuccess: (token: string, user: User) => void;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
  onViewOrders: () => void;
  onNotify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function AccountPage({
  currentUser,
  authToken,
  ordersCount,
  onAuthSuccess,
  onUserUpdated,
  onLogout,
  onViewOrders,
  onNotify,
}: AccountPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile editor state
  const [profileName, setProfileName] = useState(currentUser?.name ?? '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone ?? '');
  const [profileAddress, setProfileAddress] = useState(currentUser?.address ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone);
      setProfileAddress(currentUser.address);
    }
  }, [currentUser]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: { name, email, password, phone, address },
        });
        onAuthSuccess(res.token, res.user);
        onNotify('success', `Account created! Welcome to FoodieHub, ${res.user.name}.`);
      } else {
        const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        onAuthSuccess(res.token, res.user);
        onNotify('success', `Welcome back, ${res.user.name}.`);
      }
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        token: authToken,
        body: {
          name: profileName,
          phone: profilePhone,
          address: profileAddress,
        },
      });
      onUserUpdated(res.user);
      onNotify('success', 'Customer profile updated in database.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setSavingPassword(true);
    try {
      await apiRequest('/api/auth/password', {
        method: 'PUT',
        token: authToken,
        body: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      });
      setCurrentPassword('');
      setNewPassword('');
      onNotify('success', 'Password updated securely.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (currentUser && currentUser.role === 'customer') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-950">{currentUser.name}</h1>
              <p className="text-xs text-zinc-500">
                {currentUser.email} · Customer ID #{currentUser.user_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onViewOrders}
              className="px-4 py-2 border border-zinc-300 hover:border-zinc-950 text-xs font-semibold text-zinc-900 rounded-lg transition-colors cursor-pointer tabular-nums"
            >
              Order History ({ordersCount})
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="border border-zinc-200 rounded-xl p-6 bg-white space-y-5">
          <h2 className="font-display text-lg font-bold text-zinc-950">Manage Customer Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Default Delivery Address</label>
            <textarea
              required
              rows={3}
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        <form onSubmit={handlePasswordChange} className="border border-zinc-200 rounded-xl p-6 bg-white space-y-5">
          <h2 className="font-display text-lg font-bold text-zinc-950">Update Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="px-5 py-2.5 bg-zinc-950 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <div className="border border-zinc-200 rounded-2xl p-6 sm:p-8 bg-white">
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-100">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-950">
              {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {mode === 'login'
                ? 'Sign in to place orders, track deliveries, and manage your address.'
                : 'Register once to save your delivery details and order history.'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 p-1 bg-zinc-100 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-600'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ananya@example.in"
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 12345"
                  className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Delivery Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="24 Besant Avenue, Adyar, Chennai 600020"
                  className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-orange-600"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
