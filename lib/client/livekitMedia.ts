import type { Room } from "livekit-client";

/** Active main LiveKit room (talk phases + muted through night). Cleared on leave. */
let activeRoom: Room | null = null;

export function registerLiveKitRoom(room: Room | null) {
  activeRoom = room;
}

/**
 * Release mic/cam hardware from the main room without disconnecting.
 * Used when werewolves briefly need devices in their private pack room.
 */
export async function releaseLiveKitDevices() {
  const room = activeRoom;
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
}

/** Stop publishing and disconnect — used when leaving the room or A/V UI unmounts. */
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
