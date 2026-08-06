"use client";

import { useEffect, useState } from "react";

/** Server-synced current time in ms, ticking at the given interval. */
export function useNow(clockOffsetMs: number, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now() + clockOffsetMs);
  useEffect(() => {
    const t = setInterval(
      () => setNow(Date.now() + clockOffsetMs),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [clockOffsetMs, intervalMs]);
  return now;
}

export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
