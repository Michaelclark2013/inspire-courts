export default function WaiverLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-2xl animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 bg-light-gray rounded mb-2" />
        <div className="h-4 w-52 bg-light-gray rounded" />
      </div>

      <div className="bg-white border border-border rounded-xl p-6 space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-light-gray rounded mb-2" />
            <div className="h-11 bg-off-white border border-border rounded-lg" />
          </div>
        ))}
        <div className="h-12 w-32 bg-light-gray rounded-lg" />
      </div>
    </div>
  );
}
