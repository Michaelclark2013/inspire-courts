export default function TournamentListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16 animate-pulse" aria-busy="true" aria-label="Loading tournaments">
      {/* Section heading skeleton */}
      <div className="h-5 w-48 bg-light-gray rounded mb-5" />

      {/* Card skeletons */}
      <div className="grid gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-light-gray rounded-2xl p-6 lg:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-light-gray rounded" />
                  <div className="h-6 w-56 bg-light-gray rounded" />
                </div>
                <div className="flex gap-4">
                  <div className="h-4 w-32 bg-light-gray rounded" />
                  <div className="h-4 w-24 bg-light-gray rounded" />
                  <div className="h-4 w-20 bg-light-gray rounded" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-5 w-12 bg-light-gray rounded-full" />
                  <div className="h-5 w-12 bg-light-gray rounded-full" />
                  <div className="h-5 w-12 bg-light-gray rounded-full" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="h-6 w-20 bg-light-gray rounded" />
                <div className="h-4 w-28 bg-light-gray rounded" />
                <div className="flex gap-2">
                  <div className="h-10 w-20 bg-light-gray rounded-lg" />
                  <div className="h-10 w-24 bg-light-gray rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
