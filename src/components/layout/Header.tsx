"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X, ArrowRight, Calendar, ChevronDown, LogIn, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackConversion } from "@/lib/analytics";

const PRIMARY_NAV = [
  { href: "/", label: "Home" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/scores", label: "Scores" },
  { href: "/facility", label: "Facility" },
  { href: "/contact", label: "Contact" },
];

const PROGRAMS_DROPDOWN = [
  { href: "/training", label: "Training" },
  { href: "/teams", label: "Team Inspire" },
  { href: "/prep", label: "Inspire Prep" },
  { href: "/camps", label: "Camps" },
  { href: "/open-gym", label: "Open Gym" },
];

const MORE_DROPDOWN = [
  { href: "/about", label: "About" },
  { href: "/gameday", label: "Game Day Info" },
  { href: "/schedule", label: "Schedule" },
  { href: "/media", label: "Media" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
];

const PORTAL_DROPDOWN = [
  { href: "/portal/player", label: "Player Portal" },
  { href: "/portal/coach", label: "Coach Portal" },
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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "px-3.5 py-2 min-h-[44px] inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded-lg",
          open ? "text-white" : "text-white/80 hover:text-white"
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${label} menu`}
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
          "absolute top-full left-1/2 -translate-x-1/2 pt-2 min-w-[200px] transition-all duration-200 origin-top",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="bg-navy-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          <div className="py-2" role="menu" aria-label={`${label} submenu`}>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white/80 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
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
        aria-haspopup="true"
        aria-label={`${label} menu`}
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
              className="flex items-center px-4 py-2.5 min-h-[44px] text-sm font-semibold uppercase tracking-wide text-white/70 hover:text-white hover:bg-navy-light rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const ADMIN_ROLES = ["admin", "staff", "ref", "front_desk"];

export default function Header() {
  const [open, setOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const dashboardHref = isLoggedIn
    ? ADMIN_ROLES.includes(session?.user?.role as string) ? "/admin" : "/portal"
    : "/login";

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close mobile nav on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Move focus to first interactive element when mobile nav opens
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const firstFocusable = mobileNavRef.current?.querySelector<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 100);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-navy shadow-lg"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Skip-to-content link lives in layout.tsx — no duplicate needed here */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts logo" width={64} height={64} className="h-12 lg:h-11 w-auto object-contain drop-shadow-lg" />
            <div className="hidden sm:block">
              <span className="font-[var(--font-chakra)] font-bold text-white text-base lg:text-[15px] uppercase tracking-wide">
                Inspire Courts
              </span>
              <span className="text-white/60 text-[10px] block -mt-0.5 uppercase tracking-[0.15em] font-semibold">
                Gilbert, Arizona
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {PRIMARY_NAV.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "px-3.5 py-2 min-h-[44px] inline-flex items-center text-sm font-semibold uppercase tracking-wide transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy rounded-lg",
                    isActive ? "text-white border-b-2 border-red" : "text-white/80 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <DropdownMenu label="Programs" items={PROGRAMS_DROPDOWN} />
            <DropdownMenu label="More" items={MORE_DROPDOWN} />
            <DropdownMenu label="Portal" items={PORTAL_DROPDOWN} />
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 min-h-[44px] text-white/70 hover:text-white px-4 py-2.5 rounded-full font-semibold text-sm uppercase tracking-wide transition-all hover:bg-white/5"
            >
              {isLoggedIn ? (
                <><LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Dashboard</>
              ) : (
                <><LogIn className="w-4 h-4" aria-hidden="true" /> Login</>
              )}
            </Link>
            <Link
              href="/book"
              onClick={() => trackConversion("book_cta_click")}
              className="flex items-center gap-2 min-h-[44px] border border-white/50 hover:border-white/80 hover:bg-white/10 text-white px-5 py-2.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" /> Book
            </Link>
            <a
              href="https://inspirecourts.leagueapps.com/tournaments"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion("register_click")}
              className="flex items-center gap-2 min-h-[44px] bg-red hover:bg-red-hover text-white px-5 py-2.5 rounded-full font-bold text-sm uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              Register Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
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
            {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 top-20 bg-black/60 backdrop-blur-sm lg:hidden z-40 animate-backdrop-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Nav */}
      <div
        id="mobile-nav"
        ref={mobileNavRef}
        className={cn(
          "lg:hidden bg-navy-dark border-t border-border-dark transition-all duration-300 relative z-50",
          open ? "max-h-[85vh] opacity-100 overflow-y-auto animate-slide-down" : "max-h-0 opacity-0 overflow-hidden"
        )}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Mobile navigation menu"
      >
        <nav aria-label="Mobile navigation" className="px-4 py-4 space-y-1">
          {/* Primary links */}
          {PRIMARY_NAV.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center px-4 py-3 min-h-[44px] text-sm font-semibold uppercase tracking-wide rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-navy-dark",
                  isActive
                    ? "text-white bg-navy-light border-l-2 border-red"
                    : "text-white/80 hover:text-white hover:bg-navy-light"
                )}
              >
                {link.label}
              </Link>
            );
          })}

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

          {/* Portal accordion */}
          <MobileAccordion
            label="Portal"
            items={PORTAL_DROPDOWN}
            onClose={() => setOpen(false)}
          />

          {/* CTAs */}
          <div className="pt-3 pb-24 space-y-2">
            <Link
              href="/book"
              onClick={() => { setOpen(false); trackConversion("book_cta_click"); }}
              className="flex items-center justify-center gap-2 min-h-[44px] border border-white/50 hover:border-white/80 hover:bg-white/10 text-white px-6 py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" /> Book Facility
            </Link>
            <Link
              href={dashboardHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 min-h-[44px] border border-white/20 hover:border-white/40 text-white/70 hover:text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-dark"
            >
              {isLoggedIn ? (
                <><LayoutDashboard className="w-4 h-4" aria-hidden="true" /> My Dashboard</>
              ) : (
                <><LogIn className="w-4 h-4" aria-hidden="true" /> Login / Register</>
              )}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
