'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Plus, Minus, X, Trash2, ArrowRight } from 'lucide-react';

interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  items: MenuItemData[];
}

interface Props {
  restaurantName: string;
  restaurantSlug: string;
  tableNumber: string;
  customerName: string;
  menuData: CategoryData[];
  currency: string;
  taxPercentage: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function MenuBrowser({
  restaurantName,
  restaurantSlug,
  tableNumber,
  customerName,
  menuData,
  currency,
}: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(`cart_${restaurantSlug}`);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
  }, [restaurantSlug]);

  // Save cart to localStorage when it changes
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem(`cart_${restaurantSlug}`, JSON.stringify(newCart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Add item to cart
  const addToCart = (item: MenuItemData) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      const updated = cart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
      saveCart(updated);
    } else {
      const newItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      };
      saveCart([...cart, newItem]);
    }
  };

  // Decrement item in cart
  const decrementCart = (itemId: string) => {
    const existing = cart.find((i) => i.id === itemId);
    if (!existing) return;

    if (existing.quantity === 1) {
      const updated = cart.filter((i) => i.id !== itemId);
      saveCart(updated);
    } else {
      const updated = cart.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
      saveCart(updated);
    }
  };

  // Remove completely
  const removeFromCart = (itemId: string) => {
    const updated = cart.filter((i) => i.id !== itemId);
    saveCart(updated);
  };

  const getQuantityInCart = (itemId: string) => {
    return cart.find((i) => i.id === itemId)?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter items based on search and category
  const filteredMenu = menuData
    .map((category) => {
      const matchedItems = category.items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === 'all' || category.name === selectedCategory;
        return matchesSearch && matchesCategory;
      });

      return {
        ...category,
        items: matchedItems,
      };
    })
    .filter((category) => category.items.length > 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    router.push(`/r/${restaurantSlug}/checkout`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500 sticky top-0 z-50" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 sticky top-1 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-[10px] text-cyan-600 uppercase tracking-widest font-black block">
              Ordering From Table {tableNumber}
            </span>
            <h1 className="text-lg font-black tracking-tight text-slate-900">{restaurantName}</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Welcome,</span>
            <span className="text-sm font-bold text-slate-800">{customerName}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 pb-32">
        {/* Search Bar */}
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search dishes, drinks, desserts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 text-slate-900 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3.5 text-sm transition-all duration-200 outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex overflow-x-auto gap-2 pb-3 mb-6 scrollbar-none -mx-4 px-4 mask-right">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/10'
                : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
            }`}
          >
            All Items
          </button>
          {menuData.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="space-y-8">
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
              <p className="text-slate-400 text-sm">No items found matching your filters.</p>
            </div>
          ) : (
            filteredMenu.map((category) => (
              <div key={category.id} className="space-y-4">
                <h2 className="text-base font-extrabold tracking-tight text-cyan-600 border-l-2 border-cyan-500 pl-2.5">
                  {category.name}
                </h2>
                <div className="space-y-4">
                  {category.items.map((item) => {
                    const qty = getQuantityInCart(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 transition-all duration-200 ${
                          !item.isAvailable ? 'opacity-60 select-none bg-slate-50/50' : 'hover:border-cyan-300 shadow-sm'
                        }`}
                      >
                        {/* Dish Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                              {!item.isAvailable && (
                                <span className="bg-slate-100 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider shrink-0">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <p className="text-slate-500 text-xs line-clamp-2 mt-1 font-light leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-extrabold text-cyan-600 text-sm">
                              {formatPrice(item.price)}
                            </span>

                            {/* Add / Qty Controls */}
                            {item.isAvailable ? (
                              qty > 0 ? (
                                <div className="flex items-center bg-cyan-500 text-white rounded-xl overflow-hidden font-bold shadow-md shadow-cyan-500/10">
                                  <button
                                    onClick={() => decrementCart(item.id)}
                                    className="px-3 py-1.5 hover:bg-cyan-600 transition-colors cursor-pointer"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="px-2.5 text-xs select-none">{qty}</span>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="px-3 py-1.5 hover:bg-cyan-600 transition-colors cursor-pointer"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="bg-slate-100 hover:bg-cyan-500 hover:text-white border border-slate-200 hover:border-cyan-500 text-slate-700 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                                >
                                  Add
                                </button>
                              )
                            ) : (
                              <button
                                disabled
                                className="bg-slate-50 border border-slate-200 text-slate-400 px-4 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed"
                              >
                                Unavailable
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dish Image */}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 select-none">
                            <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                              {item.name.slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Cart Button/Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent z-40 border-t border-slate-200/60 backdrop-blur-sm">
          <div className="max-w-xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="w-12 h-12 bg-cyan-50 border border-cyan-150 text-cyan-600 rounded-xl flex items-center justify-center relative cursor-pointer"
                >
                  <ShoppingCart size={20} />
                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                    {cartItemCount}
                  </span>
                </button>
                <div onClick={() => setIsCartOpen(true)} className="cursor-pointer">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Your Cart Total
                  </p>
                  <p className="text-base font-black text-slate-900">{formatPrice(cartTotal)}</p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Sheet Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl animate-slide-in text-left">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-cyan-600" />
                <h2 className="text-base font-extrabold text-slate-900">Your Cart</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 text-xs">{item.name}</h4>
                    <span className="text-slate-450 text-xs mt-1 block">
                      {formatPrice(item.price)} each
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden font-bold">
                      <button
                        onClick={() => decrementCart(item.id)}
                        className="p-1 px-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs text-slate-750 select-none">{item.quantity}</span>
                      <button
                        onClick={() => {
                          const existing = cart.find((i) => i.id === item.id);
                          if (existing) {
                            saveCart(
                              cart.map((i) =>
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                              )
                            );
                          }
                        }}
                        className="p-1 px-2.5 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-900 text-lg font-black">{formatPrice(cartTotal)}</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider text-center">
                Taxes calculated at next step
              </p>
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
