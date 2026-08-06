import { NIGHT_TOTAL_SECONDS } from "@/lib/game/timeline";
import type {
  GameResult,
  Phase,
  PlayerInfo,
  PrivateInfo,
  Role,
  Room,
  RoomSettings,
} from "@/lib/game/types";

export interface PublicPlayer {
  id: string;
  nickname: string;
  isHost: boolean;
  hasVoted: boolean;
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
    centerCount: number;
    votedCount: number;
    yourVote?: string;
    /** Public: hunter's card after discussion ends. */
    hunterRevealed?: Role;
    result?: GameResult;
  } | null;
}

/** Werewolves may only see center cards during the night. */
function filterPrivateInfo(
  info: PrivateInfo[],
  phase: Phase,
): PrivateInfo[] {
  if (phase === "noite") return info;
  return info.map((item) => {
    if (item.kind === "lobisomens") {
      return { kind: "lobisomens", wolfIds: item.wolfIds };
    }
    return item;
  });
}

export function buildView(room: Room, player: PlayerInfo): RoomView {
  const game = room.game;
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
          ),
          hasActed: !!game.acted[player.id],
          pendingChain: game.pendingChain[player.id],
          centerCount: game.center.length,
          votedCount: Object.keys(game.votes).length,
          yourVote: game.votes[player.id],
          hunterRevealed:
            room.phase === "votacao" || room.phase === "resultado"
              ? game.hunterRevealed
              : undefined,
          result: room.phase === "resultado" ? game.result : undefined,
        }
      : null,
  };
}
