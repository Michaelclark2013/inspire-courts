export default function ScoresLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-52 bg-white/[0.04] rounded" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-white/[0.06] rounded-full" />
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 h-11 bg-white/[0.04] border border-white/[0.06] rounded-lg" />
        <div className="h-11 w-32 bg-white/[0.04] border border-white/[0.06] rounded-lg" />
      </div>

      {/* Score cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-5 w-28 bg-white/[0.06] rounded" />
                <div className="h-6 w-16 bg-white/[0.08] rounded" />
                <div className="h-5 w-28 bg-white/[0.06] rounded" />
              </div>
              <div className="h-5 w-16 bg-white/[0.04] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
