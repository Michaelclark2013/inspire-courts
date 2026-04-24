"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  Clock,
  CheckCircle2,
  Minus,
  Plus,
  User,
  AlertCircle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/capacitor";

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
  enteredByName: string | null;
  enteredAt: string | null;
  isMine: boolean;
};

function fmtTime(iso: string | null): string {
  if (!iso) return "TBD";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch { return iso; }
}

// Staff-facing "My games today" — lets scorekeepers add scores from
// their own phone without touching the admin panel. Each game they
// touch gets attributed to them in gameScores.updated_by so admin
// can see who worked each game.
export default function StaffGamesPage() {
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/portal/staff/my-games");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGames(data.games || []);
    } catch (err) { setError((err as Error).message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Segmented display: my games first, then the rest of today's games.
  const mine = (games || []).filter((g) => g.isMine);
  const others = (games || []).filter((g) => !g.isMine);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        href="/portal/staff"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Staff Portal
      </Link>

      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Score Entry</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-red" /> My Games Today
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Tap any game to add or update its score. Every save shows your name on the card so admin can verify who worked it.
          </p>
        </div>
      </section>

      {error && (
        <div className="bg-red/10 border border-red/20 text-red rounded-2xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {games === null ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center text-text-muted">Loading…</div>
      ) : games.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-bold">No games scheduled today.</p>
          <p className="text-text-muted text-sm mt-1">Come back on a tournament day.</p>
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <h2 className="text-navy font-bold text-xs uppercase tracking-widest">On Your Courts</h2>
              </div>
              <div className="space-y-2">
                {mine.map((g) => (
                  <GameRow
                    key={g.id}
                    game={g}
                    active={activeGameId === g.id}
                    onOpen={() => setActiveGameId(g.id === activeGameId ? null : g.id)}
                    onSaved={load}
                  />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-navy font-bold text-xs uppercase tracking-widest">All Today&apos;s Games</h2>
              </div>
              <div className="space-y-2">
                {others.map((g) => (
                  <GameRow
                    key={g.id}
                    game={g}
                    active={activeGameId === g.id}
                    onOpen={() => setActiveGameId(g.id === activeGameId ? null : g.id)}
                    onSaved={load}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GameRow({
  game, active, onOpen, onSaved,
}: {
  game: Game;
  active: boolean;
  onOpen: () => void;
  onSaved: () => void;
}) {
  const [homeScore, setHomeScore] = useState(game.homeScore);
  const [awayScore, setAwayScore] = useState(game.awayScore);
  const [quarter, setQuarter] = useState(game.lastQuarter || "");
  const [status, setStatus] = useState<Game["status"] | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHomeScore(game.homeScore);
    setAwayScore(game.awayScore);
    setQuarter(game.lastQuarter || "");
  }, [game.homeScore, game.awayScore, game.lastQuarter]);

  async function submit(finalize = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/staff/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          homeScore,
          awayScore,
          quarter: quarter || null,
          status: finalize ? "final" : status || (game.status === "scheduled" ? "live" : game.status),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Failed");
      }
      triggerHaptic("success");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      onSaved();
    } catch (err) {
      triggerHaptic("error");
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const statusStyle =
    game.status === "live" ? "bg-red/10 text-red" :
    game.status === "final" ? "bg-emerald-50 text-emerald-700" :
    "bg-off-white text-text-muted";

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${active ? "border-red/40" : "border-border"}`}>
      <button
        onClick={onOpen}
        className="w-full text-left p-4 flex items-center gap-3 active:bg-off-white transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-navy font-bold text-sm truncate">{game.homeTeam}</p>
            <span className="text-navy font-heading font-bold text-lg tabular-nums ml-auto">{game.homeScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-navy font-bold text-sm truncate flex-1">{game.awayTeam}</p>
            <span className="text-navy font-heading font-bold text-lg tabular-nums">{game.awayScore}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-text-muted flex-wrap">
            {game.court && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {game.court}</span>}
            {game.scheduledTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(game.scheduledTime)}</span>}
            {game.division && <span>{game.division}</span>}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle}`}>
              {game.status}
            </span>
            {game.isMine && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Your court
              </span>
            )}
          </div>
          {game.enteredByName && (
            <p className="text-text-muted text-[11px] mt-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              Last scored by <span className="text-navy font-semibold">{game.enteredByName}</span>
            </p>
          )}
        </div>
      </button>

      {active && (
        <div className="border-t border-border p-4 bg-off-white/40 space-y-3">
          {/* Quick +/- score buttons (mobile-first) */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreStepper label={game.homeTeam} value={homeScore} onChange={setHomeScore} />
            <ScoreStepper label={game.awayTeam} value={awayScore} onChange={setAwayScore} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-navy text-[10px] font-bold uppercase tracking-wider mb-1">Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
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
              <label className="block text-navy text-[10px] font-bold uppercase tracking-wider mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Game["status"] | "")}
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-navy text-sm focus:outline-none focus:border-red/60"
              >
                <option value="">Keep current ({game.status})</option>
                <option value="live">Live</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red/10 border border-red/20 text-red rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Saved — attributed to you.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => submit(false)}
              disabled={busy}
              className="flex-1 bg-navy hover:bg-navy/90 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl uppercase tracking-wider"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                if (confirm("Mark this game as FINAL? This is the official result.")) submit(true);
              }}
              disabled={busy}
              className="flex-1 bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl uppercase tracking-wider"
            >
              Finalize
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreStepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="bg-white border border-border rounded-xl p-2">
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-wider truncate">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="Decrement"
          className="w-9 h-9 rounded-full bg-off-white border border-border text-navy font-bold hover:bg-border active:scale-95 flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="flex-1 text-center text-navy font-heading font-bold text-2xl tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(999, value + 1))}
          aria-label="Increment"
          className="w-9 h-9 rounded-full bg-red text-white font-bold hover:bg-red-hover active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        <button
          onClick={() => onChange(Math.min(999, value + 2))}
          className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1 rounded-md bg-off-white hover:bg-border text-navy"
        >
          +2
        </button>
        <button
          onClick={() => onChange(Math.min(999, value + 3))}
          className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1 rounded-md bg-off-white hover:bg-border text-navy"
        >
          +3
        </button>
      </div>
    </div>
  );
}
