"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, Share, Download, Plus } from "lucide-react";
import { useStandalone } from "@/hooks/useStandalone";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function InstallPrompt() {
  const pathname = usePathname();
  const isStandalone = useStandalone();
  const isAdmin = pathname.startsWith("/admin");

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [visible, setVisible] = useState(false);

  // Listen for beforeinstallprompt (Android / Chrome)
  useEffect(() => {
    if (isStandalone || isDismissed()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isStandalone]);

  // iOS detection (no beforeinstallprompt)
  useEffect(() => {
    if (isStandalone || isDismissed()) return;
    if (isIOS() && !deferredPrompt) {
      setShowIOSBanner(true);
      setVisible(true);
    }
  }, [isStandalone, deferredPrompt]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismiss();
    setVisible(false);
  }, []);

  if (!visible) return null;

  const bgColor = isAdmin ? "bg-red-600" : "bg-[#0B1D3A]";
  const label = isAdmin ? "Install Inspire Admin for quick access" : "Install Inspire Courts for the best experience";

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-[9998] ${bgColor} text-white rounded-2xl shadow-2xl p-4 animate-slide-up sm:left-auto sm:right-6 sm:max-w-sm`}
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>

      {showIOSBanner ? (
        <div className="pr-8">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="inline-flex items-center gap-1">
              Tap <Share className="w-4 h-4 inline" aria-hidden="true" /> Share
            </span>
            <span>then</span>
            <span className="inline-flex items-center gap-1">
              <Plus className="w-4 h-4 inline" aria-hidden="true" /> Add to Home Screen
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 pr-8">
          <Download className="w-8 h-8 shrink-0 opacity-80" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{label}</p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 bg-white text-[#0B1D3A] font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/90 transition-colors"
          >
            Install
          </button>
        </div>
      )}
    </div>
  );
}
