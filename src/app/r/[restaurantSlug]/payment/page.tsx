'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { CartItem } from '../menu/MenuBrowser';
import Script from 'next/script';

interface Props {
  params: Promise<{
    restaurantSlug: string;
  }>;
}

export default function PaymentSimulationPage({ params }: Props) {
  const router = useRouter();
  const { restaurantSlug } = use(params);

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [tableId, setTableId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [taxPercentage, setTaxPercentage] = useState(5.0);

  // Load customer cookies and cart data
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[2]) : '';
    };

    const name = getCookie('customer_name');
    const mobile = getCookie('customer_mobile');
    const tId = getCookie('customer_table_id');
    const tNum = getCookie('customer_table_number');

    if (!name || !tId) {
      router.push(`/r/${restaurantSlug}/menu`);
      return;
    }

    setCustomerName(name);
    setCustomerMobile(mobile);
    setTableId(tId);
    setTableNumber(tNum);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPaymentStatus('processing');
    setLoading(true);

    try {
      // 1. Create Razorpay order session on the server
      const resOrder = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal }),
      });

      const orderData = await resOrder.json();

      if (!resOrder.ok) {
        throw new Error(orderData.message || 'Failed to create payment session.');
      }

      // 2. Configure Razorpay checkout options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RestaurantOS',
        description: `Table ${tableNumber} Order Payment`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            setPaymentStatus('processing');
            // Submit order details with cryptographic proof
            const resCreate = await fetch('/api/order/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                restaurantSlug,
                tableId,
                customerName,
                customerMobile,
                cartItems: cart,
                paymentMethod: 'Razorpay UPI/Card',
                amount: grandTotal,
                taxAmount,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const createData = await resCreate.json();

            if (!resCreate.ok) {
              throw new Error(createData.message || 'Failed to place order.');
            }

            setPaymentStatus('success');
            localStorage.removeItem(`cart_${restaurantSlug}`);

            setTimeout(() => {
              router.push(`/r/${restaurantSlug}/order/${createData.orderId}`);
            }, 1500);
          } catch (err: any) {
            setPaymentStatus('failed');
            setErrorMsg(err.message || 'Payment capture failed.');
            setLoading(false);
          }
        },
        prefill: {
          name: customerName,
          contact: customerMobile,
        },
        theme: {
          color: '#06b6d4', // Cyan theme accent
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus('idle');
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setPaymentStatus('failed');
      setErrorMsg(err.message || 'Failed to initialize payment.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <p className="text-slate-400 text-xs font-bold animate-pulse">Redirecting to checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-4">
      {/* Load Razorpay SDK Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Background Radial Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl relative overflow-hidden z-10">
        {/* Top visual accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500" />

        {/* Secure badge */}
        <div className="flex items-center justify-center gap-1.5 text-slate-450 mb-6 uppercase text-[9px] font-black tracking-widest bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-150 w-fit mx-auto">
          <ShieldCheck size={12} className="text-cyan-500" />
          <span>Secure Razorpay Portal</span>
        </div>

        {/* Payment Processing/Success Screens */}
        {paymentStatus === 'processing' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="animate-spin text-cyan-500 mx-auto" size={48} />
            <h2 className="text-lg font-extrabold text-slate-800 font-black">Processing Payment</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Do not refresh this page. We are verifying the transaction with Razorpay.
            </p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="text-emerald-500 mx-auto" size={48} />
            <h2 className="text-lg font-extrabold text-slate-800 font-black">Transaction Confirmed</h2>
            <p className="text-xs text-slate-500">
              Your order is placed. Transferring to tracking screen...
            </p>
          </div>
        )}

        {/* Idle Mode: Order Summary & Checkout Button */}
        {paymentStatus === 'idle' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs text-slate-450 uppercase tracking-widest font-bold block">
                Total Amount Due
              </span>
              <h2 className="text-3xl font-black text-slate-900">{formatPrice(grandTotal)}</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Table {tableNumber} • Cafe Delight
              </p>
            </div>

            <div className="border-t border-slate-100 my-4" />

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-650 text-xs rounded-xl p-3 flex items-start gap-2">
                <XCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Premium Bill Breakdown */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                Receipt Breakdown
              </span>
              
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>GST / Taxes ({taxPercentage}%)</span>
                <span className="font-semibold">{formatPrice(taxAmount)}</span>
              </div>

              <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-cyan-600 font-black">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Security Guarantee Text */}
            <p className="text-[10px] text-slate-450 leading-relaxed text-center font-light">
              By clicking below, a secure Razorpay drawer will open to complete payment via UPI (GPay, PhonePe, Paytm), Netbanking, or Cards.
            </p>

            {/* Payment Button */}
            <button
              onClick={handlePaymentSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] text-white font-extrabold py-4 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Proceed to Pay</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Payment Fail Retries Screen */}
        {paymentStatus === 'failed' && (
          <div className="space-y-6">
            <div className="text-center py-2 space-y-3">
              <XCircle className="text-red-500 mx-auto" size={48} />
              <h2 className="text-lg font-extrabold text-slate-800 font-black">Transaction Failed</h2>
              <p className="text-xs text-red-650 bg-red-50 border border-red-100 rounded-xl p-3">
                {errorMsg}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentStatus('idle')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => router.push(`/r/${restaurantSlug}/checkout`)}
                className="w-full bg-transparent border border-slate-200 text-slate-400 hover:text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Back to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
