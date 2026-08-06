import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";
import { setGamePaused } from "@/lib/game/engine";

export const runtime = "nodejs";

/**
 * POST /api/rooms/[code]/pause — Body: { token, paused: boolean }
 * Host freezes/unfreezes the shared night or discussion clock for everyone.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/pause">,
) {
  try {
    const { code } = await ctx.params;
    const { token, paused } = (await req.json()) as {
      token: string;
      paused: boolean;
    };

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, token);
      if (player.id !== current.host_id) {
        throw new ApiError("Só o anfitrião pode pausar a partida.");
      }
      if (!current.game) {
        throw new ApiError("Nenhuma partida em andamento.");
      }
      if (current.phase !== "noite" && current.phase !== "discussao") {
        throw new ApiError("Só é possível pausar durante a noite ou discussão.");
      }
      return {
        game: setGamePaused(current.game, Boolean(paused)),
      };
    });

    const player = findPlayerByToken(room, token);
    return NextResponse.json(buildView(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
