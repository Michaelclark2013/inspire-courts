"use client";

import { type ReactNode } from "react";
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
  function handleClick() {
    trackEvent(action, category, label);
  }

  // role="presentation" + onClickCapture: this wrapper is purely an event
  // observer. Interactive children (Link, button) keep their own semantics
  // and keyboard handling — we just listen as clicks bubble through.
  return (
    <div role="presentation" onClickCapture={handleClick} className={className}>
      {children}
    </div>
  );
}
