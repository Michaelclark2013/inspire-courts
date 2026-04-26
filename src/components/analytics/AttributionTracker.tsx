"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureFirstTouchAttribution } from "@/lib/attribution";

/**
 * Mount-once tracker that runs `captureFirstTouchAttribution()` on every
 * client-side navigation. Lives in the root layout so it fires across
 * the whole public site without any per-page wiring.
 *
 * Implementation note: usePathname + useSearchParams trigger a re-run
 * on App Router navigation, which is exactly what we want — a visitor
 * who browses /basketball?utm=… → /inquire/training still has the utm
 * captured the moment the first URL was loaded.
 */
export function AttributionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    captureFirstTouchAttribution();
    // pathname + searchParams are intentionally referenced so the effect
    // re-runs on every navigation (App Router quirk).
  }, [pathname, searchParams]);
  return null;
}
