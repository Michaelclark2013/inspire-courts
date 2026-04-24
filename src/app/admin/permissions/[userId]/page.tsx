"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldPlus,
  ShieldMinus,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  AlertCircle,
} from "lucide-react";

// Page list mirrors AdminPage in lib/permissions.ts
type AdminPage = string;

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent";
  photoUrl: string | null;
  approved: boolean;
};

type Override = {
  id: number;
  page: string;
  granted: boolean;
  reason: string | null;
};

type Effective = Record<string, { granted: boolean; source: "role" | "override" }>;

type Dossier = {
  user: User;
  overrides: Override[];
  effective: Effective;
};

const ROLE_STYLES: Record<User["role"], string> = {
  admin: "bg-navy text-white",
  staff: "bg-blue-50 text-blue-700",
  ref: "bg-amber-50 text-amber-700",
  front_desk: "bg-cyan-50 text-cyan-700",
  coach: "bg-emerald-50 text-emerald-700",
  parent: "bg-purple-50 text-purple-700",
};

// Page groups — mirror lib/permissions PAGE_GROUPS so matrix reads
// like the admin nav.
const PAGE_GROUPS: Array<{ heading: string; pages: Array<{ key: AdminPage; label: string }> }> = [
  {
    heading: "Overview",
    pages: [
      { key: "overview", label: "Dashboard overview" },
      { key: "search", label: "Global search" },
      { key: "health", label: "System health" },
    ],
  },
  {
    heading: "Events",
    pages: [
      { key: "tournaments", label: "Tournaments" },
      { key: "teams", label: "Teams" },
      { key: "players", label: "Players database" },
      { key: "programs", label: "Programs" },
    ],
  },
  {
    heading: "Game Day",
    pages: [
      { key: "score_entry", label: "Enter scores" },
      { key: "scores", label: "Game scores" },
      { key: "checkin", label: "Team check-in" },
    ],
  },
  {
    heading: "Staff",
    pages: [
      { key: "roster", label: "Staff roster" },
      { key: "staff_refs", label: "Staff & refs" },
      { key: "timeclock", label: "Time clock" },
      { key: "shifts", label: "Shift board" },
      { key: "payroll", label: "Payroll" },
      { key: "certifications", label: "Certifications" },
      { key: "time_off", label: "Time off" },
      { key: "approvals", label: "Pending approvals" },
    ],
  },
  {
    heading: "Members + Revenue",
    pages: [
      { key: "members", label: "Members" },
      { key: "revenue", label: "Revenue" },
      { key: "leads", label: "Leads pipeline" },
      { key: "prospects", label: "Prospects pipeline" },
      { key: "sponsors", label: "Sponsors" },
    ],
  },
  {
    heading: "Facility",
    pages: [
      { key: "resources", label: "Rental fleet" },
      { key: "equipment", label: "Inventory" },
      { key: "maintenance", label: "Maintenance" },
      { key: "schools", label: "Schools" },
    ],
  },
  {
    heading: "Content & Comms",
    pages: [
      { key: "announcements", label: "Announcements" },
      { key: "content", label: "Content editor" },
      { key: "files", label: "Files & drive" },
    ],
  },
  {
    heading: "Admin",
    pages: [
      { key: "users", label: "User accounts" },
      { key: "audit_log", label: "Audit log" },
      { key: "analytics", label: "GA analytics" },
      { key: "contacts", label: "Contacts" },
      { key: "portal", label: "Portal switcher" },
    ],
  },
  {
    heading: "Personal",
    pages: [
      { key: "my_schedule", label: "My schedule" },
      { key: "my_history", label: "My history" },
    ],
  },
];

export default function PermissionsDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ? Number(params.userId) : 0;

  const [data, setData] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const res = await fetch(`/api/admin/permissions/${userId}`);
      if (!res.ok) throw new Error(`load ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function setPermission(page: string, granted: boolean | null, reason?: string) {
    if (!data) return;
    setSavingKey(page);
    try {
      const res = await fetch(`/api/admin/permissions/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, granted, reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingKey(null);
    }
  }

  async function resetAll() {
    if (!confirm("Clear all custom overrides for this user?")) return;
    setSavingKey("__all__");
    try {
      await fetch(`/api/admin/permissions/${userId}`, { method: "DELETE" });
      await load();
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>;
  if (error || !data) return <div className="p-8 text-red">{error || "Not found"}</div>;

  const { user, overrides, effective } = data;
  const overrideByPage: Record<string, Override> = Object.fromEntries(
    overrides.map((o) => [o.page, o])
  );

  const stats = {
    grants: overrides.filter((o) => o.granted).length,
    revokes: overrides.filter((o) => !o.granted).length,
    accessible: Object.values(effective).filter((e) => e.granted).length,
    total: Object.keys(effective).length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 max-w-full">
      <Link href="/admin/permissions" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> All users
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-6">
        <div aria-hidden="true" className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              {user.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/20" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                  <span className="text-white font-heading text-2xl font-bold">
                    {user.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1">
                  Permissions for
                </p>
                <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">{user.name}</h1>
                <p className="text-white/60 text-sm mt-1">{user.email}</p>
                <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${ROLE_STYLES[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>
            {overrides.length > 0 && (
              <button
                onClick={resetAll}
                className="bg-white/10 hover:bg-white/20 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to role defaults
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat label="Accessible" value={`${stats.accessible}/${stats.total}`} />
            <HeroStat label="Grants" value={stats.grants} tone={stats.grants ? "emerald" : undefined} />
            <HeroStat label="Revokes" value={stats.revokes} tone={stats.revokes ? "red" : undefined} />
            <HeroStat label="Customizations" value={overrides.length} tone={overrides.length ? "amber" : undefined} />
          </div>
        </div>
      </section>

      {/* Legend */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-text-muted font-bold uppercase tracking-wider">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-emerald-50 border border-emerald-200" />
            <span className="text-navy">Allowed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-off-white border border-border" />
            <span className="text-navy">Not allowed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-navy">Custom grant</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldMinus className="w-3.5 h-3.5 text-red" />
            <span className="text-navy">Custom revoke</span>
          </span>
        </div>
      </div>

      {/* Matrix */}
      <div className="space-y-4">
        {PAGE_GROUPS.map((group) => (
          <section key={group.heading} className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-off-white">
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">{group.heading}</h2>
            </div>
            <ul className="divide-y divide-border">
              {group.pages.map((page) => {
                const eff = effective[page.key] || { granted: false, source: "role" as const };
                const override = overrideByPage[page.key];
                const saving = savingKey === page.key;
                return (
                  <li key={page.key} className="px-5 py-3 flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      eff.granted ? "bg-emerald-50 border border-emerald-200" : "bg-off-white border border-border"
                    }`}>
                      {eff.granted ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-navy font-semibold text-sm">{page.label}</p>
                      <p className="text-text-muted text-[11px] truncate">
                        <span className="font-mono">{page.key}</span>
                        {override?.reason && ` · ${override.reason}`}
                      </p>
                    </div>
                    {override && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        override.granted ? "bg-emerald-50 text-emerald-700" : "bg-red/10 text-red"
                      }`}>
                        {override.granted ? <ShieldPlus className="w-3 h-3" /> : <ShieldMinus className="w-3 h-3" />}
                        Override
                      </span>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPermission(page.key, true)}
                        disabled={saving}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors ${
                          override?.granted
                            ? "bg-emerald-600 text-white"
                            : "bg-off-white text-text-muted hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                        title="Grant this page"
                      >
                        Grant
                      </button>
                      <button
                        onClick={() => setPermission(page.key, false)}
                        disabled={saving || (user.role === "admin" && page.key === "users")}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors ${
                          override?.granted === false
                            ? "bg-red text-white"
                            : "bg-off-white text-text-muted hover:bg-red/10 hover:text-red disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                        title="Revoke this page"
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => setPermission(page.key, null)}
                        disabled={saving || !override}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors ${
                          !override
                            ? "bg-off-white text-text-muted opacity-40"
                            : "bg-white border border-border text-navy hover:bg-off-white"
                        }`}
                        title="Clear the override and inherit from role"
                      >
                        Inherit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {user.role === "admin" && user.id && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700 text-xs">
            <strong>Admin account:</strong> revokes won't lock this person out of /admin/permissions (self-protection).
            Change the role instead if you want to demote.
          </p>
        </div>
      )}
    </div>
  );
}

function HeroStat({
  label, value, tone,
}: { label: string; value: number | string; tone?: "red" | "amber" | "emerald" }) {
  const toneClass =
    tone === "red" ? "text-red" :
    tone === "amber" ? "text-amber-300" :
    tone === "emerald" ? "text-emerald-300" :
    "text-white";
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
      <p className={`font-heading text-3xl font-bold tabular-nums tracking-tight ${toneClass}`}>{value}</p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">{label}</p>
    </div>
  );
}
