"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Loader2,
  Trash2,
  X,
  Users,
  Clock,
} from "lucide-react";

type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  expiresAt: string | null;
  createdAt: string;
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Everyone",
  coaches: "Coaches Only",
  parents: "Parents Only",
};

const AUDIENCE_STYLES: Record<string, string> = {
  all: "bg-white/10 text-navy/60",
  coaches: "bg-emerald-500/20 text-emerald-400",
  parents: "bg-cyan-500/20 text-cyan-400",
};

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "all",
    expiresAt: "",
  });

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) setList(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          audience: form.audience,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      if (res.ok) {
        setForm({ title: "", body: "", audience: "all", expiresAt: "" });
        setShowForm(false);
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to publish announcement");
      }
    } catch {
      setSaveError("Network error — please try again");
    }
    setSaving(false);
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to delete announcement");
        return;
      }
    } catch {
      setSaveError("Network error — could not delete");
      return;
    }
    fetchAll();
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Announcements
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Send announcements to coaches, parents, or everyone
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New"}
        </button>
      </div>

      {/* Error banner visible when form is closed */}
      {!showForm && saveError && (
        <div className="bg-red/10 border border-red/30 text-red text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between" role="alert" aria-live="assertive">
          <span>{saveError}</span>
          <button onClick={() => setSaveError("")} className="text-red hover:text-navy ml-4" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-white/10 rounded-xl p-4 md:p-6 mb-4 md:mb-8">
          <form onSubmit={handleCreate} className="space-y-4">
            {saveError && (
              <div className="bg-red/10 border border-red/30 text-red text-sm rounded-lg px-4 py-3 flex items-center justify-between">
                <span>{saveError}</span>
                <button type="button" onClick={() => setSaveError("")} className="text-red hover:text-navy ml-4">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div>
              <label className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red placeholder:text-navy/25"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Message *
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={4}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red placeholder:text-navy/25 resize-none"
                placeholder="Write your announcement..."
              />
            </div>
            <div className="flex items-center justify-between text-xs text-navy/30 -mt-2 mb-2">
              <span>{form.body.length} characters</span>
              {form.body.length > 280 && <span className="text-amber-400">Long message — consider shortening</span>}
            </div>

            {/* Preview */}
            {form.title && (
              <div className="bg-navy/50 border border-white/5 rounded-lg p-4 mb-4">
                <p className="text-navy/30 text-[10px] font-bold uppercase tracking-wider mb-2">Preview</p>
                <p className="text-navy font-bold text-sm">{form.title}</p>
                {form.body && <p className="text-navy/60 text-sm mt-1 whitespace-pre-wrap">{form.body}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Audience
                </label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red cursor-pointer"
                >
                  <option value="all">Everyone</option>
                  <option value="coaches">Coaches Only</option>
                  <option value="parents">Parents Only</option>
                </select>
              </div>
              <div>
                <label className="block text-navy/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Expires (optional)
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  min={new Date().toISOString().split("T")[0]}
                  title="Announcement will be hidden after this date"
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-navy text-sm focus:outline-none focus:border-red"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              Publish
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 md:py-16 text-navy/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading announcements...
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-8 md:py-14 text-navy/40">
          <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm mb-4">No announcements yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            <Plus className="w-4 h-4" /> Create First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <div
              key={a.id}
              className="bg-card border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-navy font-bold text-sm">{a.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${AUDIENCE_STYLES[a.audience] || AUDIENCE_STYLES.all}`}
                    >
                      {AUDIENCE_LABELS[a.audience] || a.audience}
                    </span>
                  </div>
                  <p className="text-navy/60 text-sm whitespace-pre-wrap">
                    {a.body}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-navy/30 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(a.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {a.expiresAt && (
                      <span>
                        Expires{" "}
                        {new Date(a.expiresAt + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(a.id, a.title)}
                  className="text-navy/20 hover:text-red transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
