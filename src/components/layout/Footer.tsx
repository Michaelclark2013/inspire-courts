"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, Trophy } from "lucide-react";
import {
  FACILITY_EMAIL,
  FACILITY_PHONE,
  FACILITY_ADDRESS,
  SOCIAL_LINKS,
} from "@/lib/constants";
import { trackConversion } from "@/lib/analytics";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/scores", label: "Scores" },
  { href: "/schedule", label: "Schedule" },
  { href: "/facility", label: "Facility" },
  { href: "/gameday", label: "Game Day Info" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book a Court" },
];

const PROGRAM_LINKS = [
  { href: "/training", label: "Private Training" },
  { href: "/teams", label: "Team Inspire" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/camps", label: "Basketball Camps" },
  { href: "/open-gym", label: "Open Gym" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* CTA banner */}
        <div className="mb-10 pb-10 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg font-[var(--font-chakra)] uppercase tracking-tight">
              Ready to compete?
            </p>
            <p className="text-white/50 text-sm mt-0.5">
              Register your team for an upcoming tournament today.
            </p>
          </div>
          <Link
            href="/tournaments"
            className="flex-shrink-0 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Browse Tournaments
          </Link>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1 — Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/images/inspire-athletics-logo.png"
                alt="Inspire Courts logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <span className="font-[var(--font-chakra)] font-bold text-base uppercase tracking-wide">
                Inspire Courts
              </span>
            </Link>
            <p className="text-white/50 text-xs uppercase tracking-wider">
              Gilbert, Arizona
            </p>
            <a
              href="https://www.google.com/maps/dir//1090+N+Fiesta+Blvd+Ste+101+%26+102+Gilbert+AZ+85233"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-white text-sm transition-colors leading-relaxed"
            >
              {FACILITY_ADDRESS.street}, {FACILITY_ADDRESS.suite}
              <br />
              {FACILITY_ADDRESS.city}, {FACILITY_ADDRESS.state}{" "}
              {FACILITY_ADDRESS.zip}
            </a>
            <a
              href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`}
              onClick={() => trackConversion("phone_click")}
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              {FACILITY_PHONE}
            </a>
          </div>

          {/* Column 2 — Navigation */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider">
              Navigation
            </h3>
            <nav aria-label="Footer navigation" className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3 — Programs */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider">
              Programs
            </h3>
            <nav aria-label="Programs navigation" className="flex flex-col gap-2">
              {PROGRAM_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4 — Connect */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white text-xs font-semibold uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex flex-col gap-1">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 min-h-[44px] text-white/60 hover:text-white text-sm transition-colors group"
                aria-label="@inspirecourts on Instagram"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                  <InstagramIcon className="w-4 h-4 flex-shrink-0" />
                </span>
                {SOCIAL_LINKS.instagramHandle}
              </a>
              <a
                href={SOCIAL_LINKS.instagramMixtape}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 min-h-[44px] text-white/60 hover:text-white text-sm transition-colors group"
                aria-label="@azfinestmixtape on Instagram"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                  <InstagramIcon className="w-4 h-4 flex-shrink-0" />
                </span>
                {SOCIAL_LINKS.instagramMixtapeHandle}
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 min-h-[44px] text-white/60 hover:text-white text-sm transition-colors group"
                aria-label="Inspire Courts on YouTube"
              >
                <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/15 flex items-center justify-center transition-colors">
                  <YouTubeIcon className="w-4 h-4 flex-shrink-0" />
                </span>
                YouTube
              </a>
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                onClick={() => trackConversion("email_click")}
                className="flex items-center gap-2.5 min-h-[44px] text-white/60 hover:text-white text-sm transition-colors"
                aria-label="Email Inspire Courts"
              >
                <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {FACILITY_EMAIL}
              </a>
              <a
                href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`}
                onClick={() => trackConversion("phone_click")}
                className="flex items-center gap-2.5 min-h-[44px] text-white/60 hover:text-white text-sm transition-colors"
                aria-label="Call Inspire Courts"
              >
                <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {FACILITY_PHONE}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-white/50 text-xs">
            &copy; {new Date().getFullYear()} Inspire Courts AZ. All rights
            reserved.
          </p>
          <p className="text-white/50 text-xs">
            Powered by{" "}
            <span className="uppercase tracking-wide">Off Szn Hoops</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
