export default function ContactsLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-28 bg-light-gray rounded mb-2" />
        <div className="h-7 w-40 bg-light-gray rounded" />
      </div>
      <div className="bg-white border border-light-gray shadow-sm rounded-xl p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-t border-light-gray first:border-t-0">
            <div className="h-4 w-32 bg-light-gray rounded" />
            <div className="h-4 flex-1 bg-light-gray rounded" />
            <div className="h-4 w-24 bg-light-gray rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
