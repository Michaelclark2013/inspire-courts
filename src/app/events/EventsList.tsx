import { SOCIAL_LINKS, FACILITY_EMAIL, FACILITY_ADDRESS, SITE_URL } from "@/lib/constants";
import {
  getUpcomingEvents,
  getPastEvents,
  getProperty,
  isNotionConfigured,
} from "@/lib/notion";
import {
  fetchTournamentSchedule,
  tournamentToEventData,
  isGoogleConfigured,
} from "@/lib/google-sheets";
import EventsHub, { type EventData, type PastEventData } from "./EventsHub";

const REGISTER_URL = "/tournaments";

export default async function EventsList() {
  let upcoming: EventData[] = [];
  let past: PastEventData[] = [];

  if (isNotionConfigured()) {
    const [upcomingEvents, pastEvents] = await Promise.all([
      getUpcomingEvents(),
      getPastEvents(),
    ]);

    upcoming = upcomingEvents.map((e: any) => {
      const divisions = getProperty(e, "Divisions") || "";
      const fee = getProperty(e, "Entry Fee") || "";
      const date = getProperty(e, "Event Date") || "";
      const teams = getProperty(e, "Team Count") || 0;
      const maxTeams = getProperty(e, "Max Teams") || "";
      const status = getProperty(e, "Status") || "";
      const brand = getProperty(e, "Brand") || "OFF SZN HOOPS";
      const sport = getProperty(e, "Sport") || "Basketball";
      const bracketLink = getProperty(e, "Bracket Link") || "";
      const regDeadline = getProperty(e, "Registration Deadline") || "";

      return {
        name: getProperty(e, "Tournament Name") || "Upcoming Event",
        date: date
          ? new Date(date).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
              day: "numeric",
            })
          : "TBD",
        rawDate: date || "",
        divisions: Array.isArray(divisions)
          ? divisions
          : divisions
            ? divisions
                .split(",")
                .map((d: string) => d.trim())
                .filter(Boolean)
            : [],
        fee: fee ? (typeof fee === "number" ? `$${fee}` : String(fee)) : "",
        teams: Number(teams) || 0,
        maxTeams: maxTeams ? Number(maxTeams) : null,
        status: String(status),
        brand: String(brand),
        sport: String(sport),
        bracketLink: String(bracketLink || ""),
        regDeadline: regDeadline
          ? new Date(regDeadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "",
      };
    });

    past = pastEvents.slice(0, 8).map((e: any) => {
      const date = getProperty(e, "Event Date") || "";
      const teams = getProperty(e, "Team Count") || 0;
      return {
        name: getProperty(e, "Tournament Name") || "Past Event",
        date: date
          ? new Date(date).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })
          : "",
        teams: Number(teams) || 0,
        brand: String(getProperty(e, "Brand") || ""),
      };
    });
  } else if (isGoogleConfigured() || process.env.GOOGLE_SHEETS_API_KEY) {
    // Fall back to Google Sheets tournament schedule
    const { tournaments } = await fetchTournamentSchedule();
    upcoming = tournaments
      .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
      .map(tournamentToEventData);
    past = tournaments
      .filter((t) => t.status === "Completed")
      .slice(0, 8)
      .map((t) => ({
        name: t.name,
        date: t.startDate
          ? (() => {
              const d = new Date(t.startDate + "T12:00:00");
              return isNaN(d.getTime())
                ? t.startDate
                : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            })()
          : "",
        teams: t.teamsRegistered,
        brand: "OFF SZN HOOPS",
      }));
  }

  // JSON-LD Event structured data for SEO — helps Google show rich event snippets
  const eventSchema = upcoming
    .filter((e) => e.rawDate)
    .map((e) => ({
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: e.name,
      startDate: e.rawDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Inspire Courts AZ",
        address: {
          "@type": "PostalAddress",
          streetAddress: "1090 N Fiesta Blvd, Ste 101 & 102",
          addressLocality: "Gilbert",
          addressRegion: "AZ",
          postalCode: "85233",
          addressCountry: "US",
        },
      },
      organizer: {
        "@type": "Organization",
        name: e.brand || "OFF SZN HOOPS",
        url: SITE_URL,
      },
      sport: e.sport || "Basketball",
      url: `${SITE_URL}/events`,
      ...(e.fee && {
        offers: {
          "@type": "Offer",
          price: e.fee.replace(/[^0-9.]/g, ""),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}${REGISTER_URL}`,
        },
      }),
      image: `${SITE_URL}/images/hero-bg.jpg`,
    }));

  return (
    <>
      {eventSchema.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      <EventsHub
        upcoming={upcoming}
        past={past}
        registerUrl={REGISTER_URL}
        facilityEmail={FACILITY_EMAIL}
        facilityAddress={FACILITY_ADDRESS.full}
        instagramHandle={SOCIAL_LINKS.instagramHandle}
        youtubeUrl={SOCIAL_LINKS.youtube}
        quickScoresUrl="https://quickscores.com/inspirecourts"
      />
    </>
  );
}
