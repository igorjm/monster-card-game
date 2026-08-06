import type { Role } from "./types";

export interface TimelineSegment {
  /** Role acting in this window, or a narrative beat. */
  key: Role | "intro" | "amanhecer";
  /** Window start/end in seconds from the beginning of the night. */
  start: number;
  end: number;
  /** Short line shown as context for the current beat. */
  narration: string;
  /** Extra line shown only to the acting role. */
  actorPrompt?: string;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

/** Official night narration audio (≈97.5s). */
export const NIGHT_AUDIO_SRC = "/audio/monster.m4a";

/**
 * Night timeline synced to `public/audio/monster.m4a`.
 * Order: Caçador → Bruxa → Lobisomem → Zumbi → Vampiro → amanhecer.
 */
export const NIGHT_TIMELINE: TimelineSegment[] = [
  {
    key: "intro",
    start: 0,
    end: 10.54,
    narration:
      "Em uma cidade atormentada por criaturas da noite, anoiteceu.",
  },
  {
    key: "cacador",
    start: 10.54,
    end: 26.16,
    narration: "Acorde, caçador, comece sua caça.",
    actorPrompt: "Escolha uma carta do centro para esconder — você não olha!",
  },
  {
    key: "bruxa",
    start: 26.16,
    end: 43.94,
    narration: "Acorde, bruxa, preveja o futuro de alguém.",
    actorPrompt: "Escolha um jogador para espiar a carta.",
  },
  {
    key: "lobisomem",
    start: 43.94,
    end: 60.34,
    narration: "Acorde, lobisomem, forme sua alcateia.",
    actorPrompt: "Veja seus companheiros e as cartas do centro.",
  },
  {
    key: "zumbi",
    start: 60.34,
    end: 76.06,
    narration: "Zumbi, levante e escolha o corpo do cemitério.",
    actorPrompt: "Escolha uma carta do centro para assumir — e faça a ação dela.",
  },
  {
    key: "vampiro",
    start: 76.06,
    end: 92.2,
    narration: "Acorde, vampiro, suga o sangue de uma vítima.",
    actorPrompt: "Escolha uma carta do centro ou de um jogador para trocar.",
  },
  {
    key: "amanhecer",
    start: 92.2,
    end: 98,
    narration: "Senhoras e senhores, amanheceu.",
  },
];

/**
 * Subtitles transcribed from `monster.m4a` (Whisper + manual cleanup).
 * Includes the spoken 1–10 countdowns so the UI tracks the audio exactly.
 */
export const NIGHT_SUBTITLES: SubtitleCue[] = [
  {
    start: 0,
    end: 6.52,
    text: "Em uma cidade atormentada por criaturas da noite, anoiteceu.",
  },
  {
    start: 10.54,
    end: 13.84,
    text: "Acorde, caçador, comece sua caça.",
  },
  {
    start: 16,
    end: 26.16,
    text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez.",
  },
  {
    start: 26.16,
    end: 30.64,
    text: "Acorde, bruxa, preveja o futuro de alguém.",
  },
  {
    start: 32.56,
    end: 43.08,
    text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez.",
  },
  {
    start: 43.94,
    end: 47.52,
    text: "Acorde, lobisomem, forme sua alcateia.",
  },
  {
    start: 48.52,
    end: 59.36,
    text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez.",
  },
  {
    start: 60.34,
    end: 63.7,
    text: "Zumbi, levante e escolha o corpo do cemitério.",
  },
  {
    start: 65.52,
    end: 76.06,
    text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez.",
  },
  {
    start: 76.06,
    end: 80,
    text: "Acorde, vampiro, suga o sangue de uma vítima.",
  },
  {
    start: 81.06,
    end: 91.02,
    text: "Um, dois, três, quatro, cinco, seis, sete, oito, nove, dez.",
  },
  {
    start: 92.2,
    end: 95.76,
    text: "Senhoras e senhores, amanheceu.",
  },
];

export const NIGHT_TOTAL_SECONDS = 98;

/** Grace period (seconds) accepted on each side of an action window. */
export const WINDOW_GRACE_SECONDS = 3;

export function segmentForRole(role: Role): TimelineSegment | undefined {
  return NIGHT_TIMELINE.find((s) => s.key === role);
}

export function segmentAt(elapsedSeconds: number): TimelineSegment | undefined {
  return NIGHT_TIMELINE.find(
    (s) => elapsedSeconds >= s.start && elapsedSeconds < s.end,
  );
}

export function subtitleAt(elapsedSeconds: number): SubtitleCue | undefined {
  return NIGHT_SUBTITLES.find(
    (s) => elapsedSeconds >= s.start && elapsedSeconds < s.end,
  );
}
