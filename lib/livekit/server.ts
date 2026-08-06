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

/** One LiveKit room per game room + talk phase (lobby or discussion). */
export function voiceRoomName(
  code: string,
  phase: "lobby" | "discussao",
): string {
  return `monstros-${code.toUpperCase()}-${phase}`;
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
