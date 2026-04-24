"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Truck,
  ArrowDownToLine,
  Calendar,
  Clock,
  Trophy,
  ArrowUpRight,
} from "lucide-react";

type Today = {
  rentalsOut: Array<{ id: number; renterName: string | null; endAt: string; vehicleName: string | null }>;
  returnsToday: Array<{ id: number; renterName: string | null; endAt: string; vehicleName: string | null; status: string }>;
  eventsToday: Array<{ id: number; title: string; startAt: string; category: string }>;
  liveShifts: Array<{ id: number; title: string; role: string | null }>;
  gamesToday: Array<{ id: number; homeTeam: string; awayTeam: string; scheduledTime: string | null; court: string | null }>;
};

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch { return iso; }
}

export default function TodayCard() {
  const [data, setData] = useState<Today | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-refresh every 60s for a live feel.
    let active = true;
    const load = () => {
      fetch("/api/admin/today")
        .then((r) => r.ok ? r.json() : null)
        .then((d) => active && setData(d))
        .finally(() => active && setLoading(false));
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const totals = data
    ? {
        rentalsOut: data.rentalsOut.length,
        returnsToday: data.returnsToday.length,
        events: data.eventsToday.length,
        shifts: data.liveShifts.length,
        games: data.gamesToday.length,
      }
    : { rentalsOut: 0, returnsToday: 0, events: 0, shifts: 0, games: 0 };

  return (
    <section aria-label="Today at Inspire" className="mb-8">
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Today at Inspire</h2>
          </div>
          <span className="text-text-muted text-[10px] uppercase tracking-widest">Auto-refresh 60s</span>
        </div>

        {/* Count strip */}
        <div className="grid grid-cols-5 gap-2 px-5 py-4 bg-off-white border-b border-border">
          <Stat n={totals.rentalsOut} label="Rented Out" tone={totals.rentalsOut ? "red" : undefined} />
          <Stat n={totals.returnsToday} label="Returns" tone={totals.returnsToday ? "amber" : undefined} />
          <Stat n={totals.events} label="Gym Events" />
          <Stat n={totals.shifts} label="On Shift" />
          <Stat n={totals.games} label="Games" />
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <Bucket title="Out on the Road" icon={<Truck className="w-4 h-4" />} items={
            loading ? null :
            (data?.rentalsOut || []).slice(0, 4).map((r) => ({
              key: `o-${r.id}`,
              href: `/admin/rentals/${r.id}`,
              primary: r.renterName || "Internal",
              secondary: `${r.vehicleName || "—"} · due ${fmtTime(r.endAt)}`,
            }))
          } empty="No active rentals." />

          <Bucket title="Returning Today" icon={<ArrowDownToLine className="w-4 h-4" />} items={
            loading ? null :
            (data?.returnsToday || []).slice(0, 4).map((r) => ({
              key: `r-${r.id}`,
              href: `/admin/rentals/${r.id}`,
              primary: r.renterName || "Internal",
              secondary: `${r.vehicleName || "—"} · ${fmtTime(r.endAt)}`,
            }))
          } empty="Nothing returning today." />

          <Bucket title="Gym Events" icon={<Calendar className="w-4 h-4" />} items={
            loading ? null :
            (data?.eventsToday || []).slice(0, 4).map((e) => ({
              key: `e-${e.id}`,
              href: `/admin/gym-schedule`,
              primary: e.title,
              secondary: `${fmtTime(e.startAt)} · ${e.category}`,
            }))
          } empty="No events scheduled." />

          <Bucket title="Games & Shifts" icon={<Trophy className="w-4 h-4" />} items={
            loading ? null :
            [
              ...(data?.gamesToday || []).slice(0, 2).map((g) => ({
                key: `g-${g.id}`,
                href: `/admin/scores`,
                primary: `${g.homeTeam} vs ${g.awayTeam}`,
                secondary: `${g.scheduledTime ? fmtTime(g.scheduledTime) : "TBD"}${g.court ? ` · ${g.court}` : ""}`,
              })),
              ...(data?.liveShifts || []).slice(0, 2).map((s) => ({
                key: `s-${s.id}`,
                href: `/admin/shifts`,
                primary: s.title,
                secondary: `Live shift${s.role ? ` · ${s.role}` : ""}`,
              })),
            ]
          } empty="No live shifts or games." />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone?: "red" | "amber" }) {
  const toneClass = tone === "red" ? "text-red" : tone === "amber" ? "text-amber-600" : "text-navy";
  return (
    <div className="text-center">
      <p className={`font-heading font-bold text-2xl tabular-nums ${toneClass}`}>{n}</p>
      <p className="text-text-muted text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function Bucket({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ key: string; href: string; primary: string; secondary: string }> | null;
  empty: string;
}) {
  return (
    <div className="px-5 py-4">
      <h3 className="text-navy font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
        <span className="text-red">{icon}</span> {title}
      </h3>
      {items === null ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-text-muted text-sm">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className="flex items-center gap-2 group">
                <Clock className="w-3 h-3 text-text-muted flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-navy text-sm font-semibold truncate group-hover:text-red transition-colors">{i.primary}</p>
                  <p className="text-text-muted text-xs truncate">{i.secondary}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
