export default function ScoresLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 bg-light-gray rounded mb-2" />
        <div className="h-4 w-52 bg-light-gray rounded" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-light-gray rounded-full" />
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 h-11 bg-white border border-border rounded-lg" />
        <div className="h-11 w-32 bg-white border border-border rounded-lg" />
      </div>

      {/* Score cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-5 w-28 bg-light-gray rounded" />
                <div className="h-6 w-16 bg-light-gray rounded" />
                <div className="h-5 w-28 bg-light-gray rounded" />
              </div>
              <div className="h-5 w-16 bg-light-gray rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
