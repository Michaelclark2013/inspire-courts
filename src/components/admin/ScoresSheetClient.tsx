"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { HorizontalBarList, BRAND } from "@/components/dashboard/Charts";

interface Game {
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
  homeScoreNum: number;
  awayScoreNum: number;
  winner: string;
  division: string;
  court: string;
  date: string;
  event: string;
}

interface Standing {
  team: string;
  wins: number;
  losses: number;
  pct: string;
}

interface Props {
  games: Game[];
  standings: Standing[];
}

export default function ScoresSheetClient({ games, standings }: Props) {
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("All");
  const [tab, setTab] = useState<"games" | "standings">("games");

  const divisions = useMemo(
    () => ["All", ...Array.from(new Set(games.map((g) => g.division))).filter(Boolean).sort()],
    [games]
  );

  const filtered = useMemo(() => {
    let list = games;
    if (divFilter !== "All") list = list.filter((g) => g.division === divFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.home.toLowerCase().includes(q) ||
          g.away.toLowerCase().includes(q) ||
          g.winner.toLowerCase().includes(q)
      );
    }
    return list;
  }, [games, search, divFilter]);

  const standingsData = standings.slice(0, 15).map((s) => ({
    label: s.team,
    value: s.wins,
    sublabel: `${s.wins}W – ${s.losses}L`,
    color: BRAND.red,
  }));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-secondary border border-border rounded-sm p-1 w-fit" role="tablist" aria-label="Scores view">
        {(["games", "standings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
            aria-controls={`${t}-panel`}
            className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "games" && (
        <div id="games-panel" role="tabpanel" aria-labelledby="games-tab">
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teams..."
                  aria-label="Search teams"
                  className="w-full bg-bg-secondary border border-border rounded-sm pl-8 pr-3 py-2 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
              </div>
              {/* Desktop division select */}
              <select
                value={divFilter}
                onChange={(e) => setDivFilter(e.target.value)}
                aria-label="Filter by division"
                className="hidden md:block bg-bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              >
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d === "All" ? "All Divisions" : d}
                  </option>
                ))}
              </select>
            </div>
            {/* Mobile division pills */}
            <div className="md:hidden flex gap-2 overflow-x-auto snap-x pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {divisions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDivFilter(d)}
                  className={`snap-start flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    divFilter === d
                      ? "bg-accent text-white"
                      : "bg-bg-secondary border border-border text-text-secondary"
                  }`}
                >
                  {d === "All" ? "All Divisions" : d}
                </button>
              ))}
            </div>
          </div>

          {/* Games container */}
          <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-text-secondary text-xs">{filtered.length} games</p>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-text-secondary text-sm">
                  No games match your filters.
                </p>
              ) : (
                filtered.map((game, i) => {
                  const homeWon =
                    game.winner &&
                    game.home !== "—" &&
                    game.winner.toLowerCase().includes(game.home.toLowerCase().split(" ")[0]);
                  const awayWon =
                    game.winner &&
                    game.away !== "—" &&
                    game.winner.toLowerCase().includes(game.away.toLowerCase().split(" ")[0]);
                  return (
                    <div key={i} className="px-4 py-3">
                      {/* Score display */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`flex-1 text-sm font-semibold truncate ${homeWon ? "text-white" : "text-text-secondary"}`}>
                          {game.home}
                          {homeWon && <span className="ml-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">W</span>}
                        </span>
                        <span className="font-mono font-bold text-white text-base px-2">
                          {game.homeScore !== "—" && game.awayScore !== "—" ? `${game.homeScore}–${game.awayScore}` : "vs"}
                        </span>
                        <span className={`flex-1 text-sm font-semibold truncate text-right ${awayWon ? "text-white" : "text-text-secondary"}`}>
                          {awayWon && <span className="mr-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">W</span>}
                          {game.away}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {game.division && game.division !== "—" && (
                          <span className="text-[10px] bg-bg px-2 py-0.5 rounded text-text-secondary">{game.division}</span>
                        )}
                        {game.court && game.court !== "—" && (
                          <span className="text-[10px] text-text-secondary">Court {game.court}</span>
                        )}
                        {game.date && game.date !== "—" && (
                          <span className="text-[10px] text-text-secondary ml-auto">{game.date}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Date", "Home", "Score", "Away", "Winner", "Division", "Court"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                        No games match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((game, i) => {
                      const homeWon =
                        game.winner &&
                        game.home !== "—" &&
                        game.winner.toLowerCase().includes(game.home.toLowerCase().split(" ")[0]);
                      const awayWon =
                        game.winner &&
                        game.away !== "—" &&
                        game.winner.toLowerCase().includes(game.away.toLowerCase().split(" ")[0]);
                      return (
                        <tr key={i} className="hover:bg-bg/40 transition-colors">
                          <td className="px-4 py-3 text-text-secondary text-xs">{game.date}</td>
                          <td className={`px-4 py-3 font-medium ${homeWon ? "text-white" : "text-text-secondary"}`}>
                            {game.home}
                            {homeWon && <span className="ml-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">W</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-mono font-bold text-white text-sm">
                              {game.homeScore !== "—" && game.awayScore !== "—" ? `${game.homeScore} – ${game.awayScore}` : "—"}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-medium ${awayWon ? "text-white" : "text-text-secondary"}`}>
                            {game.away}
                            {awayWon && <span className="ml-1.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">W</span>}
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs max-w-[120px] truncate">{game.winner}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-secondary">{game.division}</span>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{game.court}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "standings" && (
        <div id="standings-panel" role="tabpanel" aria-labelledby="standings-tab" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win leaderboard */}
          <div className="bg-bg-secondary border border-border rounded-sm p-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Win Leaderboard
            </h3>
            {standingsData.length > 0 ? (
              <HorizontalBarList
                data={standingsData}
                valueFormatter={(v) => `${v}W`}
              />
            ) : (
              <p className="text-text-secondary text-sm text-center py-8">
                Not enough data to compute standings.
              </p>
            )}
          </div>

          {/* Full standings table */}
          <div className="bg-bg-secondary border border-border rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Win / Loss Records
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["#", "Team", "W", "L", "Win%"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings.slice(0, 20).map((s, i) => (
                    <tr key={i} className="hover:bg-bg/40 transition-colors">
                      <td className="px-4 py-2.5 text-text-secondary text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-white">
                        {s.team}
                      </td>
                      <td className="px-4 py-2.5 text-success font-bold">
                        {s.wins}
                      </td>
                      <td className="px-4 py-2.5 text-danger font-bold">
                        {s.losses}
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">
                        {s.pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
