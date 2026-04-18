"use client";

import { useState, memo } from "react";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  format: string;
  divisions: string[];
  onAdd: (payload: {
    teamName: string;
    seed?: number;
    poolGroup?: string;
    division?: string;
  }) => Promise<void>;
}

function AddTeamForm({ format, divisions, onAdd }: Props) {
  const [teamName, setTeamName] = useState("");
  const [seed, setSeed] = useState("");
  const [pool, setPool] = useState("");
  const [division, setDivision] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        teamName: teamName.trim(),
        seed: seed ? Number(seed) : undefined,
        poolGroup: pool || undefined,
        division: division || undefined,
      });
      setTeamName("");
      setSeed("");
      setPool("");
      setDivision("");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "bg-off-white border border-border rounded-lg px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50";

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-border shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4 text-red" aria-hidden="true" /> Add Team
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team name *"
          required
          aria-label="Team name"
          className={inputCls}
        />
        <input
          type="number"
          min={1}
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Seed #"
          aria-label="Seed"
          className={inputCls}
        />
        {format === "pool_play" && (
          <input
            type="text"
            value={pool}
            onChange={(e) => setPool(e.target.value)}
            placeholder="Pool (A, B...)"
            aria-label="Pool"
            className={inputCls}
          />
        )}
        {divisions.length > 0 && (
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            aria-label="Division"
            className={`${inputCls} cursor-pointer`}
          >
            <option value="">Division</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="min-h-[44px] flex items-center justify-center gap-2 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="w-4 h-4" aria-hidden="true" />
          )}
          Add
        </button>
      </div>
    </form>
  );
}

export default memo(AddTeamForm);
