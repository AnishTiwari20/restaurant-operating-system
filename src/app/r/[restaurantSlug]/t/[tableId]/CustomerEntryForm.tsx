'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  restaurantSlug: string;
  restaurantName: string;
  tableId: string;
  tableNumber: string;
}

export default function CustomerEntryForm({
  restaurantSlug,
  tableId,
  tableNumber,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters).');
      return;
    }

    // Basic 10-digit mobile validation
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    try {
      // Store customer session details in cookies for server access
      const oneDay = 86400;
      document.cookie = `customer_name=${encodeURIComponent(name.trim())}; path=/; max-age=${oneDay}; SameSite=Lax`;
      document.cookie = `customer_mobile=${encodeURIComponent(cleanMobile)}; path=/; max-age=${oneDay}; SameSite=Lax`;
      document.cookie = `customer_table_id=${encodeURIComponent(tableId)}; path=/; max-age=${oneDay}; SameSite=Lax`;
      document.cookie = `customer_table_number=${encodeURIComponent(tableNumber)}; path=/; max-age=${oneDay}; SameSite=Lax`;

      // Redirect to menu page
      router.push(`/r/${restaurantSlug}/menu`);
    } catch {
      setError('Failed to start session. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      <div>
        <label htmlFor="name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Your Name
        </label>
        <input
          id="name"
          type="text"
          required
          disabled={loading}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm transition-all duration-200 outline-none"
        />
      </div>

      <div>
        <label htmlFor="mobile" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Mobile Number
        </label>
        <input
          id="mobile"
          type="tel"
          required
          disabled={loading}
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="e.g. 9876543210"
          className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm transition-all duration-200 outline-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-650 text-xs rounded-xl p-3 text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl shadow shadow-cyan-500/10 flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Setting up table...</span>
          </>
        ) : (
          <span>View Menu & Order</span>
        )}
      </button>
    </form>
  );
}
