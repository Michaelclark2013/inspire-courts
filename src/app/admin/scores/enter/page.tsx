"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, Play, CheckCircle2, Trophy, X, Check, AlertCircle } from "lucide-react";
import type {
  Game,
  ScoreFormState,
  CreateGameForm,
  TournamentOption,
  GameStatus,
} from "@/types/score-entry";
import { triggerHaptic } from "@/lib/capacitor";
import { GameCard } from "@/components/admin/scores/GameCard";
import { QuickAddForm } from "@/components/admin/scores/QuickAddForm";
import { TournamentFilter } from "@/components/admin/scores/TournamentFilter";
import { CourtFilter } from "@/components/admin/scores/CourtFilter";
import { ScoreEntrySkeleton } from "@/components/admin/scores/ScoreEntrySkeleton";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

export default function ScoreEntryPage() {
  const [gameList, setGameList] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [scoreSuccess, setScoreSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [courtFilter, setCourtFilter] = useState("");
  const [tournamentOptions, setTournamentOptions] = useState<TournamentOption[]>([]);

  // Offline sync
  const { isOnline, queueMutation, pendingCount } = useOfflineSync();

  // Per-endpoint error tracking
  const [errors, setErrors] = useState<{ games: boolean; tournaments: boolean }>({
    games: false,
    tournaments: false,
  });

  // AbortController tracking
  const gamesAbortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const [form, setForm] = useState<CreateGameForm>({
    homeTeam: "",
    awayTeam: "",
    division: "",
    court: "",
    eventName: "",
  });

  const [scoreForm, setScoreForm] = useState<ScoreFormState>({
    gameId: 0,
    homeScore: 0,
    awayScore: 0,
    quarter: "",
    status: "",
  });

  const fetchGames = useCallback(async () => {
    // Cancel any in-flight request
    if (gamesAbortRef.current) gamesAbortRef.current.abort();
    const ctrl = new AbortController();
    gamesAbortRef.current = ctrl;
    try {
      const res = await fetch("/api/admin/scores", { signal: ctrl.signal });
      if (!mountedRef.current) return;
      if (res.ok) {
        const data = await res.json();
        setGameList(data);
        setErrors((e) => ({ ...e, games: false }));
      } else {
        setErrors((e) => ({ ...e, games: true }));
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (mountedRef.current) setErrors((e) => ({ ...e, games: true }));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Fetch tournament options (once)
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      try {
        const r = await fetch("/api/admin/tournaments", { signal: ctrl.signal });
        if (!r.ok) throw new Error("Failed");
        const data: TournamentOption[] = await r.json();
        if (!mountedRef.current) return;
        setTournamentOptions(data);
        setErrors((e) => ({ ...e, tournaments: false }));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (mountedRef.current) setErrors((e) => ({ ...e, tournaments: true }));
      }
    }
    load();
    return () => ctrl.abort();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (gamesAbortRef.current) gamesAbortRef.current.abort();
    };
  }, []);

  // Tab-visibility-aware polling every 15s
  useVisibilityPolling(fetchGames, 15000, { enabled: true, immediate: true });

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        triggerHaptic("medium");
        setForm({ homeTeam: "", awayTeam: "", division: "", court: "", eventName: "" });
        setShowForm(false);
        fetchGames();
        setCreateSuccess("Game created successfully");
        setTimeout(() => setCreateSuccess(""), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Failed to create game");
      }
    } catch {
      setFormError("Network error — please try again");
    }
    setSaving(false);
  }

  const startScoreUpdate = useCallback((game: Game) => {
    setUpdatingId(game.id);
    setScoreError("");
    setScoreForm({
      gameId: game.id,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      quarter: game.lastQuarter || "",
      status: "",
    });
  }, []);

  const cancelScoreUpdate = useCallback(() => {
    setUpdatingId(null);
    setScoreError("");
  }, []);

  const clearScoreError = useCallback(() => setScoreError(""), []);

  async function handleUpdateScore(e: React.FormEvent) {
    e.preventDefault();
    if (scoreForm.status === "final") {
      if (!confirm("Mark this game as final? This cannot be undone.")) return;
    }
    setSaving(true);
    setScoreError("");
    // Optimistic: apply score + status locally immediately
    const prevList = gameList;
    setGameList((list) =>
      list.map((g) =>
        g.id === scoreForm.gameId
          ? {
              ...g,
              homeScore: scoreForm.homeScore,
              awayScore: scoreForm.awayScore,
              lastQuarter: scoreForm.quarter || g.lastQuarter,
              status: (scoreForm.status || g.status) as GameStatus,
            }
          : g
      )
    );
    const scorePayload = {
      gameId: scoreForm.gameId,
      homeScore: scoreForm.homeScore,
      awayScore: scoreForm.awayScore,
      quarter: scoreForm.quarter || undefined,
      status: scoreForm.status || undefined,
    };
    if (!isOnline) {
      // Queue for later sync
      await queueMutation({
        url: "/api/admin/scores",
        method: "PUT",
        body: scorePayload,
        type: "score",
      });
      setUpdatingId(null);
      setScoreSuccess("Saved offline");
      setTimeout(() => setScoreSuccess(""), 2000);
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scorePayload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setScoreError(data.error || "Failed to update score");
        setGameList(prevList); // rollback
        setSaving(false);
        return;
      }
    } catch {
      // Network error — queue offline instead of showing error
      await queueMutation({
        url: "/api/admin/scores",
        method: "PUT",
        body: scorePayload,
        type: "score",
      });
      setUpdatingId(null);
      setScoreSuccess("Saved offline");
      setTimeout(() => setScoreSuccess(""), 2000);
      setSaving(false);
      return;
    }
    if (scoreForm.status === "final") {
      triggerHaptic("success");
    }
    setUpdatingId(null);
    setScoreSuccess("Score saved");
    setTimeout(() => setScoreSuccess(""), 2000);
    fetchGames();
    setSaving(false);
  }

  // Optimistic +/- mutation handler (debounced in GameCard)
  const handleOptimisticScore = useCallback(
    async (gameId: number, homeScore: number, awayScore: number): Promise<boolean> => {
      // Apply in parent list optimistically too so siblings stay in sync
      setGameList((list) =>
        list.map((g) => (g.id === gameId ? { ...g, homeScore, awayScore } : g))
      );
      const payload = { gameId, homeScore, awayScore };
      if (!isOnline) {
        await queueMutation({
          url: "/api/admin/scores",
          method: "PUT",
          body: payload,
          type: "score",
        });
        return true; // Optimistic success — queued offline
      }
      try {
        const res = await fetch("/api/admin/scores", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return false;
        return true;
      } catch {
        // Network error — queue offline
        await queueMutation({
          url: "/api/admin/scores",
          method: "PUT",
          body: payload,
          type: "score",
        });
        return true;
      }
    },
    [isOnline, queueMutation]
  );

  // Derived/memoised lists
  const courtOptions = useMemo(
    () => Array.from(new Set(gameList.map((g) => g.court).filter(Boolean) as string[])).sort(),
    [gameList]
  );

  const filtered = useMemo(() => {
    return gameList.filter((g) => {
      if (tournamentFilter && g.eventName !== tournamentFilter) return false;
      if (courtFilter && g.court !== courtFilter) return false;
      return true;
    });
  }, [gameList, tournamentFilter, courtFilter]);

  const { liveGames, scheduledGames, finalGames } = useMemo(
    () => ({
      liveGames: filtered.filter((g) => g.status === "live"),
      scheduledGames: filtered.filter((g) => g.status === "scheduled"),
      finalGames: filtered.filter((g) => g.status === "final"),
    }),
    [filtered]
  );

  const hasPartialFailure = errors.games || errors.tournaments;

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-[env(safe-area-inset-bottom)] overscroll-none">
      <Breadcrumbs />
      {/* Header */}
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Score Entry
          </h1>
          <p className="text-text-secondary text-sm mt-1 hidden md:block">
            Create games and enter live scores
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <CourtFilter value={courtFilter} onChange={setCourtFilter} options={courtOptions} />
          <TournamentFilter
            value={tournamentFilter}
            onChange={setTournamentFilter}
            options={tournamentOptions}
          />
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            aria-expanded={showForm}
            className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px]"
          >
            {showForm ? <X className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            {showForm ? "Cancel" : "New Game"}
          </button>
        </div>
      </div>

      {/* Partial failure banner */}
      {hasPartialFailure && (
        <div
          role="alert"
          className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Some data could not be loaded</p>
            <p className="text-xs mt-0.5">
              {errors.games && "Games feed unavailable. "}
              {errors.tournaments && "Tournament list unavailable. "}
              Retrying automatically.
            </p>
          </div>
          <button
            onClick={fetchGames}
            className="text-amber-800 underline text-xs font-semibold focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success toast(s) */}
      {createSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-6 z-80 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl"
        >
          <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold">{createSuccess}</span>
          <button
            type="button"
            onClick={() => setCreateSuccess("")}
            aria-label="Dismiss"
            className="ml-2 text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      {scoreSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-80 flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-full shadow-xl"
        >
          <Check className="w-4 h-4" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider">{scoreSuccess}</span>
        </div>
      )}

      {/* New game form */}
      {showForm && (
        <QuickAddForm
          form={form}
          setForm={setForm}
          onSubmit={handleCreateGame}
          saving={saving}
          error={formError}
          onClearError={() => setFormError("")}
          tournamentOptions={tournamentOptions}
        />
      )}

      {/* KPIs */}
      {!loading && gameList.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4 md:mb-8">
          <div className="bg-white border border-emerald-200 shadow-sm rounded-xl p-4 text-center">
            <p className="text-emerald-700 text-2xl font-bold font-heading tabular-nums">
              {liveGames.length}
            </p>
            <p className="text-emerald-700/70 text-xs font-semibold uppercase tracking-wider mt-1">
              Live
            </p>
          </div>
          <div className="bg-white border border-border shadow-sm rounded-xl p-4 text-center">
            <p className="text-navy text-2xl font-bold font-heading tabular-nums">
              {scheduledGames.length}
            </p>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mt-1">
              Scheduled
            </p>
          </div>
          <div className="bg-white border border-red/20 shadow-sm rounded-xl p-4 text-center">
            <p className="text-red text-2xl font-bold font-heading tabular-nums">
              {finalGames.length}
            </p>
            <p className="text-red/70 text-xs font-semibold uppercase tracking-wider mt-1">Final</p>
          </div>
        </div>
      )}

      {loading ? (
        <ScoreEntrySkeleton />
      ) : (
        <div className="space-y-8">
          {liveGames.length > 0 && (
            <GameSection
              title="Live Now"
              icon={<Play className="w-4 h-4 text-emerald-600" aria-hidden />}
              games={liveGames}
              updatingId={updatingId}
              scoreForm={scoreForm}
              setScoreForm={setScoreForm}
              onStartEdit={startScoreUpdate}
              onCancelEdit={cancelScoreUpdate}
              onSaveScore={handleUpdateScore}
              saving={saving}
              scoreError={scoreError}
              onClearScoreError={clearScoreError}
              onOptimisticScore={handleOptimisticScore}
            />
          )}
          {scheduledGames.length > 0 && (
            <GameSection
              title="Scheduled"
              icon={<Trophy className="w-4 h-4 text-navy/40" aria-hidden />}
              games={scheduledGames}
              updatingId={updatingId}
              scoreForm={scoreForm}
              setScoreForm={setScoreForm}
              onStartEdit={startScoreUpdate}
              onCancelEdit={cancelScoreUpdate}
              onSaveScore={handleUpdateScore}
              saving={saving}
              scoreError={scoreError}
              onClearScoreError={clearScoreError}
              onOptimisticScore={handleOptimisticScore}
            />
          )}
          {finalGames.length > 0 && (
            <GameSection
              title="Final"
              icon={<CheckCircle2 className="w-4 h-4 text-red" aria-hidden />}
              games={finalGames}
              updatingId={updatingId}
              scoreForm={scoreForm}
              setScoreForm={setScoreForm}
              onStartEdit={startScoreUpdate}
              onCancelEdit={cancelScoreUpdate}
              onSaveScore={handleUpdateScore}
              saving={saving}
              scoreError={scoreError}
              onClearScoreError={clearScoreError}
              onOptimisticScore={handleOptimisticScore}
            />
          )}

          {gameList.length === 0 && (
            <div className="text-center py-16 text-text-muted bg-white border border-border rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" aria-hidden />
              <p className="text-sm font-semibold text-navy mb-1">No games yet today.</p>
              <p className="text-xs mb-4">Create one above to start entering scores.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> New Game
              </button>
            </div>
          )}
          {gameList.length > 0 && filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p className="text-sm">No games match the current filters.</p>
              <button
                onClick={() => {
                  setTournamentFilter("");
                  setCourtFilter("");
                }}
                className="mt-2 text-red hover:text-red-hover text-xs font-semibold uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type GameSectionProps = {
  title: string;
  icon: React.ReactNode;
  games: Game[];
  updatingId: number | null;
  scoreForm: ScoreFormState;
  setScoreForm: (f: ScoreFormState) => void;
  onStartEdit: (g: Game) => void;
  onCancelEdit: () => void;
  onSaveScore: (e: React.FormEvent) => void;
  saving: boolean;
  scoreError: string;
  onClearScoreError: () => void;
  onOptimisticScore: (gameId: number, home: number, away: number) => Promise<boolean>;
};

function GameSection({
  title,
  icon,
  games,
  updatingId,
  scoreForm,
  setScoreForm,
  onStartEdit,
  onCancelEdit,
  onSaveScore,
  saving,
  scoreError,
  onClearScoreError,
  onOptimisticScore,
}: GameSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider">{title}</h2>
        <span className="text-text-secondary text-xs tabular-nums">{games.length}</span>
      </div>
      <div className="space-y-2">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isEditing={updatingId === game.id}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            scoreForm={scoreForm}
            setScoreForm={setScoreForm}
            onSaveScore={onSaveScore}
            saving={saving}
            scoreError={updatingId === game.id ? scoreError : ""}
            onClearScoreError={onClearScoreError}
            onOptimisticScore={onOptimisticScore}
          />
        ))}
      </div>
    </section>
  );
}
