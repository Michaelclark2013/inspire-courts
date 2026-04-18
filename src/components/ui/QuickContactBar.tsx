"use client";

import { Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { FACILITY_EMAIL, FACILITY_PHONE } from "@/lib/constants";

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
            href={`tel:${FACILITY_PHONE.replace(/\D/g, "")}`}
            aria-label={`Call Inspire Courts at ${FACILITY_PHONE}`}
            className="inline-flex items-center justify-center w-10 h-10 bg-white/10 border border-white/30 text-white rounded-full transition-colors hover:bg-white/20 flex-shrink-0"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href={`mailto:${FACILITY_EMAIL}?subject=${encodeURIComponent(subject)}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red hover:bg-red-hover text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-colors"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            Email Us
          </a>
          <Link
            href={formHref ?? `/contact?type=${encodeURIComponent(subject)}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/10 border border-white/30 text-white px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wide transition-colors hover:bg-white/20"
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
