import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns schedule(fn, ms) – timeouts that are all cleared on unmount –
 * plus clearAll() to cancel pending ones early.
 */
export function useTimeouts() {
  const ids = useRef(new Set());

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);

  const clearAll = useCallback(() => {
    ids.current.forEach(clearTimeout);
    ids.current.clear();
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { schedule, clearAll };
}

/**
 * Runs a list of [delayMs, fn] steps once when the component mounts
 * (or when deps change). Safe under React StrictMode: timers are cleared and
 * re-created, so nothing fires twice.
 */
export function useTimeline(steps, deps = []) {
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  useEffect(() => {
    const ids = stepsRef.current.map(([ms, fn], i) => setTimeout(() => stepsRef.current[i]?.[1]?.(), ms));
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
