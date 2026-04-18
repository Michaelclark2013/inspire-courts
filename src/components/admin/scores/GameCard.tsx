"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { triggerHaptic } from "@/lib/capacitor";
import { Minus, Plus, Loader2, CheckCircle2, X, AlertCircle, Check } from "lucide-react";
import type { Game, ScoreFormState } from "@/types/score-entry";
import { GameStatusBadge } from "./GameStatusBadge";
import { ScoreControls } from "./ScoreControls";
import { relativeTime } from "@/lib/relative-time";

type Props = {
  game: Game;
  isEditing: boolean;
  onStartEdit: (g: Game) => void;
  onCancelEdit: () => void;
  scoreForm: ScoreFormState;
  setScoreForm: (f: ScoreFormState) => void;
  onSaveScore: (e: React.FormEvent) => void;
  saving: boolean;
  scoreError: string;
  onClearScoreError: () => void;
  /** Called with final score after debounce; returns promise that resolves on success */
  onOptimisticScore: (gameId: number, homeScore: number, awayScore: number) => Promise<boolean>;
};

function GameCardImpl({
  game,
  isEditing,
  onStartEdit,
  onCancelEdit,
  scoreForm,
  setScoreForm,
  onSaveScore,
  saving,
  scoreError,
  onClearScoreError,
  onOptimisticScore,
}: Props) {
  // Optimistic local scores — synced from server props
  const [optHome, setOptHome] = useState(game.homeScore);
  const [optAway, setOptAway] = useState(game.awayScore);
  const [pending, setPending] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const [rollbackError, setRollbackError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<{ home: number; away: number } | null>(null);

  // Sync when server prop changes and we have no pending mutation
  useEffect(() => {
    if (!pending && !targetRef.current) {
      setOptHome(game.homeScore);
      setOptAway(game.awayScore);
    }
  }, [game.homeScore, game.awayScore, pending]);

  const scheduleSync = useCallback(
    (home: number, away: number) => {
      targetRef.current = { home, away };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const target = targetRef.current;
        if (!target) return;
        setPending(true);
        const ok = await onOptimisticScore(game.id, target.home, target.away);
        setPending(false);
        targetRef.current = null;
        if (ok) {
          setFlashSuccess(true);
          setTimeout(() => setFlashSuccess(false), 1500);
        } else {
          // rollback
          setOptHome(game.homeScore);
          setOptAway(game.awayScore);
          setRollbackError("Save failed — rolled back");
          setTimeout(() => setRollbackError(""), 3500);
        }
      }, 450);
    },
    [game.id, game.homeScore, game.awayScore, onOptimisticScore]
  );

  // Cleanup pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function bumpHome(delta: number) {
    triggerHaptic("light");
    const next = Math.max(0, optHome + delta);
    setOptHome(next);
    scheduleSync(next, optAway);
  }
  function bumpAway(delta: number) {
    triggerHaptic("light");
    const next = Math.max(0, optAway + delta);
    setOptAway(next);
    scheduleSync(optHome, next);
  }

  return (
    <div className="bg-white border border-border shadow-sm rounded-xl p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4 flex-col sm:flex-row">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-navy font-semibold truncate">{game.homeTeam}</span>
            <span
              aria-live="polite"
              className="text-navy font-bold text-lg tabular-nums min-w-[1.5ch] text-center"
            >
              {optHome}
            </span>
            <span className="text-text-muted">—</span>
            <span
              aria-live="polite"
              className="text-navy font-bold text-lg tabular-nums min-w-[1.5ch] text-center"
            >
              {optAway}
            </span>
            <span className="text-navy font-semibold truncate">{game.awayTeam}</span>
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted" aria-label="Saving" />}
            {flashSuccess && <Check className="w-3.5 h-3.5 text-emerald-600" aria-label="Saved" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary flex-wrap">
            {game.division && <span>{game.division}</span>}
            {game.court && <span>{game.court}</span>}
            {game.eventName && <span className="truncate max-w-[200px]">{game.eventName}</span>}
            {game.lastQuarter && <span>Q{game.lastQuarter}</span>}
            {game.updatedAt && <span className="text-text-muted/70">{relativeTime(game.updatedAt)}</span>}
          </div>
          {rollbackError && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span>{rollbackError}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GameStatusBadge status={game.status} />
          {game.status !== "final" && (
            <div className="flex items-center gap-1" aria-label="Quick score adjustment">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">H</span>
                <button
                  type="button"
                  aria-label={`Decrease home score for ${game.homeTeam}`}
                  onClick={() => bumpHome(-1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-off-white hover:bg-light-gray active:scale-95 border border-border rounded-lg text-navy font-bold transition-all focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Increase home score for ${game.homeTeam}`}
                  onClick={() => bumpHome(1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-off-white hover:bg-light-gray active:scale-95 border border-border rounded-lg text-navy font-bold transition-all focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">A</span>
                <button
                  type="button"
                  aria-label={`Decrease away score for ${game.awayTeam}`}
                  onClick={() => bumpAway(-1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-off-white hover:bg-light-gray active:scale-95 border border-border rounded-lg text-navy font-bold transition-all focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Increase away score for ${game.awayTeam}`}
                  onClick={() => bumpAway(1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-off-white hover:bg-light-gray active:scale-95 border border-border rounded-lg text-navy font-bold transition-all focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => onStartEdit(game)}
            aria-label={`Open full editor for ${game.homeTeam} vs ${game.awayTeam}`}
            className="text-xs text-text-muted hover:text-navy border border-border hover:border-navy/30 px-3 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px]"
          >
            Edit
          </button>
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={onSaveScore}
          className="mt-4 pt-4 border-t border-border space-y-3"
        >
          {scoreError && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{scoreError}</span>
              <button
                type="button"
                onClick={onClearScoreError}
                aria-label="Dismiss error"
                className="text-red-700 hover:text-navy focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <ScoreControls
              label={`${game.homeTeam} Score`}
              teamName={game.homeTeam}
              value={scoreForm.homeScore}
              onChange={(v) => setScoreForm({ ...scoreForm, homeScore: v })}
            />
            <ScoreControls
              label={`${game.awayTeam} Score`}
              teamName={game.awayTeam}
              value={scoreForm.awayScore}
              onChange={(v) => setScoreForm({ ...scoreForm, awayScore: v })}
            />
            <div>
              <label htmlFor={`gc-quarter-${game.id}`} className="block text-navy/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Quarter</label>
              <select
                id={`gc-quarter-${game.id}`}
                value={scoreForm.quarter}
                onChange={(e) => setScoreForm({ ...scoreForm, quarter: e.target.value })}
                className="w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-sm focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus:border-red min-h-[44px]"
              >
                <option value="">—</option>
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
                <option value="OT">OT</option>
              </select>
            </div>
            <div>
              <label htmlFor={`gc-status-${game.id}`} className="block text-navy/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Status</label>
              <select
                id={`gc-status-${game.id}`}
                value={scoreForm.status}
                onChange={(e) =>
                  setScoreForm({
                    ...scoreForm,
                    status: e.target.value as ScoreFormState["status"],
                  })
                }
                className="w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-sm focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus:border-red min-h-[44px]"
              >
                <option value="">No change</option>
                <option value="live">Live</option>
                <option value="final">Final</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px]"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-text-muted hover:text-navy px-3 py-2.5 rounded-lg text-xs transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function areEqual(prev: Props, next: Props) {
  return (
    prev.game === next.game &&
    prev.isEditing === next.isEditing &&
    prev.saving === next.saving &&
    prev.scoreError === next.scoreError &&
    prev.scoreForm === next.scoreForm &&
    prev.onOptimisticScore === next.onOptimisticScore
  );
}

export const GameCard = memo(GameCardImpl, areEqual);
