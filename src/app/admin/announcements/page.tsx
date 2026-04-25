"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Pin,
  PinOff,
  Bell,
  Calendar,
  Trash2,
  Edit3,
  Clock,
  Eye,
  ArrowLeft,
  Search,
  Filter,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react";

type Priority = "normal" | "important" | "urgent";
type Category =
  | "general" | "tournament" | "schedule" | "maintenance"
  | "safety" | "weather" | "celebration";

type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  priority: Priority;
  category: Category;
  pinned: boolean;
  scheduledPublishAt: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  pushSent: boolean;
  pushSentAt: string | null;
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

const PRIORITY_STYLES: Record<Priority, string> = {
  normal: "bg-off-white text-text-muted",
  important: "bg-amber-50 text-amber-700",
  urgent: "bg-red/10 text-red",
};

const CATEGORY_STYLES: Record<Category, string> = {
  general: "bg-off-white text-text-muted",
  tournament: "bg-red/10 text-red",
  schedule: "bg-blue-50 text-blue-700",
  maintenance: "bg-amber-50 text-amber-700",
  safety: "bg-emerald-50 text-emerald-700",
  weather: "bg-cyan-50 text-cyan-700",
  celebration: "bg-purple-50 text-purple-700",
};

const AUDIENCES = ["all", "coaches", "parents", "staff", "ref"];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString([], {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  } catch { return iso; }
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AnnouncementsAdminPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error(`load ${res.status}`);
      setItems(await res.json());
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = Date.now();
  const grouped = useMemo(() => {
    const s = search.trim().toLowerCase();
    const matches = items.filter((a) => {
      if (!s) return true;
      return a.title.toLowerCase().includes(s) || a.body.toLowerCase().includes(s);
    });
    return {
      active: matches.filter((a) => {
        const scheduled = a.scheduledPublishAt && new Date(a.scheduledPublishAt).getTime() > now;
        const expired = a.expiresAt && new Date(a.expiresAt).getTime() < now;
        return !scheduled && !expired;
      }),
      scheduled: matches.filter(
        (a) => a.scheduledPublishAt && new Date(a.scheduledPublishAt).getTime() > now
      ),
      expired: matches.filter(
        (a) => a.expiresAt && new Date(a.expiresAt).getTime() < now
      ),
      pinned: matches.filter((a) => a.pinned),
      urgent: matches.filter((a) => a.priority === "urgent"),
    };
  }, [items, search, now]);

  const visible = (grouped as Record<string, Announcement[]>)[filter] || grouped.active;

  async function togglePin(a: Announcement) {
    await fetch("/api/admin/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, title: a.title, body: a.body, pinned: !a.pinned }),
    });
    load();
  }

  async function remove(a: Announcement) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await fetch(`/api/admin/announcements?id=${a.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Broadcast</p>
              <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
                <Megaphone className="w-8 h-8 text-red" />
                Announcements
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Priority, category, pinning, scheduling, hero image, CTA button — all in one composer.
              </p>
            </div>
            <button
              onClick={() => { setEditing(null); setComposerOpen(true); }}
              className="bg-red hover:bg-red-hover rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start shadow-lg shadow-red/30"
            >
              <Plus className="w-3.5 h-3.5" /> New Post
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <HeroStat label="Active" value={grouped.active.length} />
            <HeroStat label="Scheduled" value={grouped.scheduled.length} tone="amber" />
            <HeroStat label="Urgent" value={grouped.urgent.length} tone={grouped.urgent.length ? "red" : undefined} />
            <HeroStat label="Pinned" value={grouped.pinned.length} />
            <HeroStat label="Expired" value={grouped.expired.length} />
          </div>
        </div>
      </section>

      {/* Filter + Search */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or body"
            className="w-full bg-off-white border border-border rounded-xl pl-9 pr-4 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
          {[
            { k: "active", l: "Active" },
            { k: "scheduled", l: "Scheduled" },
            { k: "pinned", l: "Pinned" },
            { k: "urgent", l: "Urgent" },
            { k: "expired", l: "Expired" },
          ].map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                filter === k ? "bg-navy text-white" : "bg-off-white text-text-muted hover:bg-border"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center text-text-muted">Loading…</div>
      ) : error ? (
        <div className="bg-red/10 border border-red/20 rounded-2xl p-6 text-red text-sm">{error}</div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-10 text-center">
          <Megaphone className="w-10 h-10 text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-navy font-bold mb-1">
            {items.length === 0 ? "No announcements yet" : `No ${filter} announcements`}
          </p>
          {items.length === 0 && (
            <button onClick={() => { setEditing(null); setComposerOpen(true); }} className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider mt-2">
              <Plus className="w-3.5 h-3.5" /> Write first post
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((a) => (
            <article
              key={a.id}
              className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
                a.priority === "urgent" ? "border-red/40" : "border-border"
              }`}
            >
              {a.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.imageUrl} alt="" className="w-full h-32 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {a.pinned && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy text-white flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_STYLES[a.priority]}`}>
                    {a.priority}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${CATEGORY_STYLES[a.category]}`}>
                    {a.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-off-white text-text-muted">
                    {a.audience}
                  </span>
                </div>
                <h3 className="text-navy font-bold text-lg leading-tight mb-1">{a.title}</h3>
                <p className="text-text-muted text-sm line-clamp-3 whitespace-pre-wrap mb-3">{a.body}</p>

                {a.ctaLabel && a.ctaUrl && (
                  <a href={a.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-3">
                    {a.ctaLabel} →
                  </a>
                )}

                <div className="flex items-center gap-3 text-text-muted text-[11px] flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmtDate(a.createdAt)}
                  </span>
                  {a.scheduledPublishAt && new Date(a.scheduledPublishAt).getTime() > now && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Calendar className="w-3 h-3" /> Publishes {fmtDate(a.scheduledPublishAt)}
                    </span>
                  )}
                  {a.expiresAt && (
                    <span className="flex items-center gap-1">Expires {fmtDate(a.expiresAt)}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {a.viewCount}
                  </span>
                  {a.pushSent && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Bell className="w-3 h-3" /> Pushed
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border bg-off-white/40 flex flex-wrap gap-2">
                <button
                  onClick={() => { setEditing(a); setComposerOpen(true); }}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-border text-navy hover:bg-off-white flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => togglePin(a)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-border text-navy hover:bg-off-white flex items-center gap-1"
                >
                  {a.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  {a.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => remove(a)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red/5 border border-red/20 text-red hover:bg-red/10 flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {composerOpen && (
        <Composer
          onClose={() => { setComposerOpen(false); setEditing(null); load(); }}
          existing={editing}
        />
      )}
    </div>
  );
}

function HeroStat({
  label, value, tone,
}: { label: string; value: number; tone?: "red" | "amber" }) {
  const toneClass = tone === "red" ? "text-red" : tone === "amber" ? "text-amber-300" : "text-white";
  return (
    <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
      <p className={`font-heading text-3xl font-bold tabular-nums tracking-tight ${toneClass}`}>{value}</p>
      <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">{label}</p>
    </div>
  );
}

function Composer({
  onClose, existing,
}: { onClose: () => void; existing: Announcement | null }) {
  const [f, setF] = useState({
    title: existing?.title ?? "",
    body: existing?.body ?? "",
    audience: existing?.audience ?? "all",
    priority: existing?.priority ?? ("normal" as Priority),
    category: existing?.category ?? ("general" as Category),
    pinned: existing?.pinned ?? false,
    scheduledPublishAt: existing?.scheduledPublishAt ? toLocalInput(existing.scheduledPublishAt) : "",
    expiresAt: existing?.expiresAt ? toLocalInput(existing.expiresAt) : "",
    ctaLabel: existing?.ctaLabel ?? "",
    ctaUrl: existing?.ctaUrl ?? "",
    imageUrl: existing?.imageUrl ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...(existing ? { id: existing.id } : {}),
        title: f.title.trim(),
        body: f.body.trim(),
        audience: f.audience,
        priority: f.priority,
        category: f.category,
        pinned: f.pinned,
        scheduledPublishAt: f.scheduledPublishAt ? new Date(f.scheduledPublishAt).toISOString() : null,
        expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
        ctaLabel: f.ctaLabel.trim() || null,
        ctaUrl: f.ctaUrl.trim() || null,
        imageUrl: f.imageUrl.trim() || null,
      };
      const res = await fetch("/api/admin/announcements", {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
            {existing ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-navy p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Title *">
            <input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={ipt} placeholder="Tournament bracket released" />
          </Field>
          <Field label="Body *">
            <textarea required value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={4} className={`${ipt} resize-none`} placeholder="Details for the community..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })} className={ipt}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })} className={ipt}>
                <option value="general">General</option>
                <option value="tournament">Tournament</option>
                <option value="schedule">Schedule</option>
                <option value="maintenance">Maintenance</option>
                <option value="safety">Safety</option>
                <option value="weather">Weather</option>
                <option value="celebration">Celebration</option>
              </select>
            </Field>
          </div>

          <Field label="Audience">
            <select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })} className={ipt}>
              {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Schedule Publish At">
              <input type="datetime-local" value={f.scheduledPublishAt} onChange={(e) => setF({ ...f, scheduledPublishAt: e.target.value })} className={ipt} />
            </Field>
            <Field label="Expires At">
              <input type="datetime-local" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className={ipt} />
            </Field>
          </div>

          <Field label="Hero Image URL">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-text-muted flex-shrink-0" />
              <input value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} className={ipt} placeholder="https://..." />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA Button Label">
              <input value={f.ctaLabel} onChange={(e) => setF({ ...f, ctaLabel: e.target.value })} className={ipt} placeholder="View schedule" />
            </Field>
            <Field label="CTA Button URL">
              <input value={f.ctaUrl} onChange={(e) => setF({ ...f, ctaUrl: e.target.value })} className={ipt} placeholder="/schedule" />
            </Field>
          </div>

          <label className="flex items-center gap-2 bg-off-white border border-border rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} className="w-4 h-4" />
            <Pin className="w-4 h-4 text-navy" />
            <span className="text-navy text-sm font-semibold">Pin to top</span>
          </label>

          {error && <div className="bg-red/10 border border-red/20 text-red rounded-xl px-4 py-2.5 text-sm">{error}</div>}
        </div>
        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 text-navy font-semibold text-sm py-2.5 rounded-xl border border-border hover:bg-off-white">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> {busy ? "Saving…" : (existing ? "Update" : "Publish")}
          </button>
        </div>
      </form>
    </div>
  );
}

const ipt = "w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
