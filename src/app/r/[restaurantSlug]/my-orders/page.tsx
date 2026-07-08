'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, ChevronRight, Loader2, ClipboardList, ShieldCheck, XCircle } from 'lucide-react';

interface OrderItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  orderNumber: number;
  status: string; // RECEIVED | PREPARING | SERVED
  paymentStatus: string; // PENDING | PAID | FAILED
  paymentMethod: string | null;
  totalAmount: number;
  createdAt: string;
  items: OrderItemData[];
}

interface Props {
  params: Promise<{
    restaurantSlug: string;
  }>;
}

export default function CustomerOrdersHistoryPage({ params }: Props) {
  const router = useRouter();
  const { restaurantSlug } = use(params);

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Load customer details and fetch their orders
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[2]) : '';
    };

    const name = getCookie('customer_name');
    const mobile = getCookie('customer_mobile');

    if (!mobile) {
      router.push(`/r/${restaurantSlug}/menu`);
      return;
    }

    setCustomerName(name);
    setCustomerMobile(mobile);

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `/api/customer/orders?restaurantSlug=${restaurantSlug}&mobile=${encodeURIComponent(mobile)}`
        );
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders || []);
        } else {
          setErrorMsg(data.message || 'Failed to load order history.');
        }
      } catch {
        setErrorMsg('Network error. Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [restaurantSlug, router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Group active vs completed orders
  const activeOrders = orders.filter((o) => o.status !== 'SERVED');
  const completedOrders = orders.filter((o) => o.status === 'SERVED');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500 sticky top-0 z-50" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-1 z-40">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push(`/r/${restaurantSlug}/menu`)}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">My Orders</h1>
            <p className="text-[10px] text-slate-450 font-medium">{customerMobile}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-6 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="animate-spin text-cyan-500" size={32} />
            <span className="text-xs text-slate-400 font-semibold">Loading orders...</span>
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 border border-red-100 text-red-650 text-xs rounded-xl p-4 flex items-center gap-2">
            <XCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ClipboardList className="mx-auto text-slate-300" size={48} />
            <h3 className="font-extrabold text-sm text-slate-700">No orders found</h3>
            <p className="text-xs text-slate-450 max-w-xs mx-auto leading-relaxed font-light">
              You haven't placed any orders from this mobile number at our restaurant yet. Scan a table QR code to begin ordering!
            </p>
            <button
              onClick={() => router.push(`/r/${restaurantSlug}/menu`)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-colors shadow-md shadow-cyan-500/10"
            >
              Go to Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Orders Block */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider block">
                  Active Orders ({activeOrders.length})
                </span>

                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border-2 border-cyan-100 hover:border-cyan-200 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all duration-200"
                    >
                      {/* Left vertical cyan stripe */}
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-500" />

                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-cyan-600 uppercase font-black tracking-wider block">
                            Active Order #{order.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-black text-slate-900">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {order.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>

                      {/* Item Summary list */}
                      <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span>{item.name} <span className="text-slate-400 font-light">x{item.quantity}</span></span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-cyan-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase text-cyan-600 tracking-wider">
                            {order.status === 'RECEIVED' ? 'Order Received' : 'Preparing Food'}
                          </span>
                        </div>
                        <button
                          onClick={() => router.push(`/r/${restaurantSlug}/order/${order.id}`)}
                          className="bg-cyan-50 hover:bg-cyan-100 text-cyan-600 font-extrabold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <span>Track Live</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Orders Block */}
            {completedOrders.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider block">
                  Past Orders ({completedOrders.length})
                </span>

                <div className="space-y-3">
                  {completedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block">
                            Order #{order.orderNumber}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-light">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span className="text-[9px] text-slate-450 block font-light">
                            {order.paymentMethod || 'Paid'}
                          </span>
                        </div>
                      </div>

                      {/* Summary list */}
                      <p className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-100/60">
                        {order.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                      </p>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100/60">
                        <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                          <CheckCircle2 size={11} />
                          <span>Served successfully</span>
                        </div>
                        <button
                          onClick={() => router.push(`/r/${restaurantSlug}/order/${order.id}`)}
                          className="text-[9px] font-bold text-slate-450 hover:text-cyan-600 underline cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
