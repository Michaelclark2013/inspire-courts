"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackConversion } from "@/lib/analytics";

export default function MobileRegisterBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-light-gray p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" role="complementary" aria-label="Tournament registration">
      <a
        href="https://inspirecourts.leagueapps.com/tournaments"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackConversion("register_click")}
        className="flex items-center justify-center gap-2 w-full bg-red hover:bg-red-hover text-white py-3.5 rounded-full font-bold text-sm uppercase tracking-wide transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Register Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </a>
    </div>
  );
}
