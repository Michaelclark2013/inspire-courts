"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  lines?: number;
  className?: string;
}

export default function ExpandableText({
  text,
  lines = 3,
  className = "",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const lineClampClass = expanded ? "" : `line-clamp-${lines}`;

  return (
    <div className={className}>
      <p className={`text-text-muted text-sm leading-relaxed ${lineClampClass}`}>
        {text}
      </p>
      {text.length > 120 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-red hover:text-red-hover text-xs font-semibold uppercase tracking-wider mt-1 transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
