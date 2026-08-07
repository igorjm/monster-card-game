import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";
import { refreshAllLobbyPresence } from "@/lib/api/lobby-presence";

export const runtime = "nodejs";

/** POST /api/rooms/[code]/restart — host sends everyone back to the lobby. */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/restart">,
) {
  try {
    const { code } = await ctx.params;
    const { token } = await req.json();

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, token);
      if (player.id !== current.host_id) {
        throw new ApiError("Apenas o anfitrião pode reiniciar.", 403);
      }
      if (current.phase !== "resultado") {
        throw new ApiError("A partida ainda não terminou.");
      }
      // Refresh presence for every seat — lastSeenAt freezes mid-match, and
      // the first lobby view poll would otherwise prune the table as stale.
      return {
        phase: "lobby" as const,
        game: null,
        players: refreshAllLobbyPresence(current.players),
      };
    });

    const player = findPlayerByToken(room, token);
    return NextResponse.json(buildView(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
