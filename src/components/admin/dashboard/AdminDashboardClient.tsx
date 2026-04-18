"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type {
  AdminDashboardSummary,
  AdminDashboardErrors,
} from "@/types/admin-dashboard";
import DashboardSkeleton from "./DashboardSkeleton";
import StalenessIndicator from "./StalenessIndicator";
import LiveGamesTicker from "./LiveGamesTicker";
import RegistrationKPIs from "./RegistrationKPIs";
import TournamentsList from "./TournamentsList";
import UpcomingGames from "./UpcomingGames";
import GettingStarted from "./GettingStarted";
import DashboardAlertsBar from "./DashboardAlertsBar";
import QuickActions from "./QuickActions";
import LeadsSummary from "./LeadsSummary";

// How often the dashboard re-fetches the summary endpoint.
// Keep in sync with the 30s stale-while-revalidate hint on /api/admin/dashboard/summary.
const DASHBOARD_REFRESH_MS = 30_000;

// Client orchestrator for the admin dashboard. Fetches the consolidated
// summary endpoint and renders all sub-components, handling loading,
// partial errors, abort-on-unmount, and refresh debouncing.
export default function AdminDashboardClient() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [errors, setErrors] = useState<AdminDashboardErrors>({
    summary: false,
    leads: false,
    live: false,
  });
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard/summary", {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error("summary fetch failed");
      const json: AdminDashboardSummary = await res.json();
      setData(json);
      setErrors({
        summary: false,
        leads: json.leads === null,
        live: false,
      });
      setLastFetched(new Date());
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setErrors((prev) => ({ ...prev, summary: true }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(() => fetchData(), DASHBOARD_REFRESH_MS);
    return () => {
      clearInterval(refreshInterval);
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const isEmpty = useMemo(() => {
    if (!data) return false;
    return (
      data.registrations.total === 0 &&
      data.liveGames === 0 &&
      data.tournamentStatus.length === 0
    );
  }, [data]);

  if (!data && !errors.summary) return <DashboardSkeleton />;

  if (errors.summary && !data) {
    return (
      <div
        className="bg-red/5 border border-red/20 rounded-sm p-6 text-center"
        role="alert"
      >
        <AlertTriangle
          className="w-8 h-8 text-red/60 mx-auto mb-2"
          aria-hidden="true"
        />
        <p className="text-navy font-semibold text-sm mb-1">
          Failed to load dashboard data
        </p>
        <p className="text-text-secondary text-xs mb-4">
          Check your connection and try again
        </p>
        <button
          type="button"
          onClick={fetchData}
          disabled={refreshing}
          className="bg-red hover:bg-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
        >
          {refreshing ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={refreshing}>
      <StalenessIndicator
        lastFetched={lastFetched}
        onRefresh={fetchData}
        refreshing={refreshing}
      />

      <DashboardAlertsBar alerts={data.alerts} />

      <LiveGamesTicker games={data.liveGamesDetail} />

      <RegistrationKPIs
        stats={data.registrations}
        liveGames={data.liveGames}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {isEmpty ? (
          <GettingStarted />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TournamentsList tournaments={data.tournamentStatus} />
            <UpcomingGames
              games={data.upcomingGames}
              activeAnnouncements={data.activeAnnouncements}
            />
          </div>
        )}
        <QuickActions />
      </div>

      {data.leads && data.leads.total > 0 && (
        <LeadsSummary counts={data.leads} />
      )}
    </div>
  );
}
