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
import AdminButtonGrid from "@/components/admin/dashboard/AdminButtonGrid";
import RecentSignupsCard from "@/components/admin/dashboard/RecentSignupsCard";
import GymScheduleCard from "@/components/admin/dashboard/GymScheduleCard";
import DashboardHero from "@/components/admin/dashboard/DashboardHero";
import TodayCard from "@/components/admin/dashboard/TodayCard";
import FleetAlertsCard from "@/components/admin/dashboard/FleetAlertsCard";
import AccessDeniedBanner from "@/components/admin/dashboard/AccessDeniedBanner";
import InstallPrompt from "@/components/admin/dashboard/InstallPrompt";
import LiveScoresStrip from "@/components/admin/dashboard/LiveScoresStrip";
import WidgetStrip from "@/components/admin/dashboard/WidgetStrip";
import FloorStatusCard from "@/components/admin/dashboard/FloorStatusCard";
import OpsAlertsCard from "@/components/admin/dashboard/OpsAlertsCard";
import RecentlyVisited from "@/components/admin/dashboard/RecentlyVisited";
import CheckinProgressCard from "@/components/admin/dashboard/CheckinProgressCard";
import PnLCard from "@/components/admin/dashboard/PnLCard";
import WeeklyDigestCard from "@/components/admin/dashboard/WeeklyDigestCard";
import { Suspense } from "react";
const PushNotificationPrompt = dynamic(() => import("@/components/pwa/PushNotificationPrompt"));
import { Users, DollarSign, UserCheck, ClipboardList } from "lucide-react";
import {
  fetchSheetWithHeaders,
  getCol,
  isGoogleConfigured,
  SHEETS,
} from "@/lib/google-sheets";

export const revalidate = 300;

async function getDashboardData() {
  // Per-sheet fallback: if any fetch fails, that sheet returns empty rows
  // so the dashboard can still render with partial data rather than crash.
  const empty = { rows: [] as Record<string, string>[] };
  const [teamsData, moneyData, playersData, scoresData] = await Promise.all([
    fetchSheetWithHeaders(SHEETS.masterTeams).catch(() => empty),
    fetchSheetWithHeaders(SHEETS.momMoney).catch(() => empty),
    fetchSheetWithHeaders(SHEETS.playerCheckIn).catch(() => empty),
    fetchSheetWithHeaders(SHEETS.gameScores).catch(() => empty),
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
      <div
        className="p-6 lg:p-8 pt-[max(env(safe-area-inset-top),1.5rem)]"
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
      </div>
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

  const dateLine = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="p-3 sm:p-6 lg:p-8 max-w-full"
      aria-labelledby="dashboard-heading"
    >
      {/* Mobile PWA install nudge (dismissable, once per device) */}
      <InstallPrompt />

      {/* Access-denied toast when a page redirect sends ?denied=<page> */}
      <Suspense fallback={null}>
        <AccessDeniedBanner />
      </Suspense>

      {/* Dramatic navy-gradient hero — greeting + bento KPIs */}
      <DashboardHero
        greeting={greeting}
        dateLine={dateLine}
        stats={{
          totalTeams: data.totalTeams,
          totalRevenue: data.totalRevenue,
          totalPlayers: data.totalPlayers,
          totalGames: data.totalGames,
        }}
      />

      {/* Refresh affordance — floats above the hero flow rather than
          stealing real estate at the top. */}
      <div className="flex items-center justify-end mb-4">
        <DashboardRefreshButton />
      </div>

      {/* Recently visited admin pages — MRU for speed */}
      <RecentlyVisited />

      {/* Live-now pulsing strip — only shows when a game is live */}
      <LiveScoresStrip />

      {/* 4-up mini widget strip: revenue this week, active tournament
          progress, 7-day signup spark, pending approvals */}
      <WidgetStrip />

      {/* Push notification opt-in */}
      <PushNotificationPrompt />

      {/* Team check-in progress for the active tournament — auto
          refreshes every 45s. Renders nothing when there's no active
          tournament. */}
      <CheckinProgressCard />

      {/* Profit & Loss — month revenue vs expenses with margin. */}
      <PnLCard />

      {/* Weekly digest shortcut — view or email-me the 7-day summary. */}
      <WeeklyDigestCard />

      {/* Court-by-court status + who's clocked in right now. Auto-
          refreshes every 30s. The core front-desk ops pair. */}
      <FloorStatusCard />

      {/* Operational alerts — expiring certs, today's birthdays, low
          stock, recent admin audits. Hidden when everything is healthy. */}
      <OpsAlertsCard />

      {/* Today at Inspire — live auto-refreshing operational view */}
      <TodayCard />

      {/* Fleet alerts — renders only when there are expiring docs /
          open damage, so the dashboard stays quiet on healthy days. */}
      <FleetAlertsCard />

      {/* Today's focus — gym schedule + new signups, side by side on wide
          screens so the owner sees what's happening + who joined at a glance. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
        <GymScheduleCard />
        <RecentSignupsCard />
      </div>

      {/* Quick-jump button wall — every admin section, big colored tiles,
          permission-gated. The spine of daily navigation. */}
      <section aria-label="Admin sections" className="mb-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] mb-1">
              Everything, organized
            </p>
            <h2 className="text-navy font-heading text-2xl sm:text-3xl font-bold tracking-tight">
              All Tools
            </h2>
          </div>
        </div>
        <AdminButtonGrid />
      </section>

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
    </div>
  );
}
