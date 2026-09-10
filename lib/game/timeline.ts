import type { Role } from "./types";

export type ActingRole = "cacador" | "bruxa" | "lobisomem" | "zumbi" | "vampiro";
export type NarrationBeat = ActingRole | "intro" | "amanhecer";

export interface TimelineSegment {
  key: NarrationBeat;
  start: number;
  end: number;
}
export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

/** Mechanical windows shared by every theme and enforced by the server. */
export const NIGHT_TIMELINE: readonly TimelineSegment[] = [
  { key: "intro", start: 0, end: 10.54 },
  { key: "cacador", start: 10.54, end: 26.16 },
  { key: "bruxa", start: 26.16, end: 43.94 },
  { key: "lobisomem", start: 43.94, end: 60.34 },
  { key: "zumbi", start: 60.34, end: 76.06 },
  { key: "vampiro", start: 76.06, end: 92.2 },
  { key: "amanhecer", start: 92.2, end: 98 },
];

export const NIGHT_TOTAL_SECONDS = 98;
export const WINDOW_GRACE_SECONDS = 3;

export function segmentForRole(role: Role): TimelineSegment | undefined {
  return NIGHT_TIMELINE.find((segment) => segment.key === role);
}

export function segmentAt(elapsedSeconds: number): TimelineSegment | undefined {
  return NIGHT_TIMELINE.find(
    (segment) => elapsedSeconds >= segment.start && elapsedSeconds < segment.end,
  );
}

export function subtitleAt(
  elapsedSeconds: number,
  subtitles: readonly SubtitleCue[],
): SubtitleCue | undefined {
  return subtitles.find(
    (cue) => elapsedSeconds >= cue.start && elapsedSeconds < cue.end,
  );
}
