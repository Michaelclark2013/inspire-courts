export default function SponsorsLoading() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-40 bg-light-gray rounded mb-2" />
        <div className="h-4 w-52 bg-light-gray/70 rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-off-white border border-border rounded-xl p-4">
            <div className="h-3 w-20 bg-light-gray rounded mb-3" />
            <div className="h-7 w-16 bg-light-gray rounded" />
          </div>
        ))}
      </div>

      <div className="bg-off-white border border-border rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-3.5 border-b border-border">
            <div className="h-4 w-32 bg-light-gray/70 rounded" />
            <div className="h-4 w-20 bg-light-gray/70 rounded" />
            <div className="h-4 flex-1 bg-light-gray/70 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
