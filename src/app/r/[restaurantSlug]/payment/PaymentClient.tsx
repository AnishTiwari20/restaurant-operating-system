'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Loader2, ArrowLeft, Store, Smartphone, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Props {
  restaurantSlug: string;
  restaurantName: string;
  currency: string;
  taxPercentage: number;
  upiId: string;
  upiQrUrl: string;
  paymentMethod: string;
  customerName: string;
  customerMobile: string;
  tableId: string;
  tableNumber: string;
  specialInstructions: string;
}

export default function PaymentClient({
  restaurantSlug,
  restaurantName,
  currency,
  taxPercentage,
  upiId,
  upiQrUrl,
  paymentMethod,
  customerName,
  customerMobile,
  tableId,
  tableNumber,
  specialInstructions,
}: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dynamicQrUrl, setDynamicQrUrl] = useState('');

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal * (taxPercentage / 100);
  const grandTotal = subtotal + taxAmount;

  // Generate dynamic QR code if merchant set up UPI ID
  useEffect(() => {
    if (grandTotal > 0 && upiId) {
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table_${tableNumber}_Order`;
      QRCode.toDataURL(upiLink, { width: 350, margin: 1 })
        .then((url) => {
          setDynamicQrUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate dynamic UPI QR code:', err);
        });
    }
  }, [grandTotal, upiId, restaurantName, tableNumber]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Place the order under PENDING_VERIFICATION payment state
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantSlug,
          tableId,
          customerName,
          customerMobile,
          cartItems: cart,
          paymentMethod: paymentMethod === 'COUNTER' ? 'Pay on Counter' : 'UPI Transfer',
          amount: grandTotal,
          taxAmount,
          specialInstructions,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Clear local storage cart
        localStorage.removeItem(`cart_${restaurantSlug}`);
        // Redirect to order status page
        router.push(`/r/${restaurantSlug}/order/${data.orderId}`);
      } else {
        alert(data.message || 'Failed to place order.');
        setLoading(false);
      }
    } catch {
      alert('Network error. Failed to place order.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <p className="text-slate-400 text-xs font-bold animate-pulse">Loading payment details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-4">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl relative overflow-hidden z-10">
        {/* Top visual accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500" />

        {/* Back and title bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/r/${restaurantSlug}/checkout`)}
            disabled={loading}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex items-center gap-1 text-slate-400 uppercase text-[9px] font-black tracking-widest bg-slate-50 border border-slate-200/50 px-3 py-1 rounded-full">
            <ShieldCheck size={11} className="text-cyan-500" />
            <span>Frictionless Verification</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1 mb-6">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block">
            Amount To Pay
          </span>
          <h2 className="text-3xl font-black text-slate-900">{formatPrice(grandTotal)}</h2>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            {restaurantName} • Table {tableNumber}
          </p>
        </div>

        {/* Payment Type specific interface */}
        {paymentMethod === 'COUNTER' ? (
          <div className="space-y-6">
            {/* Pay on Counter Card */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                <Store size={22} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-800">Pay on Counter / Cash</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">
                Please walk up to the restaurant cash counter to complete your payment of **{formatPrice(grandTotal)}** via cash or card. 
              </p>
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-700 text-left font-light leading-relaxed">
                ⚠️ **Note**: Your order will be sent to the kitchen immediately, but processing/cooking will start once the counter staff confirms your payment.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Direct UPI Payment Panel */}
            <div className="border border-slate-200 bg-slate-50/40 rounded-2xl p-6 text-center space-y-5">
              <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-100">
                <Smartphone size={20} />
              </div>
              <h3 className="font-black text-sm text-slate-800">UPI Transfer</h3>

              {/* Show QR code if present */}
              {dynamicQrUrl ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner w-[200px] h-[200px] flex items-center justify-center mx-auto">
                    <img
                      src={dynamicQrUrl}
                      alt="UPI QR Code"
                      className="w-[180px] h-[180px] object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Scan using Google Pay, PhonePe, Paytm, or BHIM on your phone to transfer **{formatPrice(grandTotal)}** directly.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-700 text-left leading-relaxed">
                  ⚠️ The restaurant has not configured their UPI ID yet. Please check out and pay at the counter, or notify staff.
                </div>
              )}

              {/* Copy UPI ID Section */}
              {upiId && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div className="text-left">
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                      UPI ID (VPA)
                    </span>
                    <span className="font-bold text-slate-700 select-all">{upiId}</span>
                  </div>
                  
                  <button
                    onClick={handleCopyUpi}
                    className="p-2 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-500 hover:text-cyan-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-wide">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Bill details card */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mt-6 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Taxes ({taxPercentage}%)</span>
            <span className="font-semibold">{formatPrice(taxAmount)}</span>
          </div>
          <div className="border-t border-slate-200/50 pt-2 flex justify-between items-center text-slate-900 font-extrabold">
            <span>Grand Total</span>
            <span className="text-cyan-600 font-black">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading || (paymentMethod === 'UPI' && !upiId && !upiQrUrl)}
          className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-200 mt-6 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Placing Order...</span>
            </>
          ) : (
            <span>I Have Paid & Place Order</span>
          )}
        </button>
      </div>
    </div>
  );
}
