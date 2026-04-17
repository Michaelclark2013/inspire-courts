import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const LOGOS_JSON = path.join(process.cwd(), "data", "team-logos.json");
const LOGOS_DIR = path.join(process.cwd(), "public", "images", "teams");
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXTS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readLogos(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(LOGOS_JSON, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeLogos(logos: Record<string, string>): Promise<void> {
  await fs.mkdir(path.dirname(LOGOS_JSON), { recursive: true });
  await fs.writeFile(LOGOS_JSON, JSON.stringify(logos, null, 2), "utf-8");
}

// GET /api/teams/logo — returns the full logos map, or ?teamName=X for one entry
export async function GET(request: NextRequest) {
  const logos = await readLogos();
  const teamName = request.nextUrl.searchParams.get("teamName");
  const cacheHeaders = { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" };
  if (teamName) {
    return NextResponse.json({ url: logos[teamName] || null }, { headers: cacheHeaders });
  }
  return NextResponse.json(logos, { headers: cacheHeaders });
}

// POST /api/teams/logo — upload a logo
// Admin-only or coach (for their own team)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ["admin", "staff", "coach", "front_desk"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const teamName = (formData.get("teamName") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  if (!teamName) return NextResponse.json({ error: "teamName is required" }, { status: 400 });
  if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPG, and WebP images are allowed" }, { status: 400 });
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 2 MB" }, { status: 400 });
  }

  const ext = ALLOWED_EXTS[file.type];
  const slug = slugify(teamName);
  const filename = `${slug}${ext}`;
  const filePath = path.join(LOGOS_DIR, filename);
  const publicUrl = `/images/teams/${filename}`;

  // Write file
  await fs.mkdir(LOGOS_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Update JSON map
  const logos = await readLogos();
  logos[teamName] = publicUrl;
  await writeLogos(logos);

  return NextResponse.json({ url: publicUrl, teamName });
}

// DELETE /api/teams/logo?teamName=X — remove a logo (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "staff"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamName = request.nextUrl.searchParams.get("teamName");
  if (!teamName) return NextResponse.json({ error: "teamName is required" }, { status: 400 });

  const logos = await readLogos();
  const existing = logos[teamName];

  if (existing) {
    // Remove the file
    try {
      const filePath = path.join(process.cwd(), "public", existing);
      await fs.unlink(filePath);
    } catch {
      // File might not exist; ignore
    }
    delete logos[teamName];
    await writeLogos(logos);
  }

  return NextResponse.json({ ok: true });
}
