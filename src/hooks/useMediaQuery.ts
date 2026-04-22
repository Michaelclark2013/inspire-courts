"use client";

import { useState, useEffect } from "react";

/**
 * Reactive media query hook.
 * Returns true when the given CSS media query matches.
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
 */
export function useMediaQuery(query: string): boolean {
  // Lazy init: the first render already has the correct value
  // (SSR-safe — falls back to false on the server). Avoids the
  // React 19 setState-in-effect cascading-render warning from the
  // old "useEffect → setMatches(mql.matches)" pattern.
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);

    function onChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
