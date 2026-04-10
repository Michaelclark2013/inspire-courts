"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/facility", label: "Facility" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/teams", label: "Team Inspire" },
  { href: "/training", label: "Training" },
  { href: "/media", label: "Media" },
  { href: "/schedule", label: "Schedule" },
  { href: "/gameday", label: "Game Day" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy shadow-lg">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white font-bold text-sm font-[var(--font-chakra)]">IC</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-[var(--font-chakra)] font-bold text-white text-lg uppercase tracking-wide">
                  Inspire Courts
                </span>
                <span className="text-white/60 text-[10px] block -mt-0.5 uppercase tracking-[0.2em] font-semibold">
                  Gilbert, Arizona
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="mailto:mikeyclark.240@gmail.com"
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold uppercase tracking-wide transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Contact
            </a>
            <Link
              href="/events"
              className="flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg"
            >
              Register Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "lg:hidden bg-navy-dark border-t border-border-dark transition-all duration-300 overflow-hidden",
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-navy-light rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/events"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 mt-4 bg-red hover:bg-red-hover text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
