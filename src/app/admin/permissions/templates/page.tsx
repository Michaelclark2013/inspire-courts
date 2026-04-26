"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Plus,
  X,
  Trash2,
  Save,
  Calendar,
  Edit3,
  ShieldCheck,
} from "lucide-react";
import { SkeletonRows } from "@/components/ui/SkeletonCard";

type PageEntry = { page: string; granted: boolean };

type Template = {
  id: number;
  name: string;
  description: string | null;
  pagesJson: string;
  defaultDurationDays: number | null;
  createdAt: string;
};

type ParsedTemplate = Template & { pages: PageEntry[] };

// Admin page list — mirrors AdminPage in lib/permissions. Duplicated
// here so this page doesn't import the whole module.
const PAGE_GROUPS: Array<{ heading: string; keys: string[] }> = [
  { heading: "Overview", keys: ["overview", "search", "health"] },
  { heading: "Events", keys: ["tournaments", "teams", "players", "programs"] },
  { heading: "Game Day", keys: ["score_entry", "scores", "checkin"] },
  { heading: "Staff", keys: ["roster", "staff_refs", "timeclock", "shifts", "payroll", "certifications", "time_off", "approvals"] },
  { heading: "Members + Revenue", keys: ["members", "revenue", "leads", "prospects", "sponsors"] },
  { heading: "Facility", keys: ["resources", "equipment", "maintenance", "schools"] },
  { heading: "Content & Comms", keys: ["announcements", "content", "files"] },
  { heading: "Admin", keys: ["users", "audit_log", "analytics", "contacts", "portal"] },
  { heading: "Personal", keys: ["my_schedule", "my_history"] },
];

function parseTemplate(t: Template): ParsedTemplate {
  let pages: PageEntry[] = [];
  try { pages = JSON.parse(t.pagesJson || "[]"); }
  catch { pages = []; }
  return { ...t, pages };
}

export default function TemplatesPage() {
  const [rows, setRows] = useState<ParsedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<ParsedTemplate | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/permissions/templates");
      if (!res.ok) throw new Error(`load ${res.status}`);
      const raw: Template[] = await res.json();
      setRows(raw.map(parseTemplate));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(t: ParsedTemplate) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    await fetch(`/api/admin/permissions/templates/${t.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin/permissions" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Permissions
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Reusable bundles</p>
            <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
              <Bookmark className="w-8 h-8 text-red" />
              Permission Templates
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Save a set of page grants/revokes as a template, then apply it to any user (or group of users) in one click.
            </p>
          </div>
          <button
            onClick={() => { setEditing(null); setComposerOpen(true); }}
            className="bg-red hover:bg-red-hover rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start shadow-lg shadow-red/30"
          >
            <Plus className="w-3.5 h-3.5" /> New Template
          </button>
        </div>
      </section>

      {loading ? (
        <SkeletonRows count={4} />
      ) : error ? (
        <div className="bg-red/10 border border-red/20 rounded-2xl p-6 text-red text-sm">{error}</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <ShieldCheck className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-bold mb-1">No templates yet</p>
          <p className="text-text-muted text-sm mb-4">
            Save a bundle like &ldquo;Tournament scorekeeper&rdquo; or &ldquo;Fill-in manager&rdquo; so you can apply it to anyone in seconds.
          </p>
          <button
            onClick={() => { setEditing(null); setComposerOpen(true); }}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Create first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((t) => {
            const grants = t.pages.filter((p) => p.granted).length;
            const revokes = t.pages.filter((p) => !p.granted).length;
            return (
              <article key={t.id} className="bg-white border border-border rounded-2xl shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-navy font-bold text-base truncate">{t.name}</h3>
                    {t.description && <p className="text-text-muted text-xs mt-0.5">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditing(t); setComposerOpen(true); }}
                      aria-label="Edit"
                      className="p-2 rounded-lg text-text-muted hover:bg-off-white hover:text-navy"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(t)}
                      aria-label="Delete"
                      className="p-2 rounded-lg text-text-muted hover:bg-red/5 hover:text-red"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {grants > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      +{grants} grant{grants === 1 ? "" : "s"}
                    </span>
                  )}
                  {revokes > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red/10 text-red">
                      −{revokes} revoke{revokes === 1 ? "" : "s"}
                    </span>
                  )}
                  {t.defaultDurationDays && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expires in {t.defaultDurationDays}d
                    </span>
                  )}
                </div>

                <ApplyButton templateId={t.id} templateName={t.name} onDone={load} />
              </article>
            );
          })}
        </div>
      )}

      {composerOpen && (
        <Composer
          existing={editing}
          pageGroups={PAGE_GROUPS}
          onClose={() => { setComposerOpen(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ApplyButton({
  templateId,
  templateName,
  onDone,
}: {
  templateId: number;
  templateName: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-auto bg-navy hover:bg-navy/90 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full"
      >
        Apply to users
      </button>
      {open && (
        <ApplyDialog
          templateId={templateId}
          templateName={templateName}
          onClose={() => setOpen(false)}
          onApplied={() => { setOpen(false); onDone(); }}
        />
      )}
    </>
  );
}

function ApplyDialog({
  templateId,
  templateName,
  onClose,
  onApplied,
}: {
  templateId: number;
  templateName: string;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string; role: string }>>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [overrideDays, setOverrideDays] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/permissions")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  }, []);

  const filtered = users.filter((u) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  async function apply() {
    if (selected.size === 0) {
      setError("Pick at least one user");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const overrideDurationDays = overrideDays.trim() ? Number(overrideDays) : null;
      const res = await fetch(`/api/admin/permissions/templates/${templateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selected),
          overrideDurationDays,
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
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-navy font-bold text-lg font-heading">Apply &ldquo;{templateName}&rdquo;</h2>
          <button onClick={onClose} aria-label="Close" className="text-text-muted hover:text-navy p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
          />
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">
              Expires in (days) <span className="text-text-muted font-normal normal-case">(optional)</span>
            </label>
            <input
              type="number"
              value={overrideDays}
              onChange={(e) => setOverrideDays(e.target.value)}
              placeholder="Use template default"
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
            />
          </div>
          <ul className="divide-y divide-border max-h-72 overflow-y-auto border border-border rounded-xl">
            {filtered.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(u.id)) next.delete(u.id);
                    else next.add(u.id);
                    return next;
                  })}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selected.has(u.id) ? "bg-red/5" : "hover:bg-off-white"
                  }`}
                >
                  <input type="checkbox" checked={selected.has(u.id)} readOnly className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-navy font-semibold text-sm">{u.name}</p>
                    <p className="text-text-muted text-xs">{u.email} · {u.role}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 text-navy font-semibold text-sm py-2.5 rounded-xl border border-border hover:bg-off-white">Cancel</button>
          <button
            onClick={apply}
            disabled={busy || selected.size === 0}
            className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider"
          >
            {busy ? "Applying…" : `Apply to ${selected.size}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Composer({
  existing,
  pageGroups,
  onClose,
}: {
  existing: ParsedTemplate | null;
  pageGroups: Array<{ heading: string; keys: string[] }>;
  onClose: () => void;
}) {
  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [defaultDurationDays, setDefaultDurationDays] = useState<string>(
    existing?.defaultDurationDays ? String(existing.defaultDurationDays) : ""
  );
  const [pages, setPages] = useState<Map<string, boolean>>(
    new Map((existing?.pages || []).map((p) => [p.page, p.granted]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cycle(page: string) {
    setPages((prev) => {
      const next = new Map(prev);
      const cur = next.get(page);
      if (cur === undefined) next.set(page, true);        // off → grant
      else if (cur === true) next.set(page, false);       // grant → revoke
      else next.delete(page);                             // revoke → off
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const pagesArr = Array.from(pages.entries()).map(([page, granted]) => ({ page, granted }));
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        pages: pagesArr,
        defaultDurationDays: defaultDurationDays.trim() ? Number(defaultDurationDays) : null,
      };
      const res = await fetch(
        existing ? `/api/admin/permissions/templates/${existing.id}` : "/api/admin/permissions/templates",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form onSubmit={save} className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-navy font-bold text-lg font-heading">
            {existing ? "Edit Template" : "New Template"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-navy p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60" placeholder="Tournament Scorekeeper" />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60" placeholder="Scorekeepers get at tournament weekends" />
          </div>
          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Default expiry (days)</label>
            <input type="number" value={defaultDurationDays} onChange={(e) => setDefaultDurationDays(e.target.value)} className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60" placeholder="leave empty for permanent" />
          </div>
          <div>
            <p className="text-navy text-xs font-bold uppercase tracking-wider mb-2">
              Pages — tap to cycle Off → Grant → Revoke
            </p>
            <div className="space-y-3 max-h-64 overflow-y-auto bg-off-white border border-border rounded-xl p-3">
              {pageGroups.map((group) => (
                <div key={group.heading}>
                  <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1.5">{group.heading}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.keys.map((key) => {
                      const v = pages.get(key);
                      const cls = v === true
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : v === false
                        ? "bg-red/10 text-red border-red/20"
                        : "bg-white text-text-muted border-border";
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => cycle(key)}
                          className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border ${cls}`}
                        >
                          {v === true ? "+ " : v === false ? "− " : ""}{key}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 text-navy font-semibold text-sm py-2.5 rounded-xl border border-border hover:bg-off-white">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
