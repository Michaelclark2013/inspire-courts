export function RevenueSkeleton() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-busy="true" aria-label="Loading revenue data">
      <div className="mb-4 md:mb-8">
        <div className="h-8 w-32 bg-light-gray rounded mb-2" />
        <div className="h-4 w-48 bg-off-white rounded" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 md:mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-light-gray shadow-sm rounded-sm p-3 md:p-4"
          >
            <div className="h-3 w-20 bg-light-gray rounded mb-3" />
            <div className="h-7 w-20 bg-off-white rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4 md:mb-8">
        <div className="bg-white border border-light-gray shadow-sm rounded-sm p-6 h-56" />
        <div className="bg-white border border-light-gray shadow-sm rounded-sm p-6 h-56" />
      </div>

      {/* Table */}
      <div className="bg-white border border-light-gray shadow-sm rounded-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-5 py-3.5 border-b border-light-gray"
          >
            <div className="h-4 w-24 bg-off-white rounded" />
            <div className="h-4 w-20 bg-off-white rounded" />
            <div className="h-4 flex-1 bg-off-white rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
