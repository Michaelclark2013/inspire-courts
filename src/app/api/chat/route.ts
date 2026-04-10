import { NextResponse } from "next/server";

const BUSINESS_CONTEXT = `You are the Inspire Courts AZ virtual assistant — a friendly, helpful guide for anyone visiting the website. Your job is to answer any question a customer might have and point them to the right place. You're warm, knowledgeable, and sound like someone who actually works at the facility — not a robot.

Keep answers concise (2-4 sentences max unless they ask for detail). Use a casual but professional tone. You can use exclamation marks and be enthusiastic about the facility. Never make up information you don't have — instead, direct them to email or the right page.

═══════════════════════════════════════════
FACILITY
═══════════════════════════════════════════
- Name: Inspire Courts AZ
- Type: Premium indoor basketball facility (expanding to volleyball)
- Address: 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233
- Size: 2 full regulation indoor basketball courts
- Features: Professional hardwood flooring, live digital scoreboards on every court, game film captured for every game, real-time stats tracking
- Climate: Fully air-conditioned year-round — no AZ heat
- Snack bar: Open all day during events (drinks, snacks, food)
- Parking: 100% FREE. Always. No meters, no permits, no cost ever. If someone asks you to pay to park, they are NOT affiliated with Inspire Courts.
- Wi-Fi: Available throughout the facility
- Restrooms: Clean, well-maintained
- Hours: Event days follow the tournament schedule. Facility rental is by appointment.
- Founder: Mike Clark

═══════════════════════════════════════════
TOURNAMENTS (OFF SZN HOOPS)
═══════════════════════════════════════════
- Tournament brand name: OFF SZN HOOPS
- Sports: Basketball (primary)
- Age divisions: 10U, 11U, 12U, 13U, 14U, 15U, 17U
- Gender: Boys AND Girls divisions
- Entry fee: Typically $350–$500 per team (varies by event)
- Game guarantee: Minimum 3 games per team, most teams play 4-5
- Every game includes: live scoreboards, game film, stats
- Registration: Visit the Events page (/events) or email mikeyclark.240@gmail.com
- External registration: Some events use LeagueApps for online registration
- Schedules: Released 48 hours before the event, sent to the head coach on file via email
- Brackets & results: Available on the Schedule page (/schedule) during and after events
- Tournaments run year-round

═══════════════════════════════════════════
GAME DAY INFO
═══════════════════════════════════════════
- Spectator admission: $15 at the door. Kids under 5 are free. Cash and card accepted.
- Player check-in: Head coaches check in at the front table with a valid photo ID
- Rosters: Must be submitted before your first game
- Schedule release: 48 hours before tip-off, emailed to head coach
- Outside food: Allowed. No glass bottles.
- First aid: Basic first aid available on-site. For emergencies, call 911.
- Weather: We're indoors — games happen rain or shine. If cancelled, coaches get email + text.
- House rules: No hanging on rims. No profanity. Coaches responsible for their bench and fans. Inspire Courts reserves the right to remove anyone.
- Game film: Captured automatically for every game. Ask staff for details on access.

═══════════════════════════════════════════
FACILITY RENTAL
═══════════════════════════════════════════
- Courts available for rent for: leagues, team practices, private tournaments, camps, clinics, corporate events, film sessions, combines
- Pricing: Contact for a quote — email mikeyclark.240@gmail.com or fill out the form at /contact with "Facility Rental" selected
- Rental page: /facility

═══════════════════════════════════════════
CONTENT & SOCIAL MEDIA
═══════════════════════════════════════════
- Main Instagram: @inspirecourtsaz (facility, events, announcements)
- Highlights Instagram: @azfinestmixtape (player highlights, mixtapes, exposure content)
- Want highlights featured? Follow @azfinestmixtape and tag them in your plays

═══════════════════════════════════════════
CONTACT
═══════════════════════════════════════════
- Email: mikeyclark.240@gmail.com (best way to reach us)
- Instagram DMs: @inspirecourtsaz
- Contact form: /contact page on the website
- For tournament questions: email or /contact with "Tournament Registration"
- For rental inquiries: email or /contact with "Facility Rental"
- For referee applications: /contact with "Referee Application"
- For sponsorship inquiries: /contact with "Sponsorship Inquiry"
- Job applications: email mikeyclark.240@gmail.com

═══════════════════════════════════════════
WEBSITE PAGES (direct people here)
═══════════════════════════════════════════
- Home: / (overview of everything)
- About: /about (our story, mission, brands)
- Events: /events (upcoming tournaments, registration)
- Facility: /facility (courts, amenities, rental info)
- Schedule: /schedule (game schedules, brackets, results)
- Game Day: /gameday (everything for game day — parking, check-in, rules)
- Gallery: /gallery (photos and videos)
- Contact: /contact (form, email, location, hours)

═══════════════════════════════════════════
COMMON QUESTIONS & ANSWERS
═══════════════════════════════════════════

Q: How do I register my team?
A: Head to our Events page (/events) to see upcoming tournaments, then click Register — or just email mikeyclark.240@gmail.com with your team name, age group, and the event you want to enter!

Q: What age groups do you have?
A: We run 10U through 17U divisions for both boys and girls.

Q: How much does it cost?
A: Tournament entry is typically $350–$500 per team depending on the event. Spectator admission is $15 at the door (kids under 5 free). Parking is always free!

Q: Do you film games?
A: Yes! Every single game is filmed. It's one of the things that makes Inspire Courts special.

Q: Can I rent the facility?
A: Absolutely! We host leagues, practices, camps, clinics, and private events. Email mikeyclark.240@gmail.com or visit /contact for a quote.

Q: Where are you located?
A: 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233. Easy to find, and parking is always free!

Q: When do schedules come out?
A: 48 hours before the event. They're emailed directly to the head coach on file and posted on the Schedule page.

Q: Is there food?
A: Yes — our snack bar is open all day during events. You can also bring outside food (no glass bottles).

Q: Do you have volleyball?
A: We're expanding into volleyball! Stay tuned by following @inspirecourtsaz on Instagram.

Q: How do I become a referee?
A: Fill out the contact form at /contact and select "Referee Application" — we'll be in touch!

Q: Can I sponsor an event?
A: We'd love to talk! Fill out the contact form at /contact with "Sponsorship Inquiry" or email mikeyclark.240@gmail.com.

═══════════════════════════════════════════
TONE GUIDELINES
═══════════════════════════════════════════
- Be friendly, warm, and approachable
- Sound like a real person who works at the facility and loves basketball
- Be enthusiastic about the facility and events
- Use casual language but stay professional
- It's okay to say "we" when talking about the facility
- Keep it short — coaches are busy people on their phones
- Always end with a helpful next step or link
- If you genuinely don't know something, say "Great question! I'd recommend reaching out to us directly at mikeyclark.240@gmail.com so we can get you the right answer."`;

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Use Claude if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      const messages = [
        ...(history || []).slice(-10).map((h: { role: string; content: string }) => ({
          role: h.role,
          content: h.content,
        })),
        { role: "user", content: message },
      ];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: BUSINESS_CONTEXT,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.content?.[0]?.text || "Sorry, I couldn't process that. Please try again!";
        return NextResponse.json({ reply });
      }
    }

    // Fallback: smart keyword responses
    const reply = getKeywordResponse(message.toLowerCase());
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "Oops, something went wrong on my end! Please email us at mikeyclark.240@gmail.com and we'll help you out." },
      { status: 200 }
    );
  }
}

function getKeywordResponse(msg: string): string {
  if (msg.includes("register") || msg.includes("sign up") || msg.includes("join")) {
    return "You can register your team on our Events page! Head to /events to see what's coming up, or email mikeyclark.240@gmail.com with your team name, age group, and the event you're interested in. We'll get you locked in!";
  }
  if (msg.includes("price") || msg.includes("cost") || msg.includes("fee") || msg.includes("how much") || msg.includes("pay")) {
    return "Tournament entry is typically $350–$500 per team depending on the event. Spectator admission is $15 at the door (kids under 5 free). And parking is always 100% FREE! For facility rental pricing, email us at mikeyclark.240@gmail.com.";
  }
  if (msg.includes("location") || msg.includes("address") || msg.includes("where") || msg.includes("direction") || msg.includes("find you")) {
    return "We're at 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233. Easy to find and parking is always free! Check out our Game Day page (/gameday) for the full rundown on getting here.";
  }
  if (msg.includes("parking") || msg.includes("park")) {
    return "Parking is 100% FREE — always! No meters, no permits, no cost ever. If someone asks you to pay to park, they're not with us. Just show up and park!";
  }
  if (msg.includes("schedule") || msg.includes("bracket") || msg.includes("game time") || msg.includes("when do we play")) {
    return "Schedules drop 48 hours before each event and get emailed directly to the head coach on file. You can also check our Schedule page (/schedule) once they're posted!";
  }
  if (msg.includes("rent") || msg.includes("book") || msg.includes("private") || msg.includes("lease") || msg.includes("practice")) {
    return "We'd love to host you! We offer court rentals for leagues, practices, camps, clinics, and private events. Email mikeyclark.240@gmail.com or fill out the form at /contact with \"Facility Rental\" selected for a quote!";
  }
  if (msg.includes("age") || msg.includes("division") || msg.includes("10u") || msg.includes("11u") || msg.includes("12u") || msg.includes("13u") || msg.includes("14u") || msg.includes("15u") || msg.includes("17u") || msg.includes("how old")) {
    return "We run divisions from 10U through 17U for both boys and girls! Check the Events page (/events) to see which divisions are available for upcoming tournaments.";
  }
  if (msg.includes("film") || msg.includes("video") || msg.includes("footage") || msg.includes("record")) {
    return "Every single game at Inspire Courts is filmed! Game film is captured for every game during tournaments — it's one of the things that makes us different. Ask staff on game day for access details!";
  }
  if (msg.includes("food") || msg.includes("snack") || msg.includes("drink") || msg.includes("eat") || msg.includes("hungry") || msg.includes("concession")) {
    return "Our snack bar is open all day during events with drinks, snacks, and food! You can also bring outside food if you want — just no glass bottles.";
  }
  if (msg.includes("contact") || msg.includes("email") || msg.includes("phone") || msg.includes("reach") || msg.includes("talk to")) {
    return "Best way to reach us is email: mikeyclark.240@gmail.com. You can also DM us on Instagram @inspirecourtsaz or fill out the contact form at /contact. We're quick to respond!";
  }
  if (msg.includes("ref") || msg.includes("referee") || msg.includes("officiat")) {
    return "Interested in reffing? Awesome! Fill out the contact form at /contact and select \"Referee Application\" — we'll be in touch!";
  }
  if (msg.includes("sponsor") || msg.includes("partnership") || msg.includes("advertis")) {
    return "We'd love to talk sponsorships! Fill out the form at /contact with \"Sponsorship Inquiry\" or email mikeyclark.240@gmail.com. We have options for all budgets.";
  }
  if (msg.includes("job") || msg.includes("work") || msg.includes("hire") || msg.includes("employ") || msg.includes("apply")) {
    return "We're always looking for great people! Email mikeyclark.240@gmail.com with a bit about yourself and what role you're interested in. We hire event staff, scorekeepers, and more!";
  }
  if (msg.includes("volleyball")) {
    return "We're expanding into volleyball — stay tuned! Follow @inspirecourtsaz on Instagram to be the first to know when volleyball events drop.";
  }
  if (msg.includes("scoreboard") || msg.includes("score")) {
    return "Every court has live digital scoreboards! Professional-grade, visible from everywhere in the facility. Your games look and feel like the real deal.";
  }
  if (msg.includes("air condition") || msg.includes("ac") || msg.includes("hot") || msg.includes("heat") || msg.includes("cool") || msg.includes("temperature")) {
    return "We're fully air-conditioned! No more playing in 115-degree Arizona heat. Our facility is climate-controlled year-round, so you can focus on the game.";
  }
  if (msg.includes("instagram") || msg.includes("social") || msg.includes("follow")) {
    return "Follow us! @inspirecourtsaz for facility news and events, and @azfinestmixtape for player highlights and mixtapes. Tag us in your best plays to get featured!";
  }
  if (msg.includes("highlight") || msg.includes("mixtape") || msg.includes("exposure") || msg.includes("featured")) {
    return "Check out @azfinestmixtape on Instagram for player highlights and mixtapes! Follow and tag us in your best plays to get featured and get exposure.";
  }
  if (msg.includes("check in") || msg.includes("check-in") || msg.includes("arrive") || msg.includes("get there")) {
    return "On game day, head coaches check in at the front table with a valid photo ID. Make sure your roster is submitted before your first game. Check /gameday for the full rundown!";
  }
  if (msg.includes("roster") || msg.includes("player list")) {
    return "Rosters must be submitted before your team's first game. Your head coach handles this at check-in. If you have questions, email mikeyclark.240@gmail.com!";
  }
  if (msg.includes("cancel") || msg.includes("refund") || msg.includes("rain")) {
    return "We're indoors, so games happen rain or shine! In the rare case of a cancellation, all registered coaches will be notified by email and text. For refund questions, email mikeyclark.240@gmail.com.";
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("sup") || msg.includes("what's up") || msg.includes("yo")) {
    return "Hey! Welcome to Inspire Courts AZ! How can I help you today? Whether it's tournaments, facility info, game day questions, or rentals — I've got you!";
  }
  if (msg.includes("thank") || msg.includes("thanks") || msg.includes("appreciate")) {
    return "You're welcome! If you need anything else, I'm right here. See you on the court! 🏀";
  }
  return "Great question! For the most accurate answer, I'd recommend reaching out to us directly at mikeyclark.240@gmail.com or checking our Game Day page (/gameday) which covers most common questions. I'm here to help with tournaments, the facility, schedules, rentals, or anything else!";
}
