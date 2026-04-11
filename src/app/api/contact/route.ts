import { NextResponse } from "next/server";
import { createContactSubmission } from "@/lib/notion";
import { sendLeadEmail } from "@/lib/notify";
import { contactSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { INQUIRY_INTEREST_MAP } from "@/lib/constants";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

/** Escape HTML special characters to prevent XSS in downstream systems. */
function sanitize(value: string): string {
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
  if (isRateLimited(`contact:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    // Sanitize all user-supplied strings before sending to Notion / email
    const name = sanitize(result.data.name);
    const email = sanitize(result.data.email);
    const phone = sanitize(result.data.phone ?? "");
    const inquiryType = sanitize(result.data.inquiryType ?? "");
    const message = sanitize(result.data.message);

    // Save to Notion (fire-and-forget)
    createContactSubmission({ name, email, phone, inquiryType, message }).catch(
      (err) => logger.error("Failed to save contact submission", { error: String(err) })
    );

    // Email notification to owner (fire-and-forget)
    sendLeadEmail({
      name,
      email,
      phone,
      interest: INQUIRY_INTEREST_MAP[inquiryType ?? ""] ?? "General",
      urgency: "Warm",
      summary: `${inquiryType}: ${message.slice(0, 300)}`,
      source: "Contact Form",
    }).catch((err) =>
      logger.error("Failed to send contact notification", { error: String(err) })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Contact form handler failed", { error: String(err) });
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
