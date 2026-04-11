import { SOCIAL_LINKS, FACILITY_EMAIL, FACILITY_ADDRESS } from "@/lib/constants";
import {
  getUpcomingEvents,
  getPastEvents,
  getProperty,
} from "@/lib/notion";
import EventsHub, { type EventData, type PastEventData } from "./EventsHub";

const REGISTER_URL = "/tournaments";

export default async function EventsList() {
  const [upcomingEvents, pastEvents] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  const upcoming: EventData[] = upcomingEvents.map((e: any) => {
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

  const past: PastEventData[] = pastEvents.slice(0, 8).map((e: any) => {
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

  return (
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
  );
}
