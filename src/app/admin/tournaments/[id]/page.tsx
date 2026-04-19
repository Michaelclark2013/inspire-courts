"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BracketView from "@/components/tournament/BracketView";
import ScheduleGrid from "@/components/tournament/ScheduleGrid";
import PoolStandings from "@/components/tournament/PoolStandings";
import TournamentHeader from "@/components/admin/tournament-detail/TournamentHeader";
import KPICards from "@/components/admin/tournament-detail/KPICards";
import TabNav from "@/components/admin/tournament-detail/TabNav";
import TeamsTab from "@/components/admin/tournament-detail/TeamsTab";
import TournamentDetailSkeleton from "@/components/admin/tournament-detail/TournamentDetailSkeleton";
import ErrorBanner from "@/components/admin/tournament-detail/ErrorBanner";
import {
  TABS,
  type Tab,
  type Team,
  type Player,
  type TournamentDetail,
} from "@/types/tournament-admin";
import { Trophy, Calendar, BarChart3 } from "lucide-react";
import { triggerHaptic } from "@/lib/capacitor";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

function isTab(value: string | null): value is Tab {
  return !!value && (TABS as readonly string[]).includes(value);
}

function TournamentDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const autoSwitchedRef = useRef(false);

  const urlTab = searchParams.get("tab");
  const initialTab: Tab = isTab(urlTab) ? urlTab : "teams";
  const [tab, setTabState] = useState<Tab>(initialTab);

  // Sync URL when user changes tab
  const setTab = useCallback(
    (t: Tab) => {
      setTabState(t);
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("tab", t);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // React to external URL changes (back/forward)
  useEffect(() => {
    if (isTab(urlTab) && urlTab !== tab) {
      setTabState(urlTab);
    }
  }, [urlTab, tab]);

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch(`/api/admin/tournaments/${id}`, { signal });
        if (!res.ok) {
          setFetchError(`Failed to load tournament (${res.status})`);
          return;
        }
        const d = (await res.json()) as TournamentDetail;
        setData(d);
        setFetchError(null);
        // Auto-switch to bracket once, if bracket just appeared and user is still on default teams
        if (
          !autoSwitchedRef.current &&
          d.bracket.length > 0 &&
          tab === "teams" &&
          !isTab(urlTab)
        ) {
          autoSwitchedRef.current = true;
          setTab("bracket");
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setFetchError("Network error loading tournament");
      } finally {
        setLoading(false);
      }
    },
    // intentionally omit tab/setTab to avoid refetch on tab change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  // ----- Mutations -----

  const addTeam = useCallback(
    async (payload: {
      teamName: string;
      seed?: number;
      poolGroup?: string;
      division?: string;
    }) => {
      if (!data) return;
      // Optimistic insert
      const tempId = -Date.now();
      const optimistic: Team = {
        id: tempId,
        teamName: payload.teamName,
        seed: payload.seed ?? null,
        division: payload.division ?? null,
        poolGroup: payload.poolGroup ?? null,
        eliminated: false,
        players: null,
      };
      setData({ ...data, teams: [...data.teams, optimistic] });
      try {
        const res = await fetch(`/api/admin/tournaments/${id}/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add team");
        triggerHaptic("light");
        // Replace the optimistic row with the server-assigned one instead
        // of re-fetching the entire tournament (which was pulling teams +
        // bracket + scores every time a team was added). The only new
        // server-side info is the real id, so splice it in-place.
        const saved = await res.json();
        setData((cur) =>
          cur
            ? {
                ...cur,
                teams: cur.teams.map((t) => (t.id === tempId ? { ...optimistic, ...saved } : t)),
              }
            : cur,
        );
      } catch {
        // rollback
        setData((cur) =>
          cur
            ? { ...cur, teams: cur.teams.filter((t) => t.id !== tempId) }
            : cur,
        );
        setMutationError("Failed to add team");
      }
    },
    [data, id],
  );

  const removeTeam = useCallback(
    async (teamEntryId: number) => {
      if (!data) return;
      const snapshot = data.teams;
      // Optimistic
      setData({ ...data, teams: data.teams.filter((t) => t.id !== teamEntryId) });
      setConfirmRemoveId(null);
      try {
        const res = await fetch(`/api/admin/tournaments/${id}/teams`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamEntryId }),
        });
        if (!res.ok) throw new Error("Failed to remove team");
      } catch {
        setData((cur) => (cur ? { ...cur, teams: snapshot } : cur));
        setMutationError("Failed to remove team");
      }
    },
    [data, id],
  );

  const updatePlayers = useCallback(
    async (team: Team, players: Player[]) => {
      const res = await fetch(`/api/admin/tournaments/${id}/teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamEntryId: team.id, players }),
      });
      if (!res.ok) {
        setMutationError("Failed to update roster");
        return;
      }
      // Optimistic local update
      setData((cur) =>
        cur
          ? {
              ...cur,
              teams: cur.teams.map((t) =>
                t.id === team.id ? { ...t, players: JSON.stringify(players) } : t,
              ),
            }
          : cur,
      );
    },
    [id],
  );

  const generateBracket = useCallback(async () => {
    setConfirmGenerate(false);
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/tournaments/${id}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMutationError(err.error || "Failed to generate bracket");
      } else {
        triggerHaptic("medium");
        setTab("bracket");
        await fetchData();
      }
    } catch {
      setMutationError("Failed to generate bracket");
    } finally {
      setGenerating(false);
    }
  }, [id, fetchData, setTab]);

  const updateStatus = useCallback(
    async (status: string) => {
      try {
        const res = await fetch(`/api/admin/tournaments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error();
        await fetchData();
      } catch {
        setMutationError("Failed to update status");
      }
    },
    [id, fetchData],
  );

  const advanceWinner = useCallback(
    async (gameId: number) => {
      try {
        await fetch(`/api/admin/tournaments/${id}/advance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        });
        triggerHaptic("success");
        await fetchData();
      } catch {
        setMutationError("Failed to advance winner");
      }
    },
    [id, fetchData],
  );

  const kpis = useMemo(() => {
    if (!data) return { live: 0, final: 0 };
    let live = 0;
    let final = 0;
    for (const g of data.bracket) {
      if (g.status === "live") live++;
      else if (g.status === "final") final++;
    }
    return { live, final };
  }, [data]);

  if (loading) {
    return <TournamentDetailSkeleton />;
  }

  if (fetchError && !data) {
    return (
      <div className="p-6">
        <ErrorBanner message={fetchError} onRetry={() => fetchData()} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-navy/40 text-sm">Tournament not found.</div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-[env(safe-area-inset-bottom)]">
      <Breadcrumbs />
      <TournamentHeader
        data={data}
        generating={generating}
        onGenerate={() => setConfirmGenerate(true)}
        onPublish={() => updateStatus("active")}
        onComplete={() => updateStatus("completed")}
      />

      {fetchError && (
        <ErrorBanner message={fetchError} onRetry={() => fetchData()} />
      )}
      {mutationError && (
        <ErrorBanner
          message={mutationError}
          onRetry={() => setMutationError(null)}
        />
      )}

      <KPICards
        teams={data.teams.length}
        games={data.bracket.length}
        live={kpis.live}
        complete={kpis.final}
      />

      {confirmGenerate && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="mb-6 bg-white border-2 border-red shadow-sm rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap"
        >
          <div>
            <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">
              Generate bracket?
            </h3>
            <p className="text-text-secondary text-xs">
              This will create games from your current team list. You can
              re-seed teams before generating.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmGenerate(false)}
              className="min-h-[44px] px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-navy rounded-lg text-sm font-semibold uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={generateBracket}
              className="min-h-[44px] px-4 py-2.5 bg-red hover:bg-red-hover text-white rounded-lg text-sm font-semibold uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      <TabNav tab={tab} onChange={setTab} />

      {tab === "teams" && (
        <TeamsTab
          teams={data.teams}
          format={data.format}
          divisions={data.divisions}
          draft={data.status === "draft"}
          confirmRemoveId={confirmRemoveId}
          onRequestRemove={setConfirmRemoveId}
          onConfirmRemove={removeTeam}
          onAddTeam={addTeam}
          onAddPlayer={updatePlayers}
          onRemovePlayer={updatePlayers}
        />
      )}

      {tab === "bracket" && (
        <div
          id="tabpanel-bracket"
          role="tabpanel"
          aria-labelledby="tab-bracket"
        >
          {data.bracket.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-8 h-8" aria-hidden="true" />}
              title="No bracket generated yet"
              subtitle={
                data.status === "draft"
                  ? "Add at least 2 teams, then click Generate Bracket."
                  : "The bracket has not been created for this tournament."
              }
            />
          ) : (
            <BracketView
              bracket={data.bracket}
              format={data.format}
              tournamentId={data.id}
              isAdmin={true}
              onAdvance={advanceWinner}
              onRefresh={() => fetchData()}
            />
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div
          id="tabpanel-schedule"
          role="tabpanel"
          aria-labelledby="tab-schedule"
        >
          {data.bracket.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8" aria-hidden="true" />}
              title="No games scheduled yet"
              subtitle="Generate the bracket to create a schedule."
            />
          ) : (
            <div className="overflow-x-auto">
              <ScheduleGrid bracket={data.bracket} courts={data.courts} />
            </div>
          )}
        </div>
      )}

      {tab === "standings" && (
        <div
          id="tabpanel-standings"
          role="tabpanel"
          aria-labelledby="tab-standings"
        >
          {kpis.final === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-8 h-8" aria-hidden="true" />}
              title="No results yet"
              subtitle="Standings will appear as games are completed."
            />
          ) : (
            <PoolStandings bracket={data.bracket} />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-border shadow-sm rounded-xl px-6 py-12 text-center">
      <div className="w-14 h-14 bg-off-white text-text-muted rounded-full flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="text-navy font-bold text-sm uppercase tracking-wider mb-1">
        {title}
      </h3>
      <p className="text-text-secondary text-xs">{subtitle}</p>
    </div>
  );
}

export default function TournamentDetailPage() {
  return (
    <Suspense fallback={<TournamentDetailSkeleton />}>
      <TournamentDetailInner />
    </Suspense>
  );
}
