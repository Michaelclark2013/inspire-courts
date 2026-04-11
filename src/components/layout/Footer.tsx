"use client";

import Link from "next/link";
import { Camera, Mail, MapPin } from "lucide-react";
import { FACILITY_EMAIL, FACILITY_ADDRESS, SOCIAL_LINKS } from "@/lib/constants";
import { trackConversion } from "@/lib/analytics";

const QUICK_LINKS = [
  { href: "/tournaments", label: "Tournaments" },
  { href: "/facility", label: "Facility" },
  { href: "/scores", label: "Scores" },
  { href: "/training", label: "Training" },
  { href: "/teams", label: "Club" },
  { href: "/prep", label: "Prep" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Single compact row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Brand + links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <img
                src="/images/inspire-athletics-logo.png"
                alt="Inspire Courts"
                className="w-8 h-8 object-contain"
              />
              <span className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wide">
                Inspire Courts
              </span>
            </Link>

            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/60 hover:text-white text-xs transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side: contact + social */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <a
              href={`mailto:${FACILITY_EMAIL}`}
              onClick={() => trackConversion("email_click")}
              className="text-white/60 hover:text-white text-xs transition-colors hidden sm:flex items-center gap-1.5"
            >
              <Mail className="w-3 h-3" />
              {FACILITY_EMAIL}
            </a>

            <div className="flex gap-2">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red transition-all"
                aria-label="@inspirecourts on Instagram"
              >
                <Camera className="w-3.5 h-3.5" />
              </a>
              <a
                href={SOCIAL_LINKS.instagramMixtape}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red transition-all"
                aria-label="@azfinestmixtape on Instagram"
              >
                <Camera className="w-3.5 h-3.5" />
              </a>
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                onClick={() => trackConversion("email_click")}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red transition-all"
                aria-label="Email Inspire Courts"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright line */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-1">
          <p className="text-white/30 text-[11px]">
            &copy; {new Date().getFullYear()} Inspire Courts AZ. All rights reserved.
          </p>
          <p className="text-white/30 text-[11px]">
            {FACILITY_ADDRESS.city}, {FACILITY_ADDRESS.state} &mdash; Built for competitors.
          </p>
        </div>
      </div>
    </footer>
  );
}
