"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
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

const CATEGORY_STYLES: Record<GymEvent["category"], string> = {
  practice: "bg-blue-50 text-blue-700",
  training: "bg-cyan-50 text-cyan-700",
  rental: "bg-emerald-50 text-emerald-700",
  maintenance: "bg-amber-50 text-amber-700",
  meeting: "bg-purple-50 text-purple-700",
  closed: "bg-red/10 text-red",
  other: "bg-off-white text-text-muted",
};

function fmtEvent(e: GymEvent): string {
  try {
    const s = new Date(e.startAt);
    const en = new Date(e.endAt);
    if (e.allDay) {
      return `${s.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · All day`;
    }
    const dateFmt: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    const timeFmt: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };
    return `${s.toLocaleDateString([], dateFmt)} · ${s.toLocaleTimeString([], timeFmt)}–${en.toLocaleTimeString([], timeFmt)}`;
  } catch {
    return e.startAt;
  }
}

export default function GymScheduleCard() {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only show upcoming (next 14 days).
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    fetch(`/api/admin/gym-events?to=${encodeURIComponent(to)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`events ${r.status}`);
        return r.json();
      })
      .then((d: GymEvent[]) => {
        const now = Date.now();
        setEvents(
          (Array.isArray(d) ? d : []).filter(
            (e) => new Date(e.endAt).getTime() >= now
          )
        );
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // Today vs later grouping
  const todayStr = new Date().toDateString();
  const today = events.filter((e) => new Date(e.startAt).toDateString() === todayStr);
  const later = events.filter((e) => new Date(e.startAt).toDateString() !== todayStr).slice(0, 5);

  return (
    <section aria-label="Gym schedule" className="mb-8">
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
              Gym Schedule
            </h2>
          </div>
          <Link
            href="/admin/gym-schedule"
            className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1"
          >
            <Plus className="w-3 h-3" aria-hidden="true" /> Add · Manage
          </Link>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="py-6 text-center text-text-muted text-sm">Loading…</div>
          ) : error ? (
            <div className="py-4 text-red text-sm">{error}</div>
          ) : events.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-text-muted text-sm mb-3">
                Nothing scheduled. Add practices, rentals, and maintenance windows.
              </p>
              <Link
                href="/admin/gym-schedule"
                className="inline-flex items-center gap-1 text-red text-sm font-semibold hover:text-red-hover"
              >
                Add first event <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              {today.length > 0 && (
                <>
                  <p className="text-navy text-xs font-bold uppercase tracking-widest mb-2">Today</p>
                  <div className="space-y-2 mb-4">
                    {today.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </div>
                </>
              )}

              {later.length > 0 && (
                <>
                  <p className="text-navy text-xs font-bold uppercase tracking-widest mb-2">Upcoming</p>
                  <div className="space-y-2">
                    {later.map((e) => (
                      <EventRow key={e.id} event={e} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function EventRow({ event: e }: { event: GymEvent }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span
        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${CATEGORY_STYLES[e.category]}`}
      >
        {e.category}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-navy font-semibold text-sm truncate">{e.title}</p>
        <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" /> {fmtEvent(e)}
        </p>
        {e.location && (
          <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" /> {e.location}
          </p>
        )}
      </div>
    </div>
  );
}
