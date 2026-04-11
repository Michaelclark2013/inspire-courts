// ─── Facility Info ───────────────────────────────────────────────────────────

export const FACILITY_NAME = "Inspire Courts AZ";

export const FACILITY_ADDRESS = {
  street: "1090 N Fiesta Blvd",
  suite: "Ste 101 & 102",
  city: "Gilbert",
  state: "AZ",
  zip: "85233",
  full: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233",
};

export const FACILITY_EMAIL = "InspireCourts@gmail.com";

// ─── Social / External Links ─────────────────────────────────────────────────

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/inspirecourtsaz",
  instagramHandle: "@inspirecourtsaz",
  instagramMixtape: "https://instagram.com/azfinestmixtape",
  instagramMixtapeHandle: "@azfinestmixtape",
  youtube: "https://www.youtube.com/watch?v=1pJDZU2I6k4",
  leagueapps: "https://inspirecourts.leagueapps.com/tournaments",
};

// ─── Brand Colors ─────────────────────────────────────────────────────────────
// For use in inline styles / email templates.
// Tailwind classes (bg-red, bg-navy) reference CSS variables defined in globals.css.

export const BRAND_COLORS = {
  red: "#CC0000",
  navy: "#0B1D3A",
};

// ─── Site Metadata ───────────────────────────────────────────────────────────

export const SITE_NAME = "Inspire Courts AZ";
export const SITE_URL = "https://inspirecourtsaz.com";
export const SITE_DESCRIPTION =
  "Arizona's premier indoor basketball facility. 7 courts, live digital scoreboards, game film every game. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.";

// ─── Assets ──────────────────────────────────────────────────────────────────

export const HERO_BG_IMAGE =
  "https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg";

// ─── Inquiry Types (contact form) ────────────────────────────────────────────

export const INQUIRY_TYPES = [
  "Tournament Registration",
  "Club Interest - Player",
  "Club Interest - Coach",
  "Facility Rental",
  "Sponsorship Inquiry",
  "Referee Application",
  "General Question",
  "Other",
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

/** Maps contact-form inquiry type → CRM interest category. */
export const INQUIRY_INTEREST_MAP: Record<string, string> = {
  "Tournament Registration": "Tournament",
  "Club Interest - Player": "Club",
  "Club Interest - Coach": "Club",
  "Facility Rental": "Rental",
  "Sponsorship Inquiry": "General",
  "Referee Application": "General",
  "General Question": "General",
  Other: "General",
};

// ─── Booking Form Options ────────────────────────────────────────────────────

export const EVENT_TYPES = [
  "Practice / Workout",
  "League",
  "Tournament",
  "Birthday Party",
  "Corporate / Private Event",
  "Youth Camp or Clinic",
  "Film Session",
  "Combine / Tryout",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const SPORT_TYPES = [
  "Basketball",
  "Volleyball",
  "Both Basketball & Volleyball",
  "Other",
] as const;

export type SportType = (typeof SPORT_TYPES)[number];
