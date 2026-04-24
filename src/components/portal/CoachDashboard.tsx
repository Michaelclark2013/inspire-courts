"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CoachCheckinStatus from "@/components/portal/CoachCheckinStatus";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Trophy,
  Users,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";

/**
 * Coach dashboard hub. Pulls from /api/portal/coach/dashboard and
 * renders the coach's action-needed to-dos, their current registrations,
 * and upcoming tournaments they can still register for.
 */

type Todo = {
  id: string;
  label: string;
  detail: string;
  priority: "high" | "medium" | "low";
  cta?: { href: string; label: string };
};

type Registration = {
  id: number;
  tournamentId: number;
  tournamentName: string;
  startDate: string;
  teamName: string;
  division: string | null;
  status: string;
  paymentStatus: string;
};

type UpcomingOpen = {
  id: number;
  name: string;
  startDate: string;
  location: string | null;
  entryFee: number | null;
  registrationDeadline: string | null;
};

type DashboardData = {
  user: {
    name: string;
    email: string;
    profileComplete: boolean;
    emailVerified: boolean;
  };
  team: { id: number; name: string; division: string | null } | null;
  rosterStats: { size: number; missingWaivers: number };
  todos: Todo[];
  myRegistrations: Registration[];
  upcomingOpen: UpcomingOpen[];
};

export default function CoachDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/portal/coach/dashboard", {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        if (res.ok) setData(await res.json());
        else setError(true);
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") setError(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-secondary text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Loading your dashboard…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="bg-red/10 border border-red/20 rounded-xl p-4 text-sm text-navy">
        Couldn&apos;t load your dashboard. Refresh to try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero greeting + quick stats */}
      <section className="bg-navy text-white rounded-2xl p-5 sm:p-6">
        <p className="text-white/60 text-xs uppercase tracking-widest font-bold">
          Coach Portal
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">
          Welcome back, {data.user.name.split(" ")[0]}
        </h1>
        {data.team && (
          <p className="text-white/70 text-sm mt-1">
            {data.team.name}
            {data.team.division ? ` · ${data.team.division}` : ""}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5">
          <HeroStat
            label="Roster"
            value={data.rosterStats.size}
            hint={data.team ? "players" : "no team"}
          />
          <HeroStat
            label="Waivers Missing"
            value={data.rosterStats.missingWaivers}
            hint={data.rosterStats.missingWaivers > 0 ? "action needed" : "all set"}
            accent={data.rosterStats.missingWaivers > 0}
          />
          <HeroStat
            label="Events"
            value={data.myRegistrations.length}
            hint="registered"
          />
        </div>
      </section>

      {/* To-dos */}
      {data.todos.length > 0 ? (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
                Action needed
              </h2>
              <p className="text-xs text-text-secondary">
                {data.todos.length} item{data.todos.length === 1 ? "" : "s"} to finish
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {data.todos.map((t) => (
              <li
                key={t.id}
                className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${
                  t.priority === "high"
                    ? "border-red/30"
                    : t.priority === "medium"
                    ? "border-amber-200"
                    : "border-border"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy text-sm">{t.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{t.detail}</p>
                </div>
                {t.cta && (
                  <Link
                    href={t.cta.href}
                    className="inline-flex items-center gap-1 bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex-shrink-0"
                  >
                    {t.cta.label}
                    <ChevronRight className="w-3 h-3" aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">You&apos;re all caught up.</strong>{" "}
            No action items right now.
          </span>
        </section>
      )}

      {/* Live check-in readiness for each registered team */}
      <CoachCheckinStatus />

      {/* My tournament registrations */}
      {data.myRegistrations.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red/10 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-4 h-4 text-red" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
              My Tournaments
            </h2>
          </div>
          <ul className="space-y-2">
            {data.myRegistrations.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/tournaments/${r.tournamentId}`}
                  className="block bg-white border border-border rounded-xl p-4 hover:border-navy/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy truncate">
                        {r.tournamentName}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {r.teamName}
                        {r.division ? ` · ${r.division}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StatusChip status={r.status} />
                      <PaymentChip status={r.paymentStatus} />
                    </div>
                  </div>
                  {r.startDate && (
                    <p className="text-[11px] text-text-secondary flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {r.startDate}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Upcoming open tournaments */}
      {data.upcomingOpen.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-emerald-700" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy">
              Register for an upcoming event
            </h2>
          </div>
          <ul className="space-y-2">
            {data.upcomingOpen.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tournaments/${t.id}/register`}
                  className="block bg-white border border-border rounded-xl p-4 hover:border-red/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-navy truncate">{t.name}</p>
                    {t.entryFee != null && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-navy flex-shrink-0">
                        <DollarSign className="w-3 h-3" aria-hidden="true" />
                        {Math.round(t.entryFee / 100)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text-secondary flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {t.startDate}
                    </span>
                    {t.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span className="truncate">{t.location}</span>
                      </span>
                    )}
                    {t.registrationDeadline && (
                      <span>Reg. by {t.registrationDeadline}</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction href="/portal/roster" label="Roster" icon={Users} />
          <QuickAction href="/portal/schedule" label="Schedule" icon={Calendar} />
          <QuickAction href="/waiver" label="Sign Waiver" icon={CheckCircle2} />
          <QuickAction href="/portal/profile" label="Profile" icon={ChevronRight} />
        </div>
      </section>
    </div>
  );
}

function HeroStat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-white/10 rounded-xl px-3 py-2.5 ${
        accent ? "ring-1 ring-red" : ""
      }`}
    >
      <p className={`text-2xl font-bold ${accent ? "text-red" : "text-white"}`}>
        {value}
      </p>
      <p className="text-white/70 text-[10px] uppercase tracking-wider font-bold">
        {label}
      </p>
      <p className="text-white/50 text-[10px]">{hint}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected" || status === "cancelled"
      ? "bg-red/10 text-red"
      : status === "waitlist"
      ? "bg-amber-50 text-amber-700"
      : "bg-navy/5 text-navy/70";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status || "pending"}
    </span>
  );
}
function PaymentChip({ status }: { status: string }) {
  const cls =
    status === "paid" || status === "waived"
      ? "bg-emerald-50 text-emerald-700"
      : status === "refunded"
      ? "bg-amber-50 text-amber-700"
      : "bg-red/10 text-red";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status || "pending"}
    </span>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-border rounded-xl p-3 flex flex-col items-center gap-1 text-center hover:border-red/30 transition-colors"
    >
      <Icon className="w-5 h-5 text-red" aria-hidden={true} />
      <span className="text-xs font-semibold text-navy">{label}</span>
    </Link>
  );
}
