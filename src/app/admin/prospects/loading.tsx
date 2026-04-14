export default function ProspectsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-36 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-48 bg-white/[0.04] rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm p-4">
            <div className="h-3 w-16 bg-white/[0.06] rounded mb-3" />
            <div className="h-7 w-14 bg-white/[0.08] rounded" />
          </div>
        ))}
      </div>

      <div className="h-11 bg-bg-secondary border border-border rounded-lg mb-6" />

      <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-white/[0.04]">
            <div className="h-4 w-28 bg-white/[0.04] rounded" />
            <div className="h-4 w-20 bg-white/[0.04] rounded" />
            <div className="h-4 flex-1 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
