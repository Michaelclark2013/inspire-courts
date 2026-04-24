"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Rocket,
} from "lucide-react";

type Readiness = {
  env: Record<string, boolean | string | null>;
  affectedBrackets: Array<{
    id: number;
    name: string;
    status: string;
    safeToRegenerate: boolean;
    gameCount: number;
    playedCount: number;
  }>;
  userStats: { totalUsers: number; totalAdmins: number };
  summary: {
    requiredEnvSet: boolean;
    paymentsLive: boolean;
    emailLive: boolean;
    cronLive: boolean;
    analyticsLive: boolean;
    bracketsNeedingRegenerate: number;
    bracketsRequiringManualMigration: number;
  };
};

export default function LaunchReadinessPage() {
  const { status } = useSession();
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/launch-readiness", { signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        if (res.ok) setData(await res.json());
      } catch {
        /* ignore */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [status]);

  if (status === "loading") return null;
  if (status === "unauthenticated") redirect("/admin/login");

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-red/10 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-red" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-navy font-heading">
            Launch Readiness
          </h1>
          <p className="text-text-secondary text-sm">
            Pre-flight check for going public. Green means ready; amber/red
            means attention needed.
          </p>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex items-center gap-2 text-text-secondary text-sm py-8">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Running checks…
        </div>
      ) : (
        <>
          {/* Summary traffic lights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            <SummaryCard
              label="Core env vars"
              ok={data.summary.requiredEnvSet}
              helpWhenBad="Set TURSO + NEXTAUTH + ADMIN vars in Vercel"
            />
            <SummaryCard
              label="Square payments"
              ok={data.summary.paymentsLive}
              helpWhenBad="Set SQUARE_* (production) in Vercel"
            />
            <SummaryCard
              label="Email (Gmail)"
              ok={data.summary.emailLive}
              helpWhenBad="Set GMAIL_USER + GMAIL_APP_PASSWORD"
            />
            <SummaryCard
              label="Cron jobs"
              ok={data.summary.cronLive}
              helpWhenBad="Set CRON_SECRET — openssl rand -hex 32"
            />
            <SummaryCard
              label="Analytics (GA4)"
              ok={data.summary.analyticsLive}
              helpWhenBad="Set NEXT_PUBLIC_GA_ID (optional but recommended)"
              optional
            />
            <SummaryCard
              label={`${data.userStats.totalAdmins} admin${
                data.userStats.totalAdmins === 1 ? "" : "s"
              } exist`}
              ok={data.userStats.totalAdmins >= 1}
              helpWhenBad="Create at least one admin user"
            />
          </div>

          {/* Brackets needing regeneration */}
          <section className="mb-8 bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              Bracket Seedings — audit from 2026-11-24 fix
            </h2>
            {data.affectedBrackets.length === 0 ? (
              <p className="text-text-secondary text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                No single-elim tournaments need attention.
              </p>
            ) : (
              <>
                <p className="text-text-secondary text-sm mb-3">
                  These single-elimination tournaments were published before
                  the bracket-seeding bug fix. The first-round matchups are
                  incorrect (every team was paired 1-vs-2 instead of standard
                  1-vs-N seeding).
                </p>
                <ul className="divide-y divide-border border border-border rounded-lg">
                  {data.affectedBrackets.map((b) => (
                    <li
                      key={b.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-navy font-semibold truncate">{b.name}</p>
                        <p className="text-text-secondary text-xs">
                          {b.gameCount} games · {b.playedCount} played ·{" "}
                          status: {b.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {b.safeToRegenerate ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded">
                            <AlertTriangle
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            Safe to regenerate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red/10 text-red text-xs font-semibold px-2 py-1 rounded">
                            <XCircle className="w-3 h-3" aria-hidden="true" />
                            Has played games — manual migration
                          </span>
                        )}
                        <Link
                          href={`/admin/tournaments/${b.id}`}
                          className="inline-flex items-center gap-1 text-xs text-navy hover:text-red font-semibold"
                        >
                          Open <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Env var detail */}
          <section className="mb-8 bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              Environment Variables
            </h2>
            <p className="text-text-secondary text-xs mb-3">
              Values aren&apos;t displayed — only whether each var is set in
              production.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {Object.entries(data.env).map(([key, value]) => {
                const isSet =
                  typeof value === "boolean" ? value : value !== null && value !== "";
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="font-mono text-navy/80 truncate">
                      {key}
                    </span>
                    {isSet ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        {typeof value === "string" ? value : "set"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-secondary">
                        <XCircle className="w-3 h-3" aria-hidden="true" />
                        not set
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex items-center justify-between gap-2 pt-3">
            <p className="text-text-secondary text-xs">
              Recheck after each env-var change + redeploy.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 text-xs font-semibold text-navy hover:text-red border border-border hover:border-navy/30 px-3 py-2 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  ok,
  helpWhenBad,
  optional = false,
}: {
  label: string;
  ok: boolean;
  helpWhenBad: string;
  optional?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border transition-colors ${
        ok
          ? "bg-emerald-50 border-emerald-200"
          : optional
          ? "bg-amber-50 border-amber-200"
          : "bg-red/5 border-red/20"
      }`}
    >
      <div className="flex items-start gap-2">
        {ok ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : optional ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="text-navy font-semibold text-sm">{label}</p>
          {!ok && (
            <p className="text-xs text-text-secondary mt-1">{helpWhenBad}</p>
          )}
        </div>
      </div>
    </div>
  );
}
