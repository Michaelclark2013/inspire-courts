export default function TournamentsManageLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="h-8 w-40 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-48 bg-white/[0.04] rounded" />
        </div>
        <div className="h-10 w-28 bg-white/[0.06] rounded-lg" />
      </div>

      {/* Tournament cards */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="h-5 w-48 bg-white/[0.08] rounded mb-2" />
                <div className="h-3 w-32 bg-white/[0.04] rounded" />
              </div>
              <div className="h-6 w-20 bg-white/[0.06] rounded-full" />
            </div>
            <div className="flex gap-6">
              <div className="h-4 w-24 bg-white/[0.04] rounded" />
              <div className="h-4 w-20 bg-white/[0.04] rounded" />
              <div className="h-4 w-28 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
