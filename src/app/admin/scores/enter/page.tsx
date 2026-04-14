"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Play,
  CheckCircle2,
  Loader2,
  Trophy,
  X,
} from "lucide-react";

type Game = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  division: string | null;
  court: string | null;
  eventName: string | null;
  scheduledTime: string | null;
  status: "scheduled" | "live" | "final";
  homeScore: number;
  awayScore: number;
  lastQuarter: string | null;
};

const STATUS_STYLES = {
  scheduled: "bg-white/10 text-white/60",
  live: "bg-emerald-500/20 text-emerald-400 animate-pulse",
  final: "bg-red/20 text-red",
};

type TournamentOption = { id: number; name: string };

export default function ScoreEntryPage() {
  const [gameList, setGameList] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [tournamentFilter, setTournamentFilter] = useState<string>("");
  const [tournamentOptions, setTournamentOptions] = useState<TournamentOption[]>([]);

  // New game form
  const [form, setForm] = useState({
    homeTeam: "",
    awayTeam: "",
    division: "",
    court: "",
    eventName: "",
  });

  // Score update form
  const [scoreForm, setScoreForm] = useState({
    gameId: 0,
    homeScore: 0,
    awayScore: 0,
    quarter: "",
    status: "" as "" | "scheduled" | "live" | "final",
  });

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/scores");
      if (res.ok) setGameList(await res.json());
    } catch {
      // DB not configured
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tournament options
  useEffect(() => {
    fetch("/api/admin/tournaments")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TournamentOption[]) => setTournamentOptions(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ homeTeam: "", awayTeam: "", division: "", court: "", eventName: "" });
      setShowForm(false);
      fetchGames();
    }
    setSaving(false);
  }

  function startScoreUpdate(game: Game) {
    setUpdatingId(game.id);
    setScoreForm({
      gameId: game.id,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      quarter: game.lastQuarter || "",
      status: "",
    });
  }

  async function handleUpdateScore(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/scores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: scoreForm.gameId,
        homeScore: scoreForm.homeScore,
        awayScore: scoreForm.awayScore,
        quarter: scoreForm.quarter || undefined,
        status: scoreForm.status || undefined,
      }),
    });
    setUpdatingId(null);
    fetchGames();
    setSaving(false);
  }

  const filtered = tournamentFilter
    ? gameList.filter((g) => g.eventName === tournamentFilter)
    : gameList;
  const liveGames = filtered.filter((g) => g.status === "live");
  const scheduledGames = filtered.filter((g) => g.status === "scheduled");
  const finalGames = filtered.filter((g) => g.status === "final");

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Score Entry
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Create games and enter live scores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tournamentOptions.length > 0 && (
            <select
              value={tournamentFilter}
              aria-label="Filter by tournament"
              onChange={(e) => setTournamentFilter(e.target.value)}
              className="bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-red cursor-pointer"
            >
              <option value="">All Games</option>
              {tournamentOptions.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Game"}
          </button>
        </div>
      </div>

      {/* New game form */}
      {showForm && (
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-red" /> Create Game
          </h2>
          <form onSubmit={handleCreateGame} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Home Team</label>
              <input type="text" value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} required className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25" placeholder="Team name" />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Away Team</label>
              <input type="text" value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} required className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25" placeholder="Team name" />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Division</label>
              <input type="text" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25" placeholder="e.g. 14U" />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Court</label>
              <input type="text" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25" placeholder="e.g. Court 1" />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5">Event</label>
              <input type="text" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} className="w-full bg-navy border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red focus:ring-1 focus:ring-red/30 transition-all placeholder:text-white/25" placeholder="Tournament name" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Game
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Game Count KPIs */}
      {!loading && gameList.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-emerald-400 text-2xl font-bold font-heading">{liveGames.length}</p>
            <p className="text-emerald-400/60 text-xs font-semibold uppercase tracking-wider mt-1">Live</p>
          </div>
          <div className="bg-card border border-white/10 rounded-xl p-4 text-center">
            <p className="text-white text-2xl font-bold font-heading">{scheduledGames.length}</p>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mt-1">Scheduled</p>
          </div>
          <div className="bg-card border border-red/20 rounded-xl p-4 text-center">
            <p className="text-red text-2xl font-bold font-heading">{finalGames.length}</p>
            <p className="text-red/60 text-xs font-semibold uppercase tracking-wider mt-1">Final</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading games...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live games */}
          {liveGames.length > 0 && (
            <GameSection title="Live Now" icon={<Play className="w-4 h-4 text-emerald-400" />} games={liveGames} onUpdate={startScoreUpdate} updatingId={updatingId} scoreForm={scoreForm} setScoreForm={setScoreForm} onSaveScore={handleUpdateScore} onCancelUpdate={() => setUpdatingId(null)} saving={saving} />
          )}

          {/* Scheduled */}
          {scheduledGames.length > 0 && (
            <GameSection title="Scheduled" icon={<Trophy className="w-4 h-4 text-white/40" />} games={scheduledGames} onUpdate={startScoreUpdate} updatingId={updatingId} scoreForm={scoreForm} setScoreForm={setScoreForm} onSaveScore={handleUpdateScore} onCancelUpdate={() => setUpdatingId(null)} saving={saving} />
          )}

          {/* Final */}
          {finalGames.length > 0 && (
            <GameSection title="Final" icon={<CheckCircle2 className="w-4 h-4 text-red" />} games={finalGames} onUpdate={startScoreUpdate} updatingId={updatingId} scoreForm={scoreForm} setScoreForm={setScoreForm} onSaveScore={handleUpdateScore} onCancelUpdate={() => setUpdatingId(null)} saving={saving} />
          )}

          {gameList.length === 0 && (
            <div className="text-center py-16 text-white/40">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No games yet. Create your first game to start entering scores.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GameSection({
  title,
  icon,
  games,
  onUpdate,
  updatingId,
  scoreForm,
  setScoreForm,
  onSaveScore,
  onCancelUpdate,
  saving,
}: {
  title: string;
  icon: React.ReactNode;
  games: Game[];
  onUpdate: (g: Game) => void;
  updatingId: number | null;
  scoreForm: { gameId: number; homeScore: number; awayScore: number; quarter: string; status: "" | "scheduled" | "live" | "final" };
  setScoreForm: (f: { gameId: number; homeScore: number; awayScore: number; quarter: string; status: "" | "scheduled" | "live" | "final" }) => void;
  onSaveScore: (e: React.FormEvent) => void;
  onCancelUpdate: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-white font-bold text-sm uppercase tracking-wider">{title}</h2>
        <span className="text-text-secondary text-xs">{games.length}</span>
      </div>
      <div className="space-y-2">
        {games.map((game) => (
          <div key={game.id} className="bg-card border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white font-semibold truncate">{game.homeTeam}</span>
                  <span className="text-white font-bold text-lg tabular-nums">{game.homeScore}</span>
                  <span className="text-white/30">—</span>
                  <span className="text-white font-bold text-lg tabular-nums">{game.awayScore}</span>
                  <span className="text-white font-semibold truncate">{game.awayTeam}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                  {game.division && <span>{game.division}</span>}
                  {game.court && <span>{game.court}</span>}
                  {game.eventName && <span>{game.eventName}</span>}
                  {game.lastQuarter && <span>Q{game.lastQuarter}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[game.status]}`}>
                  {game.status}
                </span>
                <button
                  onClick={() => onUpdate(game)}
                  className="text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Inline score update form */}
            {updatingId === game.id && (
              <form onSubmit={onSaveScore} className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-1">{game.homeTeam} Score</label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setScoreForm({ ...scoreForm, homeScore: Math.max(0, scoreForm.homeScore - 1) })} className="w-9 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors">−</button>
                    <input type="number" min={0} value={scoreForm.homeScore} onChange={(e) => setScoreForm({ ...scoreForm, homeScore: Number(e.target.value) })} className="flex-1 min-w-0 bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-red tabular-nums" />
                    <button type="button" onClick={() => setScoreForm({ ...scoreForm, homeScore: scoreForm.homeScore + 1 })} className="w-9 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-1">{game.awayTeam} Score</label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setScoreForm({ ...scoreForm, awayScore: Math.max(0, scoreForm.awayScore - 1) })} className="w-9 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors">−</button>
                    <input type="number" min={0} value={scoreForm.awayScore} onChange={(e) => setScoreForm({ ...scoreForm, awayScore: Number(e.target.value) })} className="flex-1 min-w-0 bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-red tabular-nums" />
                    <button type="button" onClick={() => setScoreForm({ ...scoreForm, awayScore: scoreForm.awayScore + 1 })} className="w-9 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-colors">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-1">Quarter</label>
                  <select value={scoreForm.quarter} onChange={(e) => setScoreForm({ ...scoreForm, quarter: e.target.value })} className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red">
                    <option value="">—</option>
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                    <option value="OT">OT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-1">Status</label>
                  <select value={scoreForm.status} onChange={(e) => setScoreForm({ ...scoreForm, status: e.target.value as "" | "scheduled" | "live" | "final" })} className="w-full bg-navy border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red">
                    <option value="">No change</option>
                    <option value="live">Live</option>
                    <option value="final">Final</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Save
                  </button>
                  <button type="button" onClick={onCancelUpdate} className="text-white/40 hover:text-white px-3 py-2.5 rounded-lg text-xs transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
