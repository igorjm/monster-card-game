import type { Room } from "livekit-client";

/** Active LiveKit room (talk phases). Cleared when night starts so cams don’t linger. */
let activeRoom: Room | null = null;

export function registerLiveKitRoom(room: Room | null) {
  activeRoom = room;
}

/** Stop publishing and disconnect — used when night starts or the A/V UI unmounts. */
export async function shutdownLiveKitMedia() {
  const room = activeRoom;
  activeRoom = null;
  if (!room) return;

  try {
    const local = room.localParticipant;
    await local.setCameraEnabled(false).catch(() => {});
    await local.setMicrophoneEnabled(false).catch(() => {});
    for (const pub of local.videoTrackPublications.values()) {
      pub.track?.stop();
    }
    for (const pub of local.audioTrackPublications.values()) {
      pub.track?.stop();
    }
  } catch {
    /* already torn down */
  }

  try {
    await room.disconnect();
  } catch {
    /* already disconnected */
  }
}
