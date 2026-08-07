import { describe, expect, it } from "vitest";
import {
  leaveLobbyPlayer,
  touchLobbyPresence,
  refreshAllLobbyPresence,
  LOBBY_STALE_MS,
} from "./lobby-presence";
import type { Room } from "@/lib/game/types";

function lobby(players: Room["players"], hostId?: string): Room {
  return {
    id: "r1",
    code: "ABCD",
    phase: "lobby",
    host_id: hostId ?? players[0]!.id,
    settings: { discussionSeconds: 300 },
    players,
    game: null,
    version: 1,
  };
}

describe("leaveLobbyPlayer", () => {
  it("removes the player and reassigns host", () => {
    const room = lobby(
      [
        {
          id: "h",
          token: "t-h",
          nickname: "Host",
          joinedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "g",
          token: "t-g",
          nickname: "Guest",
          joinedAt: "2026-01-01T00:01:00.000Z",
        },
      ],
      "h",
    );
    const patch = leaveLobbyPlayer(room, "t-h");
    expect(patch).toEqual({
      players: [room.players[1]],
      host_id: "g",
    });
  });

  it("returns null when the lobby empties", () => {
    const room = lobby([
      {
        id: "h",
        token: "t-h",
        nickname: "Host",
        joinedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(leaveLobbyPlayer(room, "t-h")).toBeNull();
  });

  it("no-ops mid-game", () => {
    const room = { ...lobby([{ id: "h", token: "t", nickname: "H", joinedAt: "x" }]), phase: "noite" as const };
    expect(leaveLobbyPlayer(room, "t")).toEqual({});
  });
});

describe("touchLobbyPresence", () => {
  it("prunes stale seats and keeps the active caller", () => {
    const now = Date.parse("2026-01-01T00:01:00.000Z");
    const room = lobby([
      {
        id: "a",
        token: "t-a",
        nickname: "A",
        joinedAt: "2026-01-01T00:00:00.000Z",
        lastSeenAt: "2026-01-01T00:00:50.000Z",
      },
      {
        id: "b",
        token: "t-b",
        nickname: "B",
        joinedAt: "2026-01-01T00:00:00.000Z",
        lastSeenAt: new Date(now - LOBBY_STALE_MS - 1000).toISOString(),
      },
    ]);
    const patch = touchLobbyPresence(room, "t-a", now);
    expect(patch).not.toBeNull();
    expect(patch).not.toEqual({});
    const players = (patch as { players: Room["players"] }).players;
    expect(players).toHaveLength(1);
    expect(players[0]!.token).toBe("t-a");
    expect(players[0]!.lastSeenAt).toBe(new Date(now).toISOString());
  });

  it("keeps the whole table after restart refreshes lastSeenAt", () => {
    const matchStart = Date.parse("2026-01-01T00:00:00.000Z");
    const afterMatch = matchStart + LOBBY_STALE_MS * 3;
    const staleIso = new Date(matchStart).toISOString();
    const seated = [
      {
        id: "a",
        token: "t-a",
        nickname: "A",
        joinedAt: staleIso,
        lastSeenAt: staleIso,
      },
      {
        id: "b",
        token: "t-b",
        nickname: "B",
        joinedAt: staleIso,
        lastSeenAt: staleIso,
      },
      {
        id: "c",
        token: "t-c",
        nickname: "C",
        joinedAt: staleIso,
        lastSeenAt: staleIso,
      },
    ];
    const refreshed = refreshAllLobbyPresence(seated, afterMatch);
    const room = lobby(refreshed);
    const patch = touchLobbyPresence(room, "t-a", afterMatch);
    // Caller already fresh from restart — no prune / no churn required.
    expect(patch).toEqual({});
    expect(room.players).toHaveLength(3);
  });
});
