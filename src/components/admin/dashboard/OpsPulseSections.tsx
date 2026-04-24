"use client";

import { useState } from "react";
import {
  Activity,
  DollarSign,
  Bell,
  Calendar,
} from "lucide-react";

type Tab = {
  key: "live" | "finance" | "alerts" | "schedule";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
};

// Collapses the post-button-grid "insight cards" into tabs on mobile
// so the dashboard doesn't scroll for days. Desktop still shows
// everything stacked (plenty of room).
export default function OpsPulseSections({
  live,
  finance,
  alerts,
  schedule,
}: {
  live: React.ReactNode;
  finance: React.ReactNode;
  alerts: React.ReactNode;
  schedule: React.ReactNode;
}) {
  const tabs: Tab[] = [
    { key: "live",     label: "Live",    icon: Activity,  children: live },
    { key: "finance",  label: "Money",   icon: DollarSign, children: finance },
    { key: "alerts",   label: "Alerts",  icon: Bell,      children: alerts },
    { key: "schedule", label: "Schedule", icon: Calendar, children: schedule },
  ];
  const [active, setActive] = useState<Tab["key"]>("live");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <>
      {/* Mobile: tabbed */}
      <section aria-label="Dashboard insights" className="lg:hidden mb-6">
        {/* Tab bar */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-1 mb-3 grid grid-cols-4 gap-1">
          {tabs.map((t) => {
            const selected = t.key === active;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  selected ? "bg-navy text-white" : "text-text-muted hover:bg-off-white"
                }`}
              >
                <t.icon className={`w-4 h-4 ${selected ? "text-white" : "text-text-muted"}`} />
                {t.label}
              </button>
            );
          })}
        </div>
        <div>{current.children}</div>
      </section>

      {/* Desktop: everything stacked */}
      <div className="hidden lg:block">
        {live}
        {finance}
        {alerts}
        {schedule}
      </div>
    </>
  );
}
