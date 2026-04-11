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
  all: "bg-white/10 text-white/60",
  coaches: "bg-emerald-500/20 text-emerald-400",
  parents: "bg-cyan-500/20 text-cyan-400",
};

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Announcements
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Send announcements to coaches, parents, or everyone
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-8">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                placeholder="Announcement title"
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Message *
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={4}
                className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25 resize-none"
                placeholder="Write your announcement..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Audience
                </label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red cursor-pointer"
                >
                  <option value="all">Everyone</option>
                  <option value="coaches">Coaches Only</option>
                  <option value="parents">Parents Only</option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Expires (optional)
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red"
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
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No announcements yet.</p>
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
                    <h3 className="text-white font-bold text-sm">{a.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${AUDIENCE_STYLES[a.audience] || AUDIENCE_STYLES.all}`}
                    >
                      {AUDIENCE_LABELS[a.audience] || a.audience}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm whitespace-pre-wrap">
                    {a.body}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-white/30 text-xs">
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
                  onClick={() => handleDelete(a.id)}
                  className="text-white/20 hover:text-red transition-colors flex-shrink-0"
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
