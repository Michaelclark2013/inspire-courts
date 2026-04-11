"use client";

import Link from "next/link";
import { Camera, Mail, MapPin } from "lucide-react";
import { FACILITY_EMAIL, FACILITY_ADDRESS, SOCIAL_LINKS } from "@/lib/constants";
import { trackConversion } from "@/lib/analytics";

const QUICK_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/facility", label: "Facility" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/teams", label: "Inspire Club" },
  { href: "/training", label: "Training" },
  { href: "/media", label: "Media" },
  { href: "/schedule", label: "Schedules" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer>
      {/* Main footer — navy */}
      <div className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <img src="/images/inspire-athletics-logo.png" alt="Inspire Athletics" className="w-14 h-14 object-contain" />
                <span className="font-[var(--font-chakra)] font-bold text-lg uppercase tracking-wide">
                  Inspire Courts
                </span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Arizona&apos;s premier indoor basketball &amp; volleyball
                facility. 7 courts. 52,000 sq ft. Built for competitors.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wider mb-5">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white text-sm transition-colors hover:underline min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy rounded-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wider mb-5">
                Contact
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3 text-white/80 text-sm">
                  <Mail className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                  <a
                    href={`mailto:${FACILITY_EMAIL}`}
                    onClick={() => trackConversion("email_click")}
                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 rounded-sm"
                  >
                    {FACILITY_EMAIL}
                  </a>
                </div>
                <div className="flex gap-3 text-white/80 text-sm">
                  <MapPin className="w-4 h-4 text-red flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{FACILITY_ADDRESS.street}</p>
                    <p>{FACILITY_ADDRESS.suite}</p>
                    <p>{FACILITY_ADDRESS.city}, {FACILITY_ADDRESS.state} {FACILITY_ADDRESS.zip}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-[var(--font-chakra)] font-bold text-sm uppercase tracking-wider mb-5">
                Follow Us
              </h3>
              <p className="text-white/80 text-sm mb-4">
                Stay updated with everything Inspire Courts!
              </p>
              <div className="flex gap-3">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-navy-light rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-red transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy"
                  aria-label="Follow @inspirecourtsaz on Instagram"
                  title="@inspirecourtsaz on Instagram"
                >
                  <Camera className="w-5 h-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.instagramMixtape}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 bg-navy-light rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-red transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy"
                  aria-label="Follow @azfinestmixtape on Instagram"
                  title="@azfinestmixtape on Instagram"
                >
                  <Camera className="w-5 h-5" />
                </a>
                <a
                  href={`mailto:${FACILITY_EMAIL}`}
                  onClick={() => trackConversion("email_click")}
                  className="w-11 h-11 bg-navy-light rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-red transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy"
                  aria-label="Email Inspire Courts"
                  title="Email Inspire Courts"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer — white */}
      <div className="bg-white border-t border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} Inspire Courts AZ. All rights reserved.
          </p>
          <p className="text-text-muted text-xs">
            Gilbert, Arizona &mdash; Built for competitors.
          </p>
        </div>
      </div>
    </footer>
  );
}
