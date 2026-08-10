export type Role =
  | "aldeao"
  | "lavrador"
  | "cacador"
  | "bruxa"
  | "lobisomem"
  | "mumia"
  | "esqueleto"
  | "zumbi"
  | "vampiro";

export type Team = "aliados" | "lobisomens" | "mortos-vivos" | "zumbi";

export type Phase = "lobby" | "noite" | "discussao" | "votacao" | "resultado";

export interface PlayerInfo {
  /** Public id, visible to everyone in the room (used for targeting). */
  id: string;
  /** Private auth token, known only to the player and the server. */
  token: string;
  nickname: string;
  joinedAt: string;
  /** Last lobby presence ping (ISO). Used to drop closed tabs. */
  lastSeenAt?: string;
}

export type SwapTarget =
  | { kind: "center"; index: number }
  | { kind: "player"; playerId: string };

export type NightAction =
  | { type: "zumbi_take"; centerIndex: number }
  | { type: "bruxa_look"; targetPlayerId: string }
  | { type: "cacador_take"; centerIndex: number }
  | { type: "vampiro_swap"; target: SwapTarget }
  | { type: "lobisomem_peek" };

/** Private information revealed to a single player during the night. */
export type PrivateInfo =
  | {
      kind: "lobisomens";
      wolfIds: string[];
      /** Present only while phase is noite; null = empty fixed slot. */
      center?: (Role | null)[];
    }
  | { kind: "viu_jogador"; playerId: string; role: Role }
  | { kind: "pegou_centro"; index: number; role: Role }
  | { kind: "escondeu_centro"; index: number }
  | {
      kind: "trocou";
      target: SwapTarget;
      newRole: Role;
    };

export interface GameResult {
  deadIds: string[];
  winners: Team;
  finalRoles: Record<string, Role>;
  originalRoles: Record<string, Role>;
  /** Fixed left/middle/right slots; null when taken by hunter/zombie. */
  center: (Role | null)[];
  centerOriginal: Role[];
  votes: Record<string, string>;
  /** Card the hunter hid, revealed at end of discussion. */
  hunterHidden?: Role;
}

export interface GameState {
  /** ISO timestamp when the night began (server clock). */
  nightStartedAt: string;
  discussionSeconds: number;
  /** ISO timestamp when discussion ends; set when phase becomes 'discussao'. */
  discussionEndsAt?: string;
  /**
   * When set, the shared night/discussion clock is frozen at this instant.
   * Only the host can toggle pause.
   */
  pausedAt?: string;
  originalRoles: Record<string, Role>;
  currentRoles: Record<string, Role>;
  /**
   * Always three fixed slots (left / middle / right).
   * `null` means that seat was removed by Caçador or Zumbi.
   */
  center: (Role | null)[];
  centerOriginal: Role[];
  /** Card removed by the hunter, unseen until discussion ends. */
  hunterHidden?: Role;
  /**
   * Public reveal after voting (same as hunterHidden once results land).
   * Kept secret during discussion and voting.
   */
  hunterRevealed?: Role;
  /** Set after win stats are recorded so rematches / retries do not double-count. */
  winsAwarded?: boolean;
  /** Private night info per player id. */
  privateInfo: Record<string, PrivateInfo[]>;
  /** Which players already used their night action. */
  acted: Record<string, boolean>;
  /** Zombie chained role awaiting its extra action, keyed by player id. */
  pendingChain: Record<string, Role>;
  votes: Record<string, string>;
  result?: GameResult;
}

export interface RoomSettings {
  discussionSeconds: number;
}

export interface Room {
  id: string;
  code: string;
  phase: Phase;
  host_id: string;
  settings: RoomSettings;
  players: PlayerInfo[];
  game: GameState | null;
  version: number;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 7;
export const CENTER_CARDS = 3;
