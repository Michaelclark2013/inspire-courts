import React from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import type { TournamentPublic } from "@/types/tournament-public";
import { FORMAT_LABELS } from "@/types/tournament-public";
import { relativeDate } from "@/lib/utils";
import ExpandableText from "@/components/ui/ExpandableText";

function TournamentCardInner({
  tournament: t,
  compact,
}: {
  tournament: TournamentPublic;
  compact?: boolean;
}) {
  const isPast =
    t.registrationDeadline &&
    new Date(t.registrationDeadline + "T23:59:59") < new Date();
  const canRegister = t.registrationOpen && !isPast;
  const relative = relativeDate(t.startDate);

  if (compact) {
    return (
      <Link
        href={`/tournaments/${t.id}`}
        className="flex items-center justify-between gap-4 bg-white border border-light-gray rounded-xl px-5 py-4 hover:border-red/30 hover:shadow-sm transition-colors group focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2"
        aria-label={`View results for ${t.name}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Trophy className="w-4 h-4 text-text-muted flex-shrink-0" aria-hidden="true" />
          <span className="text-navy/60 text-sm font-semibold truncate group-hover:text-navy transition-colors">
            {t.name}
          </span>
          <span className="text-text-muted text-xs flex-shrink-0">
            {new Date(t.startDate + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <span className="text-text-muted text-xs font-semibold uppercase tracking-wider flex-shrink-0">
          View Results <ArrowRight className="w-3 h-3 inline" />
        </span>
      </Link>
    );
  }

  return (
    <article className="bg-white border border-light-gray shadow-sm rounded-2xl overflow-hidden hover:border-red/30 hover:shadow-md transition-colors">
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-red flex-shrink-0" aria-hidden="true" />
              <h3 className="text-xl font-bold text-navy font-heading truncate" title={t.name}>
                {t.name}
              </h3>
              {t.status === "active" && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <span aria-hidden="true">{"\u25CF "}</span>Live
                </span>
              )}
              {canRegister && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red/10 text-red">
                  <span aria-hidden="true">{"\u2713 "}</span>Registration Open
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-text-muted text-sm mb-3">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <time dateTime={t.startDate}>
                  {new Date(t.startDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </time>
                <span className="text-text-muted/60 text-xs ml-1" title="Mountain Standard Time (Arizona)">MST</span>
                {relative && (
                  <span className="ml-2 text-xs font-semibold text-red/80 bg-red/10 px-2 py-0.5 rounded-full">{relative}</span>
                )}
              </span>
              {t.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  {t.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                {t.teamCount} team{t.teamCount !== 1 ? "s" : ""}
              </span>
              <span className="text-text-muted">
                {FORMAT_LABELS[t.format] || t.format}
              </span>
            </div>

            {t.divisions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3" role="list" aria-label="Divisions">
                {t.divisions.map((d) => (
                  <span
                    key={d}
                    role="listitem"
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red/10 text-red"
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}

            {t.description && (
              <ExpandableText text={t.description} lines={2} />
            )}
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0">
            {t.entryFee != null && t.entryFee > 0 && (
              <div className="flex items-center gap-1.5 text-navy font-bold text-lg">
                <DollarSign className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                {(t.entryFee / 100).toFixed(0)}
                <span className="text-text-muted text-sm font-normal">
                  /team
                </span>
              </div>
            )}

            {t.registrationDeadline && (
              <p className="text-text-muted text-xs">
                Deadline:{" "}
                <time dateTime={t.registrationDeadline}>
                  {new Date(
                    t.registrationDeadline + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </p>
            )}

            <div className="flex gap-2">
              <Link
                href={`/tournaments/${t.id}`}
                className="text-navy/60 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-light-gray rounded-lg hover:border-red/30 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px] flex items-center"
                aria-label={t.status === "active" ? `View live bracket for ${t.name}` : `View details for ${t.name}`}
              >
                {t.status === "active" ? "Live Bracket" : "Details"}
              </Link>
              {canRegister && (
                <a
                  href="https://inspirecourts.leagueapps.com/tournaments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red hover:bg-red-hover text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none focus-visible:ring-offset-2 min-h-[44px] flex items-center"
                  aria-label={`Register for ${t.name}`}
                >
                  Register
                </a>
              )}
              {isPast && (
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-light-gray rounded-lg min-h-[44px] flex items-center">
                  Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const TournamentCard = React.memo(TournamentCardInner);
export default TournamentCard;
