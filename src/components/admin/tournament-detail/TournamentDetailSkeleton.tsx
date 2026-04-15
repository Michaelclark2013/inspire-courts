export default function TournamentDetailSkeleton() {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-3 w-32 bg-off-white rounded mb-4" />
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="h-7 w-64 bg-off-white rounded mb-2" />
          <div className="h-3 w-80 bg-off-white rounded" />
        </div>
        <div className="h-10 w-40 bg-off-white rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-border shadow-sm rounded-xl p-4 h-20"
          />
        ))}
      </div>
      <div className="h-12 bg-white border border-border shadow-sm rounded-xl mb-6" />
      <div className="h-64 bg-white border border-border shadow-sm rounded-xl" />
    </div>
  );
}
