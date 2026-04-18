"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-white border-success/40 text-navy",
  error: "bg-white border-danger/40 text-navy",
  warning: "bg-white border-warning/40 text-navy",
  info: "bg-white border-navy/20 text-navy",
};

const ICON_STYLES: Record<ToastType, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-navy",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 200);
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div
          className="fixed top-24 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <div
                key={t.id}
                className={cn(
                  "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg",
                  STYLES[t.type],
                  t.exiting ? "toast-exit" : "toast-enter"
                )}
                role="alert"
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", ICON_STYLES[t.type])} />
                <p className="text-sm font-medium flex-1">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="text-text-muted hover:text-navy flex-shrink-0 p-0.5"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}
