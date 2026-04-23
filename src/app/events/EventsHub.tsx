"use client";

import { useState, useEffect, type ElementType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Trophy,
  Clock,
  ExternalLink,
  Ticket,
  UserCheck,
  UtensilsCrossed,
  Footprints,
  ShieldCheck,
  Film,
  Snowflake,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  ClipboardList,
  Info} from "lucide-react";
// RegisterLink removed — registerUrl is now internal (/tournaments)
import QuickScoresEmbed from "@/components/ui/QuickScoresEmbed";

/* ─── Types ─── */
export interface EventData {
  name: string;
  date: string;
  rawDate: string;
  divisions: string[];
  fee: string;
  teams: number;
  maxTeams: number | null;
  status: string;
  brand: string;
  sport: string;
  bracketLink: string;
  regDeadline: string;
}

export interface PastEventData {
  name: string;
  date: string;
  teams: number;
  brand: string;
}

interface EventsHubProps {
  upcoming: EventData[];
  past: PastEventData[];
  registerUrl: string;
  facilityEmail: string;
  facilityAddress: string;
  instagramHandle: string;
  youtubeUrl: string;
  quickScoresUrl: string;
}

/* ─── Sub-components ─── */

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Registration Open"
      ? "bg-green-500/10 text-green-600 border-green-500/20"
      : status === "In Progress"
        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
        : status === "Registration Closed"
          ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";

  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cls}`}>
      {status === "Registration Open" && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />}
      {status}
    </span>
  );
}

function CapacityBar({ teams, maxTeams }: { teams: number; maxTeams: number }) {
  const pct = Math.min((teams / maxTeams) * 100, 100);
  const almostFull = pct >= 80;
  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className={`font-semibold ${almostFull ? "text-orange-600" : "text-text-muted"}`}>
          {teams} / {maxTeams} teams
        </span>
        {almostFull && <span className="text-orange-600 font-bold">Almost full!</span>}
      </div>
      <div className="w-full h-2 bg-light-gray rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${almostFull ? "bg-orange-500" : "bg-red"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Game Day Data ─── */
const GAME_DAY_SECTIONS = [
  {
    id: "checkin",
    icon: UserCheck,
    title: "Check-In Process",
    items: [
      "Head coach checks in at the front table with a valid photo ID",
      "Rosters must be submitted before your first game",
      "Arrive at least 15 minutes before your first game",
    ],
  },
  {
    id: "admission",
    icon: Ticket,
    title: "Spectator Admission",
    items: [
      "Admission at the door — cash and card accepted",
      "Kids under 5 are free",
      "Re-entry allowed with wristband",
    ],
  },
  {
    id: "schedule",
    icon: Clock,
    title: "Schedules & Brackets",
    items: [
      "Schedules drop 48 hours before tip-off",
      "Emailed directly to the head coach on file",
      "Also posted on the Schedule tab and QuickScores",
    ],
  },
  {
    id: "food",
    icon: UtensilsCrossed,
    title: "Food & Drinks",
    items: [
      "Snack bar is open all day during events",
      "No outside food, coolers, or beverages allowed inside",
      "Players may bring 1 bottled water + 1 sports drink",
      "No gum or sunflower seeds on the courts",
    ],
  },
  {
    id: "gear",
    icon: Footprints,
    title: "What to Wear",
    items: [
      "Non-marking court shoes ONLY (basketball, volleyball, indoor soccer)",
      "No dress shoes, sandals, cleats, or boots",
      "Team uniforms with numbers required for games",
    ],
  },
  {
    id: "rules",
    icon: ShieldCheck,
    title: "House Rules",
    items: [
      "Good sportsmanship at all times — coaches responsible for their bench & fans",
      "No hanging on rims",
      "No profanity or fighting",
      "Clean team benches after each game",
      "Children not playing must be supervised at all times",
      "Inspire Courts reserves the right to remove anyone",
    ],
  },
  {
    id: "location",
    icon: MapPin,
    title: "Getting Here",
    items: [
      "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233",
      "Free parking lot right in front of the building",
      "From US-60: Gilbert Rd south → Guadalupe Rd → Fiesta Blvd",
    ],
  },
];

const WHATS_INCLUDED = [
  { icon: Trophy, label: "3+ Game Guarantee", desc: "Every team plays at least 3 games" },
  { icon: Film, label: "Game Film", desc: "Every game is recorded for review" },
  { icon: Snowflake, label: "Air Conditioned", desc: "52,000 sq ft climate-controlled" },
  { icon: UtensilsCrossed, label: "Snack Bar", desc: "Food & drinks available all day" },
  { icon: Users, label: "Electronic Scoreboards", desc: "Professional scoreboards on every court" },
  { icon: MapPin, label: "7 Hardwood Courts", desc: "5 college regulation with arrows" },
];

/* ─── Tabs ─── */
type TabId = "events" | "schedule" | "gameday";

const TABS: { id: TabId; label: string; icon: ElementType }[] = [
  { id: "events", label: "Tournaments", icon: Trophy },
  { id: "schedule", label: "Schedule & Brackets", icon: ClipboardList },
  { id: "gameday", label: "Game Day Info", icon: Info },
];

/* ─── Main Component ─── */
export default function EventsHub({
  upcoming,
  past,
  registerUrl,
  facilityEmail,
  facilityAddress,
  instagramHandle,
  youtubeUrl,
  quickScoresUrl,
}: EventsHubProps) {
  const [activeTab, setActiveTab] = useState<TabId>("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedSection, setExpandedSection] = useState<string | null>("checkin");

  // Read hash on mount to deep-link to tabs
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "schedule" || hash === "brackets") setActiveTab("schedule");
    else if (hash === "gameday" || hash === "game-day") setActiveTab("gameday");
  }, []);

  // Update hash on tab change
  useEffect(() => {
    if (activeTab !== "events") {
      window.history.replaceState(null, "", `#${activeTab}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [activeTab]);

  // Unique divisions + statuses from the data
  const allDivisions = Array.from(
    new Set(upcoming.flatMap((e) => e.divisions))
  ).sort();
  const allStatuses = Array.from(
    new Set(upcoming.map((e) => e.status).filter(Boolean))
  );

  // Filter events
  const filteredEvents = upcoming.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        e.name.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.divisions.some((d) => d.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (divisionFilter !== "all" && !e.divisions.includes(divisionFilter))
      return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      {/* ─── Sticky Tab Navigation ─── */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-light-gray shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-3 lg:px-5 lg:py-4 text-xs lg:text-sm font-bold uppercase tracking-normal lg:tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-red text-red"
                      : "border-transparent text-text-muted hover:text-navy hover:border-navy/20"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Tab: Tournaments ─── */}
      {activeTab === "events" && (
        <>
          {/* Search + Filters */}
          <section className="py-8 bg-off-white border-b border-light-gray">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-light-gray rounded-xl bg-white text-sm text-navy placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-red focus:border-red transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Division Filter */}
                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
                  <select
                    aria-label="Filter by division"
                    value={divisionFilter}
                    onChange={(e) => setDivisionFilter(e.target.value)}
                    className="w-full lg:w-auto appearance-none pl-10 pr-10 py-3 border border-light-gray rounded-xl bg-white text-sm text-navy cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red focus:border-red transition-colors"
                  >
                    <option value="all">All Divisions</option>
                    {allDivisions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full lg:w-auto appearance-none pl-4 pr-10 py-3 border border-light-gray rounded-xl bg-white text-sm text-navy cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red focus:border-red transition-colors"
                  >
                    <option value="all">All Statuses</option>
                    {allStatuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
                </div>

                {/* Count */}
                <p className="text-text-muted text-sm font-medium lg:ml-2 whitespace-nowrap">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </section>

          {/* Event Cards */}
          <section className="py-12 lg:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {filteredEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {filteredEvents.map((event, i) => (
                    <div
                      key={i}
                      className="group bg-white border border-light-gray rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:border-red/20"
                    >
                      {/* Card header */}
                      <div className="bg-navy px-6 py-4 flex items-center justify-between">
                        <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
                          {event.brand}
                        </span>
                        <StatusBadge status={event.status} />
                      </div>

                      {/* Card body */}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-4 font-[var(--font-chakra)] group-hover:text-red transition-colors">
                          {event.name}
                        </h3>

                        <div className="space-y-3 mb-5">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4 h-4 text-red" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="text-navy font-medium">{event.date}</p>
                              {event.regDeadline && (
                                <p className="text-text-muted text-xs">
                                  Reg deadline: {event.regDeadline}
                                </p>
                              )}
                            </div>
                          </div>

                          {event.fee && (
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4 h-4 text-red" aria-hidden="true" />
                              </div>
                              <p className="text-navy font-medium">{event.fee} per team</p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-red" aria-hidden="true" />
                            </div>
                            <p className="text-text-muted">Inspire Courts AZ, Gilbert</p>
                          </div>
                        </div>

                        {/* Capacity bar */}
                        {event.maxTeams && event.maxTeams > 0 && (
                          <div className="mb-5">
                            <CapacityBar teams={event.teams} maxTeams={event.maxTeams} />
                          </div>
                        )}

                        {/* Division pills */}
                        {event.divisions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-6">
                            {event.divisions.map((div) => (
                              <span
                                key={div}
                                className="bg-navy/5 text-navy text-xs font-semibold px-3 py-1.5 rounded-full border border-navy/10"
                              >
                                {div}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="mt-auto flex gap-2">
                          {event.status === "Registration Open" ? (
                            <Link
                              href={registerUrl}
                              className="flex-1 flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all hover:scale-[1.02] shadow-md shadow-red/20"
                            >
                              Register Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                          ) : event.status === "In Progress" && event.bracketLink ? (
                            <a
                              href={event.bracketLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 bg-navy hover:bg-navy/90 text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                            >
                              View Brackets <ExternalLink className="w-4 h-4" aria-hidden="true" />
                            </a>
                          ) : event.status === "Registration Closed" ? (
                            <button
                              disabled
                              className="flex-1 flex items-center justify-center gap-2 bg-light-gray text-text-muted py-3.5 rounded-full font-bold text-sm uppercase tracking-wide cursor-not-allowed"
                            >
                              Registration Closed
                            </button>
                          ) : (
                            <Link
                              href={registerUrl}
                              className="flex-1 flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                            >
                              Register <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcoming.length > 0 ? (
                /* Filters returned no matches */
                <div className="max-w-md mx-auto text-center py-12">
                  <Search className="w-10 h-10 text-text-muted mx-auto mb-4 opacity-40" aria-hidden="true" />
                  <h3 className="text-navy font-bold text-lg mb-2">No matching tournaments</h3>
                  <p className="text-text-muted text-sm mb-4">
                    Try adjusting your filters or search terms.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setDivisionFilter("all");
                      setStatusFilter("all");
                    }}
                    className="text-red hover:text-red-hover text-sm font-bold uppercase tracking-wide"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                /* No events at all */
                <div className="max-w-2xl mx-auto text-center bg-off-white border border-light-gray rounded-2xl p-10">
                  <Trophy className="w-12 h-12 text-red mx-auto mb-4" aria-hidden="true" />
                  <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                    Tournaments Coming Soon
                  </h3>
                  <p className="text-text-muted text-sm mb-6 leading-relaxed max-w-md mx-auto">
                    New tournaments are announced regularly. Follow us on Instagram
                    or check our tournaments page to be first to know when registration opens.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={registerUrl}
                      className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                      Browse Tournaments <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                    <a
                      href={`https://instagram.com/${instagramHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 border-2 border-navy/20 hover:border-navy/40 text-navy px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                    >
                      {instagramHandle}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* What's Included Banner */}
          <section className="py-10 bg-navy">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-white/50 text-xs font-bold uppercase tracking-[0.2em] text-center mb-6 font-[var(--font-chakra)]">
                Every Tournament Includes
              </p>
              <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                {WHATS_INCLUDED.map((item, i) => (
                  <div key={i} className="text-center px-1 lg:px-2">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <item.icon className="w-4 h-4 lg:w-5 lg:h-5 text-red" />
                    </div>
                    <p className="text-white text-xs font-bold uppercase tracking-wider mb-0.5">
                      {item.label}
                    </p>
                    <p className="text-white/50 text-[11px]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Past Events */}
          {past.length > 0 && (
            <section className="py-12 lg:py-20 bg-off-white">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-navy font-bold text-2xl uppercase tracking-tight mb-6 font-[var(--font-chakra)]">
                  Past Tournaments
                </h2>
                <div className="space-y-2">
                  {past.map((event, i) => (
                    <div
                      key={i}
                      className="bg-white border border-light-gray rounded-xl px-4 py-3 lg:px-5 lg:py-4 flex items-center justify-between gap-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-navy/5 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4 text-navy/40" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                            {event.name}
                          </h3>
                          <p className="text-text-muted text-xs mt-0.5">
                            {event.date}
                            {event.teams ? ` · ${event.teams} teams` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("schedule")}
                        className="text-red text-xs font-bold uppercase tracking-wide hover:text-red-hover transition-colors whitespace-nowrap"
                      >
                        Results →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <section className="py-14 bg-red">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h3 className="text-white font-bold text-xl lg:text-2xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                Don&apos;t see your division?
              </h3>
              <p className="text-white/80 mb-6 text-sm lg:text-base">
                Let us know what age group you&apos;re looking for — we&apos;re always adding new tournaments.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-red hover:bg-white/90 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Contact Us <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <a
                  href={`mailto:${facilityEmail}`}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border-2 border-white/40 hover:bg-white hover:text-red text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  {facilityEmail}
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ─── Tab: Schedule & Brackets ─── */}
      {activeTab === "schedule" && (
        <>
          {/* Info Bar */}
          <section className="py-6 bg-off-white border-b border-light-gray">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-red" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-navy font-bold text-sm">
                      Schedules drop <span className="text-red">48 hours</span> before tip-off
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
                      Emailed to head coaches on file. Check below or visit QuickScores for live brackets.
                    </p>
                  </div>
                </div>
                <a
                  href={quickScoresUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap"
                >
                  Open QuickScores <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          {/* Quick Links to active events */}
          {upcoming.filter((e) => e.status === "In Progress" || e.status === "Registration Closed").length > 0 && (
            <section className="py-6 bg-white border-b border-light-gray">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-text-muted text-xs font-bold uppercase tracking-[0.15em] mb-3">Active Events</p>
                <div className="flex flex-wrap gap-2">
                  {upcoming
                    .filter((e) => e.status === "In Progress" || e.status === "Registration Closed")
                    .map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-off-white border border-light-gray rounded-full px-4 py-2 text-sm"
                      >
                        <span className={`w-2 h-2 rounded-full ${e.status === "In Progress" ? "bg-blue-500 animate-pulse" : "bg-orange-500"}`} />
                        <span className="font-semibold text-navy">{e.name}</span>
                        <span className="text-text-muted text-xs">· {e.date}</span>
                        {e.bracketLink && (
                          <a
                            href={e.bracketLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red hover:text-red-hover font-bold text-xs uppercase"
                          >
                            Brackets →
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}

          {/* QuickScores Embed */}
          <section className="py-12 lg:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white border border-light-gray rounded-2xl overflow-hidden shadow-sm">
                <QuickScoresEmbed
                  src={quickScoresUrl}
                  title="Inspire Courts Tournament Schedules — QuickScores"
                  className="min-h-[500px] md:min-h-[800px]"
                />
              </div>
            </div>
          </section>

          {/* Schedule Help */}
          <section className="py-10 bg-off-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-light-gray rounded-xl p-5 text-center">
                  <AlertCircle className="w-6 h-6 text-red mx-auto mb-2" aria-hidden="true" />
                  <p className="text-navy font-bold text-sm mb-1">Can&apos;t find your schedule?</p>
                  <p className="text-text-muted text-xs">
                    Check your coach&apos;s email or contact us.
                  </p>
                </div>
                <div className="bg-white border border-light-gray rounded-xl p-5 text-center">
                  <Clock className="w-6 h-6 text-red mx-auto mb-2" aria-hidden="true" />
                  <p className="text-navy font-bold text-sm mb-1">Schedule not posted yet?</p>
                  <p className="text-text-muted text-xs">
                    Schedules are released 48 hours before the event.
                  </p>
                </div>
                <div className="bg-white border border-light-gray rounded-xl p-5 text-center">
                  <CheckCircle2 className="w-6 h-6 text-red mx-auto mb-2" aria-hidden="true" />
                  <p className="text-navy font-bold text-sm mb-1">Need results?</p>
                  <p className="text-text-muted text-xs">
                    Past brackets and scores are on QuickScores.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ─── Tab: Game Day Info ─── */}
      {activeTab === "gameday" && (
        <>
          {/* Quick summary bar */}
          <section className="py-6 bg-red">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
                <div>
                  <p className="text-white font-bold text-base lg:text-lg font-[var(--font-chakra)]">$15</p>
                  <p className="text-white/70 text-[11px] lg:text-xs">Spectator Admission</p>
                </div>
                <div>
                  <p className="text-white font-bold text-base lg:text-lg font-[var(--font-chakra)]">48 hrs</p>
                  <p className="text-white/70 text-[11px] lg:text-xs">Schedule Release</p>
                </div>
                <div>
                  <p className="text-white font-bold text-base lg:text-lg font-[var(--font-chakra)]">Photo ID</p>
                  <p className="text-white/70 text-[11px] lg:text-xs">Coach Check-In</p>
                </div>
                <div>
                  <p className="text-white font-bold text-base lg:text-lg font-[var(--font-chakra)]">Court Shoes</p>
                  <p className="text-white/70 text-[11px] lg:text-xs">Non-Marking Only</p>
                </div>
              </div>
            </div>
          </section>

          {/* Accordion sections */}
          <section className="py-12 lg:py-20 bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-navy font-bold text-2xl lg:text-3xl uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                Everything You Need to Know
              </h2>
              <p className="text-text-muted text-sm mb-8">
                First time at Inspire Courts? Here&apos;s the full breakdown so you&apos;re ready to go.
              </p>

              <div className="space-y-2">
                {GAME_DAY_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isOpen = expandedSection === section.id;
                  return (
                    <div
                      key={section.id}
                      className={`border rounded-xl overflow-hidden transition-colors ${
                        isOpen ? "border-red/30 bg-red/[0.02]" : "border-light-gray bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSection(isOpen ? null : section.id)
                        }
                        aria-expanded={isOpen}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          isOpen ? "bg-red/10" : "bg-off-white"
                        }`}>
                          <Icon className={`w-5 h-5 transition-colors ${isOpen ? "text-red" : "text-navy/50"}`} />
                        </div>
                        <span className={`font-bold text-sm uppercase tracking-tight flex-1 font-[var(--font-chakra)] transition-colors ${
                          isOpen ? "text-red" : "text-navy"
                        }`}>
                          {section.title}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <ul className="px-5 pb-5 pl-[4.25rem] space-y-2">
                          {section.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-sm text-text-muted leading-relaxed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Map Section */}
          <section className="py-12 lg:py-16 bg-off-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-navy font-bold text-xl uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                    Find Us
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed mb-4">
                    {facilityAddress}
                  </p>
                  <div className="space-y-2 text-sm text-text-muted">
                    <p><span className="font-semibold text-navy">Parking:</span> Free lot right out front</p>
                    <p><span className="font-semibold text-navy">Entrance:</span> Suites 101 &amp; 102</p>
                    <p><span className="font-semibold text-navy">From US-60:</span> Gilbert Rd south → Guadalupe Rd → Fiesta Blvd</p>
                  </div>
                  <a
                    href="https://www.google.com/maps/place/1090+N+Fiesta+Blvd,+Gilbert,+AZ+85233"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-red hover:text-red-hover text-sm font-bold uppercase tracking-wide mt-4 transition-colors"
                  >
                    Get Directions <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-light-gray shadow-sm">
                  <iframe
                    src="https://maps.google.com/maps?q=1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233&output=embed&z=16"
                    title="Inspire Courts AZ location"
                    className="w-full h-64 lg:h-80 border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Full details link */}
          <section className="py-8 bg-white border-t border-light-gray">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Link
                href="/gameday"
                className="inline-flex items-center gap-2 text-red hover:text-red-hover text-sm font-bold uppercase tracking-wide transition-colors"
              >
                Full Game Day Page <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
