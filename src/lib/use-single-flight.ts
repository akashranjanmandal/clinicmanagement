"use client";

import { useCallback, useRef } from "react";

/**
 * Guards an async action so it can only run once at a time.
 *
 * React state (e.g. `busy`) updates asynchronously, so two fast clicks or two Enter presses can both
 * start a request before the button disables. A ref flips synchronously, so the second call is
 * ignored until the first finishes (success or failure).
 */
export function useSingleFlight() {
  const running = useRef(false);
  return useCallback(async function guard<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (running.current) return undefined;
    running.current = true;
    try {
      return await action();
    } finally {
      running.current = false;
    }
  }, []);
}
