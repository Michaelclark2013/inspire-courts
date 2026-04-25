"use client";

import { useEffect } from "react";

// Sets `document.title` on mount and whenever `title` changes, then
// restores the previous title on unmount. Used by admin list pages so the
// browser tab reflects the section the operator is currently in instead
// of the static layout title.
export function useDocumentTitle(title: string, suffix = "Inspire Courts AZ") {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.title;
    document.title = title ? `${title} | ${suffix}` : suffix;
    return () => {
      document.title = previous;
    };
  }, [title, suffix]);
}
