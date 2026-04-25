"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardList,
  Coffee,
  Shield,
  LayoutDashboard,
  UserCheck,
  Brush,
  ParkingCircle,
  ArrowLeft,
  Calculator,
} from "lucide-react";

// Staffing template — how many people you need per role to run a
// normal game day at Inspire Courts. The scorekeeper count scales
// with the number of courts open; everything else is a range.

type Need = {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  perCourt?: number;  // multiply by # of courts
  fixedMin?: number;  // static minimum
  fixedMax?: number;  // static maximum
  role: "staff" | "ref" | "front_desk" | "admin";
  tint: string;
  iconBg: string;
  iconFg: string;
};

const NEEDS: Need[] = [
  {
    key: "scorekeeper",
    label: "Scorekeeper",
    description: "One per court — scoreboard + game clock",
    icon: ClipboardList,
    perCourt: 1,
    role: "ref",
    tint: "red",
    iconBg: "bg-red/10",
    iconFg: "text-red",
  },
  {
    key: "snack_shop",
    label: "Snack Shop",
    description: "Concessions & retail",
    icon: Coffee,
    fixedMin: 1,
    fixedMax: 1,
    role: "staff",
    tint: "purple",
    iconBg: "bg-purple-50",
    iconFg: "text-purple-600",
  },
  {
    key: "admin",
    label: "Admin",
    description: "On-site manager — handles escalations",
    icon: Shield,
    fixedMin: 1,
    fixedMax: 1,
    role: "admin",
    tint: "navy",
    iconBg: "bg-navy/5",
    iconFg: "text-navy",
  },
  {
    key: "front_desk",
    label: "Front Desk",
    description: "Greeting, waivers, walk-ins",
    icon: LayoutDashboard,
    fixedMin: 1,
    fixedMax: 2,
    role: "front_desk",
    tint: "blue",
    iconBg: "bg-blue-50",
    iconFg: "text-blue-600",
  },
  {
    key: "player_checkin",
    label: "Player Check-In",
    description: "Team arrival + bracket verification",
    icon: UserCheck,
    fixedMin: 1,
    fixedMax: 1,
    role: "staff",
    tint: "emerald",
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-600",
  },
  {
    key: "cleaning",
    label: "Cleaning",
    description: "Bathrooms + floors + trash",
    icon: Brush,
    fixedMin: 1,
    fixedMax: 2,
    role: "staff",
    tint: "amber",
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
  },
  {
    key: "parking",
    label: "Parking",
    description: "Lot direction, overflow",
    icon: ParkingCircle,
    fixedMin: 1,
    fixedMax: 2,
    role: "staff",
    tint: "amber",
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
  },
];

export default function StaffingNeedsPage() {
  const [courts, setCourts] = useState(7);
  const [useMaxRange, setUseMaxRange] = useState(false);

  const computeCount = (n: Need): number => {
    if (n.perCourt) return n.perCourt * courts;
    if (useMaxRange && n.fixedMax) return n.fixedMax;
    return n.fixedMin || 0;
  };

  const total = NEEDS.reduce((s, n) => s + computeCount(n), 0);
  const minTotal = NEEDS.reduce((s, n) => s + (n.perCourt ? n.perCourt * courts : n.fixedMin || 0), 0);
  const maxTotal = NEEDS.reduce((s, n) => s + (n.perCourt ? n.perCourt * courts : n.fixedMax || n.fixedMin || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-text-muted hover:text-navy text-xs font-semibold uppercase tracking-wider mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Admin Dashboard
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy via-navy to-navy/85 text-white shadow-xl mb-4 sm:mb-6">
        <div aria-hidden="true" className="absolute -right-10 -top-10 w-60 h-60 sm:-right-20 sm:-top-20 sm:w-80 sm:h-80 rounded-full bg-red/20 blur-3xl" />
        <div className="relative p-4 sm:p-8">
          <p className="text-white/50 text-[11px] uppercase tracking-[0.2em] mb-1.5">Staff · Planning</p>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading tracking-tight flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-red" />
            Staffing Needs
          </h1>
          <p className="text-white/60 text-sm max-w-xl mb-6">
            Your standing staff plan for game day. Adjust the court count to recalc.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
              <label className="block text-white/60 text-[10px] uppercase tracking-[0.2em] mb-1.5 font-semibold">Courts Open</label>
              <input
                type="number"
                min={1}
                max={20}
                value={courts}
                onChange={(e) => setCourts(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="bg-transparent text-white font-heading text-3xl font-bold tracking-tight tabular-nums w-full focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:rounded"
              />
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
              <p className="text-white font-heading text-3xl font-bold tracking-tight tabular-nums">{minTotal}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">Min Staff</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-4 border border-white/10">
              <p className="text-white font-heading text-3xl font-bold tracking-tight tabular-nums">{maxTotal}</p>
              <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold">Max Staff</p>
            </div>
            <button
              onClick={() => setUseMaxRange(!useMaxRange)}
              className="bg-red hover:bg-red-hover rounded-2xl px-4 py-4 border border-red/30 text-left transition-colors"
            >
              <p className="text-white font-heading text-3xl font-bold tracking-tight tabular-nums">{total}</p>
              <p className="text-white/80 text-[10px] uppercase tracking-[0.2em] mt-1.5 font-semibold flex items-center gap-1">
                <Calculator className="w-3 h-3" /> {useMaxRange ? "Max plan" : "Min plan"} · tap
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Needs list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NEEDS.map((n) => {
          const count = computeCount(n);
          const range = n.perCourt
            ? `${n.perCourt} per court`
            : n.fixedMin === n.fixedMax
            ? `${n.fixedMin}`
            : `${n.fixedMin}–${n.fixedMax}`;
          return (
            <div key={n.key} className="bg-white border border-border rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${n.iconBg} flex items-center justify-center flex-shrink-0`}>
                <n.icon className={`w-6 h-6 ${n.iconFg}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-navy font-bold text-base">{n.label}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-off-white text-text-muted">
                    {n.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-text-muted text-xs mt-0.5">{n.description}</p>
                <p className="text-text-muted text-[10px] uppercase tracking-wider mt-1">
                  Rule: {range}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-navy font-heading text-3xl font-bold tabular-nums">{count}</p>
                <p className="text-text-muted text-[10px] uppercase tracking-wider">Needed</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white border border-border rounded-2xl shadow-sm p-5">
        <p className="text-text-muted text-xs">
          <strong className="text-navy">Tip:</strong> Use this plan to build shifts in
          {" "}<Link href="/admin/shifts" className="text-red font-semibold hover:underline">Shifts</Link>{" "}
          before a tournament. One shift per needed headcount gets the schedule fully staffed.
        </p>
      </div>
    </div>
  );
}
