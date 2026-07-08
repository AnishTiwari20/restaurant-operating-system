'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Check, Clock, User, Phone, Bell, Volume2, VolumeX, ShieldAlert, Search, X } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  orderNumber: number;
  customerName: string;
  customerMobile: string;
  tableNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  assignedWaiter: string;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  initialOrders: OrderData[];
  restaurantId: string;
  currency: string;
}

export default function OrdersBoard({ initialOrders, restaurantId, currency }: Props) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [filter, setFilter] = useState<'active' | 'received' | 'preparing' | 'served'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Use ref to keep track of known order IDs to detect new arrivals
  const knownOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));

  // Beep sound generator using Web Audio API (zero asset dependencies)
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First Chime note
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      // Second Chime note
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Web Audio play failed', e);
    }
  };

  // Poll for live orders
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/restaurant/orders?restaurantId=${restaurantId}`);
        if (res.ok) {
          const fetched: OrderData[] = await res.json();
          setOrders(fetched);

          // Check if any new orders arrived
          let hasNew = false;
          fetched.forEach((order) => {
            if (!knownOrderIdsRef.current.has(order.id) && order.status === 'RECEIVED') {
              hasNew = true;
              knownOrderIdsRef.current.add(order.id);
            }
          });

          if (hasNew) {
            playNewOrderSound();
          }
        }
      } catch (e) {
        console.error('Error polling merchant orders', e);
      }
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [restaurantId, soundEnabled]);

  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/restaurant/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });

      if (res.ok) {
        // Update local state instantly
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        );
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateWaiter = async (orderId: string, waiterName: string) => {
    try {
      await fetch('/api/restaurant/orders/update-waiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, assignedWaiter: waiterName }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, assignedWaiter: waiterName } : o))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') return order.status === 'RECEIVED' || order.status === 'PREPARING';
    if (filter === 'received') return order.status === 'RECEIVED';
    if (filter === 'preparing') return order.status === 'PREPARING';
    if (filter === 'served') return order.status === 'SERVED';
    return true;
  });

  // Search logic
  const searchedOrders = filteredOrders.filter((order) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();

    // Check order fields
    const matchesName = order.customerName.toLowerCase().includes(query);
    const matchesMobile = order.customerMobile.toLowerCase().includes(query);
    const matchesOrderNo = `#${order.orderNumber}`.includes(query) || order.orderNumber.toString() === query;
    const matchesTable = `table ${order.tableNumber}`.toLowerCase().includes(query) || order.tableNumber.toLowerCase() === query;
    
    // Check price/amount
    const matchesAmount = order.totalAmount.toString().includes(query) || formatPrice(order.totalAmount).toLowerCase().includes(query);

    // Check items inside the order
    const matchesItems = order.items.some((item) => item.name.toLowerCase().includes(query));

    // Check date
    const formattedDate = new Date(order.createdAt)
      .toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .toLowerCase();
    const matchesDate = formattedDate.includes(query);

    return matchesName || matchesMobile || matchesOrderNo || matchesTable || matchesAmount || matchesItems || matchesDate;
  });

  const getElapsedTime = (isoString: string) => {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    return `${diffMins}m ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Live Orders Board</h1>
          <p className="text-slate-500 text-xs mt-1">
            Track and process customer orders in real-time. Sound alerts will play for new pending items.
          </p>
        </div>

        {/* Audio control & quick tester */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-50 border-cyan-100 text-cyan-600 hover:bg-cyan-100/50'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Alerts On' : 'Alerts Muted'}</span>
          </button>

          <button
            onClick={playNewOrderSound}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Test Sound
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md w-full">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search by customer name, VPA, table #, order #, amount, dish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-10 py-3.5 text-xs outline-none transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'active'
              ? 'bg-cyan-500 text-white shadow shadow-cyan-500/10'
              : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
          }`}
        >
          Active ({orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PREPARING').length})
        </button>
        <button
          onClick={() => setFilter('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'received'
              ? 'bg-red-50 border border-red-150 text-red-700 shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
          }`}
        >
          Pending ({orders.filter((o) => o.status === 'RECEIVED').length})
        </button>
        <button
          onClick={() => setFilter('preparing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'preparing'
              ? 'bg-orange-55 border border-orange-100 text-orange-700 shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
          }`}
        >
          Preparing ({orders.filter((o) => o.status === 'PREPARING').length})
        </button>
        <button
          onClick={() => setFilter('served')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === 'served'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
          }`}
        >
          Served ({orders.filter((o) => o.status === 'SERVED').length})
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchedOrders.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
            <span className="text-slate-400 block mb-2 font-bold">No orders found.</span>
            <span className="text-slate-500 text-xs">Orders matching your search or filters will show up here.</span>
          </div>
        ) : (
          searchedOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6 transition-all duration-350 ${
                order.status === 'RECEIVED'
                  ? 'border-red-200 bg-gradient-to-br from-white to-red-50/10'
                  : order.status === 'PREPARING'
                  ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50/10'
                  : 'border-slate-200/85'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">Order #{order.orderNumber}</span>
                    <span className="bg-slate-50 px-2 py-0.5 border border-slate-200 rounded-md text-cyan-600 font-bold text-[10px]">
                      Table {order.tableNumber}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">
                    {getElapsedTime(order.createdAt)}
                  </span>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    order.status === 'RECEIVED'
                      ? 'bg-red-50 border-red-100 text-red-700'
                      : order.status === 'PREPARING'
                      ? 'bg-orange-50 border-orange-100 text-orange-700'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}
                >
                  {order.status === 'RECEIVED' && 'Pending'}
                  {order.status === 'PREPARING' && 'Preparing'}
                  {order.status === 'SERVED' && 'Served'}
                </span>
              </div>

              {/* Customer Contact */}
              <div className="space-y-1.5 text-xs bg-slate-50/60 border border-slate-200 p-3 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-700">
                  <User size={13} className="text-slate-400 shrink-0" />
                  <span className="font-bold truncate">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-505">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono">{order.customerMobile}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 space-y-2 border-t border-b border-slate-100 py-4">
                <p className="text-[10px] text-slate-450 uppercase tracking-widest font-black">
                  Items ordered
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs text-slate-700">
                      <span className="font-medium">
                        {item.name} <strong className="text-slate-400 ml-1">× {item.quantity}</strong>
                      </span>
                      <span className="text-slate-500 font-mono">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mt-3 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-slate-900 text-sm font-extrabold">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Waiter Assignment & Actions */}
              <div className="space-y-4">
                {/* Waiter input */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assign Waiter (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter waiter name"
                    value={order.assignedWaiter}
                    onChange={(e) => updateWaiter(order.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-800 placeholder-slate-400 rounded-xl px-3 py-2 text-xs transition-colors outline-none"
                  />
                </div>

                {/* Status action CTA */}
                {order.status === 'RECEIVED' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    disabled={updatingId === order.id}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Play size={13} />
                    <span>Start Preparing</span>
                  </button>
                )}

                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'SERVED')}
                    disabled={updatingId === order.id}
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50"
                  >
                    <Check size={13} />
                    <span>Mark Served</span>
                  </button>
                )}

                {order.status === 'SERVED' && (
                  <button
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 text-slate-450 font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Check size={13} />
                    <span>Completed & Served</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
