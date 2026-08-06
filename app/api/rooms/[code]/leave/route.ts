import { NextResponse } from "next/server";
import {
  ApiError,
  deleteRoom,
  loadRoom,
  updateRoom,
} from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { leaveLobbyPlayer } from "@/lib/api/lobby-presence";
import { broadcastRoomUpdate } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * POST /api/rooms/[code]/leave — Body: { token }
 * Removes the player from a lobby (browser close / navigate away).
 * Mid-game is a no-op so seats stay fixed for the match.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/leave">,
) {
  try {
    const { code } = await ctx.params;
    const { token } = (await req.json()) as { token?: string };
    if (!token) throw new ApiError("Token ausente.");

    const current = await loadRoom(code);
    if (current.phase !== "lobby") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const stillHere = current.players.some((p) => p.token === token);
    if (!stillHere) {
      return NextResponse.json({ ok: true });
    }

    const remaining = current.players.filter((p) => p.token !== token);
    if (remaining.length === 0) {
      await deleteRoom(code);
      void broadcastRoomUpdate(code, current.version + 1);
      return NextResponse.json({ ok: true, deleted: true });
    }

    await updateRoom(code, (room) => {
      const patch = leaveLobbyPlayer(room, token);
      return patch === null ? {} : patch;
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
