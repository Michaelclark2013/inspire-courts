"use client";

import { Eye } from "lucide-react";

export function ViewAsBanner({ viewAsRole }: { viewAsRole: string | null }) {
  if (!viewAsRole) return null;
  const label = viewAsRole === "coach" ? "Coach" : "Parent";
  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-600 text-xs font-semibold">
      <Eye className="w-3.5 h-3.5" />
      Viewing as {label} — This is what a {viewAsRole} sees on their dashboard.
    </div>
  );
}
