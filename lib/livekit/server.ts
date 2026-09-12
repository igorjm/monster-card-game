import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";

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
  return `mesa-${code.toUpperCase()}`;
}

/** Private werewolf conspiracy room (only during the lobisomem night window). */
export function wolfVoiceRoomName(code: string): string {
  return `mesa-${code.toUpperCase()}-private`;
}

export async function createVoiceToken(opts: {
  roomName: string;
  identity: string;
  name: string;
  canMicrophone?: boolean;
  canCamera?: boolean;
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
  const publishSources = [
    ...(opts.canMicrophone === false ? [] : [TrackSource.MICROPHONE]),
    ...(opts.canCamera === false ? [] : [TrackSource.CAMERA]),
  ];
  at.addGrant({
    roomJoin: true,
    room: opts.roomName,
    canPublish: publishSources.length > 0,
    canPublishSources: publishSources,
    canSubscribe: true,
    canPublishData: false,
  });
  return at.toJwt();
}

function roomService(): RoomServiceClient | null {
  if (!livekitConfigured()) return null;
  const url = livekitUrl().replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  return new RoomServiceClient(url, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
}

export async function disconnectVoiceParticipant(code: string, identity: string) {
  const service = roomService();
  if (!service) return;
  await Promise.allSettled([
    service.removeParticipant(voiceRoomName(code), identity),
    service.removeParticipant(wolfVoiceRoomName(code), identity),
  ]);
}

export async function syncVoicePermissions(input: {
  code: string;
  identity: string;
  microphone: boolean;
  camera: boolean;
}) {
  const service = roomService();
  if (!service) return;
  const sources = [
    ...(input.microphone ? [TrackSource.MICROPHONE] : []),
    ...(input.camera ? [TrackSource.CAMERA] : []),
  ];
  await Promise.allSettled([
    service.updateParticipant(voiceRoomName(input.code), input.identity, undefined, {
      canPublish: sources.length > 0,
      canPublishSources: sources,
    }),
    service.updateParticipant(wolfVoiceRoomName(input.code), input.identity, undefined, {
      canPublish: input.microphone,
      canPublishSources: input.microphone ? [TrackSource.MICROPHONE] : [],
    }),
  ]);
}
