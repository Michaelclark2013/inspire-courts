export default function UsersLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 animate-pulse" aria-hidden="true">
      <div className="mb-4 md:mb-8 flex items-center gap-3">
        <div className="hidden md:block w-10 h-10 bg-light-gray rounded-xl" />
        <div>
          <div className="h-7 w-44 bg-light-gray rounded-lg mb-1.5" />
          <div className="h-3.5 w-52 bg-light-gray/60 rounded hidden md:block" />
        </div>
      </div>
      <div className="bg-white border border-light-gray shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b border-light-gray">
          <div className="flex gap-3">
            <div className="h-10 flex-1 bg-light-gray/50 rounded-lg" />
            <div className="h-10 w-28 bg-light-gray/50 rounded-lg" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3.5 border-b border-light-gray/50 ${i % 2 === 1 ? "bg-off-white/30" : ""}`}>
            <div className="h-8 w-8 bg-light-gray rounded-full flex-shrink-0" />
            <div className="h-4 flex-1 bg-light-gray/50 rounded" />
            <div className="h-5 w-16 bg-light-gray/40 rounded-full" />
            <div className="h-4 w-20 bg-light-gray/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
