"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ChevronLeft,
  Loader2,
  Radio,
  Users,
  DollarSign,
  Calendar,
  Share2,
  Copy,
  Link2,
} from "lucide-react";
import BracketView from "@/components/tournament/BracketView";
import PoolStandings from "@/components/tournament/PoolStandings";
import type { TournamentDetailPublic } from "@/types/tournament-public";
import { FORMAT_LABELS } from "@/types/tournament-public";

export default function PublicTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TournamentDetailPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Abort any in-flight request (Area 6)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/tournaments/${id}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        setData(await res.json());
        setError(false);
      } else if (res.status !== 404) {
        setError(true);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(true);
      }
    }
    setLoading(false);
  }, [id]);

  // Poll every 30s for live score updates, pause when tab hidden (Area 6: cleanup)
  useEffect(() => {
    fetchData();
    let interval = setInterval(fetchData, 30000);

    function handleVisibility() {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchData();
        interval = setInterval(fetchData, 30000);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center" aria-busy="true">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" aria-label="Loading tournament" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-off-white flex flex-col items-center justify-center gap-4 px-4 text-center" role="alert">
        <p className="text-navy font-semibold">
          Failed to load tournament data.
        </p>
        <p className="text-text-muted text-sm">
          Check your connection and try again.
        </p>
        <button
          onClick={() => {
            setLoading(true);
            setError(false);
            fetchData();
          }}
          className="bg-red hover:bg-red-hover text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px]"
        >
          Retry
        </button>
        <Link
          href="/tournaments"
          className="text-text-muted text-xs hover:text-navy underline focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 rounded"
        >
          Back to Tournaments
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <p className="text-text-muted">Tournament not found.</p>
      </div>
    );
  }

  const liveCount = data.bracket.filter((g) => g.status === "live").length;

  // Map bracket to expected shape for BracketView
  const bracketForView = data.bracket.map((g, i) => ({
    id: i,
    gameId: g.gameId,
    bracketPosition: g.bracketPosition,
    round: g.round,
    poolGroup: g.poolGroup,
    winnerAdvancesTo: g.winnerAdvancesTo,
    loserDropsTo: g.loserDropsTo,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    lastQuarter: g.lastQuarter,
    status: g.status,
    court: g.court,
    scheduledTime: g.scheduledTime,
    division: null,
  }));

  return (
    <div className="min-h-screen bg-off-white">
      {/* JSON-LD for individual tournament (Area 16) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            name: data.name,
            startDate: data.startDate,
            ...(data.endDate ? { endDate: data.endDate } : {}),
            location: {
              "@type": "Place",
              name: data.location || "Inspire Courts AZ",
            },
            organizer: {
              "@type": "Organization",
              name: "OFF SZN HOOPS",
              url: "https://inspirecourtsaz.com",
            },
            url: `https://inspirecourtsaz.com/tournaments/${data.id}`,
            ...(data.entryFee != null && data.entryFee > 0
              ? {
                  offers: {
                    "@type": "Offer",
                    price: (data.entryFee / 100).toFixed(2),
                    priceCurrency: "USD",
                    availability: data.registrationOpen
                      ? "https://schema.org/InStock"
                      : "https://schema.org/SoldOut",
                  },
                }
              : {}),
          }),
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <nav aria-label="Breadcrumb">
          <Link
            href="/tournaments"
            className="text-text-muted text-xs hover:text-navy flex items-center gap-1 mb-6 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 rounded w-fit"
          >
            <ChevronLeft className="w-3 h-3" aria-hidden="true" /> Back to
            Tournaments
          </Link>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-red" aria-hidden="true" />
            <h1 className="text-2xl lg:text-3xl font-bold text-navy font-heading">
              {data.name}
            </h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full" role="status">
                <Radio className="w-3 h-3 animate-pulse" aria-hidden="true" />
                {liveCount} Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-muted text-sm">
            <span>{FORMAT_LABELS[data.format] || data.format}</span>
            <time dateTime={data.startDate}>
              {new Date(data.startDate + "T00:00:00").toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </time>
            {data.location && <span>{data.location}</span>}
            <span>{data.teams.length} teams</span>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={async () => {
                const url = window.location.href;
                if (navigator.share) {
                  try {
                    await navigator.share({ title: data.name, url });
                  } catch { /* user cancelled */ }
                } else {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wide border border-light-gray hover:border-navy/20 px-3 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              {copied ? <><Copy className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(data.name + " at Inspire Courts")}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wide border border-light-gray hover:border-navy/20 px-3 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
              aria-label="Share on X (Twitter)"
            >
              <Link2 className="w-3.5 h-3.5" /> Post on X
            </a>
          </div>
        </header>

        {/* Registration CTA */}
        {data.registrationOpen && (
          <div
            className="mb-8 bg-white border border-red/20 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            role="region"
            aria-label="Tournament registration"
          >
            <div>
              <h2 className="text-navy font-bold text-lg mb-1">
                Registration Open
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-text-muted text-sm">
                {data.entryFee != null && data.entryFee > 0 && (
                  <span className="flex items-center gap-1">
                    <DollarSign
                      className="w-3.5 h-3.5 text-emerald-400"
                      aria-hidden="true"
                    />
                    ${(data.entryFee / 100).toFixed(0)} per team
                  </span>
                )}
                {data.registrationDeadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    Deadline:{" "}
                    <time dateTime={data.registrationDeadline}>
                      {new Date(
                        data.registrationDeadline + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </span>
                )}
              </div>
            </div>
            <a
              href="https://inspirecourts.leagueapps.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px] inline-flex items-center"
              aria-label={`Register now for ${data.name}`}
            >
              Register Now
            </a>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="mb-8 bg-white border border-light-gray rounded-xl p-5">
            <p className="text-text-muted text-sm whitespace-pre-wrap">
              {data.description}
            </p>
          </div>
        )}

        {/* Registered Teams */}
        {data.teams.length > 0 && data.bracket.length === 0 && (
          <section
            className="mb-8 bg-white border border-light-gray rounded-xl overflow-hidden"
            aria-label="Registered teams"
          >
            <div className="px-5 py-3 border-b border-light-gray flex items-center gap-2">
              <Users className="w-4 h-4 text-red" aria-hidden="true" />
              <h2 className="text-navy font-bold text-sm uppercase tracking-wider">
                Registered Teams ({data.teams.length})
              </h2>
            </div>
            <div className="divide-y divide-light-gray" role="list">
              {data.teams.map((team, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3" role="listitem">
                  <span className="text-text-muted text-xs font-bold w-6 text-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-navy text-sm font-semibold">
                    {team.teamName}
                  </span>
                  {team.division && (
                    <span className="text-[10px] bg-red/10 text-red px-1.5 py-0.5 rounded font-bold">
                      {team.division}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bracket */}
        {data.bracket.length > 0 ? (
          <section className="mb-8" aria-label="Tournament bracket">
            <BracketView
              bracket={bracketForView}
              format={data.format}
              tournamentId={data.id}
              isAdmin={false}
            />
          </section>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <Trophy className="w-8 h-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm">
              Bracket will be posted soon. Check back for live updates!
            </p>
          </div>
        )}

        {/* Standings */}
        {data.bracket.filter((g) => g.status === "final").length > 0 && (
          <section aria-label="Tournament standings">
            <h2 className="text-navy font-bold text-lg mb-4">Standings</h2>
            <PoolStandings bracket={bracketForView} />
          </section>
        )}
      </div>
    </div>
  );
}
