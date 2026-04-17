export default function FilesLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-36 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-52 bg-white/[0.04] rounded" />
      </div>

      {/* File grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary border border-border rounded-sm p-5">
            <div className="w-10 h-10 bg-white/[0.06] rounded-lg mb-3" />
            <div className="h-4 w-32 bg-white/[0.06] rounded mb-2" />
            <div className="h-3 w-20 bg-white/[0.04] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
