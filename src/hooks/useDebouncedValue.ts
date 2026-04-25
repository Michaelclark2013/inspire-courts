import { useEffect, useState } from "react";

// useDebouncedValue — defer a fast-changing value (e.g. a search input)
// until it has been stable for `delayMs`. Used to keep admin search
// inputs from firing one /api/admin/... fetch per keystroke. AbortController
// wiring on the page still cancels in-flight requests, but the debounce
// stops us from queueing them up in the first place.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
