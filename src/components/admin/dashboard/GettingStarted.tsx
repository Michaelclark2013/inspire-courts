"use client";

import { memo } from "react";
import Link from "next/link";
import { Trophy, Megaphone, TrendingUp, ArrowRight } from "lucide-react";

const STEPS = [
  {
    num: "1",
    label: "Create your first tournament",
    href: "/admin/tournaments/manage",
    icon: Trophy,
  },
  {
    num: "2",
    label: "Add an announcement for coaches",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    num: "3",
    label: "View your leads pipeline",
    href: "/admin/leads",
    icon: TrendingUp,
  },
];

function GettingStarted() {
  return (
    <section
      className="bg-white border border-light-gray shadow-sm rounded-sm p-6"
      aria-labelledby="getting-started-heading"
    >
      <h3
        id="getting-started-heading"
        className="text-navy font-bold text-sm uppercase tracking-wider mb-1"
      >
        Getting Started
      </h3>
      <p className="text-text-secondary text-xs mb-4">
        Set up your facility in 3 steps
      </p>
      <ul className="space-y-3">
        {STEPS.map((step) => (
          <li key={step.num}>
            <Link
              href={step.href}
              prefetch
              className="flex items-center gap-3 px-4 py-3 bg-off-white hover:bg-light-gray border border-light-gray rounded-lg transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
            >
              <span className="w-7 h-7 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold">
                {step.num}
              </span>
              <span className="text-navy text-sm font-medium">{step.label}</span>
              <ArrowRight
                className="w-3.5 h-3.5 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default memo(GettingStarted);
