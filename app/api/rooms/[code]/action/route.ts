import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";
import { ActionError, applyNightAction } from "@/lib/game/engine";
import type { NightAction } from "@/lib/game/types";

export const runtime = "nodejs";

/** POST /api/rooms/[code]/action — Body: { token, action: NightAction } */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/action">,
) {
  try {
    const { code } = await ctx.params;
    const { token, action } = (await req.json()) as {
      token: string;
      action: NightAction;
    };

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, token);
      if (current.phase !== "noite" || !current.game) {
        throw new ApiError("Não é hora de agir.");
      }
      try {
        const { state } = applyNightAction(current.game, player.id, action);
        return { game: state };
      } catch (e) {
        if (e instanceof ActionError) throw new ApiError(e.message);
        throw e;
      }
    });

    const player = findPlayerByToken(room, token);
    return NextResponse.json(buildView(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
