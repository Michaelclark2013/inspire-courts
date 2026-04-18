"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const DISMISS_KEY = "inspire-push-dismissed";
const DISMISS_DAYS = 30;

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  if (isNaN(ts)) return false;
  const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

export default function PushNotificationPrompt() {
  const { isSupported, isSubscribed, isLoading, subscribe } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only when supported, not subscribed, and not recently dismissed
    if (isSupported && !isSubscribed && !isDismissed()) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isSupported, isSubscribed]);

  if (!visible) return null;

  return (
    <div className="mb-4 bg-white border border-light-gray shadow-sm rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-red/10 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4.5 h-4.5 text-red" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-navy text-sm font-semibold mb-0.5">
          Stay in the loop
        </p>
        <p className="text-text-muted text-xs leading-relaxed">
          Get notified about live scores, tournament updates, and check-in
          reminders.
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={subscribe}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 bg-red hover:bg-red-hover disabled:opacity-60 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            <Bell className="w-3 h-3" aria-hidden="true" />
            {isLoading ? "Enabling..." : "Enable Notifications"}
          </button>

          <button
            type="button"
            onClick={() => {
              dismiss();
              setVisible(false);
            }}
            className="text-text-muted text-xs hover:text-navy transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none rounded px-2 py-1"
          >
            Not now
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          dismiss();
          setVisible(false);
        }}
        className="text-text-muted hover:text-navy transition-colors p-0.5 rounded focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none flex-shrink-0"
        aria-label="Dismiss notification prompt"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
