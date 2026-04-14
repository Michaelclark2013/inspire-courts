"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Camera, ArrowRight } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const TABS = ["All", "Tournaments", "Facility", "Highlights"] as const;

const GALLERY_ITEMS = [
  { id: 1, category: "Tournaments", color: "from-red/20 to-red/5", label: "Tournament action at Inspire Courts AZ" },
  { id: 2, category: "Facility", color: "from-navy/20 to-navy/5", label: "Inspire Courts AZ indoor basketball and volleyball courts" },
  { id: 3, category: "Highlights", color: "from-green-500/20 to-green-500/5", label: "Player highlight reel from AZFinestMixtape" },
  { id: 4, category: "Tournaments", color: "from-purple-500/20 to-purple-500/5", label: "OFF SZN HOOPS tournament game action" },
  { id: 5, category: "Facility", color: "from-red/20 to-red/5", label: "Game film setup at Inspire Courts AZ" },
  { id: 6, category: "Highlights", color: "from-red-500/20 to-red-500/5", label: "Youth basketball highlights in Gilbert, AZ" },
  { id: 7, category: "Tournaments", color: "from-yellow-500/20 to-yellow-500/5", label: "Youth basketball tournament in Gilbert, AZ" },
  { id: 8, category: "Facility", color: "from-teal-500/20 to-teal-500/5", label: "Regulation hardwood courts at Inspire Courts" },
  { id: 9, category: "Highlights", color: "from-red/20 to-red/5", label: "Basketball player highlight at Inspire Courts AZ" },
];

export default function GalleryPageClient() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered =
    activeTab === "All"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === activeTab);

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/courts-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red/90 text-white text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-6 font-[var(--font-chakra)]">
              See It Live
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg">
              Gallery
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              Game action, facility shots, and tournament highlights from Inspire Courts AZ.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Photos"
            title="Tournaments, Facility & Highlights"
            description="Browse photos from OFF SZN HOOPS tournaments, the Inspire Courts facility, and player highlights by @AZFinestMixtape."
          />

          {/* Filter Tabs */}
          <div className="flex gap-2 justify-center mb-12 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-colors",
                  activeTab === tab
                    ? "bg-red text-white"
                    : "bg-off-white border border-light-gray text-text-muted hover:text-navy"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((item, i) => (
              <AnimateIn key={item.id} delay={i * 50}>
                <button
                  onClick={() => setLightbox(item.id)}
                  aria-label={item.label}
                  className={cn(
                    "w-full bg-gradient-to-br rounded-xl border border-light-gray overflow-hidden cursor-pointer hover:shadow-lg transition-shadow block",
                    item.color
                  )}
                  style={{
                    aspectRatio: i % 3 === 0 ? "4/5" : i % 3 === 1 ? "4/3" : "1/1",
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
                    {item.category}
                  </div>
                </button>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close photo lightbox"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="bg-off-white border border-light-gray rounded-xl w-full max-w-3xl aspect-[16/10] flex items-center justify-center text-text-muted">
            {GALLERY_ITEMS.find((item) => item.id === lightbox)?.label ?? "Photo"}
          </div>
        </div>
      )}

      {/* Instagram CTA */}
      <section className="py-20 bg-off-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn>
            <div className="w-14 h-14 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-7 h-7 text-red" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-navy mb-4 font-[var(--font-chakra)]">
              Want your highlights featured?
            </h2>
            <p className="text-text-muted mb-8">
              Follow @azfinestmixtape and tag us in your best plays.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://instagram.com/inspirecourtsaz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red-hover text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
              >
                @inspirecourtsaz <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/azfinestmixtape"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-navy hover:bg-navy hover:text-white text-navy px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wide transition-colors"
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
