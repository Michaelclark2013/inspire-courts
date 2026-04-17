"use client";

import Link from "next/link";
import { memo } from "react";
import {
  ChevronLeft,
  Loader2,
  Play,
  CheckCircle2,
  Zap,
  Users,
} from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import StatusTimeline from "./StatusTimeline";
import {
  FORMAT_LABELS,
  STATUS_STYLES,
  type TournamentDetail,
} from "@/types/tournament-admin";
import { relativeTime } from "@/lib/relative-time";

interface Props {
  data: TournamentDetail;
  generating: boolean;
  onGenerate: () => void;
  onPublish: () => void;
  onComplete: () => void;
}

function TournamentHeader({
  data,
  generating,
  onGenerate,
  onPublish,
  onComplete,
}: Props) {
  const id = data.id;
  const updatedLabel = data.updatedAt ? relativeTime(data.updatedAt) : "";

  return (
    <>
      <Link
        href="/admin/tournaments/manage"
        className="text-text-secondary text-xs hover:text-navy flex items-center gap-1 mb-4 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded w-fit"
      >
        <ChevronLeft className="w-3 h-3" /> Back to Tournaments
      </Link>

      <StatusTimeline status={data.status} />

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-navy font-heading">
              {data.name}
            </h1>
            <span
              aria-live="polite"
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLES[data.status] || "bg-gray-100 text-gray-600"}`}
            >
              {data.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-text-secondary text-xs flex-wrap">
            <span>{FORMAT_LABELS[data.format] || data.format}</span>
            <span>
              {new Date(data.startDate + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" },
              )}
            </span>
            {data.location && <span>{data.location}</span>}
            <span>{data.teams.length} teams</span>
            <span>{data.bracket.length} games</span>
            {updatedLabel && <span>updated {updatedLabel}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip content="View team registrations">
            <Link
              href={`/admin/tournaments/${id}/registrations`}
              className="min-h-[44px] flex items-center gap-2 text-navy/50 hover:text-navy text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border border-border rounded-lg hover:border-navy/30 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              <Users className="w-4 h-4" /> Registrations
            </Link>
          </Tooltip>
          {data.status === "draft" && data.teams.length >= 2 && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="min-h-[44px] flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Generate Bracket
            </button>
          )}
          {data.status === "published" && (
            <button
              onClick={onPublish}
              className="min-h-[44px] flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              <Play className="w-4 h-4" /> Start Tournament
            </button>
          )}
          {data.status === "active" && (
            <button
              onClick={onComplete}
              className="min-h-[44px] flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-navy px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default memo(TournamentHeader);
