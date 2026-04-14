"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings2 } from "lucide-react";
import Link from "next/link";
import LiveScoreboard from "@/components/scores/LiveScoreboard";
import StandingsTable from "@/components/scores/StandingsTable";
import TournamentsList from "@/components/scores/TournamentsList";

const SCORE_ENTRY_ROLES = ["admin", "staff"];

export default function ScoresPageClient() {
  const [eventFilter, setEventFilter] = useState("");
  const { data: session } = useSession();
  const canEditScores = SCORE_ENTRY_ROLES.includes(
    (session?.user?.role as string) || ""
  );

  return (
    <>
      {/* Admin Score Entry Button */}
      {canEditScores && (
        <section className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/admin/scores/enter"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-red/20 to-red/10 border border-red/30 hover:border-red/50 text-red hover:text-white rounded-xl py-3 text-sm font-bold uppercase tracking-wider transition-all hover:bg-red/30"
            >
              <Settings2 className="w-4 h-4" />
              Update Scores — Admin Panel
            </Link>
          </div>
        </section>
      )}

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
          <LiveScoreboard eventFilter={eventFilter} canEditScores={canEditScores} />
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
