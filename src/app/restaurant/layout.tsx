import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, clearSession } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  TableProperties,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import React from 'react';

export const dynamic = 'force-dynamic';

interface Props {
  children: React.ReactNode;
}

export default async function RestaurantDashboardLayout({ children }: Props) {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session || (session.role !== 'RESTAURANT_OWNER' && session.role !== 'RESTAURANT_STAFF')) {
    redirect('/login');
  }

  // 2. Load restaurant details
  let restaurantName = 'Restaurant Dashboard';
  let logoUrl = null;
  if (session.restaurantId) {
    const restaurant = await db.restaurant.findUnique({
      where: { id: session.restaurantId },
    });
    if (restaurant) {
      restaurantName = restaurant.name;
      logoUrl = restaurant.logoUrl;
    }
  }

  // Server Action for Logout
  async function handleLogout() {
    'use server';
    await clearSession();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar for desktop */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Brand/Header */}
          <div className="p-6 border-b border-slate-200/80 flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-9 h-9 rounded-full object-cover border border-cyan-500/20"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-extrabold text-sm shadow-sm">
                {restaurantName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-sm font-black text-slate-900 truncate max-w-[150px]" title={restaurantName}>
                {restaurantName}
              </h2>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                {session.role === 'RESTAURANT_OWNER' ? 'Owner Portal' : 'Staff Portal'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1">
            <Link
              href="/restaurant/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-all text-xs font-bold"
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/restaurant/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-all text-xs font-bold"
            >
              <ClipboardList size={16} />
              <span>Live Orders</span>
            </Link>

            <Link
              href="/restaurant/menu"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-all text-xs font-bold"
            >
              <UtensilsCrossed size={16} />
              <span>Menu Settings</span>
            </Link>

            <Link
              href="/restaurant/tables"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-all text-xs font-bold"
            >
              <TableProperties size={16} />
              <span>Tables & QRs</span>
            </Link>

            <Link
              href="/restaurant/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-cyan-600 transition-all text-xs font-bold"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-200/80 space-y-3 bg-slate-50/30">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              <UserIcon size={14} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{session.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{session.email}</p>
            </div>
          </div>

          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-xs font-bold cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
        {/* Top visual accents */}
        <div className="fixed top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
