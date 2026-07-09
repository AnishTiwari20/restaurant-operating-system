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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Live Orders Queue</h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage incoming tables and kitchen preparation. Tap on any order row to expand details.
          </p>
        </div>

        {/* Audio control */}
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
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by customer name, mobile, table, order #, total amount..."
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
            Active Queue ({orders.filter((o) => o.status === 'RECEIVED' || o.status === 'PREPARING').length})
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

      {/* LIST VIEW LAYOUT TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        {searchedOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            No live orders match selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {searchedOrders.map((order) => {
              const isExpanded = expandedIds.has(order.id);
              const hasPendingVerification = order.paymentStatus === 'PENDING_VERIFICATION';

              return (
                <div
                  key={order.id}
                  className={`transition-colors duration-200 ${
                    isExpanded ? 'bg-slate-50/30' : 'hover:bg-slate-50/20'
                  }`}
                >
                  {/* Row Summary */}
                  <div
                    onClick={() => toggleRowExpand(order.id)}
                    className="grid grid-cols-1 sm:grid-cols-12 items-center p-5 cursor-pointer text-xs select-none gap-4 text-left font-sans"
                  >
                    {/* Col 1: Order Number / Time */}
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <span className="font-black text-slate-900 text-sm">#{order.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{getElapsedTime(order.createdAt)}</span>
                    </div>

                    {/* Col 2: Table */}
                    <div className="sm:text-center sm:col-span-2">
                      <span className="bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded font-black text-cyan-600 text-[10px] inline-block">
                        Table {order.tableNumber}
                      </span>
                    </div>

                    {/* Col 3: Customer Details */}
                    <div className="text-slate-700 font-bold sm:col-span-3 min-w-0 truncate">
                      <span className="block truncate">{order.customerName}</span>
                      <span className="text-[9px] text-slate-455 block font-mono font-medium mt-0.5 truncate">
                        {order.customerMobile}
                      </span>
                    </div>

                    {/* Col 4: Amount */}
                    <div className="font-extrabold text-slate-900 sm:text-right sm:col-span-1">
                      {formatPrice(order.totalAmount)}
                    </div>

                    {/* Col 5: Payment Badge */}
                    <div className="sm:text-right sm:col-span-2">
                      {hasPendingVerification ? (
                        <span className="inline-flex bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider animate-pulse items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Verify Payment
                        </span>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          {order.paymentMethod}: {order.paymentStatus}
                        </span>
                      )}
                    </div>

                    {/* Col 6: Order Status Badge */}
                    <div className="flex items-center justify-end gap-2.5 sm:col-span-2 w-full">
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
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                    </div>
                  </div>

                  {/* Expanded Accordion Details */}
                  {isExpanded && (
                    <div className="px-5 pb-6 border-t border-slate-100 bg-white grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
                      {/* Left: Interactive Checklist */}
                      <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Kitchen Checklist
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">Click to cross prepared items</span>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item) => {
                            const isPrepared = preparedItems.has(`${order.id}-${item.id}`);
                            return (
                              <div
                                key={item.id}
                                onClick={(e) => toggleItemPrepared(order.id, item.id, e)}
                                className={`flex justify-between items-center p-2 rounded-xl border select-none transition-all ${
                                  isPrepared
                                    ? 'bg-emerald-50/30 border-emerald-100/40 text-slate-400 line-through'
                                    : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isPrepared ? (
                                    <CheckSquare size={13} className="text-cyan-500 shrink-0" />
                                  ) : (
                                    <Square size={13} className="text-slate-400 shrink-0" />
                                  )}
                                  <span className="font-semibold text-slate-800 text-xs">
                                    {item.name} <strong className="text-slate-400 font-medium">× {item.quantity}</strong>
                                  </span>
                                </div>
                                <span className="font-mono text-slate-500">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Middle: Waiter & Communication controls */}
                      <div className="space-y-4 flex flex-col justify-between">
                        {/* Waiter assign select */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Users size={12} className="text-slate-450" />
                            <span>Assign Service Waiter</span>
                          </label>
                          <select
                            value={order.assignedWaiter || ''}
                            onChange={(e) => updateWaiter(order.id, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 text-slate-800 rounded-xl px-3 py-2.5 outline-none transition-colors"
                          >
                            <option value="">Unassigned</option>
                            {waiters.map((name) => (
                              <option key={name} value={name}>
                                👤 {name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Verify Payment Overlay (If pending verification) */}
                        {hasPendingVerification && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
                            <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">
                              Pending Manual Verification
                            </span>
                            <p className="text-[10px] text-amber-700 leading-relaxed font-light">
                              Customer paid **{formatPrice(order.totalAmount)}** via **{order.paymentMethod}**. Verify your accounts, then click approve:
                            </p>
                            <div className="flex gap-2">
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
                                className="bg-white hover:bg-red-50 border border-amber-250 text-slate-500 hover:text-red-650 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wide cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Customer Actions WhatsApp & Print */}
                        <div className="flex gap-2 bg-slate-50/60 border border-slate-200/80 p-3 rounded-2xl justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Actions
                          </span>
                          <div className="flex gap-2">
                            <a
                              href={getWhatsAppLink(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl border border-slate-200 hover:border-emerald-100 transition-colors flex items-center gap-1 font-bold"
                              title="Notify Guest"
                            >
                              <MessageSquare size={13} />
                              <span>WhatsApp</span>
                            </a>
                            <button
                              onClick={() => setReceiptModalOrder(order)}
                              className="px-3.5 py-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 font-bold"
                              title="Print receipt"
                            >
                              <Printer size={13} />
                              <span>Receipt</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Pipeline progress & Action button */}
                      <div className="space-y-4 flex flex-col justify-between">
                        {/* Stage Progress line */}
                        <div className="space-y-2">
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

                        {/* CTA button */}
                        <div className="pt-2">
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
