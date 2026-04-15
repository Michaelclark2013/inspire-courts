"use client";

import { memo } from "react";
import { Users, Trophy, Calendar, BarChart3 } from "lucide-react";
import { TABS, type Tab } from "@/types/tournament-admin";

interface Props {
  tab: Tab;
  onChange: (t: Tab) => void;
}

const ICONS: Record<Tab, React.ComponentType<{ className?: string }>> = {
  teams: Users,
  bracket: Trophy,
  schedule: Calendar,
  standings: BarChart3,
};

function TabNav({ tab, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Tournament sections"
      className="flex items-center gap-1 mb-6 bg-white border border-border shadow-sm rounded-xl p-1 overflow-x-auto"
    >
      {TABS.map((t) => {
        const Icon = ICONS[t];
        const active = tab === t;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${t}`}
            id={`tab-${t}`}
            onClick={() => onChange(t)}
            className={`min-h-[44px] flex-1 min-w-fit px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none ${
              active
                ? "bg-red text-white"
                : "text-text-muted hover:text-navy hover:bg-off-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5 inline mr-1.5" />
            {t}
          </button>
        );
      })}
    </div>
  );
}

export default memo(TabNav);
