import { NIGHT_TOTAL_SECONDS, segmentAt } from "../game/timeline";
import { elapsedNightSeconds } from "../game/engine";
import type {
  GameResult,
  Phase,
  PlayerInfo,
  PrivateInfo,
  Role,
  Room,
  RoomSettings,
} from "../game/types";

export interface PublicPlayer {
  id: string;
  nickname: string;
  isHost: boolean;
  hasVoted: boolean;
  /** Career wins for this browser token (lobby ranking). */
  wins: number;
}

/** Everything a single client is allowed to know. */
export interface RoomView {
  code: string;
  phase: Phase;
  settings: RoomSettings;
  serverNow: string;
  players: PublicPlayer[];
  you: {
    id: string;
    nickname: string;
    isHost: boolean;
  };
  game: {
    nightStartedAt: string;
    nightTotalSeconds: number;
    discussionSeconds: number;
    discussionEndsAt?: string;
    yourRole: Role;
    yourInfo: PrivateInfo[];
    hasActed: boolean;
    pendingChain?: Role;
    /** Host froze the shared clock (night audio + timers). */
    paused: boolean;
    /** Server timestamp when pause began (for frozen elapsed). */
    pausedAt?: string;
    centerCount: number;
    votedCount: number;
    yourVote?: string;
    /** Public: hunter's card after discussion ends. */
    hunterRevealed?: Role;
    result?: GameResult;
  } | null;
}

/**
 * Strip secrets that must not linger on screen:
 * - Witch peeks (`viu_jogador`): only during her night window, or at results.
 * - Werewolf center cards: only during the lobisomem night window.
 */
export function filterPrivateInfo(
  info: PrivateInfo[],
  phase: Phase,
  opts: {
    originalRole?: Role;
    /** Current night timeline key (only relevant while phase === noite). */
    segmentKey?: string;
  } = {},
): PrivateInfo[] {
  const peekAllowed =
    phase === "resultado" ||
    (phase === "noite" &&
      ((opts.segmentKey === "bruxa" && opts.originalRole === "bruxa") ||
        (opts.segmentKey === "zumbi" && opts.originalRole === "zumbi")));

  let next = peekAllowed
    ? info
    : info.filter((item) => item.kind !== "viu_jogador");

  const wolfCenterAllowed =
    phase === "noite" && opts.segmentKey === "lobisomem";

  if (!wolfCenterAllowed) {
    next = next.map((item) => {
      if (item.kind === "lobisomens") {
        return { kind: "lobisomens", wolfIds: item.wolfIds };
      }
      return item;
    });
  }

  return next;
}

export function buildView(
  room: Room,
  player: PlayerInfo,
  winsByPlayerId: Record<string, number> = {},
): RoomView {
  const game = room.game;
  const nightElapsed = game ? elapsedNightSeconds(game) : 0;
  const segmentKey =
    room.phase === "noite" ? segmentAt(nightElapsed)?.key : undefined;

  return {
    code: room.code,
    phase: room.phase,
    settings: room.settings,
    serverNow: new Date().toISOString(),
    players: room.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      isHost: p.id === room.host_id,
      hasVoted: game ? p.id in game.votes : false,
      wins: winsByPlayerId[p.id] ?? 0,
    })),
    you: {
      id: player.id,
      nickname: player.nickname,
      isHost: player.id === room.host_id,
    },
    game: game
      ? {
          nightStartedAt: game.nightStartedAt,
          nightTotalSeconds: NIGHT_TOTAL_SECONDS,
          discussionSeconds: game.discussionSeconds,
          discussionEndsAt: game.discussionEndsAt,
          yourRole: game.originalRoles[player.id],
          yourInfo: filterPrivateInfo(
            game.privateInfo[player.id] ?? [],
            room.phase,
            {
              originalRole: game.originalRoles[player.id],
              segmentKey,
            },
          ),
          hasActed: !!game.acted[player.id],
          pendingChain: game.pendingChain[player.id],
          paused: Boolean(game.pausedAt),
          pausedAt: game.pausedAt,
          centerCount: game.center.length,
          votedCount: Object.keys(game.votes).length,
          yourVote: game.votes[player.id],
          hunterRevealed:
            room.phase === "resultado" ? game.hunterRevealed : undefined,
          result: room.phase === "resultado" ? game.result : undefined,
        }
      : null,
  };
}

/** Room view with career wins attached for lobby ranking. */
export async function buildViewResponse(room: Room, player: PlayerInfo) {
  const { winsByPlayerId } = await import("./player-stats");
  const wins = await winsByPlayerId(room.players);
  return buildView(room, player, wins);
}
