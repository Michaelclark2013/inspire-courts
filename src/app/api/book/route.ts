import { NextResponse } from "next/server";
import { saveChatLead } from "@/lib/notion";
import { sendLeadEmail } from "@/lib/notify";
import { bookSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { appendSheetRow, sanitizeSheetRow, SHEETS } from "@/lib/google-sheets";
import { sanitizeField as sanitize } from "@/lib/sanitize";

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
      sport,
      eventType,
      preferredDate,
      preferredTime,
      courts,
      notes,
    } = result.data;

    // Build a detailed summary for Notion + email
    const summaryLines = [
      `Event: ${eventType}`,
      `Sport: ${sport}`,
      `Date: ${preferredDate}`,
      `Time: ${preferredTime}`,
      `Courts: ${courts}`,
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

    // Save to prospect pipeline sheet (fire-and-forget)
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" });
    appendSheetRow(SHEETS.prospectPipeline, "Sheet1!A:G", [
      sanitizeSheetRow([timestamp, name, email, phone, "Rental", "Booking Form", "Hot"]),
    ]).catch((err) => logger.error("Failed to save booking to sheet", { error: String(err) }));

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
