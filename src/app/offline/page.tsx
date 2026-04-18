"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        {/* Basketball icon */}
        <svg
          aria-hidden="true"
          className="w-24 h-24 mx-auto text-white/30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M4.93 4.93c4.08 2.03 8.16 4.07 14.14 0" />
          <path d="M4.93 19.07c4.08-2.03 8.16-4.07 14.14 0" />
          <path d="M12 2v20" />
          <path d="M2 12h20" />
        </svg>
      </div>

      <h1 className="font-chakra text-3xl font-bold text-white mb-3">
        You&apos;re Offline
      </h1>

      <p className="text-white/60 text-lg max-w-md mb-8">
        When you&apos;re back online, your tournaments, scores, and court
        bookings will be right here.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="bg-red hover:bg-red/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
