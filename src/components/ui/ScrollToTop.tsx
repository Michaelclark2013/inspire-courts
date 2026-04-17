"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Ensures the page scrolls to top on every client-side navigation.
 * Next.js App Router does this for hard navigations, but not always
 * for soft navigations within the same layout group.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return null;
}
