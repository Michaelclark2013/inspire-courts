// First-touch attribution persistence.
//
// A visitor lands on /basketball?utm_source=instagram&utm_campaign=summer,
// browses for 5 minutes, then submits an inquiry from /inquire/training.
// Without persistence the inquiry source is just "inquire/training" and
// the Instagram campaign attribution is lost. We grab utm_* on first hit
// and stash it in localStorage with a 30-day TTL so any inquiry submission
// inside that window inherits the attribution.
//
// Why first-touch and not last-touch? Sports memberships are a months-long
// consideration cycle. The Instagram ad that put us on the map weeks ago
// is the campaign that earned the inquiry, even if the conversion landed
// from organic search.

const KEY = "ic-first-touch";
const TTL_MS = 30 * 86_400_000; // 30 days

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
  landingPath?: string;
  capturedAt: string;
};

function readUrl(): Attribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") || undefined;
  const utmMedium = params.get("utm_medium") || undefined;
  const utmCampaign = params.get("utm_campaign") || undefined;
  const utmTerm = params.get("utm_term") || undefined;
  const utmContent = params.get("utm_content") || undefined;
  const hasUtm = utmSource || utmMedium || utmCampaign || utmTerm || utmContent;
  if (!hasUtm) return null;
  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
    referrer: document.referrer || undefined,
    landingPath: window.location.pathname || undefined,
    capturedAt: new Date().toISOString(),
  };
}

function readStorage(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed?.capturedAt) return null;
    if (Date.now() - new Date(parsed.capturedAt).getTime() > TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Capture first-touch attribution from the current URL and persist it.
 * No-op if URL has no utm_* params or if we already have a stored,
 * still-valid attribution (first-touch wins; last-touch is ignored).
 */
export function captureFirstTouchAttribution(): void {
  if (typeof window === "undefined") return;
  const fromUrl = readUrl();
  if (!fromUrl) return;
  const existing = readStorage();
  if (existing) return; // first-touch wins
  try {
    window.localStorage.setItem(KEY, JSON.stringify(fromUrl));
  } catch {
    /* private mode / quota — fall back to URL-only at submit time */
  }
}

/**
 * Get the visitor's attribution. Prefers current-URL utm (last-touch
 * for same-page submissions), falls back to first-touch storage.
 */
export function getAttribution(): Attribution | null {
  return readUrl() || readStorage();
}
