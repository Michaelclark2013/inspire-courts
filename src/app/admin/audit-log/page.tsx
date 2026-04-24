"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Download, ChevronDown, ChevronRight, Filter } from "lucide-react";

type AuditRow = {
  id: number;
  createdAt: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  actorIp: string | null;
  actorUserAgent: string | null;
  requestId: string | null;
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

// Colorize by action class — destructive = red, mutation = amber,
// read-ish = navy.
function actionTone(action: string): string {
  if (/deleted|rejected|denied|cancelled|terminated|failed/i.test(action)) return "text-red";
  if (/created|signed|approved|locked|paid/i.test(action)) return "text-emerald-700";
  if (/updated|changed|patched|edited/i.test(action)) return "text-amber-700";
  return "text-navy";
}

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: "",
    entityId: "",
    action: "",
    actorUserId: "",
  });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
      const res = await fetch(`/api/admin/audit-log?${params}`, { signal });
      if (signal?.aborted) return;
      if (res.ok) {
        const json = await res.json();
        setRows(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      throw e;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filters]);
  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [status, load]);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const csvHref = (() => {
    const p = new URLSearchParams({ format: "csv" });
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    return `/api/admin/audit-log?${p}`;
  })();

  if (status === "loading") return null;
  if (status === "unauthenticated" || session?.user?.role !== "admin") redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Audit Log
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Every admin mutation — who, what, when, from where.{total > 0 && ` ${total.toLocaleString()} total entries.`}
          </p>
        </div>
        <a href={csvHref} className="inline-flex items-center gap-1 bg-white border border-border text-navy rounded-md px-3 py-1.5 text-sm hover:bg-off-white">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">Entity Type</span>
          <input
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
            placeholder="member, tournament, staff_profile…"
            className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">Entity ID</span>
          <input
            value={filters.entityId}
            onChange={(e) => setFilters({ ...filters, entityId: e.target.value })}
            placeholder="42"
            className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">Action</span>
          <input
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            placeholder="user.approved, time_entry.approved…"
            className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-text-secondary mb-1">Actor User ID</span>
          <input
            value={filters.actorUserId}
            onChange={(e) => setFilters({ ...filters, actorUserId: e.target.value })}
            placeholder="1"
            className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-off-white border border-border rounded-xl p-8 text-center">
          <Filter className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <p className="text-navy font-semibold">No audit entries match.</p>
          <p className="text-text-secondary text-sm mt-1">Clear filters to see all.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl divide-y divide-border">
          {rows.map((r) => {
            const isOpen = expanded.has(r.id);
            return (
              <div key={r.id} className="px-4 py-2.5">
                <button
                  onClick={() => toggleExpand(r.id)}
                  className="w-full flex items-start justify-between gap-3 text-left"
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-text-secondary mt-0.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-text-secondary mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        <span className={`font-mono font-semibold ${actionTone(r.action)}`}>{r.action}</span>
                        {r.entityType && (
                          <span className="text-text-secondary"> · {r.entityType}{r.entityId ? `#${r.entityId}` : ""}</span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5 truncate">
                        {r.actorEmail || `user#${r.actorUserId ?? "?"}`} ({r.actorRole || "?"})
                        {r.actorIp && <> · {r.actorIp}</>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary flex-shrink-0">{fmtTime(r.createdAt)}</span>
                </button>

                {isOpen && (
                  <div className="mt-3 ml-5 bg-off-white rounded p-3 text-xs space-y-2">
                    {r.requestId && <div className="text-text-secondary">Request ID: <span className="font-mono">{r.requestId}</span></div>}
                    {r.actorUserAgent && <div className="text-text-secondary truncate">UA: <span className="font-mono">{r.actorUserAgent}</span></div>}
                    {r.beforeJson && (
                      <div>
                        <div className="text-text-secondary uppercase text-[10px] font-bold mb-0.5">Before</div>
                        <pre className="bg-white border border-border rounded p-2 overflow-x-auto">{prettyJson(r.beforeJson)}</pre>
                      </div>
                    )}
                    {r.afterJson && (
                      <div>
                        <div className="text-text-secondary uppercase text-[10px] font-bold mb-0.5">After</div>
                        <pre className="bg-white border border-border rounded p-2 overflow-x-auto">{prettyJson(r.afterJson)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function prettyJson(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw), null, 2); }
  catch { return raw; }
}
