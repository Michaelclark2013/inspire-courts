import { memo } from "react";
import type { GameStatus } from "@/types/score-entry";

const STATUS_STYLES: Record<GameStatus, string> = {
  scheduled: "bg-gray-100 text-gray-700",
  live: "bg-emerald-100 text-emerald-700 animate-pulse",
  final: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<GameStatus, string> = {
  scheduled: "\u23F3 ",
  live: "\u25CF ",
  final: "\u2713 ",
};

function GameStatusBadgeImpl({ status }: { status: GameStatus }) {
  return (
    <span
      role="status"
      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}
    >
      <span aria-hidden="true">{STATUS_ICONS[status]}</span>{status}
    </span>
  );
}

export const GameStatusBadge = memo(GameStatusBadgeImpl);
