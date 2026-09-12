import { describe, expect, it } from "vitest";
import type { Room } from "../game/types";
import { moderateRoomPlayer } from "./room-safety";

const room: Room = {
  id: "room", code: "TEST", theme_id: "vila-criaturas", phase: "lobby", host_id: "host",
  settings: { discussionSeconds: 300 }, game: null, version: 0,
  players: [
    { id: "host", token: "host-token", nickname: "Host", joinedAt: "now", status: "approved" },
    { id: "guest", token: "guest-token", nickname: "Guest", joinedAt: "now", status: "pending" },
  ],
};

describe("private room moderation", () => {
  it("requires the host and approves a pending guest", () => {
    expect(() => moderateRoomPlayer(room, { hostToken: "guest-token", playerId: "host", action: "approve" })).toThrow("Aguarde");
    const patch = moderateRoomPlayer(room, { hostToken: "host-token", playerId: "guest", action: "approve" });
    expect(patch.players?.[1].status).toBe("approved");
  });
  it("blocks the device and removes the seat", () => {
    const patch = moderateRoomPlayer(room, { hostToken: "host-token", playerId: "guest", action: "block" });
    expect(patch.players).toHaveLength(1);
    expect(patch.blocked_tokens).toEqual(["guest-token"]);
  });
  it("applies microphone and camera restrictions deterministically", () => {
    const approved = { ...room, players: room.players.map((player) => ({ ...player, status: "approved" as const })) };
    const muted = moderateRoomPlayer(approved, { hostToken: "host-token", playerId: "guest", action: "mute" });
    expect(muted.players?.[1].media?.microphoneBlocked).toBe(true);
    const camera = moderateRoomPlayer(approved, { hostToken: "host-token", playerId: "guest", action: "disable-camera" });
    expect(camera.players?.[1].media?.cameraBlocked).toBe(true);
  });
});
