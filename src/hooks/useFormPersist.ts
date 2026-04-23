"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";

/**
 * Persist form data to localStorage so users don't lose progress
 * on accidental navigation or page refresh.
 *
 * @param key - Unique storage key for this form
 * @param data - Current form data object
 * @param setData - Function to restore form data
 * @param options.debounceMs - Save debounce (default 500ms)
 * @param options.exclude - Keys to exclude from persistence (e.g. passwords)
 *
 * @example
 * const { clearSaved, hasSaved } = useFormPersist(
 *   `register-${id}`,
 *   { teamName, coachName, coachEmail },
 *   (saved) => { setTeamName(saved.teamName || ""); ... }
 * );
 */
export function useFormPersist<T extends Record<string, unknown>>(
  key: string,
  data: T,
  setData: (saved: Partial<T>) => void,
  options?: { debounceMs?: number; exclude?: string[] },
) {
  const debounce = options?.debounceMs ?? 500;
  // Stable reference to the exclude list — `options?.exclude ?? []` would
  // return a fresh array every render, re-firing the save effect unnecessarily.
  const exclude = useMemo(() => options?.exclude ?? [], [options?.exclude]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);

  // Restore on mount (once)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(`form:${key}`);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<T>;
        setData(saved);
      }
    } catch {
      // Corrupted data — ignore
    }
  }, [key, setData]);

  // Save on change (debounced)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const filtered = { ...data };
        for (const k of exclude) {
          delete filtered[k];
        }
        // Only persist if there's actual data
        const hasValues = Object.values(filtered).some(
          (v) => v !== "" && v !== false && v !== null && v !== undefined,
        );
        if (hasValues) {
          localStorage.setItem(`form:${key}`, JSON.stringify(filtered));
        }
      } catch {
        // Storage full or unavailable — fail silently
      }
    }, debounce);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, debounce, exclude]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(`form:${key}`);
    } catch {
      // Ignore
    }
  }, [key]);

  const hasSaved = useCallback(() => {
    try {
      return localStorage.getItem(`form:${key}`) !== null;
    } catch {
      return false;
    }
  }, [key]);

  return { clearSaved, hasSaved };
}
