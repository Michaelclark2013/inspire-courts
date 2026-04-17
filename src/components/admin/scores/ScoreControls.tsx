"use client";

import { memo } from "react";
import { Minus, Plus } from "lucide-react";

function ScoreControlsImpl({
  label,
  value,
  onChange,
  teamName,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  teamName: string;
}) {
  return (
    <div>
      <label className="block text-navy/70 text-[10px] font-semibold uppercase tracking-wider mb-1 truncate">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${teamName} score`}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-off-white hover:bg-light-gray active:scale-95 border border-border rounded-lg text-navy font-bold transition-all focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          aria-label={`${teamName} score`}
          className="flex-1 min-w-0 w-full bg-off-white border border-border rounded-lg px-3 py-2.5 text-navy text-base text-center font-bold tabular-nums focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus:border-red"
        />
        <button
          type="button"
          aria-label={`Increase ${teamName} score`}
          onClick={() => onChange(value + 1)}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-off-white hover:bg-light-gray active:scale-95 border border-border rounded-lg text-navy font-bold transition-all focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export const ScoreControls = memo(ScoreControlsImpl);
