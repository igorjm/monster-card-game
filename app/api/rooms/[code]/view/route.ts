import { NextResponse } from "next/server";
import {
  ApiError,
  deleteRoom,
  findPlayerByToken,
  loadRoom,
  updateRoom,
} from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildViewResponse } from "@/lib/api/views";
import { touchLobbyPresence } from "@/lib/api/lobby-presence";
import { broadcastRoomUpdate } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** GET /api/rooms/[code]/view?token=... — personalized room view */
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/view">,
) {
  try {
    const { code } = await ctx.params;
    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!token) throw new ApiError("Token ausente.");

    let room = await loadRoom(code);
    findPlayerByToken(room, token);

    if (room.phase === "lobby") {
      const probe = touchLobbyPresence(room, token);
      if (probe === null) {
        await deleteRoom(code);
        void broadcastRoomUpdate(code, room.version + 1);
        throw new ApiError("Sala encerrada.", 404);
      }
      if (Object.keys(probe).length > 0) {
        room = await updateRoom(code, (current) => {
          if (current.phase !== "lobby") return {};
          findPlayerByToken(current, token);
          const patch = touchLobbyPresence(current, token);
          // Empty lobby after prune is extremely unlikely while caller is active;
          // treat as no-op and let the next poll 404.
          return patch === null ? {} : patch;
        });
      }
    }

    const player = findPlayerByToken(room, token);
    return NextResponse.json(await buildViewResponse(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
