"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Plus,
  Loader2,
  ChevronLeft,
  Play,
  CheckCircle2,
  Trash2,
  Zap,
  X,
  ArrowRight,
} from "lucide-react";
import BracketView from "@/components/tournament/BracketView";
import ScheduleGrid from "@/components/tournament/ScheduleGrid";
import PoolStandings from "@/components/tournament/PoolStandings";

type Team = {
  id: number;
  teamName: string;
  seed: number | null;
  division: string | null;
  poolGroup: string | null;
  eliminated: boolean;
};

type BracketGame = {
  id: number;
  gameId: number;
  bracketPosition: number | null;
  round: string | null;
  poolGroup: string | null;
  winnerAdvancesTo: number | null;
  loserDropsTo: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  lastQuarter: string | null;
  status: string;
  court: string | null;
  scheduledTime: string | null;
  division: string | null;
};

type TournamentDetail = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  format: string;
  status: string;
  divisions: string[];
  courts: string[];
  gameLength: number;
  breakLength: number;
  teams: Team[];
  bracket: BracketGame[];
};

const FORMAT_LABELS: Record<string, string> = {
  single_elim: "Single Elimination",
  double_elim: "Double Elimination",
  round_robin: "Round Robin",
  pool_play: "Pool Play",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  published: "bg-blue-500/20 text-blue-400",
  active: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-white/10 text-white/40",
};

const TABS = ["teams", "bracket", "schedule", "standings"] as const;
type Tab = (typeof TABS)[number];

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("teams");
  const [saving, setSaving] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSeed, setTeamSeed] = useState("");
  const [teamPool, setTeamPool] = useState("");
  const [teamDivision, setTeamDivision] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/tournaments/${id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        // Auto-switch to bracket tab if bracket exists
        if (d.bracket.length > 0 && tab === "teams") setTab("bracket");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/tournaments/${id}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamName: teamName.trim(),
        seed: teamSeed ? Number(teamSeed) : undefined,
        poolGroup: teamPool || undefined,
        division: teamDivision || undefined,
      }),
    });
    setTeamName("");
    setTeamSeed("");
    setTeamPool("");
    setTeamDivision("");
    fetchData();
    setSaving(false);
  }

  async function removeTeam(teamEntryId: number) {
    await fetch(`/api/admin/tournaments/${id}/teams`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamEntryId }),
    });
    fetchData();
  }

  async function generateBracket() {
    setGenerating(true);
    const res = await fetch(`/api/admin/tournaments/${id}/generate`, {
      method: "POST",
    });
    if (res.ok) {
      setTab("bracket");
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to generate bracket");
    }
    setGenerating(false);
  }

  async function updateStatus(status: string) {
    await fetch(`/api/admin/tournaments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  async function advanceWinner(gameId: number) {
    await fetch(`/api/admin/tournaments/${id}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-white/40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-white/40 text-sm">Tournament not found.</div>
    );
  }

  const liveGames = data.bracket.filter((g) => g.status === "live").length;
  const finalGames = data.bracket.filter((g) => g.status === "final").length;

  return (
    <div className="p-6 lg:p-8">
      {/* Back link + Header */}
      <Link
        href="/admin/tournaments/manage"
        className="text-text-secondary text-xs hover:text-white flex items-center gap-1 mb-4 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" /> Back to Tournaments
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-heading">
              {data.name}
            </h1>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[data.status]}`}
            >
              {data.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-text-secondary text-xs">
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
            <span>{data.bracket.length} games</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.status === "draft" && data.teams.length >= 2 && (
            <button
              onClick={generateBracket}
              disabled={generating}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Generate Bracket
            </button>
          )}
          {data.status === "published" && (
            <button
              onClick={() => updateStatus("active")}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              <Play className="w-4 h-4" /> Start Tournament
            </button>
          )}
          {data.status === "active" && (
            <button
              onClick={() => updateStatus("completed")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete
            </button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Teams
          </p>
          <p className="text-white text-2xl font-bold font-heading">
            {data.teams.length}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Games
          </p>
          <p className="text-white text-2xl font-bold font-heading">
            {data.bracket.length}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Live
          </p>
          <p className="text-emerald-400 text-2xl font-bold font-heading">
            {liveGames}
          </p>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
            Complete
          </p>
          <p className="text-white text-2xl font-bold font-heading">
            {finalGames}
            <span className="text-white/30 text-lg">
              /{data.bracket.length}
            </span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-card border border-white/10 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === t
                ? "bg-red text-white"
                : "text-white/40 hover:text-white hover:bg-white/5"
            }`}
          >
            {t === "teams" && <Users className="w-3.5 h-3.5 inline mr-1.5" />}
            {t === "bracket" && (
              <Trophy className="w-3.5 h-3.5 inline mr-1.5" />
            )}
            {t === "schedule" && (
              <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
            )}
            {t === "standings" && (
              <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
            )}
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "teams" && (
        <div className="space-y-4">
          {/* Add team form (only for draft) */}
          {data.status === "draft" && (
            <form
              onSubmit={addTeam}
              className="bg-card border border-white/10 rounded-xl p-5"
            >
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red" /> Add Team
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team name *"
                  required
                  className="bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                />
                <input
                  type="number"
                  min={1}
                  value={teamSeed}
                  onChange={(e) => setTeamSeed(e.target.value)}
                  placeholder="Seed #"
                  className="bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                />
                {data.format === "pool_play" && (
                  <input
                    type="text"
                    value={teamPool}
                    onChange={(e) => setTeamPool(e.target.value)}
                    placeholder="Pool (A, B...)"
                    className="bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red placeholder:text-white/25"
                  />
                )}
                {data.divisions.length > 0 && (
                  <select
                    value={teamDivision}
                    onChange={(e) => setTeamDivision(e.target.value)}
                    className="bg-navy border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red cursor-pointer"
                  >
                    <option value="">Division</option>
                    {data.divisions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            </form>
          )}

          {/* Team list */}
          <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
              <Users className="w-4 h-4 text-red" />
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Teams ({data.teams.length})
              </h3>
            </div>
            {data.teams.length === 0 ? (
              <div className="px-5 py-8 text-center text-white/30 text-sm">
                No teams added yet
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {data.teams.map((team) => (
                  <div
                    key={team.id}
                    className="px-5 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 text-xs font-bold w-6 text-center tabular-nums">
                        #{team.seed ?? "—"}
                      </span>
                      <span
                        className={`text-sm font-semibold ${team.eliminated ? "text-white/30 line-through" : "text-white"}`}
                      >
                        {team.teamName}
                      </span>
                      {team.division && (
                        <span className="text-[10px] bg-red/10 text-red px-1.5 py-0.5 rounded font-bold">
                          {team.division}
                        </span>
                      )}
                      {team.poolGroup && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold">
                          Pool {team.poolGroup}
                        </span>
                      )}
                    </div>
                    {data.status === "draft" && (
                      <button
                        onClick={() => removeTeam(team.id)}
                        className="text-white/20 hover:text-red transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "bracket" && (
        <BracketView
          bracket={data.bracket}
          format={data.format}
          tournamentId={data.id}
          isAdmin={true}
          onAdvance={advanceWinner}
          onRefresh={fetchData}
        />
      )}

      {tab === "schedule" && (
        <ScheduleGrid
          bracket={data.bracket}
          courts={data.courts}
        />
      )}

      {tab === "standings" && (
        <PoolStandings bracket={data.bracket} />
      )}
    </div>
  );
}
