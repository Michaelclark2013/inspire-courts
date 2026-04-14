export default function CheckinLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-36 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-44 bg-white/[0.04] rounded" />
      </div>

      {/* Team info */}
      <div className="bg-card border border-white/10 rounded-xl p-5 mb-6">
        <div className="h-5 w-32 bg-white/[0.06] rounded mb-3" />
        <div className="h-4 w-48 bg-white/[0.04] rounded" />
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-white/[0.06] rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-white/[0.06] rounded mb-1" />
              <div className="h-3 w-16 bg-white/[0.04] rounded" />
            </div>
            <div className="h-8 w-20 bg-white/[0.06] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
