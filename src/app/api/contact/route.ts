import { NextResponse } from "next/server";
import { createContactSubmission } from "@/lib/notion";
import { sendLeadEmail } from "@/lib/notify";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, phone, inquiryType, message } = data;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    // Save to Notion (fire-and-forget)
    createContactSubmission({ name, email, phone, inquiryType, message }).catch(
      (err) => console.error("Failed to save contact submission:", err)
    );

    // Email notification to owner (fire-and-forget)
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

    sendLeadEmail({
      name,
      email,
      phone,
      interest: interestMap[inquiryType] || "General",
      urgency: "Warm",
      summary: `${inquiryType}: ${message.slice(0, 300)}`,
      source: "Contact Form",
    }).catch((err) => console.error("Failed to send contact notification:", err));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
