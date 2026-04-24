import Link from "next/link";
import {
  Activity,
  Users,
  DollarSign,
  UserCheck,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";

// Hero card for the main admin dashboard. Replaces the plain sticky
// greeting + ops banner + KPI row with a single dramatic statement
// that frames the entire page. Navy gradient, huge display numerals,
// uppercase micro-labels — the "Command Center" look.

type Props = {
  greeting: string;
  dateLine: string;
  stats: {
    totalTeams: number;
    totalRevenue: number;
    totalPlayers: number;
    totalGames: number;
  };
};

export default function DashboardHero({ greeting, dateLine, stats }: Props) {
  const kpis = [
    {
      label: "Teams",
      value: stats.totalTeams.toLocaleString(),
      href: "/admin/teams",
      icon: Users,
    },
    {
      label: "Revenue",
      value: `$${Math.round(stats.totalRevenue).toLocaleString()}`,
      href: "/admin/revenue",
      icon: DollarSign,
    },
    {
      label: "Check-ins",
      value: stats.totalPlayers.toLocaleString(),
      href: "/admin/checkin",
      icon: UserCheck,
    },
    {
      label: "Games",
      value: stats.totalGames.toLocaleString(),
      href: "/admin/scores",
      icon: ClipboardList,
    },
  ];

  return (
    <section aria-labelledby="dashboard-heading" className="mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl">
        {/* Decorative red wedge */}
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-red/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none"
        />

        <div className="relative p-6 sm:p-8 lg:p-10">
          {/* Top row: greeting + ops jump */}
          <div className="flex items-start justify-between gap-4 mb-8 lg:mb-12">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-2">
                {dateLine}
              </p>
              <h1
                id="dashboard-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight leading-[1.05]"
              >
                {greeting}
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-lg">
                Your command center. Live stats, upcoming events, and every
                admin tool in one place.
              </p>
            </div>
            <Link
              href="/admin/ops"
              className="hidden sm:flex items-center gap-2 bg-red hover:bg-red-hover rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap shadow-lg shadow-red/30"
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              Ops Live
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* KPI bento */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <Link
                key={k.label}
                href={k.href}
                className="group relative bg-white/10 hover:bg-white/15 backdrop-blur border border-white/10 hover:border-white/25 rounded-2xl px-4 py-5 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <k.icon className="w-4 h-4 text-white/90" aria-hidden="true" />
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-white/40 group-hover:text-white/90 transition-colors"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-white font-bold font-heading text-3xl lg:text-4xl tabular-nums leading-none tracking-tight">
                  {k.value}
                </p>
                <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-2 font-semibold">
                  {k.label}
                </p>
              </Link>
            ))}
          </div>

          {/* Mobile ops jump */}
          <Link
            href="/admin/ops"
            className="sm:hidden mt-5 flex items-center justify-center gap-2 bg-red hover:bg-red-hover rounded-full px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Activity className="w-3.5 h-3.5" aria-hidden="true" />
            Open Ops Live
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
