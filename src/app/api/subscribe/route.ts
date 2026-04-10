import { NextRequest, NextResponse } from "next/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
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

        console.error("Mailchimp error:", data);
        return NextResponse.json(
          { error: "Subscription failed. Please try again." },
          { status: 500 }
        );
      }
    } else {
      // Graceful fallback — log and return success
      console.log(`[subscribe] No Mailchimp config — email captured: ${cleanEmail}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[subscribe] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
