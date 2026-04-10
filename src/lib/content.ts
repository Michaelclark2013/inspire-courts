import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const CONTENT_FILE = path.join(process.cwd(), "content.json");

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
            headline: { label: "Headline", value: "Arizona's Premier Indoor Basketball Facility", type: "text" },
            subheadline: { label: "Subheadline", value: "2 courts. Live scoreboards. Game film every game. Zero excuses.", type: "text" },
            ctaPrimary: { label: "Primary Button", value: "Register for Next Event", type: "text" },
            ctaSecondary: { label: "Secondary Button", value: "Book the Facility", type: "text" },
            backgroundImage: { label: "Background Image URL", value: "https://cdn4.sportngin.com/attachments/background_graphic/5768/6045/background.jpg", type: "image" },
          },
        },
        {
          name: "Event Bar",
          fields: {
            text: { label: "Event Text", value: "Next Event: OFF SZN Session 1 — May 2025", type: "text" },
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
              { title: "Pro-Level Setup", description: "College-quality courts, scoreboards, and game film — not a rec gym." },
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
              { title: "2 Indoor Courts", description: "Regulation hardwood floors, professional dimensions, adjustable hoops for all age groups." },
              { title: "Live Scoreboards", description: "Digital scoreboards visible from every seat. Real-time scores, period tracking, shot clocks." },
              { title: "Game Film", description: "Every game filmed, every play captured. Teams get footage to review and improve." },
              { title: "Stats & Analytics", description: "Real-time stats tracking for every game. Points, rebounds, assists — all on record." },
              { title: "Snack Bar", description: "Drinks, snacks, and game-day fuel available all day. No outside food or beverages permitted." },
            ],
          },
        },
        {
          name: "Mission Section",
          fields: {
            headline: { label: "Headline", value: "Two Brands. One Mission.", type: "text" },
            description: { label: "Description", value: "Inspire Courts is the home base. OFF SZN HOOPS is the tournament series. Together, we're elevating youth basketball in Arizona.", type: "textarea" },
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
            stat4Value: { label: "Stat 4 Value", value: "100%", type: "text" },
            stat4Label: { label: "Stat 4 Label", value: "Game Film Coverage", type: "text" },
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
            description: { label: "Description", value: "Founded to give Arizona's youth basketball players a professional-level experience. No more dusty rec centers. No more outdoor courts in 115-degree heat.", type: "textarea" },
          },
        },
        {
          name: "Origin",
          fields: {
            eyebrow: { label: "Eyebrow", value: "Why We Exist", type: "text" },
            headline: { label: "Headline", value: "Built for Competitors", type: "text" },
            paragraph1: { label: "Paragraph 1", value: "Inspire Courts is climate-controlled, professionally equipped, and built for competitors. Two regulation indoor courts with live digital scoreboards, game film for every game, and a setup that rivals college-level facilities.", type: "textarea" },
            paragraph2: { label: "Paragraph 2", value: "We saw what youth basketball looked like in Arizona — rec gyms with broken rims, outdoor tournaments in 115-degree heat, and zero game footage. We built the opposite.", type: "textarea" },
            paragraph3: { label: "Paragraph 3", value: "Every team that walks through our doors gets the same experience: professional courts, real scoreboards, and film they can use to get better. That's the standard.", type: "textarea" },
            mission: { label: "Mission Statement", value: "Elevate youth basketball in Arizona — one court, one game, one player at a time.", type: "text" },
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
            description: { label: "Description", value: "Youth basketball tournaments in Gilbert, AZ. 10U through 17U divisions, boys and girls. 3+ game guarantee, game film, live scoreboards.", type: "textarea" },
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
              { name: "OFF SZN Session 1", date: "May 2025", fee: "$400", divisions: "10U,11U,12U,13U,14U,15U,17U", spotsLeft: "8", maxTeams: "24" },
              { name: "Hoopalooza Heroes", date: "June 2025", fee: "$400", divisions: "10U,12U,14U,17U", spotsLeft: "12", maxTeams: "20" },
              { name: "Memorial Day Heroes", date: "May 2025", fee: "$450", divisions: "11U,12U,13U,14U,15U,17U", spotsLeft: "5", maxTeams: "24" },
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
            description: { label: "Description", value: "A premium indoor basketball facility built from the ground up for serious competition. Every detail is intentional.", type: "textarea" },
          },
        },
        {
          name: "Features",
          fields: {},
          list: {
            label: "Features",
            itemFields: ["eyebrow", "title", "description"],
            items: [
              { eyebrow: "Courts", title: "2 Regulation Indoor Courts", description: "Professional-grade hardwood flooring, regulation dimensions, and adjustable hoops for all age groups. Built for real competition." },
              { eyebrow: "Technology", title: "Digital Scoreboards & Game Film", description: "Live digital scoreboards visible from every angle. Game film captured for every game." },
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
              { title: "Game Film", description: "Full-game recordings of every game at Inspire Courts. Multi-angle coverage, clean audio, delivered within 48 hours." },
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
            admission: { label: "Admission", value: "$15 at the door. Kids under 5 are free. Cash and card accepted.", type: "text" },
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
            email: { label: "Email", value: "mikeyclark.240@gmail.com", type: "text" },
            address: { label: "Address", value: "1090 N Fiesta Blvd, Ste 101 & 102", type: "text" },
            city: { label: "City", value: "Gilbert, AZ 85233", type: "text" },
            instagram: { label: "Instagram", value: "@inspirecourtsaz", type: "text" },
          },
        },
      ],
    },
  },
};

export function getContent(): SiteContent {
  try {
    if (existsSync(CONTENT_FILE)) {
      const raw = readFileSync(CONTENT_FILE, "utf-8");
      const saved = JSON.parse(raw);
      // Merge saved content with defaults to pick up new pages/sections
      if (saved.pages) {
        return saved as SiteContent;
      }
      // Legacy format — return defaults
      return DEFAULT_CONTENT;
    }
  } catch (e) {
    console.error("Failed to read content file:", e);
  }
  return DEFAULT_CONTENT;
}

export function saveContent(content: SiteContent): void {
  writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2), "utf-8");
}
