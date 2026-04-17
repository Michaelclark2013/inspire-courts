export default function AnalyticsLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-40 bg-light-gray rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-light-gray shadow-sm rounded-sm p-4">
            <div className="h-3 w-20 bg-light-gray rounded mb-3" />
            <div className="h-7 w-16 bg-light-gray rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-light-gray shadow-sm rounded-sm p-6 h-72" />
        <div className="bg-white border border-light-gray shadow-sm rounded-sm p-6 h-72" />
      </div>
    </div>
  );
}
