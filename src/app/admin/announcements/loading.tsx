export default function AnnouncementsLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-52 bg-light-gray rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-light-gray shadow-sm rounded-sm p-5">
            <div className="h-4 w-48 bg-light-gray rounded mb-3" />
            <div className="h-3 w-full bg-light-gray rounded mb-2" />
            <div className="h-3 w-3/4 bg-light-gray rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
