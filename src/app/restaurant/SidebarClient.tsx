'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  TableProperties,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface Props {
  restaurantName: string;
  logoUrl: string | null;
  role: string;
  userName: string;
  userEmail: string;
  onLogout: () => Promise<void>;
}

export default function SidebarClient({
  restaurantName,
  logoUrl,
  role,
  userName,
  userEmail,
  onLogout,
}: Props) {
  const pathname = usePathname();

  const links = [
    { href: '/restaurant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/restaurant/orders', label: 'Live Orders', icon: ClipboardList },
    { href: '/restaurant/menu', label: 'Menu Settings', icon: UtensilsCrossed },
    { href: '/restaurant/tables', label: 'Tables & QRs', icon: TableProperties },
    { href: '/restaurant/settings', label: 'Settings', icon: Settings },
  ];

  return (
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
          <div className="text-left">
            <h2 className="text-sm font-black text-slate-900 truncate max-w-[150px]" title={restaurantName}>
              {restaurantName}
            </h2>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
              {role === 'RESTAURANT_OWNER' ? 'Owner Portal' : 'Staff Portal'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            // Matches path exactly
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold border ${
                  isActive
                    ? 'bg-cyan-50/70 border-cyan-100 text-cyan-600 shadow-sm shadow-cyan-500/[0.02]'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-cyan-600'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-cyan-500' : 'text-slate-400'} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-slate-200/80 space-y-3 bg-slate-50/30">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            <UserIcon size={14} />
          </div>
          <div className="truncate text-left">
            <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>

        <form action={onLogout}>
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
  );
}
