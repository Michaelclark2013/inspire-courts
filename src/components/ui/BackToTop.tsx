"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed z-[90] left-4 w-11 h-11 rounded-full bg-navy border border-border-dark text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-red hover:border-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2",
        "bottom-32 lg:bottom-8",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <ChevronUp className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
