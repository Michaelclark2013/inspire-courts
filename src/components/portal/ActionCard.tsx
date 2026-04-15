"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";

const COLOR_MAP = {
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200 hover:border-cyan-300", icon: "text-cyan-600" },
  blue: { bg: "bg-blue-50", border: "border-blue-200 hover:border-blue-300", icon: "text-blue-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200 hover:border-amber-300", icon: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200 hover:border-emerald-300", icon: "text-emerald-600" },
  red: { bg: "bg-red/[0.08]", border: "border-red/20 hover:border-red/30", icon: "text-red" },
} as const;

export type ActionCardColor = keyof typeof COLOR_MAP;

type Props = {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  color: ActionCardColor;
  /** When true, the router prefetches the route on hover (for the top 3 actions). */
  prefetchOnHover?: boolean;
};

function ActionCardImpl({ href, icon: Icon, title, desc, color, prefetchOnHover = false }: Props) {
  const c = COLOR_MAP[color];
  const router = useRouter();
  const onHover = useCallback(() => {
    if (prefetchOnHover) {
      try {
        router.prefetch(href);
      } catch {
        /* noop */
      }
    }
  }, [router, href, prefetchOnHover]);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`${c.bg} border ${c.border} rounded-2xl p-4 transition-all group focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-navy font-semibold text-sm">{title}</h3>
          <p className="text-text-muted text-xs">{desc}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-light-gray group-hover:text-navy/30 transition-colors" />
      </div>
    </Link>
  );
}

export const ActionCard = memo(ActionCardImpl);
