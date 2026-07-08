import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Store, CheckCircle, AlertTriangle, ShoppingBag, DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // 1. Authenticate superadmin
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  // 2. Load platform-wide stats
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalCount,
    activeCount,
    suspendedCount,
    todayOrders,
    recentRestaurants,
  ] = await Promise.all([
    // Total restaurants
    db.restaurant.count(),
    // Active restaurants
    db.restaurant.count({ where: { isActive: true } }),
    // Suspended restaurants
    db.restaurant.count({ where: { isActive: false } }),
    // Today's orders across platform
    db.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        paymentStatus: 'PAID',
      },
    }),
    // Last 5 registered restaurants
    db.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        users: {
          where: { role: 'RESTAURANT_OWNER' },
          select: { email: true },
        },
      },
    }),
  ]);

  // Calculations
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Platform Overview</h1>
          <p className="text-slate-500 text-xs mt-1">
            Super Administrator console to monitor all restaurant tenants, subscriptions, and platform-wide statistics.
          </p>
        </div>

        <Link
          href="/admin/restaurants"
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3 px-5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
        >
          <Plus size={15} />
          <span>New Restaurant</span>
        </Link>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Tenants */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
            <Store size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Total Restaurants
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Active Tenants */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Active Tenants
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {activeCount}
            </span>
          </div>
        </div>

        {/* Suspended Tenants */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-655 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Suspended
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {suspendedCount}
            </span>
          </div>
        </div>

        {/* Today's Platform Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Platform Orders
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              {todayOrders.length}
            </span>
          </div>
        </div>

        {/* Today's Platform Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Platform Revenue
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-1 block truncate">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(todayRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent tenants list */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="font-extrabold text-sm text-slate-800">Recently Registered Restaurants</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                <th className="pb-3 font-semibold">Restaurant Name</th>
                <th className="pb-3 font-semibold">Slug</th>
                <th className="pb-3 font-semibold">Owner Email</th>
                <th className="pb-3 font-semibold">Phone</th>
                <th className="pb-3 font-semibold">Date Onboarded</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-light">
                    No restaurants registered on the platform yet.
                  </td>
                </tr>
              ) : (
                recentRestaurants.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 text-slate-700 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">{res.name}</td>
                    <td className="py-3.5 text-slate-500 font-mono">/r/{res.slug}</td>
                    <td className="py-3.5">{res.users[0]?.email || 'N/A'}</td>
                    <td className="py-3.5 font-mono text-slate-650">{res.phone}</td>
                    <td className="py-3.5 text-slate-450">
                      {res.createdAt.toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          res.isActive
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-red-50 border-red-100 text-red-700'
                        }`}
                      >
                        {res.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
