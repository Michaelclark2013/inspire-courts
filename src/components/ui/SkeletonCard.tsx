export function SkeletonCard() {
  return (
    <div className="bg-white border border-light-gray rounded-xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 skeleton-shimmer rounded-full" />
        <div className="h-5 w-20 skeleton-shimmer rounded-full" />
      </div>
      <div className="h-7 w-3/4 skeleton-shimmer rounded mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full skeleton-shimmer rounded" />
        <div className="h-4 w-2/3 skeleton-shimmer rounded" />
        <div className="h-4 w-3/4 skeleton-shimmer rounded" />
      </div>
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <div className="h-6 w-12 skeleton-shimmer rounded-full" />
        <div className="h-6 w-14 skeleton-shimmer rounded-full" />
        <div className="h-6 w-10 skeleton-shimmer rounded-full" />
      </div>
      <div className="mt-auto h-12 skeleton-shimmer rounded-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Skeleton rows for table-style admin lists (members, rentals, etc.).
// Renders a faux-row with a circular avatar, two text columns, and a
// trailing pill. Used while a /api/admin/... fetch is in flight so the
// page doesn't suddenly collapse to "Loading…" plain text.
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div
      className="bg-white border border-border rounded-xl divide-y divide-border overflow-hidden"
      role="status"
      aria-busy="true"
      aria-label="Loading list"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="h-9 w-9 skeleton-shimmer rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 w-1/3 skeleton-shimmer rounded" />
            <div className="h-3 w-1/2 skeleton-shimmer rounded" />
          </div>
          <div className="h-5 w-16 skeleton-shimmer rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}
