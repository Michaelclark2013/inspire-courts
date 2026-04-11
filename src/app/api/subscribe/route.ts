import { NextRequest, NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip, 5, 60 * 1000)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const cleanEmail = result.data.email.trim().toLowerCase();
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;

    if (apiKey && listId) {
      // Extract data center from API key (the part after the last dash)
      const dc = apiKey.split("-").pop();

      const res = await fetch(
        `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `apikey ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: cleanEmail,
            status: "subscribed",
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();

        // Mailchimp returns "Member Exists" if already subscribed
        if (data.title === "Member Exists") {
          return NextResponse.json({ success: true });
        }

        logger.error("Mailchimp subscription failed", { title: data.title });
        return NextResponse.json(
          { success: false, error: "Subscription failed. Please try again." },
          { status: 500 }
        );
      }
    } else {
      logger.info("Mailchimp not configured — email captured", { email: cleanEmail });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Subscribe handler failed", { error: String(err) });
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
