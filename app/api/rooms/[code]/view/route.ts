import { NextResponse } from "next/server";
import { findPlayerByToken, loadRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";

export const runtime = "nodejs";

/** GET /api/rooms/[code]/view?token=... — personalized room view */
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/view">,
) {
  try {
    const { code } = await ctx.params;
    const token = new URL(req.url).searchParams.get("token") ?? "";
    const room = await loadRoom(code);
    const player = findPlayerByToken(room, token);
    return NextResponse.json(buildView(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
