"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/lib/constants";
import { trackConversion } from "@/lib/analytics";

const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/facility", label: "Facility" },
  { href: "/contact", label: "Contact" },
];

const PROGRAMS_DROPDOWN = [
  { href: "/training", label: "Training" },
  { href: "/teams", label: "Team Inspire" },
  { href: "/prep", label: "Inspire Prep" },
];

const MORE_DROPDOWN = [
  { href: "/about", label: "About" },
  { href: "/gameday", label: "Game Day Info" },
  { href: "/media", label: "Media" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
];

function DropdownMenu({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={cn(
          "px-2.5 py-2 min-h-[44px] inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded-sm",
          open ? "text-white" : "text-white/80 hover:text-white"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        onMouseLeave={() => setOpen(false)}
        className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 mt-1 min-w-[180px] bg-navy-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="py-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileAccordion({
  label,
  items,
  onClose,
}: {
  label: string;
  items: { href: string; label: string }[];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-navy-light rounded-lg transition-colors"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pl-4 pb-1 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block px-4 py-2.5 min-h-[44px] flex items-center text-sm font-semibold uppercase tracking-wide text-white/70 hover:text-white hover:bg-navy-light rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {PRIMARY_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-2 min-h-[44px] inline-flex items-center text-[12px] font-semibold uppercase tracking-wide text-white/80 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded-sm"
              >
                {link.label}
              </Link>
            ))}
            <DropdownMenu label="Programs" items={PROGRAMS_DROPDOWN} />
            <DropdownMenu label="More" items={MORE_DROPDOWN} />
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/book"
              onClick={() => trackConversion("book_cta_click")}
              className="flex items-center gap-2 min-h-[44px] border border-white/50 hover:border-white/80 hover:bg-white/10 text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-all hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              <Calendar className="w-3.5 h-3.5" /> Book
            </Link>
            <a
              href={SOCIAL_LINKS.leagueapps}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion("register_click")}
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
          {/* Primary links */}
          {PRIMARY_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 min-h-[44px] flex items-center text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-navy-light rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy-dark"
            >
              {link.label}
            </Link>
          ))}

          {/* Programs accordion */}
          <MobileAccordion
            label="Programs"
            items={PROGRAMS_DROPDOWN}
            onClose={() => setOpen(false)}
          />

          {/* More accordion */}
          <MobileAccordion
            label="More"
            items={MORE_DROPDOWN}
            onClose={() => setOpen(false)}
          />

          {/* CTAs */}
          <div className="pt-3 space-y-2">
            <Link
              href="/book"
              onClick={() => { setOpen(false); trackConversion("book_cta_click"); }}
              className="flex items-center justify-center gap-2 min-h-[44px] border border-white/50 hover:border-white/80 hover:bg-white/10 text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
            >
              <Calendar className="w-4 h-4" /> Book Facility
            </Link>
            <a
              href={SOCIAL_LINKS.leagueapps}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { setOpen(false); trackConversion("register_click"); }}
              className="flex items-center justify-center gap-2 min-h-[44px] bg-red hover:bg-red-hover text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
            >
              Register Now <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 min-h-[44px] border border-white/15 text-white/50 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
            >
              Admin
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
