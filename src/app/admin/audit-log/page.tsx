"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Download, ChevronDown, ChevronRight, Filter } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Static lists of every entity type and action emitted by recordAudit()
// across the codebase. Drives the filter datalists for typeahead.
const KNOWN_ENTITY_TYPES = [
  "announcement", "broadcast", "cache", "equipment", "game", "maintenance_ticket",
  "member", "member_visit", "membership_plan", "pay_period", "permission_template",
  "program", "program_registration", "program_session", "registration", "resource",
  "resource_booking", "shift", "shift_assignment", "site_content", "square_payment",
  "staff_availability", "staff_certification", "staff_profile", "team", "time_entry",
  "time_off_request", "tournament", "tournament_registration", "tournament_team",
  "user", "user_permission", "waiver",
  // Cycle 1+2 entities
  "subscription", "inquiry", "api_key", "webhook_subscription",
] as const;

const KNOWN_ACTIONS = [
  "admin.revalidate", "announcement.created", "announcement.deleted", "announcement.pushed",
  "announcement.updated", "certification.created", "certification.deleted",
  "certification.updated", "certification.verified", "checkin.nudge_sent",
  "equipment.created", "equipment.updated", "game.created", "game.deleted",
  "game.finalized", "game.play_voided", "game.score_entered", "game.status_changed",
  "maintenance.ticket_opened", "member.bulk_imported", "member.cancelled",
  "member.created", "member_visit.logged", "membership_plan.archived",
  "membership_plan.created", "membership_plan.updated", "notify.broadcast",
  "pay_period.created", "permission.auto_expired", "permission.bulk_cleared",
  "permission.copied", "permission.override_cleared", "permission.reset_user",
  "permission.template_applied", "program.archived", "program.created",
  "program.updated", "program_registration.cancelled", "program_registration.created",
  "program_session.created",
  // Cycle 1+2 actions — surfaced so the autocomplete suggests these
  // when the auditor types into the action filter input.
  "subscription.charged", "subscription.cancelled", "subscription.manual_charge",
  "inquiry.updated",
  "scheduler.auto_assigned",
  "api_key.created", "api_key.revoked",
  "webhook.created", "webhook.deleted",
  "permission.granted", "permission.revoked",
] as const;

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
  useDocumentTitle("Audit Log");
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    entityType: "",
    entityId: "",
    action: "",
    actorUserId: "",
    // Substring search on actor email — admins remember "sarah" not 17.
    actorEmail: "",
  });
  const debouncedFilters = useDebouncedValue(filters, 300);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      for (const [k, v] of Object.entries(debouncedFilters)) {
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
  }, [debouncedFilters]);
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
    <div className="p-3 sm:p-6 lg:p-8">
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
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Entity Type</span>
            <input
              list="audit-entity-types"
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              placeholder="member, tournament, staff_profile…"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
            />
            <datalist id="audit-entity-types">
              {KNOWN_ENTITY_TYPES.map((t) => (<option key={t} value={t} />))}
            </datalist>
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
              list="audit-actions"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              placeholder="user.approved, time_entry.approved…"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
            />
            <datalist id="audit-actions">
              {KNOWN_ACTIONS.map((a) => (<option key={a} value={a} />))}
            </datalist>
          </label>
          <label className="block">
            <span className="block text-xs text-text-secondary mb-1">Actor email or ID</span>
            <input
              value={filters.actorEmail || filters.actorUserId}
              onChange={(e) => {
                const v = e.target.value;
                // If they type digits-only, treat as ID; otherwise as email substring.
                if (v && /^\d+$/.test(v)) {
                  setFilters({ ...filters, actorUserId: v, actorEmail: "" });
                } else {
                  setFilters({ ...filters, actorEmail: v, actorUserId: "" });
                }
              }}
              placeholder="sarah@inspire… or 1"
              className="w-full bg-off-white border border-border rounded px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        {(filters.entityType || filters.entityId || filters.action || filters.actorUserId || filters.actorEmail) && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => setFilters({ entityType: "", entityId: "", action: "", actorUserId: "", actorEmail: "" })}
              className="text-xs text-text-secondary hover:text-navy underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonRows count={8} />
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
                        {/* Click-to-filter: tapping the actor cell narrows
                            the list to just that actor. Faster than typing
                            their email into the filter input. */}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.actorEmail) setFilters({ ...filters, actorEmail: r.actorEmail, actorUserId: "" });
                            else if (r.actorUserId) setFilters({ ...filters, actorUserId: String(r.actorUserId), actorEmail: "" });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              if (r.actorEmail) setFilters({ ...filters, actorEmail: r.actorEmail, actorUserId: "" });
                              else if (r.actorUserId) setFilters({ ...filters, actorUserId: String(r.actorUserId), actorEmail: "" });
                            }
                          }}
                          className="hover:text-navy hover:underline cursor-pointer focus-visible:outline-none focus-visible:underline"
                          title="Filter to this actor"
                        >
                          {r.actorEmail || `user#${r.actorUserId ?? "?"}`}
                        </span>
                        {" "}({r.actorRole || "?"})
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
                    <DiffView beforeJson={r.beforeJson} afterJson={r.afterJson} />
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

// ── Diff viewer ──────────────────────────────────────────────────────
// Renders before/after as a field-by-field table so admins can spot
// what actually changed at a glance. For complex nested values we
// stringify; for primitives we show inline. Changed rows get highlighted.

function parseObj(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch { return null; }
}

function fmtVal(v: unknown): string {
  if (v === null) return "—";
  if (v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function DiffView({ beforeJson, afterJson }: { beforeJson: string | null; afterJson: string | null }) {
  const before = parseObj(beforeJson);
  const after = parseObj(afterJson);

  // If neither side parses as an object, fall back to raw pre blocks
  // (avoids breaking on non-JSON payloads or plain arrays).
  if (!before && !after) {
    return (
      <div className="space-y-2">
        {beforeJson && (
          <div>
            <div className="text-text-secondary uppercase text-[10px] font-bold mb-0.5">Before</div>
            <pre className="bg-white border border-border rounded p-2 overflow-x-auto">{prettyJson(beforeJson)}</pre>
          </div>
        )}
        {afterJson && (
          <div>
            <div className="text-text-secondary uppercase text-[10px] font-bold mb-0.5">After</div>
            <pre className="bg-white border border-border rounded p-2 overflow-x-auto">{prettyJson(afterJson)}</pre>
          </div>
        )}
      </div>
    );
  }

  const keys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})])).sort();
  const rows = keys.map((k) => {
    const b = before?.[k];
    const a = after?.[k];
    const bStr = fmtVal(b);
    const aStr = fmtVal(a);
    const changed = bStr !== aStr;
    return { k, bStr, aStr, changed, added: b === undefined && a !== undefined, removed: a === undefined && b !== undefined };
  });

  const changedCount = rows.filter((r) => r.changed).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-text-secondary uppercase text-[10px] font-bold">Changes</div>
        <span className="text-[10px] text-text-muted">
          {changedCount} field{changedCount === 1 ? "" : "s"} changed
        </span>
      </div>
      <div className="bg-white border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr] text-[10px] font-bold uppercase tracking-wider text-text-muted bg-off-white border-b border-border">
          <div className="px-2 py-1.5">Field</div>
          <div className="px-2 py-1.5 border-l border-border">Before</div>
          <div className="px-2 py-1.5 border-l border-border">After</div>
        </div>
        {rows.map((r) => (
          <div
            key={r.k}
            className={`grid grid-cols-[auto_1fr_1fr] border-b border-border last:border-b-0 ${r.changed ? "bg-amber-50/50" : ""}`}
          >
            <div className="px-2 py-1.5 font-mono text-navy font-semibold break-all">{r.k}</div>
            <div className={`px-2 py-1.5 border-l border-border font-mono break-all ${r.changed && !r.added ? "text-red bg-red/5" : "text-text-muted"}`}>
              {r.bStr || <span className="text-text-muted/60">—</span>}
            </div>
            <div className={`px-2 py-1.5 border-l border-border font-mono break-all ${r.changed && !r.removed ? "text-emerald-700 bg-emerald-50/50" : "text-text-muted"}`}>
              {r.aStr || <span className="text-text-muted/60">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
