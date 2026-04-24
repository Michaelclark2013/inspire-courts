"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  ShieldCheck,
  Clock,
  Users as UsersIcon,
  ArrowRight,
} from "lucide-react";

type Signup = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "staff" | "ref" | "front_desk" | "coach" | "parent";
  createdAt: string;
  emailVerifiedAt: string | null;
};

type Payload = {
  recent: Signup[];
  counts: Record<string, number>;
  windowDays: number;
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-navy text-white",
  staff: "bg-blue-50 text-blue-700",
  ref: "bg-red/10 text-red",
  front_desk: "bg-cyan-50 text-cyan-700",
  coach: "bg-emerald-50 text-emerald-700",
  parent: "bg-amber-50 text-amber-700",
};

function relTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    const d = Math.floor(s / 86400);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function RecentSignupsCard() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/recent-signups")
      .then((r) => {
        if (!r.ok) throw new Error(`signups ${r.status}`);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const showCats: Array<{ key: string; label: string }> = [
    { key: "coach", label: "Coaches" },
    { key: "parent", label: "Players" },
    { key: "staff", label: "Staff" },
    { key: "ref", label: "Refs" },
  ];

  return (
    <section aria-label="Recent account signups" className="mb-8">
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
              New Accounts
            </h2>
          </div>
          <Link
            href="/admin/users"
            className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1"
          >
            All users <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>

        {/* Counts strip */}
        <div className="grid grid-cols-4 gap-2 px-5 py-4 border-b border-border bg-off-white">
          {showCats.map((c) => (
            <div key={c.key} className="text-center">
              <p className="text-navy font-bold text-2xl tabular-nums font-heading">
                {data?.counts?.[c.key] ?? 0}
              </p>
              <p className="text-text-muted text-[10px] uppercase tracking-wider mt-0.5">
                {c.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-text-muted px-5 pt-2 uppercase tracking-wider">
          Last {data?.windowDays ?? 30} days
        </p>

        {/* Recent list */}
        <div className="px-2 py-2">
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading…</div>
          ) : error ? (
            <div className="py-6 px-3 text-red text-sm">{error}</div>
          ) : !data || data.recent.length === 0 ? (
            <div className="py-8 text-center">
              <UsersIcon className="w-6 h-6 text-text-muted mx-auto mb-2" aria-hidden="true" />
              <p className="text-text-muted text-sm">No signups yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-off-white flex items-center justify-center flex-shrink-0">
                    <span className="text-navy text-xs font-bold">
                      {(u.name || u.email)
                        .split(" ")
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-navy font-semibold text-sm truncate">{u.name}</p>
                      {u.emailVerifiedAt && (
                        <span title="Email verified">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs truncate">{u.email}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${ROLE_STYLES[u.role] || "bg-off-white text-text-muted"}`}
                  >
                    {u.role.replace("_", " ")}
                  </span>
                  <span className="text-text-muted text-[10px] flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" aria-hidden="true" /> {relTime(u.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
