import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildViewResponse } from "@/lib/api/views";
import { dealGame } from "@/lib/game/engine";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game/types";

export const runtime = "nodejs";

/** POST /api/rooms/[code]/start — Body: { token, discussionSeconds } */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/start">,
) {
  try {
    const { code } = await ctx.params;
    const { token, discussionSeconds } = await req.json();

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, token);
      if (player.id !== current.host_id) {
        throw new ApiError("Apenas o anfitrião pode iniciar a partida.", 403);
      }
      if (current.phase !== "lobby") {
        throw new ApiError("A partida já começou.");
      }
      if (
        current.players.length < MIN_PLAYERS ||
        current.players.length > MAX_PLAYERS
      ) {
        throw new ApiError(
          `A partida precisa de ${MIN_PLAYERS} a ${MAX_PLAYERS} jogadores.`,
        );
      }
      const seconds = Math.min(600, Math.max(60, Number(discussionSeconds) || 300));
      return {
        phase: "noite" as const,
        settings: { discussionSeconds: seconds },
        game: dealGame(current.players, seconds),
      };
    });

    const player = findPlayerByToken(room, token);
    return NextResponse.json(await buildViewResponse(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
