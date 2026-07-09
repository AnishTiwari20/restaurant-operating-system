'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Check,
  Clock,
  User,
  Phone,
  Volume2,
  VolumeX,
  Search,
  X,
  Loader2,
  TrendingUp,
  ClipboardList,
  ChefHat,
  Printer,
  MessageSquare,
  Users,
  Utensils,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

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
  paymentStatus: string;
  totalAmount: number;
  assignedWaiter: string;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  initialOrders: OrderData[];
  restaurantId: string;
  currency: string;
  restaurantName: string;
}

export default function OrdersBoard({ initialOrders, restaurantId, currency, restaurantName }: Props) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [filter, setFilter] = useState<'active' | 'received' | 'preparing' | 'served'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive kitchen checked items state (stores 'orderId-itemId' string)
  const [preparedItems, setPreparedItems] = useState<Set<string>>(new Set());

  // Receipt Modal Order state
  const [receiptModalOrder, setReceiptModalOrder] = useState<OrderData | null>(null);

  // Use ref to keep track of known order IDs to detect new arrivals
  const knownOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));

  // Preset Waiters options
  const waiters = ['Sarah Jenkins', 'Alex Rivera', 'Emily Chang', 'John Smith'];

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

  const approvePayment = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/restaurant/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentStatus: 'PAID',
          status: 'PREPARING', // Automatically move to preparing (kitchen cooks)
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, paymentStatus: 'PAID', status: 'PREPARING' }
              : o
          )
        );
      } else {
        alert('Failed to approve payment.');
      }
    } catch (e) {
      console.error(e);
      alert('Error approving payment.');
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to reject this order and mark payment as failed?')) return;
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/restaurant/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentStatus: 'FAILED',
          status: 'FAILED',
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, paymentStatus: 'FAILED', status: 'FAILED' }
              : o
          )
        );
      } else {
        alert('Failed to reject order.');
      }
    } catch (e) {
      console.error(e);
      alert('Error rejecting order.');
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

  // Toggle item checklist in kitchen
  const toggleItemPrepared = (orderId: string, itemId: string) => {
    const key = `${orderId}-${itemId}`;
    setPreparedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Generate WhatsApp Quick-Link
  const getWhatsAppLink = (order: OrderData) => {
    const text = `Hi ${order.customerName}! Your order #${order.orderNumber} (Table ${order.tableNumber}) of ${formatPrice(order.totalAmount)} is currently being prepared at Cafe Delight!`;
    const cleanedPhone = order.customerMobile.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(text)}`;
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

  // Metrics Calculations
  const totalRevenueToday = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeKitchenCount = orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PREPARING').length;
  const uniqueTablesActive = new Set(orders.filter((o) => o.status !== 'SERVED').map((o) => o.tableNumber)).size;

  return (
    <div className="space-y-8">
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

      {/* METRICS STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/40">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Today's Revenue</span>
            <span className="text-lg font-black text-slate-950 mt-0.5 block">{formatPrice(totalRevenueToday)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-500" />
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100/40">
            <ChefHat size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Kitchen Queue</span>
            <span className="text-lg font-black text-slate-950 mt-0.5 block">{activeKitchenCount} Orders</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/40">
            <ClipboardList size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Dining Tables</span>
            <span className="text-lg font-black text-slate-950 mt-0.5 block">{uniqueTablesActive} Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500" />
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/40">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Avg. Cook Time</span>
            <span className="text-lg font-black text-slate-950 mt-0.5 block">12 Minutes</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        {/* Search Input Bar */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by customer name, VPA, table #, order #, amount, dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-10 py-3.5 text-xs outline-none transition-all"
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
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'active'
                ? 'bg-cyan-500 border-cyan-500 text-white shadow shadow-cyan-500/10'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'received'
                ? 'bg-red-50 border-red-150 text-red-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending ({orders.filter((o) => o.status === 'RECEIVED').length})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'preparing'
                ? 'bg-orange-50 border-orange-150 text-orange-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            Preparing ({orders.filter((o) => o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setFilter('served')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'served'
                ? 'bg-emerald-50 border-emerald-150 text-emerald-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            Served ({orders.filter((o) => o.status === 'SERVED').length})
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchedOrders.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
            <span className="text-slate-400 block mb-2 font-bold">No orders found.</span>
            <span className="text-slate-500 text-xs">Orders matching your search or filters will show up here.</span>
          </div>
        ) : (
          searchedOrders.map((order) => {
            const hasPendingVerification = order.paymentStatus === 'PENDING_VERIFICATION';
            
            return (
              <div
                key={order.id}
                className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-6 transition-all duration-350 ${
                  order.status === 'RECEIVED'
                    ? 'border-red-200 bg-gradient-to-br from-white to-red-50/[0.03]'
                    : order.status === 'PREPARING'
                    ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50/[0.03]'
                    : 'border-slate-200/85 bg-white'
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

                {/* Progress bar timeline */}
                {order.status !== 'FAILED' && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[8px] text-slate-400 uppercase font-black tracking-wider">
                      <span>Received</span>
                      <span>Preparing</span>
                      <span>Served</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 flex overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${
                        order.status === 'RECEIVED' ? 'w-1/3 bg-red-400' :
                        order.status === 'PREPARING' ? 'w-2/3 bg-orange-400 animate-pulse' :
                        'w-full bg-emerald-500'
                      }`} />
                    </div>
                  </div>
                )}

                {/* Verify Manual Payment Block */}
                {hasPendingVerification && (
                  <div className="bg-amber-50 border border-amber-250 rounded-2xl p-4 text-xs text-amber-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-800">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                      </span>
                      <span>Verify payment</span>
                    </div>
                    <p className="text-[10px] text-amber-700 leading-relaxed font-light">
                      Customer selected **{order.paymentMethod}** and clicked confirm. Please verify receipt of **{formatPrice(order.totalAmount)}** before clicking approve.
                    </p>
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => approvePayment(order.id)}
                        disabled={updatingId === order.id}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wide cursor-pointer transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {updatingId === order.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Play size={10} className="stroke-[2.5]" />
                        )}
                        <span>Approve & Cook</span>
                      </button>
                      <button
                        onClick={() => rejectOrder(order.id)}
                        disabled={updatingId === order.id}
                        className="bg-white hover:bg-red-50 border border-amber-250 hover:border-red-200 text-slate-500 hover:text-red-650 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wide cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Contact & Quick Actions */}
                <div className="space-y-1.5 text-xs bg-slate-50/60 border border-slate-200/80 p-3.5 rounded-2xl flex justify-between items-center">
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User size={13} className="text-slate-400 shrink-0" />
                      <span className="font-bold truncate">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="font-mono">{order.customerMobile}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {/* WhatsApp Quick Message Action */}
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-emerald-50 text-slate-450 hover:text-emerald-600 rounded-xl border border-transparent hover:border-emerald-100 transition-colors"
                      title="WhatsApp Customer Notification"
                    >
                      <MessageSquare size={14} />
                    </a>

                    {/* Print Thermal Receipt Action */}
                    <button
                      onClick={() => setReceiptModalOrder(order)}
                      className="p-2 hover:bg-slate-100 text-slate-455 hover:text-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                      title="Print Thermal Receipt"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>

                {/* Items List (Toggable Checkboxes for Kitchen prepping) */}
                <div className="flex-1 space-y-2 border-t border-b border-slate-100 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-450 uppercase tracking-widest font-black block">
                      Kitchen checklist
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block">
                      Click to cross item
                    </span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {order.items.map((item) => {
                      const isPrepared = preparedItems.has(`${order.id}-${item.id}`);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemPrepared(order.id, item.id)}
                          className={`flex justify-between items-start text-xs cursor-pointer select-none transition-all p-1.5 rounded-lg ${
                            isPrepared
                              ? 'bg-slate-50 text-slate-400 line-through'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5">
                              {isPrepared ? (
                                <CheckSquare size={13} className="text-cyan-500" />
                              ) : (
                                <Square size={13} className="text-slate-400" />
                              )}
                            </span>
                            <span className="font-medium text-left">
                              {item.name} <strong className="text-slate-400 ml-1">× {item.quantity}</strong>
                            </span>
                          </div>
                          <span className="text-slate-500 font-mono shrink-0">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 mt-3 pt-2">
                    <span>Grand Total:</span>
                    <span className="text-slate-900 text-sm font-extrabold">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>

                {/* Waiter Assignment & Actions */}
                <div className="space-y-4">
                  {/* Waiter Profile dropdown selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <span>Assign Staff / Waiter</span>
                    </label>
                    <select
                      value={order.assignedWaiter || ''}
                      onChange={(e) => updateWaiter(order.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none transition-colors"
                    >
                      <option value="">Unassigned</option>
                      {waiters.map((name) => (
                        <option key={name} value={name}>
                          👤 {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status action CTA */}
                  {!hasPendingVerification && order.status === 'RECEIVED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      disabled={updatingId === order.id}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-500/10 cursor-pointer disabled:opacity-50"
                    >
                      <Play size={13} />
                      <span>Start Preparing</span>
                    </button>
                  )}

                  {!hasPendingVerification && order.status === 'PREPARING' && (
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
                      className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <Check size={13} className="text-emerald-500" />
                      <span>Completed & Served</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* THERMAL BILLING RECEIPT PREVIEW MODAL */}
      {receiptModalOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-250 shadow-2xl rounded-3xl max-w-sm w-full p-6 text-slate-800 font-mono text-xs relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setReceiptModalOrder(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header info */}
            <div className="text-center space-y-1 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-900">{restaurantName}</h3>
              <p className="text-[10px] text-slate-400">TABLE ORDERING PORTAL</p>
              <p className="text-[9px] text-slate-400 font-light">
                Date: {new Date(receiptModalOrder.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Bill info fields */}
            <div className="border-t border-dashed border-slate-300 py-3 space-y-1 text-slate-700">
              <p><strong>Order ID:</strong> #{receiptModalOrder.orderNumber}</p>
              <p><strong>Table Name:</strong> Table {receiptModalOrder.tableNumber}</p>
              <p><strong>Guest Name:</strong> {receiptModalOrder.customerName}</p>
              <p><strong>Mobile No:</strong> {receiptModalOrder.customerMobile}</p>
              <p><strong>Pay Method:</strong> {receiptModalOrder.paymentMethod}</p>
            </div>

            {/* Items table */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 my-3 space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Item (Qty)</span>
                <span className="text-right">Price</span>
              </div>
              {receiptModalOrder.items.map((i) => (
                <div key={i.id} className="flex justify-between text-slate-650">
                  <span>{i.name} x{i.quantity}</span>
                  <span className="text-right">{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Totals panel */}
            <div className="text-right space-y-1 py-1 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatPrice(receiptModalOrder.totalAmount - (receiptModalOrder.totalAmount * 0.05))}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>{formatPrice(receiptModalOrder.totalAmount * 0.05)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-100 text-slate-900">
                <span>Total Bill</span>
                <span>{formatPrice(receiptModalOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-400 font-light">
              *** THANK YOU FOR VISITING ***
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
