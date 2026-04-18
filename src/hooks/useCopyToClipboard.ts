"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook for copying text to clipboard with a short-lived "copied" flag.
 *
 * Returns a tuple: `[copied, copy]`.
 * - `copied` — true for `resetMs` after a successful copy, then false again.
 * - `copy(text)` — writes the string and sets `copied=true`; returns the
 *   promise from the underlying clipboard call.
 *
 * Handles: clipboard API unavailable (older browsers / insecure contexts)
 * by falling back to a hidden `<textarea>` + document.execCommand("copy").
 * Cleans up the reset timeout on unmount so it won't setState after unmount.
 */
export function useCopyToClipboard(resetMs: number = 2000): [boolean, (text: string) => Promise<boolean>] {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      let ok = false;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        } else if (typeof document !== "undefined") {
          // Fallback for older browsers / non-secure contexts
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          ok = document.execCommand("copy");
          document.body.removeChild(textarea);
        }
      } catch {
        ok = false;
      }

      if (ok) {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [resetMs]
  );

  return [copied, copy];
}
