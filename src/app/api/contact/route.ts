import { NextResponse } from "next/server";

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

    // Attempt Notion submission if API key is configured
    if (process.env.NOTION_API_KEY) {
      try {
        const { Client } = await import("@notionhq/client");
        const notion = new Client({ auth: process.env.NOTION_API_KEY });

        // Create page in contact submissions database if one exists
        // For now, log the submission
        console.log("Contact form submission:", { name, email, phone, inquiryType, message });
      } catch (e) {
        console.error("Notion submission failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
