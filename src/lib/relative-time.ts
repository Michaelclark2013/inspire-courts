// Format a past ISO/Date timestamp as a short relative-time string
// (e.g. "2 hours ago", "just now"). Uses Intl.RelativeTimeFormat.

const RTF = typeof Intl !== "undefined" && Intl.RelativeTimeFormat
  ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  : null;

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
];

export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return "";
  const then = typeof input === "string" ? new Date(input) : input;
  if (isNaN(then.getTime())) return "";

  const diffSec = Math.round((then.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 45) return "just now";

  for (const { unit, seconds } of UNITS) {
    if (abs >= seconds) {
      const value = Math.round(diffSec / seconds);
      if (RTF) return RTF.format(value, unit);
      const n = Math.abs(value);
      return `${n} ${unit}${n === 1 ? "" : "s"} ${diffSec < 0 ? "ago" : "from now"}`;
    }
  }
  return "just now";
}
