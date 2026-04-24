"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * Cookie-consent banner for GDPR/CCPA/ePrivacy compliance. Analytics
 * scripts (Google Analytics, Meta Pixel) are gated on this consent
 * — they only load once the user clicks "Accept" or already has a
 * stored acceptance. "Decline" or no interaction = no analytics.
 *
 * Consent state lives in localStorage so the banner only shows once
 * per browser. The `window.__inspireConsent` flag is set so
 * GoogleAnalytics/MetaPixel components can key off it.
 */

const STORAGE_KEY = "inspire-cookie-consent-v1";

type ConsentValue = "accepted" | "declined" | null;

function readConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "accepted" || raw === "declined") return raw;
    return null;
  } catch {
    return null;
  }
}

function writeConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage disabled — banner will just reappear on next visit.
  }
  // Broadcast so analytics components in the same document can react
  // without waiting for a page reload.
  window.dispatchEvent(
    new CustomEvent("inspire-consent-change", { detail: { value } })
  );
}

/** Read consent at module load. Returns true if analytics may run. */
export function hasAnalyticsConsent(): boolean {
  return readConsent() === "accepted";
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if consent has not been decided yet.
    if (readConsent() === null) setVisible(true);
  }, []);

  function accept() {
    writeConsent("accepted");
    setVisible(false);
  }
  function decline() {
    writeConsent("declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-[9998] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto max-w-3xl m-3 sm:m-4 bg-navy text-white rounded-xl shadow-2xl border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1 min-w-0 pr-1">
          <h2
            id="cookie-consent-title"
            className="text-sm font-bold uppercase tracking-wider mb-1"
          >
            Cookies &amp; Analytics
          </h2>
          <p id="cookie-consent-desc" className="text-white/80 text-xs leading-relaxed">
            We use essential cookies to keep you signed in, and — with your
            permission — analytics cookies (Google Analytics, Meta Pixel) to
            understand how visitors use the site. See our{" "}
            <Link href="/privacy" className="underline hover:text-white">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={decline}
            className="min-h-[44px] px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="min-h-[44px] px-5 py-2 bg-red hover:bg-red-hover text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            Accept
          </button>
        </div>
        <button
          type="button"
          onClick={decline}
          aria-label="Dismiss (decline)"
          className="absolute top-2 right-2 sm:hidden text-white/40 hover:text-white"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
