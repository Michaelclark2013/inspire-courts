"use client";

export default function CheckInSkeleton() {
  return (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-52 bg-gray-100 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-50 rounded" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-border shadow-sm rounded-xl p-4"
          >
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2.5 bg-gray-100 rounded-full" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-border shadow-sm rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="h-5 w-28 bg-gray-100 rounded" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-28 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-5">
          <div className="h-5 w-32 bg-gray-100 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-50 rounded-lg" />
            <div className="h-10 bg-gray-50 rounded-lg" />
            <div className="h-10 bg-gray-50 rounded-lg" />
            <div className="h-10 bg-red/20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
