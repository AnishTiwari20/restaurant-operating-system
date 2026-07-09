import { redirect } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';
import { db } from '@/lib/db';
import React from 'react';
import SidebarClient from './SidebarClient';

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
      <SidebarClient
        restaurantName={restaurantName}
        logoUrl={logoUrl}
        role={session.role}
        userName={session.name}
        userEmail={session.email}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
        {/* Top visual accents */}
        <div className="fixed top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
