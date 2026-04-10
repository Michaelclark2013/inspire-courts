import type { Metadata } from "next";
import {
  MapPin,
  Car,
  Ticket,
  ClipboardCheck,
  Calendar,
  UtensilsCrossed,
  HeartPulse,
  CloudSun,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "Game Day Info | Inspire Courts AZ — Parking, Check-In, Schedule",
  description:
    "Everything you need to know for game day at Inspire Courts AZ. Location, parking, admission, check-in, schedules, food, house rules, and more.",
};

const INFO_SECTIONS = [
  {
    icon: MapPin,
    title: "Location",
    content: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233",
    map: true,
    highlight: false,
  },
  {
    icon: Car,
    title: "Parking",
    content:
      "FREE PARKING — no cost, no meters, no permits. Anyone asking you to pay to park is not affiliated with Inspire Courts.",
    highlight: true,
  },
  {
    icon: Ticket,
    title: "Spectator Admission",
    content:
      "$15 at the door. Kids under 5 are free. Cash and card accepted.",
    highlight: false,
  },
  {
    icon: ClipboardCheck,
    title: "Player & Team Check-In",
    content:
      "Head coaches check in at the front table with a valid ID. Rosters must be submitted before your first game.",
    highlight: false,
  },
  {
    icon: Calendar,
    title: "Schedule & Brackets",
    content:
      "Schedules drop 48 hours before tip-off. Check the Schedule page or your email.",
    highlight: false,
  },
  {
    icon: UtensilsCrossed,
    title: "Food & Drinks",
    content:
      "Snack bar is open all day. Outside food is allowed. No glass bottles.",
    highlight: false,
  },
  {
    icon: HeartPulse,
    title: "First Aid",
    content:
      "Basic first aid is available on-site. For emergencies, call 911.",
    highlight: false,
  },
  {
    icon: CloudSun,
    title: "Weather Policy",
    content:
      "We're indoors — games happen rain or shine. In the event of a cancellation, all registered coaches will be notified by email and text.",
    highlight: false,
  },
  {
    icon: ShieldAlert,
    title: "House Rules",
    content:
      "No hanging on rims. No profanity. Coaches are responsible for their bench and fans. Inspire Courts reserves the right to remove anyone.",
    highlight: false,
  },
  {
    icon: HelpCircle,
    title: "Need Help?",
    content:
      "Email mikeyclark.240@gmail.com or find any staff member in an Inspire Courts shirt.",
    highlight: false,
  },
];

export default function GameDayPage() {
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
              Be Ready
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              Game Day Info
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Everything you need to know before you walk through the doors.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {INFO_SECTIONS.map((section, i) => (
            <AnimateIn key={section.title} delay={i * 60}>
              <div
                className={`bg-white border rounded-xl p-6 lg:p-8 flex gap-4 lg:gap-6 shadow-sm ${
                  section.highlight
                    ? "border-red/40 bg-red/5"
                    : "border-light-gray"
                }`}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      section.highlight
                        ? "bg-red/20 text-red"
                        : "bg-navy text-white"
                    }`}
                  >
                    <section.icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-navy font-bold text-sm uppercase tracking-tight mb-2 font-[var(--font-chakra)]">
                    {section.title}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {section.content}
                  </p>
                  {section.map && (
                    <div className="mt-4 bg-off-white border border-light-gray rounded-xl overflow-hidden aspect-[16/9]">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3331.1!2d-111.7897!3d33.3528!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDIxJzEwLjEiTiAxMTHCsDQ3JzIyLjkiVw!5e0!3m2!1sen!2sus!4v1234567890"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Inspire Courts AZ Location"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
