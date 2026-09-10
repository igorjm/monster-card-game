import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildViewResponse } from "@/lib/api/views";
import { selectRoomTheme } from "@/lib/api/theme-selection";

export const runtime = "nodejs";

/** POST /api/rooms/[code]/theme — host-only while the room is in the lobby. */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/theme">,
) {
  try {
    const { code } = await ctx.params;
    const { token, themeId } = await req.json();
    if (!token) throw new ApiError("Token ausente.");

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, String(token));
      return selectRoomTheme(current, player.id, themeId);
    });
    const player = findPlayerByToken(room, String(token));
    return NextResponse.json(await buildViewResponse(room, player));
  } catch (error) {
    return errorResponse(error);
  }
}

