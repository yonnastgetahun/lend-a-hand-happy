import { useEffect, useState } from 'react';

/**
 * useDebouncedValue returns a version of `value` that only updates after the
 * input has stopped changing for `delayMs` milliseconds.
 *
 * Useful for search inputs where the raw keystroke stream would otherwise
 * trigger a filter pass on every character.
 *
 * A delay of 0 short-circuits the timer and returns the value synchronously
 * on the next render — handy for tests that don't want to wait on real time.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

export default useDebouncedValue;
