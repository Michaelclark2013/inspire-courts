"use client";

import { type ReactNode, type MouseEvent } from "react";
import { trackEvent } from "@/components/layout/Analytics";

interface TrackClickProps {
  category: string;
  action: string;
  label?: string;
  children: ReactNode;
  className?: string;
}

export default function TrackClick({
  category,
  action,
  label,
  children,
  className,
}: TrackClickProps) {
  function handleClick(e: MouseEvent) {
    trackEvent(action, category, label);
  }

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}
