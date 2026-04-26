"use client";

// Dismissable red error banner — used across admin mutation handlers
// to surface API failures (401/404/5xx/network) instead of silent
// no-ops. Same visual treatment that landed across 8+ admin pages
// during the silent-mutation cleanup; centralized so future use sites
// stay consistent.
//
// Usage:
//   const [err, setErr] = useState<string | null>(null);
//   ...
//   <ErrorBanner message={err} onDismiss={() => setErr(null)} />
//
// Renders nothing when message is falsy, so callers can drop it in
// unconditionally above their list/grid.

export function ErrorBanner({
  message,
  onDismiss,
  className = "",
}: {
  message: string | null | undefined;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`bg-red/5 border border-red/30 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 ${className}`}
    >
      <p className="text-navy text-sm font-semibold">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-text-secondary hover:text-navy focus-visible:outline-none focus-visible:underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
