"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Plus, X } from "lucide-react";

type Workout = {
  id: number;
  name: string;
  description: string | null;
  scoreType: "time" | "reps" | "weight" | "rounds" | "distance";
  lowerIsBetter: boolean;
  category: string | null;
  resultCount: number;
};

type LeaderRow = {
  resultId: number;
  scoreNumeric: number;
  scoreDisplay: string | null;
  scoreNote: string | null;
  performedAt: string;
  memberId: number | null;
  userId: number | null;
  memberFirst: string | null;
  memberLast: string | null;
  userName: string | null;
};

const SCORE_LABELS: Record<Workout["scoreType"], string> = {
  time: "time (mm:ss)",
  reps: "reps",
  weight: "lbs",
  rounds: "rounds",
  distance: "meters",
};

export default function PortalWorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [active, setActive] = useState<Workout | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/workouts", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setWorkouts(json.workouts || []);
    }
    setLoading(false);
  }, []);

  const loadBoard = useCallback(async (id: number) => {
    const res = await fetch(`/api/workouts?id=${id}`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setLeaderboard(json.leaderboard || []);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (active) loadBoard(active.id); }, [active, loadBoard]);

  function parseScore(raw: string, scoreType: Workout["scoreType"]): number | null {
    if (scoreType === "time") {
      // Accept "4:32" or seconds.
      const m = raw.match(/^(\d+):(\d{1,2})$/);
      if (m) return Number(m[1]) * 60 + Number(m[2]);
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  async function postResult() {
    if (!active) return;
    const num = parseScore(score, active.scoreType);
    if (num === null) {
      setMsg("Enter a valid score.");
      return;
    }
    setPosting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/workouts/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: active.id,
          scoreNumeric: num,
          scoreDisplay: active.scoreType === "time" ? score : undefined,
          scoreNote: note || undefined,
        }),
      });
      if (res.ok) {
        setScore("");
        setNote("");
        setMsg("Posted ✓");
        await loadBoard(active.id);
      } else {
        setMsg("Failed to post. Try again.");
      }
    } finally {
      setPosting(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  if (loading) return <div className="p-8 text-text-muted">Loading workouts…</div>;

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Portal
      </Link>

      <div className="mb-5">
        <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Workouts</p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
          Leaderboards
        </h1>
        <p className="text-text-muted text-sm mt-1">Beat your number. See where you stand.</p>
      </div>

      {!active ? (
        workouts.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-12">No workouts yet — check back soon.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workouts.map((w) => (
              <li key={w.id}>
                <button
                  onClick={() => setActive(w)}
                  className="w-full text-left bg-white border border-border rounded-2xl p-4 hover:border-red/40 transition-colors shadow-sm"
                >
                  <p className="text-navy font-bold">{w.name}</p>
                  <p className="text-text-muted text-xs mt-1">
                    {w.category || "General"} · {w.resultCount} {w.resultCount === 1 ? "score" : "scores"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-navy font-bold text-lg">{active.name}</p>
                {active.description && <p className="text-text-muted text-sm mt-1">{active.description}</p>}
              </div>
              <button onClick={() => { setActive(null); setLeaderboard([]); }} className="text-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post result */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted mb-2">Log your score</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={SCORE_LABELS[active.scoreType]}
                  className="flex-1 min-w-[120px] bg-off-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="note (optional)"
                  className="flex-1 min-w-[120px] bg-off-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <button
                  onClick={postResult}
                  disabled={posting || !score}
                  className="bg-red hover:bg-red-hover disabled:opacity-50 text-white font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Post
                </button>
              </div>
              {msg && <p className="text-xs mt-2 text-emerald-700">{msg}</p>}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-off-white flex items-center gap-2 text-text-muted">
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">Leaderboard</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="p-6 text-text-muted text-sm text-center">Be first to post.</p>
            ) : (
              <ol className="divide-y divide-border">
                {leaderboard.map((r, i) => (
                  <li key={r.resultId} className="px-4 py-2.5 flex items-center gap-3">
                    <span className={`w-7 text-center text-sm font-bold ${
                      i === 0 ? "text-amber-500" : i === 1 ? "text-text-muted" : i === 2 ? "text-amber-700/60" : "text-text-muted"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-navy font-semibold truncate">
                        {r.memberFirst ? `${r.memberFirst} ${r.memberLast || ""}` : r.userName || "Anonymous"}
                      </p>
                      {r.scoreNote && <p className="text-xs text-text-muted truncate">{r.scoreNote}</p>}
                    </div>
                    <span className="text-navy font-bold font-mono">{r.scoreDisplay || r.scoreNumeric}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
