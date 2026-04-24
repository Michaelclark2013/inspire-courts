"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldPlus, ShieldMinus, RotateCcw, Copy } from "lucide-react";

type Entry = {
  id: number;
  action: string;
  actorEmail: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  createdAt: string;
};

const ACTION_STYLES: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  "permission.granted": { label: "Granted", tone: "text-emerald-600", icon: <ShieldPlus className="w-3.5 h-3.5" /> },
  "permission.revoked": { label: "Revoked", tone: "text-red", icon: <ShieldMinus className="w-3.5 h-3.5" /> },
  "permission.override_cleared": { label: "Inherited", tone: "text-text-muted", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  "permission.reset_user": { label: "Reset user", tone: "text-text-muted", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  "permission.bulk_granted": { label: "Bulk grant", tone: "text-emerald-600", icon: <ShieldPlus className="w-3.5 h-3.5" /> },
  "permission.bulk_revoked": { label: "Bulk revoke", tone: "text-red", icon: <ShieldMinus className="w-3.5 h-3.5" /> },
  "permission.bulk_cleared": { label: "Bulk clear", tone: "text-text-muted", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  "permission.copied": { label: "Copied", tone: "text-blue-600", icon: <Copy className="w-3.5 h-3.5" /> },
};

function parse(j: string | null): Record<string, unknown> | null {
  if (!j) return null;
  try { return JSON.parse(j); } catch { return null; }
}

function fmtRel(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return m === 0 ? "just now" : `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch { return iso; }
}

export default function PermissionActivityFeed() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/permissions/activity")
      .then((r) => (r.ok ? r.json() : []))
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 text-center text-text-muted text-sm">
        Loading activity…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 text-center text-text-muted text-sm">
        No permission changes yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Activity className="w-4 h-4 text-red" />
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Recent Permission Changes</h2>
      </div>
      <ul className="divide-y divide-border max-h-96 overflow-y-auto">
        {entries.map((e) => {
          const style = ACTION_STYLES[e.action] || { label: e.action, tone: "text-text-muted", icon: null };
          const after = parse(e.afterJson);
          const before = parse(e.beforeJson);
          const page = (after?.page as string) || (before?.page as string) ||
            (Array.isArray(after?.pages) ? (after.pages as string[]).join(", ") : null);
          const userCount = Array.isArray(after?.userIds) ? (after.userIds as number[]).length : null;
          return (
            <li key={e.id} className="px-5 py-2.5 flex items-center gap-3">
              <span className={`${style.tone} flex-shrink-0`}>{style.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-navy text-sm font-semibold">
                  <span className={style.tone}>{style.label}</span>
                  {page && <span className="text-navy font-mono text-[11px] ml-1">{page}</span>}
                  {userCount && <span className="text-text-muted font-normal"> · {userCount} user{userCount === 1 ? "" : "s"}</span>}
                </p>
                <p className="text-text-muted text-[11px] truncate">
                  {e.actorEmail || "Admin"} · {fmtRel(e.createdAt)}
                  {after?.reason ? ` · "${after.reason as string}"` : ""}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
