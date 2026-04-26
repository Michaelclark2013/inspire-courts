"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Calendar, Check, X, Clock } from "lucide-react";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Request = {
  id: number;
  userId: number;
  name: string | null;
  email: string | null;
  startDate: string;
  endDate: string;
  type: "pto" | "unpaid" | "sick" | "other";
  status: "pending" | "approved" | "denied" | "cancelled";
  reason: string | null;
  approvedAt: string | null;
  denialReason: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  denied: "bg-red/10 text-red",
  cancelled: "bg-navy/10 text-navy/70",
};

function fmtDate(iso: string): string { try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); } catch { return iso; } }

export default function TimeOffAdminPage() {
  useDocumentTitle("Time off");
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState("pending");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/time-off?status=${filter}`);
      if (res.ok) setRequests((await res.json()).data || []);
    } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  async function decide(id: number, next: "approved" | "denied") {
    setBusy(id);
    try {
      let denialReason: string | null = null;
      if (next === "denied") {
        denialReason = prompt("Reason for denial (optional):") || null;
      }
      await fetch("/api/admin/time-off", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: next, denialReason }),
      });
      await load();
    } finally { setBusy(null); }
  }

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Time-Off Requests
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {requests.length} {filter} request{requests.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="inline-flex border border-border rounded-md overflow-hidden">
          {(["pending", "approved", "denied", "cancelled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm capitalize ${filter === f ? "bg-navy text-white" : "bg-white text-text-secondary hover:text-navy"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonRows count={4} />
      ) : requests.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Calendar className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No {filter} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white border border-border rounded-lg p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-navy">{r.name || `User #${r.userId}`}</span>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wide">{r.type}</span>
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    <Calendar className="inline w-3.5 h-3.5 mr-1" />
                    {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                  </div>
                  {r.reason && <div className="text-xs text-text-secondary mt-1 italic">&ldquo;{r.reason}&rdquo;</div>}
                  {r.denialReason && <div className="text-xs text-red mt-1">Denied: {r.denialReason}</div>}
                  <div className="text-[10px] text-text-secondary mt-1"><Clock className="inline w-3 h-3 mr-0.5" /> Submitted {fmtDate(r.createdAt)}</div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => decide(r.id, "approved")} disabled={busy === r.id}
                      className="inline-flex items-center gap-1 bg-emerald-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-emerald-700 disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => decide(r.id, "denied")} disabled={busy === r.id}
                      className="inline-flex items-center gap-1 bg-white border border-red/30 text-red rounded-md px-3 py-1.5 text-sm hover:bg-red/5 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Deny
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
