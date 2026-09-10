"use client";

import { useAmbientMusic } from "@/lib/client/useAmbientMusic";
import { useTheme } from "@/components/theme/ThemeProvider";

/** Mount on screens where the match has not started yet. */
export function AmbientMusic({ active = true }: { active?: boolean }) {
  const theme = useTheme();
  useAmbientMusic(active, theme.ambient.audioSrc, theme.ambient.volume);
  return null;
}
