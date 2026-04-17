"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface DeadlineCountdownProps {
  /** ISO date string (YYYY-MM-DD) */
  deadline: string;
  /** Label prefix (default: "Registration closes") */
  label?: string;
  className?: string;
}

/**
 * Shows a human-readable countdown to a deadline.
 * - "> 7 days": "in 12 days"
 * - "1-7 days": "in 3 days" (amber urgency)
 * - "< 24 hours": "in 5 hours" (red urgency, pulsing)
 * - Past deadline: "Closed"
 */
export function DeadlineCountdown({
  deadline,
  label = "Closes",
  className = "",
}: DeadlineCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000); // update every minute
    return () => clearInterval(id);
  }, []);

  const target = new Date(deadline + "T23:59:59").getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-text-muted text-xs ${className}`}>
        <Clock className="w-3 h-3" /> Closed
      </span>
    );
  }

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);

  let text: string;
  let urgency: "normal" | "soon" | "urgent";

  if (days > 7) {
    text = `${label} in ${days} days`;
    urgency = "normal";
  } else if (days >= 1) {
    text = `${label} in ${days} day${days !== 1 ? "s" : ""}`;
    urgency = "soon";
  } else {
    text = `${label} in ${hours} hour${hours !== 1 ? "s" : ""}`;
    urgency = "urgent";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        urgency === "urgent"
          ? "text-red"
          : urgency === "soon"
            ? "text-amber-600"
            : "text-text-muted"
      } ${className}`}
    >
      <Clock className={`w-3 h-3 ${urgency === "urgent" ? "animate-pulse" : ""}`} />
      {text}
    </span>
  );
}
