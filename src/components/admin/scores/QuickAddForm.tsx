"use client";

import { memo } from "react";
import { Plus, Loader2, X, AlertCircle } from "lucide-react";
import type { CreateGameForm, TournamentOption } from "@/types/score-entry";

const COURT_OPTIONS = ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7"];
const DIVISION_OPTIONS = ["8U", "9U", "10U", "11U", "12U", "13U", "14U", "15U", "16U", "17U"];

function QuickAddFormImpl({
  form,
  setForm,
  onSubmit,
  saving,
  error,
  onClearError,
  tournamentOptions,
}: {
  form: CreateGameForm;
  setForm: (f: CreateGameForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  error: string;
  onClearError: () => void;
  tournamentOptions: TournamentOption[];
}) {
  const inputCls =
    "w-full bg-off-white border border-border rounded-lg px-4 py-3 text-navy text-sm focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus:border-red transition-all placeholder:text-text-muted/50";

  return (
    <div className="bg-white border border-border shadow-sm rounded-xl p-6 mb-8 hover:shadow-md transition-shadow">
      <h2 className="text-navy font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-red" aria-hidden /> Create Game
      </h2>
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
          </span>
          <button
            type="button"
            onClick={onClearError}
            aria-label="Dismiss error"
            className="ml-4 text-red-700 hover:text-navy focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="qa-homeTeam" className="block text-navy/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Home Team<span className="text-red ml-0.5">*</span></label>
            <input
              id="qa-homeTeam"
              type="text"
              value={form.homeTeam}
              onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}
              required
              className={inputCls}
              placeholder="Team name"
            />
          </div>
          <div>
            <label htmlFor="qa-awayTeam" className="block text-navy/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Away Team<span className="text-red ml-0.5">*</span></label>
            <input
              id="qa-awayTeam"
              type="text"
              value={form.awayTeam}
              onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}
              required
              className={inputCls}
              placeholder="Team name"
            />
          </div>
          <div>
            <label htmlFor="qa-division" className="block text-navy/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Division</label>
            <select
              id="qa-division"
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">— Select division —</option>
              {DIVISION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qa-court" className="block text-navy/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Court</label>
            <select
              id="qa-court"
              value={form.court}
              onChange={(e) => setForm({ ...form, court: e.target.value })}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="">— Select court —</option>
              {COURT_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qa-event" className="block text-navy/70 text-xs font-semibold uppercase tracking-wider mb-1.5">Event / Tournament</label>
            {tournamentOptions.length > 0 ? (
              <select
                id="qa-event"
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">— Select tournament —</option>
                {tournamentOptions.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="qa-event"
                type="text"
                value={form.eventName}
                onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                className={inputCls}
                placeholder="Tournament name"
              />
            )}
          </div>
          <div className="hidden md:flex items-end">
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className="flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
              Create Game
            </button>
          </div>
        </div>
        <div className="md:hidden sticky bottom-[calc(56px+env(safe-area-inset-bottom)+8px)] -mx-6 px-6 py-3 bg-white/95 backdrop-blur border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            Create Game
          </button>
        </div>
      </form>
    </div>
  );
}

export const QuickAddForm = memo(QuickAddFormImpl);
