"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera, Mail, Phone } from "lucide-react";
import {
  FACILITY_EMAIL,
  FACILITY_PHONE,
  FACILITY_ADDRESS,
  SOCIAL_LINKS,
} from "@/lib/constants";
import { trackConversion } from "@/lib/analytics";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/scores", label: "Scores" },
  { href: "/facility", label: "Facility" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book" },
];

const PROGRAM_LINKS = [
  { href: "/training", label: "Private Training" },
  { href: "/teams", label: "Team Inspire" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/book", label: "Open Gym" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <div className="flex flex-col gap-3">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm transition-colors"
                aria-label="@inspirecourts on Instagram"
              >
                <Camera className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {SOCIAL_LINKS.instagramHandle}
              </a>
              <a
                href={SOCIAL_LINKS.instagramMixtape}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm transition-colors"
                aria-label="@azfinestmixtape on Instagram"
              >
                <Camera className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {SOCIAL_LINKS.instagramMixtapeHandle}
              </a>
              <a
                href={`mailto:${FACILITY_EMAIL}`}
                onClick={() => trackConversion("email_click")}
                className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm transition-colors"
                aria-label="Email Inspire Courts"
              >
                <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {FACILITY_EMAIL}
              </a>
              <a
                href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`}
                onClick={() => trackConversion("phone_click")}
                className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm transition-colors"
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
          <p className="text-white/30 text-[11px]">
            &copy; {new Date().getFullYear()} Inspire Courts AZ. All rights
            reserved.
          </p>
          <p className="text-white/30 text-[11px]">
            Powered by{" "}
            <span className="uppercase tracking-wide">Off Szn Hoops</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
