export default function AdminLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8" aria-hidden="true">
      {/* Header skeleton — matches PageHeader with icon */}
      <div className="mb-4 md:mb-8 flex items-center gap-3">
        <div className="hidden md:block w-10 h-10 skeleton-shimmer rounded-xl" />
        <div>
          <div className="h-7 w-48 skeleton-shimmer rounded-lg mb-1.5" />
          <div className="h-3.5 w-64 skeleton-shimmer rounded hidden md:block" />
        </div>
      </div>

      {/* KPI Cards skeleton — rounded-xl to match actual KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-light-gray shadow-sm rounded-xl p-4 lg:p-5"
          >
            <div className="h-3 w-20 skeleton-shimmer rounded mb-3" />
            <div className="h-8 w-16 skeleton-shimmer rounded-lg mb-2" />
            <div className="h-3 w-24 skeleton-shimmer rounded" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton — rounded-xl */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-light-gray shadow-sm rounded-xl p-6">
          <div className="h-4 w-32 skeleton-shimmer rounded-lg mb-4" />
          <div className="h-52 skeleton-shimmer rounded-lg" />
        </div>
        <div className="bg-white border border-light-gray shadow-sm rounded-xl p-6">
          <div className="h-4 w-32 skeleton-shimmer rounded-lg mb-4" />
          <div className="h-52 skeleton-shimmer rounded-lg" />
        </div>
      </div>

      {/* Table skeleton — rounded-xl with realistic row layout */}
      <div className="bg-white border border-light-gray shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-light-gray">
          <div className="h-4 w-32 skeleton-shimmer rounded-lg" />
        </div>
        {/* Header row */}
        <div className="flex gap-4 px-6 py-3 bg-off-white border-b border-light-gray">
          <div className="h-3 w-24 skeleton-shimmer rounded" />
          <div className="h-3 w-20 skeleton-shimmer rounded" />
          <div className="h-3 w-16 skeleton-shimmer rounded" />
          <div className="h-3 w-20 skeleton-shimmer rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-6 py-3.5 border-b border-light-gray/50 ${i % 2 === 1 ? "bg-off-white/30" : ""}`}
          >
            <div className="h-4 flex-1 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded" />
            <div className="h-4 w-16 skeleton-shimmer rounded" />
            <div className="h-6 w-14 skeleton-shimmer rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
