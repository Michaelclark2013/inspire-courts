import Link from "next/link";
import {
  Users,
  Trophy,
  DollarSign,
  UserCheck,
  ClipboardList,
  TrendingUp,
  Activity,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import CollapsibleSection from "@/components/admin/CollapsibleSection";
import KPICard from "@/components/dashboard/KPICard";
import DashboardCharts from "@/components/admin/DashboardCharts";
import DashboardAlerts from "@/components/admin/DashboardAlerts";
import DashboardDBStats from "@/components/admin/DashboardDBStats";
import DashboardLeads from "@/components/admin/DashboardLeads";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

async function getDashboardData() {
  const [teamsData, moneyData, playersData, scoresData] = await Promise.all([
    fetchSheetWithHeaders(SHEETS.masterTeams),
    fetchSheetWithHeaders(SHEETS.momMoney),
    fetchSheetWithHeaders(SHEETS.playerCheckIn),
    fetchSheetWithHeaders(SHEETS.gameScores),
  ]);

  // ── Teams by division ──────────────────────────────────────────────────────
  const divisionCounts: Record<string, number> = {};
  const DIVISION_COLS = ["Division", "Age Group", "Age", "Grade"];
  teamsData.rows.forEach((row) => {
    const div = getCol(row, ...DIVISION_COLS) || "Unknown";
    divisionCounts[div] = (divisionCounts[div] || 0) + 1;
  });

  // ── Revenue by source (Mom Money) ──────────────────────────────────────────
  let totalCash = 0;
  let totalCard = 0;
  let totalSquare = 0;
  const CASH_COLS = ["Cash", "Cash Amount", "Cash $"];
  const CARD_COLS = ["Card", "Credit Card", "Card Amount", "Debit"];
  const SQUARE_COLS = ["Square", "Square Amount", "Square $", "Venmo", "Zelle"];

  moneyData.rows.forEach((row) => {
    totalCash += parseFloat(getCol(row, ...CASH_COLS).replace(/[$,]/g, "") || "0") || 0;
    totalCard += parseFloat(getCol(row, ...CARD_COLS).replace(/[$,]/g, "") || "0") || 0;
    totalSquare += parseFloat(getCol(row, ...SQUARE_COLS).replace(/[$,]/g, "") || "0") || 0;
  });

  // Try "Total" column if sources don't parse
  const TOTAL_COLS = ["Total", "Amount", "Revenue", "Total $"];
  const totalRevenue = totalCash + totalCard + totalSquare ||
    moneyData.rows.reduce((sum, row) => {
      return sum + (parseFloat(getCol(row, ...TOTAL_COLS).replace(/[$,]/g, "") || "0") || 0);
    }, 0);

  // ── Players by division ────────────────────────────────────────────────────
  const playerDivCounts: Record<string, number> = {};
  const PLAYER_DIV_COLS = ["Division", "Age Group", "Team Division", "Grade Level"];
  playersData.rows.forEach((row) => {
    const div = getCol(row, ...PLAYER_DIV_COLS) || "Unknown";
    playerDivCounts[div] = (playerDivCounts[div] || 0) + 1;
  });

  // ── Recent game scores ─────────────────────────────────────────────────────
  const HOME_COLS = ["Home Team", "Home", "Team 1"];
  const AWAY_COLS = ["Away Team", "Away", "Team 2"];
  const HOME_SCORE_COLS = ["Home Score", "Score 1", "Home Points"];
  const AWAY_SCORE_COLS = ["Away Score", "Score 2", "Away Points"];
  const WINNER_COLS = ["Winner", "Winning Team", "Result"];
  const DIV_COLS = ["Division", "Age Group", "Division/Age"];
  const COURT_COLS = ["Court", "Court Number", "Court #"];
  const TIME_COLS = ["Timestamp", "Date", "Time", "Game Time"];

  const recentGames = scoresData.rows.slice(-10).reverse().map((row) => ({
    home: getCol(row, ...HOME_COLS) || "—",
    away: getCol(row, ...AWAY_COLS) || "—",
    homeScore: getCol(row, ...HOME_SCORE_COLS) || "—",
    awayScore: getCol(row, ...AWAY_SCORE_COLS) || "—",
    winner: getCol(row, ...WINNER_COLS) || "—",
    division: getCol(row, ...DIV_COLS) || "—",
    court: getCol(row, ...COURT_COLS) || "—",
    time: getCol(row, ...TIME_COLS) || "—",
  }));

  return {
    totalTeams: teamsData.rows.length,
    totalRevenue,
    totalCash,
    totalCard,
    totalSquare,
    totalPlayers: playersData.rows.length,
    totalGames: scoresData.rows.length,
    divisionCounts,
    playerDivCounts,
    recentGames,
  };
}

export default async function AdminDashboard() {
  const configured = isGoogleConfigured();

  if (!configured) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
            Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Inspire Courts AZ — Operations Overview
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-sm p-8 text-center">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">
            Connect Google Sheets
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Add your Google service account credentials to load live data from
            your Google Sheets — game scores, revenue, team registrations, and
            more.
          </p>
          <div className="bg-bg rounded-sm p-4 text-left max-w-sm mx-auto font-mono text-xs text-text-secondary space-y-1">
            <p className="text-accent"># Add to .env.local</p>
            <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=...</p>
            <p>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY..."</p>
          </div>
          <p className="text-text-secondary text-xs mt-4">
            Then share each Google Sheet with your service account email.
          </p>
        </div>
      </div>
    );
  }

  const data = await getDashboardData();

  const kpis = [
    {
      title: "Total Teams",
      value: data.totalTeams.toString(),
      icon: Users,
      trend: "Registered this season",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      trend: "Cash + Card + Square",
      trendUp: true,
    },
    {
      title: "Players Checked In",
      value: data.totalPlayers.toString(),
      icon: UserCheck,
    },
    {
      title: "Games Recorded",
      value: data.totalGames.toString(),
      icon: ClipboardList,
    },
  ];

  const divisionData = Object.entries(data.divisionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  const revenueData = [
    { label: "Cash", value: Math.round(data.totalCash) },
    { label: "Card", value: Math.round(data.totalCard) },
    { label: "Square/Venmo", value: Math.round(data.totalSquare) },
  ].filter((d) => d.value > 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-border/50 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-text-secondary text-xs mb-0.5">{greeting}</p>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
              Dashboard
            </h1>
          </div>
          <p className="text-text-secondary text-xs uppercase tracking-wider">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Tournament & Registration Overview (DB-powered) + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 mb-8">
        <DashboardDBStats />
        <DashboardAlerts />
      </div>

      {/* Charts row */}
      <CollapsibleSection title="Charts & Recent Scores">
        <DashboardCharts
          divisionData={divisionData}
          revenueData={revenueData}
          recentGames={data.recentGames}
          registrationRevenue={data.totalRevenue}
        />
      </CollapsibleSection>

      {/* Google Sheets KPIs */}
      <CollapsibleSection title="Google Sheets KPIs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Leads Pipeline */}
      <CollapsibleSection title="Leads Pipeline" defaultOpen={false}>
        <div className="mb-8">
          <DashboardLeads />
        </div>
      </CollapsibleSection>
    </div>
  );
}
