import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Home, Calendar, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found | Inspire Courts AZ",
  description: "The page you're looking for doesn't exist. Head back to the Inspire Courts AZ homepage.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-10">
          <Image
            src="/images/inspire-athletics-logo.png"
            alt="Inspire Courts AZ"
            width={80}
            height={80}
            className="w-20 h-20 object-contain mx-auto mb-5"
          />
          <span className="font-bold text-white text-lg uppercase tracking-widest font-[var(--font-chakra)]">
            Inspire Courts AZ
          </span>
        </div>

        {/* Basketball illustration */}
        <div className="mb-6 select-none" aria-hidden="true">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto opacity-60">
            <circle cx="48" cy="48" r="44" stroke="#CC0000" strokeWidth="3" fill="none" />
            <path d="M48 4C48 4 48 92 48 92" stroke="#CC0000" strokeWidth="2" strokeDasharray="4 3" />
            <path d="M4 48C4 48 92 48 92 48" stroke="#CC0000" strokeWidth="2" strokeDasharray="4 3" />
            <path d="M14 14C30 30 30 66 14 82" stroke="#CC0000" strokeWidth="2" fill="none" strokeDasharray="4 3" />
            <path d="M82 14C66 30 66 66 82 82" stroke="#CC0000" strokeWidth="2" fill="none" strokeDasharray="4 3" />
          </svg>
        </div>

        {/* 404 */}
        <div className="text-[120px] font-bold text-red leading-none font-[var(--font-chakra)] drop-shadow-[0_0_40px_rgba(204,0,0,0.3)] mb-4 select-none">
          404
        </div>

        <h1 className="text-white font-bold text-2xl uppercase tracking-tight font-[var(--font-chakra)] mb-3">
          Page Not Found
        </h1>
        <p className="text-white/75 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
          Looks like this page went out of bounds. Let&apos;s get you back in the game.
        </p>

        {/* Helpful links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wide px-4 py-3.5 rounded-xl transition-colors font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" /> Home
          </Link>
          <Link
            href="/events"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wide px-4 py-3.5 rounded-xl transition-colors font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none"
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Events
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wide px-4 py-3.5 rounded-xl transition-colors font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" /> Contact
          </Link>
        </div>

        <Link
          href="/"
          className="group inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow-[0_4px_24px_rgba(204,0,0,0.4)] hover:scale-[1.03] font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none"
        >
          Back to Home{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      <p className="relative z-10 text-white/20 text-xs mt-12 uppercase tracking-widest">
        Inspire Courts AZ &bull; Gilbert, Arizona
      </p>
    </div>
  );
}
