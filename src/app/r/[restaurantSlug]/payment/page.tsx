'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, CheckCircle2, XCircle, CreditCard, Landmark, Wallet, QrCode } from 'lucide-react';
import { CartItem } from '../menu/MenuBrowser';

interface Props {
  params: Promise<{
    restaurantSlug: string;
  }>;
}

export default function PaymentSimulationPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { restaurantSlug } = use(params);
  const method = searchParams.get('method') || 'CARDS';

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

  // Form Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

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
    setCardName(name);

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(value);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Input Validations
    if (method.toUpperCase() === 'CARDS') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length !== 16) {
        setErrorMsg('Invalid card number. Must be 16 digits.');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length !== 5) {
        setErrorMsg('Invalid expiry date. Format must be MM/YY.');
        return;
      }
      if (cardCvv.length !== 3) {
        setErrorMsg('Invalid security code (CVV). Must be 3 digits.');
        return;
      }
      if (!cardName.trim()) {
        setErrorMsg('Cardholder name is required.');
        return;
      }
    } else if (method.toUpperCase() === 'UPI') {
      if (!upiId.includes('@') || upiId.trim().length < 5) {
        setErrorMsg('Please enter a valid UPI ID (e.g. user@bank).');
        return;
      }
    } else if (method.toUpperCase() === 'NETBANKING') {
      if (!selectedBank) {
        setErrorMsg('Please select a bank.');
        return;
      }
    } else if (method.toUpperCase() === 'WALLETS') {
      if (!selectedWallet) {
        setErrorMsg('Please select a wallet provider.');
        return;
      }
    }

    setPaymentStatus('processing');
    setLoading(true);

    const txnId = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const shouldFail = 
      (method.toUpperCase() === 'CARDS' && cardNumber.endsWith('0000')) ||
      (method.toUpperCase() === 'UPI' && upiId.startsWith('fail@'));

    if (shouldFail) {
      setPaymentStatus('failed');
      setErrorMsg('Transaction declined by issuing bank. Please verify details or try another card.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantSlug,
          tableId,
          customerName,
          customerMobile,
          cartItems: cart,
          paymentMethod: method,
          transactionId: txnId,
          amount: grandTotal,
          taxAmount,
          gatewayResponse: JSON.stringify({
            status: 'SUCCESS',
            gateway: 'RestaurantOS Gateway',
            method: method,
            reference: txnId,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order.');
      }

      setPaymentStatus('success');
      localStorage.removeItem(`cart_${restaurantSlug}`);

      setTimeout(() => {
        router.push(`/r/${restaurantSlug}/order/${data.orderId}`);
      }, 1500);
    } catch (err: any) {
      setPaymentStatus('failed');
      setErrorMsg(err.message || 'Payment system error. Please try again.');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <p className="text-slate-400 text-xs font-bold">Redirecting to checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-4">
      {/* Background Radial Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-md w-full bg-white border border-slate-200/85 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Top visual accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />

        {/* Secure badge */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-6 uppercase text-[9px] font-black tracking-widest bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-150 w-fit mx-auto">
          <ShieldCheck size={12} className="text-cyan-500" />
          <span>Secure Payments Portal</span>
        </div>

        {/* Payment Processing/Success Screens */}
        {paymentStatus === 'processing' && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="animate-spin text-cyan-500 mx-auto" size={48} />
            <h2 className="text-lg font-extrabold text-slate-800 font-black">Processing Payment</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              We are securely verifying your payment details with the gateway. Please do not refresh this page.
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

        {/* Idle Mode: Payment Forms */}
        {paymentStatus === 'idle' && (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs text-slate-450 uppercase tracking-widest font-bold block">
                Total Amount Due
              </span>
              <h2 className="text-3xl font-black text-slate-900">{formatPrice(grandTotal)}</h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Table {tableNumber} • Order Setup
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

            {/* Dynamic Payment Details Input */}
            {method.toUpperCase() === 'CARDS' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <CreditCard size={14} className="text-cyan-500" />
                  <span>Card Payment Details</span>
                </div>

                <div>
                  <label htmlFor="card-holder" className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                    Cardholder Name
                  </label>
                  <input
                    id="card-holder"
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="card-number" className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                    Card Number
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4111 2222 3333 4444"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card-expiry" className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                      Expiry Date
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="card-cvv" className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                      CVV / Code
                    </label>
                    <input
                      id="card-cvv"
                      type="password"
                      required
                      value={cardCvv}
                      onChange={handleCvvChange}
                      placeholder="***"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {method.toUpperCase() === 'UPI' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <QrCode size={14} className="text-cyan-500" />
                  <span>UPI Payment Details</span>
                </div>

                <div>
                  <label htmlFor="upi-id" className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">
                    Enter UPI ID / VPA
                  </label>
                  <input
                    id="upi-id"
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okaxis"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-xs outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {method.toUpperCase() === 'NETBANKING' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <Landmark size={14} className="text-cyan-500" />
                  <span>Select Bank</span>
                </div>

                <div>
                  <select
                    required
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-3 py-3 text-xs outline-none transition-colors"
                  >
                    <option value="">-- Choose Bank --</option>
                    <option value="sbi">State Bank of India</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                  </select>
                </div>
              </div>
            )}

            {method.toUpperCase() === 'WALLETS' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  <Wallet size={14} className="text-cyan-500" />
                  <span>Select Mobile Wallet</span>
                </div>

                <div>
                  <select
                    required
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-3 py-3 text-xs outline-none transition-colors"
                  >
                    <option value="">-- Choose Wallet --</option>
                    <option value="gpay">Google Pay</option>
                    <option value="phonepe">PhonePe</option>
                    <option value="paytm">Paytm</option>
                    <option value="amazon">Amazon Pay</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-[0.98] text-white font-extrabold py-4.5 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              Pay Securely {formatPrice(grandTotal)}
            </button>
          </form>
        )}

        {/* Payment Fail Retries Screen */}
        {paymentStatus === 'failed' && (
          <div className="space-y-6">
            <div className="text-center py-2 space-y-3">
              <XCircle className="text-red-500 mx-auto" size={48} />
              <h2 className="text-lg font-extrabold text-slate-800 font-black">Transaction Failed</h2>
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
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
