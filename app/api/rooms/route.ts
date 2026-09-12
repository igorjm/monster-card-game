import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ApiError, generateRoomCode, insertRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildViewResponse } from "@/lib/api/views";
import type { PlayerInfo } from "@/lib/game/types";
import { resolveRoomCreationTheme } from "@/lib/api/room-creation";
import { requireAdultHost } from "@/lib/supabase/auth";
import { assertThemeOwned } from "@/lib/commercial/entitlements";

export const runtime = "nodejs";

/** POST /api/rooms — create a room. Body: { nickname, token, themeId } */
export async function POST(req: Request) {
  try {
    const account = await requireAdultHost(req);
    const { nickname, token, themeId } = await req.json();
    const name = String(nickname ?? "").trim().slice(0, 16);
    if (!name) throw new ApiError("Digite um apelido.");
    if (!token) throw new ApiError("Token ausente.");
    const selectedThemeId = resolveRoomCreationTheme(themeId);
    await assertThemeOwned(account.id, selectedThemeId);

    const host: PlayerInfo = {
      id: randomUUID(),
      token: String(token),
      nickname: name,
      joinedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      status: "approved",
      media: { microphoneBlocked: false, cameraBlocked: false },
    };

    // Retry a few times in case of a room code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const room = await insertRoom({
          code: generateRoomCode(),
          theme_id: selectedThemeId,
          phase: "lobby",
          host_id: host.id,
          host_user_id: account.id,
          settings: { discussionSeconds: 300 },
          media_policy: {
            microphoneAllowed: true,
            cameraAllowed: true,
            cameraMaxHeight: 360,
            cameraDisabledDuringNight: true,
            recordingAllowed: false,
          },
          blocked_tokens: [],
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          players: [host],
          game: null,
        });
        return NextResponse.json(await buildViewResponse(room, host));
      } catch (e) {
        if (attempt === 4) throw e;
      }
    }
    throw new ApiError("Erro ao criar a sala.", 500);
  } catch (e) {
    return errorResponse(e);
  }
}
