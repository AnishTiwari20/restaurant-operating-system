'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, Upload, X, Loader2 } from 'lucide-react';

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
  upiId: string;
  upiQrUrl: string;
}

interface Props {
  initialSettings: SettingsData;
  restaurantId: string;
}

export default function SettingsForm({ initialSettings, restaurantId }: Props) {
  const [formData, setFormData] = useState<SettingsData>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/restaurant/menu/dish/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({ ...prev, upiQrUrl: data.url }));
      } else {
        alert(data.message || 'QR code upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error.');
    } finally {
      setUploading(false);
    }
  };

  const removeQrCode = () => {
    setFormData((prev) => ({ ...prev, upiQrUrl: '' }));
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

          {/* Direct Manual UPI Config */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
            <h2 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Manual UPI QR Setup</span>
              <span className="text-[9px] bg-cyan-50 text-cyan-600 border border-cyan-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Direct
              </span>
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="upiId" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Restaurant UPI ID (VPA)
                </label>
                <input
                  id="upiId"
                  type="text"
                  disabled={loading}
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  placeholder="e.g. restaurant@okaxis"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Payment QR Code Image
                </span>
                
                {formData.upiQrUrl ? (
                  <div className="relative border border-slate-250 bg-slate-50 rounded-2xl p-4 flex flex-col items-center gap-3">
                    <img
                      src={formData.upiQrUrl}
                      alt="Merchant QR"
                      className="w-32 h-32 object-contain border border-slate-200 bg-white rounded-lg p-1.5"
                    />
                    <button
                      type="button"
                      onClick={removeQrCode}
                      className="text-[9px] font-extrabold text-red-600 hover:text-red-700 uppercase tracking-wider flex items-center gap-0.5"
                    >
                      <X size={12} />
                      <span>Remove QR Code</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl p-6 cursor-pointer bg-slate-50 hover:bg-cyan-50/5 transition-all text-center">
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin text-cyan-500 mb-2" size={24} />
                        <span className="text-[10px] font-bold text-slate-500">Uploading to cloud...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-2" size={24} />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          Upload Custom QR Code
                        </span>
                        <span className="text-[9px] text-slate-400 mt-1">
                          PNG, JPG, or WEBP (Max 5MB)
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={loading || uploading}
                      onChange={handleQrUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
            <h2 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3">
              Accepted Payments
            </h2>

            <div className="space-y-3">
              {['UPI', 'COUNTER'].map((method) => {
                const isChecked = acceptedMethods.includes(method);
                return (
                  <label
                    key={method}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:border-cyan-200 rounded-xl cursor-pointer select-none text-xs"
                  >
                    <span className="font-bold text-slate-700">
                      {method === 'UPI' && 'UPI / QR Code Transfer'}
                      {method === 'COUNTER' && 'Pay on Counter / Cash'}
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
            disabled={loading || uploading}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-40"
          >
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
