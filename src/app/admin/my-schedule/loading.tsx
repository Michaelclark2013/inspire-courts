export default function MyScheduleLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-44 bg-light-gray rounded" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-light-gray shadow-sm rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-light-gray rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-light-gray rounded mb-2" />
                <div className="h-3 w-24 bg-light-gray rounded" />
              </div>
              <div className="h-6 w-16 bg-light-gray rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
