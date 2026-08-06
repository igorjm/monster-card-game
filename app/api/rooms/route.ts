import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ApiError, generateRoomCode, insertRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";
import type { PlayerInfo } from "@/lib/game/types";

export const runtime = "nodejs";

/** POST /api/rooms — create a room. Body: { nickname, token } */
export async function POST(req: Request) {
  try {
    const { nickname, token } = await req.json();
    const name = String(nickname ?? "").trim().slice(0, 16);
    if (!name) throw new ApiError("Digite um apelido.");
    if (!token) throw new ApiError("Token ausente.");

    const host: PlayerInfo = {
      id: randomUUID(),
      token: String(token),
      nickname: name,
      joinedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };

    // Retry a few times in case of a room code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const room = await insertRoom({
          code: generateRoomCode(),
          phase: "lobby",
          host_id: host.id,
          settings: { discussionSeconds: 300 },
          players: [host],
          game: null,
        });
        return NextResponse.json(buildView(room, host));
      } catch (e) {
        if (attempt === 4) throw e;
      }
    }
    throw new ApiError("Erro ao criar a sala.", 500);
  } catch (e) {
    return errorResponse(e);
  }
}
