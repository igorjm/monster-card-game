import type { SubtitleCue } from "../game/timeline";
import type { ThemePalette } from "./types";

export const COUNTDOWN_CUES: readonly SubtitleCue[] = [
  { start: 16, end: 26.16, text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez." },
  { start: 32.56, end: 43.08, text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez." },
  { start: 48.52, end: 59.36, text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez." },
  { start: 65.52, end: 76.06, text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez." },
  { start: 81.06, end: 91.02, text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez." },
];

export function buildNarrationSubtitles(lines: {
  intro: string;
  cacador: string;
  bruxa: string;
  lobisomem: string;
  zumbi: string;
  vampiro: string;
  amanhecer: string;
}): readonly SubtitleCue[] {
  return [
    { start: 0, end: 6.52, text: lines.intro },
    { start: 10.54, end: 15.9, text: lines.cacador },
    COUNTDOWN_CUES[0],
    { start: 26.16, end: 32.45, text: lines.bruxa },
    COUNTDOWN_CUES[1],
    { start: 43.94, end: 48.4, text: lines.lobisomem },
    COUNTDOWN_CUES[2],
    { start: 60.34, end: 65.4, text: lines.zumbi },
    COUNTDOWN_CUES[3],
    { start: 76.06, end: 80.95, text: lines.vampiro },
    COUNTDOWN_CUES[4],
    { start: 92.2, end: 97.7, text: lines.amanhecer },
  ];
}

export const STARTER_PALETTE: ThemePalette = {
  background: "#14092b",
  backgroundSoft: "#221342",
  backgroundGlow: "#351b5e",
  surface: "#2c1a52",
  surfaceStrong: "#191019",
  primary: "#8f1d14",
  primaryStrong: "#c92f1d",
  accent: "#e8842c",
  accentSoft: "#f2a95c",
  text: "#f2e6c9",
  textMuted: "#b7a98a",
  border: "#0c0618",
  positive: "#4caf6e",
  danger: "#c92f1d",
};
