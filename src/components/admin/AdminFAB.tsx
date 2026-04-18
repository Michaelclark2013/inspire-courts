"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, PenLine, UserCheck, Trophy, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import Tooltip from "@/components/ui/Tooltip";

const ACTIONS = [
  { href: "/admin/scores/enter", label: "Enter Score", icon: PenLine },
  { href: "/admin/checkin", label: "Check In", icon: UserCheck },
  { href: "/admin/tournaments/manage", label: "Tournament", icon: Trophy },
  { href: "/admin/announcements", label: "Announcement", icon: Megaphone },
];

export default function AdminFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[53] bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB + action items */}
      <div className="fixed bottom-[68px] right-4 md:bottom-6 md:right-6 z-[54] flex flex-col items-end gap-2.5">
        {open &&
          ACTIONS.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 bg-white border border-light-gray rounded-full pl-4 pr-3 py-2.5 text-navy text-sm font-semibold shadow-xl"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {action.label}
              <action.icon className="w-4 h-4 text-red flex-shrink-0" />
            </Link>
          ))}

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
