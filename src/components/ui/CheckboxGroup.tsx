"use client";

import { useCallback } from "react";

interface CheckboxGroupProps {
  /** All available options */
  options: string[];
  /** Currently selected values */
  selected: string[];
  /** Called when selection changes */
  onChange: (selected: string[]) => void;
  /** Group label for accessibility */
  label?: string;
  /** Layout direction */
  direction?: "row" | "column";
}

/**
 * Multi-select checkbox group with Select All / Clear All toggles.
 * Reusable across admin and portal forms (court selection, division
 * selection, etc.).
 */
export default function CheckboxGroup({
  options,
  selected,
  onChange,
  label,
  direction = "column",
}: CheckboxGroupProps) {
  const allSelected = options.length > 0 && selected.length === options.length;
  const noneSelected = selected.length === 0;

  const toggle = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [selected, onChange],
  );

  return (
    <fieldset className="space-y-2">
      {label && (
        <legend className="text-navy text-xs font-bold uppercase tracking-wider mb-2 font-[var(--font-chakra)]">
          {label}
        </legend>
      )}

      {/* Select All / Clear All */}
      {options.length > 1 && (
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => onChange([...options])}
            disabled={allSelected}
            className="text-[11px] font-semibold text-red hover:text-red-hover disabled:text-text-muted/30 disabled:hover:text-text-muted/30 disabled:cursor-default transition-colors uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 rounded"
          >
            Select All
          </button>
          <span className="text-light-gray">|</span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={noneSelected}
            className="text-[11px] font-semibold text-red hover:text-red-hover disabled:text-text-muted/30 disabled:hover:text-text-muted/30 disabled:cursor-default transition-colors uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-1 rounded"
          >
            Clear All
          </button>
          <span className="ml-auto text-[10px] text-text-muted tabular-nums">
            {selected.length}/{options.length}
          </span>
        </div>
      )}

      <div
        className={
          direction === "row"
            ? "flex flex-wrap gap-x-4 gap-y-2"
            : "flex flex-col gap-1.5"
        }
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2.5 cursor-pointer group py-1"
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="accent-red w-4 h-4 rounded border-light-gray cursor-pointer"
            />
            <span className="text-navy text-sm group-hover:text-red transition-colors">
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
