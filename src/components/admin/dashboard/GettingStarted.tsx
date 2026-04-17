"use client";

import { memo } from "react";
import Link from "next/link";
import { Trophy, Megaphone, TrendingUp, Users, PenLine, FileEdit, ArrowRight, Rocket } from "lucide-react";

const STEPS = [
  {
    num: "1",
    label: "Create your first tournament",
    description: "Set up brackets, divisions, and registration",
    href: "/admin/tournaments/manage",
    icon: Trophy,
  },
  {
    num: "2",
    label: "Add teams to your roster",
    description: "Import or manually add teams and players",
    href: "/admin/teams",
    icon: Users,
  },
  {
    num: "3",
    label: "Post an announcement",
    description: "Keep coaches and parents in the loop",
    href: "/admin/announcements",
    icon: Megaphone,
  },
  {
    num: "4",
    label: "Enter your first game scores",
    description: "Start tracking results and standings",
    href: "/admin/scores/enter",
    icon: PenLine,
  },
  {
    num: "5",
    label: "Customize site content",
    description: "Update hero images, text, and links",
    href: "/admin/content",
    icon: FileEdit,
  },
  {
    num: "6",
    label: "Review your leads pipeline",
    description: "Track prospects and follow-ups",
    href: "/admin/leads",
    icon: TrendingUp,
  },
];

function GettingStarted() {
  return (
    <section
      className="bg-white border border-light-gray shadow-sm rounded-xl p-6"
      aria-labelledby="getting-started-heading"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 bg-red/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Rocket className="w-4 h-4 text-red" aria-hidden="true" />
        </div>
        <h3
          id="getting-started-heading"
          className="text-navy font-bold text-sm uppercase tracking-wider"
        >
          Onboarding Checklist
        </h3>
      </div>
      <p className="text-text-secondary text-xs mb-5 ml-11">
        Complete these steps to get your facility fully operational
      </p>
      <ul className="space-y-2">
        {STEPS.map((step) => (
          <li key={step.num}>
            <Link
              href={step.href}
              prefetch
              className="flex items-center gap-3 px-4 py-3.5 bg-off-white hover:bg-light-gray border border-light-gray rounded-xl transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
            >
              <span className="w-7 h-7 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold flex-shrink-0">
                {step.num}
              </span>
              <div className="min-w-0 flex-1">
                <span className="text-navy text-sm font-medium block">{step.label}</span>
                <span className="text-text-secondary text-xs">{step.description}</span>
              </div>
              <ArrowRight
                className="w-3.5 h-3.5 text-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
