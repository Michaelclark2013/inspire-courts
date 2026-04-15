"use client";

import { memo, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  ClipboardList,
  UserCheck,
  Megaphone,
  Users,
  ArrowRight,
} from "lucide-react";

type Action = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  color: string;
  shortcutHint?: string;
};

const ACTIONS: Action[] = [
  {
    href: "/admin/scores/enter",
    icon: ClipboardList,
    label: "Enter Scores",
    color: "text-emerald-600",
    shortcutHint: "S",
  },
  {
    href: "/admin/checkin",
    icon: UserCheck,
    label: "Check-In",
    color: "text-cyan-600",
    shortcutHint: "C",
  },
  {
    href: "/admin/announcements",
    icon: Megaphone,
    label: "Announcement",
    color: "text-amber-600",
    shortcutHint: "A",
  },
  {
    href: "/admin/teams",
    icon: Users,
    label: "Teams",
    color: "text-blue-600",
  },
];

const SHORTCUTS = [
  { key: "T", desc: "Create / manage tournaments" },
  { key: "S", desc: "Enter scores" },
  { key: "C", desc: "Game day check-in" },
  { key: "A", desc: "Post announcement" },
  { key: "?", desc: "Toggle this shortcuts panel" },
  { key: "Esc", desc: "Close shortcuts panel" },
];

function QuickActions() {
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      switch (e.key.toLowerCase()) {
        case "t":
          router.push("/admin/tournaments/manage");
          break;
        case "s":
          router.push("/admin/scores/enter");
          break;
        case "c":
          router.push("/admin/checkin");
          break;
        case "a":
          router.push("/admin/announcements");
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
        case "escape":
          setShowShortcuts(false);
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="space-y-3">
      {showShortcuts && (
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/20"
            onClick={() => setShowShortcuts(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-heading"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] bg-white border border-light-gray rounded-xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                id="shortcuts-heading"
                className="text-navy font-bold text-sm uppercase tracking-wider"
              >
                Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-text-secondary hover:text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red rounded"
                aria-label="Close shortcuts"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2">
              {SHORTCUTS.map((s) => (
                <li key={s.key} className="flex items-center gap-3">
                  <kbd className="bg-off-white border border-light-gray rounded px-2 py-1 text-xs font-mono text-navy font-bold min-w-[2.5rem] text-center">
                    {s.key}
                  </kbd>
                  <span className="text-text-secondary text-sm">{s.desc}</span>
                </li>
              ))}
            </ul>
            <p className="text-text-secondary text-xs mt-4">
              Shortcuts only active when not focused on an input field.
            </p>
          </div>
        </>
      )}

      <Link
        href="/admin/tournaments/manage"
        prefetch
        className="flex items-center justify-center gap-3 bg-red hover:bg-red-hover text-white rounded-xl px-6 py-4 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2"
      >
        <Trophy
          className="w-5 h-5 group-hover:scale-110 transition-transform"
          aria-hidden="true"
        />
        <span className="text-sm font-bold uppercase tracking-wider">
          Create New Tournament
        </span>
        <kbd className="hidden lg:inline-block text-[9px] text-white/80 bg-white/20 px-1.5 py-0.5 rounded font-mono ml-2">
          T
        </kbd>
        <ArrowRight
          className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform"
          aria-hidden="true"
        />
      </Link>

      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              prefetch
              aria-label={a.label}
              className="flex items-center gap-2.5 bg-white border border-light-gray shadow-sm hover:border-text-secondary/30 rounded-xl px-4 py-3 transition-all group hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red"
            >
              <Icon
                className={`w-4 h-4 ${a.color} group-hover:scale-110 transition-transform`}
                aria-hidden="true"
              />
              <span className="text-navy text-xs font-semibold uppercase tracking-wider">
                {a.label}
              </span>
              {a.shortcutHint && (
                <kbd className="hidden lg:inline-block ml-auto text-[9px] text-text-secondary bg-off-white px-1.5 py-0.5 rounded font-mono">
                  {a.shortcutHint}
                </kbd>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default memo(QuickActions);
