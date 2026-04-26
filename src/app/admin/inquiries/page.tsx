"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Inbox,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  X,
  Search,
  Download,
  RefreshCw,
  CheckSquare,
  Square as SquareIcon,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { INQUIRY_CONFIGS } from "@/lib/inquiry-forms";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type InquiryRow = {
  id: number;
  kind: string;
  status: "new" | "contacted" | "qualifying" | "won" | "lost";
  name: string;
  email: string | null;
  phone: string | null;
  sports: string | null;
  source: string | null;
  message: string | null;
  slaDueAt: string | null;
  firstTouchAt: string | null;
  createdAt: string;
  assignedTo: number | null;
  assignedName: string | null;
};

type NoteRow = {
  id: number;
  body: string;
  kind: string | null;
  createdAt: string;
  authorName: string | null;
};

const STATUS_TONES: Record<string, string> = {
  new: "bg-red/10 text-red border-red/30",
  contacted: "bg-amber-50 text-amber-700 border-amber-200",
  qualifying: "bg-blue-50 text-blue-700 border-blue-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-text-muted/10 text-text-muted border-border",
};

const NOTE_KIND_LABELS: Record<string, string> = {
  status_change: "Status",
  sla_alert_sent: "SLA alert",
  sms_sent: "SMS sent",
  note: "Note",
};

function getKindLabel(kind: string): string {
  const c = INQUIRY_CONFIGS.find((x) => x.kind === kind);
  return c?.title || kind;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  const absMin = Math.abs(Math.round(diffMs / 60_000));
  if (absMin < 60) return diffMs > 0 ? `in ${absMin}m` : `${absMin}m ago`;
  const absHr = Math.round(absMin / 60);
  if (absHr < 24) return diffMs > 0 ? `in ${absHr}h` : `${absHr}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function InquiriesPage() {
  useDocumentTitle("Inquiries");
  const [rows, setRows] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [filterKind, setFilterKind] = useState<string>("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<InquiryRow | null>(null);
  const [activeNotes, setActiveNotes] = useState<NoteRow[]>([]);
  const [note, setNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const lastLoadRef = useRef<number>(0);

  // Close the detail drawer on Escape so keyboard users aren't trapped.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const buildQs = useCallback(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterKind) params.set("kind", filterKind);
    return params;
  }, [filterStatus, filterKind]);

  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        // adminFetch auto-redirects on 401. Non-ok non-401 responses
        // surface a banner instead of silently leaving stale rows.
        const res = await adminFetch(`/api/admin/inquiries?${buildQs()}`);
        if (res.ok) {
          setRows((await res.json()).rows || []);
          setLoadError(null);
        } else {
          const data = await res.json().catch(() => ({}));
          setLoadError(data.error || `Couldn't load inquiries (${res.status}). Showing last cached data.`);
        }
        lastLoadRef.current = Date.now();
      } catch (err) {
        // SessionExpiredError already redirected; any other throw is
        // a network blip — show a soft banner, keep the cached rows.
        if ((err as Error)?.name !== "SessionExpiredError") {
          setLoadError("Network error. Auto-refresh will retry in 30s.");
        }
      } finally {
        if (!silent) {
          setRefreshing(false);
          setLoading(false);
        }
      }
    },
    [buildQs]
  );

  // Initial + filter-change load.
  useEffect(() => {
    load(false);
  }, [load]);

  // Auto-refresh every 30s when tab visible. Live pipeline feel.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible" && Date.now() - lastLoadRef.current > 25_000) {
        load(true);
      }
    };
    const id = setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  // Bulk selection — Set of inquiry ids the rep has multi-selected
  // for batch status changes. Cleared on filter / search changes
  // because the filtered set under their feet is shifting.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // j/k keyboard nav cursor — index into the visible filtered list.
  const [cursor, setCursor] = useState<number>(-1);

  // Client-side search across name/email/phone/sports/source.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const blob = `${r.name}|${r.email ?? ""}|${r.phone ?? ""}|${r.sports ?? ""}|${r.source ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [rows, search]);

  // Reset bulk selection + cursor when filter/search shifts the visible set.
  useEffect(() => {
    setSelected(new Set());
    setCursor(-1);
  }, [filterStatus, filterKind, search]);

  // Keyboard shortcuts: j/k navigate, Enter open, Esc close detail.
  // Disabled while typing in an input (so search doesn't get hijacked).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
      if (e.key === "Escape" && active) {
        e.preventDefault();
        setActive(null);
        return;
      }
      if (inField) return;
      if (e.key === "j") {
        e.preventDefault();
        setCursor((c) => Math.min(filtered.length - 1, c + 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter" && cursor >= 0 && filtered[cursor]) {
        e.preventDefault();
        openDetail(filtered[cursor]);
      } else if (e.key === "x" && cursor >= 0 && filtered[cursor]) {
        // Quick-toggle bulk selection on the cursor row.
        e.preventDefault();
        const id = filtered[cursor].id;
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, cursor, active]);

  async function loadNotes(id: number) {
    setActiveNotes([]);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { cache: "no-store" });
      if (res.ok) setActiveNotes((await res.json()).notes || []);
    } catch { /* ignore */ }
  }

  function openDetail(r: InquiryRow) {
    setActive(r);
    setNote("");
    loadNotes(r.id);
  }

  // Toggle one row in the bulk-selection set.
  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Toggle every visible (filtered) row.
  function toggleSelectAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  }

  // Apply the same status change to every selected row, sequentially.
  // Sequential not parallel — failures are observable + don't all hit
  // SLA-recompute at once. ~50ms overhead per row vs blasting 50 in
  // parallel is a fair trade for traceability.
  async function bulkStatus(status: InquiryRow["status"]) {
    if (selected.size === 0) return;
    if (!confirm(`Change ${selected.size} inquir${selected.size === 1 ? "y" : "ies"} to "${status}"?`)) return;
    setBulkBusy(true);
    setLoadError(null);
    try {
      // Optimistic batch update.
      setRows((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, status } : r)));
      // Fire the PATCHes in parallel — sequential await blew up to
      // selected.size × roundtrip-time and made bulk transitions on
      // 20+ rows feel like the page had hung. Promise.allSettled so
      // one bad row doesn't abort the rest.
      const ids = Array.from(selected);
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/admin/inquiries/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || `HTTP ${res.status}`);
            }
            return res;
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        // Surface partial failure so admin doesn't trust the optimistic
        // update. load(true) re-fetches so the rows that didn't update
        // pop back to their real status.
        setLoadError(`${failed} of ${results.length} updates failed. Reloading current state…`);
      }
      setSelected(new Set());
      load(true);
    } finally {
      setBulkBusy(false);
    }
  }

  // Optimistic patch — apply to UI immediately, revert on failure.
  async function patch(id: number, body: Record<string, unknown>) {
    const before = rows.find((r) => r.id === id);
    if (!before) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...(body.status ? { status: body.status as InquiryRow["status"] } : {}) }
          : r
      )
    );
    if (active && active.id === id && body.status) {
      setActive({ ...active, status: body.status as InquiryRow["status"] });
    }
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Note submissions vanishing silently was a real "did I just
        // lose my note?" UX bug — surface via the existing loadError
        // banner. Keep the typed note in the textarea so the rep can
        // retry.
        setLoadError(data.error || `Couldn't save (${res.status}). Your draft is still in the box.`);
        // Revert optimistic UI.
        setRows((prev) => prev.map((r) => (r.id === id ? before : r)));
        if (active && active.id === id) setActive(before);
        return;
      }
      setLoadError(null);
      setNote("");
      // Refresh notes if drawer open
      if (active && active.id === id) loadNotes(id);
      // Background refresh of list to pull updated row + new SLA-induced note rows.
      load(true);
    } catch {
      setLoadError("Network error. Your draft is still in the box.");
      setRows((prev) => prev.map((r) => (r.id === id ? before : r)));
      if (active && active.id === id) setActive(before);
    }
  }

  const stats = {
    total: filtered.length,
    overdue: filtered.filter((r) => r.status === "new" && r.slaDueAt && new Date(r.slaDueAt) < new Date()).length,
    new: filtered.filter((r) => r.status === "new").length,
    inProgress: filtered.filter((r) => ["contacted", "qualifying"].includes(r.status)).length,
  };

  const csvHref = `/api/admin/inquiries?${(() => {
    const p = buildQs();
    p.set("format", "csv");
    return p.toString();
  })()}`;

  if (loading) return <div className="p-8"><SkeletonRows count={6} /></div>;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Lead pipeline</p>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            Inquiries
          </h1>
          <p className="text-text-muted text-sm mt-1">30-min response SLA · auto-refresh every 30s</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="bg-off-white hover:bg-border text-navy text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            aria-label="Refresh inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <a
            href={csvHref}
            className="bg-navy hover:bg-navy/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
        </div>
      </div>

      {/* Soft error banner — shown when fetch failed but cached rows
          are still onscreen. Disappears on next successful load. */}
      {loadError && (
        <div role="alert" className="mb-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs">
          {loadError}
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Total" value={stats.total} tone="navy" />
        <Stat label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? "red" : "navy"} />
        <Stat label="New" value={stats.new} tone="red" />
        <Stat label="In progress" value={stats.inProgress} tone="amber" />
      </div>

      {/* Filters + search */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, sport…"
            aria-label="Search inquiries by name, phone, email, or sport"
            className="w-full bg-white border border-border rounded-lg pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter inquiries by status" className="bg-off-white border border-border rounded-lg px-3 py-1.5 text-sm">
          <option value="open">Open</option>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualifying">Qualifying</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)} aria-label="Filter inquiries by kind" className="bg-off-white border border-border rounded-lg px-3 py-1.5 text-sm">
          <option value="">All kinds</option>
          {INQUIRY_CONFIGS.filter((c) => c.kind !== "general").map((c) => <option key={c.kind} value={c.kind}>{c.title}</option>)}
        </select>
        {(search || filterStatus !== "open" || filterKind) && (
          <button
            type="button"
            onClick={() => { setSearch(""); setFilterStatus("open"); setFilterKind(""); }}
            className="text-xs text-text-muted hover:text-navy underline whitespace-nowrap"
          >
            Reset
          </button>
        )}
      </div>
      <p
        className="text-text-muted text-xs mb-3"
        aria-live="polite"
        aria-atomic="true"
      >
        Showing {filtered.length} {filtered.length === 1 ? "inquiry" : "inquiries"}
      </p>

      {/* Bulk action bar — visible only when selection > 0 */}
      {selected.size > 0 && (
        <div role="region" aria-label="Bulk actions" className="bg-navy text-white rounded-xl px-4 py-2.5 mb-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider">
            {selected.size} selected
          </span>
          <button onClick={() => bulkStatus("contacted")} disabled={bulkBusy} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-amber-50 text-amber-700 disabled:opacity-50">
            Mark contacted
          </button>
          <button onClick={() => bulkStatus("qualifying")} disabled={bulkBusy} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-blue-50 text-blue-700 disabled:opacity-50">
            Qualifying
          </button>
          <button onClick={() => bulkStatus("won")} disabled={bulkBusy} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 disabled:opacity-50">
            Won
          </button>
          <button onClick={() => bulkStatus("lost")} disabled={bulkBusy} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-text-muted/20 disabled:opacity-50">
            Lost
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-white/70 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {/* Keyboard help — single-line, always-visible cue. */}
      <p className="text-[10px] text-text-muted mb-2 hidden sm:block">
        Keyboard: <kbd className="bg-off-white border border-border rounded px-1">j</kbd>/<kbd className="bg-off-white border border-border rounded px-1">k</kbd> nav · <kbd className="bg-off-white border border-border rounded px-1">Enter</kbd> open · <kbd className="bg-off-white border border-border rounded px-1">x</kbd> select · <kbd className="bg-off-white border border-border rounded px-1">Esc</kbd> close
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <Inbox className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-navy font-bold">{search ? "No matches." : "All clear."}</p>
          <p className="text-text-muted text-sm mt-1">
            {search ? "Try a different search term." : "No inquiries match these filters."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Select-all row */}
          <button
            onClick={toggleSelectAll}
            className="w-full px-4 py-2 flex items-center gap-2 text-xs text-text-muted hover:bg-off-white border-b border-border focus-visible:outline-none focus-visible:bg-off-white"
            aria-label={selected.size === filtered.length ? "Deselect all" : "Select all visible"}
          >
            {selected.size === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-navy" />
            ) : (
              <SquareIcon className="w-3.5 h-3.5" />
            )}
            <span>{selected.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all visible"}</span>
          </button>
          <ul className="divide-y divide-border">
            {filtered.map((r, i) => {
              const overdue = r.status === "new" && r.slaDueAt && new Date(r.slaDueAt) < new Date();
              const isSelected = selected.has(r.id);
              const isCursor = i === cursor;
              return (
                <li
                  key={r.id}
                  className={`flex items-center gap-2 ${isCursor ? "bg-off-white ring-1 ring-inset ring-navy/30" : ""}`}
                >
                  <button
                    onClick={() => toggleSelect(r.id)}
                    aria-label={isSelected ? "Deselect" : "Select"}
                    className="px-3 py-3 flex-shrink-0 hover:bg-off-white"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-navy" />
                    ) : (
                      <SquareIcon className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <button
                    onClick={() => openDetail(r)}
                    className="flex-1 text-left px-2 py-3 hover:bg-off-white flex items-center gap-3 flex-wrap focus-visible:outline-none focus-visible:bg-off-white"
                  >
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${STATUS_TONES[r.status]}`}>
                      {r.status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-navy font-semibold truncate">
                        {r.name}
                        {/* Click kind label → filter to just that kind.
                            Same pattern as audit-log click-to-filter:
                            span with role=button + stopPropagation so
                            the row's outer button (open detail) doesn't
                            also fire. */}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFilterKind(r.kind === filterKind ? "" : r.kind);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              setFilterKind(r.kind === filterKind ? "" : r.kind);
                            }
                          }}
                          className="text-text-muted text-xs ml-2 font-normal hover:text-navy hover:underline cursor-pointer focus-visible:outline-none focus-visible:underline"
                          title="Filter to this kind"
                        >
                          {getKindLabel(r.kind)}
                        </span>
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {r.phone || r.email || "—"}
                        {r.sports && (
                          <>
                            {" · "}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSearch(r.sports || "");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSearch(r.sports || "");
                                }
                              }}
                              className="hover:text-navy hover:underline cursor-pointer focus-visible:outline-none focus-visible:underline"
                              title="Search this sport"
                            >
                              {r.sports}
                            </span>
                          </>
                        )}
                        {r.source && (
                          <>
                            {" · "}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSearch(r.source || "");
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSearch(r.source || "");
                                }
                              }}
                              className="hover:text-navy hover:underline cursor-pointer focus-visible:outline-none focus-visible:underline"
                              title="Search this source"
                            >
                              {r.source}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    {overdue && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red bg-red/5 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" /> overdue
                      </span>
                    )}
                    <span className="text-[10px] text-text-muted flex items-center gap-1 pr-2">
                      <Clock className="w-3 h-3" /> {fmtTime(r.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Detail drawer */}
      {active && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Inquiry detail: ${active.name}`}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-text-muted text-[10px] uppercase tracking-wider">{getKindLabel(active.kind)}</p>
                <p className="text-navy font-bold text-lg">{active.name}</p>
              </div>
              <button onClick={() => setActive(null)} aria-label="Close detail"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {active.phone && (
                  <a href={`tel:${active.phone}`} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <Phone className="w-3.5 h-3.5" /> {active.phone}
                  </a>
                )}
                {active.email && (
                  <a href={`mailto:${active.email}`} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <Mail className="w-3.5 h-3.5" /> {active.email}
                  </a>
                )}
                {active.phone && (
                  <a href={`sms:${active.phone}`} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                    <MessageSquare className="w-3.5 h-3.5" /> Text
                  </a>
                )}
              </div>
              {active.message && (
                <div className="bg-off-white rounded-lg p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-1">Message</p>
                  <p className="text-sm text-navy whitespace-pre-wrap">{active.message}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => patch(active.id, { status: "contacted" })} className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Mark contacted
                </button>
                <button onClick={() => patch(active.id, { status: "qualifying" })} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Qualifying
                </button>
                <button onClick={() => patch(active.id, { status: "won" })} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Won 🎉
                </button>
                <button onClick={() => patch(active.id, { status: "lost" })} className="bg-text-muted/10 hover:bg-text-muted/20 text-text-muted font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                  Lost
                </button>
              </div>
              {/* Re-open path: rep mis-clicked Won/Lost (or the lead
                  came back). Without this they had to edit the DB. */}
              {(active.status === "won" || active.status === "lost") && (
                <button
                  onClick={() => patch(active.id, { status: "new" })}
                  className="w-full bg-navy hover:bg-navy/90 text-white font-bold uppercase tracking-wider text-xs py-2 rounded-lg"
                >
                  ↺ Re-open as new
                </button>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (timeline entry)…"
                rows={2}
                className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => note && patch(active.id, { note })} disabled={!note} className="w-full bg-navy hover:bg-navy/90 disabled:opacity-50 text-white font-bold uppercase tracking-wider text-xs py-2 rounded-lg">
                Add note
              </button>

              {/* Notes timeline */}
              {activeNotes.length > 0 && (
                <div className="border-t border-border pt-3 mt-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-2">Timeline</p>
                  <ol className="space-y-2">
                    {activeNotes.map((n) => (
                      <li key={n.id} className="flex gap-2 text-xs">
                        <span className="text-text-muted text-[10px] uppercase tracking-wider font-bold whitespace-nowrap pt-0.5">
                          {NOTE_KIND_LABELS[n.kind || "note"] || "Note"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-navy">{n.body}</p>
                          <p className="text-text-muted text-[10px] mt-0.5">
                            {new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            {n.authorName ? ` · ${n.authorName}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "navy" | "red" | "amber" | "emerald" }) {
  const t = tone === "red" ? "text-red" : tone === "amber" ? "text-amber-700" : tone === "emerald" ? "text-emerald-700" : "text-navy";
  return (
    <div className="bg-white border border-border rounded-xl p-3 text-center">
      <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-2xl font-bold font-heading ${t} mt-1`}>{value}</p>
    </div>
  );
}
