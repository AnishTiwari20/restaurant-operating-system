import { db } from '@/lib/db';
import Link from 'next/link';
import { Utensils, QrCode, ClipboardList, ShieldAlert, Monitor, ArrowRight, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch demo restaurant and first table ID to make the sandbox demo link work dynamically
  const demoRestaurant = await db.restaurant.findUnique({
    where: { slug: 'cafe-delight' },
    include: {
      tables: {
        orderBy: { number: 'asc' },
        take: 1,
      },
    },
  });

  const demoTableId = demoRestaurant?.tables[0]?.id;
  const demoLink = demoTableId ? `/r/cafe-delight/t/${demoTableId}` : '/r/cafe-delight/menu';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.04)_0%,transparent_60%)] pointer-events-none" />

      {/* Navigation header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-50 border border-cyan-150 text-cyan-600 rounded-xl flex items-center justify-center font-black">
              <Utensils size={18} />
            </div>
            <span className="font-black text-sm tracking-tight text-slate-900">RestaurantOS</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-500 hover:text-slate-950 transition-all"
            >
              Sign In
            </Link>
            <Link
              href={demoLink}
              className="bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
            >
              Try Customer Flow
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl w-full mx-auto px-6 py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 flex-1">
        <div className="space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-full text-[10px] uppercase tracking-wider font-extrabold w-fit mx-auto lg:mx-0">
            <Star size={10} fill="currentColor" />
            <span>Version 1.0 Production-Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-slate-900">
            The Digital Operating System for <span className="text-cyan-600">Independent Restaurants</span>.
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
            Onboard restaurants, generate table QR codes, receive live customer orders, verify payments, and manage menus and table details—all through one seamless multi-tenant SaaS dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href={demoLink}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:scale-95 text-white font-black px-8 py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/15 transition-all cursor-pointer"
            >
              <span>Scan QR Demo</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/login"
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-750 hover:text-slate-900 font-extrabold px-8 py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Merchant Login</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Card 1: Multi-tenant */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center">
              <Monitor size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Multi-Tenant SaaS</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-light">
              Add and manage independent restaurant accounts with separate databases, categories, items, and owner logins.
            </p>
          </div>

          {/* Card 2: QR Code */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Table QR Generator</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-light">
              Generate, print, or download unique QR code graphics for specific tables. Customers scan to order immediately.
            </p>
          </div>

          {/* Card 3: Live Orders */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Live Orders Board</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-light">
              Real-time merchant display that rings on incoming orders. Update statuses (Received → Preparing → Served) instantly.
            </p>
          </div>

          {/* Card 4: Payments */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-purple-50 border border-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Secure Payments</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-light">
              Simulated payment gateway sandbox validation. Orders are only created upon verified successful transactions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400 uppercase tracking-widest relative z-10">
        © {new Date().getFullYear()} RestaurantOS. All rights reserved.
      </footer>
    </div>
  );
}
