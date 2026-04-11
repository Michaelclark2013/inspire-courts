export function SkeletonCard() {
  return (
    <div className="bg-white border border-light-gray rounded-xl p-6 flex flex-col h-full animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 bg-light-gray rounded-full" />
        <div className="h-5 w-20 bg-light-gray rounded-full" />
      </div>
      <div className="h-7 w-3/4 bg-light-gray rounded mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-light-gray rounded" />
        <div className="h-4 w-2/3 bg-light-gray rounded" />
        <div className="h-4 w-3/4 bg-light-gray rounded" />
      </div>
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <div className="h-6 w-12 bg-light-gray rounded-full" />
        <div className="h-6 w-14 bg-light-gray rounded-full" />
        <div className="h-6 w-10 bg-light-gray rounded-full" />
      </div>
      <div className="mt-auto h-12 bg-light-gray rounded-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
