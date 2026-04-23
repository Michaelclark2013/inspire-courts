
export default function RosterLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-7 w-32 bg-light-gray rounded mb-2" />
          <div className="h-4 w-48 bg-light-gray rounded" />
        </div>
        <div className="h-10 w-28 bg-light-gray rounded-lg" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-light-gray rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-28 bg-light-gray rounded mb-1" />
              <div className="h-3 w-16 bg-light-gray rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
