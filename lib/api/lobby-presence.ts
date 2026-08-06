import type { PlayerInfo, Room } from "@/lib/game/types";

/** Drop lobby seats that haven't pinged recently (tab crash / killed app). */
export const LOBBY_STALE_MS = 35_000;

/** Refresh lastSeen at most this often on view polls (cuts write churn). */
export const LOBBY_TOUCH_MIN_MS = 8_000;

function seenAtMs(p: PlayerInfo): number {
  const raw = p.lastSeenAt ?? p.joinedAt;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

export function pickHostId(players: PlayerInfo[]): string {
  return [...players].sort((a, b) =>
    a.joinedAt.localeCompare(b.joinedAt),
  )[0]!.id;
}

/**
 * Remove a player from a lobby. Returns `null` when the room should be deleted
 * (no one left). Mid-game: no-op patch.
 */
export function leaveLobbyPlayer(
  room: Room,
  token: string,
): Partial<Room> | null | Record<string, never> {
  if (room.phase !== "lobby") return {};
  const leaving = room.players.find((p) => p.token === token);
  if (!leaving) return {};

  const players = room.players.filter((p) => p.token !== token);
  if (players.length === 0) return null;

  const host_id = players.some((p) => p.id === room.host_id)
    ? room.host_id
    : pickHostId(players);

  return { players, host_id };
}

/**
 * Touch the caller's lastSeenAt and prune stale lobby seats.
 * Returns `null` when the room should be deleted; `{}` when nothing changed.
 */
export function touchLobbyPresence(
  room: Room,
  token: string,
  nowMs: number = Date.now(),
): Partial<Room> | null | Record<string, never> {
  if (room.phase !== "lobby") return {};

  let changed = false;
  const nowIso = new Date(nowMs).toISOString();

  let players = room.players.map((p) => {
    if (p.token !== token) return p;
    if (nowMs - seenAtMs(p) < LOBBY_TOUCH_MIN_MS) return p;
    changed = true;
    return { ...p, lastSeenAt: nowIso };
  });

  const fresh = players.filter((p) => nowMs - seenAtMs(p) < LOBBY_STALE_MS);
  if (fresh.length !== players.length) {
    changed = true;
    players = fresh;
  }

  if (!changed) return {};
  if (players.length === 0) return null;

  const host_id = players.some((p) => p.id === room.host_id)
    ? room.host_id
    : pickHostId(players);

  return { players, host_id };
}
