"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { relativeTime } from "@/lib/relative-time";
import type { Announcement } from "@/types/portal";

const STORAGE_KEY = "portal_dismissed_announcements";

function loadDismissed(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function saveDismissed(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

export function PortalAnnouncements({ announcements }: { announcements: Announcement[] }) {
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const dismiss = useCallback((id: number) => {
    setDismissed((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveDismissed(next);
      return next;
    });
  }, []);

  const visible = useMemo(
    () => announcements.filter((a) => !dismissed.includes(a.id)).slice(0, 3),
    [announcements, dismissed]
  );

  if (visible.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {visible.map((a) => (
        <div
          key={a.id}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 relative"
        >
          <div className="flex items-start gap-3">
            <Megaphone className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-amber-600 text-xs font-bold uppercase tracking-wider">
                  {a.title}
                </p>
                {a.createdAt && (
                  <span className="text-text-muted text-[10px] font-medium">
                    {relativeTime(a.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-navy/70 text-sm">{a.body}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismiss(a.id)}
            aria-label={`Dismiss announcement: ${a.title}`}
            className="absolute top-2 right-2 p-1 rounded-md text-amber-600/70 hover:text-amber-700 hover:bg-amber-100 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
