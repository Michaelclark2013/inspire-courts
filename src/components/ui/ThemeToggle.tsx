"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "icaz-theme";

function resolveTheme(pref: Theme): "light" | "dark" {
  if (pref === "system") {
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }
  return pref;
}

function applyTheme(pref: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
}

// Client-only theme toggle. Persists preference to localStorage and
// applies the `dark` class on <html> so Tailwind's dark: variants
// kick in once the design system adds them.
export default function ThemeToggle() {
  const [pref, setPref] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = (window.localStorage.getItem(STORAGE_KEY) as Theme) || "system";
      setPref(saved);
      applyTheme(saved);
    } catch { /* ignore */ }
  }, []);

  function pick(next: Theme) {
    setPref(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    applyTheme(next);
  }

  const opts: Array<{ v: Theme; icon: React.ReactNode; label: string }> = [
    { v: "light", icon: <Sun className="w-3.5 h-3.5" />, label: "Light" },
    { v: "dark", icon: <Moon className="w-3.5 h-3.5" />, label: "Dark" },
    { v: "system", icon: <Monitor className="w-3.5 h-3.5" />, label: "System" },
  ];

  return (
    <div className="inline-flex items-center gap-1 bg-off-white border border-border rounded-full p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => pick(o.v)}
          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors ${
            pref === o.v ? "bg-navy text-white shadow-sm" : "text-text-muted hover:text-navy"
          }`}
          aria-pressed={pref === o.v}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}
