import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, loadRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import {
  createVoiceToken,
  livekitConfigured,
  livekitUrl,
  voiceRoomName,
} from "@/lib/livekit/server";

export const runtime = "nodejs";

/**
 * POST /api/rooms/[code]/voice — Body: { token }
 * Returns a LiveKit JWT for discussion-phase voice (host or player in room).
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/voice">,
) {
  try {
    if (!livekitConfigured()) {
      throw new ApiError(
        "Voz ainda não configurada neste ambiente (LiveKit).",
        503,
      );
    }

    const { code } = await ctx.params;
    const { token } = (await req.json()) as { token?: string };
    if (!token) throw new ApiError("Token ausente.");

    const room = await loadRoom(code);
    const player = findPlayerByToken(room, token);

    if (room.phase !== "discussao") {
      throw new ApiError("A voz só fica disponível na discussão.");
    }

    const roomName = voiceRoomName(room.code);
    const jwt = await createVoiceToken({
      roomName,
      identity: player.id,
      name: player.nickname,
    });

    return NextResponse.json({
      url: livekitUrl(),
      token: jwt,
      roomName,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
