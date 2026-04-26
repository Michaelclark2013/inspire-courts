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

  // Meta + GA4 standard events for key conversions. Without these,
  // GA4 funnels (view_item → add_to_cart → begin_checkout → purchase)
  // can't be built and audience targeting is harder on Meta.
  switch (type) {
    case "book_form_submit":
      window.fbq?.("track", "Lead", { content_name: "booking_request" });
      window.gtag?.("event", "generate_lead", { method: "book_form" });
      break;
    case "contact_form_submit":
      window.fbq?.("track", "Contact");
      window.gtag?.("event", "generate_lead", { method: "contact_form" });
      break;
    case "inquire_form_submit":
      window.fbq?.("track", "Lead", { content_name: "inquiry" });
      window.gtag?.("event", "generate_lead", { method: "inquire_form" });
      break;
    case "register_click":
      window.fbq?.("track", "InitiateCheckout");
      window.gtag?.("event", "begin_checkout");
      break;
    case "newsletter_signup":
      window.fbq?.("track", "Subscribe");
      window.gtag?.("event", "sign_up", { method: "newsletter" });
      break;
    case "book_cta_click":
      window.gtag?.("event", "select_promotion", { creative_slot: "book_cta" });
      break;
    case "inquire_cta_click":
      window.gtag?.("event", "select_promotion", { creative_slot: "inquire_cta" });
      break;
    case "phone_click":
      window.gtag?.("event", "click", { link_type: "tel" });
      break;
    case "email_click":
      window.gtag?.("event", "click", { link_type: "mailto" });
      break;
  }
}
