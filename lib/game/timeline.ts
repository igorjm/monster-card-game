import type { Role } from "./types";

export interface TimelineSegment {
  /** Role acting in this window, or a narrative beat. */
  key: Role | "intro" | "amanhecer";
  /** Window start/end in seconds from the beginning of the night. */
  start: number;
  end: number;
  /** Narration spoken/displayed to everyone. */
  narration: string;
  /** Extra line shown only to the acting role. */
  actorPrompt?: string;
}

/**
 * Night timeline (~1m40s). When the real audio file arrives, drop it in
 * public/audio/noite.mp3 and adjust the start/end timestamps below to match.
 */
export const NIGHT_TIMELINE: TimelineSegment[] = [
  {
    key: "intro",
    start: 0,
    end: 10,
    narration:
      "A noite cai sobre a vila... Todos fecham os olhos e mergulham na escuridão.",
  },
  {
    key: "lobisomem",
    start: 10,
    end: 25,
    narration:
      "Lobisomens, acordem! Reconheçam uns aos outros e espiem as cartas do centro.",
    actorPrompt: "Veja seus companheiros e as cartas do centro.",
  },
  {
    key: "zumbi",
    start: 25,
    end: 45,
    narration:
      "Zumbi, levante-se do túmulo! Pegue uma carta do centro e assuma o papel dela... e faça a ação do novo papel.",
    actorPrompt: "Escolha uma carta do centro para devorar.",
  },
  {
    key: "vampiro",
    start: 45,
    end: 62,
    narration:
      "Vampiro, saia do seu caixão! Troque sua carta com a de um jogador ou do centro e assuma o novo papel.",
    actorPrompt: "Escolha com quem trocar sua carta.",
  },
  {
    key: "bruxa",
    start: 62,
    end: 76,
    narration: "Bruxa, desperte! Você pode olhar a carta de um jogador.",
    actorPrompt: "Escolha um jogador para espiar.",
  },
  {
    key: "cacador",
    start: 76,
    end: 90,
    narration:
      "Caçador, é a sua vez! Pegue uma carta do centro e esconda-a, deixando a sua no lugar.",
    actorPrompt: "Escolha uma carta do centro para pegar.",
  },
  {
    key: "amanhecer",
    start: 90,
    end: 100,
    narration:
      "O sol nasce sobre a vila... Todos abrem os olhos. Quem será o monstro entre vocês?",
  },
];

export const NIGHT_TOTAL_SECONDS = 100;

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
