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
      "Hey! I'm your Inspire Courts assistant 🏀 Our media team does some incredible work — game film available at tournaments, player highlights, mixtapes, and social exposure. What are you interested in?",
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
      "What's up! 👋 I'm your personal Inspire Courts assistant. Welcome to Arizona's premier indoor basketball & volleyball facility — 52,000 sq ft, 7 courts, game film available at tournaments. I'm here to help with whatever you need. What can I do for you?",
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
function RichText({ text }: { text: string }) {
  const elements = useMemo(() => {
    const paragraphs = text.split(/\n{2,}/);

    return paragraphs.map((para, pIdx) => {
      const lines = para.split("\n");

      const lineElements = lines.map((line, lIdx) => {
        const segments: React.ReactNode[] = [];
        const urlRegex = /(https?:\/\/[^\s),]+)/g;
        let lastIndex = 0;
        let match;

        while ((match = urlRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            segments.push(line.slice(lastIndex, match.index));
          }
          const url = match[1];
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
              className="text-red underline underline-offset-2 hover:text-red-hover break-all font-medium"
            >
              {label}
            </a>
          );
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
          segments.push(line.slice(lastIndex));
        }

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
    return [];
  }

  return ["Tell me about events", "How much to rent?", "Contact info"];
}

export default function ChatWidget() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") || pathname?.startsWith("/portal") || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";

  const pageCtx = getPageContext(pathname);

  const [open, setOpen] = useState(false);
  const [userClosed, setUserClosed] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(pathname));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close handler — remembers the user dismissed it
  const closeChat = useCallback(() => {
    setOpen(false);
    setUserClosed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("inspire-chat-dismissed", "1");
    }
  }, []);

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

  // Auto-open chat once per session (skip if user already dismissed it)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const wasDismissed = sessionStorage.getItem("inspire-chat-dismissed") === "1";
    const isMobile = window.innerWidth < 768;
    if (isMobile || wasDismissed || userClosed) return;
    const timer = setTimeout(() => {
      setOpen(true);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const showQuickQuestions = messages.length <= 1 && !loading;
  const showFollowUps = !showQuickQuestions && followUpSuggestions.length > 0 && !loading;

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMessages
        .slice(1)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: history.slice(0, -1),
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

  if (isAdmin) return null;

  return (
    <>
      {/* ── Toggle Button ── */}
      {!open && (
        <button
          onClick={() => { trackConversion("chat_open"); setOpen(true); }}
          className={cn(
            "fixed z-[100] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
            "bg-red hover:bg-red-hover text-white",
            "shadow-xl shadow-red/25 hover:shadow-red/40",
            "bottom-6 right-4 lg:right-6",
            "hover:scale-105 active:scale-95"
          )}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className={cn(
            "fixed z-[100] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden",
            "border border-light-gray/60",
            "bottom-4 right-4 w-[calc(100vw-2rem)] max-w-[400px]",
            "h-[min(480px,calc(100vh-6rem))] lg:h-[min(600px,calc(100vh-6rem))]",
            "lg:bottom-6 lg:right-6",
            "animate-[slideUp_0.3s_ease-out_forwards]"
          )}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-navy to-navy-light">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Image src="/images/inspire-athletics-logo.png" alt="" width={24} height={24} className="object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold font-[var(--font-chakra)] leading-tight">Inspire Assistant</p>
              <p className="text-white/60 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Online now
              </p>
            </div>
            <button
              onClick={closeChat}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-off-white/50">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isFirstInGroup = i === 0 || messages[i - 1].role !== msg.role;

              return (
                <div key={i} className={cn("flex gap-2", isUser && "justify-end")}>
                  {/* Assistant avatar — first message in a group only */}
                  {!isUser && isFirstInGroup && (
                    <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Image src="/images/inspire-athletics-logo.png" alt="" width={14} height={14} className="object-contain" />
                    </div>
                  )}
                  {!isUser && !isFirstInGroup && <div className="w-6 flex-shrink-0" />}

                  <div
                    className={cn(
                      "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed",
                      isUser
                        ? "bg-red text-white rounded-2xl rounded-br-md shadow-sm"
                        : "bg-white text-text-muted rounded-2xl rounded-bl-md shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-light-gray/40"
                    )}
                  >
                    {msg.role === "assistant" ? <RichText text={msg.content} /> : msg.content}
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Image src="/images/inspire-athletics-logo.png" alt="" width={14} height={14} className="object-contain" />
                </div>
                <div className="bg-white border border-light-gray/40 rounded-2xl rounded-bl-md px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-navy/30 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-navy/30 rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-navy/30 rounded-full animate-pulse [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Quick Questions (initial state) ── */}
          {showQuickQuestions && (
            <div className="px-4 pb-2 pt-1 bg-off-white/50 border-t border-light-gray/30">
              <p className="text-[10px] uppercase tracking-wider text-text-muted/50 font-semibold mb-1.5">Quick questions</p>
              <div className="flex flex-wrap gap-1.5">
                {pageCtx.quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-white border border-light-gray/80 text-text-muted hover:bg-navy/5 hover:border-navy/20 hover:text-navy px-3 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Follow-up Suggestions ── */}
          {showFollowUps && (
            <div className="px-4 pb-2 pt-1 bg-off-white/50 border-t border-light-gray/30">
              <p className="text-[10px] uppercase tracking-wider text-text-muted/50 font-semibold mb-1.5">Related</p>
              <div className="flex flex-wrap gap-1.5">
                {followUpSuggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-red/5 border border-red/15 text-red hover:bg-red/10 hover:border-red/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Input ── */}
          <div className="px-4 py-3 border-t border-light-gray/40 bg-white">
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
                placeholder="Ask anything..."
                className="flex-1 bg-off-white border border-light-gray/60 rounded-full px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red transition-all placeholder:text-text-muted/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-busy={loading}
                aria-label="Send message"
                className="bg-red hover:bg-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-3 rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-text-muted/30 text-center mt-1.5">Powered by Inspire Courts</p>
          </div>
        </div>
      )}
    </>
  );
}
