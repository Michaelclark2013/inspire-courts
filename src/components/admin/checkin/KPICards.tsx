"use client";

import { memo } from "react";
import CountUp from "@/components/ui/CountUp";
import type { CheckInKPIs } from "@/types/checkin";

function Card({
  label,
  value,
  accent,
  total,
}: {
  label: string;
  value: number;
  accent?: "red" | "emerald" | "navy";
  total?: number;
}) {
  const color =
    accent === "red"
      ? "text-red"
      : accent === "emerald"
        ? "text-emerald-600"
        : "text-navy";
  return (
    <div
      className="bg-white border border-light-gray shadow-sm rounded-xl p-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`${color} text-2xl font-bold font-heading tabular-nums`}>
        <CountUp end={value} />
        {typeof total === "number" && (
          <span className="text-text-muted text-lg">/<CountUp end={total} /></span>
        )}
      </p>
    </div>
  );
}

function KPICardsBase({ kpis }: { kpis: CheckInKPIs }) {
  const notCheckedIn = Math.max(0, kpis.totalTeams - kpis.checkedInTeamCount);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Card
        label="Teams Checked In"
        value={kpis.checkedInTeamCount}
        total={kpis.totalTeams}
      />
      <Card label="Players Today" value={kpis.totalPlayerCheckins} />
      <Card label="Not Checked In" value={notCheckedIn} accent="red" />
      <Card label="This Session" value={kpis.sessionCount} accent="emerald" />
    </div>
  );
}

export default memo(KPICardsBase);
