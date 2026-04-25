// Inquiry form schemas. Each "kind" defines the tailored fields shown
// in addition to the universal name/email/phone/message. The form
// component reads from this file so adding a new inquiry type is
// schema-only, no UI rewrite.

export type InquiryFieldType = "text" | "textarea" | "select" | "date" | "number" | "multiselect";

export type InquiryField = {
  key: string;
  label: string;
  type: InquiryFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helper?: string;
};

export type InquiryConfig = {
  kind: string;
  slug: string;            // /inquire/<slug>
  title: string;
  subtitle: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  // Hero copy
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    bullets: string[];
  };
  // What sports are relevant for this inquiry kind. Pre-fills the
  // sports field if the user came from a sport microsite.
  sports?: string[];
  // The custom fields shown on this form.
  fields: InquiryField[];
  // Auto SMS reply text. {firstName} is interpolated.
  smsReply: string;
};

const SPORTS_OPTIONS = ["Basketball", "Volleyball", "Pickleball", "Futsal", "Other"];

export const INQUIRY_CONFIGS: InquiryConfig[] = [
  {
    kind: "court_rental",
    slug: "court-rental",
    title: "Reserve a court",
    subtitle: "Practices, scrimmages, training sessions, league play.",
    metaTitle: "Court Rental — Inspire Courts AZ",
    metaDescription: "Reserve courts at Arizona's premier multi-sport facility. Inquire for hourly rentals, team practices, and tournament hosting.",
    hero: {
      eyebrow: "Court Rental",
      headline: "World-class courts. Tailored bookings.",
      body: "Tell us what you need and we'll get back within 30 minutes during business hours.",
      bullets: [
        "Hourly, half-day, full-day options",
        "Discount for recurring weekly bookings",
        "Free parking, locker rooms, scoreboards",
      ],
    },
    sports: SPORTS_OPTIONS,
    fields: [
      { key: "sports", label: "Sport", type: "multiselect", required: true, options: SPORTS_OPTIONS },
      { key: "groupSize", label: "Group size", type: "number", placeholder: "12", required: true },
      { key: "preferredDate", label: "Preferred date", type: "date" },
      { key: "preferredTime", label: "Preferred time", type: "select", options: ["Morning", "Afternoon", "Evening", "Late evening", "Flexible"] },
      { key: "frequency", label: "How often?", type: "select", options: ["One-time", "Weekly", "Multiple times per week", "Monthly"] },
      { key: "duration", label: "Hours per session", type: "number", placeholder: "2" },
    ],
    smsReply: "Hey {firstName}, thanks for reaching out to Inspire Courts about a court rental. A team member will text you within 30 minutes (M-F 8a-7p). — Inspire Courts AZ",
  },
  {
    kind: "training",
    slug: "training",
    title: "Private training",
    subtitle: "1-on-1 and small-group skill development with our coaches.",
    metaTitle: "Private Training — Inspire Courts AZ",
    metaDescription: "Book private skill-development sessions with vetted coaches across basketball, volleyball, pickleball, and futsal at Inspire Courts AZ.",
    hero: {
      eyebrow: "Private Training",
      headline: "Coaches who actually move the needle.",
      body: "Tell us your athlete's age, skill level, and goals — we'll match you with the right coach.",
      bullets: [
        "Vetted coaches across every sport",
        "1-on-1 or small-group (2-4 athletes)",
        "First session at a discount when you commit to a 5-pack",
      ],
    },
    sports: SPORTS_OPTIONS,
    fields: [
      { key: "sport", label: "Sport", type: "select", required: true, options: SPORTS_OPTIONS },
      { key: "athleteAge", label: "Athlete age", type: "number", placeholder: "14", required: true },
      { key: "skillLevel", label: "Skill level", type: "select", options: ["Beginner", "Intermediate", "Advanced", "Elite / club / varsity"] },
      { key: "focus", label: "What do they want to work on?", type: "textarea", placeholder: "Shooting form, ball-handling, conditioning, mental game…", required: true },
      { key: "frequency", label: "How often?", type: "select", options: ["Once to evaluate", "Weekly", "2-3x per week", "Off-season intensive"] },
    ],
    smsReply: "Hey {firstName}, thanks for your training inquiry — Coach Mike will text you within 30 minutes to match you with the right trainer. — Inspire Courts AZ",
  },
  {
    kind: "party",
    slug: "party",
    title: "Birthday party / group event",
    subtitle: "Birthday parties, team events, corporate outings, fundraisers.",
    metaTitle: "Birthday Parties & Group Events — Inspire Courts AZ",
    metaDescription: "Host a memorable birthday party or group event at Arizona's premier sports complex. Inquire for packages and availability.",
    hero: {
      eyebrow: "Parties & Group Events",
      headline: "The most memorable party in Gilbert.",
      body: "Tell us the date, age, and group size — we'll send back our package options + availability.",
      bullets: [
        "Private court time + party room included",
        "Coach-led activities for the whole age range",
        "Pizza, cake, decor add-ons available",
      ],
    },
    fields: [
      { key: "occasion", label: "What's the occasion?", type: "select", required: true, options: ["Birthday party", "Team end-of-season", "Corporate / team-building", "Fundraiser", "Other"] },
      { key: "groupSize", label: "Number of guests", type: "number", placeholder: "15", required: true },
      { key: "ageRange", label: "Age range", type: "text", placeholder: "8-10 yr olds", required: true },
      { key: "preferredDate", label: "Preferred date", type: "date" },
      { key: "preferredTime", label: "Preferred time", type: "select", options: ["Morning", "Afternoon", "Evening"] },
      { key: "sport", label: "Featured sport", type: "select", options: [...SPORTS_OPTIONS, "Mix of sports"] },
    ],
    smsReply: "Hey {firstName}, got your party inquiry! We'll text you within 30 minutes with package options + availability. — Inspire Courts AZ",
  },
  {
    kind: "league",
    slug: "league",
    title: "Join a league",
    subtitle: "Adult and youth leagues across all sports.",
    metaTitle: "Sports Leagues — Inspire Courts AZ",
    metaDescription: "Adult and youth recreational leagues in basketball, volleyball, pickleball, and futsal. Inquire to find the right league for you.",
    hero: {
      eyebrow: "Leagues",
      headline: "Find your league. Show up. Play.",
      body: "Adult, youth, co-ed, competitive, recreational — tell us what you're looking for and we'll match you with the right league.",
      bullets: [
        "Seasonal — sign up for a session, not a year",
        "All skill levels — from rec to competitive",
        "Stats + standings tracked all season",
      ],
    },
    sports: SPORTS_OPTIONS,
    fields: [
      { key: "sport", label: "Sport", type: "select", required: true, options: SPORTS_OPTIONS },
      { key: "ageBracket", label: "Age bracket", type: "select", required: true, options: ["Adult (18+)", "High School", "Middle School", "Elementary"] },
      { key: "competitiveness", label: "Competitiveness", type: "select", options: ["Recreational / casual", "Intermediate", "Competitive", "Elite / club"] },
      { key: "joinAs", label: "Join as", type: "select", options: ["Free agent", "Pre-formed team", "Looking to start a team"] },
    ],
    smsReply: "Hey {firstName}, got your league inquiry! A team member will text you within 30 minutes. — Inspire Courts AZ",
  },
  {
    kind: "tournament_host",
    slug: "tournament-host",
    title: "Host a tournament",
    subtitle: "Tournament directors — host your event at our facility.",
    metaTitle: "Host a Tournament — Inspire Courts AZ",
    metaDescription: "Tournament directors: host your basketball, volleyball, or other event at Arizona's premier multi-sport complex. Inquire for dates and rates.",
    hero: {
      eyebrow: "Tournament Hosting",
      headline: "Run your event. We'll run the building.",
      body: "Multi-court availability, on-site staff, scoreboard tech, food vendors. Tell us your dates and we'll lock in availability.",
      bullets: [
        "Up to 8 simultaneous courts",
        "Live-scoring tech + spectator scoreboard built-in",
        "On-site refs, scorekeepers, training available",
      ],
    },
    fields: [
      { key: "sport", label: "Sport", type: "select", required: true, options: SPORTS_OPTIONS },
      { key: "expectedTeams", label: "Expected number of teams", type: "number", placeholder: "32", required: true },
      { key: "preferredDates", label: "Preferred dates", type: "text", placeholder: "Memorial Day weekend 2026", required: true },
      { key: "duration", label: "Tournament length", type: "select", options: ["1 day", "2 days", "3 days", "Multi-weekend"] },
      { key: "courtsNeeded", label: "Courts needed", type: "number", placeholder: "6" },
      { key: "needsRefs", label: "Need refs / scorekeepers?", type: "select", options: ["Yes — full crew", "Partial — supplement ours", "No — bringing our own"] },
    ],
    smsReply: "Hey {firstName}, thanks for the tournament-hosting inquiry. Our tournament director will reach out within the hour. — Inspire Courts AZ",
  },
  {
    kind: "membership",
    slug: "membership",
    title: "Become a member",
    subtitle: "Unlimited access, drop-in passes, family plans.",
    metaTitle: "Membership — Inspire Courts AZ",
    metaDescription: "Unlimited multi-sport access for individuals, families, and teams. Inquire about membership options at Inspire Courts AZ.",
    hero: {
      eyebrow: "Membership",
      headline: "All the courts. All the sports.",
      body: "Tell us a bit about who'll be using the membership — we'll send back the right plan.",
      bullets: [
        "Unlimited open gym across all sports",
        "Member-only league + clinic discounts",
        "Family plans · individual plans · team plans",
      ],
    },
    sports: SPORTS_OPTIONS,
    fields: [
      { key: "memberType", label: "Plan type", type: "select", required: true, options: ["Individual", "Family", "Team / club", "Corporate / group"] },
      { key: "primarySport", label: "Primary sport", type: "select", options: SPORTS_OPTIONS },
      { key: "frequency", label: "Expected frequency", type: "select", options: ["A few times a month", "1-2x per week", "3+ times per week", "Daily"] },
      { key: "groupSize", label: "How many people on the plan?", type: "number", placeholder: "4" },
    ],
    smsReply: "Hey {firstName}, thanks for the membership inquiry! A team member will text you within 30 minutes with options. — Inspire Courts AZ",
  },
];

export function getInquiryConfig(slug: string): InquiryConfig | undefined {
  return INQUIRY_CONFIGS.find((c) => c.slug === slug);
}

export function getInquiryConfigByKind(kind: string): InquiryConfig | undefined {
  return INQUIRY_CONFIGS.find((c) => c.kind === kind);
}
