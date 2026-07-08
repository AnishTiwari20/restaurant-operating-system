'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ToggleLeft, ToggleRight, X, Layers, Utensils, Upload, Link } from 'lucide-react';

interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  categoryId: string;
}

interface CategoryData {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemData[];
}

interface Props {
  initialCategories: CategoryData[];
  restaurantId: string;
  currency: string;
}

export default function MenuEditor({ initialCategories, restaurantId, currency }: Props) {
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategories[0]?.id || 'all');

  // Category CRUD states
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Dish CRUD states
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItemData | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishImageUrl, setDishImageUrl] = useState('');
  const [dishCatId, setDishCatId] = useState('');
  const [dishAvailable, setDishAvailable] = useState(true);
  const [loadingDish, setLoadingDish] = useState(false);

  // Upload/URL image settings
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      const res = await fetch('/api/restaurant/menu/dish/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setDishImageUrl(data.imageUrl);
      } else {
        alert(data.message || 'Upload failed.');
      }
    } catch {
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);

    try {
      const res = await fetch('/api/restaurant/menu/category/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, name: newCatName.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories((prev) => [...prev, { ...data.category, items: [] }]);
        setNewCatName('');
        if (selectedCatId === 'all') {
          setSelectedCatId(data.category.id);
        }
      } else {
        alert(data.message || 'Error creating category.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setIsAddingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? All dishes in this category will be permanently deleted.`)) {
      return;
    }

    try {
      const res = await fetch('/api/restaurant/menu/category/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId }),
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
        if (selectedCatId === catId) {
          setSelectedCatId('all');
        }
      } else {
        alert('Failed to delete category.');
      }
    } catch {
      alert('Error.');
    }
  };

  // Open Add Dish Modal
  const openAddDishModal = () => {
    setEditingDish(null);
    setDishName('');
    setDishDesc('');
    setDishPrice('');
    setDishImageUrl('');
    setDishCatId(selectedCatId === 'all' ? categories[0]?.id || '' : selectedCatId);
    setDishAvailable(true);
    setImageMode('upload');
    setIsDishModalOpen(true);
  };

  // Open Edit Dish Modal
  const openEditDishModal = (dish: MenuItemData) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishDesc(dish.description || '');
    setDishPrice(dish.price.toString());
    setDishImageUrl(dish.imageUrl || '');
    setDishCatId(dish.categoryId);
    setDishAvailable(dish.isAvailable);
    setImageMode(dish.imageUrl?.startsWith('http') ? 'url' : 'upload');
    setIsDishModalOpen(true);
  };

  // Submit Dish (Create / Update)
  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice || !dishCatId) return;
    setLoadingDish(true);

    const payload = {
      restaurantId,
      name: dishName.trim(),
      description: dishDesc.trim(),
      price: parseFloat(dishPrice),
      imageUrl: dishImageUrl.trim() || null,
      categoryId: dishCatId,
      isAvailable: dishAvailable,
    };

    try {
      const url = editingDish
        ? '/api/restaurant/menu/dish/update'
        : '/api/restaurant/menu/dish/create';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDish ? { id: editingDish.id, ...payload } : payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (editingDish) {
          // Update local state
          setCategories((prev) =>
            prev.map((cat) => {
              // Remove from old category, add to new category if category changed
              const filteredItems = cat.items.filter((i) => i.id !== editingDish.id);
              if (cat.id === dishCatId) {
                const isAlreadyPresent = cat.items.some((i) => i.id === editingDish.id);
                if (isAlreadyPresent) {
                  return {
                    ...cat,
                    items: cat.items.map((i) => (i.id === editingDish.id ? data.dish : i)),
                  };
                } else {
                  return { ...cat, items: [...filteredItems, data.dish] };
                }
              }
              return { ...cat, items: filteredItems };
            })
          );
        } else {
          // Add newly created dish
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === dishCatId ? { ...cat, items: [...cat.items, data.dish] } : cat
            )
          );
        }
        setIsDishModalOpen(false);
      } else {
        alert(data.message || 'Failed to save dish.');
      }
    } catch {
      alert('Error.');
    } finally {
      setLoadingDish(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;

    try {
      const res = await fetch('/api/restaurant/menu/dish/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.filter((item) => item.id !== id),
          }))
        );
      } else {
        alert('Failed to delete dish.');
      }
    } catch {
      alert('Error.');
    }
  };

  // Toggle Dish Availability
  const handleToggleAvailability = async (dish: MenuItemData) => {
    const nextVal = !dish.isAvailable;
    try {
      const res = await fetch('/api/restaurant/menu/dish/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dish.id, isAvailable: nextVal }),
      });

      if (res.ok) {
        setCategories((prev) =>
          prev.map((cat) => ({
            ...cat,
            items: cat.items.map((i) => (i.id === dish.id ? { ...i, isAvailable: nextVal } : i)),
          }))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Get active items to display
  const allDishes = categories.flatMap((c) => c.items);
  const activeDishes =
    selectedCatId === 'all'
      ? allDishes
      : categories.find((c) => c.id === selectedCatId)?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Menu Settings</h1>
          <p className="text-slate-500 text-xs mt-1">
            Build food categories and create or update dishes. Toggle availability to instantly reflect stock levels on customer phones.
          </p>
        </div>
        <button
          onClick={openAddDishModal}
          disabled={categories.length === 0}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3 px-5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition-all disabled:opacity-50 cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Dish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-6 h-fit">
          <div>
            <h2 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-cyan-600" />
              <span>Menu Categories</span>
            </h2>
            <form onSubmit={handleAddCategory} className="flex gap-2 mt-4">
              <input
                type="text"
                required
                disabled={isAddingCat}
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2 text-xs outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isAddingCat || !newCatName.trim()}
                className="bg-slate-100 hover:bg-cyan-500 hover:text-white text-slate-650 p-2.5 rounded-xl text-xs transition-colors cursor-pointer shrink-0 border border-slate-200 hover:border-cyan-500"
              >
                <Plus size={15} />
              </button>
            </form>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedCatId('all')}
              className={`w-full text-left px-4.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCatId === 'all'
                  ? 'bg-cyan-500 text-white shadow shadow-cyan-500/10'
                  : 'bg-slate-50/50 text-slate-500 hover:text-cyan-600 border border-slate-200 hover:border-cyan-200'
              }`}
            >
              All Dishes ({allDishes.length})
            </button>

            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`group flex items-center justify-between pl-4.5 pr-2 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  selectedCatId === cat.id
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow'
                    : 'bg-slate-50/50 text-slate-500 border-slate-200 hover:border-cyan-200 hover:text-cyan-600'
                }`}
              >
                <span
                  onClick={() => setSelectedCatId(cat.id)}
                  className="flex-1 truncate cursor-pointer py-1.5"
                >
                  {cat.name} ({cat.items.length})
                </span>

                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    selectedCatId === cat.id
                      ? 'text-white hover:bg-cyan-600/30'
                      : 'text-slate-400 hover:text-red-650 hover:bg-slate-100 opacity-0 group-hover:opacity-100 focus:opacity-100'
                  }`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dishes Listing Area */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-extrabold text-sm text-slate-800">
            {selectedCatId === 'all'
              ? 'All Menu Dishes'
              : `${categories.find((c) => c.id === selectedCatId)?.name} Dishes`}
            <span className="text-slate-400 font-normal ml-1.5">({activeDishes.length} items)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDishes.length === 0 ? (
              <div className="md:col-span-2 text-center py-16 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
                <span className="text-slate-400 block mb-2 font-bold">No dishes in this view.</span>
                <span className="text-slate-500 text-xs">Click "Add Dish" at the top to create your first food item.</span>
              </div>
            ) : (
              activeDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`bg-white border rounded-2xl p-4.5 flex gap-4 transition-all ${
                    !dish.isAvailable ? 'border-slate-200 bg-slate-50/50 opacity-60' : 'border-slate-200/80 hover:border-cyan-300'
                  }`}
                >
                  {/* Dish details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-xs truncate max-w-[150px]">{dish.name}</h3>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {categories.find((c) => c.id === dish.categoryId)?.name || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[10px] line-clamp-2 mt-1 leading-relaxed">
                        {dish.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-extrabold text-cyan-600 text-xs">
                        {formatPrice(dish.price)}
                      </span>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAvailability(dish)}
                          title={dish.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                        >
                          {dish.isAvailable ? (
                            <ToggleRight className="text-emerald-600" size={20} />
                          ) : (
                            <ToggleLeft className="text-slate-400" size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => openEditDishModal(dish)}
                          className="text-slate-400 hover:text-cyan-600 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          className="text-slate-400 hover:text-red-650 p-1 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dish image representation */}
                  {dish.imageUrl ? (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-18 h-18 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 select-none uppercase font-extrabold text-[10px] tracking-wider">
                      {dish.name.slice(0, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dish Add/Edit Dialog Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDish}
            className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full relative overflow-hidden shadow-2xl space-y-5 animate-fade-in text-left"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />

            <button
              type="button"
              onClick={() => setIsDishModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-slate-900 text-base">
              {editingDish ? 'Edit Menu Dish' : 'Add Menu Dish'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  disabled={loadingDish}
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Garlic Parm Fries"
                  className="w-full bg-slate-55 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4.5 py-3 text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  required
                  disabled={loadingDish}
                  value={dishCatId}
                  onChange={(e) => setDishCatId(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-3 py-3 text-xs outline-none transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Price ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    disabled={loadingDish}
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full bg-slate-55 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4.5 py-3 text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Availability
                  </label>
                  <select
                    disabled={loadingDish}
                    value={dishAvailable ? 'yes' : 'no'}
                    onChange={(e) => setDishAvailable(e.target.value === 'yes')}
                    className="w-full bg-slate-55 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-3 py-3 text-xs outline-none transition-colors"
                  >
                    <option value="yes">Available</option>
                    <option value="no">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Dish Image (Optional)
                </label>

                {/* Image Mode Tabs */}
                <div className="flex gap-2 mb-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 w-fit">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      imageMode === 'upload'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Upload size={12} />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      imageMode === 'url'
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Link size={12} />
                    <span>Image URL</span>
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div className="space-y-3">
                    {dishImageUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-slate-55 border border-slate-200 rounded-2xl relative overflow-hidden">
                        <img
                          src={dishImageUrl}
                          alt="Dish Preview"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 truncate">
                            {dishImageUrl.split('/').pop()}
                          </p>
                          <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                            Uploaded successfully
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDishImageUrl('')}
                          className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 text-slate-450 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer ${
                        isUploading
                          ? 'border-cyan-300 bg-cyan-50/10'
                          : 'border-slate-300 hover:border-cyan-400 bg-slate-55 hover:bg-slate-100/50'
                      }`}>
                        {isUploading ? (
                          <div className="text-center space-y-2">
                            <svg
                              className="animate-spin h-6 w-6 text-cyan-600 mx-auto"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span className="text-[10px] font-bold text-slate-500 block">Uploading file...</span>
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            <Upload className="mx-auto text-slate-400 mb-1" size={20} />
                            <span className="text-[10px] font-bold text-slate-700 block">Click to upload photo</span>
                            <span className="text-[9px] text-slate-450 block">PNG, JPG, WEBP up to 5MB</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={loadingDish}
                    value={dishImageUrl}
                    onChange={(e) => setDishImageUrl(e.target.value)}
                    placeholder="https://example.com/pasta.png"
                    className="w-full bg-slate-55 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4.5 py-3 text-xs outline-none transition-colors"
                  />
                )}
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  disabled={loadingDish}
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="Short description of the ingredients, taste, or portion size..."
                  className="w-full bg-slate-55 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 rounded-xl px-4.5 py-3 text-xs outline-none transition-colors resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingDish || !dishName.trim() || !dishPrice}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{editingDish ? 'Save Dish Changes' : 'Create Menu Dish'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
