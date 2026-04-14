export default function ScoresLoading() {
  return (
    <div className="pt-24 lg:pt-28 animate-pulse">
      {/* Hero skeleton */}
      <div className="min-h-[50vh] bg-navy flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-5 w-32 bg-white/20 rounded-full mx-auto" />
          <div className="h-14 w-72 bg-white/20 rounded mx-auto" />
          <div className="h-5 w-80 bg-white/10 rounded mx-auto" />
        </div>
      </div>

      {/* Scores content skeleton */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="h-8 w-64 bg-light-gray rounded mx-auto mb-3" />
            <div className="h-4 w-96 bg-light-gray rounded mx-auto" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-light-gray rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
