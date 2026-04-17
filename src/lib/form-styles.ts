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
  "w-full min-h-11 bg-off-white border border-light-gray rounded-xl px-4 pr-10 py-3.5 text-navy text-sm focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(227,27,35,0.1)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-all duration-200 appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat";

export const TEXTAREA_CLASS =
  "w-full bg-off-white border border-light-gray rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-red focus:shadow-[0_0_0_3px_rgba(227,27,35,0.1)] focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 transition-all duration-200 placeholder:text-text-muted/50 resize-vertical";

/** Error state modifier — add alongside INPUT_CLASS when validation fails.
 *  Includes a red border + the CSS shake animation defined in globals.css. */
export const INPUT_ERROR_CLASS =
  "border-red! shadow-[0_0_0_3px_rgba(204,0,0,0.1)] input-shake";
