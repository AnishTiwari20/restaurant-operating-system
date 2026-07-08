'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsData {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  gstNumber: string;
  businessHrs: string;
  currency: string;
  taxPercentage: number;
  paymentMethods: string;
}

interface Props {
  initialSettings: SettingsData;
  restaurantId: string;
}

export default function SettingsForm({ initialSettings, restaurantId }: Props) {
  const [formData, setFormData] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Parse list of accepted payment methods
  const acceptedMethods = formData.paymentMethods.split(',').map((m) => m.trim().toUpperCase());

  const handleCheckboxChange = (method: string, checked: boolean) => {
    let methodsList = acceptedMethods.filter((m) => m !== method);
    if (checked) {
      methodsList.push(method);
    }
    // Join back as string
    setFormData((prev) => ({
      ...prev,
      paymentMethods: methodsList.join(','),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const res = await fetch('/api/restaurant/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Settings updated successfully.');
      } else {
        setIsError(true);
        setMessage(data.message || 'Failed to update settings.');
      }
    } catch {
      setIsError(true);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Restaurant Settings</h1>
        <p className="text-slate-500 text-xs mt-1">
          Manage your restaurant branding details, contact information, taxation parameters, and accepted payment methods.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Core Profile */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 h-fit lg:col-span-2">
          <h2 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3">
            Restaurant Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Restaurant Name
              </label>
              <input
                id="name"
                type="text"
                required
                disabled={loading}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="logo" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Logo Image URL (Optional)
              </label>
              <input
                id="logo"
                type="text"
                disabled={loading}
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                required
                disabled={loading}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="hours" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Business Hours
              </label>
              <input
                id="hours"
                type="text"
                disabled={loading}
                value={formData.businessHrs}
                onChange={(e) => setFormData({ ...formData, businessHrs: e.target.value })}
                placeholder="e.g. 09:00 - 22:00"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Restaurant Address
              </label>
              <textarea
                id="address"
                required
                rows={3}
                disabled={loading}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Finance & Payments */}
        <div className="space-y-6">
          {/* Billing configuration */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
            <h2 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Tax & Currency
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="gst" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  GST Number (Optional)
                </label>
                <input
                  id="gst"
                  type="text"
                  disabled={loading}
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="currency" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Currency
                  </label>
                  <select
                    id="currency"
                    disabled={loading}
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 text-slate-900 rounded-xl px-3 py-3 text-xs outline-none transition-colors"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tax" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tax / GST %
                  </label>
                  <input
                    id="tax"
                    type="number"
                    step="0.01"
                    required
                    disabled={loading}
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
            <h2 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Accepted Payments
            </h2>

            <div className="space-y-3">
              {['UPI', 'CARDS', 'NETBANKING', 'WALLETS'].map((method) => {
                const isChecked = acceptedMethods.includes(method);
                return (
                  <label
                    key={method}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:border-cyan-200 rounded-xl cursor-pointer select-none text-xs"
                  >
                    <span className="font-bold text-slate-700">
                      {method === 'UPI' && 'UPI / QR Code'}
                      {method === 'CARDS' && 'Credit & Debit Cards'}
                      {method === 'NETBANKING' && 'Net Banking'}
                      {method === 'WALLETS' && 'Mobile Wallets'}
                    </span>
                    <input
                      type="checkbox"
                      disabled={loading}
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(method, e.target.checked)}
                      className="w-4.5 h-4.5 border border-slate-350 bg-white text-cyan-600 rounded-md focus:ring-0 outline-none accent-cyan-600"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Alert feedback */}
          {message && (
            <div
              className={`p-4 rounded-2xl flex items-start gap-3 border text-xs leading-relaxed ${
                isError
                  ? 'bg-red-50 border-red-100 text-red-650'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }`}
            >
              {isError ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
