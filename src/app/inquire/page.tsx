import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, GraduationCap, Cake, Users, Trophy, Star } from "lucide-react";
import { INQUIRY_CONFIGS } from "@/lib/inquiry-forms";

export const metadata: Metadata = {
  title: "Inquire — Inspire Courts AZ",
  description: "Reserve a court, book training, host a tournament, or join a league at Arizona's premier multi-sport facility. Get a response within 30 minutes.",
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  court_rental: Calendar,
  training: GraduationCap,
  party: Cake,
  league: Users,
  tournament_host: Trophy,
  membership: Star,
};

export default function InquireIndexPage() {
  return (
    <main className="min-h-screen bg-navy text-white">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] mb-2 text-center">Get in touch</p>
        <h1 className="text-4xl sm:text-6xl font-bold font-heading text-center mb-3">
          What can we help you with?
        </h1>
        <p className="text-white/70 text-center max-w-2xl mx-auto mb-12">
          Pick the closest option below. You'll fill out a short form and a real human will text you back within 30 minutes during business hours.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INQUIRY_CONFIGS.filter((c) => c.kind !== "general").map((c) => {
            const Icon = ICONS[c.kind] || Calendar;
            return (
              <Link
                key={c.kind}
                href={`/inquire/${c.slug}`}
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red/40 rounded-2xl p-5 transition-colors"
              >
                <div className="w-10 h-10 bg-red/10 rounded-xl flex items-center justify-center mb-3 text-red">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-lg mb-1 group-hover:text-red transition-colors">{c.title}</h2>
                <p className="text-white/60 text-sm mb-3">{c.subtitle}</p>
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-red font-bold">
                  Start inquiry <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
