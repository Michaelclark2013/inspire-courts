"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

interface QuickScoresEmbedProps {
  src: string;
  title: string;
  className?: string;
}

export default function QuickScoresEmbed({ src, title, className = "min-h-[500px] md:min-h-[700px]" }: QuickScoresEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, 10000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loaded]);

  function handleLoad() {
    setLoaded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return (
    <div className="relative">
      {!loaded && !timedOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-off-white rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-red" />
            <p className="text-sm font-medium">Loading scores...</p>
          </div>
        </div>
      )}

      {timedOut && !loaded ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-off-white rounded-2xl">
          <p className="text-navy font-bold text-base mb-2">Live scores loading...</p>
          <p className="text-text-muted text-sm mb-5">
            If scores don&apos;t appear, visit quickscores.com directly.
          </p>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red hover:bg-red-hover text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
          >
            Open QuickScores <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <iframe
          src={src}
          title={title}
          className={`w-full border-0 ${className}`}
          style={{ border: 0 }}
          loading="lazy"
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}
