import crypto from "crypto";
import { logger } from "@/lib/logger";

// ── Google Service Account JWT Auth ──────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) return null;

  // Normalize escaped newlines (common in env vars)
  const privateKey = rawKey.replace(/\\n/g, "\n");

  // Reject placeholder / obviously-invalid keys before trying to use them
  if (
    privateKey.includes("YOUR_KEY_HERE") ||
    !privateKey.includes("BEGIN PRIVATE KEY")
  ) {
    return null;
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
    ].join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signingInput = `${headerB64}.${payloadB64}`;

  let signature: string;
  try {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signingInput);
    signature = sign.sign(privateKey, "base64url");
  } catch {
    // Invalid key format — not yet configured
    return null;
  }

  const jwt = `${signingInput}.${signature}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.error("Google auth failed", { status: res.status });
      return null;
    }

    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return data.access_token;
  } catch (err) {
    logger.error("Google auth error", { error: String(err) });
    return null;
  }
}

// ── Google Sheets API ─────────────────────────────────────────────────────────

/** Fetch raw 2D array of values from a sheet */
export async function fetchSheetData(
  spreadsheetId: string,
  range = "A:ZZ"
): Promise<string[][]> {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      next: { revalidate: 300 }, // 5-minute cache
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.error("Sheet fetch failed", { spreadsheetId, status: res.status });
      return [];
    }

    const data = await res.json();
    return (data.values as string[][]) || [];
  } catch (err) {
    logger.error("Sheet fetch error", { error: String(err) });
    return [];
  }
}

/** Fetch sheet data and return typed rows keyed by header */
export async function fetchSheetWithHeaders(
  spreadsheetId: string,
  range = "A:ZZ"
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const raw = await fetchSheetData(spreadsheetId, range);
  if (raw.length === 0) return { headers: [], rows: [] };

  const headers = raw[0].map((h) => h.trim());
  const rows = raw.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (row[i] ?? "").trim();
    });
    return obj;
  });

  return { headers, rows };
}

/** Get a value from a row by trying multiple possible column names */
export function getCol(
  row: Record<string, string>,
  ...keys: string[]
): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

export function isGoogleConfigured(): boolean {
  const key = process.env.GOOGLE_PRIVATE_KEY ?? "";
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    key &&
    !key.includes("YOUR_KEY_HERE") &&
    key.includes("BEGIN PRIVATE KEY")
  );
}

// ── Sheet IDs ─────────────────────────────────────────────────────────────────

export const SHEETS = {
  gameScores: "1djRRsPTqFccTjeZtd9MlJUUrTWLFCGqiIay-M9aJt1U",
  staffCheckOut: "1lzJreIHQm1-UpnJx17idGOun2wxlW379y3xQQhxeWVo",
  refCheckOut: "17LRniZAkihHY2jtWrmcWTwztSr7W_daflYQ_8Q2cRGs",
  cleaningReport: "1QlwbNfw-2XP0zq7fdcX1VCdU85n8Giy33P1B9f9IKwk",
  playerCheckIn: "1Ht-kbwp2myNH89QVXjF0YidHLwU0z1nrnzF6LVpxoP0",
  masterTeams: "18qzNu38vhGrwDcYeATg_N8UaUjoc-37xmwdvrsQIP3M",
  inspireClub2026: "1wBHxjhst1F71z9cOwAjyjEPfHSR1MwAH8miWVbOj46o",
  prospectPipeline: "1xL2mx8HJYUybhmctE7gXGD-4xktUhe4fsp9p9_qvCXg",
  azTeamsDB: "1qwpT8PHrG4ZXJzwFGOIl_LDcS_B-ibc9YG5miGAoABU",
  momMoney: "1_uPRO-PCiXUaTNOXrxGlti3eDJMedVrAj66b9rcyZiU",
} as const;

// ── Google Drive API ──────────────────────────────────────────────────────────

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  size?: string;
}

export const DRIVE_FOLDERS = {
  root: "14qiv0ravjnqrjZGBIfnb3R7WaXvOU4EV",
  responses: "1xFZx8-duZW5uPg6nU9syl54Xq31Z3ssT",
  waivers: "14qiv0ravjnqrjZGBIfnb3R7WaXvOU4EV", // Waivers folder — subfolders per event created inside
} as const;

export const MIME_LABELS: Record<string, string> = {
  "application/vnd.google-apps.folder": "Folder",
  "application/vnd.google-apps.spreadsheet": "Spreadsheet",
  "application/vnd.google-apps.document": "Document",
  "application/vnd.google-apps.presentation": "Slides",
  "application/vnd.google-apps.form": "Form",
  "image/jpeg": "Image",
  "image/png": "Image",
  "application/pdf": "PDF",
};

// ── Sheet Injection Protection ───────────────────────────────────────────────

/** Sanitize a value before writing to Google Sheets to prevent formula injection */
export function sanitizeSheetValue(value: string): string {
  if (!value) return value;
  // Prefix with single-quote if cell starts with a formula character
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Sanitize an entire row of values */
export function sanitizeSheetRow(row: string[]): string[] {
  return row.map(sanitizeSheetValue);
}

// ── Sheet Write Operations ───────────────────────────────────────────────────

/** Update a specific range in a sheet */
export async function updateSheetRow(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ values }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.error("Sheet update failed", { spreadsheetId, status: res.status });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Sheet update error", { error: String(err) });
    return false;
  }
}

/** Append rows to the end of a sheet */
export async function appendSheetRow(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({ values }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.error("Sheet append failed", { spreadsheetId, status: res.status });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Sheet append error", { error: String(err) });
    return false;
  }
}

// ── Google Drive API ──────────────────────────────────────────────────────────

/** Sanitize a string for use as a Drive folder name */
function sanitizeFolderName(name: string): string {
  // Remove characters that are problematic in Drive folder names
  return name.replace(/[/\\<>:"|?*\x00-\x1f]/g, "").slice(0, 200).trim() || "Unnamed";
}

/** Find a subfolder by name inside a parent folder, or create it */
export async function findOrCreateDriveFolder(
  parentFolderId: string,
  folderName: string
): Promise<string | null> {
  // Validate folder ID format
  if (!/^[a-zA-Z0-9_-]+$/.test(parentFolderId)) return null;

  const safeName = sanitizeFolderName(folderName);
  const token = await getAccessToken();
  if (!token) return null;

  try {
    // Search for existing folder
    const searchParams = new URLSearchParams({
      q: `'${parentFolderId}' in parents and name = '${safeName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id,name)",
      pageSize: "1",
    });

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?${searchParams}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files?.length > 0) return data.files[0].id;
    }

    // Create folder if not found
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: safeName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      }),
    });

    if (!createRes.ok) {
      logger.error("Drive folder create failed", { status: createRes.status });
      return null;
    }

    const created = await createRes.json();
    return created.id;
  } catch (err) {
    logger.error("Drive folder error", { error: String(err) });
    return null;
  }
}

/** Create a Google Doc in a specific Drive folder */
export async function createDriveDoc(
  folderId: string,
  title: string,
  content: string
): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    // Create a Google Doc
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId],
      }),
    });

    if (!createRes.ok) {
      logger.error("Drive doc create failed", { status: createRes.status });
      return null;
    }

    const doc = await createRes.json();

    // Update the doc content via Google Docs API
    const updateRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.id}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      logger.error("Doc content update failed", { status: updateRes.status });
    }

    return doc.id;
  } catch (err) {
    logger.error("Drive doc create error", { error: String(err) });
    return null;
  }
}

export async function listDriveFolder(folderId: string): Promise<DriveFile[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) return [];
  const token = await getAccessToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,modifiedTime,webViewLink,size)",
      orderBy: "folder,name",
      pageSize: "100",
    });

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      logger.error("Drive fetch failed", { status: res.status });
      return [];
    }

    const data = await res.json();
    return (data.files as DriveFile[]) || [];
  } catch (err) {
    logger.error("Drive fetch error", { error: String(err) });
    return [];
  }
}

// ── Save New Registration to Google Drive ─────────────────────────────────────

const ROLE_FOLDER_NAMES: Record<string, string> = {
  parent: "Parents",
  coach: "Coaches",
  staff: "Staff",
  ref: "Referees",
  admin: "Admins",
  front_desk: "Front Desk",
};

// ── Public API Key — Tournament Schedule Sheet ────────────────────────────────

const TOURNAMENT_SCHEDULE_SHEET_ID =
  process.env.GOOGLE_SHEETS_TOURNAMENT_ID ?? "1JTubujbJc3qELxWWdc0o1Jhmysa10ZRI";

export interface TournamentScheduleRow {
  [key: string]: string;
}

// Column layout for Tournaments tab (data starts at row 5, headers at row 4)
// A: Event ID, B: Tournament Name, C: Start Date, D: End Date, E: Age Groups,
// F: Gender, G: Entry Fee, H: Max Teams, I: Teams Registered, J: Spots Remaining,
// K: Status, L: Registration Link, M: Description, N: Location
const TOURNAMENT_COLUMNS = [
  "Event ID",
  "Tournament Name",
  "Start Date",
  "End Date",
  "Age Groups",
  "Gender",
  "Entry Fee",
  "Max Teams",
  "Teams Registered",
  "Spots Remaining",
  "Status",
  "Registration Link",
  "Description",
  "Location",
] as const;

export type TournamentColumn = (typeof TOURNAMENT_COLUMNS)[number];

export interface ParsedTournament {
  eventId: string;
  name: string;
  startDate: string;
  endDate: string;
  ageGroups: string[];
  gender: string;
  entryFee: string;
  maxTeams: number | null;
  teamsRegistered: number;
  spotsRemaining: number | null;
  status: string;
  registrationLink: string;
  description: string;
  location: string;
}

function parseTournamentRow(row: string[]): ParsedTournament {
  const get = (i: number) => (row[i] ?? "").trim();
  const ageRaw = get(4);
  return {
    eventId: get(0),
    name: get(1),
    startDate: get(2),
    endDate: get(3),
    ageGroups: ageRaw ? ageRaw.split(/[,/]/).map((s) => s.trim()).filter(Boolean) : [],
    gender: get(5),
    entryFee: get(6),
    maxTeams: get(7) ? Number(get(7)) || null : null,
    teamsRegistered: Number(get(8)) || 0,
    spotsRemaining: get(9) ? Number(get(9)) || null : null,
    status: get(10),
    registrationLink: get(11),
    description: get(12),
    location: get(13),
  };
}

/**
 * Fetch the public tournament schedule from Google Sheets using an API key.
 * Data starts at row 5 (rows 1-4 are title/metadata/headers).
 * Uses GOOGLE_SHEETS_API_KEY env var — suitable for publicly-shared sheets.
 */
export async function fetchTournamentSchedule(): Promise<{
  headers: string[];
  rows: TournamentScheduleRow[];
  tournaments: ParsedTournament[];
}> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) return { headers: [], rows: [], tournaments: [] };

  try {
    // Fetch A4:N500 — row 4 is the header row, rows 5+ are data
    const range = encodeURIComponent("A4:N500");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${TOURNAMENT_SCHEDULE_SHEET_ID}/values/${range}?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 }, // 5-minute cache
    });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.error("Tournament schedule sheet fetch failed", { status: res.status });
      return { headers: [], rows: [], tournaments: [] };
    }

    const data = await res.json();
    const raw: string[][] = data.values ?? [];
    if (raw.length === 0) return { headers: [], rows: [], tournaments: [] };

    // First fetched row is the header row (row 4 in sheet)
    const headers = raw[0].map((h) => h.trim());
    const dataRows = raw.slice(1); // rows 5+ in sheet

    const rows = dataRows.map((row) => {
      const obj: TournamentScheduleRow = {};
      TOURNAMENT_COLUMNS.forEach((col, i) => {
        obj[col] = (row[i] ?? "").trim();
      });
      return obj;
    });

    // Parse into typed objects, skip empty rows
    const tournaments = dataRows
      .filter((row) => row.some((cell) => cell.trim() !== ""))
      .filter((row) => (row[1] ?? "").trim() !== "") // must have a name
      .map(parseTournamentRow);

    return { headers, rows, tournaments };
  } catch (err) {
    logger.error("Tournament schedule fetch error", { error: String(err) });
    return { headers: [], rows: [], tournaments: [] };
  }
}

/** Convert a ParsedTournament into the EventData shape used by EventsHub */
export function tournamentToEventData(t: ParsedTournament): {
  name: string;
  date: string;
  rawDate: string;
  divisions: string[];
  fee: string;
  teams: number;
  maxTeams: number | null;
  status: string;
  brand: string;
  sport: string;
  bracketLink: string;
  regDeadline: string;
} {
  const dateLabel = t.startDate
    ? (() => {
        const d = new Date(t.startDate + "T12:00:00"); // noon to avoid TZ off-by-one
        return isNaN(d.getTime())
          ? t.startDate
          : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      })()
    : "TBD";

  const divisions = [...t.ageGroups];
  if (t.gender && t.gender.toLowerCase() !== "both" && t.gender.toLowerCase() !== "co-ed") {
    // Annotate divisions with gender if specified
    divisions.push(t.gender);
  }

  return {
    name: t.name,
    date: dateLabel,
    rawDate: t.startDate,
    divisions: divisions.length > 0 ? divisions : [],
    fee: t.entryFee,
    teams: t.teamsRegistered,
    maxTeams: t.maxTeams,
    status: t.status,
    brand: "OFF SZN HOOPS",
    sport: "Basketball",
    bracketLink: "",
    regDeadline: t.endDate
      ? (() => {
          const d = new Date(t.endDate + "T12:00:00");
          return isNaN(d.getTime())
            ? ""
            : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        })()
      : "",
  };
}

export async function saveRegistrationToDrive(
  name: string,
  email: string,
  role: string,
  phone?: string | null,
): Promise<void> {
  if (!isGoogleConfigured()) return;

  try {
    // Find or create "Account Registrations" folder inside root
    const regFolderId = await findOrCreateDriveFolder(
      DRIVE_FOLDERS.root,
      "Account Registrations",
    );
    if (!regFolderId) return;

    // Find or create role-specific subfolder
    const roleFolderName = ROLE_FOLDER_NAMES[role] || role;
    const roleFolderId = await findOrCreateDriveFolder(regFolderId, roleFolderName);
    if (!roleFolderId) return;

    // Create a Google Doc with the registration info
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
    const title = `${name} — ${email} (${dateStr})`;

    const content = [
      `ACCOUNT REGISTRATION`,
      `====================`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Role: ${roleFolderName}`,
      `Registered: ${now.toLocaleString("en-US", { timeZone: "America/Phoenix" })}`,
    ].join("\n");

    await createDriveDoc(roleFolderId, title, content);
  } catch (err) {
    // Never block registration on Drive failure
    logger.error("Drive registration save error", { error: String(err) });
  }
}
