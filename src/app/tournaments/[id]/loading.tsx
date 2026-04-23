export default function Loading() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero skeleton */}
      <div className="bg-navy h-64 sm:h-80 relative animate-pulse">
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="h-4 w-32 bg-white/10 rounded mb-3" />
            <div className="h-10 w-2/3 bg-white/15 rounded mb-3" />
            <div className="h-5 w-48 bg-white/10 rounded" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-off-white border border-border rounded-xl p-4 animate-pulse">
              <div className="h-3 w-20 bg-navy/10 rounded mb-2" />
              <div className="h-6 w-32 bg-navy/20 rounded" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border border-border rounded-xl p-4 animate-pulse flex items-center gap-4"
            >
              <div className="h-10 w-10 bg-navy/10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-navy/15 rounded" />
                <div className="h-3 w-24 bg-navy/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
