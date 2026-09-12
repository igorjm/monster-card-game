import type { Room } from "../game/types";
import { MAX_PLAYERS } from "../game/types";
import { ApiError } from "./errors";

export type PlayerModerationAction =
  | "approve"
  | "reject"
  | "kick"
  | "block"
  | "mute"
  | "disable-camera";

export function moderateRoomPlayer(
  current: Room,
  input: { hostToken: string; playerId: string; action: PlayerModerationAction; enabled?: boolean },
): Partial<Room> {
  const host = current.players.find((player) => player.token === input.hostToken);
  if (!host) throw new ApiError("Você não está nesta sala.", 403);
  if (host.status === "pending") throw new ApiError("Aguarde a aprovação do anfitrião.", 403);
  if (host.id !== current.host_id) throw new ApiError("Apenas o anfitrião pode moderar a sala.", 403);
  if (input.playerId === host.id) throw new ApiError("Use os controles da sua conta para sair.");
  const target = current.players.find((player) => player.id === input.playerId);
  if (!target) throw new ApiError("Pessoa não encontrada.", 404);

  if (input.action === "approve") {
    const approved = current.players.filter((player) => player.status !== "pending").length;
    if (approved >= MAX_PLAYERS) throw new ApiError("A mesa já tem sete pessoas aprovadas.");
    return {
      players: current.players.map((player) =>
        player.id === target.id ? { ...player, status: "approved" as const } : player,
      ),
    };
  }
  if (["reject", "kick", "block"].includes(input.action)) {
    return {
      players: current.players.filter((player) => player.id !== target.id),
      blocked_tokens:
        input.action === "block"
          ? [...new Set([...(current.blocked_tokens ?? []), target.token])]
          : current.blocked_tokens ?? [],
    };
  }
  const media = target.media ?? { microphoneBlocked: false, cameraBlocked: false };
  return {
    players: current.players.map((player) =>
      player.id !== target.id
        ? player
        : {
            ...player,
            media: {
              ...media,
              ...(input.action === "mute"
                ? { microphoneBlocked: input.enabled !== false }
                : { cameraBlocked: input.enabled !== false }),
            },
          },
    ),
  };
}
