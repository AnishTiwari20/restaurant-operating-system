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
  Printer,
  MessageSquare,
  Users,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
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
  specialInstructions: string;
  preparationTime: number;
  merchantNotes: string;
  preparingAt: string | null;
  servedAt: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  initialOrders: OrderData[];
  restaurantId: string;
  currency: string;
  restaurantName: string;
}

// Live Countdown widget with green/orange states
function PrepCountdown({ preparingAt, preparationTime }: { preparingAt: string | null; preparationTime: number }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!preparingAt || !preparationTime) {
      setTimeLeft(null);
      return;
    }

    const calc = () => {
      const start = new Date(preparingAt).getTime();
      const duration = preparationTime * 60 * 1000;
      const diff = start + duration - Date.now();
      return diff > 0 ? Math.ceil(diff / 1000) : 0;
    };

    setTimeLeft(calc());
    const interval = setInterval(() => {
      const left = calc();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [preparingAt, preparationTime]);

  if (timeLeft === null) return null;

  if (timeLeft === 0) {
    return (
      <span className="inline-flex bg-amber-50 border border-amber-250 text-amber-800 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider animate-pulse shrink-0">
        ⏰ Plating Now
      </span>
    );
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <span className="inline-flex bg-cyan-50 border border-cyan-150 text-cyan-700 px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase tracking-wider shrink-0">
      ⏰ {mins}m {secs < 10 ? '0' : ''}{secs}s
    </span>
  );
}

// Kitchen internal notes with auto-save
function KitchenNoteInput({ orderId, initialNotes, onSave }: { orderId: string; initialNotes: string; onSave: (orderId: string, notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleBlur = async () => {
    if (notes === initialNotes) return;
    setSaving(true);
    await onSave(orderId, notes);
    setSaving(false);
  };

  return (
    <div className="space-y-1.5 text-left">
      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
        Private Kitchen Notes
      </label>
      <div className="relative">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleBlur}
          placeholder="E.g., Allergen warnings, priority table..."
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none transition-all resize-none font-sans"
        />
        {saving && (
          <span className="absolute bottom-2 right-2 text-[8px] text-slate-400 flex items-center gap-0.5 bg-white/80 px-1 py-0.5 rounded">
            <Loader2 size={8} className="animate-spin" /> Saving...
          </span>
        )}
      </div>
    </div>
  );
}

export default function OrdersBoard({ initialOrders, restaurantId, currency, restaurantName }: Props) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [filter, setFilter] = useState<'active' | 'received' | 'preparing' | 'served'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive kitchen checked items state (stores 'orderId-itemId' string)
  const [preparedItems, setPreparedItems] = useState<Set<string>>(new Set());

  // Accordion expanded rows state (stores set of order IDs)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
              
              // Automatically expand new incoming orders so they are immediately visible
              setExpandedIds((prev) => {
                const next = new Set(prev);
                next.add(order.id);
                return next;
              });
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
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: nextStatus,
                  preparingAt: nextStatus === 'PREPARING' ? new Date().toISOString() : o.preparingAt,
                  servedAt: nextStatus === 'SERVED' ? new Date().toISOString() : o.servedAt,
                }
              : o
          )
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

  const updatePreparationTime = async (orderId: string, mins: number) => {
    try {
      const res = await fetch('/api/restaurant/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, preparationTime: mins }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, preparationTime: mins } : o))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateMerchantNotes = async (orderId: string, notes: string) => {
    try {
      await fetch('/api/restaurant/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, merchantNotes: notes }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, merchantNotes: notes } : o))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const getActiveAggregatedItems = () => {
    const activeOrders = orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PREPARING');
    const counts: { [name: string]: number } = {};
    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const aggregatedItems = getActiveAggregatedItems();

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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
          status: 'PREPARING',
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
  const toggleItemPrepared = (orderId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row accordion toggle
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

  // Toggle Row Accordion
  const toggleRowExpand = (orderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
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

    const matchesName = order.customerName.toLowerCase().includes(query);
    const matchesMobile = order.customerMobile.toLowerCase().includes(query);
    const matchesOrderNo = `#${order.orderNumber}`.includes(query) || order.orderNumber.toString() === query;
    const matchesTable = `table ${order.tableNumber}`.toLowerCase().includes(query) || order.tableNumber.toLowerCase() === query;
    const matchesAmount = order.totalAmount.toString().includes(query) || formatPrice(order.totalAmount).toLowerCase().includes(query);
    const matchesItems = order.items.some((item) => item.name.toLowerCase().includes(query));

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
    <div className="space-y-6 text-left">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Live Orders Queue</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Manage incoming tables and kitchen preparation. Tap on any order card to expand details.
          </p>
        </div>

        {/* Audio control */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer shadow-sm active:scale-95 ${
              soundEnabled
                ? 'bg-cyan-500 border-cyan-500 text-white shadow-cyan-500/10 hover:bg-cyan-600 hover:border-cyan-600'
                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-650 hover:border-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'Alerts On' : 'Alerts Muted'}</span>
          </button>
        </div>
      </div>

      {/* KITCHEN AGGREGATOR PANEL */}
      {aggregatedItems.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 shadow-lg shadow-slate-900/10 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-slate-800 text-amber-400 rounded-xl border border-slate-700/50">
              <Clock size={16} />
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-200">
                Kitchen Prep Aggregator
              </h2>
              <p className="text-[9px] text-slate-400 font-medium">
                Active portions to prepare across all tables
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {aggregatedItems.map(([name, qty]) => (
              <span
                key={name}
                className="bg-slate-850 hover:bg-slate-800 border border-slate-700/40 hover:border-cyan-500/20 text-slate-200 px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2.5 transition-all shadow-sm"
              >
                <span>{name}</span>
                <span className="bg-cyan-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm shadow-cyan-500/20">
                  ×{qty}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by customer name, mobile, table, order #, total amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-10 py-3.5 text-xs outline-none transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('active')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'active'
                ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-50 border-slate-200/85 text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Queue ({orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'received'
                ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/10'
                : 'bg-slate-50 border-slate-200/85 text-slate-500 hover:text-slate-800'
            }`}
          >
            Pending ({orders.filter((o) => o.status === 'RECEIVED').length})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'preparing'
                ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/10'
                : 'bg-slate-50 border-slate-200/85 text-slate-500 hover:text-slate-800'
            }`}
          >
            Preparing ({orders.filter((o) => o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setFilter('served')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border ${
              filter === 'served'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                : 'bg-slate-50 border-slate-200/85 text-slate-500 hover:text-slate-800'
            }`}
          >
            Served ({orders.filter((o) => o.status === 'SERVED').length})
          </button>
        </div>
      </div>

      {/* SEPARATE CARD LIST LAYOUT */}
      {searchedOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/85 rounded-3xl p-16 text-center text-slate-400 text-xs font-bold shadow-sm">
          No live orders match selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {searchedOrders.map((order) => {
            const isExpanded = expandedIds.has(order.id);
            const hasPendingVerification = order.paymentStatus === 'PENDING_VERIFICATION';

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-3xl transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'border-cyan-500/40 shadow-lg shadow-slate-100 ring-1 ring-cyan-500/5' 
                    : 'border-slate-200/80 hover:border-cyan-200 hover:shadow-md hover:shadow-slate-100/50'
                }`}
              >
                {/* Row Summary */}
                <div
                  onClick={() => toggleRowExpand(order.id)}
                  className={`grid grid-cols-1 sm:grid-cols-12 items-center p-5 cursor-pointer text-xs select-none gap-4 text-left font-sans transition-colors ${
                    isExpanded ? 'bg-slate-50/40 border-b border-slate-100' : ''
                  }`}
                >
                  {/* Col 1: Order Number / Time */}
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <span className="font-black text-slate-900 text-base">#{order.orderNumber}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-extrabold bg-slate-50 border border-slate-150/40 px-2 py-0.5 rounded-lg shrink-0">
                      <Clock size={11} className="text-slate-400" />
                      <span>{getElapsedTime(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Col 2: Table & Special Request Badge */}
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
                    <span className="bg-gradient-to-r from-cyan-50 to-cyan-100/40 border border-cyan-150/60 text-cyan-600 px-3 py-1 rounded-xl font-extrabold text-[10px] shadow-sm tracking-tight shrink-0">
                      Table {order.tableNumber}
                    </span>
                    {order.specialInstructions && (
                      <span className="bg-amber-500 text-white px-2 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-amber-500/10 animate-pulse shrink-0">
                        <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                        Reqs
                      </span>
                    )}
                  </div>

                  {/* Col 3: Customer Details */}
                  <div className="sm:col-span-3 min-w-0 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600 font-black text-[10px] shrink-0 uppercase">
                      {order.customerName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="block font-black text-slate-800 text-xs tracking-tight truncate">
                        {order.customerName}
                      </span>
                      <span className="text-[10px] text-slate-450 block font-mono font-medium mt-0.5 truncate flex items-center gap-1">
                        <Phone size={9} className="text-slate-400" />
                        {order.customerMobile}
                      </span>
                    </div>
                  </div>

                  {/* Col 4: Timer Countdown */}
                  <div className="sm:col-span-2 flex items-center">
                    {order.status === 'PREPARING' && order.preparationTime > 0 && (
                      <div className="scale-90 origin-left">
                        <PrepCountdown preparingAt={order.preparingAt} preparationTime={order.preparationTime} />
                      </div>
                    )}
                  </div>

                  {/* Col 5: Amount */}
                  <div className="font-black text-slate-900 text-sm sm:text-right sm:col-span-1">
                    {formatPrice(order.totalAmount)}
                  </div>

                  {/* Col 6: Badges & Chevron Toggle */}
                  <div className="sm:col-span-2 flex items-center justify-end gap-3.5 w-full">
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {/* Payment Status */}
                      {hasPendingVerification ? (
                        <span className="inline-flex bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-lg font-extrabold text-[9px] uppercase tracking-wider animate-pulse items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Verify Pay
                        </span>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-extrabold uppercase tracking-wider shadow-sm ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-slate-50 border-slate-200/80 text-slate-505'
                          }`}
                        >
                          {order.paymentMethod}: {order.paymentStatus}
                        </span>
                      )}

                      {/* Order status */}
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm ${
                          order.status === 'RECEIVED'
                            ? 'bg-red-50 border-red-100 text-red-650'
                            : order.status === 'PREPARING'
                            ? 'bg-orange-50 border-orange-100 text-orange-650'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-650'
                        }`}
                      >
                        {order.status === 'RECEIVED' && 'Pending'}
                        {order.status === 'PREPARING' && 'Preparing'}
                        {order.status === 'SERVED' && 'Served'}
                      </span>
                    </div>

                    <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Accordion Details */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/20 grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                    {/* Left Column: Checklist & Instructions */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                      {order.specialInstructions && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-l-4 border-amber-500 rounded-xl p-4 text-left space-y-1">
                          <span className="text-[9px] font-black text-amber-850 uppercase tracking-widest flex items-center gap-1.5">
                            <AlertCircle size={12} className="text-amber-500 shrink-0" />
                            📝 Special Instructions
                          </span>
                          <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                            "{order.specialInstructions}"
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                            <CheckSquare size={13} />
                          </span>
                          <span className="text-[10px] text-slate-650 font-black uppercase tracking-wider">
                            Kitchen Checklist
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          {order.items.length} items
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {order.items.map((item) => {
                          const isPrepared = preparedItems.has(`${order.id}-${item.id}`);
                          return (
                            <div
                              key={item.id}
                              onClick={(e) => toggleItemPrepared(order.id, item.id, e)}
                              className={`flex justify-between items-center p-3.5 rounded-xl border select-none transition-all cursor-pointer ${
                                isPrepared
                                  ? 'bg-emerald-50/10 border-emerald-100/50 text-slate-400 line-through shadow-inner'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50 hover:border-cyan-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isPrepared
                                      ? 'border-emerald-500 bg-emerald-500 text-white'
                                      : 'border-slate-350 bg-white'
                                  }`}
                                >
                                  {isPrepared && <Check size={11} className="stroke-[3.5]" />}
                                </div>
                                <span className="font-extrabold text-slate-800 text-xs">
                                  {item.name} <strong className="text-slate-400 font-medium ml-1">× {item.quantity}</strong>
                                </span>
                              </div>
                              <span className="font-mono font-bold text-xs text-slate-500">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Middle Column: Waiter & Communication controls */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-5 flex flex-col justify-between">
                      {/* Waiter assign select */}
                      <div className="space-y-2">
                        <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                          <Users size={13} className="text-slate-400" />
                          <span>Assign Service Waiter</span>
                        </label>
                        <div className="relative">
                          <select
                            value={order.assignedWaiter || ''}
                            onChange={(e) => updateWaiter(order.id, e.target.value)}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-cyan-500 focus:bg-white text-slate-850 text-xs font-bold rounded-xl pl-3 pr-8 py-3.5 outline-none transition-all cursor-pointer"
                          >
                            <option value="">Unassigned</option>
                            {waiters.map((name) => (
                              <option key={name} value={name}>
                                👤 {name}
                              </option>
                            ))}
                          </select>
                          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-450">
                            <ChevronDown size={14} />
                          </span>
                        </div>
                      </div>

                      {/* Kitchen Private Note */}
                      <KitchenNoteInput
                        orderId={order.id}
                        initialNotes={order.merchantNotes}
                        onSave={updateMerchantNotes}
                      />

                      {/* Verify Payment Overlay (If pending verification) */}
                      {hasPendingVerification && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                          <span className="text-[9px] font-black text-amber-850 uppercase tracking-widest block">
                            Pending Manual Verification
                          </span>
                          <p className="text-xs text-amber-700 leading-relaxed font-light">
                            Customer paid **{formatPrice(order.totalAmount)}** via **{order.paymentMethod}**. Verify your accounts, then click approve:
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => approvePayment(order.id)}
                              disabled={updatingId === order.id}
                              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black py-2.5 px-3 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer transition-all shadow-sm shadow-amber-500/10 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {updatingId === order.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Play size={11} className="stroke-[2.5]" />
                              )}
                              <span>Approve & Cook</span>
                            </button>
                            <button
                              onClick={() => rejectOrder(order.id)}
                              disabled={updatingId === order.id}
                              className="bg-white hover:bg-red-50 border border-amber-250 text-slate-500 hover:text-red-650 font-black py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Customer Actions WhatsApp & Print */}
                      <div className="flex gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl justify-between items-center">
                        <span className="text-[9px] text-slate-455 font-black uppercase tracking-widest">
                          Actions
                        </span>
                        <div className="flex gap-2">
                          <a
                            href={getWhatsAppLink(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 hover:bg-emerald-50 text-slate-650 hover:text-emerald-700 rounded-xl border border-slate-200 hover:border-emerald-100 transition-colors flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider bg-white shadow-sm"
                            title="Notify Guest"
                          >
                            <MessageSquare size={13} className="text-emerald-500" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            onClick={() => setReceiptModalOrder(order)}
                            className="px-4 py-2 hover:bg-slate-50 text-slate-650 hover:text-slate-800 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider bg-white shadow-sm"
                            title="Print receipt"
                          >
                            <Printer size={13} className="text-slate-500" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Pipeline progress, timers, & Action button */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-5 flex flex-col justify-between lg:col-span-1">
                      {/* Prep time dropdown & timer if preparing */}
                      <div className="space-y-3 bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl text-left">
                        {(order.status === 'RECEIVED' || order.status === 'PREPARING') && (
                          <div className="space-y-2">
                            <label className="block text-[9px] font-black text-slate-455 uppercase tracking-widest flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400" />
                              <span>Est. Cooking Time</span>
                            </label>
                            <div className="relative">
                              <select
                                value={order.preparationTime || ''}
                                onChange={(e) => updatePreparationTime(order.id, parseInt(e.target.value, 10))}
                                className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-cyan-500 text-slate-805 text-xs font-bold rounded-xl pl-3 pr-8 py-2.5 outline-none transition-colors cursor-pointer"
                              >
                                <option value="">Not Assigned</option>
                                <option value="5">5 mins</option>
                                <option value="10">10 mins</option>
                                <option value="15">15 mins</option>
                                <option value="20">20 mins</option>
                                <option value="30">30 mins</option>
                                <option value="45">45 mins</option>
                              </select>
                              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown size={14} />
                              </span>
                            </div>
                          </div>
                        )}

                        {order.status === 'PREPARING' && order.preparationTime > 0 && order.preparingAt && (
                          <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">
                              Cooking Countdown
                            </span>
                            <div className="scale-110 origin-right">
                              <PrepCountdown preparingAt={order.preparingAt} preparationTime={order.preparationTime} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Operations Timeline Details */}
                      <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 space-y-4 text-left">
                        <span className="text-[9px] text-slate-455 font-black uppercase tracking-widest block border-b border-slate-200 pb-2">
                          Operations Timeline
                        </span>
                        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {/* Received step */}
                          <div className="flex gap-3 items-start relative z-10">
                            <div className="w-6 h-6 rounded-full bg-cyan-500 border-2 border-cyan-100 flex items-center justify-center shrink-0 shadow shadow-cyan-500/20">
                              <Check size={11} className="text-white stroke-[3]" />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-800">Order Received</p>
                              <p className="text-[9px] text-slate-450 font-bold mt-0.5">
                                {formatTime(order.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Preparing step */}
                          <div className="flex gap-3 items-start relative z-10">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                              order.preparingAt 
                                ? 'bg-orange-500 border-orange-100 text-white shadow shadow-orange-500/20' 
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}>
                              {order.preparingAt ? (
                                <Check size={11} className="stroke-[3]" />
                              ) : (
                                <span className="text-[9px] font-black">2</span>
                              )}
                            </div>
                            <div>
                              <p className={`text-[11px] font-black ${order.preparingAt ? 'text-slate-800' : 'text-slate-400'}`}>
                                Prep Started
                              </p>
                              <p className="text-[9px] text-slate-455 font-bold mt-0.5">
                                {order.preparingAt ? (
                                  <>
                                    {formatTime(order.preparingAt)}
                                    <span className="text-cyan-655 font-extrabold ml-1 inline-block">
                                      ({Math.max(0, Math.round((new Date(order.preparingAt).getTime() - new Date(order.createdAt).getTime()) / 60000))}m wait)
                                    </span>
                                  </>
                                ) : (
                                  'Waiting in queue'
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Served step */}
                          <div className="flex gap-3 items-start relative z-10">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                              order.servedAt 
                                ? 'bg-emerald-500 border-emerald-100 text-white shadow shadow-emerald-500/20' 
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}>
                              {order.servedAt ? (
                                <Check size={11} className="stroke-[3]" />
                              ) : (
                                <span className="text-[9px] font-black">3</span>
                              )}
                            </div>
                            <div>
                              <p className={`text-[11px] font-black ${order.servedAt ? 'text-slate-800' : 'text-slate-400'}`}>
                                Served
                              </p>
                              <p className="text-[9px] text-slate-455 font-bold mt-0.5">
                                {order.servedAt ? (
                                  <>
                                    {formatTime(order.servedAt)}
                                    {order.preparingAt && (
                                      <span className="text-cyan-655 font-extrabold ml-1 inline-block">
                                        ({Math.max(1, Math.round((new Date(order.servedAt).getTime() - new Date(order.preparingAt).getTime()) / 60000))}m cook)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  'Not served yet'
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stage Progress line */}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="flex justify-between text-[8px] text-slate-450 uppercase font-black tracking-wider">
                          <span className={order.status === 'RECEIVED' ? 'text-red-500 font-extrabold' : ''}>Received</span>
                          <span className={order.status === 'PREPARING' ? 'text-orange-500 font-extrabold' : ''}>Preparing</span>
                          <span className={order.status === 'SERVED' ? 'text-emerald-500 font-extrabold' : ''}>Served</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden border border-slate-200/50">
                          <div className={`h-full transition-all duration-500 rounded-full ${
                            order.status === 'RECEIVED' ? 'w-1/3 bg-gradient-to-r from-red-500 to-red-400' :
                            order.status === 'PREPARING' ? 'w-2/3 bg-gradient-to-r from-red-500 via-orange-500 to-orange-400 animate-pulse' :
                            'w-full bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500'
                          }`} />
                        </div>
                      </div>

                      {/* CTA button */}
                      <div className="pt-2">
                        {!hasPendingVerification && order.status === 'RECEIVED' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                            disabled={updatingId === order.id}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                          >
                            <Play size={13} className="fill-current" />
                            <span>Start Preparing</span>
                          </button>
                        )}

                        {!hasPendingVerification && order.status === 'PREPARING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'SERVED')}
                            disabled={updatingId === order.id}
                            className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                          >
                            <Check size={13} className="stroke-[3]" />
                            <span>Mark Served</span>
                          </button>
                        )}

                        {order.status === 'SERVED' && (
                          <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-inner">
                            <Check size={14} className="text-emerald-500 stroke-[3]" />
                            <span>Completed & Served</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
              <p className="text-[10px] text-slate-400 font-bold">TABLE ORDERING PORTAL</p>
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
            <div className="border-t border-dashed border-slate-300 py-3 space-y-1 text-slate-700 text-left">
              <p><strong>Order ID:</strong> #{receiptModalOrder.orderNumber}</p>
              <p><strong>Table Name:</strong> Table {receiptModalOrder.tableNumber}</p>
              <p><strong>Guest Name:</strong> {receiptModalOrder.customerName}</p>
              <p><strong>Mobile No:</strong> {receiptModalOrder.customerMobile}</p>
              {receiptModalOrder.assignedWaiter && (
                <p><strong>Waiter Name:</strong> {receiptModalOrder.assignedWaiter}</p>
              )}
              <p><strong>Pay Method:</strong> {receiptModalOrder.paymentMethod}</p>
            </div>

            {/* Items table */}
            <div className="border-t border-b border-dashed border-slate-300 py-3 my-3 space-y-2 text-left">
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

            {/* Special Instructions inside receipt if present */}
            {receiptModalOrder.specialInstructions && (
              <div className="border-t border-dashed border-slate-300 py-3 my-3 text-left text-[10px] text-amber-800">
                <p className="font-extrabold uppercase">Guest Requests:</p>
                <p className="italic text-slate-650 font-sans mt-0.5">"{receiptModalOrder.specialInstructions}"</p>
              </div>
            )}

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
