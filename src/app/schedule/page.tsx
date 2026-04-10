import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = {
  title: "Schedules & Brackets | Inspire Courts AZ",
  description:
    "View tournament schedules, brackets, and results for Inspire Courts AZ events. Schedules drop 48 hours before tip-off.",
};

export default function SchedulePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              Game Time
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              Schedules & Brackets
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Find your game times, court assignments, and bracket placements.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Current Event */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Current Event"
            title="No Active Event Right Now"
            description="When an event is in progress, schedules and live brackets will appear here."
          />

          <div className="max-w-3xl mx-auto">
            <AnimateIn>
              <div className="bg-off-white border border-light-gray rounded-xl p-8 text-center">
                <div className="w-14 h-14 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-red" />
                </div>
                <h3 className="text-navy font-bold text-lg uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
                  Schedules Drop 48 Hours Before Tip-Off
                </h3>
                <p className="text-text-muted leading-relaxed mb-6">
                  Schedules are released 48 hours before the event and sent
                  directly to the head coach on file via email. Check here or
                  your inbox before game day.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/events"
                    className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                  >
                    See Upcoming Events <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-white border-2 border-navy hover:bg-navy hover:text-white text-navy px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
                  >
                    <Mail className="w-4 h-4" /> Contact Us
                  </Link>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Past Results */}
      <section className="py-20 lg:py-28 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Archives"
            title="Past Event Results"
            description="Brackets and results from previous tournaments."
          />
          <div className="max-w-3xl mx-auto space-y-3">
            {[
              { name: "Red Rock Invitational", date: "April 2025" },
              { name: "OFF SZN Session 4", date: "March 2025" },
              { name: "Presidents Day Classic", date: "February 2025" },
              { name: "MLK Weekend Shootout", date: "January 2025" },
            ].map((event, i) => (
              <AnimateIn key={i} delay={i * 50}>
                <div className="bg-white border border-light-gray rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                      {event.name}
                    </h3>
                    <p className="text-text-muted text-xs mt-0.5">
                      {event.date}
                    </p>
                  </div>
                  <span className="text-text-muted text-xs font-semibold uppercase">
                    Completed
                  </span>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-16 bg-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <h3 className="text-white font-bold text-lg uppercase tracking-tight mb-3 font-[var(--font-chakra)]">
              Not seeing your schedule?
            </h3>
            <p className="text-white/70 mb-4">
              Text or email us and we&apos;ll get you sorted.
            </p>
            <p className="text-red font-semibold">
              mikeyclark.240@gmail.com
            </p>
          </AnimateIn>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
