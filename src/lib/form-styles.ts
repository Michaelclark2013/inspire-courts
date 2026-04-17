/**
 * Shared Tailwind class strings for form inputs.
 * Import these into any form component to keep styling consistent.
 */

export const INPUT_CLASS =
  "w-full min-h-11 bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(227,27,35,0.1)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-all duration-200 placeholder:text-text-muted/50";

/** Slightly taller variant used in multi-step forms like booking. */
export const INPUT_CLASS_LG =
  "w-full min-h-12 bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-sm focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(227,27,35,0.1)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-all duration-200 placeholder:text-text-muted/50";

export const LABEL_CLASS =
  "block text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]";

export const SELECT_CLASS =
  "w-full min-h-11 bg-off-white border border-light-gray rounded-xl px-4 py-3.5 text-navy text-sm focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(227,27,35,0.1)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-all duration-200 appearance-none cursor-pointer";

export const TEXTAREA_CLASS =
  "w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(227,27,35,0.1)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-all duration-200 placeholder:text-text-muted/50 resize-vertical";
