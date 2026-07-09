import React from 'react';

export default function RestaurantLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse text-left">
      {/* Top Header Placeholder */}
      <div className="space-y-2">
        <div className="h-7 bg-slate-200 rounded-lg w-48" />
        <div className="h-3.5 bg-slate-100 rounded-md w-96" />
      </div>

      {/* Metrics Grid Placeholder */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-2.5 bg-slate-100 rounded w-16" />
              <div className="h-4 bg-slate-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Primary Content Skeleton */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        {/* Search bar placeholder */}
        <div className="h-10 bg-slate-100 rounded-2xl w-full" />

        {/* List items placeholders */}
        <div className="divide-y divide-slate-100 space-y-4 pt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-4 gap-4">
              <div className="h-4 bg-slate-200 rounded w-20" />
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-150 rounded w-32" />
              <div className="h-4 bg-slate-100 rounded w-14" />
              <div className="h-4 bg-slate-200 rounded w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
