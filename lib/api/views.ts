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
    result?: GameResult;
  } | null;
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
          yourInfo: game.privateInfo[player.id] ?? [],
          hasActed: !!game.acted[player.id],
          pendingChain: game.pendingChain[player.id],
          centerCount: game.center.length,
          votedCount: Object.keys(game.votes).length,
          yourVote: game.votes[player.id],
          result: room.phase === "resultado" ? game.result : undefined,
        }
      : null,
  };
}
