import { Loader2 } from "lucide-react";

export default function RosterLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl animate-pulse">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-7 w-32 bg-white/[0.06] rounded mb-2" />
          <div className="h-4 w-48 bg-white/[0.04] rounded" />
        </div>
        <div className="h-10 w-28 bg-white/[0.06] rounded-lg" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/[0.06] rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-28 bg-white/[0.06] rounded mb-1" />
              <div className="h-3 w-16 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
