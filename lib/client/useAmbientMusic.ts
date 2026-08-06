"use client";

import { useEffect } from "react";
import { acquireAmbient, releaseAmbient } from "@/lib/client/ambientMusic";

/**
 * Plays looping ambient music while `active` is true (home + lobby).
 * Uses a shared audio element so home → sala keeps the same playhead.
 */
export function useAmbientMusic(active: boolean) {
  useEffect(() => {
    if (!active) return;
    acquireAmbient();
    return () => releaseAmbient();
  }, [active]);
}
