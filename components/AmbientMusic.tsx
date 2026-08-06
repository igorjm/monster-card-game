"use client";

import { useAmbientMusic } from "@/lib/client/useAmbientMusic";

/** Mount on screens where the match has not started yet. */
export function AmbientMusic({ active = true }: { active?: boolean }) {
  useAmbientMusic(active);
  return null;
}
