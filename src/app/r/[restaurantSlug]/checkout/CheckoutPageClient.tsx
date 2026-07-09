'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Wallet, Landmark, QrCode, ArrowRight } from 'lucide-react';
import { CartItem } from '../menu/MenuBrowser';

interface Props {
  restaurantName: string;
  restaurantSlug: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  customerMobile: string;
  currency: string;
  taxPercentage: number;
  paymentMethods: string[];
}

export default function CheckoutPageClient({
  restaurantName,
  restaurantSlug,
  tableNumber,
  customerName,
  currency,
  taxPercentage,
  paymentMethods,
}: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(`cart_${restaurantSlug}`);
      if (storedCart) {
        const parsed = JSON.parse(storedCart) as CartItem[];
        setCart(parsed);
        if (parsed.length === 0) {
          router.push(`/r/${restaurantSlug}/menu`);
        }
      } else {
        router.push(`/r/${restaurantSlug}/menu`);
      }
    } catch {
      router.push(`/r/${restaurantSlug}/menu`);
    }
  }, [restaurantSlug, router]);

  // Set default payment method if available
  useEffect(() => {
    if (paymentMethods.length > 0) {
      setSelectedMethod(paymentMethods[0]);
    }
  }, [paymentMethods]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  const grandTotal = subtotal + taxAmount;

  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'UPI':
        return <QrCode className="text-cyan-600" size={20} />;
      case 'COUNTER':
        return <Landmark className="text-teal-650" size={20} />;
      default:
        return <CreditCard className="text-slate-400" size={20} />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method.toUpperCase()) {
      case 'UPI':
        return 'UPI / QR Code Transfer';
      case 'COUNTER':
        return 'Pay on Counter / Cash';
      default:
        return method;
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedMethod) return;
    setLoading(true);
    // Navigate to payment page with checkout total and details
    router.push(`/r/${restaurantSlug}/payment?method=${encodeURIComponent(selectedMethod)}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <p className="text-slate-500">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500 sticky top-0 z-50" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-1 z-40">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/r/${restaurantSlug}/menu`)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">Checkout Summary</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              {restaurantName} • Table {tableNumber}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 pb-32 space-y-6">
        {/* Order Items Review */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-550 uppercase tracking-wider">
            Review Items
          </h2>
          <div className="divide-y divide-slate-100 space-y-4">
            {cart.map((item, index) => (
              <div
                key={item.id}
                className={`flex justify-between items-center ${index > 0 ? 'pt-4' : ''}`}
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{item.name}</h3>
                  <span className="text-slate-500 text-xs mt-1 block">
                    {formatPrice(item.price)} × {item.quantity}
                  </span>
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Calculation Summary */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-550 uppercase tracking-wider">
            Bill Details
          </h2>
          <div className="space-y-3 text-sm text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>GST / Restaurant Taxes ({taxPercentage}%)</span>
              <span className="font-semibold text-slate-800">{formatPrice(taxAmount)}</span>
            </div>
            <div className="h-px bg-slate-100 my-2" />
            <div className="flex justify-between items-center text-slate-900 font-extrabold text-base">
              <span>Grand Total</span>
              <span className="text-cyan-600 text-lg font-black">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-550 uppercase tracking-wider">
            Select Payment Method
          </h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method;
              return (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  disabled={loading}
                  className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/[0.03] border-cyan-500 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-slate-100 rounded-xl">
                      {getMethodIcon(method)}
                    </span>
                    <span className="text-sm font-bold">{getMethodLabel(method)}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500 text-white'
                        : 'border-slate-350 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Floating CTA bar */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent z-40 border-t border-slate-200/60 backdrop-blur-sm">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleProceedToPayment}
            disabled={loading || !selectedMethod}
            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] text-white font-black py-4.5 px-4 rounded-2xl shadow flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <span>Proceed to Pay {formatPrice(grandTotal)}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
