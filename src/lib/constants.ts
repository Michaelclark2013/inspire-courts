// ─── Facility Info ───────────────────────────────────────────────────────────

export const SITE_NAME = "Inspire Courts AZ";
export const FACILITY_NAME = SITE_NAME;

export const FACILITY_ADDRESS = {
  street: "1090 N Fiesta Blvd",
  suite: "Ste 101 & 102",
  city: "Gilbert",
  state: "AZ",
  zip: "85233",
  full: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233",
};

export const FACILITY_EMAIL = "InspireCourts@gmail.com";

export const FACILITY_PHONE = "(480) 221-7218";

// ─── Social / External Links ─────────────────────────────────────────────────

export const LEAGUEAPPS_URL = "https://inspirecourts.leagueapps.com/tournaments";

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/inspirecourts",
  instagramHandle: "@inspirecourts",
  instagramMixtape: "https://instagram.com/azfinestmixtape",
  instagramMixtapeHandle: "@azfinestmixtape",
  youtube: "https://www.youtube.com/watch?v=1pJDZU2I6k4",
};

// ─── Brand Colors ─────────────────────────────────────────────────────────────
// For use in inline styles / email templates.
// Tailwind classes (bg-red, bg-navy) reference CSS variables defined in globals.css.

export const BRAND_COLORS = {
  red: "#CC0000",
  navy: "#0B1D3A",
};

// ─── Site Metadata ───────────────────────────────────────────────────────────

export const SITE_URL = "https://inspirecourtsaz.com";
export const SITE_DESCRIPTION =
  "Arizona's premier indoor basketball & volleyball facility. 7 courts, game film available at tournaments. Home of OFF SZN HOOPS tournaments in Gilbert, AZ.";

// ─── Assets ──────────────────────────────────────────────────────────────────

export const HERO_BG_IMAGE = "/images/courts-bg.jpg";

// ─── Inquiry Types (contact form) ────────────────────────────────────────────

export const INQUIRY_TYPES = [
  "Court Rental / Booking",
  "Tournament Registration",
  "Private Training",
  "Inspire Prep",
  "Team Inspire / Club",
  "Open Gym",
  "Camps & Clinics",
  "Jiu-Jitsu Event",
  "Futsal Event",
  "Birthday Party / Private Event",
  "Sponsorship Inquiry",
  "Referee Application",
  "General Question",
  "Other",
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

/** Maps contact-form inquiry type → CRM interest category. */
export const INQUIRY_INTEREST_MAP: Record<string, string> = {
  "Court Rental / Booking": "Rental",
  "Tournament Registration": "Tournament",
  "Private Training": "Training",
  "Inspire Prep": "Prep",
  "Team Inspire / Club": "Club",
  "Open Gym": "Open Gym",
  "Camps & Clinics": "Camps",
  "Jiu-Jitsu Event": "Rental",
  "Futsal Event": "Rental",
  "Birthday Party / Private Event": "Rental",
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
  "Futsal",
  "Jiu-Jitsu",
  "Other",
] as const;

export type SportType = (typeof SPORT_TYPES)[number];
