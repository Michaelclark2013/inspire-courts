"use client";

import { useState, useRef, type ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show() {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setVisible(true), 300);
  }

  function hide() {
    clearTimeout(timeout.current);
    setVisible(false);
  }

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded bg-navy px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg pointer-events-none ${positionClasses[position]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
