import React from 'react';

export default function CustomerLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center p-4 space-y-6 animate-pulse w-full max-w-md mx-auto">
      {/* Mobile top header skeleton */}
      <div className="w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 flex items-center gap-3 mt-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
        <div className="space-y-1.5 flex-1 text-left">
          <div className="h-3.5 bg-slate-200 rounded w-24" />
          <div className="h-2 bg-slate-150 rounded w-16" />
        </div>
      </div>

      {/* Category horizontal scrolling bar skeleton */}
      <div className="w-full flex gap-2.5 overflow-x-hidden py-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 bg-slate-200 rounded-full w-20 shrink-0" />
        ))}
      </div>

      {/* Food items column list skeleton */}
      <div className="w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm flex gap-4 text-left">
            {/* Food item description */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-200 rounded w-32" />
                <div className="h-2.5 bg-slate-100 rounded w-48" />
              </div>
              <div className="h-4 bg-slate-200 rounded w-14" />
            </div>

            {/* Food image box placeholder */}
            <div className="w-20 h-20 bg-slate-150 rounded-2xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
