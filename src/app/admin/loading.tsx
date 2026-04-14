export default function AdminLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-64 bg-white/[0.04] rounded" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm p-4">
            <div className="h-3 w-20 bg-white/[0.06] rounded mb-3" />
            <div className="h-7 w-16 bg-white/[0.08] rounded" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-bg-secondary border border-border rounded-sm p-6 h-64" />
        <div className="bg-bg-secondary border border-border rounded-sm p-6 h-64" />
      </div>

      {/* Table skeleton */}
      <div className="bg-bg-secondary border border-border rounded-sm p-6">
        <div className="h-4 w-32 bg-white/[0.06] rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-t border-white/[0.04]">
            <div className="h-4 flex-1 bg-white/[0.04] rounded" />
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
            <div className="h-4 w-16 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
