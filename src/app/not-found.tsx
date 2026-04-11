import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Home, Calendar, Mail } from "lucide-react";

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

        {/* 404 */}
        <div className="text-[120px] font-bold text-red leading-none font-[var(--font-chakra)] drop-shadow-[0_0_40px_rgba(204,0,0,0.3)] mb-4 select-none">
          404
        </div>

        <h1 className="text-white font-bold text-2xl uppercase tracking-tight font-[var(--font-chakra)] mb-3">
          Page Not Found
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
          Looks like this page went out of bounds. Let&apos;s get you back in the game.
        </p>

        {/* Helpful links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wide px-4 py-3.5 rounded-xl transition-colors font-[var(--font-chakra)]"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
          <Link
            href="/events"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wide px-4 py-3.5 rounded-xl transition-colors font-[var(--font-chakra)]"
          >
            <Calendar className="w-3.5 h-3.5" /> Events
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold uppercase tracking-wide px-4 py-3.5 rounded-xl transition-colors font-[var(--font-chakra)]"
          >
            <Mail className="w-3.5 h-3.5" /> Contact
          </Link>
        </div>

        <Link
          href="/"
          className="group inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow-[0_4px_24px_rgba(204,0,0,0.4)] hover:scale-[1.03] font-[var(--font-chakra)]"
        >
          Back to Home{" "}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <p className="relative z-10 text-white/20 text-xs mt-12 uppercase tracking-widest">
        Inspire Courts AZ &bull; Gilbert, Arizona
      </p>
    </div>
  );
}
