"use client";

import { useState } from "react";
import { CircleDot } from "lucide-react";

interface TeamLogoProps {
  teamName: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}

/**
 * Shows a team logo image, falling back to a basketball-dot icon if not found.
 * Pass `logoUrl` directly to avoid any fetch; if omitted the placeholder shows.
 */
export default function TeamLogo({ teamName, logoUrl, size = 32, className = "" }: TeamLogoProps) {
  const [errored, setErrored] = useState(false);

  const dim = `${size}px`;

  if (!logoUrl || errored) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-white/[0.06] flex-shrink-0 ${className}`}
        style={{ width: dim, height: dim }}
        aria-label={teamName}
      >
        <CircleDot
          style={{ width: Math.round(size * 0.55), height: Math.round(size * 0.55) }}
          className="text-white/25"
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${teamName} logo`}
      width={size}
      height={size}
      className={`object-contain rounded-full flex-shrink-0 ${className}`}
      style={{ width: dim, height: dim }}
      onError={() => setErrored(true)}
    />
  );
}
