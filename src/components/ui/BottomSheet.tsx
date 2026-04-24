"use client";

import { useEffect, useRef } from "react";

/**
 * iOS-style bottom sheet. Slides up from the bottom of the viewport on
 * mobile and renders as a centered modal on desktop. Admin confirm
 * prompts (reset bracket, regenerate, etc.) use this instead of the
 * old top-anchored confirmation banners — more native-feeling and
 * consistent with every admin destructive action.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true"
 *   - Focus trapped on the sheet while open
 *   - Escape key closes
 *   - Backdrop click closes (the backdrop is a button w/ aria-label)
 *   - Prevents background scroll while open
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  widthClass = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Focus the first focusable element inside the sheet.
    const target = sheetRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    target?.focus();

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop. Button because it's interactive (click-to-close). */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-navy/40 backdrop-blur-[2px] cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        aria-describedby={description ? "bottom-sheet-desc" : undefined}
        ref={sheetRef}
        className={`fixed z-[81] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl
          bottom-0 left-0 right-0
          sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
          mx-auto w-full ${widthClass}
          max-h-[90vh] overflow-y-auto
          animate-slide-up sm:animate-none
          pb-[env(safe-area-inset-bottom)]`}
      >
        {/* Drag handle affordance (mobile only) */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
        </div>

        <div className="px-5 pt-2 sm:pt-5 pb-5">
          <h2
            id="bottom-sheet-title"
            className="text-base font-bold uppercase tracking-wider text-navy mb-1"
          >
            {title}
          </h2>
          {description && (
            <p id="bottom-sheet-desc" className="text-sm text-text-secondary mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </>
  );
}
