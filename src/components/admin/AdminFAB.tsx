"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, PenLine, UserCheck, Trophy, Megaphone, FileSignature, UserPlus, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import Tooltip from "@/components/ui/Tooltip";

const ACTIONS = [
  { href: "/admin/scores/enter", label: "Enter Score", icon: PenLine },
  { href: "/admin/checkin", label: "Check In", icon: UserCheck },
  { href: "/admin/rentals/new", label: "New Rental", icon: FileSignature },
  { href: "/admin/members", label: "New Member", icon: UserPlus },
  { href: "/admin/resources/new", label: "Add Vehicle", icon: Truck },
  { href: "/admin/tournaments/manage", label: "Tournament", icon: Trophy },
  { href: "/admin/announcements", label: "Announcement", icon: Megaphone },
];

export default function AdminFAB() {
  const [open, setOpen] = useState(false);

  // Close on Escape so keyboard users aren't trapped
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[53] bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB + action items — sits above the bottom tab bar with safe-area awareness.
          Max-height + scroll so the action list never pushes past the
          viewport on a short screen (e.g. iPhone SE). */}
      <div
        className="fixed right-4 md:bottom-6 md:right-6 z-[54] flex flex-col items-end gap-2.5"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom) + 12px)" }}
      >
        {open && (
          <div
            className="flex flex-col items-end gap-2.5 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            {ACTIONS.map((action, i) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 bg-white border border-light-gray rounded-full pl-5 pr-4 min-h-[44px] text-navy text-sm font-semibold shadow-xl whitespace-nowrap"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {action.label}
                <action.icon className="w-5 h-5 text-red flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        <Tooltip content={open ? "Close" : "Quick actions"} position="left">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close quick actions" : "Open quick actions"}
            aria-expanded={open}
            className={cn(
              "w-14 h-14 rounded-full bg-red shadow-xl flex items-center justify-center transition-transform duration-200",
              open ? "rotate-45" : ""
            )}
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </>
  );
}
