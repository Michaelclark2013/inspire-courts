"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

type Workout = {
  id: number;
  name: string;
  description: string | null;
  scoreType: "time" | "reps" | "weight" | "rounds" | "distance";
  category: string | null;
  resultCount: number;
};

export default function AdminWorkoutsPage() {
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

  const load = useCallback(async () => {
    const res = await fetch("/api/workouts", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setList(json.workouts || []);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name) return;
    setBusy(true);
    try {
      await fetch("/api/workouts", {
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

  if (loading) return <div className="p-8 text-text-muted">Loading…</div>;

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
    </div>
  );
}
