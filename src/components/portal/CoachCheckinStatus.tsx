"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

type Reg = {
  id: number;
  teamName: string;
  division: string | null;
  tournament: { id: number; name: string; startDate: string; status: string } | null;
  playerCount: number;
  checkedIn: number;
  percent: number;
  rosterSubmitted: boolean;
  waiversSigned: boolean;
  paymentStatus: string;
  gaps: string[];
  complete: boolean;
};

// Coach-facing card that shows readiness for each registered team in
// an active tournament. Deep-links to the portal flows that resolve
// each gap (roster / waivers / payment).
export default function CoachCheckinStatus() {
  const [data, setData] = useState<{ registrations: Reg[] } | null>(null);

  useEffect(() => {
    fetch("/api/portal/coach/checkin-status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data || data.registrations.length === 0) return null;

  return (
    <section aria-label="Check-in readiness" className="mb-6 space-y-3">
      <div className="flex items-center gap-2 px-1">
        <UserCheck className="w-4 h-4 text-red" aria-hidden="true" />
        <h2 className="text-navy font-bold text-xs uppercase tracking-widest">Check-In Readiness</h2>
      </div>

      {data.registrations.map((r) => {
        const color = r.complete ? "emerald" : r.gaps.length >= 3 ? "red" : "amber";
        return (
          <div
            key={r.id}
            className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
              color === "emerald" ? "border-emerald-200" : color === "red" ? "border-red/30" : "border-amber-200"
            }`}
          >
            <div className="px-5 py-3 border-b border-border flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                r.complete ? "bg-emerald-50" : r.gaps.length >= 3 ? "bg-red/10" : "bg-amber-50"
              }`}>
                {r.complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className={`w-4 h-4 ${r.gaps.length >= 3 ? "text-red" : "text-amber-600"}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-navy font-bold text-sm truncate">{r.teamName}</p>
                <p className="text-text-muted text-xs truncate">
                  {r.tournament?.name}
                  {r.division ? ` · ${r.division}` : ""}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${
                r.complete ? "bg-emerald-50 text-emerald-700" : r.gaps.length >= 3 ? "bg-red/10 text-red" : "bg-amber-50 text-amber-700"
              }`}>
                {r.complete ? "Complete" : "Action needed"}
              </span>
            </div>

            <div className="px-5 py-3">
              <div className="w-full bg-off-white rounded-full h-2 overflow-hidden mb-1.5">
                <div
                  className={`h-full ${r.complete ? "bg-emerald-500" : r.percent > 0 ? "bg-amber-500" : "bg-red/40"}`}
                  style={{ width: `${r.percent}%` }}
                />
              </div>
              <p className="text-text-muted text-[11px] tabular-nums">
                {r.checkedIn}/{r.playerCount} players checked in · {r.percent}%
              </p>
            </div>

            {r.gaps.length > 0 && (
              <div className="px-5 py-3 border-t border-border space-y-1.5 bg-off-white/30">
                {r.gaps.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    <span className="text-navy">{g}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-2.5 border-t border-border flex flex-wrap gap-2">
              {!r.rosterSubmitted && (
                <Link href="/portal/roster" className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-red text-white hover:bg-red-hover flex items-center gap-1">
                  Submit Roster <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {!r.waiversSigned && (
                <Link href="/portal/waiver" className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-red text-white hover:bg-red-hover flex items-center gap-1">
                  Sign Waivers <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {r.paymentStatus === "pending" && (
                <Link href="/portal" className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-red text-white hover:bg-red-hover flex items-center gap-1">
                  Complete Payment <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {r.checkedIn < r.playerCount && (
                <Link href="/portal/checkin" className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white border border-border text-navy hover:bg-off-white flex items-center gap-1">
                  Check In Players <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
