export default function TournamentsLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 " aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 skeleton-shimmer rounded mb-2" />
        <div className="h-7 w-48 skeleton-shimmer rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-light-gray shadow-sm rounded-xl p-5">
            <div className="h-4 w-40 skeleton-shimmer rounded mb-3" />
            <div className="h-3 w-28 skeleton-shimmer rounded mb-2" />
            <div className="h-3 w-20 skeleton-shimmer rounded mb-4" />
            <div className="h-8 w-24 skeleton-shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
