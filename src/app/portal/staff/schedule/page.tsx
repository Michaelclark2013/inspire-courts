"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Check, X, Clock, CheckCircle2, Users } from "lucide-react";

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
  payRateCentsOverride: number | null;
  bonusCents: number;
  notes: string | null;
  shift: ShiftLite;
};

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  declined: "bg-red/10 text-red",
  no_show: "bg-red/10 text-red",
  completed: "bg-cyan-50 text-cyan-700",
};

function fmtTime(iso: string): string {
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

export default function MyStaffSchedulePage() {
  const { data: session, status } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [openShifts, setOpenShifts] = useState<ShiftLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/portal/staff/schedule");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setAssignments(json.myAssignments || []);
      setOpenShifts(json.openShifts || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  async function respond(assignmentId: number, response: "confirmed" | "declined") {
    setBusy(assignmentId);
    try {
      await fetch("/api/portal/staff/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, response }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function claim(shiftId: number) {
    setBusy(shiftId);
    setErr("");
    try {
      const res = await fetch("/api/portal/staff/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Claim failed");
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated") redirect("/login?callbackUrl=/portal/staff/schedule");

  return (
    <div className="min-h-screen bg-off-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy font-heading mb-1">
          My Schedule
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {session?.user?.name ? `Hi, ${session.user.name}.` : ""} Confirm assigned
          shifts or claim open ones.
        </p>

        {loading ? (
          <div className="text-text-secondary text-sm">Loading…</div>
        ) : (
          <>
            {/* MY ASSIGNMENTS */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70 mb-3">
                Assigned to You ({assignments.length})
              </h2>
              {assignments.length === 0 ? (
                <div className="bg-white border border-border rounded-lg p-4 text-sm text-text-secondary">
                  No upcoming shifts assigned. Browse open shifts below.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div
                      key={a.assignmentId}
                      className="bg-white border border-border rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-navy truncate">
                              {a.shift.title}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status]}`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <div className="text-xs text-text-secondary">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {fmtTime(a.shift.startAt)} → {fmtTime(a.shift.endAt)}
                          </div>
                          {a.shift.role && (
                            <div className="text-xs text-text-secondary mt-1">
                              Role: {a.shift.role}
                              {a.shift.courts ? ` · Courts ${a.shift.courts}` : ""}
                            </div>
                          )}
                          {a.bonusCents > 0 && (
                            <div className="text-xs text-emerald-700 font-medium mt-1">
                              + ${(a.bonusCents / 100).toFixed(2)} bonus
                            </div>
                          )}
                        </div>
                      </div>
                      {a.status === "assigned" && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => respond(a.assignmentId, "confirmed")}
                            disabled={busy === a.assignmentId}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 text-white rounded-md py-2 text-sm hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" /> Confirm
                          </button>
                          <button
                            onClick={() => respond(a.assignmentId, "declined")}
                            disabled={busy === a.assignmentId}
                            className="flex-1 inline-flex items-center justify-center gap-1 bg-white border border-red/30 text-red rounded-md py-2 text-sm hover:bg-red/5 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" /> Decline
                          </button>
                        </div>
                      )}
                      {a.status === "confirmed" && (
                        <div className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          You&apos;re confirmed
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* OPEN SHIFTS */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70 mb-3">
                Open Shifts ({openShifts.length})
              </h2>
              {openShifts.length === 0 ? (
                <div className="bg-white border border-border rounded-lg p-4 text-sm text-text-secondary">
                  No open shifts right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {openShifts.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border border-border rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-navy truncate">
                            {s.title}
                          </h3>
                          <div className="text-xs text-text-secondary mt-1">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {fmtTime(s.startAt)} → {fmtTime(s.endAt)}
                          </div>
                          {s.role && (
                            <div className="text-xs text-text-secondary mt-1">
                              Role: {s.role}
                              {s.courts ? ` · Courts ${s.courts}` : ""}
                            </div>
                          )}
                          <div className="text-xs text-text-secondary mt-1">
                            <Users className="inline w-3 h-3 mr-1" />
                            {s.filled ?? 0}/{s.requiredHeadcount} filled
                          </div>
                        </div>
                        <button
                          onClick={() => claim(s.id)}
                          disabled={busy === s.id}
                          className="inline-flex items-center gap-1 bg-navy text-white rounded-md px-3 py-1.5 text-sm hover:bg-navy/90 disabled:opacity-50"
                        >
                          Claim
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {err && (
              <div className="mt-4 bg-red/5 border border-red/20 rounded-lg p-3 text-red text-sm">
                {err}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
