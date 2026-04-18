"use client";

import { memo, useMemo, useState } from "react";
import { Users, Trash2, UserPlus, ChevronDown } from "lucide-react";
import { type Team, type Player, parsePlayers } from "@/types/tournament-admin";
import TeamRosterPanel from "./TeamRosterPanel";

interface Props {
  teams: Team[];
  draft: boolean;
  confirmRemoveId: number | null;
  onRequestRemove: (id: number | null) => void;
  onConfirmRemove: (id: number) => Promise<void>;
  onAddPlayer: (team: Team, players: Player[]) => Promise<void>;
  onRemovePlayer: (team: Team, players: Player[]) => Promise<void>;
}

const TeamRow = memo(function TeamRow({
  team,
  draft,
  expanded,
  confirming,
  onToggleExpand,
  onRequestRemove,
  onConfirmRemove,
  onAddPlayer,
  onRemovePlayer,
}: {
  team: Team;
  draft: boolean;
  expanded: boolean;
  confirming: boolean;
  onToggleExpand: () => void;
  onRequestRemove: (id: number | null) => void;
  onConfirmRemove: (id: number) => Promise<void>;
  onAddPlayer: (team: Team, players: Player[]) => Promise<void>;
  onRemovePlayer: (team: Team, players: Player[]) => Promise<void>;
}) {
  const playerCount = parsePlayers(team.players).length;
  return (
    <div>
      <div className="px-5 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span className="text-text-muted text-xs font-bold w-6 text-center tabular-nums flex-shrink-0">
            #{team.seed ?? "—"}
          </span>
          <span
            className={`text-sm font-semibold ${team.eliminated ? "text-navy/30 line-through" : "text-navy"}`}
          >
            {team.teamName}
          </span>
          {team.division && (
            <span className="text-[10px] bg-red/10 text-red px-1.5 py-0.5 rounded font-bold flex-shrink-0">
              {team.division}
            </span>
          )}
          {team.poolGroup && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
              Pool {team.poolGroup}
            </span>
          )}
          <button
            onClick={onToggleExpand}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-navy font-semibold uppercase tracking-wide transition-colors ml-1 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
          >
            <UserPlus className="w-3 h-3" aria-hidden="true" />
            {playerCount > 0
              ? `${playerCount} player${playerCount !== 1 ? "s" : ""}`
              : "Roster"}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
        {draft && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {confirming ? (
              <>
                <span className="text-[10px] text-text-muted">Remove?</span>
                <button
                  onClick={() => onConfirmRemove(team.id)}
                  className="text-[10px] font-bold uppercase bg-red text-white px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
                >
                  Yes
                </button>
                <button
                  onClick={() => onRequestRemove(null)}
                  className="text-[10px] font-bold uppercase bg-gray-100 text-navy px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
                >
                  No
                </button>
              </>
            ) : (
              <button
                onClick={() => onRequestRemove(team.id)}
                aria-label={`Remove ${team.teamName}`}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted/50 hover:text-red transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      {expanded && (
        <TeamRosterPanel
          team={team}
          draft={draft}
          onAddPlayer={onAddPlayer}
          onRemovePlayer={onRemovePlayer}
        />
      )}
    </div>
  );
});

function TeamsList({
  teams,
  draft,
  confirmRemoveId,
  onRequestRemove,
  onConfirmRemove,
  onAddPlayer,
  onRemovePlayer,
}: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const grouped = useMemo(() => {
    // Sort by seed (nulls last), keep division grouping via label
    return [...teams].sort((a, b) => {
      if (a.seed == null && b.seed == null) return 0;
      if (a.seed == null) return 1;
      if (b.seed == null) return -1;
      return a.seed - b.seed;
    });
  }, [teams]);

  return (
    <div className="bg-white border border-border shadow-sm rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Users className="w-4 h-4 text-red" aria-hidden="true" />
        <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
          Teams ({teams.length})
        </h2>
      </div>
      {teams.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-text-muted text-sm mb-1">No teams added yet</p>
          {draft && (
            <p className="text-text-muted/70 text-xs">
              Use the form above to add your first team.
            </p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {grouped.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              draft={draft}
              expanded={expandedId === team.id}
              confirming={confirmRemoveId === team.id}
              onToggleExpand={() =>
                setExpandedId((cur) => (cur === team.id ? null : team.id))
              }
              onRequestRemove={onRequestRemove}
              onConfirmRemove={onConfirmRemove}
              onAddPlayer={onAddPlayer}
              onRemovePlayer={onRemovePlayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(TeamsList);
