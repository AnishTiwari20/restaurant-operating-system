'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Clock, Utensils, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

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
  items: OrderItemData[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  createdAt: string;
}

export default function OrderTrackingClient({
  restaurantName,
  restaurantSlug,
  orderNumber,
  tableNumber,
  customerName,
  initialStatus,
  items,
  grandTotal,
  currency,
  createdAt,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus);
  const [showItems, setShowItems] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll for status updates
  useEffect(() => {
    // If order is already served/completed, we don't need to poll
    if (status === 'SERVED') return;

    const interval = setInterval(async () => {
      await fetchStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [status]);

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/order/status?orderId=${orderNumber}&slug=${restaurantSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status !== status) {
          setStatus(data.status);
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

        {/* Status Dashboard Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          {/* Pulsing indicator */}
          {status !== 'SERVED' && (
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
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
              {status === 'RECEIVED' && 'The kitchen has received your order and will start preparing it shortly.'}
              {status === 'PREPARING' && 'Our chefs are currently preparing your delicious meal with fresh ingredients.'}
              {status === 'SERVED' && 'Your meal has been served! We hope you enjoy it. Please let the staff know if you need anything else.'}
            </p>
          </div>

          <div className="border-t border-slate-100 my-6" />

          {/* Tracking Pipeline */}
          <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {/* Step 1: Placed */}
            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  activeStep >= 1
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-600 shadow'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <Clock size={18} />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold transition-all duration-300 ${
                    activeStep >= 1 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Order Placed
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Order was received and paid
                </p>
              </div>
            </div>

            {/* Step 2: Preparing */}
            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  activeStep >= 2
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-600 shadow'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <Utensils size={18} />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold transition-all duration-300 ${
                    activeStep >= 2 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Kitchen Preparing
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  Meal is being freshly cooked
                </p>
              </div>
            </div>

            {/* Step 3: Served */}
            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  activeStep >= 3
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold transition-all duration-300 ${
                    activeStep >= 3 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Food Served
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  Served hot at Table {tableNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Accordion */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full px-5 py-4 flex items-center justify-between font-bold text-sm text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span>Order Details ({items.length} items)</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-600">{formatPrice(grandTotal)}</span>
              {showItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {showItems && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3.5 text-xs text-slate-500">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>
                    {item.name} <strong className="text-slate-400 ml-1">× {item.quantity}</strong>
                  </span>
                  <span className="text-slate-700 font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex justify-between font-bold text-slate-800 text-sm">
                <span>Grand Total</span>
                <span className="text-slate-900">{formatPrice(grandTotal)}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Ordered at:{' '}
                {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </div>

        {/* Tracking page refresh/actions */}
        <div className="flex gap-3">
          <button
            onClick={fetchStatus}
            disabled={isRefreshing}
            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-cyan-600' : ''} />
            <span>Refresh Status</span>
          </button>
          <button
            onClick={() => router.push(`/r/${restaurantSlug}/menu`)}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <span>Order More</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-400 uppercase tracking-widest py-4">
        © {new Date().getFullYear()} {restaurantName}. Powered by RestaurantOS
      </footer>
    </div>
  );
}
