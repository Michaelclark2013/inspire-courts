"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  queueMutation as queueMutationDB,
  replayPendingMutations,
  getPendingCount,
  clearSyncedMutations,
} from "@/lib/offline-sync";

type MutationInput = {
  url: string;
  method: string;
  body: unknown;
  type: "score" | "checkin";
};

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    synced: number;
    failed: number;
  } | null>(null);
  const mountedRef = useRef(true);

  // Initialise online state on mount (SSR-safe)
  useEffect(() => {
    setIsOnline(navigator.onLine);
  }, []);

  // Refresh pending count
  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      if (mountedRef.current) setPendingCount(count);
    } catch {
      // IndexedDB may be unavailable in some contexts
    }
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Auto-replay on reconnect
      replayNow();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    refreshCount();
    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Replay pending mutations
  const replayNow = useCallback(async () => {
    const count = await getPendingCount();
    if (count === 0) return;
    setIsSyncing(true);
    try {
      const result = await replayPendingMutations();
      if (mountedRef.current) {
        setLastSyncResult(result);
        // Clear synced records after successful replay
        await clearSyncedMutations();
        await refreshCount();
        // Auto-dismiss sync result after 3 seconds
        setTimeout(() => {
          if (mountedRef.current) setLastSyncResult(null);
        }, 3000);
      }
    } catch {
      // Sync failed entirely
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [refreshCount]);

  // Queue a mutation and update the count
  const queueMutation = useCallback(
    async (mutation: MutationInput) => {
      await queueMutationDB(mutation);
      await refreshCount();
      // Try to register background sync if available
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const tag =
            mutation.type === "score" ? "score-sync" : "checkin-sync";
          await (reg as unknown as { sync: { register: (t: string) => Promise<void> } }).sync.register(tag);
        } catch {
          // Background sync not available — will replay on reconnect
        }
      }
    },
    [refreshCount]
  );

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    queueMutation,
    replayNow,
  };
}
