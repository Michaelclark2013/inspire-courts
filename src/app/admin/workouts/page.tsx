"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trophy } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { SkeletonRows } from "@/components/ui/SkeletonCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type Workout = {
  id: number;
  name: string;
  description: string | null;
  scoreType: "time" | "reps" | "weight" | "rounds" | "distance";
  category: string | null;
  resultCount: number;
};

export default function AdminWorkoutsPage() {
  useDocumentTitle("Workouts");
  const [list, setList] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    scoreType: "time" as Workout["scoreType"],
    category: "",
  });
  const [busy, setBusy] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/workouts", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setList(json.workouts || []);
        setLoadError(null);
      } else {
        const j = await res.json().catch(() => ({}));
        setLoadError(j.error || `Couldn't load workouts (${res.status}).`);
      }
    } catch (err) {
      if ((err as Error)?.name !== "SessionExpiredError") {
        setLoadError("Network error loading workouts.");
      }
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name) return;
    setBusy(true);
    try {
      await adminFetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ name: "", description: "", scoreType: "time", category: "" });
      setCreating(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-8"><SkeletonRows count={6} /></div>;
  if (loadError && list.length === 0) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="bg-red/5 border border-red/20 text-red rounded-2xl p-6 text-center">
          <p className="font-bold mb-1">Couldn&apos;t load workouts</p>
          <p className="text-sm">{loadError}</p>
          <button
            onClick={load}
            className="mt-3 inline-flex items-center gap-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-text-muted text-[11px] uppercase tracking-[0.2em] mb-1">Workouts</p>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-navy font-heading">
            Workout library
          </h1>
        </div>
        <button onClick={() => setCreating(!creating)} className="bg-red hover:bg-red-hover text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {creating && (
        <div className="bg-white border border-border rounded-2xl p-4 mb-5 shadow-sm space-y-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name (e.g. Fran, 5K Row, Max Free Throws)"
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description / instructions"
            className="w-full bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.scoreType}
              onChange={(e) => setForm({ ...form, scoreType: e.target.value as Workout["scoreType"] })}
              className="bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="time">Time (lower = better)</option>
              <option value="reps">Reps (higher = better)</option>
              <option value="weight">Weight lbs (higher = better)</option>
              <option value="rounds">Rounds (higher = better)</option>
              <option value="distance">Distance m (higher = better)</option>
            </select>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category (optional)"
              className="bg-off-white border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={busy || !form.name} className="bg-navy text-white font-bold uppercase tracking-wider px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {busy ? "Creating…" : "Create"}
            </button>
            <button onClick={() => setCreating(false)} className="text-text-muted text-sm">Cancel</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-off-white border border-border rounded-2xl p-8 text-center">
          <Trophy className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-navy font-bold mb-1">No workouts yet.</p>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            Create benchmark WODs (&quot;Fran&quot;, &quot;Max free throws / min&quot;)
            and members can post results from <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded">/portal/workouts</code>.
            Leaderboards rank per workout — coaches use them as &quot;come back next
            week and beat your number&quot; retention hooks.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-4 bg-red hover:bg-red-hover text-white font-bold uppercase tracking-wider px-4 py-2 rounded-lg text-sm"
          >
            Create your first workout
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((w) => (
            <li key={w.id} className="bg-white border border-border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-navy font-semibold">{w.name}</p>
                <p className="text-xs text-text-muted">{w.category || "—"} · {w.scoreType} · {w.resultCount} results</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
