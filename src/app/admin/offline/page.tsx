"use client";

import Link from "next/link";

export default function AdminOfflinePage() {
  return (
    <div className="min-h-screen bg-off-white flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <svg
          className="w-20 h-20 mx-auto text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <h1 className="font-chakra text-2xl font-bold text-navy mb-3">
        You&apos;re Offline
      </h1>

      <p className="text-gray-500 text-base max-w-md mb-8">
        Score entry and check-in data will sync when you&apos;re reconnected.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.location.reload()}
          className="bg-red hover:bg-red/90 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Retry
        </button>

        <Link
          href="/admin"
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
