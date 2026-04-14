"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ChevronLeft, Loader2, Radio, Users, DollarSign, Calendar } from "lucide-react";
import BracketView from "@/components/tournament/BracketView";
import PoolStandings from "@/components/tournament/PoolStandings";

type TournamentPublic = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  entryFee: number | null;
  registrationOpen: boolean;
  registrationDeadline: string | null;
  description: string | null;
  teams: { teamName: string; seed: number; division: string | null; poolGroup: string | null; eliminated: boolean }[];
  bracket: {
    bracketPosition: number | null;
    round: string | null;
    poolGroup: string | null;
    winnerAdvancesTo: number | null;
    loserDropsTo: number | null;
    gameId: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
    court: string | null;
    scheduledTime: string | null;
    lastQuarter: string | null;
  }[];
};

const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

export default function PublicTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TournamentPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [id]);

  // Poll every 30s for live score updates, but pause when tab is hidden
  useEffect(() => {
    fetchData();
    let interval = setInterval(fetchData, 30000);

    function handleVisibility() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchData();
        interval = setInterval(fetchData, 30000);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <p className="text-text-muted">Tournament not found.</p>
      </div>
    );
  }

  const liveCount = data.bracket.filter((g) => g.status === "live").length;

  // Map bracket to expected shape for BracketView
  const bracketForView = data.bracket.map((g, i) => ({
    id: i,
    gameId: g.gameId,
    bracketPosition: g.bracketPosition,
    round: g.round,
    poolGroup: g.poolGroup,
    winnerAdvancesTo: g.winnerAdvancesTo,
    loserDropsTo: g.loserDropsTo,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    lastQuarter: g.lastQuarter,
    status: g.status,
    court: g.court,
    scheduledTime: g.scheduledTime,
    division: null,
  }));

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <Link
          href="/tournaments"
          className="text-text-muted text-xs hover:text-navy flex items-center gap-1 mb-6 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" /> Back to Tournaments
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-red" />
            <h1 className="text-2xl lg:text-3xl font-bold text-navy font-heading">
              {data.name}
            </h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" />
                {liveCount} Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted text-sm">
            <span>{FORMAT_LABELS[data.format] || data.format}</span>
            <span>
              {new Date(data.startDate + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {data.location && <span>{data.location}</span>}
            <span>{data.teams.length} teams</span>
          </div>
        </div>

        {/* Registration CTA */}
        {data.registrationOpen && (
          <div className="mb-8 bg-white border border-red/20 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-navy font-bold text-lg mb-1">Registration Open</h2>
              <div className="flex flex-wrap items-center gap-3 text-text-muted text-sm">
                {data.entryFee != null && data.entryFee > 0 && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    ${(data.entryFee / 100).toFixed(0)} per team
                  </span>
                )}
                {data.registrationDeadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline: {new Date(data.registrationDeadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
            <a
              href="https://inspirecourts.leagueapps.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0"
            >
              Register Now
            </a>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="mb-8 bg-white border border-light-gray rounded-xl p-5">
            <p className="text-text-muted text-sm whitespace-pre-wrap">{data.description}</p>
          </div>
        )}

        {/* Registered Teams */}
        {data.teams.length > 0 && data.bracket.length === 0 && (
          <div className="mb-8 bg-white border border-light-gray rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-light-gray flex items-center gap-2">
              <Users className="w-4 h-4 text-red" />
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
                Registered Teams ({data.teams.length})
              </h2>
            </div>
            <div className="divide-y divide-light-gray">
              {data.teams.map((team, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-text-muted text-xs font-bold w-6 text-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-navy text-sm font-semibold">{team.teamName}</span>
                  {team.division && (
                    <span className="text-[10px] bg-red/10 text-red px-1.5 py-0.5 rounded font-bold">
                      {team.division}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bracket */}
        {data.bracket.length > 0 ? (
          <div className="mb-8">
            <BracketView
              bracket={bracketForView}
              format={data.format}
              tournamentId={data.id}
              isAdmin={false}
            />
          </div>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              Bracket will be posted soon. Check back for live updates!
            </p>
          </div>
        )}

        {/* Standings */}
        {data.bracket.filter((g) => g.status === "final").length > 0 && (
          <div>
            <h2 className="text-navy font-bold text-lg mb-4">Standings</h2>
            <PoolStandings bracket={bracketForView} />
          </div>
        )}
      </div>
    </div>
  );
}
