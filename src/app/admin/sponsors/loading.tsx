export default function SponsorsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-52 bg-white/[0.04] rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm p-4">
            <div className="h-3 w-20 bg-white/[0.06] rounded mb-3" />
            <div className="h-7 w-16 bg-white/[0.08] rounded" />
          </div>
        ))}
      </div>

      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-white/[0.04]">
            <div className="h-4 w-32 bg-white/[0.04] rounded" />
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
            <div className="h-4 flex-1 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
