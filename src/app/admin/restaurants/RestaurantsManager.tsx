'use client';

import React, { useState } from 'react';
import { Plus, Trash2, KeyRound, ToggleLeft, ToggleRight, X, ExternalLink } from 'lucide-react';

interface RestaurantData {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  gstNumber: string;
  businessHrs: string;
  currency: string;
  isActive: boolean;
  ownerEmail: string;
  ownerName: string;
  ownerId: string;
}

interface Props {
  initialRestaurants: RestaurantData[];
}

export default function RestaurantsManager({ initialRestaurants }: Props) {
  const [restaurants, setRestaurants] = useState<RestaurantData[]>(initialRestaurants);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New restaurant form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    );
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !ownerName || !ownerEmail || !password) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/restaurants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          address: address.trim(),
          phone: phone.trim(),
          gstNumber: gstNumber.trim() || null,
          currency,
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.toLowerCase().trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRestaurants((prev) => [...prev, data.restaurant].sort((a, b) => a.name.localeCompare(b.name)));
        setIsModalOpen(false);
        // Clear fields
        setName('');
        setSlug('');
        setAddress('');
        setPhone('');
        setGstNumber('');
        setOwnerName('');
        setOwnerEmail('');
        setPassword('');
      } else {
        alert(data.message || 'Failed to onboard restaurant.');
      }
    } catch {
      alert('Error.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    try {
      const res = await fetch('/api/admin/restaurants/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: nextVal }),
      });

      if (res.ok) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: nextVal } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (ownerId: string, email: string) => {
    const newPass = prompt(`Enter a new password for owner account (${email}):`);
    if (!newPass) return;
    if (newPass.trim().length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await fetch('/api/admin/restaurants/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, password: newPass.trim() }),
      });

      if (res.ok) {
        alert('Password has been reset successfully.');
      } else {
        alert('Failed to reset password.');
      }
    } catch (e) {
      console.error(e);
      alert('Error.');
    }
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    if (!confirm(`CAUTION: Are you sure you want to permanently delete "${name}"? This deletes all their menu categories, dishes, tables, settings, orders, payments, and owner credentials. This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/restaurants/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setRestaurants((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('Failed to delete tenant.');
      }
    } catch (err) {
      console.error(err);
      alert('Error.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Manage Tenant Restaurants</h1>
          <p className="text-slate-500 text-xs mt-1">
            Create, suspend, activate, delete, or reset passwords for independent restaurant tenants.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3 px-5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>Create Restaurant</span>
        </button>
      </div>

      {/* Grid of Tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
            <span className="text-slate-400 block mb-2 font-bold">No restaurants registered.</span>
            <span className="text-slate-500 text-xs">Click "Create Restaurant" above to add your first tenant.</span>
          </div>
        ) : (
          restaurants.map((res) => (
            <div
              key={res.id}
              className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6 transition-all ${
                !res.isActive ? 'border-slate-200 bg-slate-50/50 opacity-60' : 'border-slate-200/85 hover:border-cyan-300'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-slate-900 text-base truncate max-w-[180px]">{res.name}</h3>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      res.isActive
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-red-50 border-red-100 text-red-700'
                    }`}
                  >
                    {res.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">/r/{res.slug}</span>
              </div>

              {/* Owner and contact info */}
              <div className="space-y-2 text-xs border-t border-b border-slate-100 py-4.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                    Onboarded Owner
                  </span>
                  <p className="font-bold text-slate-700">{res.ownerName}</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">{res.ownerEmail}</p>
                </div>
                <div className="pt-2.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                    Contact Details
                  </span>
                  <p className="text-slate-650 truncate">{res.address}</p>
                  <p className="text-slate-500 font-mono mt-0.5">{res.phone}</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-1.5">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleActive(res.id, res.isActive)}
                    title={res.isActive ? 'Suspend Restaurant' : 'Activate Restaurant'}
                    className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    {res.isActive ? (
                      <ToggleRight className="text-emerald-600" size={18} />
                    ) : (
                      <ToggleLeft className="text-slate-400" size={18} />
                    )}
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => handleResetPassword(res.ownerId, res.ownerEmail)}
                    title="Reset Owner Password"
                    className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 rounded-xl transition-all cursor-pointer"
                  >
                    <KeyRound size={14} />
                  </button>

                  {/* Delete Tenant */}
                  <button
                    onClick={() => handleDeleteRestaurant(res.id, res.name)}
                    title="Delete Tenant"
                    className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-red-650 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Direct visit link */}
                <a
                  href={`/r/${res.slug}/menu`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-600 uppercase tracking-widest font-black flex items-center gap-1 hover:text-cyan-700 transition-colors"
                >
                  <span>Visit Menu</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register Restaurant Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRestaurant}
            className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden shadow-2xl space-y-5 animate-fade-in text-left"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-slate-900 text-base">Onboard New Restaurant</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block mb-2 border-b border-slate-100 pb-1">
                  1. Brand Details
                </span>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Cafe Delight"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  URL Slug (Auto-generated)
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                  placeholder="e.g. cafe-delight"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Address
                </label>
                <textarea
                  rows={2}
                  required
                  disabled={loading}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete restaurant address"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors resize-none"
                />
              </div>

              <div className="sm:col-span-2 mt-2">
                <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider block mb-2 border-b border-slate-100 pb-1">
                  2. Owner Account Details
                </span>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address (Login)
                </label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@cafedelight.com"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !slug || !ownerName || !ownerEmail || !password}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Onboard & Create Account</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
