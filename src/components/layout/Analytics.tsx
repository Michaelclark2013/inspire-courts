/**
 * Legacy Analytics shim — kept for TrackClick backward compatibility.
 * Script loading is now handled by src/components/analytics/GoogleAnalytics.tsx.
 * New code should import from @/lib/analytics directly.
 */
import { trackEvent as _trackEvent } from "@/lib/analytics";

/** @deprecated Use trackEvent from @/lib/analytics instead. */
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  _trackEvent(action, { event_category: category, ...(label && { event_label: label }), ...(value !== undefined && { value }) });
}

// Default export is a no-op; layout no longer renders this component.
export default function Analytics() {
  return null;
}
