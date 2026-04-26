"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  AlertTriangle,
  Users,
  ShieldCheck,
  Clock,
  Eye,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { adminFetch } from "@/lib/admin-fetch";

type AuditEntry = {
  id: number;
  action: string;
  actorEmail: string | null;
  entityType: string;
  createdAt: string;
};

const SECURITY_ACTIONS = [
  "security.force_relogin",
  "permission.granted",
  "permission.revoked",
  "permission.bulk_granted",
  "permission.bulk_revoked",
  "permission.reset_user",
  "permission.template_applied",
  "user.role_changed",
  "user.approved",
  "user.deleted",
];

function fmtRel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SecurityPage() {
  useDocumentTitle("Security");
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [bumping, setBumping] = useState(false);
  const [bumped, setBumped] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Pull a wider window because we filter client-side to security
      // actions only — 50 raw rows often had zero security events.
      const res = await adminFetch("/api/admin/audit-log?limit=200");
      if (!res.ok) return;
      const data = await res.json();
      // The audit-log API returns { data, items, total, ... }. We were
      // reading data.rows which doesn't exist — that's why this feed
      // was always empty. Fall back through both keys + raw array for
      // safety.
      const rows: AuditEntry[] = Array.isArray(data)
        ? data
        : (data?.data || data?.items || []);
      setAudits(
        rows.filter((r: AuditEntry) =>
          SECURITY_ACTIONS.some((a) => r.action === a || r.action.startsWith(`${a.split(".")[0]}.`))
        )
      );
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function forceRelogin() {
    if (!confirm("Sign out every non-admin user on their next request? This will invalidate their cached permissions.")) return;
    setBumping(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/security/force-relogin", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBumped(data.touched);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBumping(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Access Control</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-red" />
            Security
          </h1>
          <p className="text-white/60 text-sm mt-2 max-w-xl">
            Emergency controls and a live feed of permission-related activity.
          </p>
        </div>
      </section>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Force relogin */}
        <div className="bg-white border border-red/30 rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="text-navy font-bold text-base">Force Re-login</h2>
              <p className="text-text-muted text-xs mt-0.5">
                Invalidates cached permissions for every non-admin. Next request re-hydrates from DB.
              </p>
            </div>
          </div>
          <p className="text-text-muted text-xs mb-4">
            Use after an emergency permission change or a suspected credential leak. Admins are not affected.
          </p>
          {bumped !== null && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm mb-3">
              Invalidated {bumped} user{bumped === 1 ? "" : "s"}.
            </div>
          )}
          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-3 py-2 text-sm mb-3">{error}</div>}
          <button
            onClick={forceRelogin}
            disabled={bumping}
            className="w-full bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider"
          >
            {bumping ? "Working…" : "Force Re-login All Non-Admins"}
          </button>
        </div>

        {/* Quick links */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
          <h2 className="text-navy font-bold text-base mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red" /> Quick Links
          </h2>
          <div className="space-y-2">
            <Link href="/admin/permissions" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm font-semibold text-navy">
              <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-red" /> Per-user Permissions</span>
              <span className="text-text-muted text-xs">→</span>
            </Link>
            <Link href="/admin/permissions/roles" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm font-semibold text-navy">
              <span>Role Defaults</span>
              <span className="text-text-muted text-xs">→</span>
            </Link>
            <Link href="/admin/permissions/templates" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm font-semibold text-navy">
              <span>Permission Templates</span>
              <span className="text-text-muted text-xs">→</span>
            </Link>
            <Link href="/admin/approvals" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm font-semibold text-navy">
              <span>Pending Approvals</span>
              <span className="text-text-muted text-xs">→</span>
            </Link>
            <Link href="/admin/audit-log" className="flex items-center justify-between bg-off-white hover:bg-border rounded-xl px-4 py-2.5 text-sm font-semibold text-navy">
              <span>Full Audit Log</span>
              <span className="text-text-muted text-xs">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent security events */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Eye className="w-4 h-4 text-red" />
          <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Recent Security Events</h2>
        </div>
        {audits.length === 0 ? (
          <p className="p-8 text-center text-text-muted text-sm">No security events yet.</p>
        ) : (
          <ul className="divide-y divide-border max-h-96 overflow-y-auto">
            {audits.map((a) => (
              <li key={a.id}>
                {/* Link pre-fills the audit-log action filter via URL
                    params (the page reads them on mount). Click any
                    security event row to land on a pre-filtered view
                    of every other instance of the same action. */}
                <Link
                  href={`/admin/audit-log?action=${encodeURIComponent(a.action)}`}
                  className="px-5 py-2.5 flex items-center gap-3 hover:bg-off-white"
                >
                  <div className="w-8 h-8 rounded-full bg-off-white flex items-center justify-center flex-shrink-0">
                    <Shield className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-navy text-sm font-semibold truncate">
                      <span className="font-mono text-[11px] text-text-muted">{a.action}</span>
                    </p>
                    <p className="text-text-muted text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtRel(a.createdAt)} · {a.actorEmail || "system"} · {a.entityType}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
