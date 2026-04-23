import { FACILITY_EMAIL } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";

// Each page section can have text fields, images, and list items
export interface ContentField {
  label: string;
  value: string;
  type: "text" | "textarea" | "image";
}

export interface ContentListItem {
  [key: string]: string;
}

export interface ContentSection {
  name: string;
  fields: { [key: string]: ContentField };
  list?: {
    label: string;
    itemFields: string[]; // field names for each list item
    items: ContentListItem[];
  };
}

export interface PageContent {
  label: string;
  sections: ContentSection[];
}

export interface SiteContent {
  pages: { [pageId: string]: PageContent };
}

const DEFAULT_CONTENT: SiteContent = {
  pages: {
    home: {
      label: "Home",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge Text", value: "Est. Gilbert, AZ", type: "text" },
            headline: { label: "Headline", value: "Arizona's Premier Basketball & Volleyball Facility", type: "text" },
            subheadline: { label: "Subheadline", value: "7 courts. 52,000 sq ft. Basketball & volleyball. Built for competitors.", type: "text" },
            ctaPrimary: { label: "Primary Button", value: "Register for Next Event", type: "text" },
            ctaSecondary: { label: "Secondary Button", value: "Book the Facility", type: "text" },
            backgroundImage: { label: "Background Image URL", value: "/images/courts-bg.jpg", type: "image" },
          },
        },
        {
          name: "Event Bar",
          fields: {
            text: { label: "Event Text", value: "OFF SZN HOOPS — Tournaments Running Year-Round", type: "text" },
            buttonText: { label: "Button Text", value: "Register Now", type: "text" },
          },
        },
        {
          name: "Value Props",
          fields: {},
          list: {
            label: "Value Propositions",
            itemFields: ["title", "description"],
            items: [
              { title: "Pro-Level Setup", description: "College-quality courts and a pro-level environment — not a rec gym." },
              { title: "Year-Round Action", description: "Tournaments, leagues, and open runs every month. Never an off season." },
              { title: "Real Competition", description: "500+ teams hosted. The best youth players in Arizona compete here." },
            ],
          },
        },
        {
          name: "Facility Features",
          fields: {
            eyebrow: { label: "Eyebrow", value: "The Facility", type: "text" },
            headline: { label: "Headline", value: "Built for Competitors", type: "text" },
            description: { label: "Description", value: "Professional-grade courts, technology, and amenities designed for serious athletes.", type: "text" },
          },
          list: {
            label: "Features",
            itemFields: ["title", "description"],
            items: [
              { title: "7 Indoor Courts", description: "Regulation hardwood floors, professional dimensions, adjustable hoops for all age groups." },
              { title: "Climate Controlled", description: "Fully air-conditioned, 52,000 sq ft facility. No Arizona heat — play in comfort year-round." },
              { title: "Game Film", description: "Professional game film available as a paid add-on at tournaments. Review footage and improve." },
              { title: "Snack Bar", description: "Drinks, snacks, and game-day fuel available all day. No outside food or beverages permitted." },
            ],
          },
        },
        {
          name: "Mission Section",
          fields: {
            headline: { label: "Headline", value: "Two Brands. One Mission.", type: "text" },
            description: { label: "Description", value: "Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth sports in Arizona.", type: "textarea" },
            buttonText: { label: "Button Text", value: "Our Story", type: "text" },
          },
        },
        {
          name: "Stats",
          fields: {
            stat1Value: { label: "Stat 1 Value", value: "500+", type: "text" },
            stat1Label: { label: "Stat 1 Label", value: "Teams Hosted", type: "text" },
            stat2Value: { label: "Stat 2 Value", value: "30+", type: "text" },
            stat2Label: { label: "Stat 2 Label", value: "Tournaments", type: "text" },
            stat3Value: { label: "Stat 3 Value", value: "5,000+", type: "text" },
            stat3Label: { label: "Stat 3 Label", value: "Players", type: "text" },
            stat4Value: { label: "Stat 4 Value", value: "52K", type: "text" },
            stat4Label: { label: "Stat 4 Label", value: "Sq Ft Facility", type: "text" },
          },
        },
        {
          name: "Location",
          fields: {
            headline: { label: "Headline", value: "Come See It Live", type: "text" },
            address: { label: "Address", value: "1090 N Fiesta Blvd, Ste 101 & 102", type: "text" },
            city: { label: "City", value: "Gilbert, AZ 85233", type: "text" },
            description: { label: "Description", value: "Follow us on Instagram for game highlights, tournament recaps, and behind-the-scenes content.", type: "textarea" },
          },
        },
        {
          name: "Final CTA",
          fields: {
            headline: { label: "Headline", value: "Ready to Compete?", type: "text" },
            description: { label: "Description", value: "Register your team for the next OFF SZN HOOPS tournament. Spots fill fast.", type: "text" },
            ctaPrimary: { label: "Primary Button", value: "Register Now", type: "text" },
            ctaSecondary: { label: "Secondary Button", value: "Contact Us", type: "text" },
          },
        },
      ],
    },
    about: {
      label: "About",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Our Story", type: "text" },
            headline: { label: "Headline", value: "The Story", type: "text" },
            description: { label: "Description", value: "Founded to give Arizona's youth athletes a professional-level experience. Basketball. Volleyball. No more dusty rec centers. No more outdoor courts in 115-degree heat.", type: "textarea" },
          },
        },
        {
          name: "Origin",
          fields: {
            eyebrow: { label: "Eyebrow", value: "Why We Exist", type: "text" },
            headline: { label: "Headline", value: "Built for Competitors", type: "text" },
            paragraph1: { label: "Paragraph 1", value: "Inspire Courts is climate-controlled, professionally equipped, and built for competitors. 7 regulation indoor courts for basketball and volleyball, with game film available at tournaments and a setup that rivals college-level facilities.", type: "textarea" },
            paragraph2: { label: "Paragraph 2", value: "We saw what youth sports looked like in Arizona — rec gyms with broken rims, outdoor tournaments in 115-degree heat, and zero game footage. We built the opposite.", type: "textarea" },
            paragraph3: { label: "Paragraph 3", value: "Every team that walks through our doors gets the same experience: professional courts and a setup built to help them get better. That's the standard.", type: "textarea" },
            mission: { label: "Mission Statement", value: "Elevate youth basketball and volleyball in Arizona — one court, one game, one player at a time.", type: "text" },
          },
        },
      ],
    },
    events: {
      label: "Events",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Compete. Get Ranked. Get Seen.", type: "text" },
            headline: { label: "Headline", value: "Events & Register", type: "text" },
            description: { label: "Description", value: "Youth basketball tournaments in Gilbert, AZ. 10U through 17U divisions, boys and girls. 3+ game guarantee, game film available.", type: "textarea" },
          },
        },
        {
          name: "Events",
          fields: {
            eyebrow: { label: "Section Eyebrow", value: "Upcoming", type: "text" },
            headline: { label: "Section Headline", value: "Upcoming Events", type: "text" },
          },
          list: {
            label: "Events",
            itemFields: ["name", "date", "fee", "divisions", "spotsLeft", "maxTeams"],
            items: [
              { name: "OFF SZN Session 1", date: "Coming Soon", fee: "$350", divisions: "10U,11U,12U,13U,14U,15U,17U", spotsLeft: "—", maxTeams: "24" },
              { name: "Hoopalooza Heroes", date: "Coming Soon", fee: "$400", divisions: "10U,12U,14U,17U", spotsLeft: "—", maxTeams: "20" },
              { name: "Memorial Day Heroes", date: "Coming Soon", fee: "$450", divisions: "11U,12U,13U,14U,15U,17U", spotsLeft: "—", maxTeams: "24" },
            ],
          },
        },
      ],
    },
    facility: {
      label: "Facility",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "The Complex", type: "text" },
            headline: { label: "Headline", value: "The Facility", type: "text" },
            description: { label: "Description", value: "A premium indoor basketball & volleyball facility built from the ground up for serious competition. Every detail is intentional.", type: "textarea" },
          },
        },
        {
          name: "Features",
          fields: {},
          list: {
            label: "Features",
            itemFields: ["eyebrow", "title", "description"],
            items: [
              { eyebrow: "Courts", title: "7 Regulation Indoor Courts", description: "Professional-grade hardwood flooring, regulation dimensions, and adjustable hoops for all age groups. Built for real competition." },
              { eyebrow: "Technology", title: "Game Film Available", description: "Professional game film available as a paid service at tournaments. Teams can purchase footage to review, improve, and build recruiting portfolios." },
              { eyebrow: "Concessions", title: "Snack Bar & Game-Day Fuel", description: "Drinks, snacks, and meals available all day. No outside food or beverages permitted." },
              { eyebrow: "Climate", title: "Fully Air-Conditioned", description: "No Arizona heat, no excuses. Fully climate-controlled year-round." },
            ],
          },
        },
        {
          name: "Rental CTA",
          fields: {
            headline: { label: "Headline", value: "Book the Facility", type: "text" },
            description: { label: "Description", value: "Host your league, practice, or private event at Inspire Courts. Available for leagues, team practices, private tournaments, camps, clinics, and corporate events.", type: "textarea" },
            buttonText: { label: "Button Text", value: "Request a Quote", type: "text" },
          },
        },
      ],
    },
    prep: {
      label: "Inspire Prep",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Prep School", type: "text" },
            headline: { label: "Headline", value: "Inspire Prep", type: "text" },
            description: { label: "Description", value: "Elite basketball development meets academic excellence. Train, compete, and prepare for the next level — all under one roof.", type: "textarea" },
          },
        },
        {
          name: "Program",
          fields: {
            headline: { label: "Headline", value: "More Than Basketball", type: "text" },
            paragraph1: { label: "Paragraph 1", value: "Inspire Prep is a basketball-focused prep program based out of Inspire Courts in Gilbert, AZ. We combine elite-level training and competition with structured academics.", type: "textarea" },
            paragraph2: { label: "Paragraph 2", value: "Our players train daily at a professional facility, compete in top-tier tournaments and showcases, and receive the academic support they need to succeed.", type: "textarea" },
          },
        },
      ],
    },
    teams: {
      label: "Team Inspire",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Club Basketball", type: "text" },
            headline: { label: "Headline", value: "Team Inspire", type: "text" },
            description: { label: "Description", value: "Competitive club basketball for youth players who want to get better, compete harder, and be part of something bigger.", type: "textarea" },
          },
        },
        {
          name: "Age Groups",
          fields: {
            headline: { label: "Headline", value: "Age Groups Available", type: "text" },
          },
          list: {
            label: "Divisions",
            itemFields: ["division", "gender"],
            items: [
              { division: "10U", gender: "Boys & Girls" },
              { division: "11U", gender: "Boys & Girls" },
              { division: "12U", gender: "Boys & Girls" },
              { division: "13U", gender: "Boys & Girls" },
              { division: "14U", gender: "Boys & Girls" },
              { division: "15U", gender: "Boys" },
              { division: "17U", gender: "Boys" },
            ],
          },
        },
      ],
    },
    training: {
      label: "Training",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Get Better", type: "text" },
            headline: { label: "Headline", value: "Private Training", type: "text" },
            description: { label: "Description", value: "1-on-1 and small group basketball training at a pro-level facility. Every session is designed to make you better.", type: "textarea" },
          },
        },
        {
          name: "Training Options",
          fields: {},
          list: {
            label: "Options",
            itemFields: ["title", "description", "features"],
            items: [
              { title: "1-on-1 Training", description: "Fully personalized sessions tailored to your player's strengths, weaknesses, and goals.", features: "Custom workout plan, Film review included, Flexible scheduling" },
              { title: "Small Group (2-4)", description: "Train with a small group for competitive drills and game-like situations.", features: "2-4 players per session, Competitive drills, Position-specific work" },
              { title: "Shooting Sessions", description: "Dedicated shooting workouts focused on form, footwork, consistency, and game-speed shooting.", features: "Form correction, Game-speed reps, Catch & shoot / off-dribble" },
            ],
          },
        },
      ],
    },
    media: {
      label: "Media",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "@AZFinestMixtape", type: "text" },
            headline: { label: "Headline", value: "Media Services", type: "text" },
            description: { label: "Description", value: "Professional basketball media — game film, highlights, mixtapes, and content that gets your player seen.", type: "textarea" },
          },
        },
        {
          name: "Services",
          fields: {},
          list: {
            label: "Media Services",
            itemFields: ["title", "description"],
            items: [
              { title: "Game Film", description: "Full-game recordings available at tournaments. Multi-angle coverage, clean audio, delivered within 48 hours. Paid service." },
              { title: "Highlight Reels", description: "Custom highlight packages for individual players. Perfect for recruiting profiles and social media." },
              { title: "Event Photography", description: "Professional game-day photography for tournaments and events." },
              { title: "Mixtapes", description: "Full mixtape edits with music, effects, and professional post-production." },
              { title: "Social Media Content", description: "Short-form content optimized for Instagram, TikTok, and YouTube." },
              { title: "Player Profiles", description: "Interview-style player profile videos with stats and highlights." },
            ],
          },
        },
      ],
    },
    schedule: {
      label: "Schedule",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Game Time", type: "text" },
            headline: { label: "Headline", value: "Schedules & Brackets", type: "text" },
            description: { label: "Description", value: "Find your game times, court assignments, and bracket placements.", type: "text" },
          },
        },
        {
          name: "Notice",
          fields: {
            headline: { label: "Headline", value: "Schedules Drop 48 Hours Before Tip-Off", type: "text" },
            description: { label: "Description", value: "Schedules are released 48 hours before the event and sent directly to the head coach on file via email.", type: "textarea" },
          },
        },
      ],
    },
    gameday: {
      label: "Game Day",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Be Ready", type: "text" },
            headline: { label: "Headline", value: "Game Day Info", type: "text" },
            description: { label: "Description", value: "Everything you need to know before you walk through the doors.", type: "text" },
          },
        },
        {
          name: "Info",
          fields: {
            location: { label: "Location", value: "1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233", type: "text" },
            admission: { label: "Admission", value: "Admission at the door — cash and card accepted. Kids under 5 free.", type: "text" },
            checkin: { label: "Check-In", value: "Head coaches check in at the front table with a valid ID.", type: "text" },
            schedule: { label: "Schedule", value: "Schedules drop 48 hours before tip-off.", type: "text" },
            food: { label: "Food", value: "Snack bar is open all day. No outside food or beverages permitted.", type: "text" },
            houseRules: { label: "House Rules", value: "No hanging on rims. No profanity. Coaches are responsible for their bench and fans.", type: "textarea" },
          },
        },
      ],
    },
    gallery: {
      label: "Gallery",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "See It Live", type: "text" },
            headline: { label: "Headline", value: "Gallery", type: "text" },
            description: { label: "Description", value: "Game action, facility shots, and tournament highlights.", type: "text" },
          },
        },
        {
          name: "Instagram CTA",
          fields: {
            headline: { label: "Headline", value: "Want your highlights featured?", type: "text" },
            description: { label: "Description", value: "Follow @azfinestmixtape and tag us in your best plays.", type: "text" },
          },
        },
      ],
    },
    contact: {
      label: "Contact",
      sections: [
        {
          name: "Hero",
          fields: {
            badge: { label: "Badge", value: "Get in Touch", type: "text" },
            headline: { label: "Headline", value: "Contact", type: "text" },
            description: { label: "Description", value: "Questions about events, rentals, or anything else? We'll get back to you fast.", type: "text" },
          },
        },
        {
          name: "Info",
          fields: {
            email: { label: "Email", value: FACILITY_EMAIL, type: "text" },
            address: { label: "Address", value: "1090 N Fiesta Blvd, Ste 101 & 102", type: "text" },
            city: { label: "City", value: "Gilbert, AZ 85233", type: "text" },
            instagram: { label: "Instagram", value: "@inspirecourts", type: "text" },
          },
        },
      ],
    },
  },
};

/**
 * Re-export the defaults so tests / seeds can reference the canonical
 * page shape without having to import the file path directly.
 */
export function getDefaultContent(): SiteContent {
  return DEFAULT_CONTENT;
}

/**
 * Load the site content from the database. Falls back to the
 * hard-coded DEFAULT_CONTENT on read failure or when a page has no
 * row yet — so first-time deploys render with the defaults until an
 * admin edits a page.
 *
 * Why DB-backed? The previous implementation persisted to a
 * local content.json via fs.writeFileSync. That silently no-ops on
 * Vercel's read-only serverless filesystem, meaning every admin save
 * in production was dropped on the floor. Storing per-page blobs in
 * SQLite (Turso) makes saves durable across requests + deploys.
 */
export async function getContent(): Promise<SiteContent> {
  try {
    const rows = await db
      .select({ pageId: siteContent.pageId, contentJson: siteContent.contentJson })
      .from(siteContent);
    if (rows.length === 0) {
      return DEFAULT_CONTENT;
    }
    // Start from defaults so pages the admin hasn't touched still
    // render; overlay DB rows on top.
    const merged: SiteContent = {
      pages: { ...DEFAULT_CONTENT.pages },
    };
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.contentJson) as PageContent;
        merged.pages[row.pageId] = parsed;
      } catch (err) {
        logger.warn("site_content row has invalid JSON, falling back to default", {
          pageId: row.pageId,
          error: String(err),
        });
      }
    }
    return merged;
  } catch (err) {
    logger.error("Failed to read site_content", { error: String(err) });
    return DEFAULT_CONTENT;
  }
}

/**
 * Persist the site content blob. Upserts one row per page so the
 * editor can save a single page without racing the others. `updatedBy`
 * is optional (non-request call sites like migrations may omit it).
 */
export async function saveContent(
  content: SiteContent,
  updatedBy?: number | null
): Promise<void> {
  const nowIso = new Date().toISOString();
  for (const [pageId, page] of Object.entries(content.pages)) {
    await db
      .insert(siteContent)
      .values({
        pageId,
        contentJson: JSON.stringify(page),
        label: page.label,
        updatedAt: nowIso,
        updatedBy: updatedBy ?? null,
      })
      .onConflictDoUpdate({
        target: siteContent.pageId,
        set: {
          contentJson: JSON.stringify(page),
          label: page.label,
          updatedAt: nowIso,
          updatedBy: updatedBy ?? null,
        },
      });
  }
}

// ── Helper functions for page content access ──

export async function getPageContent(pageId: string): Promise<PageContent | undefined> {
  const content = await getContent();
  return content.pages[pageId];
}

export function getField(page: PageContent, sectionName: string, fieldKey: string): string {
  const section = page.sections.find((s) => s.name === sectionName);
  return section?.fields[fieldKey]?.value ?? "";
}

export function getList(page: PageContent, sectionName: string): ContentListItem[] {
  const section = page.sections.find((s) => s.name === sectionName);
  return section?.list?.items ?? [];
}
