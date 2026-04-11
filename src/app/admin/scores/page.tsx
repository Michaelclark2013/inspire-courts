import NotionFallback from "@/components/dashboard/NotionFallback";
import ScoresClient from "@/components/admin/ScoresClient";
import { getGameScores, getProperty, isNotionConfigured } from "@/lib/notion";

export default async function ScoresPage() {
  if (!isNotionConfigured()) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Game Scores</h1>
          <p className="text-text-secondary text-sm mt-1">Game Results from Notion</p>
        </div>
        <NotionFallback type="no-key" entityName="game scores" />
      </div>
    );
  }

  const data = await getGameScores();

  const games = data.map((g: any) => {
    const date = getProperty(g, "Date") || getProperty(g, "Game Date") || "";
    return {
      home: getProperty(g, "Home Team") || getProperty(g, "Home") || "—",
      away: getProperty(g, "Away Team") || getProperty(g, "Away") || "—",
      score: getProperty(g, "Score") || getProperty(g, "Final Score") || "—",
      winner: getProperty(g, "Winner") || "—",
      court: getProperty(g, "Court") || "—",
      division: getProperty(g, "Division") || getProperty(g, "Age Group") || "—",
      date: date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
      time: getProperty(g, "Time") || getProperty(g, "Game Time") || "—",
      event: getProperty(g, "Event") || getProperty(g, "Tournament") || "—",
    };
  });

  if (games.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Game Scores</h1>
          <p className="text-text-secondary text-sm mt-1">Game Results from Notion</p>
        </div>
        <NotionFallback type="empty" entityName="game scores" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Game Scores</h1>
        <p className="text-text-secondary text-sm mt-1">Game Results from Notion</p>
      </div>
      <ScoresClient games={games} />
    </div>
  );
}
