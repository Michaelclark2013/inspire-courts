// Sport microsite content config. One file = four landing pages, each
// fully SEO-optimized. Add a new sport by appending to this array.

export type ProgramTile = {
  title: string;
  body: string;
  inquireSlug: "court-rental" | "training" | "party" | "league" | "tournament-host" | "membership";
  badge?: string;
};

export type SportConfig = {
  slug: "basketball" | "volleyball" | "pickleball" | "futsal";
  name: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    primaryCta: { label: string; slug: ProgramTile["inquireSlug"] };
    secondaryCta?: { label: string; slug: ProgramTile["inquireSlug"] };
  };
  // Numbers / proof points
  stats: Array<{ value: string; label: string }>;
  // The 4-6 program tiles below the hero
  programs: ProgramTile[];
  // FAQ accordion
  faqs: Array<{ q: string; a: string }>;
  // SEO long-tail body content
  pitch: string[];
};

export const SPORT_CONFIGS: SportConfig[] = [
  {
    slug: "basketball",
    name: "Basketball",
    tagline: "Where Phoenix basketball lives",
    metaTitle: "Basketball — Inspire Courts AZ · Gilbert's Premier Hoops Facility",
    metaDescription: "Basketball courts, leagues, camps, training, and tournaments at Arizona's premier multi-sport complex. AAU travel teams welcome.",
    hero: {
      eyebrow: "Basketball at Inspire Courts",
      headline: "Where Phoenix basketball plays.",
      body: "Climate-controlled hardwood, full game-day operations, and the deepest tournament calendar in the East Valley. Whether you're a 9-year-old shooting your first three or a varsity coach scouting an AAU squad, this is home.",
      primaryCta: { label: "Inquire about leagues", slug: "league" },
      secondaryCta: { label: "Train with our coaches", slug: "training" },
    },
    stats: [
      { value: "8", label: "Full-size courts" },
      { value: "180+", label: "Tournaments hosted" },
      { value: "1,200+", label: "Active athletes" },
      { value: "Mon-Sun", label: "Open 7 days" },
    ],
    programs: [
      { title: "AAU & travel teams", body: "Practice space, weekend tournaments, and exposure events for serious club programs.", inquireSlug: "court-rental", badge: "Most popular" },
      { title: "Adult leagues", body: "Recreational + competitive leagues, Mon-Thu evenings. Free agents welcome.", inquireSlug: "league" },
      { title: "Youth leagues", body: "K-8 boys and girls leagues each spring, summer, and fall.", inquireSlug: "league" },
      { title: "Skills training", body: "1-on-1 and small-group with vetted coaches. Shooting, ball-handling, footwork, IQ.", inquireSlug: "training" },
      { title: "Tournament hosting", body: "Up to 8 simultaneous courts, live scoreboard tech, on-site refs available.", inquireSlug: "tournament-host" },
      { title: "Camps & clinics", body: "Holiday camps, summer intensives, college-prep clinics with NCAA-experienced coaches.", inquireSlug: "training" },
    ],
    faqs: [
      { q: "Do you host AAU tournaments?", a: "Yes — every weekend in season. We currently host 30+ AAU events per year across boys' and girls' divisions, 2nd grade through 17U." },
      { q: "Can I rent a court for a private practice?", a: "Absolutely. Hourly, half-day, and recurring weekly bookings are all available. Most teams that use us regularly lock in a standing time slot. Inquire and we'll send you our team-rate sheet." },
      { q: "Do you have shot tracking / video?", a: "All courts have video capture. Highlight clips and full-game replay are available to private rentals and tournaments through our coach + team portals." },
      { q: "Are coaches available for private training?", a: "Yes. We have a roster of vetted coaches across every level — former college athletes, certified trainers, and current high school coaches. Tell us your athlete's age, level, and goals and we'll match you." },
    ],
    pitch: [
      "Inspire Courts AZ is the East Valley's premier basketball facility — eight full-size courts under one roof, climate-controlled, with a full game-day operations team. Our facility hosts AAU travel teams, recreational leagues, college showcases, and youth camps year-round.",
      "Whether you're a Gilbert parent looking for your kid's first league, a Phoenix-area travel coach hunting for practice space, or a tournament director planning a multi-day weekend event — start here. Tell us what you need and a real person will follow up within 30 minutes during business hours.",
    ],
  },
  {
    slug: "volleyball",
    name: "Volleyball",
    tagline: "Six rotation. All ages. All levels.",
    metaTitle: "Volleyball — Inspire Courts AZ · Gilbert Volleyball Club & Leagues",
    metaDescription: "Volleyball at Arizona's premier sports complex. Club teams, adult leagues, youth camps, private training, and tournament hosting in Gilbert.",
    hero: {
      eyebrow: "Volleyball at Inspire Courts",
      headline: "Six rotation. All ages. All levels.",
      body: "From rec-league spikers to club hopefuls, Inspire Courts is where the East Valley plays volleyball. Indoor courts with regulation-grade flooring, net systems for any age bracket, and coaches who've coached at every level.",
      primaryCta: { label: "Join a league", slug: "league" },
      secondaryCta: { label: "Private training", slug: "training" },
    },
    stats: [
      { value: "6", label: "Volleyball courts" },
      { value: "Co-ed", label: "Adult leagues" },
      { value: "10U-18U", label: "Club programs" },
      { value: "100s", label: "Athletes served" },
    ],
    programs: [
      { title: "Club volleyball", body: "Tryouts every fall. Travel teams 10U through 18U with an emphasis on player development.", inquireSlug: "training", badge: "Tryouts open" },
      { title: "Adult co-ed leagues", body: "Tuesday + Thursday nights. Recreational, intermediate, and competitive divisions.", inquireSlug: "league" },
      { title: "Camps & clinics", body: "Position camps, college-prep clinics, summer intensives. Local + visiting coaches.", inquireSlug: "training" },
      { title: "Court rental", body: "Practice space for outside teams, recreational pickup groups, or private events.", inquireSlug: "court-rental" },
      { title: "Tournament hosting", body: "Multi-court events, full ref staff, scoreboard tech for AVP-style brackets.", inquireSlug: "tournament-host" },
      { title: "Private training", body: "Setting, hitting, defense, mental game — match with the right coach.", inquireSlug: "training" },
    ],
    faqs: [
      { q: "Do you have tryouts for club teams?", a: "Yes — fall tryouts each year, with summer evaluation clinics for athletes new to club volleyball. Inquire to get on the tryout invite list." },
      { q: "Can adults play recreationally?", a: "Yes. Tuesday and Thursday night co-ed leagues are our most popular. All experience levels — from never-played to ex-college — have a division to fit." },
      { q: "Do you host tournaments?", a: "Yes — multi-court tournaments with full-staff support. Inquire for date availability and rate sheet." },
      { q: "Are nets adjustable for different age brackets?", a: "Every court has regulation-spec adjustable systems — 6'6\" through 8'." },
    ],
    pitch: [
      "Volleyball is one of the fastest-growing sports in Arizona, and Inspire Courts has built six dedicated indoor courts to keep up. Our club program develops athletes from the 10U beginner level through 18U regional-tournament travel teams, and our adult leagues are the most-requested co-ed nights in Gilbert.",
      "If you're a parent considering club volleyball for the first time, a coach looking for practice space, or an experienced player searching for a competitive adult league — start with an inquiry below. We'll match you with the right program.",
    ],
  },
  {
    slug: "pickleball",
    name: "Pickleball",
    tagline: "America's fastest-growing sport. Played indoors. Year-round.",
    metaTitle: "Pickleball — Inspire Courts AZ · Indoor Pickleball Gilbert",
    metaDescription: "Indoor pickleball year-round at Inspire Courts AZ. Open play, leagues, lessons, ladder play, and tournament hosting in Gilbert, Arizona.",
    hero: {
      eyebrow: "Pickleball at Inspire Courts",
      headline: "Indoor. Year-round. No 110° afternoons.",
      body: "Eight dedicated indoor pickleball courts. Open play sessions, ladder leagues, private lessons, tournament weekends. The desert summer doesn't shut down play here.",
      primaryCta: { label: "Join open play", slug: "membership" },
      secondaryCta: { label: "Take a lesson", slug: "training" },
    },
    stats: [
      { value: "8", label: "Indoor courts" },
      { value: "AC'd", label: "Year-round" },
      { value: "All", label: "Levels welcome" },
      { value: "Daily", label: "Open play" },
    ],
    programs: [
      { title: "Open play", body: "Drop-in sessions every day. Beginners 9-11am, intermediate 12-3pm, advanced 4-7pm.", inquireSlug: "membership", badge: "Most popular" },
      { title: "Ladder leagues", body: "8-week skill-grouped ladders. Move up the ranks, win prize money, get rated.", inquireSlug: "league" },
      { title: "Private lessons", body: "1-on-1 with PPR-certified coaches. Drills, strategy, dink work.", inquireSlug: "training" },
      { title: "Court rental", body: "Reserve a court privately for groups of 4-12. Friend groups, corporate events, parties.", inquireSlug: "court-rental" },
      { title: "Tournaments", body: "Monthly social tournaments + bigger sanctioned events twice a year.", inquireSlug: "tournament-host" },
      { title: "Beginner clinics", body: "New to pickleball? Free Saturday clinics for first-timers — paddles + balls provided.", inquireSlug: "training" },
    ],
    faqs: [
      { q: "Do I need to bring my own paddle?", a: "Loaner paddles are available at the front desk for first-timers. After that, most regulars buy their own — we have paddles for sale starting at $40." },
      { q: "What are the open play levels?", a: "We organize open play by skill: 2.0-2.5 mornings, 3.0-3.5 mid-day, 4.0+ evenings. The schedule is on the open play inquiry page or text the front desk." },
      { q: "Do you have leagues?", a: "Yes — 8-week ladder leagues run continuously. Skill-grouped, paid prizes for winners, and you'll get a rated DUPR result you can take elsewhere." },
      { q: "Can I host a corporate / birthday event?", a: "Absolutely. Pickleball is the most-requested party sport at Inspire Courts. Inquire on our parties page for package options." },
    ],
    pitch: [
      "Pickleball has exploded in Arizona, and outdoor courts in Gilbert turn into ovens by 11am for half the year. Inspire Courts solves both problems with eight dedicated indoor courts that play comfortably in July as well as January.",
      "We host structured ladder leagues for competitive players, daily open play for casual drop-ins, beginner clinics for new players, and private courts for groups. Whether you're 70 and just trying it for the first time or chasing a 5.0 DUPR rating, you have a place here.",
    ],
  },
  {
    slug: "futsal",
    name: "Futsal",
    tagline: "Indoor soccer at speed. Skill, touch, decisions.",
    metaTitle: "Futsal — Inspire Courts AZ · Indoor Soccer Gilbert",
    metaDescription: "Indoor futsal at Inspire Courts AZ. Adult leagues, youth academy, private training, and tournament hosting in Gilbert, Arizona.",
    hero: {
      eyebrow: "Futsal at Inspire Courts",
      headline: "Tighter spaces. Quicker decisions. Better players.",
      body: "Futsal is where the world's best soccer players are made. Smaller courts, weighted ball, no walls — every touch matters. Our facility runs the East Valley's most active futsal calendar.",
      primaryCta: { label: "Join a league", slug: "league" },
      secondaryCta: { label: "Train with us", slug: "training" },
    },
    stats: [
      { value: "4", label: "Futsal courts" },
      { value: "U6-Adult", label: "All ages" },
      { value: "Year-round", label: "Indoor play" },
      { value: "Multilingual", label: "Coaches" },
    ],
    programs: [
      { title: "Youth academy", body: "Skill-development program for ages 6-17. Twice-weekly training plus weekend match play.", inquireSlug: "training", badge: "Tryouts open" },
      { title: "Adult co-ed leagues", body: "Sunday + Wednesday nights. Recreational + competitive divisions.", inquireSlug: "league" },
      { title: "Tournament hosting", body: "Multi-day weekend tournaments with full match operations + scoring.", inquireSlug: "tournament-host" },
      { title: "Private training", body: "1-on-1 ball work with academy coaches. Touch, vision, finishing.", inquireSlug: "training" },
      { title: "Court rental", body: "Practice space for outside clubs, pickup groups, training sessions.", inquireSlug: "court-rental" },
      { title: "Birthday parties", body: "Coach-led match-style parties — most requested for ages 7-12.", inquireSlug: "party" },
    ],
    faqs: [
      { q: "How is futsal different from indoor soccer?", a: "Futsal is played on a hard court with a smaller, weighted ball, no walls, and 5v5 sides. The smaller space and faster ball forces tighter technique. It's where Brazilian, Spanish, and Argentine pro players develop their touch." },
      { q: "Are leagues open to all skill levels?", a: "Yes — we run rec, intermediate, and competitive divisions on Sundays and Wednesdays. Free agents always welcome; we'll place you on a roster." },
      { q: "What ages does the academy serve?", a: "U6 through U17, grouped by age and skill. Twice-weekly training plus weekend play. Tryout dates posted each spring + fall." },
      { q: "Do you offer private soccer training?", a: "Yes — academy coaches do 1-on-1 and small-group sessions for outside players who want focused ball work. Skill-up your touch, finishing, vision." },
    ],
    pitch: [
      "Futsal is the most underrated sport in Arizona youth athletics — and the one that produces the best technical soccer players. Inspire Courts AZ runs four dedicated futsal courts with the East Valley's most active match and training calendar.",
      "Whether your kid is six and just starting, your adult co-ed group is shopping for a Sunday-night league, or you're a tournament director scouting venues for a regional event — start with an inquiry below.",
    ],
  },
];

export function getSportConfig(slug: string): SportConfig | undefined {
  return SPORT_CONFIGS.find((c) => c.slug === slug);
}
