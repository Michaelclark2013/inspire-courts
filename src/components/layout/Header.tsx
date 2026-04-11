"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Tournaments" },
  { href: "/facility", label: "Facility" },
  { href: "/book", label: "Book" },
  { href: "/prep", label: "Prep" },
  { href: "/teams", label: "Club" },
  { href: "/training", label: "Training" },
  { href: "/media", label: "Media" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const MOBILE_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Tournaments" },
  { href: "/facility", label: "Facility" },
  { href: "/book", label: "Book Facility" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/teams", label: "Inspire Club" },
  { href: "/training", label: "Training" },
  { href: "/media", label: "Media" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy shadow-lg">
      {/* Skip to main content — visible on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-white focus:text-navy focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src="/images/inspire-athletics-logo.png" alt="Inspire Courts" className="h-16 lg:h-20 w-auto object-contain drop-shadow-lg" />
              <div className="hidden sm:block">
                <span className="font-[var(--font-chakra)] font-bold text-white text-lg uppercase tracking-wide">
                  Inspire Courts
                </span>
                <span className="text-white/80 text-[10px] block -mt-0.5 uppercase tracking-[0.2em] font-semibold">
                  Gilbert, Arizona
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-2 min-h-[44px] inline-flex items-center text-[12px] font-semibold uppercase tracking-wide text-white/80 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 min-h-[44px] border border-white/30 hover:border-white/60 text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              Admin
            </Link>
            <Link
              href="/book"
              className="flex items-center gap-2 min-h-[44px] border border-white/50 hover:border-white/80 hover:bg-white/10 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Facility
            </Link>
            <a
              href={SOCIAL_LINKS.leagueapps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 min-h-[44px] bg-red hover:bg-red-hover text-white px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all hover:scale-[1.03] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              Register Now <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded-sm"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        id="mobile-nav"
        className={cn(
          "lg:hidden bg-navy-dark border-t border-border-dark transition-all duration-300 overflow-hidden",
          open ? "max-h-[85vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-4 py-4 space-y-1">
          {MOBILE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 min-h-[44px] flex items-center text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-navy-light rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy-dark"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 mt-4 min-h-[44px] bg-red hover:bg-red-hover text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
          >
            <Calendar className="w-4 h-4" /> Book Facility
          </Link>
          <a
            href={SOCIAL_LINKS.leagueapps}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 mt-2 min-h-[44px] border border-white/30 text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 mt-2 min-h-[44px] border border-white/20 text-white/80 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
