export default function TournamentsLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-48 bg-light-gray rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-light-gray shadow-sm rounded-sm p-5">
            <div className="h-4 w-40 bg-light-gray rounded mb-3" />
            <div className="h-3 w-28 bg-light-gray rounded mb-2" />
            <div className="h-3 w-20 bg-light-gray rounded mb-4" />
            <div className="h-8 w-24 bg-light-gray rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
