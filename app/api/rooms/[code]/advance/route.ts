import { NextResponse } from "next/server";
import { findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";
import { elapsedNightSeconds } from "@/lib/game/engine";
import { NIGHT_TOTAL_SECONDS } from "@/lib/game/timeline";

export const runtime = "nodejs";

/**
 * POST /api/rooms/[code]/advance — Body: { token, force? }
 * Moves noite -> discussao when the night timer ends, and
 * discussao -> votacao when the discussion timer ends.
 * The host may pass force=true to end the discussion early.
 * Idempotent: safe for every client to call.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/advance">,
) {
  try {
    const { code } = await ctx.params;
    const { token, force } = await req.json();

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, token);
      const game = current.game;
      if (!game) return {};

      if (current.phase === "noite") {
        if (elapsedNightSeconds(game) < NIGHT_TOTAL_SECONDS - 1) return {};
        return {
          phase: "discussao" as const,
          game: {
            ...game,
            discussionEndsAt: new Date(
              Date.now() + game.discussionSeconds * 1000,
            ).toISOString(),
          },
        };
      }

      if (current.phase === "discussao") {
        const ended =
          game.discussionEndsAt &&
          Date.now() >= new Date(game.discussionEndsAt).getTime() - 1000;
        const hostForced = force && player.id === current.host_id;
        if (!ended && !hostForced) return {};
        return { phase: "votacao" as const };
      }

      return {};
    });

    const player = findPlayerByToken(room, token);
    return NextResponse.json(buildView(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
