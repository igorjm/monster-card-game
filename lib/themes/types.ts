import type { CSSProperties } from "react";
import type { Role, Team } from "../game/types";
import type { NarrationBeat, SubtitleCue } from "../game/timeline";

export type ThemeStatus = "published" | "preview";
export type SupportedLocale = "pt-BR" | "en";

export interface RolePresentation {
  name: string;
  letter: string;
  description: string;
  nightHint: string;
  /** Missing art intentionally renders the pack's generated preview artwork. */
  artSrc?: string;
  artAlt: string;
}

export interface TeamPresentation {
  name: string;
  goal: string;
  winBlurb: string;
}

export interface ThemePalette {
  background: string;
  backgroundSoft: string;
  backgroundGlow: string;
  surface: string;
  surfaceStrong: string;
  primary: string;
  primaryStrong: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  border: string;
  positive: string;
  danger: string;
}

export interface ThemePack {
  schemaVersion: 1;
  id: string;
  status: ThemeStatus;
  name: string;
  shortName: string;
  locale: SupportedLocale;
  brand: {
    title: string;
    eyebrow: string;
    subtitle?: string;
    name: string;
    tagline: string;
    description: string;
    logoSrc?: string;
    cardBackSrc?: string;
    shareText: string;
  };
  terminology: {
    center: string;
    centerPositionNames: readonly [string, string, string];
    village: string;
    wolfPack: string;
  };
  roles: Record<Role, RolePresentation>;
  teams: Record<Team, TeamPresentation>;
  rulesCopy: {
    deckSummary: string;
    intro: string;
    voting: string;
    winPriority: string;
  };
  narration: {
    audioSrc?: string;
    captionsSrc?: string;
    ttsLocale: SupportedLocale;
    segments: Record<
      NarrationBeat,
      { narration: string; actorPrompt?: string }
    >;
    subtitles: readonly SubtitleCue[];
  };
  ambient: {
    audioSrc?: string;
    volume: number;
  };
  palette: ThemePalette;
}

export type ThemeCssProperties = CSSProperties & Record<`--color-${string}`, string>;
