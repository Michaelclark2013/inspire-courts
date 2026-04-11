import crypto from "crypto";

// ── Google Service Account JWT Auth ──────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) return null;

  // Normalize escaped newlines (common in env vars)
  const privateKey = rawKey.replace(/\\n/g, "\n");

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    scope: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
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

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${signingInput}.${signature}`;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!res.ok) {
      console.error("Google auth failed:", await res.text());
      return null;
    }

    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return data.access_token;
  } catch (err) {
    console.error("Google auth error:", err);
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }, // 5-minute cache
    });

    if (!res.ok) {
      console.error(`Sheet fetch failed (${spreadsheetId}): ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.values as string[][]) || [];
  } catch (err) {
    console.error("Sheet fetch error:", err);
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
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
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

export async function listDriveFolder(folderId: string): Promise<DriveFile[]> {
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
      console.error(`Drive fetch failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.files as DriveFile[]) || [];
  } catch (err) {
    console.error("Drive fetch error:", err);
    return [];
  }
}
