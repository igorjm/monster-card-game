import { describe, expect, it } from "vitest";
import type { Room } from "@/lib/game/types";
import { selectRoomTheme } from "./theme-selection";

const room: Room = {
  id: "room",
  code: "ABCD",
  theme_id: "monstros",
  phase: "lobby",
  host_id: "host",
  settings: { discussionSeconds: 300 },
  players: [],
  game: null,
  version: 0,
};

describe("selectRoomTheme", () => {
  it("lets the host select a registered theme in the lobby", () => {
    expect(selectRoomTheme(room, "host", "folclore-br")).toEqual({
      theme_id: "folclore-br",
    });
  });

  it("rejects unknown themes and non-hosts", () => {
    expect(() => selectRoomTheme(room, "host", "../../secret")).toThrow("Tema inválido");
    expect(() => selectRoomTheme(room, "guest", "rio-satira")).toThrow("Apenas o anfitrião");
  });

  it("locks selection once the game starts", () => {
    expect(() =>
      selectRoomTheme({ ...room, phase: "noite" }, "host", "rio-satira"),
    ).toThrow("bloqueado");
  });
});

