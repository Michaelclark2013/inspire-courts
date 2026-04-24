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
  Copy,
  History,
  Clock,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
  expiresAt: string | null;
};

type Effective = Record<string, { granted: boolean; source: "role" | "override" | "expired" }>;

type Dossier = {
  user: User;
  overrides: Override[];
  effective: Effective;
};

type AuditEntry = {
  id: number;
  action: string;
  actorEmail: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
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
  const router = useRouter();
  const userId = params?.userId ? Number(params.userId) : 0;

  const [data, setData] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditEntry[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

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

  async function setPermission(
    page: string,
    granted: boolean | null,
    opts: { reason?: string; expiresAt?: string | null } = {}
  ) {
    if (!data) return;
    setSavingKey(page);
    try {
      const res = await fetch(`/api/admin/permissions/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          granted,
          reason: opts.reason,
          expiresAt: opts.expiresAt ?? null,
        }),
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

  // Quick preset helpers. Ask for a day count and set expiry that
  // many days from now.
  function grantUntil(page: string, days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setPermission(page, true, { expiresAt: d.toISOString() });
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

  async function loadHistory() {
    try {
      const res = await fetch(`/api/admin/permissions/${userId}/history`);
      if (res.ok) setHistory(await res.json());
    } catch {
      /* ignore — just don't show history */
    }
  }

  async function viewAs() {
    setSavingKey("__viewas__");
    try {
      const res = await fetch("/api/admin/permissions/view-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to enter preview");
      // Send them to /admin so they can poke around as the target user.
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingKey(null);
    }
  }

  async function copyFrom(sourceUserId: number, replace: boolean) {
    setSavingKey("__copy__");
    try {
      const res = await fetch(`/api/admin/permissions/${userId}/copy-from`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUserId, replace }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Copy failed");
      }
      setCopyOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
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
            <div className="flex flex-wrap gap-2 self-start">
              <button
                onClick={viewAs}
                disabled={savingKey === "__viewas__"}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                title="See /admin through this user's eyes"
              >
                <Eye className="w-3.5 h-3.5" /> View as
              </button>
              <button
                onClick={() => setCopyOpen(true)}
                className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Copy from…
              </button>
              <button
                onClick={() => { setHistoryOpen(true); loadHistory(); }}
                className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <History className="w-3.5 h-3.5" /> History
              </button>
              {overrides.length > 0 && (
                <button
                  onClick={resetAll}
                  className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
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
                        {override?.expiresAt && (() => {
                          const t = new Date(override.expiresAt).getTime();
                          const expired = t < Date.now();
                          return (
                            <span className={expired ? "text-red" : "text-amber-600"}>
                              {" · "}
                              {expired ? "expired" : "expires"}{" "}
                              {new Date(override.expiresAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          );
                        })()}
                      </p>
                    </div>
                    {override && (() => {
                      const isExpired = override.expiresAt && new Date(override.expiresAt).getTime() < Date.now();
                      return (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isExpired
                            ? "bg-off-white text-text-muted"
                            : override.granted
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red/10 text-red"
                        }`}>
                          {override.granted ? <ShieldPlus className="w-3 h-3" /> : <ShieldMinus className="w-3 h-3" />}
                          {isExpired ? "Expired" : "Override"}
                        </span>
                      );
                    })()}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="relative group">
                        <button
                          onClick={() => setPermission(page.key, true)}
                          disabled={saving}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-colors ${
                            override?.granted
                              ? "bg-emerald-600 text-white"
                              : "bg-off-white text-text-muted hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                          title="Grant this page (click) — hover for temporary grants"
                        >
                          Grant
                        </button>
                        {/* Hover menu for time-boxed grants */}
                        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg p-1 hidden group-hover:block z-10 whitespace-nowrap">
                          <button
                            onClick={() => grantUntil(page.key, 1)}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-off-white text-navy"
                          >
                            For 24 hours
                          </button>
                          <button
                            onClick={() => grantUntil(page.key, 3)}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-off-white text-navy"
                          >
                            For 3 days (event)
                          </button>
                          <button
                            onClick={() => grantUntil(page.key, 7)}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-off-white text-navy"
                          >
                            For 1 week
                          </button>
                          <button
                            onClick={() => grantUntil(page.key, 30)}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-off-white text-navy"
                          >
                            For 30 days
                          </button>
                          <button
                            onClick={() => {
                              const d = prompt("Expires on (YYYY-MM-DD):");
                              if (d) {
                                const iso = new Date(d + "T23:59:59").toISOString();
                                setPermission(page.key, true, { expiresAt: iso });
                              }
                            }}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-off-white text-navy border-t border-border"
                          >
                            Pick date…
                          </button>
                        </div>
                      </div>
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

      {historyOpen && (
        <HistoryPanel entries={history} onClose={() => setHistoryOpen(false)} />
      )}
      {copyOpen && (
        <CopyFromDialog
          currentUserId={user.id}
          onClose={() => setCopyOpen(false)}
          onApply={copyFrom}
          saving={savingKey === "__copy__"}
        />
      )}
    </div>
  );
}

function HistoryPanel({
  entries,
  onClose,
}: {
  entries: AuditEntry[] | null;
  onClose: () => void;
}) {
  function label(action: string): string {
    switch (action) {
      case "permission.granted": return "Grant";
      case "permission.revoked": return "Revoke";
      case "permission.override_cleared": return "Inherit (cleared)";
      case "permission.reset_user": return "Reset all";
      case "permission.bulk_granted": return "Bulk grant";
      case "permission.bulk_revoked": return "Bulk revoke";
      case "permission.bulk_cleared": return "Bulk clear";
      case "permission.copied": return "Copied from user";
      default: return action;
    }
  }

  function parse(j: string | null) {
    if (!j) return null;
    try { return JSON.parse(j); } catch { return null; }
  }

  function fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString([], {
        month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });
    } catch { return iso; }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red" />
            <h2 className="text-navy font-bold text-lg font-heading">Permission History</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-navy p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          {entries === null ? (
            <p className="text-text-muted text-sm text-center py-8">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No permission changes yet for this user.</p>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((e) => {
                const after = parse(e.afterJson);
                const before = parse(e.beforeJson);
                const page = after?.page || before?.page || (Array.isArray(after?.pages) ? after.pages.join(", ") : null);
                return (
                  <li key={e.id} className="py-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        e.action.includes("grant") || e.action === "permission.copied"
                          ? "bg-emerald-50 text-emerald-700"
                          : e.action.includes("revoke")
                          ? "bg-red/10 text-red"
                          : "bg-off-white text-text-muted"
                      }`}>{label(e.action)}</span>
                      {page && (
                        <span className="text-navy text-sm font-semibold font-mono">{page}</span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs">
                      {e.actorEmail || "Admin"} · {fmtDate(e.createdAt)}
                      {after?.reason && ` · "${after.reason}"`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyFromDialog({
  currentUserId,
  onClose,
  onApply,
  saving,
}: {
  currentUserId: number;
  onClose: () => void;
  onApply: (sourceUserId: number, replace: boolean) => void;
  saving: boolean;
}) {
  const [options, setOptions] = useState<Array<{ id: number; name: string; email: string; role: string; overrides: { grants: number; revokes: number } }>>([]);
  const [search, setSearch] = useState("");
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [replace, setReplace] = useState(false);

  useEffect(() => {
    fetch("/api/admin/permissions")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.users) setOptions(d.users.filter((u: { id: number }) => u.id !== currentUserId));
      });
  }, [currentUserId]);

  const filtered = options.filter((u) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-navy font-bold text-lg font-heading flex items-center gap-2">
            <Copy className="w-4 h-4 text-red" /> Copy Permissions From
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-navy p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
          />
          <label className="flex items-center gap-2 bg-off-white border border-border rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="w-4 h-4" />
            <span className="text-navy text-sm font-semibold">
              Replace existing overrides <span className="text-text-muted font-normal">(unchecked = merge)</span>
            </span>
          </label>
          <ul className="divide-y divide-border max-h-72 overflow-y-auto border border-border rounded-xl">
            {filtered.length === 0 ? (
              <li className="p-4 text-center text-text-muted text-sm">No users found</li>
            ) : filtered.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => setSourceId(u.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    sourceId === u.id ? "bg-red/5" : "hover:bg-off-white"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-semibold text-sm">{u.name}</p>
                    <p className="text-text-muted text-xs">{u.email} · {u.role}</p>
                  </div>
                  {u.overrides.grants + u.overrides.revokes > 0 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {u.overrides.grants + u.overrides.revokes} custom
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-muted">defaults</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 text-navy font-semibold text-sm py-2.5 rounded-xl border border-border hover:bg-off-white">
            Cancel
          </button>
          <button
            onClick={() => sourceId && onApply(sourceId, replace)}
            disabled={!sourceId || saving}
            className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider"
          >
            {saving ? "Copying…" : "Apply"}
          </button>
        </div>
      </div>
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
