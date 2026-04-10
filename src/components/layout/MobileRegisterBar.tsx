"use client";

import { ArrowRight } from "lucide-react";

export default function MobileRegisterBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-light-gray p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <a
        href="https://inspirecourts.leagueapps.com/tournaments"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors shadow-lg"
      >
        Register for Next Event <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
