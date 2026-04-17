export default function CheckinLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-36 bg-light-gray rounded mb-2" />
        <div className="h-4 w-44 bg-light-gray rounded" />
      </div>

      {/* Team info */}
      <div className="bg-white border border-border rounded-xl p-5 mb-6">
        <div className="h-5 w-32 bg-light-gray rounded mb-3" />
        <div className="h-4 w-48 bg-light-gray rounded" />
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-light-gray rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-light-gray rounded mb-1" />
              <div className="h-3 w-16 bg-light-gray rounded" />
            </div>
            <div className="h-8 w-20 bg-light-gray rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
