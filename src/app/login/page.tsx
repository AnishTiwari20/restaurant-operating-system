'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      // Successful login
      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-4">
      {/* Radial Gradient Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6 text-center">
        {/* Logo / Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Utensils size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">RestaurantOS</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            Merchant & Admin Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-md relative overflow-hidden text-left">
          {/* Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500" />

          <h2 className="text-lg font-bold text-slate-800 mb-6">Sign In</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3.5 text-sm transition-all duration-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl pl-10 pr-4 py-3.5 text-sm transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl p-3 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest shadow hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
