/**
 * Shared Tailwind class strings for form inputs.
 * Import these into any form component to keep styling consistent.
 */

export const INPUT_CLASS =
  "w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50";

/** Slightly taller variant used in multi-step forms like booking. */
export const INPUT_CLASS_LG =
  "w-full bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50";

export const LABEL_CLASS =
  "block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]";

export const SELECT_CLASS =
  "w-full bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors appearance-none cursor-pointer";

export const TEXTAREA_CLASS =
  "w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-colors placeholder:text-text-muted/50 resize-vertical";
