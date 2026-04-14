"use client";

import { useState } from "react";
import {
  Trophy,
  ChevronRight,
  Play,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

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

interface Props {
  bracket: BracketGame[];
  format: string;
  tournamentId: number;
  isAdmin?: boolean;
  onAdvance?: (gameId: number) => void;
  onRefresh?: () => void;
}

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-white/20",
  live: "bg-emerald-400 animate-pulse",
  final: "bg-red",
};

export default function BracketView({
  bracket,
  format,
  tournamentId,
  isAdmin = false,
  onAdvance,
  onRefresh,
}: Props) {
  const [updatingGame, setUpdatingGame] = useState<number | null>(null);
  const [scoreForm, setScoreForm] = useState({
    homeScore: 0,
    awayScore: 0,
    quarter: "",
    status: "" as "" | "live" | "final",
  });
  const [saving, setSaving] = useState(false);

  // Group games by round
  const rounds = new Map<string, BracketGame[]>();
  for (const game of bracket) {
    const round = game.round || "R1";
    if (!rounds.has(round)) rounds.set(round, []);
    rounds.get(round)!.push(game);
  }

  // Sort rounds logically
  const roundOrder = [...rounds.keys()].sort((a, b) => {
    const order: Record<string, number> = { F: 100, GF: 101, SF: 90, QF: 80 };
    const getOrder = (r: string) => {
      if (order[r] !== undefined) return order[r];
      const match = r.match(/R(\d+)/);
      if (match) return parseInt(match[1]);
      const lMatch = r.match(/L(\d+)/);
      if (lMatch) return 50 + parseInt(lMatch[1]);
      if (r.startsWith("Pool")) return -1;
      return 0;
    };
    return getOrder(a) - getOrder(b);
  });

  function startScoreUpdate(game: BracketGame) {
    setUpdatingGame(game.gameId);
    setScoreForm({
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      quarter: game.lastQuarter || "",
      status: "",
    });
  }

  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleScoreSave(gameId: number) {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          homeScore: scoreForm.homeScore,
          awayScore: scoreForm.awayScore,
          quarter: scoreForm.quarter || undefined,
          status: scoreForm.status || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save score");
      }

      // Auto-advance if game went to final
      if (scoreForm.status === "final" && onAdvance) {
        onAdvance(gameId);
      }

      setUpdatingGame(null);
      onRefresh?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const ROUND_LABELS: Record<string, string> = {
    R1: "Round 1",
    R2: "Round 2",
    R3: "Round 3",
    QF: "Quarterfinals",
    SF: "Semifinals",
    F: "Final",
    GF: "Grand Final",
  };

  if (bracket.length === 0) {
    return (
      <div className="text-center py-16 text-white/40">
        <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">
          No bracket generated yet. Add teams and generate the bracket to see it
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {roundOrder.map((roundKey) => {
          const games = rounds.get(roundKey) || [];
          return (
            <div key={roundKey} className="flex-shrink-0 w-[280px]">
              <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-3 text-center">
                {ROUND_LABELS[roundKey] || roundKey}
              </h3>
              <div className="space-y-3 flex flex-col justify-around min-h-full">
                {games.map((game) => {
                  const isFinal = game.status === "final";
                  const homeWins = isFinal && game.homeScore > game.awayScore;
                  const awayWins = isFinal && game.awayScore > game.homeScore;

                  return (
                    <div
                      key={game.id}
                      className="bg-card border border-white/10 rounded-xl overflow-hidden"
                    >
                      {/* Game header */}
                      <div className="px-3 py-1.5 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${STATUS_DOT[game.status] || STATUS_DOT.scheduled}`}
                          />
                          <span className="text-[10px] text-white/30 font-semibold uppercase">
                            {game.status}
                          </span>
                          {game.lastQuarter && game.status === "live" && (
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Q{game.lastQuarter}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/20">
                          {game.court && <span>{game.court}</span>}
                        </div>
                      </div>

                      {/* Teams */}
                      <div className="divide-y divide-white/5">
                        <div
                          className={`px-3 py-2 flex items-center justify-between ${homeWins ? "bg-emerald-500/[0.06]" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {homeWins && (
                              <Trophy className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm font-semibold truncate ${
                                game.homeTeam === "TBD"
                                  ? "text-white/20 italic"
                                  : homeWins
                                    ? "text-white"
                                    : isFinal
                                      ? "text-white/40"
                                      : "text-white"
                              }`}
                            >
                              {game.homeTeam || "TBD"}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold tabular-nums ${homeWins ? "text-emerald-400" : isFinal ? "text-white/40" : "text-white"}`}
                          >
                            {game.homeScore}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-2 flex items-center justify-between ${awayWins ? "bg-emerald-500/[0.06]" : ""}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {awayWins && (
                              <Trophy className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            )}
                            <span
                              className={`text-sm font-semibold truncate ${
                                game.awayTeam === "TBD"
                                  ? "text-white/20 italic"
                                  : awayWins
                                    ? "text-white"
                                    : isFinal
                                      ? "text-white/40"
                                      : "text-white"
                              }`}
                            >
                              {game.awayTeam || "TBD"}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold tabular-nums ${awayWins ? "text-emerald-400" : isFinal ? "text-white/40" : "text-white"}`}
                          >
                            {game.awayScore}
                          </span>
                        </div>
                      </div>

                      {/* Admin: score entry */}
                      {isAdmin &&
                        game.homeTeam !== "TBD" &&
                        game.awayTeam !== "TBD" && (
                          <div className="px-3 py-2 border-t border-white/5">
                            {updatingGame === game.gameId ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={scoreForm.homeScore}
                                    onChange={(e) =>
                                      setScoreForm({
                                        ...scoreForm,
                                        homeScore: Number(e.target.value),
                                      })
                                    }
                                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-red"
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    value={scoreForm.awayScore}
                                    onChange={(e) =>
                                      setScoreForm({
                                        ...scoreForm,
                                        awayScore: Number(e.target.value),
                                      })
                                    }
                                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-red"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={scoreForm.quarter}
                                    onChange={(e) =>
                                      setScoreForm({
                                        ...scoreForm,
                                        quarter: e.target.value,
                                      })
                                    }
                                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-red"
                                  >
                                    <option value="">Qtr</option>
                                    <option value="1">Q1</option>
                                    <option value="2">Q2</option>
                                    <option value="3">Q3</option>
                                    <option value="4">Q4</option>
                                    <option value="OT">OT</option>
                                  </select>
                                  <select
                                    value={scoreForm.status}
                                    onChange={(e) =>
                                      setScoreForm({
                                        ...scoreForm,
                                        status: e.target.value as
                                          | ""
                                          | "live"
                                          | "final",
                                      })
                                    }
                                    className="bg-navy border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-red"
                                  >
                                    <option value="">Status</option>
                                    <option value="live">Live</option>
                                    <option value="final">Final</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleScoreSave(game.gameId)
                                    }
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-1 bg-red hover:bg-red-hover disabled:opacity-40 text-white py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                  >
                                    {saving ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => { setUpdatingGame(null); setSaveError(null); }}
                                    className="text-white/30 hover:text-white px-3 py-1.5 rounded text-[10px] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  {saveError && (
                                    <p role="alert" className="text-red text-[10px] mt-1 col-span-2 w-full">{saveError}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => startScoreUpdate(game)}
                                className="w-full text-center text-[10px] text-white/30 hover:text-white font-semibold uppercase tracking-wider py-1 transition-colors"
                              >
                                {game.status === "final"
                                  ? "Edit Score"
                                  : "Enter Score"}
                              </button>
                            )}
                          </div>
                        )}

                      {/* Advancement indicator */}
                      {game.winnerAdvancesTo && game.status === "final" && (
                        <div className="px-3 py-1.5 border-t border-white/5 flex items-center gap-1 text-[10px] text-emerald-400/60">
                          <ArrowRight className="w-3 h-3" />
                          Advances to slot #{game.winnerAdvancesTo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
