import { NextResponse } from "next/server";
import { ApiError, findPlayerByToken, updateRoom } from "@/lib/api/room-store";
import { errorResponse } from "@/lib/api/respond";
import { buildViewResponse } from "@/lib/api/views";
import { disconnectVoiceParticipant, syncVoicePermissions } from "@/lib/livekit/server";
import { moderateRoomPlayer, type PlayerModerationAction } from "@/lib/api/room-safety";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const body = (await req.json()) as {
      token?: string;
      playerId?: string;
      action?: PlayerModerationAction;
      enabled?: boolean;
    };
    if (!body.token || !body.playerId || !body.action) throw new ApiError("Ação incompleta.");

    const token = body.token;
    const action = body.action;
    const playerId = body.playerId;
    const room = await updateRoom(code, (current) =>
      moderateRoomPlayer(current, {
        hostToken: token,
        playerId,
        action,
        enabled: body.enabled,
      }),
    );
    if (["reject", "kick", "block"].includes(action)) {
      await disconnectVoiceParticipant(room.code, playerId);
    } else if (action === "mute" || action === "disable-camera") {
      const target = room.players.find((player) => player.id === playerId);
      if (target) {
        await syncVoicePermissions({
          code: room.code,
          identity: target.id,
          microphone: room.media_policy?.microphoneAllowed !== false && !target.media?.microphoneBlocked,
          camera: room.phase !== "noite" && room.media_policy?.cameraAllowed !== false && !target.media?.cameraBlocked,
        });
      }
    }
    const host = findPlayerByToken(room, token);
    return NextResponse.json(await buildViewResponse(room, host));
  } catch (error) {
    return errorResponse(error);
  }
}
