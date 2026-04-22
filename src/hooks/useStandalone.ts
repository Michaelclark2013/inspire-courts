"use client";

import { useEffect, useState } from "react";

/**
 * Detects if the app is running in standalone/PWA mode (installed to home screen).
 * Returns true for both Android (display-mode: standalone) and iOS (navigator.standalone).
 */
export function useStandalone(): boolean {
  // Lazy init so the first render already reflects the installed
  // state — avoids React 19's setState-in-effect warning from the
  // old "useEffect → setIsStandalone(...)" pattern.
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const ios =
      "standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true;
    try {
      return ios || window.matchMedia("(display-mode: standalone)").matches;
    } catch {
      return ios;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const iosStandalone =
      "standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true;
    // Listen for changes (e.g. user installs while browsing).
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) =>
      setIsStandalone(e.matches || iosStandalone);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isStandalone;
}
