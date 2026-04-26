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
import OpsPulseSections from "@/components/admin/dashboard/OpsPulseSections";
import { Suspense } from "react";
const PushNotificationPrompt = dynamic(() => import("@/components/pwa/PushNotificationPrompt"));
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
  // Google Sheets is optional. When unconfigured, the dashboard still
  // renders with zeros for the Sheets-derived KPIs — the admin landing
  // is now navigation-first ("show every menu option") so KPIs are
  // secondary. Removed the previous "Connect Google Sheets" gate that
  // hid the entire dashboard until creds were set.
  const data = isGoogleConfigured()
    ? await getDashboardData()
    : {
        totalTeams: 0,
        totalRevenue: 0,
        totalCash: 0,
        totalCard: 0,
        totalSquare: 0,
        totalPlayers: 0,
        totalGames: 0,
        divisionCounts: {} as Record<string, number>,
        recentGames: [] as Array<{ home: string; away: string; homeScore: string; awayScore: string; winner: string; division: string; court: string; time: string }>,
      };

  // Lucide icon function refs can't cross the RSC boundary into
  // KPICard ("use client") — pass the string name and let KPICard
  // resolve it. (Was previously throwing "Functions cannot be passed
  // directly to Client Components" on every /admin render.)
  const kpis = [
    {
      title: "Total Teams",
      value: data.totalTeams.toLocaleString(),
      iconName: "users" as const,
      trend: "Registered this season",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      iconName: "dollar" as const,
      trend: "Cash + Card + Square",
      trendUp: true,
    },
    {
      title: "Players Checked In",
      value: data.totalPlayers.toLocaleString(),
      iconName: "user-check" as const,
    },
    {
      title: "Games Recorded",
      value: data.totalGames.toLocaleString(),
      iconName: "clipboard-list" as const,
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-full">
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

      {/* Refresh affordance — desktop only, hidden on mobile to save
          a full row of empty vertical space. Pull-to-refresh handles
          the mobile case via the browser's native behavior. */}
      <div className="hidden sm:flex items-center justify-end mb-4">
        <DashboardRefreshButton />
      </div>

      {/* Recently visited admin pages — MRU for speed */}
      <RecentlyVisited />

      {/* 4-up mini widget strip — quick glance KPIs */}
      <WidgetStrip />

      {/* Quick-jump button wall moves up front — nav is the #1 ask on
          mobile. Everything below is insight-side and gets tabbed on
          mobile to avoid infinite scroll. */}
      <section aria-label="Admin sections" className="mb-6">
        <AdminButtonGrid />
      </section>

      {/* Push notification opt-in */}
      <PushNotificationPrompt />

      {/* Insight cards — stacked on desktop, tabbed on mobile so the
          dashboard stays short. Groups:
            · Live      — LiveScores + Check-in progress + Floor status
            · Money     — P&L + Weekly digest + Fleet alerts
            · Alerts    — Ops alerts + Today feed
            · Schedule  — Gym calendar + Recent signups
       */}
      <OpsPulseSections
        live={
          <>
            <LiveScoresStrip />
            <CheckinProgressCard />
            <FloorStatusCard />
          </>
        }
        finance={
          <>
            <PnLCard />
            <WeeklyDigestCard />
            <FleetAlertsCard />
          </>
        }
        alerts={
          <>
            <OpsAlertsCard />
            <TodayCard />
          </>
        }
        schedule={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-8">
            <GymScheduleCard />
            <RecentSignupsCard />
          </div>
        }
      />

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
