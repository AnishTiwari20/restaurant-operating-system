'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  Search,
  ChevronRight,
  TrendingDown,
  Clock,
  Briefcase,
  Utensils,
  Award,
  Sparkles,
  Loader2
} from 'lucide-react';

interface OrderLog {
  id: string;
  orderNumber: number;
  customerName: string;
  customerMobile: string;
  tableNumber: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  itemsCount: number;
}

interface PopularDish {
  name: string;
  quantity: number;
  revenue: number;
}

interface Metrics {
  totalOrdersCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface Props {
  initialMetrics: Metrics;
  initialPopularDishes: PopularDish[];
  initialOrders: OrderLog[];
  lifetimeRevenue: number;
  currency: string;
}

export default function DashboardClient({
  initialMetrics,
  initialPopularDishes,
  initialOrders,
  lifetimeRevenue,
  currency,
}: Props) {
  // Date states (default to Today)
  const getTodayString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  // Metrics states
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [popularDishes, setPopularDishes] = useState<PopularDish[]>(initialPopularDishes);
  const [orders, setOrders] = useState<OrderLog[]>(initialOrders);

  // UI States
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/restaurant/dashboard/stats?startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setPopularDishes(data.popularDishes);
        setOrders(data.orders);
      } else {
        alert('Failed to load dashboard metrics.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error loading metrics.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial load or on filter click
  const handleFilterClick = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  // Filter logs locally based on search
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.customerMobile.includes(q) ||
      `#${o.orderNumber}`.includes(q) ||
      `table ${o.tableNumber}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 text-left">
      {/* Header controls & Date Picker */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Business Dashboard</h1>
          <p className="text-slate-500 text-xs mt-1">
            Analyze revenues, order sizes, menu item popularity, and browse comprehensive order histories.
          </p>
        </div>

        {/* Date Filter Form */}
        <form onSubmit={handleFilterClick} className="flex flex-wrap items-end gap-3 w-full xl:w-auto">
          <div className="space-y-1.5 flex-1 sm:flex-initial">
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5 flex-1 sm:flex-initial">
            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs outline-none focus:border-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 h-[38px] mt-auto"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Calendar size={14} />
                <span>Filter</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* METRICS SUMMARY GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scoped Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-500" />
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100/40">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Selected Revenue</span>
            <span className="text-base font-black text-slate-950 mt-0.5 block truncate">
              {formatPrice(metrics.totalRevenue)}
            </span>
          </div>
        </div>

        {/* Lifetime Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500" />
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/40">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Lifetime Revenue</span>
            <span className="text-base font-black text-slate-950 mt-0.5 block truncate">
              {formatPrice(lifetimeRevenue)}
            </span>
          </div>
        </div>

        {/* Selected Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500" />
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/40">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Selected Orders</span>
            <span className="text-base font-black text-slate-950 mt-0.5 block">
              {metrics.totalOrdersCount}
            </span>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500" />
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/40">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Avg Order Value</span>
            <span className="text-base font-black text-slate-950 mt-0.5 block truncate">
              {formatPrice(metrics.averageOrderValue)}
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED BUSINESS DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Scoped Orders Log list */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-extrabold text-sm text-slate-800">Orders log history</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">List of verified sales orders completed within dates.</p>
            </div>

            {/* Local search log */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-0 text-slate-900 rounded-xl pl-8 pr-4 py-1.5 text-xs outline-none"
              />
            </div>
          </div>

          {/* Orders Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50">
                  <th className="py-3 px-3">Order No</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-center">Table</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No orders found in selected dates.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/40 text-slate-700">
                      <td className="py-3 px-3 font-extrabold text-slate-950">#{order.orderNumber}</td>
                      <td className="py-3 px-3 truncate max-w-[120px]" title={order.customerName}>
                        <div className="font-bold text-slate-800">{order.customerName}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{order.customerMobile}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-cyan-600 text-[9px]">
                          T-{order.tableNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">{order.itemsCount}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[9px] bg-cyan-50 border border-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          {order.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Scoped Popular dishes contribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 h-fit">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Award size={16} className="text-amber-500" />
              <span>Popular Dishes</span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Top performing dishes inside date range.</p>
          </div>

          <div className="space-y-4">
            {popularDishes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No dish statistics available.
              </div>
            ) : (
              popularDishes.map((dish, idx) => {
                // Find percentage revenue contribution
                const totalRev = metrics.totalRevenue || 1;
                const percentage = Math.min(100, Math.max(5, Math.floor((dish.revenue / totalRev) * 100)));

                return (
                  <div key={dish.name} className="space-y-1.5">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-extrabold text-slate-800 text-xs">
                          {idx + 1}. {dish.name}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold mt-0.5">
                          {dish.quantity} Units Sold
                        </span>
                      </div>
                      <span className="font-mono text-slate-900 font-extrabold text-right">
                        {formatPrice(dish.revenue)}
                      </span>
                    </div>

                    {/* Progress representation bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 flex">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full h-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
