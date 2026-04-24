"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  PlaneTakeoff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
} from "lucide-react";

type ShiftLite = {
  id: number;
  title: string;
  role: string | null;
  startAt: string;
  endAt: string;
  courts: string | null;
  requiredHeadcount: number;
  notes: string | null;
  filled?: number;
};

type Assignment = {
  assignmentId: number;
  status: "assigned" | "confirmed" | "declined" | "no_show" | "completed";
  shift: ShiftLite;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function StaffPortalPage() {
  const { data: session } = useSession();
  const name = session?.user?.name?.split(" ")[0] || "there";

  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [openShifts, setOpenShifts] = useState<ShiftLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/portal/staff/schedule");
      if (!res.ok) throw new Error(`schedule ${res.status}`);
      const data = await res.json();
      setMyAssignments(Array.isArray(data.myAssignments) ? data.myAssignments : []);
      setOpenShifts(Array.isArray(data.openShifts) ? data.openShifts : []);
    } catch (err) {
      setError((err as Error).message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const needsResponse = myAssignments.filter((a) => a.status === "assigned");
  const confirmed = myAssignments.filter((a) => a.status === "confirmed");

  return (
    <div className="p-5 lg:p-8 max-w-5xl pb-[env(safe-area-inset-bottom)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy to-navy/90 text-white rounded-2xl p-6 mb-6">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Staff Portal</p>
        <h1 className="text-2xl font-bold font-heading mb-4">Hey, {name}</h1>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{confirmed.length}</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wider mt-1">Confirmed</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{needsResponse.length}</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wider mt-1">Awaiting</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{openShifts.length}</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wider mt-1">Open</p>
          </div>
        </div>
      </div>

      {/* Action-needed */}
      {needsResponse.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Needs Your Response</h2>
          </div>
          <div className="space-y-2">
            {needsResponse.map((a) => (
              <Link
                key={a.assignmentId}
                href="/portal/staff/schedule"
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 hover:bg-off-white transition-colors"
              >
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-navy text-sm font-semibold truncate">{a.shift.title}</p>
                  <p className="text-text-muted text-xs">{fmtDate(a.shift.startAt)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My upcoming shifts */}
      <div className="mb-6">
        <h2 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-3 px-1">
          My Upcoming Shifts
        </h2>
        {loading ? (
          <div className="bg-white border border-light-gray rounded-2xl p-6 text-center text-text-muted text-sm">
            Loading…
          </div>
        ) : error ? (
          <div className="bg-red/10 border border-red/20 rounded-2xl p-4 text-red text-sm">{error}</div>
        ) : confirmed.length === 0 ? (
          <div className="bg-white border border-light-gray rounded-2xl p-6 text-center">
            <p className="text-text-muted text-sm">No confirmed shifts. Check the open board below.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {confirmed.map((a) => (
              <div key={a.assignmentId} className="bg-white border border-light-gray rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm">{a.shift.title}</p>
                  <p className="text-text-muted text-xs mt-0.5">{fmtDate(a.shift.startAt)}</p>
                  {a.shift.courts && (
                    <p className="text-text-muted text-xs mt-0.5">Courts: {a.shift.courts}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open shifts preview */}
      {openShifts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-text-muted text-xs font-bold uppercase tracking-widest">Open Shifts</h2>
            <Link href="/portal/staff/schedule" className="text-red text-xs font-semibold hover:text-red-hover">
              Browse all →
            </Link>
          </div>
          <div className="space-y-2">
            {openShifts.slice(0, 3).map((s) => (
              <div key={s.id} className="bg-white border border-light-gray rounded-2xl p-4">
                <p className="text-navy font-semibold text-sm">{s.title}</p>
                <p className="text-text-muted text-xs mt-0.5">{fmtDate(s.startAt)}</p>
                <p className="text-text-muted text-xs mt-1">
                  {s.filled ?? 0}/{s.requiredHeadcount} filled
                  {s.role ? ` · ${s.role}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/portal/staff/games" className="bg-white border border-red/30 rounded-2xl p-4 hover:shadow-sm transition-shadow">
          <ClipboardList className="w-5 h-5 text-red mb-2" aria-hidden="true" />
          <p className="text-navy font-bold text-sm">Score Games</p>
          <p className="text-text-muted text-xs">Enter today&apos;s scores</p>
        </Link>
        <Link href="/portal/staff/schedule" className="bg-white border border-light-gray rounded-2xl p-4 hover:shadow-sm transition-shadow">
          <CalendarDays className="w-5 h-5 text-blue-600 mb-2" aria-hidden="true" />
          <p className="text-navy font-bold text-sm">My Schedule</p>
          <p className="text-text-muted text-xs">Shifts & claims</p>
        </Link>
        <Link href="/portal/staff/clock" className="bg-white border border-light-gray rounded-2xl p-4 hover:shadow-sm transition-shadow">
          <Clock className="w-5 h-5 text-emerald-600 mb-2" aria-hidden="true" />
          <p className="text-navy font-bold text-sm">Time Clock</p>
          <p className="text-text-muted text-xs">Clock in / out</p>
        </Link>
        <Link href="/portal/staff/time-off" className="bg-white border border-light-gray rounded-2xl p-4 hover:shadow-sm transition-shadow">
          <PlaneTakeoff className="w-5 h-5 text-amber-600 mb-2" aria-hidden="true" />
          <p className="text-navy font-bold text-sm">Time Off</p>
          <p className="text-text-muted text-xs">Request PTO</p>
        </Link>
      </div>
    </div>
  );
}
