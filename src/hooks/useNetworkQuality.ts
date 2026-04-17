"use client";

import { useState, useEffect } from "react";

type ConnectionQuality = "fast" | "slow" | "offline";

interface NetworkInfo {
  quality: ConnectionQuality;
  effectiveType?: string;
  saveData?: boolean;
}

/**
 * Detect network quality for adaptive UX.
 * Uses Navigator.connection API when available.
 * Returns "fast" by default if API not supported.
 */
export function useNetworkQuality(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>({ quality: "fast" });

  useEffect(() => {
    function update() {
      if (!navigator.onLine) {
        setInfo({ quality: "offline" });
        return;
      }

      const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
      if (conn) {
        const slow = conn.effectiveType === "slow-2g" || conn.effectiveType === "2g" || conn.saveData === true;
        setInfo({
          quality: slow ? "slow" : "fast",
          effectiveType: conn.effectiveType,
          saveData: conn.saveData,
        });
      } else {
        setInfo({ quality: "fast" });
      }
    }

    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const conn = (navigator as unknown as { connection?: { addEventListener: (e: string, fn: () => void) => void; removeEventListener: (e: string, fn: () => void) => void } }).connection;
    conn?.addEventListener("change", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener("change", update);
    };
  }, []);

  return info;
}
