"use client";

import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Wifi, WifiOff, Loader2, CheckCircle2 } from "lucide-react";

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, lastSyncResult } =
    useOfflineSync();

  // Show nothing when online with no pending items and no recent sync
  if (isOnline && pendingCount === 0 && !isSyncing && !lastSyncResult) {
    return null;
  }

  // Just-synced success state
  if (isOnline && lastSyncResult && !isSyncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-center gap-2 animate-pulse"
      >
        <CheckCircle2 className="w-4 h-4" />
        All changes synced!
        {lastSyncResult.failed > 0 && (
          <span className="text-emerald-100 text-xs ml-1">
            ({lastSyncResult.failed} failed)
          </span>
        )}
      </div>
    );
  }

  // Syncing state
  if (isOnline && isSyncing) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-center gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Syncing offline changes...
      </div>
    );
  }

  // Online but with pending items (waiting to sync)
  if (isOnline && pendingCount > 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-center gap-2"
      >
        <Wifi className="w-4 h-4" />
        {pendingCount} update{pendingCount !== 1 ? "s" : ""} pending sync
      </div>
    );
  }

  // Offline state
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4" />
      <span>
        You&apos;re offline &mdash; changes are saved locally and will sync when
        reconnected
      </span>
      {pendingCount > 0 && (
        <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs ml-1">
          {pendingCount} update{pendingCount !== 1 ? "s" : ""} pending
        </span>
      )}
    </div>
  );
}
