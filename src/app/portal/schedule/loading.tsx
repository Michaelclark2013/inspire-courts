export default function ScheduleLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-4xl animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-32 bg-light-gray rounded mb-2" />
        <div className="h-4 w-40 bg-light-gray rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-light-gray rounded" />
              <div className="h-5 w-16 bg-light-gray rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-5 w-32 bg-light-gray rounded" />
              <div className="h-6 w-16 bg-light-gray rounded" />
              <div className="h-5 w-32 bg-light-gray rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
