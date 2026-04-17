"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Inner component that uses useSearchParams (requires Suspense boundary).
 */
function RouteLoadingBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevUrl = useRef("");

  const start = useCallback(() => {
    setProgress(15);
    setVisible(true);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const increment = p < 50 ? 8 : p < 80 ? 3 : 1;
        return Math.min(p + increment, 90);
      });
    }, 300);
  }, []);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    const url = pathname + searchParams.toString();
    if (prevUrl.current && prevUrl.current !== url) {
      finish();
    }
    prevUrl.current = url;
  }, [pathname, searchParams, finish]);

  // Listen for route change start via link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (target.getAttribute("target") === "_blank") return;
      if (href !== pathname) {
        start();
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, start]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      <div
        className="h-full bg-red transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          boxShadow: "0 0 8px rgba(204, 0, 0, 0.4)",
        }}
      />
    </div>
  );
}

/**
 * Slim top-of-page loading bar that animates on route changes.
 * Wrapped in Suspense because useSearchParams requires it.
 */
export function RouteLoadingBar() {
  return (
    <Suspense fallback={null}>
      <RouteLoadingBarInner />
    </Suspense>
  );
}
