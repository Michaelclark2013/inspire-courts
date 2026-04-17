"use client";

import { useState, useCallback, useRef } from "react";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
}

/**
 * Imperative confirm dialog hook.
 * Returns `confirm()` which returns a Promise<boolean>,
 * plus props to spread onto ConfirmModal.
 *
 * @example
 * const { confirm, modalProps } = useConfirm();
 * const ok = await confirm({ title: "Delete?", message: "This cannot be undone." });
 * if (!ok) return;
 * // proceed...
 * <ConfirmModal {...modalProps} />
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const modalProps = {
    open,
    title: options.title,
    message: options.message,
    confirmLabel: options.confirmLabel,
    cancelLabel: options.cancelLabel,
    variant: options.variant,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return { confirm, modalProps };
}
