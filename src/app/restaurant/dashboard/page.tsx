import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Flame,
  CheckCircle,
  ArrowRight,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RestaurantDashboardPage() {
  // 1. Verify auth session
  const session = await getSession();
  if (!session || !session.restaurantId) {
    redirect('/login');
  }

  const restaurantId = session.restaurantId;

  // 2. Calculate time boundaries for "Today"
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 3. Fetch stats queries
  const [
    todayOrders,
    pendingOrdersCount,
    preparingOrdersCount,
    completedOrdersCount,
    recentOrders,
    restaurant,
  ] = await Promise.all([
    // Today's total orders
    db.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startOfToday },
        paymentStatus: 'PAID',
      },
    }),
    // Pending Orders count (RECEIVED)
    db.order.count({
      where: {
        restaurantId,
        status: 'RECEIVED',
        paymentStatus: 'PAID',
      },
    }),
    // Preparing Orders count
    db.order.count({
      where: {
        restaurantId,
        status: 'PREPARING',
        paymentStatus: 'PAID',
      },
    }),
    // Completed Orders count (SERVED)
    db.order.count({
      where: {
        restaurantId,
        status: 'SERVED',
        paymentStatus: 'PAID',
      },
    }),
    // Recent 5 Orders
    db.order.findMany({
      where: {
        restaurantId,
        paymentStatus: 'PAID',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        table: true,
      },
    }),
    // Restaurant settings (for currency formatting)
    db.restaurant.findUnique({
      where: { id: restaurantId },
    }),
  ]);

  // 4. Calculate total revenue today
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const currency = restaurant?.currency || 'INR';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-xs mt-1">
          Here is a summary of your restaurant operations and sales performance for today.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Today's Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Today's Revenue
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block truncate">
              {formatPrice(todayRevenue)}
            </span>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Today's Orders
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {todayOrders.length}
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Pending Orders
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {pendingOrdersCount}
            </span>
          </div>
        </div>

        {/* Preparing Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Flame size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Preparing Orders
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {preparingOrdersCount}
            </span>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Completed Orders
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {completedOrdersCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-sm text-slate-800">Recent Orders</h2>
            <Link
              href="/restaurant/orders"
              className="text-[10px] text-cyan-600 uppercase tracking-widest font-black flex items-center gap-1 hover:text-cyan-700 transition-colors"
            >
              <span>View All Live Orders</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Table</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-light">
                      No orders recorded yet today.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 text-slate-700 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">Order #{order.orderNumber}</td>
                      <td className="py-3.5 text-slate-400">
                        {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5">
                        <span className="bg-slate-50 px-2 py-1 border border-slate-200 rounded-md text-cyan-600 font-bold">
                          T-{order.table.number}
                        </span>
                      </td>
                      <td className="py-3.5 truncate max-w-[120px]">{order.customerName}</td>
                      <td className="py-3.5 font-semibold text-slate-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            order.status === 'RECEIVED'
                              ? 'bg-red-50 border-red-100 text-red-700'
                              : order.status === 'PREPARING'
                              ? 'bg-orange-50 border-orange-100 text-orange-700'
                              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          }`}
                        >
                          {order.status === 'RECEIVED' && 'Received'}
                          {order.status === 'PREPARING' && 'Preparing'}
                          {order.status === 'SERVED' && 'Served'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations panel */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
          <h2 className="font-extrabold text-sm text-slate-800">Management Center</h2>

          <div className="space-y-4">
            <Link
              href="/restaurant/orders"
              className="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200/85 hover:border-slate-300 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 bg-cyan-50 group-hover:bg-cyan-100 border border-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <Utensils size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-slate-800">Manage Live Orders</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Update customer order statuses in real-time.
                </p>
              </div>
            </Link>

            <Link
              href="/restaurant/menu"
              className="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-200/85 hover:border-slate-300 rounded-2xl transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <ShoppingBag size={18} />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-slate-800">Configure Menu</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Add, edit, delete, or mark dishes out-of-stock.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
