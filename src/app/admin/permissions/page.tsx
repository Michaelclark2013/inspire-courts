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
} from "lucide-react";

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
    <div className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-6">
        <div aria-hidden="true" className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Access Control</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-red" />
            Permissions
          </h1>
          <p className="text-white/60 text-sm max-w-xl mb-6">
            Every account has role-based defaults. Click a user to grant extra access or revoke specific pages without changing their role.
          </p>

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
              <li key={u.id}>
                <Link
                  href={`/admin/permissions/${u.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-off-white transition-colors group"
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
