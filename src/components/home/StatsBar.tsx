import { memo } from "react";
import { Trophy, LayoutGrid, Tv, Snowflake, CalendarDays } from "lucide-react";

const STATS = [
  { icon: Trophy, label: "7 Courts", cls: "border-r" },
  { icon: LayoutGrid, label: "52,000 Sq Ft", cls: "border-r" },
  { icon: Tv, label: "Game Film", cls: "sm:border-r" },
  { icon: Snowflake, label: "Air-Conditioned", cls: "hidden sm:flex border-r" },
  { icon: CalendarDays, label: "Year-Round", cls: "hidden sm:flex" },
] as const;

function StatsBar() {
  return (
    <section className="bg-navy" aria-label="Facility highlights">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 sm:grid-cols-5 border-t border-white/10">
          {STATS.map(({ icon: Icon, label, cls }) => (
            <div
              key={label}
              className={`flex items-center justify-center gap-2 py-5 px-3 text-white/80 border-white/10 ${cls}`}
            >
              <Icon className="w-4 h-4 text-red flex-shrink-0" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-semibold font-[var(--font-chakra)] uppercase tracking-wide whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(StatsBar);
