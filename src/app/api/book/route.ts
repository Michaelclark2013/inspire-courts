import { NextResponse } from "next/server";
import { saveChatLead } from "@/lib/notion";
import { sendLeadEmail } from "@/lib/notify";
import { bookSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

/** Escape HTML special characters to prevent XSS in downstream systems. */
function sanitize(value: string | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  // Rate limit: 5 requests per minute per IP
  const ip = getClientIp(request);
  if (isRateLimited(`book:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = bookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      organization,
      eventType,
      sport,
      preferredDate,
      alternateDate,
      startTime,
      duration,
      courts,
      groupSize,
      recurring,
      notes,
    } = result.data;

    // Build a detailed summary for Notion + email
    const summaryLines = [
      `Event: ${eventType}`,
      `Sport: ${sport || "Basketball"}`,
      organization ? `Org/Team: ${organization}` : null,
      `Date: ${preferredDate}${alternateDate ? ` (alt: ${alternateDate})` : ""}`,
      startTime ? `Time: ${startTime}` : null,
      `Duration: ${duration || "TBD"}`,
      `Courts: ${courts || "TBD"}`,
      `Group Size: ${groupSize || "TBD"}`,
      recurring ? `Recurring: ${recurring}` : null,
      notes ? `Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    // Save to Notion (fire-and-forget)
    saveChatLead({
      name,
      email,
      phone,
      interest: "Rental",
      urgency: "Hot",
      summary: summaryLines.slice(0, 2000),
      source: "Booking Form",
    }).catch((err) =>
      logger.error("Failed to save booking to Notion", { error: String(err) })
    );

    // Email notification (fire-and-forget)
    sendLeadEmail({
      name,
      email,
      phone,
      interest: "Rental",
      urgency: "Hot",
      summary: summaryLines,
      source: "Booking Form",
    }).catch((err) =>
      logger.error("Failed to send booking notification", { error: String(err) })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Booking form handler failed", { error: String(err) });
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
