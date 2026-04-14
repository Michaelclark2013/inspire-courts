export default function ProfileLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-lg animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-24 bg-white/[0.06] rounded mb-2" />
        <div className="h-4 w-40 bg-white/[0.04] rounded" />
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6 space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-20 bg-white/[0.06] rounded mb-2" />
            <div className="h-11 bg-white/[0.04] border border-white/[0.06] rounded-lg" />
          </div>
        ))}
        <div className="h-12 w-32 bg-white/[0.06] rounded-lg" />
      </div>
    </div>
  );
}
