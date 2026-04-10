"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "How much to rent a court?",
  "How do I register my team?",
  "Tell me about training",
  "How do I join Team Inspire?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "What's up! 👋 Welcome to Inspire Courts — Arizona's top indoor basketball facility. 7 courts, game film, live scoreboards. What can I help you with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-open chat with notification sound on first visit
  useEffect(() => {
    if (hasAutoOpened) return;
    const timer = setTimeout(() => {
      setOpen(true);
      setHasAutoOpened(true);
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Email us at mikeyclark.240@gmail.com for help.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
          "bg-red hover:bg-red-hover text-white",
          "bottom-20 right-4 lg:bottom-6 lg:right-6"
        )}
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-[100] bg-white border border-light-gray rounded-xl shadow-2xl flex flex-col",
            "bottom-36 right-4 w-[calc(100vw-2rem)] max-w-[380px] h-[500px]",
            "lg:bottom-24 lg:right-6",
            "animate-[slideUp_0.3s_ease-out]"
          )}
          style={{ animationFillMode: "forwards" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-light-gray bg-navy rounded-t-xl">
            <div className="w-8 h-8 bg-red rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold font-[var(--font-chakra)]">Inspire Courts</p>
              <p className="text-green-400 text-xs">Online now</p>
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
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-red text-white"
                    : "bg-white border border-light-gray text-text-muted shadow-sm"
                )}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-white border border-light-gray rounded-xl px-3.5 py-2.5 text-sm text-text-muted max-w-[85%] shadow-sm">
                <span className="animate-pulse">Typing...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 bg-off-white flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white border border-light-gray text-text-muted hover:text-navy hover:border-red/50 px-2.5 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
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
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
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
