"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ExternalLink, AlertTriangle, CheckCircle2, Download } from "lucide-react";

type Waiver = {
  id: number;
  playerName: string;
  parentName: string | null;
  teamName: string | null;
  email: string | null;
  phone: string | null;
  signedAt: string;
  expiresAt: string | null;
  waiverType: string;
  waiverVersion: string | null;
  signedByName: string | null;
  driveDocId: string | null;
  signatureDataUrl?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  general: "General", program: "Program", tournament: "Tournament",
  rental: "Rental", other: "Other",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = Date.parse(iso);
  if (!isFinite(d)) return null;
  return Math.ceil((d - Date.now()) / 86_400_000);
}

export default function WaiversPage() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState<"all" | "expiring" | "expired">("all");
  const [q, setQ] = useState("");
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Waiver | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "expiring") params.set("expiringInDays", "30");
      if (filter === "expired") params.set("expired", "true");
      const res = await fetch(`/api/admin/waivers?${params}`);
      if (res.ok) {
        const body = await res.json();
        setWaivers(Array.isArray(body) ? body : body.data ?? []);
      }
    } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  const filtered = q.trim().length >= 2
    ? waivers.filter((w) => {
        const n = q.toLowerCase();
        return (w.playerName?.toLowerCase().includes(n) ||
                w.parentName?.toLowerCase().includes(n) ||
                w.email?.toLowerCase().includes(n) ||
                w.teamName?.toLowerCase().includes(n));
      })
    : waivers;

  if (status === "loading") return null;
  if (status === "unauthenticated" || !session?.user?.role) redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Waivers
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Signed liability waivers with e-signatures + expiration tracking.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/waiver" target="_blank"
            className="inline-flex items-center gap-1 bg-white border border-border text-navy rounded-md px-3 py-1.5 text-sm hover:bg-off-white">
            <ExternalLink className="w-4 h-4" /> Public sign page
          </Link>
          <a href="/api/admin/waivers?format=csv"
            className="inline-flex items-center gap-1 bg-white border border-border text-navy rounded-md px-3 py-1.5 text-sm hover:bg-off-white">
            <Download className="w-4 h-4" /> CSV
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, team…"
          className="flex-1 min-w-[200px] bg-off-white border border-border rounded-md px-3 py-1.5 text-sm"
        />
        <div className="inline-flex border border-border rounded-md overflow-hidden">
          {(["all", "expiring", "expired"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm ${filter === f ? "bg-navy text-white" : "bg-white text-text-secondary hover:text-navy"}`}>
              {f === "expiring" ? "Expiring 30d" : f === "expired" ? "Expired" : "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No waivers match this view.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-off-white border-b border-border text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Signed By</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Signed</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => {
                const days = daysUntil(w.expiresAt);
                const expired = days !== null && days < 0;
                const expiring = days !== null && days >= 0 && days <= 30;
                return (
                  <tr key={w.id} className="border-b border-border last:border-0 hover:bg-off-white/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{w.playerName}</div>
                      <div className="text-xs text-text-secondary">{w.email || w.phone || w.teamName || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{w.signedByName || w.parentName || "—"}</td>
                    <td className="px-4 py-3 text-xs">{TYPE_LABELS[w.waiverType] || w.waiverType}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{fmtDate(w.signedAt)}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs ${expired ? "text-red font-semibold" : expiring ? "text-amber-700 font-semibold" : "text-text-secondary"}`}>
                        {fmtDate(w.expiresAt)}
                      </div>
                      {days !== null && (
                        <div className="text-[10px] text-text-secondary">
                          {expired ? (
                            <span className="inline-flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {-days}d overdue</span>
                          ) : (
                            <span>{days}d left</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(w)}
                        className="text-xs text-navy hover:text-red">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <WaiverDetailModal waiver={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function WaiverDetailModal({ waiver, onClose }: { waiver: Waiver; onClose: () => void }) {
  const [full, setFull] = useState<Waiver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/waivers?email=${encodeURIComponent(waiver.email || "")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rows) => {
        if (Array.isArray(rows)) {
          const hit = rows.find((r: Waiver) => r.id === waiver.id);
          if (hit) setFull(hit);
        }
      })
      .finally(() => setLoading(false));
  }, [waiver.id, waiver.email]);

  return (
    <div className="fixed inset-0 z-50 bg-navy/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">Waiver #{waiver.id}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-navy text-sm">Close</button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Player">{waiver.playerName}</Row>
          <Row label="Signed by">{waiver.signedByName || waiver.parentName || "—"}</Row>
          <Row label="Type">{TYPE_LABELS[waiver.waiverType] || waiver.waiverType} · {waiver.waiverVersion || "v1"}</Row>
          <Row label="Email">{waiver.email || "—"}</Row>
          <Row label="Phone">{waiver.phone || "—"}</Row>
          <Row label="Team">{waiver.teamName || "—"}</Row>
          <Row label="Signed">{fmtDate(waiver.signedAt)}</Row>
          <Row label="Expires">{fmtDate(waiver.expiresAt)}</Row>
        </dl>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-text-secondary font-bold mb-2">Signature</div>
          {loading ? (
            <div className="text-sm text-text-secondary">Loading…</div>
          ) : full?.signatureDataUrl ? (
            <img src={full.signatureDataUrl} alt="Signature"
              className="w-full border border-border rounded bg-white" />
          ) : (
            <div className="text-xs text-text-secondary italic">
              No signature image on file (older waiver — Drive doc{waiver.driveDocId ? ` ${waiver.driveDocId}` : ""}).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-xs text-text-secondary w-24 flex-shrink-0 uppercase tracking-wide">{label}</dt>
      <dd className="text-navy">{children}</dd>
    </div>
  );
}
