"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type VideoItem = {
  id: string;
  title: string;
  name: string;
  subtitle: string;
  aspect?: "16/9" | "9/16";
  start?: number;
};

export default function VideoShowcase({
  videos,
  initialCount = 4,
  theme = "dark",
}: {
  videos: VideoItem[];
  initialCount?: number;
  theme?: "dark" | "light";
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? videos : videos.slice(0, initialCount);
  const hasMore = videos.length > initialCount;

  const isDark = theme === "dark";

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {visible.map((video) => {
          const isShort = video.aspect === "9/16";
          return (
            <div key={video.id} className="text-center">
              <div
                className={`relative rounded-2xl overflow-hidden shadow-2xl border ${
                  isDark ? "border-white/10" : "border-light-gray"
                } ${isShort ? "mx-auto w-full max-w-[260px] sm:max-w-[340px]" : ""}`}
                style={{ aspectRatio: video.aspect || "16/9" }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1${video.start ? `&start=${video.start}` : ""}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p
                className={`font-bold text-sm uppercase tracking-wide mt-4 font-[var(--font-chakra)] ${
                  isDark ? "text-white" : "text-navy"
                }`}
              >
                {video.name}
              </p>
              <p
                className={`text-xs uppercase tracking-wider ${
                  isDark ? "text-white/50" : "text-text-muted"
                }`}
              >
                {video.subtitle}
              </p>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-full text-sm font-bold uppercase tracking-wider transition-all font-[var(--font-chakra)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 ${
              isDark
                ? "bg-white/[0.08] hover:bg-white/[0.14] text-white/80 hover:text-white"
                : "bg-navy/[0.06] hover:bg-navy/[0.10] text-navy/70 hover:text-navy"
            }`}
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </>
            ) : (
              <>
                See All {videos.length} Videos <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
