export default function PlayerPortalLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-5xl animate-pulse" aria-hidden="true">
      <div className="mb-6">
        <div className="h-3 w-24 bg-light-gray rounded mb-2" />
        <div className="h-7 w-44 bg-light-gray rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-4 h-24" />
        ))}
      </div>
      <div className="bg-white border border-border rounded-2xl p-6 h-48" />
    </div>
  );
}
