import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, loadRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { elapsedNightSeconds } from "@/lib/game/engine";
import { segmentForRole, WINDOW_GRACE_SECONDS } from "@/lib/game/timeline";
import {
  createVoiceToken,
  livekitConfigured,
  livekitUrl,
  voiceRoomName,
  wolfVoiceRoomName,
} from "@/lib/livekit/server";

export const runtime = "nodejs";

/**
 * POST /api/rooms/[code]/voice — Body: { token, channel?: "main" | "wolves" }
 * - main: village A/V (including muted night keep-alive)
 * - wolves: private pack room (only during lobisomem window, 2+ player wolves)
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
    const body = (await req.json()) as {
      token?: string;
      channel?: "main" | "wolves";
    };
    if (!body.token) throw new ApiError("Token ausente.");

    const room = await loadRoom(code);
    const player = findPlayerByToken(room, body.token);
    const channel = body.channel === "wolves" ? "wolves" : "main";

    if (channel === "wolves") {
      if (room.phase !== "noite" || !room.game) {
        throw new ApiError("A alcateia só se encontra durante a noite.");
      }
      if (room.game.originalRoles[player.id] !== "lobisomem") {
        throw new ApiError("Só lobisomens entram na alcateia.");
      }
      const wolfPlayerIds = Object.entries(room.game.originalRoles)
        .filter(([, role]) => role === "lobisomem")
        .map(([id]) => id);
      if (wolfPlayerIds.length < 2) {
        throw new ApiError("Não há outro lobisomem jogador nesta partida.");
      }
      const elapsed = elapsedNightSeconds(room.game);
      const wolfSeg = segmentForRole("lobisomem");
      if (
        !wolfSeg ||
        elapsed < wolfSeg.start ||
        elapsed > wolfSeg.end + WINDOW_GRACE_SECONDS
      ) {
        throw new ApiError("A janela dos lobisomens já passou.");
      }
    }

    const roomName =
      channel === "wolves"
        ? wolfVoiceRoomName(room.code)
        : voiceRoomName(room.code);
    const jwt = await createVoiceToken({
      roomName,
      identity: player.id,
      name: player.nickname,
    });

    return NextResponse.json({
      url: livekitUrl(),
      token: jwt,
      roomName,
      channel,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
