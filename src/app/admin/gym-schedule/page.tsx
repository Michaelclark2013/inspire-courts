"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

type GymEvent = {
  id: number;
  title: string;
  category:
    | "practice"
    | "maintenance"
    | "training"
    | "rental"
    | "meeting"
    | "closed"
    | "other";
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  notes: string | null;
};

const CATEGORIES: Array<GymEvent["category"]> = [
  "practice",
  "training",
  "rental",
  "maintenance",
  "meeting",
  "closed",
  "other",
];

const CATEGORY_STYLES: Record<GymEvent["category"], string> = {
  practice: "bg-blue-50 text-blue-700 border-blue-200",
  training: "bg-cyan-50 text-cyan-700 border-cyan-200",
  rental: "bg-emerald-50 text-emerald-700 border-emerald-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  meeting: "bg-purple-50 text-purple-700 border-purple-200",
  closed: "bg-red/10 text-red border-red/20",
  other: "bg-off-white text-text-muted border-border",
};

function fmtRange(startIso: string, endIso: string, allDay: boolean): string {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const dateFmt: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    const timeFmt: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };
    if (allDay) return `${s.toLocaleDateString([], dateFmt)} · All day`;
    const sameDay = s.toDateString() === e.toDateString();
    return sameDay
      ? `${s.toLocaleDateString([], dateFmt)} · ${s.toLocaleTimeString([], timeFmt)}–${e.toLocaleTimeString([], timeFmt)}`
      : `${s.toLocaleString([], { ...dateFmt, ...timeFmt })} → ${e.toLocaleString([], { ...dateFmt, ...timeFmt })}`;
  } catch {
    return `${startIso} → ${endIso}`;
  }
}

function toLocalInput(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GymSchedulePage() {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GymEvent["category"]>("practice");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState(toLocalInput(defaultStart));
  const [endAt, setEndAt] = useState(toLocalInput(defaultEnd));
  const [allDay, setAllDay] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/gym-events");
      if (!res.ok) throw new Error(`load ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gym-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          location: location.trim() || null,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          allDay,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `create ${res.status}`);
      }
      // Reset form
      setTitle("");
      setLocation("");
      setNotes("");
      await load();
    } catch (err) {
      setError((err as Error).message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/admin/gym-events?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`delete ${res.status}`);
      await load();
    } catch (err) {
      setError((err as Error).message || "Failed to delete event");
    }
  }

  // Group by date
  const grouped = events.reduce<Record<string, GymEvent[]>>((acc, e) => {
    const key = new Date(e.startAt).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="p-5 lg:p-8 pb-28 lg:pb-8 max-w-4xl pb-[env(safe-area-inset-bottom)]">
      {/* Breadcrumb */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Admin Dashboard
      </Link>

      <div className="mb-6">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Gym Calendar</p>
        <h1 className="text-navy text-2xl font-bold font-heading flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red" aria-hidden="true" /> Gym Schedule
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Add practices, rentals, maintenance, and closures. Shows on your admin dashboard.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-sm">
        <h2 className="text-navy text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-red" aria-hidden="true" /> Add Event
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. 14U Boys practice"
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
            />
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GymEvent["category"])}
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60 capitalize"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Location / Courts</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Courts 1–3"
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
            />
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Starts</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
            />
          </div>

          <div>
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Ends</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="allDay"
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="allDay" className="text-navy text-sm">All day</label>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-navy text-xs font-bold uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional details"
              className="w-full bg-off-white border border-border rounded-xl px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red/60 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red/10 border border-red/20 text-red text-sm rounded-xl px-4 py-2.5">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider transition-colors"
        >
          {submitting ? "Saving…" : "Add to Calendar"}
        </button>
      </form>

      {/* Upcoming list */}
      <div>
        <h2 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-3 px-1">
          Upcoming Events
        </h2>
        {loading ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-center text-text-muted text-sm">
            Loading…
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-6 text-center">
            <p className="text-text-muted text-sm">No events on the calendar yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([day, evs]) => (
              <div key={day}>
                <p className="text-text-muted text-xs font-semibold mb-2 px-1">
                  {new Date(day).toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <div className="space-y-2">
                  {evs.map((e) => (
                    <div key={e.id} className="bg-white border border-border rounded-2xl p-4 flex items-start gap-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border ${CATEGORY_STYLES[e.category]} flex-shrink-0`}
                      >
                        {e.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-navy font-semibold text-sm">{e.title}</p>
                        <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {fmtRange(e.startAt, e.endAt, e.allDay)}
                        </p>
                        {e.location && (
                          <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" aria-hidden="true" /> {e.location}
                          </p>
                        )}
                        {e.notes && (
                          <p className="text-text-muted text-xs mt-1">{e.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        aria-label="Delete event"
                        className="text-text-muted hover:text-red transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/admin"
        className="mt-6 inline-flex items-center gap-1 text-red text-sm font-semibold hover:text-red-hover"
      >
        Back to dashboard <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
