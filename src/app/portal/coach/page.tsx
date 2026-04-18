"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Calendar,
  Trophy,
  Info,
  ClipboardList,
  Mail,
  Phone,
  ChevronRight,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Search,
  Plus,
  ExternalLink,
  User,
} from "lucide-react";

// ── Placeholder data ───────────────────────────────────────────────────────
const DEMO_COACH = {
  name: "Coach D. Williams",
  team: "AZ Warriors 14U",
  division: "14U Elite",
  email: "dwilliams@azwarriors.org",
};

const DEMO_ROSTER = [
  { name: "Marcus Johnson", jersey: 23, position: "Guard", age: 14, waiverSigned: true },
  { name: "Tyler Brooks", jersey: 11, position: "Forward", age: 14, waiverSigned: true },
  { name: "DeShawn Carter", jersey: 5, position: "Center", age: 14, waiverSigned: true },
  { name: "Jaylen Davis", jersey: 34, position: "Guard", age: 13, waiverSigned: false },
  { name: "Chris Washington", jersey: 2, position: "Forward", age: 14, waiverSigned: true },
  { name: "Malik Thompson", jersey: 15, position: "Guard", age: 14, waiverSigned: false },
  { name: "Zion Parker", jersey: 8, position: "Forward", age: 13, waiverSigned: true },
  { name: "Andre Wilson", jersey: 21, position: "Center", age: 14, waiverSigned: true },
];

const DEMO_REGISTRATIONS = [
  { name: "Gilbert Spring Classic", date: "Jan 20–21, 2025", status: "approved", payment: "pending", division: "14U Elite" },
  { name: "Inspire MLK Tournament", date: "Jan 19, 2025", status: "approved", payment: "paid", division: "14U Elite" },
];

const DEMO_SCHEDULE = [
  { date: "Sat, Jan 20", time: "10:30 AM", opponent: "Phoenix Suns Jr.", court: "Court 2", tournament: "Gilbert Spring Classic" },
  { date: "Sat, Jan 20", time: "1:00 PM", opponent: "Scottsdale Hawks", court: "Court 1", tournament: "Gilbert Spring Classic" },
  { date: "Sun, Jan 21", time: "9:00 AM", opponent: "Mesa Thunder", court: "Court 3", tournament: "Gilbert Spring Classic" },
];

const DEMO_RESULTS = [
  { date: "Jan 13", opponent: "West Valley Ballers", myScore: 58, oppScore: 42, result: "W" },
  { date: "Jan 13", opponent: "Tempe Blazers", myScore: 61, oppScore: 55, result: "W" },
  { date: "Jan 7", opponent: "Chandler Elite", myScore: 44, oppScore: 50, result: "L" },
];

const GAMEDAY_RULES = [
  { icon: Clock, text: "Arrive at least 30 minutes before tip-off to warm up your team" },
  { icon: Shield, text: "Have player ID / birth certificates available for verification" },
  { icon: Users, text: "Submit your game-day lineup to the table 15 min before tip" },
  { icon: MapPin, text: "Check the bracket board at main entrance for court assignments" },
  { icon: ClipboardList, text: "Coaches must have current roster card stamped by admin" },
];
// ─────────────────────────────────────────────────────────────────────────

type Tab = "roster" | "schedule" | "results" | "gameday" | "lineup";

export default function CoachPortalPage() {
  const [step, setStep] = useState<"lookup" | "portal">("lookup");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [displayName, setDisplayName] = useState(DEMO_COACH.name);
  const [activeTab, setActiveTab] = useState<Tab>("roster");
  const [lineupSubmitted, setLineupSubmitted] = useState(false);
  const [lineup, setLineup] = useState<number[]>([]);
  const [starters, setStarters] = useState<number[]>([]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) setDisplayName(name.trim());
    setStep("portal");
  }

  function toggleLineup(idx: number) {
    setLineup((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
  }

  function toggleStarter(idx: number) {
    setStarters((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-light-gray px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={28} height={28} className="object-contain" />
          <span className="text-navy font-bold text-sm uppercase tracking-tight">Inspire</span>
        </Link>
        <span className="text-text-muted text-xs font-semibold uppercase tracking-widest">Coach Portal</span>
        <Link href="/portal/player" className="text-red text-xs font-semibold hover:text-red-hover transition-colors">
          Player →
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ── Lookup Form ─────────────────────────────────────────── */}
        {step === "lookup" && (
          <div className="space-y-6">
            <div className="text-center pt-4 pb-2">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-navy text-2xl font-bold font-heading uppercase tracking-tight mb-1">Coach Portal</h1>
              <p className="text-text-muted text-sm">Access your team roster, schedule &amp; game day tools.</p>
            </div>

            <div className="bg-white border border-light-gray rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <Search className="w-4 h-4 text-blue-600" />
                <p className="text-navy font-semibold text-sm">Enter your details to get started</p>
              </div>
              <form onSubmit={handleLookup} className="space-y-4">
                <div>
                  <label htmlFor="coach-name" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2">Your Name</label>
                  <input
                    id="coach-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Coach first &amp; last name"
                    required
                    className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-base focus:outline-none focus:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all placeholder:text-text-muted/50"
                  />
                </div>
                <div>
                  <label htmlFor="coach-team" className="block text-navy text-xs font-bold uppercase tracking-wider mb-2">Team Name</label>
                  <input
                    id="coach-team"
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="e.g. AZ Warriors 14U"
                    className="w-full bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-base focus:outline-none focus:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all placeholder:text-text-muted/50"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  View My Team <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="bg-white border border-light-gray rounded-2xl p-4">
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-3">Quick Links</p>
              <div className="space-y-2">
                <Link href="/portal" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-off-white transition-colors group">
                  <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-red" />
                  </div>
                  <span className="text-navy text-sm font-medium">Registered Coach Login</span>
                  <ChevronRight className="w-4 h-4 text-light-gray group-hover:text-text-muted ml-auto" />
                </Link>
                <a href="mailto:info@inspirecourtsaz.com" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-off-white transition-colors group">
                  <div className="w-8 h-8 bg-off-white rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-text-muted" />
                  </div>
                  <span className="text-navy text-sm font-medium">Contact Admin</span>
                  <ChevronRight className="w-4 h-4 text-light-gray group-hover:text-text-muted ml-auto" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Coach Portal ─────────────────────────────────────────── */}
        {step === "portal" && (
          <div className="space-y-5">

            {/* Coach card */}
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xl font-heading">
                    {displayName.replace("Coach ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-navy font-bold text-lg leading-tight">{displayName}</p>
                  <p className="text-text-muted text-sm">{DEMO_COACH.team}</p>
                  <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mt-0.5">{DEMO_COACH.division}</p>
                </div>
              </div>
              {/* Registration status row */}
              <div className="flex gap-2 flex-wrap">
                {DEMO_REGISTRATIONS.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      r.payment === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {r.payment === "paid" ? "Paid" : "Payment Pending"}
                    </span>
                    <span className="text-light-gray text-xs">{i < DEMO_REGISTRATIONS.length - 1 ? "·" : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo notice */}
            <div className="bg-amber-50 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-600/80 text-xs leading-relaxed">
                Showing sample data. Live coach lookups will be available once your team is registered.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white border border-light-gray rounded-xl p-1 overflow-x-auto no-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
              {[
                { key: "roster", icon: Users, label: "Roster" },
                { key: "schedule", icon: Calendar, label: "Schedule" },
                { key: "results", icon: Trophy, label: "Results" },
                { key: "lineup", icon: ClipboardList, label: "Lineup" },
                { key: "gameday", icon: Info, label: "Game Day" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as Tab)}
                  style={{ scrollSnapAlign: "start" }}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
                    activeTab === key
                      ? "bg-blue-600 text-white"
                      : "text-text-muted hover:text-navy"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* ── Roster tab ── */}
            {activeTab === "roster" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Team Roster</h3>
                  <span className="text-text-muted text-xs">{DEMO_ROSTER.length} players</span>
                </div>
                {/* Waiver summary */}
                <div className="bg-white border border-light-gray rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-navy text-sm font-semibold">
                      {DEMO_ROSTER.filter((p) => p.waiverSigned).length}/{DEMO_ROSTER.length} waivers signed
                    </span>
                  </div>
                  <Link href="/portal" className="text-red text-xs font-semibold hover:text-red-hover">
                    Submit →
                  </Link>
                </div>
                {/* Player list */}
                {DEMO_ROSTER.map((player, i) => (
                  <div key={i} className="bg-white border border-light-gray rounded-2xl px-4 py-3.5 flex items-center gap-4">
                    <div className="w-9 h-9 bg-off-white rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-text-muted text-xs font-bold">#{player.jersey}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-navy font-semibold text-sm">{player.name}</p>
                      <p className="text-text-muted text-xs">{player.position} · Age {player.age}</p>
                    </div>
                    {player.waiverSigned ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <span title="Waiver missing"><AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" /></span>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                      <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                        {g.court}
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
                <div className="bg-white border border-light-gray rounded-xl px-4 py-3 text-center">
                  <p className="text-text-muted text-xs">Season record: <span className="text-navy font-bold">2–1</span></p>
                </div>
              </div>
            )}

            {/* ── Lineup tab ── */}
            {activeTab === "lineup" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest">Submit Lineup</h3>
                  <span className="text-text-muted text-xs">Next: Jan 20 · 10:30 AM</span>
                </div>

                {lineupSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                    <p className="text-navy font-bold mb-1">Lineup Submitted!</p>
                    <p className="text-text-muted text-sm mb-4">
                      {starters.length} starters · {lineup.length} active players
                    </p>
                    <button
                      onClick={() => { setLineupSubmitted(false); setLineup([]); setStarters([]); }}
                      className="text-text-muted text-xs font-semibold hover:text-navy transition-colors"
                    >
                      Edit lineup
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-white border border-light-gray rounded-xl px-4 py-3 text-xs text-text-muted">
                      Tap players to add to lineup. Long-press to mark as starter.
                    </div>
                    <div className="space-y-2">
                      {DEMO_ROSTER.map((player, i) => (
                        <button
                          key={i}
                          onClick={() => toggleLineup(i)}
                          onContextMenu={(e) => { e.preventDefault(); if (lineup.includes(i)) toggleStarter(i); }}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left ${
                            lineup.includes(i)
                              ? starters.includes(i)
                                ? "bg-amber-50 border-amber-300"
                                : "bg-blue-50 border-blue-300"
                              : "bg-white border-light-gray"
                          }`}
                        >
                          <div className="w-8 h-8 bg-off-white rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-text-muted text-xs font-bold">#{player.jersey}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${lineup.includes(i) ? "text-navy" : "text-text-muted"}`}>{player.name}</p>
                            <p className="text-text-muted text-xs">{player.position}</p>
                          </div>
                          {lineup.includes(i) && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              starters.includes(i) ? "bg-amber-50 text-amber-600" : "bg-blue-100 text-blue-600"
                            }`}>
                              {starters.includes(i) ? "Starter" : "Active"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between bg-white border border-light-gray rounded-xl px-4 py-3">
                      <span className="text-text-muted text-xs">{lineup.length} selected · {starters.length} starters</span>
                      <div className="flex items-center gap-1.5 text-text-muted text-[10px]">
                        <span>Long-press = starter</span>
                      </div>
                    </div>

                    <button
                      onClick={() => lineup.length > 0 && setLineupSubmitted(true)}
                      disabled={lineup.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" /> Submit Lineup ({lineup.length} players)
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Game Day tab ── */}
            {activeTab === "gameday" && (
              <div className="space-y-3">
                <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest px-1">Coach Checklist</h3>
                {GAMEDAY_RULES.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="bg-white border border-light-gray rounded-2xl px-4 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-navy text-sm leading-snug">{text}</p>
                  </div>
                ))}

                {/* Contact Admin */}
                <div className="bg-white border border-light-gray rounded-2xl p-4">
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-3">Contact Admin</p>
                  <div className="space-y-2">
                    <a href="mailto:info@inspirecourtsaz.com" className="flex items-center gap-3 p-3 rounded-xl hover:bg-off-white transition-colors group">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <span className="text-navy text-sm">info@inspirecourtsaz.com</span>
                      <ExternalLink className="w-3.5 h-3.5 text-light-gray group-hover:text-text-muted ml-auto" />
                    </a>
                    <a href="tel:+14806001000" className="flex items-center gap-3 p-3 rounded-xl hover:bg-off-white transition-colors group">
                      <Phone className="w-4 h-4 text-text-muted" />
                      <span className="text-navy text-sm">(480) 600-1000</span>
                      <ExternalLink className="w-3.5 h-3.5 text-light-gray group-hover:text-text-muted ml-auto" />
                    </a>
                  </div>
                </div>

                {/* Venue */}
                <div className="bg-white border border-light-gray rounded-2xl px-4 py-4">
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-2">Venue</p>
                  <p className="text-navy text-sm font-semibold">Gilbert Sports Complex</p>
                  <p className="text-text-muted text-xs mt-0.5">2355 E Knox Rd, Gilbert, AZ 85234</p>
                  <a
                    href="https://maps.apple.com/?q=Gilbert+Sports+Complex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-semibold mt-3 hover:text-blue-300 transition-colors"
                  >
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Back to lookup */}
            <button
              onClick={() => setStep("lookup")}
              className="w-full border border-light-gray hover:border-navy/30 text-text-muted hover:text-navy rounded-xl py-3.5 text-sm font-semibold transition-colors"
            >
              ← Not you? Look up a different coach
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
