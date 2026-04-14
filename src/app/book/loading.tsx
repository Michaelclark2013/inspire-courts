export default function BookLoading() {
  return (
    <div className="pt-24 lg:pt-28 animate-pulse">
      {/* Hero skeleton */}
      <div className="min-h-[50vh] bg-navy flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-5 w-32 bg-white/20 rounded-full mx-auto" />
          <div className="h-14 w-64 bg-white/20 rounded mx-auto" />
          <div className="h-5 w-96 bg-white/10 rounded mx-auto" />
        </div>
      </div>

      {/* Features bar skeleton */}
      <div className="py-8 bg-off-white border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-light-gray rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Form skeleton */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="h-3 w-24 bg-light-gray rounded mx-auto mb-4" />
            <div className="h-10 w-64 bg-light-gray rounded mx-auto mb-4" />
            <div className="h-4 w-80 bg-light-gray rounded mx-auto" />
          </div>
          <div className="space-y-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-light-gray rounded-xl" />
            ))}
            <div className="h-32 bg-light-gray rounded-xl" />
            <div className="h-12 w-48 bg-red/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
