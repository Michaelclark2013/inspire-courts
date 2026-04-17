export default function LeadsLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-52 bg-light-gray rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-light-gray shadow-sm rounded-sm p-4">
            <div className="h-3 w-16 bg-light-gray rounded mb-2" />
            <div className="h-6 w-12 bg-light-gray rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-light-gray shadow-sm rounded-sm p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-t border-light-gray">
            <div className="h-4 flex-1 bg-light-gray rounded" />
            <div className="h-4 w-24 bg-light-gray rounded" />
            <div className="h-4 w-20 bg-light-gray rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
