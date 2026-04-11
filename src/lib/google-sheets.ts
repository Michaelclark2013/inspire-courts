import crypto from "crypto";

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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    if (!res.ok) {
      console.error(`Sheet update failed (${spreadsheetId}): ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Sheet update error:", err);
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    if (!res.ok) {
      console.error(`Sheet append failed (${spreadsheetId}): ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Sheet append error:", err);
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
      console.error(`Drive folder create failed: ${createRes.status}`);
      return null;
    }

    const created = await createRes.json();
    return created.id;
  } catch (err) {
    console.error("Drive folder error:", err);
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
      console.error(`Drive doc create failed: ${createRes.status}`);
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
      console.error(`Doc content update failed: ${updateRes.status}`);
    }

    return doc.id;
  } catch (err) {
    console.error("Drive doc create error:", err);
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
