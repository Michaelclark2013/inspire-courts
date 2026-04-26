import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import AnimateIn from "@/components/ui/AnimateIn";
import BackToTop from "@/components/ui/BackToTop";
import QuickContactBar from "@/components/ui/QuickContactBar";
import GalleryPageClient from "./GalleryPageClient";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Photo Gallery | Inspire Courts AZ",
  description:
    "Browse tournament action, facility photos, and player highlights from Inspire Courts AZ and OFF SZN HOOPS events in Gilbert, Arizona.",
  alternates: {
    canonical: `${SITE_URL}/gallery`,
  },
  openGraph: {
    title: "Photo Gallery | Inspire Courts AZ",
    description: "Tournament action, facility photos, and player highlights from Inspire Courts AZ and OFF SZN HOOPS events.",
    url: `${SITE_URL}/gallery`,
    images: [{ url: `${SITE_URL}/images/courts-bg.jpg`, width: 1200, height: 630, alt: "Inspire Courts AZ photo gallery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Photo Gallery | Inspire Courts AZ",
    description: "Tournament action, facility photos, and player highlights from Inspire Courts AZ and OFF SZN HOOPS events.",
    images: [`${SITE_URL}/images/courts-bg.jpg`],
  },
};

const galleryBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Gallery", item: `${SITE_URL}/gallery` },
  ],
};

export default function GalleryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(galleryBreadcrumbLd) }}
      />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/courts-bg.jpg"
          alt="Inspire Courts AZ photo gallery"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/75 to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(204,0,0,0.15),transparent_60%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28 lg:py-40">
          <AnimateIn>
            <span className="inline-block bg-red text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-6 font-[var(--font-chakra)] shadow-[0_4px_20px_rgba(204,0,0,0.4)]">
              Gallery
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold uppercase tracking-tight text-white mb-6 font-[var(--font-chakra)] drop-shadow-lg leading-[0.9]">
              Photo
              <br />
              <span className="text-red">Gallery</span>
            </h1>
            <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
              See Inspire Courts in action — tournaments, training, and everything in between.
            </p>
            <div className="animate-bounce mt-4">
              <svg className="w-6 h-6 text-white/50 mx-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Gallery Content */}
      <section aria-label="Photo gallery" className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">Photos</h2>
          <GalleryPageClient />
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-16 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-red font-bold text-xs uppercase tracking-[0.2em] mb-6 text-center font-[var(--font-chakra)]">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/media"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Media
                </p>
                <p className="text-text-muted text-xs mt-0.5">Highlights, mixtapes, and game film</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/about"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  About
                </p>
                <p className="text-text-muted text-xs mt-0.5">Our story, facility, and mission</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link
              href="/events"
              className="group flex items-center justify-between bg-white border border-light-gray rounded-xl p-5 hover:border-red/40 hover:shadow-md transition-all"
            >
              <div>
                <p className="text-navy font-bold text-sm uppercase tracking-tight font-[var(--font-chakra)]">
                  Tournaments
                </p>
                <p className="text-text-muted text-xs mt-0.5">Upcoming OFF SZN HOOPS events</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <QuickContactBar subject="Gallery" label="Want photos from your event?" />
      <BackToTop />
      <div className="h-32 lg:hidden" />
    </>
  );
}
