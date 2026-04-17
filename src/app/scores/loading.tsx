export default function ScoresLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Hero skeleton */}
      <div className="relative py-20 sm:py-28 lg:py-36 bg-navy flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-4 w-28 bg-red/30 rounded-full mx-auto" />
          <div className="h-12 w-72 bg-white/15 rounded mx-auto" />
          <div className="h-4 w-64 bg-white/10 rounded mx-auto" />
        </div>
      </div>

      {/* Scoreboard skeleton — matches dark theme */}
      <div className="bg-navy py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
          {/* Filter pills skeleton */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-20 bg-white/5 rounded-full" />
            ))}
          </div>
          {/* Game card skeletons */}
          <div className="grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-white/5 rounded-xl border border-white/10" />
            ))}
          </div>
        </div>
      </div>

      {/* CTA skeleton */}
      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="h-24 bg-light-gray rounded-xl" />
        </div>
      </div>
    </div>
  );
}
