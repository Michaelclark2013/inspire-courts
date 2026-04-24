export default function LinksLoading() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 animate-pulse">
      <div className="mb-4 md:mb-8">
        <div className="h-7 w-36 bg-light-gray rounded mb-2" />
        <div className="h-4 w-48 bg-light-gray/70 rounded" />
      </div>

      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, s) => (
          <div key={s}>
            <div className="h-3 w-24 bg-light-gray/70 rounded mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-off-white border border-border rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-4 w-32 bg-light-gray rounded" />
                    <div className="h-4 w-4 bg-light-gray/70 rounded" />
                  </div>
                  <div className="h-3 w-40 bg-light-gray/70 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
