import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ApiError, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildViewResponse } from "@/lib/api/views";
import { MAX_PLAYERS, type PlayerInfo } from "@/lib/game/types";

export const runtime = "nodejs";

/** POST /api/rooms/[code]/join — Body: { nickname, token } */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/join">,
) {
  try {
    const { code } = await ctx.params;
    const { nickname, token } = await req.json();
    const name = String(nickname ?? "").trim().slice(0, 16);
    if (!name) throw new ApiError("Digite um apelido.");
    if (!token) throw new ApiError("Token ausente.");

    let joined: PlayerInfo | null = null;
    const room = await updateRoom(code, (current) => {
      const existing = current.players.find((p) => p.token === token);
      if (existing) {
        joined = existing;
        if (current.phase === "lobby") {
          return {
            players: current.players.map((p) =>
              p.token === token
                ? { ...p, lastSeenAt: new Date().toISOString() }
                : p,
            ),
          };
        }
        return {}; // reconnecting mid-game — nothing to change
      }
      if (current.phase !== "lobby") {
        throw new ApiError("A partida já começou nesta sala.");
      }
      if (current.players.length >= MAX_PLAYERS) {
        throw new ApiError("A sala está cheia (máximo 7 jogadores).");
      }
      if (
        current.players.some(
          (p) => p.nickname.toLowerCase() === name.toLowerCase(),
        )
      ) {
        throw new ApiError("Já existe alguém com esse apelido na sala.");
      }
      joined = {
        id: randomUUID(),
        token: String(token),
        nickname: name,
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
      return { players: [...current.players, joined] };
    });

    if (!joined) throw new ApiError("Erro ao entrar na sala.", 500);
    return NextResponse.json(await buildViewResponse(room, joined));
  } catch (e) {
    return errorResponse(e);
  }
}
