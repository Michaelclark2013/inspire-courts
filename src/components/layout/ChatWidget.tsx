"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { FACILITY_EMAIL } from "@/lib/constants";
import { trackConversion } from "@/lib/analytics";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PAGE_CONTEXT: Record<
  string,
  { greeting: string; quickQuestions: string[] }
> = {
  "/events": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 I see you're checking out our events — want help finding the right tournament, registering your team, or figuring out divisions and fees? I'm here for you!",
    quickQuestions: [
      "What events are coming up?",
      "How do I register my team?",
      "What age groups do you have?",
      "How much is entry?",
      "When do schedules come out?",
      "Boys or girls divisions?",
    ],
  },
  "/schedule": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Looking for your game schedule? Tell me your team or age group and I'll help you find brackets, game times, and results!",
    quickQuestions: [
      "When does the schedule drop?",
      "How do I find my bracket?",
      "What age groups are playing?",
      "How do I register?",
      "Where are you located?",
      "What events are coming up?",
    ],
  },
  "/facility": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Checking out the facility? I'd love to walk you through what we've got — courts, amenities, rentals, you name it. What are you looking for?",
    quickQuestions: [
      "How much to rent a court?",
      "What sports can I play?",
      "How many courts do you have?",
      "Tell me about the facility",
      "Birthday party options?",
      "How do I book?",
    ],
  },
  "/book": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Ready to book? I can walk you through availability, pricing, and get you set up. What are you looking to do?",
    quickQuestions: [
      "How much to rent a court?",
      "How do I book a court?",
      "What's included in a rental?",
      "Birthday party options?",
      "What sports are available?",
      "How do I contact you?",
    ],
  },
  "/training": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Looking to level up? Our training programs are built to take your game to the next level. Tell me what you're looking for and I'll point you in the right direction!",
    quickQuestions: [
      "What training do you offer?",
      "How do I book a session?",
      "How much is training?",
      "Group sessions available?",
      "Who are the coaches?",
      "1-on-1 or small group?",
    ],
  },
  "/teams": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Interested in Team Inspire? We've got an amazing club basketball program — let me tell you about tryouts, age divisions, and our MADE Hoops circuit!",
    quickQuestions: [
      "How do I try out?",
      "What ages are on the team?",
      "What's MADE Hoops?",
      "Are you recruiting players?",
      "Are you recruiting coaches?",
      "Tell me about club basketball",
    ],
  },
  "/prep": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Checking out Inspire Prep? This program is built for serious players who want to compete at the next level. What would you like to know?",
    quickQuestions: [
      "What is Inspire Prep?",
      "How do I enroll?",
      "What ages is it for?",
      "Tell me about the program",
      "How do I contact you?",
      "What does it cost?",
    ],
  },
  "/media": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Our media team does some incredible work — game film for every game, player highlights, mixtapes, and social exposure. What are you interested in?",
    quickQuestions: [
      "How does game film work?",
      "How do I get my highlights?",
      "What's the mixtape service?",
      "How do I get featured?",
      "Who do I contact?",
      "How much does it cost?",
    ],
  },
  "/gameday": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Game day is the best day! Let me help you get ready — check-in, rules, parking, what to bring. What do you need to know?",
    quickQuestions: [
      "What do I need to bring?",
      "How does check-in work?",
      "What are the rules?",
      "Is there parking?",
      "How much is admission?",
      "Where are you located?",
    ],
  },
  "/contact": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Want to get in touch with our team? I can help you reach the right person or answer your question right here. What's on your mind?",
    quickQuestions: [
      "What's your email?",
      "Where are you located?",
      "What are your hours?",
      "How do I book a court?",
      "How do I register for an event?",
      "I have a general question",
    ],
  },
  "/gallery": {
    greeting:
      "Hey! I'm your Inspire Courts assistant 🏀 Love what you see? Wait until you see it in person! Ask me anything about the facility, our events, or how to get involved.",
    quickQuestions: [
      "Tell me about the facility",
      "What events do you host?",
      "How do I get featured?",
      "How do I rent a court?",
      "What events are coming up?",
      "Where are you located?",
    ],
  },
  "/": {
    greeting:
      "What's up! 👋 I'm your personal Inspire Courts assistant. Welcome to Arizona's premier indoor basketball & volleyball facility — 52,000 sq ft, 7 courts, game film every game. I'm here to help with whatever you need. What can I do for you?",
    quickQuestions: [
      "How much to rent a court?",
      "How do I register my team?",
      "Tell me about training",
      "How do I join Team Inspire?",
      "Where are you located?",
      "What events are coming up?",
    ],
  },
};

const DEFAULT_CONTEXT = PAGE_CONTEXT["/"];

function getPageContext(pathname: string | null) {
  if (!pathname) return DEFAULT_CONTEXT;
  // Exact match first, then prefix match (e.g. /events/123 → /events)
  if (PAGE_CONTEXT[pathname]) return PAGE_CONTEXT[pathname];
  const segment = "/" + (pathname.split("/")[1] || "");
  return PAGE_CONTEXT[segment] || DEFAULT_CONTEXT;
}

function getInitialMessage(pathname: string | null): Message {
  return {
    role: "assistant",
    content: getPageContext(pathname).greeting,
  };
}

const SESSION_KEY = "inspire-chat-messages";
const SESSION_ID_KEY = "inspire-chat-session-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function loadMessages(pathname: string | null): Message[] {
  if (typeof window === "undefined") return [getInitialMessage(pathname)];
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [getInitialMessage(pathname)];
}

// ── Rich text renderer ──
// Converts plain text with \n, URLs, and basic markdown into JSX
function RichText({ text }: { text: string }) {
  const elements = useMemo(() => {
    // Split into paragraphs by double newlines
    const paragraphs = text.split(/\n{2,}/);

    return paragraphs.map((para, pIdx) => {
      // Split paragraph into lines
      const lines = para.split("\n");

      const lineElements = lines.map((line, lIdx) => {
        // Parse line into segments: text and links
        const segments: React.ReactNode[] = [];
        const urlRegex = /(https?:\/\/[^\s),]+)/g;
        let lastIndex = 0;
        let match;

        while ((match = urlRegex.exec(line)) !== null) {
          // Text before the URL
          if (match.index > lastIndex) {
            segments.push(line.slice(lastIndex, match.index));
          }
          // The URL itself — make it a clickable link
          const url = match[1];
          // Show a friendly label for known URLs
          let label = url;
          if (url.includes("youtube.com") || url.includes("youtu.be")) label = "Watch Tour →";
          else if (url.includes("instagram.com")) label = "View Profile →";
          else if (url.length > 35) label = url.slice(0, 32) + "...";

          segments.push(
            <a
              key={`${pIdx}-${lIdx}-${match.index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red underline underline-offset-2 hover:text-red-hover break-all"
            >
              {label}
            </a>
          );
          lastIndex = match.index + match[0].length;
        }

        // Remaining text after last URL
        if (lastIndex < line.length) {
          segments.push(line.slice(lastIndex));
        }

        // If line is empty, skip
        if (segments.length === 0) return null;

        return (
          <span key={`${pIdx}-${lIdx}`}>
            {lIdx > 0 && <br />}
            {segments}
          </span>
        );
      });

      return (
        <span key={pIdx} className={pIdx > 0 ? "mt-2 block" : undefined}>
          {lineElements}
        </span>
      );
    });
  }, [text]);

  return <>{elements}</>;
}

// ── Contextual follow-up suggestions based on last bot message ──
function getFollowUpSuggestions(lastBotMessage: string): string[] {
  const msg = lastBotMessage.toLowerCase();

  if (msg.includes("tournament") || msg.includes("register") || msg.includes("division")) {
    return ["What age groups?", "How much to enter?", "When's the next event?"];
  }
  if (msg.includes("rent") || msg.includes("$80") || msg.includes("court rental")) {
    return ["How do I book?", "What sports?", "Birthday party options?"];
  }
  if (msg.includes("training") || msg.includes("shooting") || msg.includes("1-on-1")) {
    return ["How do I book?", "How much is training?", "Group sessions?"];
  }
  if (msg.includes("club") || msg.includes("made hoops") || msg.includes("team inspire")) {
    return ["How do I try out?", "What ages?", "What's MADE Hoops?"];
  }
  if (msg.includes("location") || msg.includes("address") || msg.includes("gilbert")) {
    return ["What are your hours?", "Is there parking?", "Can I rent courts?"];
  }
  if (msg.includes("price") || msg.includes("cost") || msg.includes("$")) {
    return ["I want to register!", "Court rental details?", "Contact the team"];
  }
  if (msg.includes("schedule") || msg.includes("bracket")) {
    return ["How do I register?", "Where are you located?", "What age groups?"];
  }
  if (msg.includes("welcome") || msg.includes("what can i help")) {
    return []; // Don't show follow-ups on the initial greeting
  }

  return ["Tell me about events", "How much to rent?", "Contact info"];
}

export default function ChatWidget() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") || pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password";

  const pageCtx = getPageContext(pathname);

  const [open, setOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(pathname));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-open chat on first visit
  useEffect(() => {
    if (hasAutoOpened) return;
    const timer = setTimeout(() => {
      setOpen(true);
      setHasAutoOpened(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  // Track unread messages when panel is closed
  const handleNewAssistantMessage = useCallback(() => {
    if (!open) setUnreadCount((c) => c + 1);
  }, [open]);

  // Clear unread when opening
  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  // Get follow-up suggestions based on last bot message
  const followUpSuggestions = useMemo(() => {
    const lastBotMsg = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastBotMsg || messages.length <= 1) return [];
    return getFollowUpSuggestions(lastBotMsg.content);
  }, [messages]);

  // Show quick questions only on initial state (1 message = just the greeting)
  const showQuickQuestions = messages.length <= 1 && !loading;
  // Show follow-up suggestions after the first real exchange
  const showFollowUps = !showQuickQuestions && followUpSuggestions.length > 0 && !loading;

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Send full conversation history (excluding initial greeting)
      const history = updatedMessages
        .slice(1) // skip initial greeting
        .slice(-20) // last 20 messages
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: history.slice(0, -1), // don't include the message we just sent (it's in `message`)
          sessionId: getSessionId(),
          pathname: pathname || "/",
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      handleNewAssistantMessage();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, something went wrong. Email us at ${FACILITY_EMAIL} for help.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Don't show chatbot on admin, login, or password reset pages
  if (isAdmin) return null;

  return (
    <>
      {/* Chat button with pulse animation and unread badge */}
      <button
        onClick={() => { if (!open) trackConversion("chat_open"); setOpen(!open); }}
        className={cn(
          "fixed z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
          "bg-red hover:bg-red-hover text-white",
          "bottom-28 right-4 lg:bottom-6 lg:right-6",
          !hasAutoOpened && "animate-[pulse_2s_ease-in-out_infinite]"
        )}
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {unreadCount > 0 && !open && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-[100] bg-white border border-light-gray rounded-xl shadow-2xl flex flex-col",
            "bottom-44 right-4 w-[calc(100vw-2rem)] max-w-[400px] h-[min(560px,calc(100vh-12rem))]",
            "lg:bottom-24 lg:right-6",
            "animate-[slideUp_0.3s_ease-out]"
          )}
          style={{ animationFillMode: "forwards" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-light-gray bg-navy rounded-t-xl">
            <Image src="/images/inspire-athletics-logo.png" alt="Inspire Courts" width={32} height={32} className="object-contain" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold font-[var(--font-chakra)]">Inspire Assistant</p>
              <p className="text-green-400 text-xs">Your personal guide — online now</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-off-white">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-red text-white"
                    : "bg-white border border-light-gray text-text-muted shadow-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  <RichText text={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {loading && (
              <div className="bg-white border border-light-gray rounded-xl px-3.5 py-2.5 text-sm text-text-muted max-w-[85%] shadow-sm">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-navy/40 rounded-full animate-[bounce_1.4s_infinite_0ms]" />
                  <span className="w-2 h-2 bg-navy/40 rounded-full animate-[bounce_1.4s_infinite_200ms]" />
                  <span className="w-2 h-2 bg-navy/40 rounded-full animate-[bounce_1.4s_infinite_400ms]" />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions (initial state) */}
          {showQuickQuestions && (
            <div className="px-3 pb-2 bg-off-white">
              <div className="flex flex-wrap gap-1.5">
                {pageCtx.quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-white border border-light-gray text-text-muted hover:text-navy hover:border-red/50 px-2.5 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contextual follow-up suggestions (after bot responds) */}
          {showFollowUps && (
            <div className="px-3 pb-2 bg-off-white">
              <div className="flex flex-wrap gap-1.5">
                {followUpSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-red/5 border border-red/20 text-red hover:bg-red/10 hover:border-red/40 px-2.5 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-light-gray bg-white rounded-b-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about Inspire Courts..."
                className="flex-1 bg-off-white border border-light-gray rounded-full px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-red transition-colors placeholder:text-text-muted/50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-red hover:bg-red-hover disabled:opacity-50 text-white px-3 py-2.5 rounded-full transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
