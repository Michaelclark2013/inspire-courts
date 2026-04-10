import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DataTable from "@/components/dashboard/DataTable";

export default async function ScoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const scores = [
    { gameId: "RR-001", tournament: "Red Rock Invitational", division: "15U Boys", home: "AZ Scorpions", away: "Mesa Heat", score: "52-48", court: "Court 1", date: "Apr 12, 2025" },
    { gameId: "RR-002", tournament: "Red Rock Invitational", division: "12U Boys", home: "East Valley Elite", away: "Chandler Cobras", score: "38-32", court: "Court 2", date: "Apr 12, 2025" },
    { gameId: "RR-003", tournament: "Red Rock Invitational", division: "14U Girls", home: "Gilbert Lady Ballers", away: "Phoenix Rising", score: "44-40", court: "Court 1", date: "Apr 12, 2025" },
  ];

  const columns = [
    { key: "gameId", label: "Game ID" },
    { key: "tournament", label: "Tournament" },
    { key: "division", label: "Division" },
    { key: "home", label: "Home" },
    { key: "away", label: "Away" },
    { key: "score", label: "Score" },
    { key: "court", label: "Court" },
    { key: "date", label: "Date" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white">
          Game Scores
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Game Scores Log from Notion
        </p>
      </div>
      <div className="bg-bg-secondary border border-border rounded-sm p-5">
        <DataTable columns={columns} data={scores} searchKey="tournament" searchPlaceholder="Search by tournament..." />
      </div>
    </div>
  );
}
