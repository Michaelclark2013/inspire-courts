export default function CheckinLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-32 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-52 bg-white/[0.04] rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm p-4">
            <div className="h-3 w-20 bg-white/[0.06] rounded mb-3" />
            <div className="h-7 w-12 bg-white/[0.08] rounded" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="h-11 bg-bg-secondary border border-border rounded-lg mb-6" />

      {/* Player cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-xl p-4 h-24" />
        ))}
      </div>
    </div>
  );
}
