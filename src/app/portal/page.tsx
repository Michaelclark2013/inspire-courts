"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  FileCheck,
  RefreshCw,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/PullToRefreshIndicator";
import { usePortalView } from "@/components/portal/PortalViewContext";
import { ActionCard } from "@/components/portal/ActionCard";
import { DashboardSkeleton } from "@/components/portal/DashboardSkeleton";
import { LiveGamesBanner } from "@/components/portal/LiveGamesBanner";
import { MyRegistrationsList } from "@/components/portal/MyRegistrationsList";
import { PortalAnnouncements } from "@/components/portal/PortalAnnouncements";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { RecentResults } from "@/components/portal/RecentResults";
import { RegistrationProgress } from "@/components/portal/RegistrationProgress";
import { ViewAsBanner } from "@/components/portal/ViewAsBanner";
import PushNotificationPrompt from "@/components/pwa/PushNotificationPrompt";
import type {
  Announcement,
  LiveGame,
  PortalErrors,
  Registration,
  RegistrationStep,
} from "@/types/portal";

export default function PortalDashboard() {
  const { data: session } = useSession();
  const { viewAsRole } = usePortalView();

  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [rosterCount, setRosterCount] = useState<number | null>(null);
  const [waiverSubmitted, setWaiverSubmitted] = useState(false);
  const [portalAnnouncements, setPortalAnnouncements] = useState<Announcement[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [errors, setErrors] = useState<PortalErrors>({
    games: false,
    announcements: false,
    registrations: false,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const actualRole = session?.user?.role;
  const role = actualRole === "admin" && viewAsRole ? viewAsRole : actualRole;
  const name = session?.user?.name?.split(" ")[0] || "there";

  const fetchData = useCallback(async () => {
    // Cancel any in-flight request so the retry button can't stampede the API.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setIsFetching(true);
    try {
      const res = await fetch("/api/portal/summary", { signal });
      if (!res.ok) throw new Error(`summary ${res.status}`);
      const data = await res.json();

      if (signal.aborted) return;

      setLiveGames(Array.isArray(data.liveGames) ? data.liveGames : []);
      setPortalAnnouncements(Array.isArray(data.announcements) ? data.announcements : []);
      setMyRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
      if (typeof data.rosterCount === "number") setRosterCount(data.rosterCount);
      else if (data.rosterCount === null) setRosterCount(null);
      setWaiverSubmitted(Boolean(data.waiverSubmitted));

      setErrors({ games: false, announcements: false, registrations: false });
      setLastUpdated(new Date());
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      // Fall back to per-endpoint fetches so a partial outage still shows what it can.
      const [gamesRes, announcementsRes, registrationsRes] = await Promise.allSettled([
        fetch("/api/scores/live", { signal }).then((r) => r.json()),
        fetch("/api/portal/announcements", { signal }).then((r) => r.json()),
        fetch("/api/portal/registrations", { signal }).then((r) => r.json()),
      ]);
      if (signal.aborted) return;

      const nextErrors: PortalErrors = { games: false, announcements: false, registrations: false };

      if (gamesRes.status === "fulfilled" && Array.isArray(gamesRes.value)) {
        setLiveGames(gamesRes.value);
      } else {
        nextErrors.games = true;
      }
      if (announcementsRes.status === "fulfilled" && Array.isArray(announcementsRes.value)) {
        setPortalAnnouncements(announcementsRes.value);
      } else {
        nextErrors.announcements = true;
      }
      if (
        registrationsRes.status === "fulfilled" &&
        Array.isArray(registrationsRes.value)
      ) {
        setMyRegistrations(registrationsRes.value);
      } else {
        nextErrors.registrations = true;
      }
      setErrors(nextErrors);
      setLastUpdated(new Date());
    } finally {
      if (!signal.aborted) {
        setIsFetching(false);
        setIsInitialLoad(false);
      }
    }
  }, []);

  useVisibilityPolling(fetchData, 30_000);

  const { pullDistance, refreshing: pullRefreshing, progress: pullProgress } = usePullToRefresh({
    onRefresh: fetchData,
  });

  // Cleanup: abort any in-flight fetches on unmount.
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Memoized derived values
  const liveNow = useMemo(() => liveGames.filter((g) => g.status === "live"), [liveGames]);
  const finalGames = useMemo(() => liveGames.filter((g) => g.status === "final"), [liveGames]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const registrationSteps: RegistrationStep[] = useMemo(() => {
    if (role !== "coach") return [];
    return [
      {
        label: "Submit Waiver",
        description: "Required for all players before game day",
        href: "/portal/waiver",
        done: waiverSubmitted,
        icon: FileCheck,
      },
      {
        label: "Upload Roster",
        description: "Add all players to your team",
        href: "/portal/roster",
        done: (rosterCount ?? 0) >= 1,
        icon: Users,
      },
      {
        label: "Team Check-In",
        description: "Check in your players on game day",
        href: "/portal/checkin",
        done: false,
        icon: UserCheck,
      },
      {
        label: "Confirm Payment",
        description: "Contact admin to confirm tournament entry",
        href: "/portal/profile",
        done: false,
        icon: CreditCard,
      },
    ];
  }, [role, waiverSubmitted, rosterCount]);

  const { completedSteps, totalSteps, progressPercent } = useMemo(() => {
    const done = registrationSteps.filter((s) => s.done).length;
    const total = registrationSteps.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { completedSteps: done, totalSteps: total, progressPercent: percent };
  }, [registrationSteps]);

  // Hard error — everything failed and we have no cached data at all.
  const allErrored = errors.games && errors.announcements && errors.registrations;
  const hasAnyData =
    liveGames.length > 0 || myRegistrations.length > 0 || portalAnnouncements.length > 0;

  if (allErrored && !hasAnyData && !isInitialLoad) {
    return (
      <div className="p-5 lg:p-8 max-w-5xl pb-[env(safe-area-inset-bottom)]">
        <div className="mb-6">
          <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
            {role === "coach" ? "Coach Portal" : role === "parent" ? "Parent Portal" : "Portal"}
          </p>
          <h1 className="text-navy text-xl lg:text-2xl font-bold font-heading">
            {greeting}, {name}
          </h1>
        </div>
        <div className="bg-red/10 border border-red/20 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red mx-auto mb-3" />
          <h3 className="text-navy font-semibold mb-1">Failed to Load Dashboard</h3>
          <p className="text-text-muted text-sm mb-4">
            Could not connect to the server. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={fetchData}
            disabled={isFetching}
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const partialError = errors.games || errors.announcements || errors.registrations;

  // Consolidated empty state for non-coaches with nothing going on.
  const isEmpty =
    role !== "coach" &&
    liveNow.length === 0 &&
    finalGames.length === 0 &&
    myRegistrations.length === 0 &&
    portalAnnouncements.length === 0;

  let body: React.ReactNode;
  try {
    body = (
      <>
        <PortalAnnouncements announcements={portalAnnouncements} />
        <LiveGamesBanner games={liveNow} />

        {role === "coach" && (
          <RegistrationProgress
            steps={registrationSteps}
            completedSteps={completedSteps}
            totalSteps={totalSteps}
            progressPercent={progressPercent}
          />
        )}

        {isEmpty ? (
          <div className="mb-6 bg-white shadow-sm border border-light-gray rounded-2xl p-6 lg:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-red" />
              </div>
              <h3 className="text-navy font-bold text-base mb-1">Welcome to Inspire Courts</h3>
              <p className="text-text-muted text-sm max-w-sm mx-auto">
                Get started by completing your profile and exploring upcoming events.
              </p>
            </div>
            <div className="grid gap-2 max-w-sm mx-auto">
              <a href="/portal/profile" className="flex items-center gap-3 p-3 bg-off-white hover:bg-light-gray rounded-xl transition-colors group">
                <span className="w-7 h-7 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span className="text-navy text-sm font-medium">Complete your profile</span>
                <Calendar className="w-3.5 h-3.5 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              {(role === "parent" || role === "coach") && (
                <a href="/portal/waiver" className="flex items-center gap-3 p-3 bg-off-white hover:bg-light-gray rounded-xl transition-colors group">
                  <span className="w-7 h-7 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span className="text-navy text-sm font-medium">Submit player waivers</span>
                  <FileCheck className="w-3.5 h-3.5 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              <a href="/tournaments" className="flex items-center gap-3 p-3 bg-off-white hover:bg-light-gray rounded-xl transition-colors group">
                <span className="w-7 h-7 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold flex-shrink-0">{role === "parent" || role === "coach" ? "3" : "2"}</span>
                <span className="text-navy text-sm font-medium">Browse upcoming tournaments</span>
                <Trophy className="w-3.5 h-3.5 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        ) : (
          <MyRegistrationsList registrations={myRegistrations} />
        )}

        {/* Quick Actions — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {role === "coach" && (
            <ActionCard
              href="/portal/roster"
              icon={Users}
              title="My Roster"
              desc={
                rosterCount !== null
                  ? `${rosterCount} player${rosterCount !== 1 ? "s" : ""}`
                  : "Manage your team"
              }
              color="cyan"
              prefetchOnHover
            />
          )}
          <ActionCard
            href="/portal/schedule"
            icon={Calendar}
            title="Schedule"
            desc="Games & events"
            color="blue"
            prefetchOnHover
          />
          <ActionCard
            href="/portal/scores"
            icon={Trophy}
            title="Scores"
            desc="Results & standings"
            color="amber"
            prefetchOnHover
          />
          {(role === "coach" || role === "parent") && (
            <ActionCard
              href="/portal/waiver"
              icon={FileCheck}
              title="Waivers"
              desc="Submit player waivers"
              color="emerald"
            />
          )}
        </div>

        <RecentResults games={finalGames} />
      </>
    );
  } catch (err) {
    // Last-ditch guard against a runtime error in map renders.
    // Real errors still get surfaced by the error boundary at error.tsx.
    body = (
      <div className="bg-red/10 border border-red/20 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red mx-auto mb-2" />
        <p className="text-navy text-sm font-semibold mb-2">Something went wrong while rendering your dashboard.</p>
        <p className="text-text-muted text-xs">{(err as Error)?.message ?? "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 max-w-5xl pb-[env(safe-area-inset-bottom)]">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={pullRefreshing} progress={pullProgress} />
      <ViewAsBanner viewAsRole={actualRole === "admin" ? viewAsRole : null} />

      <PushNotificationPrompt />

      <PortalHeader
        role={role}
        greeting={greeting}
        name={name}
        lastUpdated={lastUpdated}
        onRefresh={fetchData}
        isFetching={isFetching}
      />

      {partialError && !allErrored && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-600 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          Some sections couldn&apos;t load. Showing what we have.
          <button
            type="button"
            onClick={fetchData}
            disabled={isFetching}
            className="ml-auto underline hover:no-underline disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded"
          >
            Retry
          </button>
        </div>
      )}

      {isInitialLoad ? <DashboardSkeleton /> : body}
    </div>
  );
}
