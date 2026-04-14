"use client";

import { useState } from "react";
import { Camera, ArrowRight } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import VideoShowcase from "@/components/ui/VideoShowcase";

const HIGHLIGHT_VIDEOS = [
  { id: "cOD4jknl2-E", title: "Team Inspire highlights", name: "Team Inspire", subtitle: "Tournament Highlights" },
  { id: "W84u1OuxI7M", title: "OFF SZN HOOPS tournament", name: "OFF SZN HOOPS", subtitle: "Tournament Action" },
  { id: "ZGsUk0p0CsE", title: "Game highlights", name: "AZFinestMixtape", subtitle: "Player Highlights" },
  { id: "EkIbBj3UDAg", title: "Training day at Inspire Courts", name: "Training Day", subtitle: "Inspire Courts" },
  { id: "mmbKaoOHzn4", title: "Jordan Burks training", name: "Jordan Burks", subtitle: "Training at Inspire" },
  { id: "LsB3MD2GOXA", title: "Team Inspire player highlight", name: "Player Highlight", subtitle: "Team Inspire" },
  { id: "X3okI0F8RDE", title: "Inspire Prep — Oba", name: "Inspire Prep — Oba", subtitle: "Highlights", aspect: "9/16" as const },
  { id: "Vjih-x7OBQ8", title: "Adan Diggs highlights", name: "Adan Diggs", subtitle: "Inspire Prep", aspect: "9/16" as const },
];

const TABS = ["All", "Tournaments", "Training", "Prep"] as const;

const TAB_VIDEO_MAP: Record<string, typeof HIGHLIGHT_VIDEOS> = {
  All: HIGHLIGHT_VIDEOS,
  Tournaments: HIGHLIGHT_VIDEOS.filter((v) =>
    ["cOD4jknl2-E", "W84u1OuxI7M", "ZGsUk0p0CsE"].includes(v.id)
  ),
  Training: HIGHLIGHT_VIDEOS.filter((v) =>
    ["EkIbBj3UDAg", "mmbKaoOHzn4", "LsB3MD2GOXA"].includes(v.id)
  ),
  Prep: HIGHLIGHT_VIDEOS.filter((v) =>
    ["X3okI0F8RDE", "Vjih-x7OBQ8"].includes(v.id)
  ),
};

export default function GalleryPageClient() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");

  const videos = TAB_VIDEO_MAP[activeTab];

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 justify-center mb-10 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? "bg-red text-white"
                : "bg-off-white border border-light-gray text-text-muted hover:text-navy"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <VideoShowcase videos={videos} initialCount={6} theme="light" />

      {/* Instagram CTA */}
      <section className="py-16 bg-off-white mt-12 rounded-2xl">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AnimateIn>
            <div className="w-14 h-14 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-7 h-7 text-red" aria-hidden="true" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)]">
              Want your highlights featured?
            </h2>
            <p className="text-text-muted mb-8">
              Follow{" "}
              <a
                href="https://instagram.com/inspirecourts"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-navy hover:text-red transition-colors"
              >
                @inspirecourts
              </a>{" "}
              and{" "}
              <a
                href="https://instagram.com/azfinestmixtape"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-navy hover:text-red transition-colors"
              >
                @azfinestmixtape
              </a>{" "}
              and tag us in your best plays.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://instagram.com/inspirecourts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-[var(--font-chakra)]"
              >
                @inspirecourts <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/azfinestmixtape"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-navy hover:bg-navy hover:text-white text-navy px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors font-[var(--font-chakra)]"
              >
                @azfinestmixtape <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      <div className="h-16 lg:hidden" />
    </>
  );
}
