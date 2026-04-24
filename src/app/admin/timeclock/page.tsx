"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

type OnClockRow = {
  id: number;
  userId: number;
  name: string | null;
  role: string | null;
  clockInAt: string;
  source: string;
  tournamentId: number | null;
  payRateCents: number;
  payRateType: string;
};

type PendingRow = OnClockRow & {
  clockOutAt: string;
  breakMinutes: number;
  bonusCents: number;
  computedCents: number;
};

type RecentRow = PendingRow & { status: string };

function formatCents(cents: number): string {
  if (!cents) return "$0.00";
  const abs = Math.abs(cents);
  return `$${Math.floor(abs / 100).toLocaleString()}.${String(abs % 100).padStart(2, "0")}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function elapsedMinutes(sinceIso: string): number {
  return Math.floor((Date.now() - Date.parse(sinceIso)) / 60_000);
}

export default function TimeclockPage() {
  const { data: session, status } = useSession();
  const [onTheClock, setOnTheClock] = useState<OnClockRow[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  // Abort the previous in-flight fetch when a new one starts so a
  // slow response can't overwrite fresher state after the user
  // approves an entry or the poll tick fires.
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/timeclock", { signal: controller.signal });
      if (res.ok) {
        const json = await res.json();
        setOnTheClock(json.onTheClock || []);
        setPending(json.pending || []);
        setRecent(json.recent || []);
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") throw e;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // Poll every 30s while the tab is visible so the "on the clock"
  // board stays live during tournaments.
  useEffect(() => {
    if (status !== "authenticated") return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    return () => clearInterval(iv);
  }, [status, load]);

  // Abort any in-flight fetch on unmount so a slow response can't
  // update state after the component is gone.
  useEffect(() => {
    const currentAbort = abortRef;
    return () => currentAbort.current?.abort();
  }, []);

  async function patch(entryId: number, body: Record<string, unknown>) {
    setBusy(entryId);
    try {
      const res = await fetch("/api/admin/timeclock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, ...body }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) {
    redirect("/admin/login");
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Time Clock
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Live shift board + pending approvals.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-navy disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ON THE CLOCK */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70 mb-3">
          On the Clock ({onTheClock.length})
        </h2>
        {onTheClock.length === 0 ? (
          <div className="text-text-secondary text-sm bg-off-white border border-border rounded-lg p-4">
            Nobody is clocked in right now.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onTheClock.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-navy">
                      {r.name || `User #${r.userId}`}
                    </div>
                    {r.role && (
                      <div className="text-xs text-text-secondary">{r.role}</div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" /> {elapsedMinutes(r.clockInAt)}m
                  </span>
                </div>
                <div className="text-xs text-text-secondary">
                  Since {formatTime(r.clockInAt)} · {r.source}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {formatCents(r.payRateCents)} {r.payRateType.replace("_", " ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PENDING APPROVAL */}
      <section className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70 mb-3">
          Pending Approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="text-text-secondary text-sm bg-off-white border border-border rounded-lg p-4">
            No entries waiting for approval.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">In</th>
                  <th className="px-3 py-2">Out</th>
                  <th className="px-3 py-2">Break</th>
                  <th className="px-3 py-2">Pay</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium text-navy">
                        {r.name || `User #${r.userId}`}
                      </div>
                      {r.role && (
                        <div className="text-xs text-text-secondary">{r.role}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-text-secondary">
                      {formatTime(r.clockInAt)}
                    </td>
                    <td className="px-3 py-2 text-xs text-text-secondary">
                      {formatTime(r.clockOutAt)}
                    </td>
                    <td className="px-3 py-2 text-xs">{r.breakMinutes}m</td>
                    <td className="px-3 py-2 font-mono text-navy">
                      {formatCents(r.computedCents)}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => patch(r.id, { status: "approved" })}
                        disabled={busy === r.id}
                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded px-2 py-1 text-xs mr-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => patch(r.id, { status: "rejected" })}
                        disabled={busy === r.id}
                        className="inline-flex items-center gap-1 bg-red/10 text-red hover:bg-red/20 rounded px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECENT APPROVED */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy/70 mb-3">
          Recent Approved ({recent.length})
        </h2>
        <div className="overflow-x-auto bg-white border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Pay</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium text-navy">
                    {r.name || `User #${r.userId}`}
                  </td>
                  <td className="px-3 py-2 text-xs text-text-secondary">
                    {formatTime(r.clockInAt)}
                  </td>
                  <td className="px-3 py-2 font-mono text-navy">
                    {formatCents(r.computedCents)}
                  </td>
                  <td className="px-3 py-2 text-xs text-emerald-700">{r.status}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-text-secondary text-xs">
                    No approved entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
