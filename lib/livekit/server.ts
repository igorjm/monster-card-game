import { AccessToken } from "livekit-server-sdk";

export function livekitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET,
  );
}

export function livekitUrl(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) throw new Error("LIVEKIT_URL ausente.");
  return url;
}

/**
 * Main village voice room — whole visit (muted during night).
 * Werewolves use a separate pack room during their night window.
 */
export function voiceRoomName(code: string): string {
  return `monstros-${code.toUpperCase()}`;
}

/** Private werewolf conspiracy room (only during the lobisomem night window). */
export function wolfVoiceRoomName(code: string): string {
  return `monstros-${code.toUpperCase()}-wolves`;
}

export async function createVoiceToken(opts: {
  roomName: string;
  identity: string;
  name: string;
}): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY / LIVEKIT_API_SECRET ausentes.");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: "2h",
  });
  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
  });
  return at.toJwt();
}
