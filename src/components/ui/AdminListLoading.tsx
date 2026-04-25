import { SkeletonRows } from "@/components/ui/SkeletonCard";

export default function AdminListLoading({
  title,
  rows = 6,
  showStats = true,
}: {
  title?: string;
  rows?: number;
  showStats?: boolean;
}) {
  return (
    <div className="p-3 sm:p-6 lg:p-8 animate-pulse" aria-busy="true">
      <div className="mb-6">
        <div className="h-7 w-40 bg-light-gray rounded mb-2" />
        {title ? (
          <p className="sr-only">Loading {title}</p>
        ) : (
          <div className="h-4 w-56 bg-light-gray/70 rounded" />
        )}
      </div>
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-off-white border border-border rounded-xl p-4"
            >
              <div className="h-3 w-14 bg-light-gray rounded mb-3" />
              <div className="h-6 w-10 bg-light-gray rounded" />
            </div>
          ))}
        </div>
      )}
      <div className="h-10 bg-off-white border border-border rounded-lg mb-4" />
      <SkeletonRows count={rows} />
    </div>
  );
}
