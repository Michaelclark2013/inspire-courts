import { Client } from "@notionhq/client";
import { logger } from "@/lib/logger";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database IDs (from the prompt)
export const DB = {
  coaches: "5135f91602c84971b7a7460aa8b8ddaa",
  players: "0694c7f66cba4171babcd1fcffc1d5e9",
  tournaments: "0e212f3ea7f845d582f44306c3d9ae5d",
  referees: "edae2aa1bc9b4648bba1252f85b8e942",
  staff: "c4f7866d4cad45b581af25a0ee4635e8",
  moneyLog: "0ec74a070a934f68a0a9c8f0d59e5ac8",
  sponsorships: "ad1e13708767476d8ac2a0ed01ee5b5f",
  playerCheckIn: "a9ade37afede4d299b43707e3f4f97b5",
  cleaningLog: "b63f6d95cfb745e580e48b6a10bad5e2",
  gameScores: "2d1eda2161874530b81b3bf0f076093c",
  staffShifts: "1b5e44b41acb41ddaa0b1396e355762f",
  refShifts: "d9287d85d2d44af196b9f18cc236c429",
  schools: "188d40a41a88467b9e9a256af6b3ba98",
  chatLeads: process.env.CHAT_LEADS_DB_ID || "",
} as const;

// Generic query function using fetch (compatible with all Notion SDK versions)
export async function queryDatabase(
  databaseId: string,
  filter?: object,
  sorts?: object[],
  pageSize = 100
) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) return [];

    const body: Record<string, unknown> = { page_size: pageSize };
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      logger.error("Notion query failed", { status: response.status, databaseId });
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    logger.error("Notion query exception", { databaseId, error: String(error) });
    return [];
  }
}

// Helper to extract property values from Notion pages
export function getProperty(page: any, name: string): any {
  const prop = page.properties?.[name];
  if (!prop) return null;

  switch (prop.type) {
    case "title":
      return prop.title?.map((t: any) => t.plain_text).join("") || "";
    case "rich_text":
      return prop.rich_text?.map((t: any) => t.plain_text).join("") || "";
    case "number":
      return prop.number;
    case "select":
      return prop.select?.name || null;
    case "multi_select":
      return prop.multi_select?.map((s: any) => s.name) || [];
    case "date":
      return prop.date?.start || null;
    case "checkbox":
      return prop.checkbox;
    case "email":
      return prop.email;
    case "phone_number":
      return prop.phone_number;
    case "url":
      return prop.url;
    case "status":
      return prop.status?.name || null;
    case "formula":
      return prop.formula?.string || prop.formula?.number || null;
    case "rollup":
      return prop.rollup?.number || null;
    case "relation":
      return prop.relation?.map((r: any) => r.id) || [];
    case "last_edited_time":
      return prop.last_edited_time;
    case "created_time":
      return prop.created_time;
    default:
      return null;
  }
}

// ── Public site queries ──

export async function getUpcomingEvents() {
  return queryDatabase(DB.tournaments, {
    or: [
      { property: "Status", select: { equals: "Registration Open" } },
      { property: "Status", select: { equals: "Planning" } },
      { property: "Status", select: { equals: "Registration Closed" } },
      { property: "Status", select: { equals: "In Progress" } },
    ],
  });
}

export async function getPastEvents() {
  return queryDatabase(DB.tournaments, {
    property: "Status",
    select: { equals: "Complete" },
  });
}

export async function getActiveSponsors() {
  return queryDatabase(DB.sponsorships, {
    property: "Status",
    status: { equals: "Active" },
  });
}

// ── Dashboard queries ──

export async function getAllTeams() {
  return queryDatabase(DB.coaches);
}

export async function getAllTournaments() {
  return queryDatabase(DB.tournaments);
}

export async function getMoneyLog() {
  return queryDatabase(DB.moneyLog);
}

export async function getAllStaff() {
  return queryDatabase(DB.staff);
}

export async function getAllReferees() {
  return queryDatabase(DB.referees);
}

export async function getAllSponsors() {
  return queryDatabase(DB.sponsorships);
}

export async function getAllSchools() {
  return queryDatabase(DB.schools);
}

export async function getGameScores() {
  return queryDatabase(DB.gameScores);
}

export async function getStaffShifts() {
  return queryDatabase(DB.staffShifts);
}

export async function getRefShifts() {
  return queryDatabase(DB.refShifts);
}

export async function getChatLeads() {
  if (!DB.chatLeads) return [];
  return queryDatabase(DB.chatLeads, undefined, [
    { property: "Created", direction: "descending" },
  ]);
}

export function isNotionConfigured(): boolean {
  return !!process.env.NOTION_API_KEY;
}

// ── Create a page in any Notion database ──

export async function createNotionPage(
  databaseId: string,
  properties: Record<string, unknown>
) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey || !databaseId) {
      logger.warn("Notion not configured, skipping page creation");
      return null;
    }

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      logger.error("Notion page creation failed", { status: response.status });
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error("Notion page creation error", { error: String(error) });
    return null;
  }
}

// ── Update an existing Notion page ──

export async function updateNotionPage(
  pageId: string,
  properties: Record<string, unknown>
) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey || !pageId) return null;

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      logger.error("Notion page update failed", { status: response.status, pageId });
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error("Notion page update error", { error: String(error) });
    return null;
  }
}

// ── Save a chat lead to Notion ──

export async function saveChatLead(data: {
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  urgency?: string;
  summary?: string;
  transcript?: string;
  source?: string;
}) {
  if (!DB.chatLeads) return null;

  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: data.name || "Unknown Visitor" } }] },
    Summary: { rich_text: [{ text: { content: (data.summary || "").slice(0, 2000) } }] },
    "Chat Transcript": { rich_text: [{ text: { content: (data.transcript || "").slice(0, 2000) } }] },
    Source: { select: { name: data.source || "Chat Widget" } },
    Status: { select: { name: "New" } },
  };

  if (data.email) properties.Email = { email: data.email };
  if (data.phone) properties.Phone = { phone_number: data.phone };
  if (data.interest) properties.Interest = { select: { name: data.interest } };
  if (data.urgency) properties.Urgency = { select: { name: data.urgency } };

  return createNotionPage(DB.chatLeads, properties);
}

// ── Contact form submission ──

export async function createContactSubmission(data: {
  name: string;
  email: string;
  phone?: string;
  inquiryType: string;
  message: string;
}) {
  // Save to chat leads DB with Source="Contact Form"
  const interestMap: Record<string, string> = {
    "Tournament Registration": "Tournament",
    "Club Interest - Player": "Club",
    "Club Interest - Coach": "Club",
    "Facility Rental": "Rental",
    "Sponsorship Inquiry": "General",
    "Referee Application": "General",
    "General Question": "General",
    Other: "General",
  };

  return saveChatLead({
    name: data.name,
    email: data.email,
    phone: data.phone,
    interest: interestMap[data.inquiryType] || "General",
    urgency: "Warm",
    summary: `${data.inquiryType}: ${data.message.slice(0, 200)}`,
    source: "Contact Form",
  });
}
