export default function RegistrationsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-4 w-24 bg-light-gray/70 rounded mb-2" />
          <div className="h-7 w-48 bg-light-gray rounded mb-1" />
          <div className="h-4 w-32 bg-light-gray/70 rounded" />
        </div>
        <div className="h-10 w-32 bg-light-gray rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-20 bg-light-gray/70 rounded" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border px-4 py-3.5 flex gap-6">
            <div className="h-4 w-32 bg-light-gray rounded" />
            <div className="h-4 w-28 bg-light-gray/70 rounded" />
            <div className="h-4 w-36 bg-light-gray/70 rounded" />
            <div className="h-4 w-16 bg-light-gray rounded-full" />
            <div className="h-4 w-16 bg-light-gray rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
