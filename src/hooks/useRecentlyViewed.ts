"use client";

import { useEffect, useState, useCallback } from "react";

interface RecentItem {
  id: string;
  name: string;
  path: string;
  viewedAt: number;
}

const STORAGE_KEY = "recently-viewed";
const MAX_ITEMS = 5;

/**
 * Track and retrieve recently viewed items (tournaments, etc).
 * Stores in localStorage with a max of 5 items.
 */
export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  // Load on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupted — ignore
    }
  }, []);

  const addItem = useCallback((item: Omit<RecentItem, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage full — ignore
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { items, addItem, clearAll };
}
