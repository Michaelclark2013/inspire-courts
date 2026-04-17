"use client";

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import type { TeamStatus } from "@/types/checkin";

interface TeamCardProps {
  team: TeamStatus;
  isExpanded: boolean;
  onToggle: () => void;
  onQuickCheckIn: (teamName: string, division: string) => void;
}

function TeamCardInner({
  team,
  isExpanded,
  onToggle,
  onQuickCheckIn,
}: TeamCardProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${team.teamName} - ${team.hasCheckedIn ? "checked in" : "not checked in"}`}
        className="w-full px-5 py-3 min-h-[44px] flex items-center gap-3 hover:bg-off-white transition-colors text-left focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-inset"
      >
        {/* Status dot */}
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${
            team.hasCheckedIn
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
              : "bg-red shadow-[0_0_6px_rgba(239,68,68,0.4)]"
          }`}
        />

        {/* Team info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-navy text-sm font-semibold truncate">
              {team.teamName}
            </p>
            {!team.isPaid && (
              <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase">
                Unpaid
              </span>
            )}
          </div>
          <p className="text-text-muted text-xs truncate">
            {team.coach} &middot; {team.division}
          </p>
        </div>

        {/* Player count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {team.checkedInCount > 0 && (
            <span className="text-emerald-600 text-xs font-bold">
              {team.checkedInCount} player
              {team.checkedInCount !== 1 ? "s" : ""}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded: show checked-in players */}
      {isExpanded && (
        <div className="px-5 pb-3 pl-11">
          {team.checkedInPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {team.checkedInPlayers.map((p, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-xs italic">
              No players checked in yet
            </p>
          )}
          <button
            onClick={() => onQuickCheckIn(team.teamName, team.division)}
            className="mt-2 text-[11px] text-red hover:text-red-hover font-semibold uppercase tracking-wider transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            + Check in a player for this team
          </button>
        </div>
      )}
    </div>
  );
}

const TeamCard = memo(TeamCardInner);
export default TeamCard;
