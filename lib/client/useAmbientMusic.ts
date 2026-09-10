"use client";

import { useEffect } from "react";
import { acquireAmbient, releaseAmbient } from "@/lib/client/ambientMusic";

/**
 * Plays looping ambient music while `active` is true (home + lobby).
 * Uses a shared audio element so home → sala keeps the same playhead.
 */
export function useAmbientMusic(active: boolean, src?: string, volume = 0.18) {
  useEffect(() => {
    if (!active || !src) return;
    acquireAmbient(src, volume);
    return () => releaseAmbient();
  }, [active, src, volume]);
}
