"use client";

import { useState, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

const SHORTCUTS = [
  { keys: ["R"], desc: "Refresh data" },
  { keys: ["N"], desc: "New item" },
  { keys: ["Esc"], desc: "Close modal / panel" },
  { keys: ["/"], desc: "Focus search" },
  { keys: ["?"], desc: "Toggle this panel" },
];

export default function KeyboardShortcutsHint() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* FAB trigger - visible on desktop only, positioned above admin FAB area */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        className="hidden lg:flex fixed bottom-6 right-6 z-[52] w-10 h-10 rounded-full bg-navy/80 hover:bg-navy text-white items-center justify-center shadow-lg transition-colors"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed z-[61] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-border w-[340px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-navy font-bold text-sm uppercase tracking-wider">Keyboard Shortcuts</h3>
              <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-navy transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-3">
              {SHORTCUTS.map((s) => (
                <li key={s.desc} className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">{s.desc}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-off-white border border-border rounded text-navy text-xs font-mono font-semibold"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-text-secondary text-[10px] mt-5">Press <kbd className="bg-off-white border border-border rounded px-1 text-navy font-mono">?</kbd> to toggle</p>
          </div>
        </>
      )}
    </>
  );
}
