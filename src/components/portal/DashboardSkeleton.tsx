"use client";

// Simple skeleton shown while the portal dashboard performs its first fetch.
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-24 bg-white border border-light-gray rounded-2xl" />
      <div className="h-32 bg-white border border-light-gray rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-20 bg-white border border-light-gray rounded-2xl" />
        <div className="h-20 bg-white border border-light-gray rounded-2xl" />
        <div className="h-20 bg-white border border-light-gray rounded-2xl" />
      </div>
    </div>
  );
}
