"use client";

import { memo } from "react";
import Link from "next/link";
import { Clock, ClipboardList, Megaphone } from "lucide-react";
import type { AdminUpcomingGame } from "@/types/admin-dashboard";

function UpcomingGames({
  games,
  activeAnnouncements,
}: {
  games: AdminUpcomingGame[];
  activeAnnouncements: number;
}) {
  return (
    <section
      className="bg-white border border-light-gray shadow-sm rounded-sm overflow-hidden"
      aria-labelledby="upcoming-games-heading"
    >
      <div className="px-5 py-3 border-b border-light-gray flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-600" aria-hidden="true" />
          <h3
            id="upcoming-games-heading"
            className="text-navy font-bold text-xs uppercase tracking-wider"
          >
            Upcoming Games
          </h3>
        </div>
        {activeAnnouncements > 0 && (
          <Link
            href="/admin/announcements"
            prefetch
            className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold hover:text-amber-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
          >
            <Megaphone className="w-3 h-3" aria-hidden="true" />
            {activeAnnouncements} announcement{activeAnnouncements !== 1 ? "s" : ""}
          </Link>
        )}
      </div>
      {games.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-cyan-600/60" aria-hidden="true" />
          </div>
          <p className="text-navy font-semibold text-sm mb-1">No Games Scheduled</p>
          <p className="text-text-secondary text-xs mb-4">
            Games will appear here once you create a tournament and set up the bracket
          </p>
          <Link
            href="/admin/scores/enter"
            prefetch
            className="inline-flex items-center gap-2 bg-off-white hover:bg-light-gray text-navy text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
          >
            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" /> Add a Game
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Upcoming games</caption>
            <thead>
              <tr className="border-b border-light-gray text-text-secondary text-[10px] uppercase tracking-wider">
                <th scope="col" className="text-left px-4 py-2 font-semibold">Time</th>
                <th scope="col" className="text-left px-4 py-2 font-semibold">Matchup</th>
                <th scope="col" className="text-left px-4 py-2 font-semibold">Court</th>
                <th scope="col" className="text-left px-4 py-2 font-semibold">Div</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const minutesUntil = g.scheduledTime
                  ? Math.round(
                      (new Date(g.scheduledTime).getTime() - Date.now()) / 60000
                    )
                  : null;
                const isSoon =
                  minutesUntil !== null && minutesUntil > 0 && minutesUntil <= 30;
                return (
                  <tr
                    key={g.id}
                    className={`border-b border-light-gray hover:bg-off-white transition-colors ${isSoon ? "bg-amber-50" : ""}`}
                  >
                    <td
                      className={`px-4 py-2 text-xs whitespace-nowrap ${isSoon ? "text-amber-700 font-semibold" : "text-text-secondary"}`}
                    >
                      {isSoon
                        ? `In ${minutesUntil} min`
                        : g.scheduledTime
                          ? new Date(g.scheduledTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "TBD"}
                    </td>
                    <td className="px-4 py-2 text-navy text-xs font-semibold whitespace-nowrap">
                      {g.homeTeam} vs {g.awayTeam}
                    </td>
                    <td className="px-4 py-2 text-text-secondary text-xs">
                      {g.court || "—"}
                    </td>
                    <td className="px-4 py-2 text-text-secondary text-xs">
                      {g.division || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default memo(UpcomingGames);
