"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { triggerHaptic } from "@/lib/capacitor";

interface UsePullToRefreshOptions {
  /** Async callback fired when pull threshold is met */
  onRefresh: () => Promise<void>;
  /** Pull distance in px to trigger refresh (default 80) */
  threshold?: number;
  /** Disable the hook (e.g. when a modal is open) */
  disabled?: boolean;
}

/**
 * Pull-to-refresh hook for mobile/native app feel.
 * Returns state + a ref to attach to the scrollable container.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pulling_ = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      // Only activate when scrolled to top
      if (el && el.scrollTop > 0) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling_.current = false;
    },
    [disabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || refreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return;
      if (window.scrollY > 0) return;

      const dy = e.touches[0].clientY - startY.current;
      if (dy > 10) {
        pulling_.current = true;
        setPulling(true);
        // Rubber-band feel: diminishing returns past threshold
        const clamped = Math.min(dy * 0.5, threshold * 1.8);
        setPullDistance(clamped);
      }
    },
    [disabled, refreshing, threshold],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling_.current) return;
    setPulling(false);

    if (pullDistance >= threshold) {
      setRefreshing(true);
      triggerHaptic("medium");
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
    pulling_.current = false;
  }, [pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const el = containerRef.current ?? document;
    el.addEventListener("touchstart", handleTouchStart as EventListener, { passive: true });
    el.addEventListener("touchmove", handleTouchMove as EventListener, { passive: true });
    el.addEventListener("touchend", handleTouchEnd as EventListener);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart as EventListener);
      el.removeEventListener("touchmove", handleTouchMove as EventListener);
      el.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);

  return { containerRef, pulling, refreshing, pullDistance, progress };
}
