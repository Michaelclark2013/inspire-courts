"use client";

import { memo } from "react";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import type { AdminTournamentStatus } from "@/types/admin-dashboard";

function TournamentsList({ tournaments }: { tournaments: AdminTournamentStatus[] }) {
  return (
    <section
      className="bg-white border border-light-gray shadow-sm rounded-sm overflow-hidden"
      aria-labelledby="active-tournaments-heading"
    >
      <div className="px-5 py-3 border-b border-light-gray flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
          <h3
            id="active-tournaments-heading"
            className="text-navy font-bold text-xs uppercase tracking-wider"
          >
            Active Tournaments
          </h3>
        </div>
        <Link
          href="/admin/tournaments/manage"
          prefetch
          className="text-text-secondary hover:text-navy text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
        >
          View All
        </Link>
      </div>
      {tournaments.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="w-12 h-12 bg-red/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-red/60" aria-hidden="true" />
          </div>
          <p className="text-navy font-semibold text-sm mb-1">
            No Active Tournaments
          </p>
          <p className="text-text-secondary text-xs mb-4">
            Create your first tournament — it takes less than 60 seconds with templates
          </p>
          <Link
            href="/admin/tournaments/manage"
            prefetch
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
          >
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" /> Create Tournament
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-light-gray">
          {tournaments.map((t) => {
            const pct =
              t.maxCapacity && t.maxCapacity > 0
                ? Math.min(Math.round((t.registeredCount / t.maxCapacity) * 100), 100)
                : null;
            const barColor =
              pct !== null
                ? pct >= 90
                  ? "bg-red"
                  : pct >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                : "bg-emerald-500";
            const textColor = pct !== null && pct >= 90 ? "text-red" : "text-text-secondary";
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/tournaments/${t.id}/registrations`}
                  prefetch
                  className="block px-5 py-3 hover:bg-off-white transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-inset"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-navy text-sm font-semibold truncate mr-2">
                      {t.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.registrationOpen ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">
                          Open
                        </span>
                      ) : (
                        <span className="text-[10px] bg-light-gray text-text-secondary px-2 py-0.5 rounded font-bold">
                          Closed
                        </span>
                      )}
                      <span className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded font-bold uppercase">
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary text-xs mb-2">
                    <span>
                      {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>{t.divisions.join(", ")}</span>
                    {t.entryFee != null && t.entryFee > 0 && (
                      <span>${(t.entryFee / 100).toFixed(0)}/team</span>
                    )}
                  </div>
                  {pct !== null ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-2.5 bg-light-gray rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Registration capacity: ${t.registeredCount} of ${t.maxCapacity}`}
                      >
                        <div
                          className={`h-full ${barColor} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold tabular-nums ${textColor}`}>
                        {pct}%
                      </span>
                      <span className="text-text-secondary text-[10px] font-bold tabular-nums">
                        {t.registeredCount}/{t.maxCapacity}
                      </span>
                    </div>
                  ) : (
                    <span className="text-text-secondary text-[10px]">
                      {t.registeredCount} registered
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-text-secondary text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default memo(TournamentsList);
