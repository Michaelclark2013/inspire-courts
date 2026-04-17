"use client";

import type { CheckInKPIs } from "@/types/checkin";

export default function CheckInStats({ stats }: { stats: CheckInKPIs }) {
  return (
    <>
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        role="status"
        aria-label="Check-in statistics"
      >
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
            Teams Checked In
          </p>
          <p className="text-navy text-2xl font-bold font-heading">
            {stats.checkedInTeamCount}
            <span className="text-text-muted text-lg">
              /{stats.totalTeams}
            </span>
          </p>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
            Players Today
          </p>
          <p className="text-navy text-2xl font-bold font-heading">
            {stats.totalPlayerCheckins + stats.sessionCount}
          </p>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
            Not Checked In
          </p>
          <p className="text-red text-2xl font-bold font-heading">
            {stats.totalTeams - stats.checkedInTeamCount}
          </p>
        </div>
        <div className="bg-white border border-border shadow-sm rounded-xl p-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
            This Session
          </p>
          <p className="text-emerald-600 text-2xl font-bold font-heading">
            {stats.sessionCount}
          </p>
        </div>
      </div>

      {/* Check-in progress bar */}
      {stats.totalTeams > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-text-muted font-semibold uppercase tracking-wider">
              Check-in Progress
            </span>
            <span className="text-navy font-bold tabular-nums">
              {stats.checkedInTeamCount}/{stats.totalTeams} teams &middot;{" "}
              {Math.round(
                (stats.checkedInTeamCount / stats.totalTeams) * 100
              )}
              %
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.checkedInTeamCount === stats.totalTeams
                  ? "bg-emerald-400"
                  : "bg-red"
              }`}
              style={{
                width: `${Math.round(
                  (stats.checkedInTeamCount / stats.totalTeams) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
