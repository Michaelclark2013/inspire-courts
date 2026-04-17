export default function UsersLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-44 bg-light-gray rounded" />
      </div>
      <div className="bg-white border border-light-gray shadow-sm rounded-sm p-6">
        <div className="flex gap-3 mb-4">
          <div className="h-9 flex-1 bg-light-gray rounded" />
          <div className="h-9 w-28 bg-light-gray rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-t border-light-gray">
            <div className="h-8 w-8 bg-light-gray rounded-full" />
            <div className="h-4 flex-1 bg-light-gray rounded" />
            <div className="h-4 w-20 bg-light-gray rounded" />
            <div className="h-4 w-16 bg-light-gray rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
