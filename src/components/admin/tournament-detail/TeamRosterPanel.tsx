"use client";

import { useState, memo } from "react";
import { Plus, Loader2, X } from "lucide-react";
import { type Team, type Player, parsePlayers } from "@/types/tournament-admin";

interface Props {
  team: Team;
  draft: boolean;
  onAddPlayer: (team: Team, players: Player[]) => Promise<void>;
  onRemovePlayer: (team: Team, players: Player[]) => Promise<void>;
}

function TeamRosterPanel({ team, draft, onAddPlayer, onRemovePlayer }: Props) {
  const [playerName, setPlayerName] = useState("");
  const [jersey, setJersey] = useState("");
  const [saving, setSaving] = useState(false);
  const players = parsePlayers(team.players);

  async function addPlayer() {
    if (!playerName.trim()) return;
    setSaving(true);
    try {
      const next = [
        ...players,
        { name: playerName.trim(), jersey: jersey.trim() },
      ];
      await onAddPlayer(team, next);
      setPlayerName("");
      setJersey("");
    } finally {
      setSaving(false);
    }
  }

  async function removePlayer(idx: number) {
    const next = players.filter((_, i) => i !== idx);
    await onRemovePlayer(team, next);
  }

  return (
    <div className="bg-off-white border-t border-border px-5 py-4">
      {players.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {players.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="flex items-center gap-2">
                {p.jersey && (
                  <span className="text-[10px] font-bold text-text-muted w-8 text-right tabular-nums">
                    #{p.jersey}
                  </span>
                )}
                <span className="text-navy font-medium">{p.name}</span>
              </div>
              {draft && (
                <button
                  onClick={() => removePlayer(i)}
                  aria-label={`Remove player ${p.name}`}
                  className="text-text-muted/50 hover:text-red transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            aria-label="Player name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlayer();
              }
            }}
            className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
          />
          <input
            type="text"
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            placeholder="#"
            aria-label="Jersey"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPlayer();
              }
            }}
            className="w-16 bg-white border border-border rounded-lg px-3 py-2 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red placeholder:text-text-muted/50"
          />
          <button
            onClick={addPlayer}
            disabled={saving || !playerName.trim()}
            aria-busy={saving}
            className="min-h-[40px] flex items-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            Add
          </button>
        </div>
      )}

      {players.length === 0 && !draft && (
        <p className="text-text-muted text-xs">No players added.</p>
      )}
    </div>
  );
}

export default memo(TeamRosterPanel);
