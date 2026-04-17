import Link from "next/link";
import { Activity } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CollapsibleSection from "@/components/admin/CollapsibleSection";
import KPICard from "@/components/dashboard/KPICard";
import DashboardRefreshButton from "@/components/admin/DashboardRefreshButton";
import dynamic from "next/dynamic";
const DashboardCharts = dynamic(() => import("@/components/admin/DashboardCharts"));
import AdminDashboardClient from "@/components/admin/dashboard/AdminDashboardClient";
import PushNotificationPrompt from "@/components/pwa/PushNotificationPrompt";
import { Users, DollarSign, UserCheck, ClipboardList } from "lucide-react";
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

  const divisionCounts: Record<string, number> = {};
  const DIVISION_COLS = ["Division", "Age Group", "Age", "Grade"];
  teamsData.rows.forEach((row) => {
    const div = getCol(row, ...DIVISION_COLS) || "Unknown";
    divisionCounts[div] = (divisionCounts[div] || 0) + 1;
  });

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

  const TOTAL_COLS = ["Total", "Amount", "Revenue", "Total $"];
  const totalRevenue =
    totalCash + totalCard + totalSquare ||
    moneyData.rows.reduce((sum, row) => {
      return (
        sum +
        (parseFloat(getCol(row, ...TOTAL_COLS).replace(/[$,]/g, "") || "0") || 0)
      );
    }, 0);

  const HOME_COLS = ["Home Team", "Home", "Team 1"];
  const AWAY_COLS = ["Away Team", "Away", "Team 2"];
  const HOME_SCORE_COLS = ["Home Score", "Score 1", "Home Points"];
  const AWAY_SCORE_COLS = ["Away Score", "Score 2", "Away Points"];
  const WINNER_COLS = ["Winner", "Winning Team", "Result"];
  const DIV_COLS = ["Division", "Age Group", "Division/Age"];
  const COURT_COLS = ["Court", "Court Number", "Court #"];
  const TIME_COLS = ["Timestamp", "Date", "Time", "Game Time"];

  const recentGames = scoresData.rows
    .slice(-10)
    .reverse()
    .map((row) => ({
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
    recentGames,
  };
}

export default async function AdminDashboard() {
  const configured = isGoogleConfigured();

  if (!configured) {
    return (
      <main
        className="p-6 lg:p-8 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        aria-labelledby="dashboard-heading"
      >
        <header className="mb-8">
          <h1
            id="dashboard-heading"
            className="text-2xl font-bold uppercase tracking-tight text-navy font-heading"
          >
            Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Inspire Courts AZ — Operations Overview
          </p>
        </header>

        <section className="bg-white border border-light-gray shadow-sm rounded-xl p-8 text-center">
          <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-red" aria-hidden="true" />
          </div>
          <h2 className="text-navy font-bold text-lg mb-2">
            Connect Google Sheets
          </h2>
          <p className="text-text-secondary text-sm max-w-md mx-auto mb-6">
            Add your Google service account credentials to load live data from
            your Google Sheets — game scores, revenue, team registrations, and
            more.
          </p>
          <div className="bg-off-white border border-light-gray rounded-xl p-4 text-left max-w-sm mx-auto font-mono text-xs text-text-secondary space-y-1">
            <p className="text-red"># Add to .env.local</p>
            <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=...</p>
            <p>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY...&quot;</p>
          </div>
          <p className="text-text-secondary text-xs mt-4">
            Then share each Google Sheet with your service account email.
          </p>
          <p className="mt-6 text-text-secondary text-xs">
            Meanwhile, your DB-powered dashboard still works below.
          </p>
          <div className="mt-6">
            <AdminDashboardClient />
          </div>
        </section>
      </main>
    );
  }

  const data = await getDashboardData();

  const kpis = [
    {
      title: "Total Teams",
      value: data.totalTeams.toLocaleString(),
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
      value: data.totalPlayers.toLocaleString(),
      icon: UserCheck,
    },
    {
      title: "Games Recorded",
      value: data.totalGames.toLocaleString(),
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

  const session = await getServerSession(authOptions);
  const firstName = session?.user?.name?.split(" ")[0] || "";
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greeting = firstName ? `${timeGreeting}, ${firstName}` : timeGreeting;

  return (
    <main
      className="p-3 sm:p-6 lg:p-8 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),1rem)]"
      aria-labelledby="dashboard-heading"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-light-gray/60 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3 lg:py-4 mb-4 lg:mb-8">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-text-secondary text-[10px] lg:text-xs mb-0.5">
              {greeting}
            </p>
            <h1
              id="dashboard-heading"
              className="text-xl lg:text-2xl font-bold uppercase tracking-tight text-navy font-heading"
            >
              Dashboard
            </h1>
            <p className="text-text-secondary text-[10px] lg:text-xs mt-0.5 hidden sm:block">
              {data.totalTeams} teams &middot; {data.totalGames} games &middot; {data.totalPlayers} players checked in
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardRefreshButton />
            <p className="text-text-secondary text-[10px] lg:text-xs uppercase tracking-wider text-right hidden sm:block">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Push notification opt-in */}
      <PushNotificationPrompt />

      {/* DB-powered overview (consolidated summary endpoint) */}
      <section aria-label="Overview" className="mb-8">
        <AdminDashboardClient />
      </section>

      {/* Charts & Recent Scores */}
      <CollapsibleSection
        title={`Charts & Recent Scores · last ${data.recentGames.length} games`}
      >
        <DashboardCharts
          divisionData={divisionData}
          revenueData={revenueData}
          recentGames={data.recentGames}
          registrationRevenue={data.totalRevenue}
        />
      </CollapsibleSection>

      {/* Google Sheets KPIs */}
      <CollapsibleSection title={`Google Sheets KPIs · ${kpis.length} sources`}>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-3 sm:-mx-0 px-3 sm:px-0 pb-3 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 mb-3 lg:mb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.title}
              className={`snap-start flex-shrink-0 lg:w-auto ${i === 0 ? "w-[75%]" : "w-[60%]"}`}
            >
              <KPICard {...kpi} />
            </div>
          ))}
        </div>
        <p className="text-text-secondary text-[10px] mb-8">
          Sourced from Google Sheets · cached up to 5 min (revalidate: 300s)
        </p>
      </CollapsibleSection>

      {/* Quick link to leads (detail live inside AdminDashboardClient when leads exist) */}
      <CollapsibleSection title="Leads Pipeline" defaultOpen={false}>
        <p className="text-text-secondary text-xs mb-4">
          Open the{" "}
          <Link
            href="/admin/leads"
            prefetch
            className="text-red font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
          >
            full leads pipeline
          </Link>{" "}
          to view contacts, statuses, and follow-ups.
        </p>
      </CollapsibleSection>
    </main>
  );
}
