"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ConnectionsCard } from "@/components/admin/ConnectionsCard";

type Player = {
  id: number;
  name: string;
  jerseyNumber: string | null;
  division: string | null;
  birthDate: string | null;
  grade: string | null;
  memberSince: string | null;
  photoUrl: string | null;
  waiverOnFile: boolean;
};

type HistoryEvent = {
  id: number;
  timestamp: string;
  teamName: string;
  division: string | null;
  type: string;
  source: string | null;
  isLate: boolean;
  tournamentId: number | null;
  tournamentName: string | null;
};

type TournamentGroup = {
  tournamentId: number | null;
  name: string;
  startDate: string | null;
  events: HistoryEvent[];
};

type Data = {
  player: Player;
  team: { id: number; name: string; division: string | null } | null;
  totals: { tournaments: number; checkins: number; wins: number; losses: number };
  history: TournamentGroup[];
};

export default function PlayerHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/portal/players/${id}/history`);
        if (cancel) return;
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || `Failed (${res.status})`);
          return;
        }
        setData(await res.json());
      } catch {
        setError("Network error");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-text-muted py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </Shell>
    );
  }
  if (error || !data) {
    return (
      <Shell>
        <div className="bg-red/10 border border-red/20 rounded-xl p-5 text-red flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error || "Could not load player"}
        </div>
      </Shell>
    );
  }

  const p = data.player;
  return (
    <Shell>
      {/* Header */}
      <header className="bg-navy text-white rounded-2xl p-5 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
            {p.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">
                #{p.jerseyNumber || "?"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-bold">
              Player history
            </p>
            <h1 className="text-2xl font-bold mt-0.5">{p.name}</h1>
            <p className="text-white/70 text-sm mt-0.5">
              {data.team?.name || "No team"}
              {p.jerseyNumber ? ` · #${p.jerseyNumber}` : ""}
              {p.division ? ` · ${p.division}` : ""}
              {p.grade ? ` · ${p.grade}` : ""}
            </p>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          <Stat label="Events" value={data.totals.tournaments} />
          <Stat label="Check-ins" value={data.totals.checkins} />
          <Stat label="Wins" value={data.totals.wins} />
          <Stat label="Losses" value={data.totals.losses} />
        </div>
      </header>

      {/* Connections card — gives parents + coaches the full picture
          (parent account, team, recent waivers, all check-ins). */}
      <ConnectionsCard kind="player" id={p.id} />

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
        <div className="bg-white border border-border rounded-xl p-3">
          <p className="text-text-muted uppercase tracking-wider font-bold text-[10px]">DOB</p>
          <p className="text-navy font-semibold mt-0.5">{p.birthDate || "Not on file"}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-3">
          <p className="text-text-muted uppercase tracking-wider font-bold text-[10px]">Waiver</p>
          <p className={"font-semibold mt-0.5 inline-flex items-center gap-1 " + (p.waiverOnFile ? "text-emerald-700" : "text-red")}>
            {p.waiverOnFile ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> On file
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Not on file
              </>
            )}
          </p>
        </div>
      </div>

      {/* History timeline */}
      <h2 className="text-navy text-sm font-bold uppercase tracking-wider mb-3">
        Events
      </h2>
      {data.history.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-6 text-center text-text-muted text-sm">
          No check-ins yet — first event will show up here after sign-in.
        </div>
      ) : (
        <ul className="space-y-3">
          {data.history.map((g, i) => (
            <li key={`${g.tournamentId ?? "x"}-${i}`} className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-start gap-3">
                <Trophy className="w-4 h-4 text-red mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy truncate">{g.name}</p>
                  {g.startDate && (
                    <p className="text-text-muted text-[11px]">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(g.startDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className="text-text-muted text-[11px] font-semibold">
                  {g.events.length} event{g.events.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {g.events.map((e) => (
                  <li key={e.id} className="px-4 py-2 flex items-center justify-between text-xs gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-navy">
                        {e.type === "checkin" ? "Checked in" : e.type === "no_show" ? "No show" : e.type}
                        {e.isLate && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-amber-700 font-semibold">
                            <Clock className="w-3 h-3" /> late
                          </span>
                        )}
                      </p>
                      <p className="text-text-muted">{new Date(e.timestamp).toLocaleString()}</p>
                    </div>
                    {e.source && (
                      <span className="text-text-muted/70 text-[10px] uppercase tracking-wider">
                        via {e.source}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Portal
        </Link>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-2.5">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white/70 text-[10px] uppercase tracking-wider font-bold">
        {label}
      </p>
    </div>
  );
}
