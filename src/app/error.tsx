"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service here if applicable
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-navy pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(204,0,0,0.10),transparent_60%)] pointer-events-none" />

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

        {/* Icon */}
        <div className="w-20 h-20 bg-red/10 border border-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-8 h-8 text-red" aria-hidden="true" />
        </div>

        <h1 className="text-white font-bold text-2xl uppercase tracking-tight font-[var(--font-chakra)] mb-3">
          Something Went Wrong
        </h1>
        <p className="text-white/50 text-sm leading-relaxed mb-3 max-w-xs mx-auto">
          We hit an unexpected error. Try refreshing — it usually fixes itself.
        </p>
        {error.digest && (
          <p className="text-white/20 text-xs mb-10 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-10" />}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="group inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all shadow-[0_4px_24px_rgba(204,0,0,0.4)] hover:scale-[1.03] font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-all font-[var(--font-chakra)] focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none"
          >
            <Home className="w-4 h-4" /> Go Home{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <p className="relative z-10 text-white/20 text-xs mt-12 uppercase tracking-widest">
        Inspire Courts AZ &bull; Gilbert, Arizona
      </p>
    </div>
  );
}
