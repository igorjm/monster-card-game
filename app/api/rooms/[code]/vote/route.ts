import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildView } from "@/lib/api/views";
import { resolveVotes, shouldRestartDebate } from "@/lib/game/engine";

export const runtime = "nodejs";

/** POST /api/rooms/[code]/vote — Body: { token, targetId } */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/rooms/[code]/vote">,
) {
  try {
    const { code } = await ctx.params;
    const { token, targetId } = await req.json();

    const room = await updateRoom(code, (current) => {
      const player = findPlayerByToken(current, token);
      const game = current.game;
      if (current.phase !== "votacao" || !game) {
        throw new ApiError("Não é hora de votar.");
      }
      if (game.votes[player.id]) {
        throw new ApiError("Você já votou.");
      }
      if (targetId === player.id) {
        throw new ApiError("Você não pode votar em si mesmo.");
      }
      if (!current.players.some((p) => p.id === targetId)) {
        throw new ApiError("Voto inválido.");
      }

      const votes = { ...game.votes, [player.id]: String(targetId) };
      const everyoneVoted = current.players.every((p) => votes[p.id]);
      const next = { ...game, votes };

      if (!everyoneVoted) {
        return { game: next };
      }

      const playerIds = current.players.map((p) => p.id);
      if (shouldRestartDebate(votes, playerIds)) {
        // Rule sheet: every player got exactly one vote → restart debate.
        return {
          phase: "discussao" as const,
          game: {
            ...next,
            votes: {},
            pausedAt: undefined,
            discussionEndsAt: new Date(
              Date.now() + next.discussionSeconds * 1000,
            ).toISOString(),
          },
        };
      }

      return {
        phase: "resultado" as const,
        game: {
          ...next,
          // Reveal the hunter card only with the final results.
          hunterRevealed: next.hunterHidden,
          result: resolveVotes(next),
        },
      };
    });

    const player = findPlayerByToken(room, token);
    return NextResponse.json(buildView(room, player));
  } catch (e) {
    return errorResponse(e);
  }
}
