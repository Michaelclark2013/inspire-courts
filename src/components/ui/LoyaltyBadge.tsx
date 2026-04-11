"use client";

import { Award } from "lucide-react";

const BADGE_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-white/10", text: "text-white/60", label: "1st Year" },
  2: { bg: "bg-blue-500/15", text: "text-blue-400", label: "2 Years" },
  3: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "3 Years" },
  4: { bg: "bg-amber-500/15", text: "text-amber-400", label: "4 Years" },
  5: { bg: "bg-red/15", text: "text-red", label: "5+ Years" },
};

export default function LoyaltyBadge({
  memberSince,
  size = "sm",
}: {
  memberSince: string | null | undefined;
  size?: "sm" | "md";
}) {
  if (!memberSince) return null;

  const startYear = parseInt(memberSince);
  if (isNaN(startYear)) return null;

  const currentYear = new Date().getFullYear();
  const years = currentYear - startYear;

  if (years < 1) return null;

  const tier = Math.min(years, 5);
  const style = BADGE_STYLES[tier] || BADGE_STYLES[5];

  if (size === "md") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${style.bg}`}>
        <Award className={`w-4 h-4 ${style.text}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>
          {years} {years === 1 ? "Year" : "Years"} with Inspire
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}
      title={`Member since ${startYear} — ${years} year${years !== 1 ? "s" : ""} with Inspire`}
    >
      <Award className="w-3 h-3" />
      {style.label}
    </span>
  );
}
