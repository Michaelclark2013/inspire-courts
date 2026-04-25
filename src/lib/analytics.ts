/**
 * Shared analytics utility — fires events to both GA4 and Meta Pixel.
 * Components import from here; they don't call gtag/fbq directly.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean>;

/** Fire a custom event on GA4 and Meta Pixel. */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === "undefined") return;

  // GA4
  window.gtag?.("event", eventName, params);

  // Meta Pixel custom event
  window.fbq?.("trackCustom", eventName, params);
}

/** Fire a named conversion event with platform-specific standard events. */
export function trackConversion(
  type:
    | "book_form_submit"
    | "contact_form_submit"
    | "register_click"
    | "newsletter_signup"
    | "phone_click"
    | "email_click"
    | "chat_open"
    | "book_cta_click"
    | "inquire_cta_click"
    | "inquire_form_submit"
) {
  trackEvent(type);

  if (typeof window === "undefined") return;

  // Meta standard events for key conversions
  switch (type) {
    case "book_form_submit":
      window.fbq?.("track", "Lead", { content_name: "booking_request" });
      break;
    case "contact_form_submit":
      window.fbq?.("track", "Contact");
      break;
    case "register_click":
      window.fbq?.("track", "InitiateCheckout");
      break;
    case "newsletter_signup":
      window.fbq?.("track", "Subscribe");
      break;
  }
}
