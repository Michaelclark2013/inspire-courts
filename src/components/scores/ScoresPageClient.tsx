"use client";

import { useState } from "react";
import LiveScoreboard from "@/components/scores/LiveScoreboard";
import StandingsTable from "@/components/scores/StandingsTable";
import TournamentsList from "@/components/scores/TournamentsList";

export default function ScoresPageClient() {
  const [eventFilter, setEventFilter] = useState("");

  return (
    <>
      {/* Active Tournaments */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <TournamentsList
            selectedEvent={eventFilter}
            onSelectEvent={setEventFilter}
          />
        </div>
      </section>

      {/* Scoreboard */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <LiveScoreboard eventFilter={eventFilter} />
        </div>
      </section>

      {/* Standings */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-navy-light/40 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">
                League Standings
              </h2>
            </div>
            <StandingsTable eventFilter={eventFilter} />
          </div>
        </div>
      </section>
    </>
  );
}
