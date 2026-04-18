import { Loader2 } from "lucide-react";

export default function PortalLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-5xl animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-3 w-24 bg-light-gray rounded mb-2" />
        <div className="h-7 w-48 bg-light-gray rounded" />
      </div>

      {/* Announcement placeholder */}
      <div className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 h-16" />

      {/* Action cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-4 h-20" />
        ))}
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-12 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden="true" />
        <span className="text-sm">Loading portal...</span>
      </div>
    </div>
  );
}
