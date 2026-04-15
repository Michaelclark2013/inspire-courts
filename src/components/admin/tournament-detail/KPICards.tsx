"use client";

import { memo } from "react";

interface Props {
  teams: number;
  games: number;
  live: number;
  complete: number;
}

function KPICards({ teams, games, live, complete }: Props) {
  const items = [
    { label: "Teams", value: teams, tone: "text-navy" },
    { label: "Games", value: games, tone: "text-navy" },
    { label: "Live", value: live, tone: "text-emerald-600" },
    {
      label: "Complete",
      value: complete,
      tone: "text-navy",
      suffix: `/${games}`,
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((it) => (
        <div
          key={it.label}
          className="bg-white border border-border shadow-sm rounded-xl p-4"
        >
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
            {it.label}
          </p>
          <p className={`${it.tone} text-2xl font-bold font-heading`}>
            {it.value}
            {it.suffix && (
              <span className="text-text-muted text-lg">{it.suffix}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

export default memo(KPICards);
