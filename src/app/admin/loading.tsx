export default function AdminLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      {/* Header skeleton — matches PageHeader with icon */}
      <div className="mb-4 md:mb-8 flex items-center gap-3">
        <div className="hidden md:block w-10 h-10 bg-light-gray rounded-xl" />
        <div>
          <div className="h-7 w-48 bg-light-gray rounded-lg mb-1.5" />
          <div className="h-3.5 w-64 bg-light-gray/60 rounded hidden md:block" />
        </div>
      </div>

      {/* KPI Cards skeleton — rounded-xl to match actual KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-light-gray shadow-sm rounded-xl p-4 lg:p-5"
          >
            <div className="h-3 w-20 bg-light-gray/70 rounded mb-3" />
            <div className="h-8 w-16 bg-light-gray rounded-lg mb-2" />
            <div className="h-3 w-24 bg-light-gray/50 rounded" />
          </div>
        ))}
      </div>

      {/* Chart area skeleton — rounded-xl */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-light-gray shadow-sm rounded-xl p-6">
          <div className="h-4 w-32 bg-light-gray rounded-lg mb-4" />
          <div className="h-52 bg-light-gray/30 rounded-lg" />
        </div>
        <div className="bg-white border border-light-gray shadow-sm rounded-xl p-6">
          <div className="h-4 w-32 bg-light-gray rounded-lg mb-4" />
          <div className="h-52 bg-light-gray/30 rounded-lg" />
        </div>
      </div>

      {/* Table skeleton — rounded-xl with realistic row layout */}
      <div className="bg-white border border-light-gray shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-light-gray">
          <div className="h-4 w-32 bg-light-gray rounded-lg" />
        </div>
        {/* Header row */}
        <div className="flex gap-4 px-6 py-3 bg-off-white border-b border-light-gray">
          <div className="h-3 w-24 bg-light-gray/60 rounded" />
          <div className="h-3 w-20 bg-light-gray/60 rounded" />
          <div className="h-3 w-16 bg-light-gray/60 rounded" />
          <div className="h-3 w-20 bg-light-gray/60 rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-6 py-3.5 border-b border-light-gray/50 ${i % 2 === 1 ? "bg-off-white/30" : ""}`}
          >
            <div className="h-4 flex-1 bg-light-gray/50 rounded" />
            <div className="h-4 w-20 bg-light-gray/50 rounded" />
            <div className="h-4 w-16 bg-light-gray/50 rounded" />
            <div className="h-6 w-14 bg-light-gray/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
