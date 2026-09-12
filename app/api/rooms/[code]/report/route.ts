import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, loadRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const body = (await req.json()) as {
      token?: string;
      playerId?: string;
      category?: string;
      details?: string;
    };
    if (!body.token || !body.category) throw new ApiError("Relato incompleto.");
    const room = await loadRoom(code);
    const reporter = findPlayerByToken(room, body.token, true);
    if (body.playerId && !room.players.some((player) => player.id === body.playerId)) {
      throw new ApiError("Pessoa não encontrada.");
    }
    const { error } = await adminClient().from("safety_reports").insert({
      room_code: room.code,
      reporter_player_id: reporter.id,
      reported_player_id: body.playerId ?? null,
      category: String(body.category).slice(0, 40),
      details: String(body.details ?? "").slice(0, 1000),
    });
    if (error) throw new ApiError("Não foi possível enviar o relato.", 500);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
