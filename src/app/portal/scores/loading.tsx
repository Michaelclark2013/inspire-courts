export default function ScoresLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-4xl animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-44 bg-white/[0.04] rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-28 bg-white/[0.06] rounded" />
                <div className="h-6 w-16 bg-white/[0.08] rounded" />
                <div className="h-5 w-28 bg-white/[0.06] rounded" />
              </div>
              <div className="h-5 w-14 bg-white/[0.04] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
