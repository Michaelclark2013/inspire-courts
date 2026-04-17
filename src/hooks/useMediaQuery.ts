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
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    function onChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
