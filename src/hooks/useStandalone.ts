"use client";

import { useEffect, useState } from "react";

/**
 * Detects if the app is running in standalone/PWA mode (installed to home screen).
 * Returns true for both Android (display-mode: standalone) and iOS (navigator.standalone).
 */
export function useStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // iOS Safari
    const iosStandalone =
      "standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true;

    // Android / desktop PWA
    const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;

    setIsStandalone(iosStandalone || mediaStandalone);

    // Listen for changes (e.g. if user installs while browsing)
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches || iosStandalone);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isStandalone;
}
