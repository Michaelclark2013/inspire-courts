"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

// iOS-style "Install this app" card. Shown once on /admin for mobile
// visitors who haven't installed the PWA. Dismiss persists to
// localStorage so it doesn't nag.
const STORAGE_KEY = "icaz-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (dismissed) return;
    } catch { /* ignore */ }

    // Already installed? (iOS standalone mode check)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Only bother on mobile widths.
    if (window.innerWidth > 768) return;

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS doesn't fire beforeinstallprompt — show the card manually.
    if (ios) setVisible(true);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    try { window.localStorage.setItem(STORAGE_KEY, new Date().toISOString()); } catch { /* ignore */ }
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") dismiss();
    } catch { /* ignore */ }
  }

  if (!visible) return null;

  return (
    <div className="lg:hidden mb-6 bg-gradient-to-br from-red to-red-hover text-white rounded-2xl p-4 shadow-lg flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">Install Inspire Courts</p>
        <p className="text-white/80 text-xs mt-0.5">
          {isIOS
            ? "Tap Share → Add to Home Screen for instant access."
            : "Get one-tap access from your home screen."}
        </p>
        {!isIOS && (
          <button
            onClick={install}
            className="mt-2 bg-white text-red font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" /> Install
          </button>
        )}
      </div>
      <button onClick={dismiss} aria-label="Dismiss" className="text-white/70 hover:text-white p-1 flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
