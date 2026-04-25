"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { registration: ServiceWorkerRegistration };
      if (detail?.registration) {
        setRegistration(detail.registration);
        setVisible(true);
      }
    };

    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    // controllerchange listener in ServiceWorkerRegistrar will reload
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-navy text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-slide-down max-w-xs">
      <RefreshCw className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" />
      <p className="text-sm flex-1">A new version is available</p>
      <button
        onClick={handleUpdate}
        className="shrink-0 bg-white text-navy font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
      >
        Update
      </button>
    </div>
  );
}
