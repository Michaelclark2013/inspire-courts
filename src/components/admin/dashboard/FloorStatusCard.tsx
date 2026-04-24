"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Radio, LayoutGrid, Clock, ArrowUpRight } from "lucide-react";

type OnClock = {
  userId: number;
  name: string;
  role: string;
  photoUrl: string | null;
  clockInAt: string;
  source: string;
};

type CourtState =
  | { court: string; status: "live"; label: string; gameId: number }
  | { court: string; status: "scheduled"; label: string; at: string | null; gameId: number }
  | { court: string; status: "blocked"; label: string; category: string }
  | { court: string; status: "open"; label: string };

type Payload = { onClock: OnClock[]; courtStatus: CourtState[] };

const COURT_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  live:      { bg: "bg-red/10",        text: "text-red",          border: "border-red/30",        label: "LIVE" },
  scheduled: { bg: "bg-amber-50",      text: "text-amber-700",    border: "border-amber-200",    label: "SCHEDULED" },
  blocked:   { bg: "bg-blue-50",       text: "text-blue-700",     border: "border-blue-200",     label: "BLOCKED" },
  open:      { bg: "bg-emerald-50",    text: "text-emerald-700",  border: "border-emerald-200",  label: "OPEN" },
};

function elapsed(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins - hrs * 60;
  return rem === 0 ? `${hrs}h` : `${hrs}h ${rem}m`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch { return iso; }
}

export default function FloorStatusCard() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/admin/floor-status")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && setData(d))
        .catch(() => alive && setData(null));
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!data) return null;

  return (
    <section aria-label="Floor status" className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Court status board */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-red" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">Court Status</h2>
          </div>
          <Link href="/admin/scores" className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1">
            Scores <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.courtStatus.map((c) => {
            const styles = COURT_STATUS_STYLES[c.status];
            const href =
              c.status === "live" || c.status === "scheduled"
                ? `/admin/scores/enter?game=${c.gameId}`
                : "/admin/gym-schedule";
            return (
              <Link
                key={c.court}
                href={href}
                className={`relative border rounded-xl p-3 ${styles.bg} ${styles.border} hover:shadow-sm active:scale-[0.98] transition-all`}
              >
                {c.status === "live" && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red" />
                  </span>
                )}
                <p className="text-navy font-bold text-sm">{c.court}</p>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${styles.text}`}>
                  {styles.label}
                </p>
                <p className={`text-xs mt-1.5 truncate ${c.status === "open" ? "text-text-muted" : "text-navy font-semibold"}`}>
                  {c.label}
                </p>
                {c.status === "scheduled" && (
                  <p className="text-text-muted text-[10px] mt-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {fmtTime((c as { at: string | null }).at)}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Staff on the floor */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <h2 className="text-navy font-bold text-sm uppercase tracking-wider">On The Floor</h2>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              {data.onClock.length}
            </span>
          </div>
          <Link href="/admin/timeclock" className="text-red text-xs font-semibold hover:text-red-hover flex items-center gap-1">
            Time clock <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {data.onClock.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted text-sm">No one clocked in right now.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border max-h-72 overflow-y-auto">
            {data.onClock.map((u) => (
              <li key={u.userId} className="px-5 py-3 flex items-center gap-3">
                {u.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-off-white flex items-center justify-center">
                    <span className="text-navy text-xs font-bold">
                      {(u.name || "").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-semibold text-sm truncate">{u.name}</p>
                  <p className="text-text-muted text-xs truncate">
                    {u.role} · since {fmtTime(u.clockInAt)}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex-shrink-0">
                  {elapsed(u.clockInAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
