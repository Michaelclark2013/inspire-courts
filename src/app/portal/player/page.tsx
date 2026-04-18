"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Users,
  Calendar,
  Trophy,
  Info,
  Video,
  ChevronRight,
  ArrowRight,
  Star,
  MapPin,
  Clock,
  Shield,
  ExternalLink,
  Search,
} from "lucide-react";

// ── Placeholder data ───────────────────────────────────────────────────────
const DEMO_PLAYER = {
  name: "Marcus Johnson",
  team: "AZ Warriors 14U",
  division: "14U Elite",
  jersey: "#23",
  coach: "Coach D. Williams",
  position: "Guard",
};

const DEMO_SCHEDULE = [
  { date: "Sat, Jan 20", time: "10:30 AM", opponent: "Phoenix Suns Jr.", court: "Court 2", tournament: "Gilbert Spring Classic", status: "upcoming" },
  { date: "Sat, Jan 20", time: "1:00 PM", opponent: "Scottsdale Hawks", court: "Court 1", tournament: "Gilbert Spring Classic", status: "upcoming" },
  { date: "Sun, Jan 21", time: "9:00 AM", opponent: "Mesa Thunder", court: "Court 3", tournament: "Gilbert Spring Classic", status: "upcoming" },
];

const DEMO_RESULTS = [
  { date: "Jan 13", opponent: "West Valley Ballers", myScore: 58, oppScore: 42, result: "W" },
  { date: "Jan 13", opponent: "Tempe Blazers", myScore: 61, oppScore: 55, result: "W" },
  { date: "Jan 7", opponent: "Chandler Elite", myScore: 44, oppScore: 50, result: "L" },
];

const DEMO_STANDINGS = [
  { rank: 1, team: "AZ Warriors 14U", w: 5, l: 1, pct: ".833" },
  { rank: 2, team: "Phoenix Suns Jr.", w: 4, l: 2, pct: ".667" },
  { rank: 3, team: "Scottsdale Hawks", w: 3, l: 3, pct: ".500" },
  { rank: 4, team: "Mesa Thunder", w: 2, l: 4, pct: ".333" },
];

const GAMEDAY_TIPS = [
  { icon: Clock, text: "Arrive 30 min before tip-off for warm-ups" },
  { icon: Shield, text: "Bring your player ID or team card" },
  { icon: MapPin, text: "Gilbert Sports Complex · 2355 E Knox Rd, Gilbert, AZ" },
  { icon: Star, text: "Wear your official team jersey — no alterations" },
];

const HIGHLIGHTS = [
  { label: "AZ Finest Mixtape Vol. 3", year: "2024", url: "#" },
  { label: "AZ Finest Mixtape Vol. 2", year: "2023", url: "#" },
];
// ─────────────────────────────────────────────────────────────────────────

type Step = "select" | "lookup" | "portal";

export default function PlayerPortalPage() {
  const [step, setStep] = useState<Step>("select");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [displayName, setDisplayName] = useState(DEMO_PLAYER.name);
  const [activeTab, setActiveTab] = useState<"schedule" | "results" | "standings" | "gameday" | "highlights">("schedule");

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) setDisplayName(name.trim());
    setStep("portal");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-light-gray px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={28} height={28} className="object-contain" />
          <span className="text-navy font-bold text-sm uppercase tracking-tight">Inspire</span>
        </Link>
        <span className="text-text-muted text-xs font-semibold uppercase tracking-widest">Player Portal</span>
        <Link href="/portal/coach" className="text-red text-xs font-semibold hover:text-red-hover transition-colors">
          Coach →
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ── Step 1: Role Selection ───────────────────────────────── */}
        {step === "select" && (
          <div className="space-y-6">
            {/* Hero */}
            <div className="text-center pt-4 pb-2">
              <div className="w-16 h-16 bg-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-red" />
              </div>
              <h1 className="text-navy text-2xl font-bold font-heading uppercase tracking-tight mb-1">Team Portal</h1>
              <p className="text-text-muted text-sm">Access your team info, schedule, and scores.</p>
            </div>

            {/* Role cards */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep("lookup")}
                className="w-full bg-white border border-light-gray hover:border-red/40 rounded-2xl p-5 flex items-center gap-4 transition-all group text-left"
              >
                <div className="w-12 h-12 bg-red/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red/20 transition-colors">
                  <User className="w-6 h-6 text-red" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-bold text-base">I&apos;m a Player</p>
                  <p className="text-text-muted text-sm">View your schedule, scores &amp; standings</p>
                </div>
                <ChevronRight className="w-5 h-5 text-light-gray group-hover:text-red transition-colors flex-shrink-0" />
              </button>

              <Link
                href="/portal/coach"
                className="w-full bg-white border border-light-gray hover:border-blue-300 rounded-2xl p-5 flex items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-bold text-base">I&apos;m a Coach</p>
                  <p className="text-text-muted text-sm">Manage roster, check-in &amp; game day</p>
                </div>
                <ChevronRight className="w-5 h-5 text-light-gray group-hover:text-blue-600 transition-colors flex-shrink-0" />
              </Link>
            </div>

            {/* Already have an account */}
            <p className="text-center text-text-muted text-xs">
              Staff or registered coach?{" "}
              <Link href="/login" className="text-red font-semibold hover:text-red-hover">
                Sign in here
              </Link>
            </p>
          </div>
        )}

        {/* ── Step 2: Lookup Form ──────────────────────────────────── */}
        {step === "lookup" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setStep("select")} className="text-red hover:text-red-hover transition-colors text-sm font-semibold flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back
              </button>
              <h2 className="text-navy font-bold text-lg">Find Your Info</h2>
            </div>

            <div className="bg-white border border-light-gray rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <Search className="w-4 h-4 text-red" />
                <p className="text-navy font-semibold text-sm">Enter your details below</p>
              </div>
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label htmlFor="player-name" className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Your Name</label>
                  <input
                    id="player-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First &amp; last name"
                    required
                    className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-base focus:outline-none focus:border-red/60 focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-text-muted/50"
                  />
                </div>
                <div>
                  <label htmlFor="player-team" className="block text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Team Name</label>
                  <input
                    id="player-team"
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="e.g. AZ Warriors 14U"
                    className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-base focus:outline-none focus:border-red/60 focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-text-muted/50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red hover:bg-red-hover text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  View My Portal <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <p className="text-center text-text-muted text-xs px-4">
              We&apos;ll match your name to your registered team. If you&apos;re not found, contact your coach.
            </p>
          </div>
        )}

        {/* ── Step 3: Player Portal ────────────────────────────────── */}
        {step === "portal" && (
          <div className="space-y-5">

            {/* Player card */}
            <div className="bg-gradient-to-br from-red/10 to-white border border-red/20 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red font-bold text-xl font-heading">{displayName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-bold text-lg leading-tight">{displayName}</p>
                  <p className="text-text-muted text-sm">{DEMO_PLAYER.team}</p>
                  <p className="text-red text-xs font-semibold uppercase tracking-wider mt-0.5">{DEMO_PLAYER.division} · {DEMO_PLAYER.position}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-light-gray text-xs uppercase tracking-wider">Jersey</p>
                  <p className="text-navy font-bold text-2xl font-heading">{DEMO_PLAYER.jersey}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-light-gray flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-text-muted text-xs">{DEMO_PLAYER.coach}</span>
              </div>
            </div>

            {/* Demo data notice */}
            <div className="bg-amber-50 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-600/80 text-xs leading-relaxed">
                Showing sample data. Live player lookups will be available once your team is registered in the system.
              </p>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 bg-white border border-light-gray rounded-xl p-1 overflow-x-auto scrollbar-none">
              {[
                { key: "schedule", icon: Calendar, label: "Schedule" },
                { key: "results", icon: Trophy, label: "Results" },
                { key: "standings", icon: Star, label: "Standings" },
                { key: "gameday", icon: Info, label: "Game Day" },
                { key: "highlights", icon: Video, label: "Highlights" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
                    activeTab === key
                      ? "bg-red text-white"
                      : "text-text-muted hover:text-navy"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Schedule tab ── */}
            {activeTab === "schedule" && (
              <div className="space-y-3">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest px-1">Upcoming Games</h3>
                {DEMO_SCHEDULE.map((g, i) => (
                  <div key={i} className="bg-white border border-light-gray rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-navy font-bold text-sm">vs {g.opponent}</p>
                        <p className="text-text-muted text-xs mt-0.5">{g.tournament}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                        Upcoming
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-text-muted text-xs">{g.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-text-muted text-xs">{g.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-text-muted text-xs">{g.court}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Results tab ── */}
            {activeTab === "results" && (
              <div className="space-y-3">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest px-1">Recent Results</h3>
                {DEMO_RESULTS.map((r, i) => (
                  <div key={i} className="bg-white border border-light-gray rounded-2xl px-4 py-3.5 flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${r.result === "W" ? "bg-emerald-50 text-emerald-600" : "bg-red/20 text-red"}`}>
                      {r.result}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-navy font-semibold text-sm truncate">vs {r.opponent}</p>
                      <p className="text-text-muted text-xs">{r.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-navy font-bold font-heading tabular-nums">{r.myScore}–{r.oppScore}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Standings tab ── */}
            {activeTab === "standings" && (
              <div className="space-y-3">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest px-1">14U Elite Division</h3>
                <div className="bg-white border border-light-gray rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-2.5 border-b border-light-gray">
                    <span className="col-span-1 text-text-muted text-[10px] font-bold uppercase">#</span>
                    <span className="col-span-7 text-text-muted text-[10px] font-bold uppercase">Team</span>
                    <span className="col-span-2 text-text-muted text-[10px] font-bold uppercase text-center">W-L</span>
                    <span className="col-span-2 text-text-muted text-[10px] font-bold uppercase text-right">PCT</span>
                  </div>
                  {DEMO_STANDINGS.map((row) => (
                    <div
                      key={row.rank}
                      className={`grid grid-cols-12 px-4 py-3.5 border-b border-light-gray last:border-0 ${row.rank === 1 ? "bg-red/[0.06]" : ""}`}
                    >
                      <span className={`col-span-1 text-sm font-bold ${row.rank === 1 ? "text-red" : "text-text-muted"}`}>{row.rank}</span>
                      <span className={`col-span-7 text-sm font-semibold truncate ${row.rank === 1 ? "text-navy" : "text-text-muted"}`}>
                        {row.team}
                        {row.rank === 1 && <span className="ml-1.5 text-[10px] text-red">← You</span>}
                      </span>
                      <span className={`col-span-2 text-sm text-center tabular-nums ${row.rank === 1 ? "text-navy font-bold" : "text-text-muted"}`}>{row.w}-{row.l}</span>
                      <span className={`col-span-2 text-sm text-right tabular-nums ${row.rank === 1 ? "text-red font-bold" : "text-text-muted"}`}>{row.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Game Day tab ── */}
            {activeTab === "gameday" && (
              <div className="space-y-3">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest px-1">Game Day Checklist</h3>
                {GAMEDAY_TIPS.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="bg-white border border-light-gray rounded-2xl px-4 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 bg-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-red" />
                    </div>
                    <p className="text-navy text-sm leading-snug">{text}</p>
                  </div>
                ))}
                <div className="bg-white border border-light-gray rounded-2xl px-4 py-4">
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Venue</p>
                  <p className="text-navy text-sm font-semibold">Gilbert Sports Complex</p>
                  <p className="text-text-muted text-xs mt-0.5">2355 E Knox Rd, Gilbert, AZ 85234</p>
                  <a
                    href="https://maps.apple.com/?q=Gilbert+Sports+Complex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-red text-xs font-semibold mt-3 hover:text-red-hover transition-colors"
                  >
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* ── Highlights tab ── */}
            {activeTab === "highlights" && (
              <div className="space-y-3">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest px-1">AZ Finest Mixtape</h3>
                {HIGHLIGHTS.map((h, i) => (
                  <a
                    key={i}
                    href={h.url}
                    className="bg-white border border-light-gray hover:border-red/30 rounded-2xl px-4 py-4 flex items-center gap-4 transition-all group"
                  >
                    <div className="w-10 h-10 bg-red/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red/20 transition-colors">
                      <Video className="w-5 h-5 text-red" />
                    </div>
                    <div className="flex-1">
                      <p className="text-navy font-semibold text-sm">{h.label}</p>
                      <p className="text-text-muted text-xs">{h.year} Season</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-light-gray group-hover:text-red transition-colors" />
                  </a>
                ))}
                <div className="bg-white border border-light-gray rounded-2xl px-4 py-4 text-center">
                  <p className="text-text-muted text-xs mb-3">Want to be featured in the next mixtape?</p>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-red text-sm font-bold hover:text-red-hover transition-colors"
                  >
                    Contact Inspire Courts <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Back to lookup */}
            <button
              type="button"
              onClick={() => setStep("lookup")}
              className="w-full border border-light-gray hover:border-navy/30 text-text-muted hover:text-navy rounded-xl py-3.5 text-sm font-semibold transition-colors"
            >
              ← Not you? Look up a different player
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
