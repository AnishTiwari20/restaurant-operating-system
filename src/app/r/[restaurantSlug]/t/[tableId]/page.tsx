import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import CustomerEntryForm from './CustomerEntryForm';

interface Props {
  params: Promise<{
    restaurantSlug: string;
    tableId: string;
  }>;
}

export default async function TableEntryPage({ params }: Props) {
  const { restaurantSlug, tableId } = await params;

  // 1. Fetch restaurant and table details
  const restaurant = await db.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: {
      settings: true,
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const table = await db.table.findFirst({
    where: {
      id: tableId,
      restaurantId: restaurant.id,
    },
  });

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Table QR Code</h1>
          <p className="text-slate-500 mb-6">
            This QR code is either invalid or does not belong to {restaurant.name}. Please ask the staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 p-4 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Main content container */}
      <div className="flex-1 flex flex-col items-center justify-center my-8 relative z-10">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 shadow-md relative overflow-hidden">
          {/* Accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500" />

          {/* Restaurant Branding Header */}
          <div className="text-center mb-8">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-cyan-500/20 p-1 mb-4 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-50 border border-cyan-150 flex items-center justify-center text-cyan-600 text-3xl font-extrabold mb-4 shadow-sm">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{restaurant.name}</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              RestaurantOS Powered
            </p>
          </div>

          {/* Table info card */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-6 flex justify-between items-center shadow-inner">
            <span className="text-sm text-slate-500 font-medium">Your Table:</span>
            <span className="text-lg font-black text-cyan-600 px-4 py-1.5 bg-cyan-50 border border-cyan-100 rounded-xl shadow-sm">
              Table {table.number}
            </span>
          </div>

          {/* Client customer registration form */}
          <CustomerEntryForm
            restaurantSlug={restaurantSlug}
            restaurantName={restaurant.name}
            tableId={table.id}
            tableNumber={table.number}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-450 uppercase tracking-widest py-4 relative z-10">
        © {new Date().getFullYear()} {restaurant.name}. Powered by RestaurantOS
      </footer>
    </div>
  );
}
