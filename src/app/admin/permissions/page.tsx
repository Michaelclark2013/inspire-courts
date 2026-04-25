"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldPlus,
  ShieldMinus,
  ArrowLeft,
  Search,
  Filter,
  ArrowUpRight,
  Users as UsersIcon,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import PermissionActivityFeed from "@/components/admin/permissions/ActivityFeed";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent";
  approved: boolean;
  photoUrl: string | null;
  overrides: { grants: number; revokes: number };
};

const ROLE_STYLES: Record<UserRow["role"], string> = {
  admin: "bg-navy text-white",
  staff: "bg-blue-50 text-blue-700",
  ref: "bg-amber-50 text-amber-700",
  front_desk: "bg-cyan-50 text-cyan-700",
  coach: "bg-emerald-50 text-emerald-700",
  parent: "bg-purple-50 text-purple-700",
};

const ROLE_LABELS: Record<UserRow["role"], string> = {
  admin: "Admin",
  staff: "Staff",
  ref: "Referee",
  front_desk: "Front Desk",
  coach: "Coach",
  parent: "Parent",
};

export default function PermissionsIndexPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/permissions");
      if (!res.ok) throw new Error(`load ${res.status}`);
      const data = await res.json();
      setRows(data.users || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((u) => {
      if (roleFilter === "customized") {
        if (u.overrides.grants + u.overrides.revokes === 0) return false;
      } else if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!s) return true;
      return (
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    });
  }, [rows, search, roleFilter]);

  const totals = useMemo(() => {
    let grants = 0, revokes = 0, customized = 0;
    for (const r of rows) {
      grants += r.overrides.grants;
      revokes += r.overrides.revokes;
      if (r.overrides.grants + r.overrides.revokes > 0) customized++;
    }
    return { grants, revokes, customized, total: rows.length };
  }, [rows]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Access Control</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-red" />
            Permissions
          </h1>
          <p className="text-white/60 text-sm max-w-xl mb-4">
            Every account has role-based defaults. Click a user to grant extra access or revoke specific pages without changing their role.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/admin/permissions/templates"
              className="bg-red hover:bg-red-hover rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              Templates
            </Link>
            <Link
              href="/admin/permissions/roles"
              className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              Role Defaults
            </Link>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a page */}
            <a
              href="/api/admin/permissions/export"
              download
              className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              Export CSV
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HeroStat label="Accounts" value={totals.total} />
            <HeroStat label="Customized" value={totals.customized} tone={totals.customized ? "amber" : undefined} />
            <HeroStat label="Extra Grants" value={totals.grants} tone={totals.grants ? "emerald" : undefined} />
            <HeroStat label="Revokes" value={totals.revokes} tone={totals.revokes ? "red" : undefined} />
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search permissions by name or email"
            className="w-full bg-off-white border border-border rounded-xl pl-9 pr-4 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
          {["all", "customized", "admin", "staff", "ref", "front_desk", "coach", "parent"].map((k) => (
            <button
              key={k}
              onClick={() => setRoleFilter(k)}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                roleFilter === k ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
              }`}
            >
              {k === "all" ? "All" : k === "customized" ? "Customized" : ROLE_LABELS[k as UserRow["role"]] || k}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-text-muted">Loading…</div>
      ) : error ? (
        <div className="bg-red/10 border border-red/20 rounded-2xl p-6 text-red text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <UsersIcon className="w-10 h-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-bold">No users match</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-border">
            {filtered.map((u) => (
              <li key={u.id} className="flex items-center group hover:bg-off-white transition-colors">
                <button
                  type="button"
                  onClick={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(u.id)) next.delete(u.id);
                      else next.add(u.id);
                      return next;
                    });
                  }}
                  aria-label={selected.has(u.id) ? "Deselect" : "Select"}
                  className="pl-4 pr-2 py-4 flex-shrink-0"
                >
                  {selected.has(u.id) ? (
                    <CheckSquare className="w-5 h-5 text-red" />
                  ) : (
                    <Square className="w-5 h-5 text-text-muted group-hover:text-navy" />
                  )}
                </button>
                <Link
                  href={`/admin/permissions/${u.id}`}
                  className="flex-1 flex items-center gap-3 pr-5 py-4"
                >
                  {u.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.photoUrl} alt={`${u.name} photo`} className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-off-white flex items-center justify-center flex-shrink-0">
                      <span className="text-navy text-xs font-bold">
                        {u.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-navy font-semibold text-sm truncate">{u.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${ROLE_STYLES[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                      {!u.approved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.overrides.grants > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <ShieldPlus className="w-3 h-3" /> {u.overrides.grants}
                      </span>
                    )}
                    {u.overrides.revokes > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red/10 text-red flex items-center gap-1">
                        <ShieldMinus className="w-3 h-3" /> {u.overrides.revokes}
                      </span>
                    )}
                    {u.overrides.grants + u.overrides.revokes === 0 && (
                      <span className="text-text-muted text-xs">Default</span>
                    )}
                    <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-red transition-colors" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent permission activity — site-wide audit rolling feed */}
      <div className="mt-8">
        <PermissionActivityFeed />
      </div>

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white rounded-full shadow-2xl px-5 py-3 flex items-center gap-3 z-40 max-w-[95vw]">
          <span className="text-sm font-bold">{selected.size} selected</span>
          <button
            onClick={() => setBulkOpen(true)}
            className="bg-red hover:bg-red-hover rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
          >
            Bulk edit
          </button>
          <button
            onClick={() => setSelected(new Set())}
            aria-label="Clear selection"
            className="text-white/70 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk action dialog */}
      {bulkOpen && (
        <BulkDialog
          userIds={Array.from(selected)}
          onClose={() => setBulkOpen(false)}
          onApplied={() => { setBulkOpen(false); setSelected(new Set()); load(); }}
        />
      )}
    </div>
  );
}

function BulkDialog({
  userIds,
  onClose,
  onApplied,
}: {
  userIds: number[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [action, setAction] = useState<"grant" | "revoke" | "clear">("grant");
  const [pages, setPages] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [preset, setPreset] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preset bundles — common permission packages so admin can apply
  // a whole role-like slice in one click.
  const PRESETS: Record<string, { label: string; pages: string[] }> = {
    scorekeeper: { label: "Scorekeeper", pages: ["score_entry", "scores", "my_schedule"] },
    front_desk_plus: { label: "Front Desk+", pages: ["checkin", "members", "programs", "scores", "players"] },
    read_only: { label: "Read-only admin", pages: ["overview", "scores", "tournaments", "teams", "players"] },
    tournament_director: { label: "Tournament Director", pages: ["tournaments", "teams", "players", "scores", "score_entry", "checkin", "announcements"] },
    money_only: { label: "Revenue view", pages: ["revenue", "leads", "prospects"] },
  };

  const ALL_PAGES = [
    "overview", "teams", "scores", "score_entry", "players", "checkin",
    "tournaments", "programs", "roster", "timeclock", "shifts", "payroll",
    "certifications", "time_off", "approvals", "members", "revenue",
    "leads", "prospects", "sponsors", "resources", "equipment",
    "maintenance", "schools", "announcements", "content", "files",
    "users", "audit_log", "analytics", "contacts", "portal",
    "my_schedule", "my_history", "staff_refs", "search", "health",
  ];

  function applyPreset(key: string) {
    setPreset(key);
    if (PRESETS[key]) setPages(new Set(PRESETS[key].pages));
  }

  async function apply() {
    if (pages.size === 0) {
      setError("Pick at least one page");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/permissions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds,
          pages: Array.from(pages),
          action,
          reason: reason.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      onApplied();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-navy font-bold text-lg font-heading">
            Bulk Edit · {userIds.length} user{userIds.length === 1 ? "" : "s"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-navy p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2">Action</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["grant", "Grant", "bg-emerald-50 text-emerald-700 border-emerald-200"],
                ["revoke", "Revoke", "bg-red/10 text-red border-red/20"],
                ["clear", "Clear override", "bg-off-white text-text-muted border-border"],
              ] as const).map(([k, label, cls]) => (
                <button
                  key={k}
                  onClick={() => setAction(k)}
                  className={`border rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                    action === k ? cls : "bg-white border-border text-text-muted hover:bg-off-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => applyPreset(k)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                    preset === k ? "bg-navy text-white" : "bg-off-white text-navy hover:bg-border"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => { setPages(new Set()); setPreset(""); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-border text-text-muted hover:bg-off-white"
              >
                Clear
              </button>
            </div>
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-2">
              Pages ({pages.size} selected)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto bg-off-white border border-border rounded-xl p-2">
              {ALL_PAGES.map((p) => (
                <label key={p} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pages.has(p)}
                    onChange={() => {
                      setPages((prev) => {
                        const next = new Set(prev);
                        if (next.has(p)) next.delete(p);
                        else next.add(p);
                        return next;
                      });
                      setPreset("");
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-navy text-xs font-semibold font-mono truncate">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Reason (optional)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
              placeholder="Why are you making this change?"
            />
          </div>

          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 text-navy font-semibold text-sm py-2.5 rounded-xl border border-border hover:bg-off-white">
            Cancel
          </button>
          <button
            onClick={apply}
            disabled={busy || pages.size === 0}
            className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider"
          >
            {busy ? "Applying…" : `Apply to ${userIds.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  label, value, tone,
}: { label: string; value: number; tone?: "red" | "amber" | "emerald" }) {
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
