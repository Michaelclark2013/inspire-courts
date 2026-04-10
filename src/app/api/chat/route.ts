import { NextResponse } from "next/server";

const BUSINESS_CONTEXT = `You are the Inspire Courts AZ virtual assistant — a friendly, helpful guide for anyone visiting the website. Your job is to answer any question a customer might have and point them to the right place. You're warm, knowledgeable, and sound like someone who actually works at the facility — not a robot.

Keep answers concise (2-4 sentences max unless they ask for detail). Use a casual but professional tone. You can use exclamation marks and be enthusiastic about the facility. Never make up information you don't have — instead, direct them to email or the right page.

═══════════════════════════════════════════
FACILITY
═══════════════════════════════════════════
- Name: Inspire Courts AZ
- Type: Premium indoor sports facility — basketball, volleyball, and futsal
- Address: 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233
- Size: 52,000 square feet
- 7 hardwood basketball courts (5 are college regulation with possession arrows)
- 7 regulation volleyball courts
- Electronic scoreboards and scorer's table with digital display units on EVERY court
- Adjustable height glass backboards with NBA rims
- Color-coded courts
- Bleachers and benches for spectators
- Conference room available
- Hospitality rooms available
- Shooting gun available
- Inspire Performance Training on-site
- Snack shop on-site
- Climate: Fully air-conditioned year-round — no AZ heat
- Parking: Ample parking and easy facility access
- Wi-Fi: Available throughout the facility
- Open Gym: Available during all open hours based on court availability
- Hours: Event days follow the tournament schedule. Facility rental is by appointment.
- Founder: Mike Clark
- YouTube facility tour: https://www.youtube.com/watch?v=1pJDZU2I6k4

═══════════════════════════════════════════
MISSION
═══════════════════════════════════════════
Inspire Athletics exists to provide student-athletes with the opportunity to develop their athletic ability at a world class facility in a diverse environment that promotes personal development. We pride ourselves on being the leading basketball complex in Arizona, providing premier coaching to committed athletes. We recognize the demands placed on athletes in sports and are devoted to helping them manage those demands and get the most out of their athletic experience.

═══════════════════════════════════════════
CAMPSITE / TAILGATING RULES
═══════════════════════════════════════════
- Campsites open 1 hour prior to event
- No alcoholic beverages
- No charcoal or wood burning grills
- Only pop-up style tents allowed — no stakes, ropes, or weights
- Tents cannot be larger than 10' x 10'
- No tents left overnight (must be removed at end of each day)
- Tents must come down during storms
- Inspire Courts is not responsible for damage or theft
- Inspire Courts reserves the right to require tents to be taken down for visual obstruction, weather, or blocking traffic flow
- Tents cannot display advertising or logos without prior written approval from Inspire Courts
- No refunds

═══════════════════════════════════════════
TOURNAMENTS (OFF SZN HOOPS)
═══════════════════════════════════════════
- Tournament brand name: OFF SZN HOOPS
- Sports: Basketball tournaments specifically
- Age divisions: 10U, 11U, 12U, 13U, 14U, 15U, 17U
- Gender: Boys AND Girls divisions
- Entry fee: Typically $350 per team
- Game guarantee: Minimum 3 games per team, most teams play 4-5
- Every game includes: live scoreboards, game film, stats
- Registration: Visit the Events page (/events) or email InspireCourts@gmail.com
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
- First aid: Basic first aid available on-site. For emergencies, call 911.
- Weather: We're indoors — games happen rain or shine. If cancelled, coaches get email + text.
- House rules: No hanging on rims. No profanity. Coaches responsible for their bench and fans. Inspire Courts reserves the right to remove anyone.
- Game film: Captured automatically for every game (recorded, NOT live-streamed). Ask staff for details on access.

═══════════════════════════════════════════
FOOD & BEVERAGE POLICY (IMPORTANT — BE EXACT)
═══════════════════════════════════════════
- WEEKDAYS: Only sports drinks and water are allowed in the court area. Absolutely NO food or gum allowed in the court area.
- WEEKEND TOURNAMENTS: No coolers or outside food or beverages permitted inside Inspire Courts or directly outside the entrance. Players may bring ONE (1) bottled water and ONE (1) sports drink.
- Snack bar is open during events.

═══════════════════════════════════════════
COMPLEX RULES
═══════════════════════════════════════════
- Demonstrate good sportsmanship at all times
- Clean up after yourself and your team
- Treat the facilities, equipment, and other court users respectfully
- Be respectful of athletes on neighboring courts
- Clean team benches following each contest
- Only suitable court shoes allowed — no dress shoes, sandals, or cleats. Non-marking soles required.
- No outside food, drinks, or coolers allowed
- No sunflower seeds or gum
- No alcohol at the complex including the parking lot
- No fighting or vulgarities
- Place all trash and recyclables in appropriate containers
- All rentals must be cleared by the end of their rental time
- Children not participating in organized activities must be supervised at all times
- Inspire reserves the right to remove anyone behaving detrimentally to the facility, workers, owners, or other users
- Absolutely no club team recruiting will be tolerated
- No kicking balls or bouncing them off walls
- No hanging on rims

═══════════════════════════════════════════
FACILITY RENTAL
═══════════════════════════════════════════
- Courts available for rent for: leagues, team practices, private tournaments, camps, clinics, corporate events, birthday parties, film sessions, combines
- Also available for: volleyball leagues/practices, futsal leagues/practices
- Pricing: $80 per court per hour
- Corporate events, birthday parties, and private events: Email InspireCourts@gmail.com for info
- General rental inquiries: Email InspireCourts@gmail.com or fill out the form at /contact with "Facility Rental" selected
- Rental page: /facility#rentals

═══════════════════════════════════════════
PRIVATE TRAINING
═══════════════════════════════════════════
- Offered at Inspire Courts on regulation hardwood
- Options: 1-on-1 training, small group (2-4 players), shooting sessions
- To book: Fill out the form on the Training page (/training) or contact form at /contact with "Private Training"
- Training page: /training

═══════════════════════════════════════════
TEAM INSPIRE (CLUB BASKETBALL)
═══════════════════════════════════════════
- Club basketball program based out of Inspire Courts
- Plays on the MADE Hoops High School Circuit — one of the top grassroots platforms in the country
- Current divisions: 16U and 17U Boys
- Looking to expand to more divisions (13U, 14U, 15U) down the line
- Actively recruiting coaches and players
- To express interest: Fill out the form on the Club page (/teams#join)
- Club page: /teams

═══════════════════════════════════════════
GAME FILM (NOT STREAMING)
═══════════════════════════════════════════
- Games are filmed (recorded), NOT live-streamed
- Game film is available after games for teams to review
- Great for player development and recruiting portfolios

═══════════════════════════════════════════
CONTENT & SOCIAL MEDIA
═══════════════════════════════════════════
- Main Instagram: @inspirecourtsaz (facility, events, announcements)
- Highlights Instagram: @azfinestmixtape (player highlights, mixtapes, exposure content)
- Want highlights featured? Follow @azfinestmixtape and tag them in your plays

═══════════════════════════════════════════
CONTACT
═══════════════════════════════════════════
- Email: InspireCourts@gmail.com (best way to reach us)
- Instagram DMs: @inspirecourtsaz
- Contact form: /contact page on the website
- For tournament questions: email or /contact with "Tournament Registration"
- For rental inquiries: email or /contact with "Facility Rental"
- For referee applications: /contact with "Referee Application"
- For sponsorship inquiries: /contact with "Sponsorship Inquiry"
- Job applications: email InspireCourts@gmail.com

═══════════════════════════════════════════
WEBSITE PAGES (direct people here)
═══════════════════════════════════════════
- Home: / (overview of everything)
- About: /about (our story, mission, brands)
- Events: /events (upcoming tournaments, registration)
- Facility: /facility (courts, amenities, rental info)
- Schedule: /schedule (game schedules, brackets, results)
- Game Day: /gameday (everything for game day — check-in, rules)
- Gallery: /gallery (photos and videos)
- Contact: /contact (form, email, location, hours)

═══════════════════════════════════════════
COMMON QUESTIONS & ANSWERS
═══════════════════════════════════════════

Q: How do I register my team?
A: Head to our Events page (/events) to see upcoming tournaments, then click Register — or just email InspireCourts@gmail.com with your team name, age group, and the event you want to enter!

Q: What age groups do you have?
A: We run 10U through 17U divisions for both boys and girls.

Q: How much does it cost?
A: Tournament entry is typically $350–$500 per team depending on the event. Spectator admission is $15 at the door (kids under 5 free).

Q: Do you film games?
A: Yes! Every single game is filmed. It's one of the things that makes Inspire Courts special.

Q: Can I rent the facility?
A: Absolutely! We host leagues, practices, camps, clinics, and private events. Email InspireCourts@gmail.com or visit /contact for a quote.

Q: Where are you located?
A: 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233. Easy to find!

Q: When do schedules come out?
A: 48 hours before the event. They're emailed directly to the head coach on file and posted on the Schedule page.

Q: Is there food?
A: Yes — our snack bar is open all day during events with drinks, snacks, and food. Please note: no outside food or beverages are permitted.

Q: Do you have volleyball?
A: We're expanding into volleyball! Stay tuned by following @inspirecourtsaz on Instagram.

Q: How do I become a referee?
A: Fill out the contact form at /contact and select "Referee Application" — we'll be in touch!

Q: Can I sponsor an event?
A: We'd love to talk! Fill out the contact form at /contact with "Sponsorship Inquiry" or email InspireCourts@gmail.com.

═══════════════════════════════════════════
LEAD CAPTURE — VERY IMPORTANT
═══════════════════════════════════════════
- Your secondary goal (after being helpful) is to collect the visitor's NAME, EMAIL, and PHONE NUMBER
- After answering their first question, naturally ask: "By the way, can I grab your name and number/email so someone from our team can follow up with you directly?"
- If they ask about tournaments, training, rentals, or club — always try to get their contact info
- Be natural about it — don't be pushy, but always try to get it before the conversation ends
- If they give you their info, say something like "Got it! Someone from our team will reach out soon."
- NEVER let a conversation end with a dead end — always ask a follow-up question or suggest something else they might be interested in
- After answering any question, always follow up with something like "Anything else I can help with?" or suggest a related topic
- Examples of follow-ups: "Are you looking to play in a tournament or rent the facility?", "Would you like info on our training programs too?", "Want me to connect you with someone on our team?"

═══════════════════════════════════════════
UPCOMING PROGRAMS
═══════════════════════════════════════════
- Basketball Academy: Coming soon! For players who want structured, year-round development
- If asked, say: "Our basketball academy is launching soon! Drop your name and email and we'll make sure you're the first to know."

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
- If you genuinely don't know something, say "Great question! I'd recommend reaching out to us directly at InspireCourts@gmail.com so we can get you the right answer."`;

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
      { reply: "Oops, something went wrong on my end! Please email us at InspireCourts@gmail.com and we'll help you out." },
      { status: 200 }
    );
  }
}

// Smart pattern matching with scoring — matches the best response, not just the first keyword
interface Pattern {
  keywords: string[];
  mustMatch?: number; // minimum keywords to match (default 1)
  response: string;
  score?: number; // priority boost
}

const PATTERNS: Pattern[] = [
  // Greetings
  { keywords: ["hello", "hi", "hey", "sup", "what's up", "yo", "howdy", "good morning", "good afternoon", "what up", "whats up"], response: "Hey! Welcome to Inspire Courts — 52,000 sq ft, 7 courts, the best basketball facility in Arizona. What are you looking for today? Tournaments, court rentals, training, or something else?" },

  // Pricing / Cost
  { keywords: ["price", "cost", "fee", "how much", "pay", "rate", "pricing", "charge", "expensive", "affordable", "budget", "money", "dollar", "$"], response: "Here's a quick breakdown:\n\n🏀 Tournament entry: $350/team\n🏟️ Court rental: $80/court/hour\n🎟️ Spectator admission: $15 (kids under 5 free)\n\nWant exact pricing for your situation? Drop your name and email and I'll have someone follow up!" },

  // Court Rental
  { keywords: ["rent", "book", "lease", "reserve", "court time", "court rental", "available"], response: "Courts are $80/hour per court — we have 7 available! We host basketball, volleyball, and futsal. Perfect for leagues, practices, camps, birthday parties, corporate events, and more. What sport and how many courts are you looking for?" },

  // Registration / Sign up
  { keywords: ["register", "sign up", "signup", "enter", "enter team", "enroll"], response: "You can register on our Tournaments page (/events) or email InspireCourts@gmail.com with your team name, age group, and which event. What division are you looking at?" },

  // Location
  { keywords: ["location", "address", "where", "direction", "find you", "map", "get there", "located", "navigate"], response: "We're at 1090 N Fiesta Blvd, Ste 101 & 102, Gilbert, AZ 85233. Ample parking, easy access. Here's a virtual tour: https://youtube.com/watch?v=1pJDZU2I6k4 — Are you coming for an event or looking to rent?" },

  // Schedule / Brackets
  { keywords: ["schedule", "bracket", "game time", "when do we play", "when is", "what time", "start time"], response: "Schedules drop 48 hours before each event and get emailed to the head coach on file. They're also posted on /schedule. What event are you looking for?" },

  // Training
  { keywords: ["training", "trainer", "coach me", "lesson", "session", "skill", "workout", "develop", "improve", "get better", "personal"], response: "We offer 1-on-1 training, small group sessions (2-4 players), and shooting workouts on regulation hardwood with a shooting gun. Fill out the form at /training to book! What position and age is your player?" },

  // Club / Team Inspire / MADE Hoops
  { keywords: ["club", "team inspire", "made hoops", "tryout", "try out", "aau", "grassroots", "circuit"], response: "Team Inspire plays on the MADE Hoops High School Circuit — one of the top platforms in grassroots basketball. We're running 16U and 17U boys and actively recruiting coaches and players. Fill out the interest form at /teams! Are you a player or coach?" },

  // Volleyball
  { keywords: ["volleyball", "volley", "v-ball"], response: "We have 7 regulation volleyball courts! Courts are available to rent at $80/hour for leagues, practices, tournaments, and events. We host volleyball regularly. How many courts and what dates are you looking at?" },

  // Futsal
  { keywords: ["futsal", "soccer", "futbol", "indoor soccer"], response: "Our facility is perfect for futsal! Courts available at $80/hour. We host futsal leagues and pickup regularly. What are you looking for — a league, practice time, or a one-time rental?" },

  // Camps
  { keywords: ["camp", "summer camp", "basketball camp", "youth camp"], response: "Camps are coming soon! Drop your name, email, and the age of your player — we'll make sure you're first to know when registration opens. In the meantime, check out our private training at /training!" },

  // Academy
  { keywords: ["academy", "program", "year round", "year-round", "development program"], response: "Our basketball academy is launching soon — structured, year-round development for serious players. Give me your name and email and you'll be first to hear when we drop it!" },

  // Food / Drink
  { keywords: ["food", "snack", "drink", "eat", "hungry", "concession", "water", "gatorade", "bring", "outside food"], response: "Weekdays: only sports drinks and water in the court area — no food or gum. Weekend tournaments: no coolers or outside food/drinks, but players can bring 1 bottled water and 1 sports drink each. Our snack shop is open during events! Anything else?" },

  // Shoes / What to wear
  { keywords: ["shoe", "shoes", "wear", "cleats", "sandal", "sole", "non-marking", "dress shoe"], response: "Only athletic shoes with non-marking soles are allowed on the courts — basketball shoes, volleyball shoes, or indoor soccer shoes. No dress shoes, sandals, or cleats. Anything else you need for game day?" },

  // Parking / Camping / Tailgating
  { keywords: ["parking", "park", "tailgate", "tent", "camping", "campsite"], response: "We have ample parking with easy access. Tailgating: pop-up tents only (max 10'x10'), no stakes/ropes, no alcohol, no charcoal grills, tents must come down at end of each day and during storms. Campsites open 1 hour before events." },

  // Game Film
  { keywords: ["film", "video", "footage", "record", "stream", "streaming", "watch", "broadcast", "live stream"], response: "Every game is filmed (recorded) during tournaments — great for development and recruiting. We don't live-stream, but all game film is available after. Ask staff on game day for access! What else can I help with?" },

  // Age / Division
  { keywords: ["age", "division", "10u", "11u", "12u", "13u", "14u", "15u", "16u", "17u", "how old", "age group", "grade", "youth"], response: "Tournament divisions run from 10U through 17U for both boys and girls! Our club team (Team Inspire) currently plays 16U and 17U on the MADE Hoops circuit. What age is your player?" },

  // Birthday / Corporate / Private Events
  { keywords: ["birthday", "party", "corporate", "event", "celebration", "team building", "private event"], response: "Yes! We host birthday parties, corporate events, and private events. Email InspireCourts@gmail.com with your date, group size, and what you're looking for — we'll put together a package! How many people are you expecting?" },

  // Open Gym
  { keywords: ["open gym", "pickup", "pick up", "drop in", "walk in", "open run", "open play"], response: "Open Gym is available during all open hours based on court availability! Just show up with proper court shoes (non-marking soles). Want to know what's available today? Email InspireCourts@gmail.com!" },

  // Contact
  { keywords: ["contact", "email", "phone", "reach", "talk to", "call", "message", "get in touch", "speak"], response: "Best way to reach us:\n\n📧 InspireCourts@gmail.com\n📱 DM @inspirecourtsaz on Instagram\n📝 Contact form at /contact\n\nWe're quick to respond! What do you need help with?" },

  // Referee
  { keywords: ["ref", "referee", "officiat", "umpire", "whistle"], response: "Want to ref at Inspire Courts? We're always looking for good officials. Fill out the form at /contact and select \"Referee Application\" — what experience do you have?" },

  // Sponsorship
  { keywords: ["sponsor", "partnership", "advertis", "brand", "promote"], response: "We'd love to talk sponsorships! We have options for all budgets — from court signage to tournament naming rights. Email InspireCourts@gmail.com or fill out /contact with \"Sponsorship Inquiry\". What's your brand?" },

  // Jobs
  { keywords: ["job", "work", "hire", "employ", "apply", "position", "staff", "scorekeeper"], response: "We hire event staff, scorekeepers, front desk, refs, and more! Email InspireCourts@gmail.com with a bit about yourself and what role interests you. Do you have experience working events?" },

  // Instagram / Social
  { keywords: ["instagram", "social", "follow", "ig", "insta", "tiktok", "facebook", "youtube"], response: "Follow us!\n\n📸 @inspirecourtsaz — facility news & events\n🎬 @azfinestmixtape — player highlights & mixtapes\n🎥 YouTube tour: https://youtube.com/watch?v=1pJDZU2I6k4\n\nTag us in your best plays to get featured!" },

  // Highlight / Mixtape
  { keywords: ["highlight", "mixtape", "exposure", "featured", "clip", "dunk", "play"], response: "Follow @azfinestmixtape on Instagram and tag us in your best plays! We create player highlights and mixtapes that get exposure. Want to be featured at your next tournament?" },

  // Facility Info
  { keywords: ["facility", "court", "how big", "size", "square", "amenities", "features", "what do you have"], response: "52,000 sq ft with 7 hardwood basketball courts (5 college regulation), 7 volleyball courts, electronic scoreboards on every court, glass backboards with NBA rims, bleachers, conference room, hospitality rooms, snack shop, shooting gun, and Inspire Performance Training. Come see it: https://youtube.com/watch?v=1pJDZU2I6k4" },

  // Check-in / Game Day
  { keywords: ["check in", "check-in", "arrive", "game day", "what to bring", "first time"], response: "Game day checklist:\n✅ Head coach checks in with photo ID\n✅ Roster submitted before first game\n✅ Non-marking court shoes only\n✅ No outside food (1 water + 1 sports drink OK)\n✅ $15 spectator admission\n\nSchedules are emailed 48hrs before. Check /gameday for everything!" },

  // Roster
  { keywords: ["roster", "player list", "team list", "add player", "eligible"], response: "Rosters must be submitted before your first game. Head coaches handle this at check-in. Questions? Email InspireCourts@gmail.com. What event is your team in?" },

  // Cancellation / Refund
  { keywords: ["cancel", "refund", "rain", "weather", "postpone"], response: "We're indoors — games happen rain or shine! If there's ever a cancellation, coaches get email + text notification. For refund questions, email InspireCourts@gmail.com. What event are you asking about?" },

  // Air Conditioning
  { keywords: ["air condition", "ac", "hot", "heat", "cool", "temperature", "climate"], response: "Fully air-conditioned, year-round! No more Arizona heat. Our 52,000 sq ft facility stays comfortable no matter what it's like outside. Is there anything else about the facility you want to know?" },

  // Scoreboards
  { keywords: ["scoreboard", "score", "scoring", "points", "stats"], response: "Every court has electronic scoreboards with digital display units and scorer's tables. Plus we have possession arrows on our 5 college regulation courts. Professional setup! Anything else?" },

  // Rules
  { keywords: ["rules", "policy", "allowed", "prohibited", "banned", "can i", "can we", "permitted"], response: "Key rules: non-marking court shoes only, no outside food/drinks (except 1 water + 1 sports drink), no alcohol, no gum/sunflower seeds, good sportsmanship, clean up after your team, no hanging on rims. Full details at /gameday. What specifically are you wondering about?" },

  // Thanks
  { keywords: ["thank", "thanks", "appreciate", "awesome", "perfect", "great", "cool", "bet", "dope"], response: "Glad I could help! If anything else comes up, I'm right here. And if you haven't already, follow @inspirecourtsaz to stay in the loop. See you on the court! 🏀" },

  // Yes / Affirmative
  { keywords: ["yes", "yeah", "yep", "sure", "definitely", "absolutely", "for sure", "please", "ok", "okay"], response: "Awesome! Drop your name, email, and what you're interested in and I'll make sure someone from our team follows up with you directly. Or you can email InspireCourts@gmail.com — we're quick!" },

  // No
  { keywords: ["no", "nah", "nope", "not really", "i'm good", "all good"], response: "No worries! If you ever need anything — tournaments, court rentals, training — we're here. Follow @inspirecourtsaz on Instagram to stay updated. Have a good one! 🏀" },

  // Mission / About
  { keywords: ["mission", "about", "story", "who are you", "what is inspire", "tell me about"], response: "Inspire Athletics exists to provide student-athletes with the opportunity to develop their athletic ability at a world-class facility in a diverse environment that promotes personal development. We're the leading basketball complex in Arizona! Check /about for the full story. What can I help you with?" },

  // Tour
  { keywords: ["tour", "visit", "see the facility", "come by", "walk through", "look around"], response: "Here's a virtual tour of our facility: https://youtube.com/watch?v=1pJDZU2I6k4 — 52,000 sq ft, 7 courts, the works. Want to schedule an in-person visit? Email InspireCourts@gmail.com!" },
];

function getKeywordResponse(msg: string): string {
  // Score each pattern based on how many keywords match
  let bestMatch: { response: string; matchCount: number } | null = null;

  for (const pattern of PATTERNS) {
    const matchCount = pattern.keywords.filter((kw) => msg.includes(kw)).length;
    const minRequired = pattern.mustMatch || 1;

    if (matchCount >= minRequired) {
      const score = matchCount + (pattern.score || 0);
      if (!bestMatch || score > bestMatch.matchCount) {
        bestMatch = { response: pattern.response, matchCount: score };
      }
    }
  }

  if (bestMatch) return bestMatch.response;

  // Smart fallback — try to understand intent from common phrases
  if (msg.length < 5) {
    return "Hey! I'm here to help with anything Inspire Courts — tournaments, court rentals (basketball, volleyball, futsal), private training, our club team, or facility info. What are you looking for?";
  }

  if (msg.includes("?")) {
    return "Good question! I want to make sure I give you the right answer. Could you tell me a bit more? Are you asking about basketball tournaments, renting a court, training, or something else? You can also email InspireCourts@gmail.com and we'll get right back to you!";
  }

  return "I hear you! I can help with basketball tournaments, court rentals ($80/hr for basketball, volleyball, or futsal), private training, our MADE Hoops club team, facility info, or game day questions. What sounds closest to what you need?";
}
