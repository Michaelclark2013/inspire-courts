"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onCancel();
          return;
        }
        // Focus trap: cycle Tab within modal
        if (e.key === "Tab" && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-backdrop-in"
        onClick={onCancel}
      />
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-down"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-2 right-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-navy hover:bg-off-white transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          aria-label="Close"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDanger ? "bg-red/10" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${isDanger ? "text-red" : "text-amber-600"}`}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-title"
              className="text-navy font-bold text-base uppercase tracking-tight font-[var(--font-chakra)] mb-1"
            >
              {title}
            </h3>
            <p id="confirm-desc" className="text-text-muted text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 min-h-[44px] rounded-lg text-sm font-semibold text-text-muted hover:text-navy hover:bg-off-white transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-5 py-3 min-h-[44px] rounded-lg text-sm font-bold uppercase tracking-wider text-white transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:outline-none ${
              isDanger
                ? "bg-red hover:bg-red-hover"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
