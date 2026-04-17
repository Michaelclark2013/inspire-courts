"use client";

import { ExternalLink } from "lucide-react";
import { memo } from "react";

const NOTION_URL =
  "https://receptive-garage-315.notion.site/a9ade37afede4d299b43707e3f4f97b5?v=a4e7fb8f098e4388b2d69e228cd110ee";

function NotionLinkButtonBase() {
  return (
    <a
      href={NOTION_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-navy/60 hover:text-navy text-xs font-semibold uppercase tracking-wider px-3 sm:px-4 py-2 border border-border rounded-lg hover:border-navy/30 transition-colors focus-visible:ring-2 focus-visible:ring-red focus-visible:outline-none min-h-[44px] sm:min-h-0"
      aria-label="Open Notion Check-In Sheet in a new tab"
    >
      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Check-In Sheet</span>
      <span className="sm:hidden">Sheet</span>
    </a>
  );
}

export default memo(NotionLinkButtonBase);
