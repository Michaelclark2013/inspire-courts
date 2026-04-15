export function ScoreEntrySkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3 mb-4 md:mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-border shadow-sm rounded-xl p-4 h-20" />
        ))}
      </div>
      <div className="h-5 w-32 bg-light-gray rounded" />
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-border shadow-sm rounded-xl p-4 h-20" />
        ))}
      </div>
    </div>
  );
}
