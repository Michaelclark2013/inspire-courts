"use client";

import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import type { EligibilityResult } from "@/lib/eligibility";

// Small status chip that summarizes a player's eligibility for the
// chosen division. Three visual states:
//   - green  : confirmed eligible (DOB present + under cap)
//   - amber  : data missing (DOB needed, or open division)
//   - red    : confirmed ineligible (over cap)
//
// Hover the chip to see the full reason.
export function EligibilityChip({
  result,
  size = "sm",
}: {
  result: EligibilityResult | null | undefined;
  size?: "sm" | "xs";
}) {
  if (!result) return null;
  const cls = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  const iconCls = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";

  if (!result.eligible) {
    return (
      <span
        title={result.reason}
        className={`inline-flex items-center gap-1 rounded-full font-semibold bg-red/10 text-red ${cls}`}
      >
        <AlertTriangle className={iconCls} aria-hidden="true" />
        Ineligible
      </span>
    );
  }
  // Eligible — but distinguish "confirmed" (have DOB) from "needs info".
  const confirmed = typeof result.ageOnCutoff === "number";
  if (confirmed) {
    return (
      <span
        title={result.reason}
        className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 ${cls}`}
      >
        <CheckCircle2 className={iconCls} aria-hidden="true" />
        Eligible
      </span>
    );
  }
  return (
    <span
      title={result.reason}
      className={`inline-flex items-center gap-1 rounded-full font-semibold bg-amber-50 text-amber-700 ${cls}`}
    >
      <HelpCircle className={iconCls} aria-hidden="true" />
      {result.cutoffAge ? `${result.cutoffAge}U: DOB needed` : "Open"}
    </span>
  );
}
