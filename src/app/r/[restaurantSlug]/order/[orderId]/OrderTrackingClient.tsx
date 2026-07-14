'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Clock, Utensils, CheckCircle2, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';

interface OrderItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Props {
  restaurantName: string;
  restaurantSlug: string;
  orderId: string;
  orderNumber: number;
  tableNumber: string;
  customerName: string;
  initialStatus: string;
  initialPaymentStatus: string;
  items: OrderItemData[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  createdAt: string;
  specialInstructions: string;
  initialPreparationTime: number;
  initialPreparingAt: string | null;
  initialServedAt: string | null;
}

export default function OrderTrackingClient({
  restaurantName,
  restaurantSlug,
  orderNumber,
  tableNumber,
  customerName,
  initialStatus,
  initialPaymentStatus,
  items,
  grandTotal,
  currency,
  createdAt,
  specialInstructions,
  initialPreparationTime,
  initialPreparingAt,
  initialServedAt,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState<string>(initialPaymentStatus);
  const [showItems, setShowItems] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll-synced states
  const [preparationTime, setPreparationTime] = useState<number>(initialPreparationTime);
  const [preparingAt, setPreparingAt] = useState<string | null>(initialPreparingAt);
  const [servedAt, setServedAt] = useState<string | null>(initialServedAt);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Time remaining calculation
  useEffect(() => {
    if (status !== 'PREPARING' || !preparationTime || !preparingAt) {
      setTimeLeft(null);
      return;
    }

    const calcTimeLeft = () => {
      const prepTimeMs = preparationTime * 60 * 1000;
      const startMs = new Date(preparingAt).getTime();
      const endMs = startMs + prepTimeMs;
      const diff = endMs - Date.now();
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    };

    setTimeLeft(calcTimeLeft());

    const timer = setInterval(() => {
      const left = calcTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status, preparationTime, preparingAt]);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Poll for status updates
  useEffect(() => {
    // If order is served, we don't need to poll anymore
    if (status === 'SERVED' || status === 'FAILED') return;

    const interval = setInterval(async () => {
      await fetchStatus();
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [status]);

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/order/status?orderId=${orderNumber}&slug=${restaurantSlug}`);
      if (res.ok) {
        const data = await res.json();
        
        let changed = false;
        if (data.status !== status) {
          setStatus(data.status);
          changed = true;
        }
        if (data.paymentStatus !== paymentStatus) {
          setPaymentStatus(data.paymentStatus);
          changed = true;
        }
        if (data.preparationTime !== preparationTime) {
          setPreparationTime(data.preparationTime || 0);
          changed = true;
        }
        if (data.preparingAt !== preparingAt) {
          setPreparingAt(data.preparingAt);
          changed = true;
        }
        if (data.servedAt !== servedAt) {
          setServedAt(data.servedAt);
          changed = true;
        }

        if (changed) {
          setLastUpdated(new Date());
        }
      }
    } catch (e) {
      console.error('Failed to poll status', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getStatusStep = () => {
    switch (status) {
      case 'RECEIVED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'SERVED':
        return 3;
      default:
        return 1;
    }
  };

  const activeStep = getStatusStep();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between p-4">
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500 fixed top-0 inset-x-0 z-50" />

      {/* Main Content */}
      <div className="max-w-md w-full mx-auto my-8 space-y-6 flex-1 text-left">
        {/* Branding header */}
        <div className="text-center">
          <h1 className="text-lg font-black tracking-tight text-slate-800">{restaurantName}</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Table {tableNumber} • Order #{orderNumber}
          </p>
        </div>

        {/* Verification Alert Banner */}
        {paymentStatus === 'PENDING_VERIFICATION' && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <h3 className="font-extrabold text-xs text-amber-800 uppercase tracking-wider">
                Verifying Payment
              </h3>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed font-light">
              Our staff is verifying your payment with our accounts. Cooking will begin immediately once confirmed. This usually takes less than 2 minutes.
            </p>
          </div>
        )}

        {/* Status Dashboard Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          {/* Pulsing indicator */}
          {status !== 'SERVED' && status !== 'FAILED' && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Live tracking</span>
            </div>
          )}

          <div className="text-center py-4">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
              Current Status
            </span>
            <h2 className="text-2xl font-black text-cyan-600 mt-1 uppercase tracking-tight">
              {status === 'RECEIVED' && 'Order Received'}
              {status === 'PREPARING' && 'Preparing Food'}
              {status === 'SERVED' && 'Food Served!'}
              {status === 'FAILED' && 'Order Rejected'}
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              {status === 'RECEIVED' && paymentStatus === 'PENDING_VERIFICATION' && 'Waiting for payment verification from restaurant staff.'}
              {status === 'RECEIVED' && paymentStatus !== 'PENDING_VERIFICATION' && 'The kitchen has received your order and will start preparing it shortly.'}
              {status === 'PREPARING' && 'Our chefs are currently preparing your delicious meal with fresh ingredients.'}
              {status === 'SERVED' && 'Your meal has been served! We hope you enjoy it. Please let the staff know if you need anything else.'}
              {status === 'FAILED' && 'Your order was rejected or payment verification failed. Please contact the staff.'}
            </p>

            {/* Preparation time timer countdown */}
            {status === 'PREPARING' && timeLeft !== null && (
              <div className="mt-4 p-4 bg-cyan-50 border border-cyan-100 rounded-2xl max-w-xs mx-auto space-y-2">
                <span className="text-[10px] text-cyan-650 uppercase font-black tracking-wider block">
                  Estimated Cooking Time
                </span>
                <span className="text-xl font-black text-cyan-700 block font-mono">
                  {timeLeft > 0 ? formatTimeLeft(timeLeft) : 'Plating Now...'}
                </span>
                <div className="w-full bg-cyan-100/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-1000 animate-pulse"
                    style={{
                      width: `${Math.min(
                        100,
                        preparationTime > 0
                          ? ((preparationTime * 60 - timeLeft) / (preparationTime * 60)) * 100
                          : 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 my-6" />

          {/* Tracking Pipeline */}
          {status !== 'FAILED' ? (
            <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {/* Step 1: Placed */}
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    activeStep >= 1
                      ? 'bg-cyan-500 border-cyan-500 text-white shadow shadow-cyan-500/20'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  1
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${activeStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                    Order Received
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-light">
                    Your order details were sent to kitchen • <span className="font-semibold text-slate-500">{formatTime(createdAt)}</span>
                  </p>
                </div>
              </div>

              {/* Step 2: Preparing */}
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    activeStep >= 2
                      ? 'bg-cyan-500 border-cyan-500 text-white shadow shadow-cyan-500/20'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  2
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${activeStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                    Preparing Food
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-light">
                    {preparingAt ? (
                      <>
                        Started cooking at <span className="font-semibold text-slate-500">{formatTime(preparingAt)}</span>
                        {servedAt && preparingAt && (
                          <span className="text-cyan-600 font-bold ml-1">
                            (Cooked in {Math.max(1, Math.round((new Date(servedAt).getTime() - new Date(preparingAt).getTime()) / 60000))}m)
                          </span>
                        )}
                      </>
                    ) : (
                      'Our chefs are preparing your hot meal'
                    )}
                  </p>
                </div>
              </div>

              {/* Step 3: Served */}
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    activeStep >= 3
                      ? 'bg-cyan-500 border-cyan-500 text-white shadow shadow-cyan-500/20'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  3
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${activeStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                    Food Served
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5 font-light">
                    {servedAt ? (
                      <>
                        Arrived on your table at <span className="font-semibold text-slate-500">{formatTime(servedAt)}</span>
                        <span className="text-emerald-600 font-bold ml-1">
                          (Total wait: {Math.max(1, Math.round((new Date(servedAt).getTime() - new Date(createdAt).getTime()) / 60000))}m)
                        </span>
                      </>
                    ) : (
                      'Food has arrived on your table'
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center py-4 bg-red-50 rounded-2xl border border-red-100 text-red-700">
              <AlertTriangle size={24} />
              <span className="text-xs font-black uppercase tracking-wider">Order Discarded</span>
            </div>
          )}
        </div>

        {/* Special Instructions card if present */}
        {specialInstructions && (
          <div className="bg-amber-50/50 border border-amber-250/50 rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <h3 className="font-bold text-xs text-amber-800 uppercase tracking-wider">
              Special Instructions
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              "{specialInstructions}"
            </p>
          </div>
        )}

        {/* Order Details Accordion */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full flex justify-between items-center p-5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Utensils size={16} className="text-cyan-500" />
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Order details ({items.length} items)
              </span>
            </div>
            {showItems ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>

          {showItems && (
            <div className="px-5 pb-5 divide-y divide-slate-100 text-xs">
              <div className="py-2 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-slate-650">
                      {item.name} <span className="text-slate-400 font-bold ml-1">×{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount paid</span>
                <span className="text-cyan-600">{formatPrice(grandTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sync Status Info */}
        <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Updated at {lastUpdated.toLocaleTimeString()}</span>
          </div>
          {isRefreshing && (
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-cyan-600">
              <RefreshCw size={10} className="animate-spin" />
              Syncing
            </span>
          )}
        </div>
      </div>

      {/* Floating Back to Menu Button */}
      <div className="max-w-md w-full mx-auto pt-4 border-t border-slate-200/60 mt-auto">
        <button
          onClick={() => router.push(`/r/${restaurantSlug}/menu`)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
        >
          <span>Back to Menu</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
