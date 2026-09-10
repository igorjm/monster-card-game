import { ApiError } from "./errors";
import type { Room } from "../game/types";
import { isThemeSelectable, type ThemeId } from "../themes/registry";

export function selectRoomTheme(
  room: Room,
  playerId: string,
  requestedThemeId: unknown,
): { theme_id: ThemeId } {
  if (playerId !== room.host_id) {
    throw new ApiError("Apenas o anfitrião pode trocar o tema.", 403);
  }
  if (room.phase !== "lobby") {
    throw new ApiError("O tema fica bloqueado depois que a noite começa.");
  }
  if (!isThemeSelectable(requestedThemeId)) {
    throw new ApiError("Tema inválido ou indisponível.");
  }
  return { theme_id: requestedThemeId };
}
