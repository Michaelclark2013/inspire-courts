"use client";

import { Mail, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FACILITY_EMAIL } from "@/lib/constants";

interface QuickContactBarProps {
  subject: string;
  label?: string;
  formHref?: string;
}

export default function QuickContactBar({ subject, label = "Interested?", formHref }: QuickContactBarProps) {
  return (
    <div className="fixed bottom-[60px] left-0 right-0 z-[90] bg-navy/95 backdrop-blur-sm border-t border-white/10 py-3 px-4 lg:hidden">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <span className="text-white/70 text-xs font-bold uppercase tracking-wider flex-shrink-0">
          {label}
        </span>
        <div className="flex gap-2 flex-1">
          <a
            href={`mailto:${FACILITY_EMAIL}?subject=${encodeURIComponent(subject)}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Email Us
          </a>
          <Link
            href={formHref ?? `/contact?type=${encodeURIComponent(subject)}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/10 border border-white/30 text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-colors hover:bg-white/20"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Quick Form
          </Link>
        </div>
      </div>
    </div>
  );
}
