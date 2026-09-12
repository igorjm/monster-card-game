import { describe, expect, it } from "vitest";
import { buildView, filterPrivateInfo } from "./views";
import type { PrivateInfo, Room } from "../game/types";

const peek: PrivateInfo = {
  kind: "viu_jogador",
  playerId: "p2",
  role: "lobisomem",
};
const wolf: PrivateInfo = {
  kind: "lobisomens",
  wolfIds: ["p1", "p3"],
  center: ["aldeao", null, "bruxa"],
};

describe("filterPrivateInfo", () => {
  it("shows witch peek only during her night window", () => {
    expect(
      filterPrivateInfo([peek], "noite", {
        originalRole: "bruxa",
        segmentKey: "bruxa",
      }),
    ).toEqual([peek]);

    expect(
      filterPrivateInfo([peek], "noite", {
        originalRole: "bruxa",
        segmentKey: "lobisomem",
      }),
    ).toEqual([]);
  });

  it("hides witch peek during discussion and voting", () => {
    expect(
      filterPrivateInfo([peek], "discussao", { originalRole: "bruxa" }),
    ).toEqual([]);
    expect(
      filterPrivateInfo([peek], "votacao", { originalRole: "bruxa" }),
    ).toEqual([]);
  });

  it("reveals witch peek at results", () => {
    expect(
      filterPrivateInfo([peek], "resultado", { originalRole: "bruxa" }),
    ).toEqual([peek]);
  });

  it("shows werewolf center only during the lobisomem night window", () => {
    expect(
      filterPrivateInfo([wolf], "noite", { segmentKey: "lobisomem" }),
    ).toEqual([wolf]);

    expect(
      filterPrivateInfo([wolf], "noite", { segmentKey: "bruxa" }),
    ).toEqual([{ kind: "lobisomens", wolfIds: ["p1", "p3"] }]);

    expect(
      filterPrivateInfo([wolf], "noite", { segmentKey: "zumbi" }),
    ).toEqual([{ kind: "lobisomens", wolfIds: ["p1", "p3"] }]);

    expect(filterPrivateInfo([wolf], "discussao")).toEqual([
      { kind: "lobisomens", wolfIds: ["p1", "p3"] },
    ]);
  });
});

describe("commercial and approval view boundaries", () => {
  const room: Room = {
    id: "r", code: "VIEW", theme_id: "vila-criaturas", phase: "lobby", host_id: "host",
    settings: { discussionSeconds: 300 }, game: null, version: 1,
    players: [
      { id: "host", token: "secret-host", nickname: "Host", joinedAt: "now", status: "approved" },
      { id: "guest", token: "secret-guest", nickname: "Guest", joinedAt: "now", status: "pending" },
    ],
  };

  it("shows only derived commerce flags and restricts ads to the adult host", () => {
    const access = { ageBand: "adult" as const, adultHost: true, adsSuppressed: false, entitledProducts: [] };
    const hostView = buildView(room, room.players[0], {}, access);
    const guestView = buildView(room, room.players[1], {}, access);
    expect(hostView.access.adsAllowedForYou).toBe(true);
    expect(guestView.access.adsAllowedForYou).toBe(false);
    expect(JSON.stringify(guestView)).not.toContain("externalTransactionId");
    expect(JSON.stringify(guestView)).not.toContain("secret-host");
  });

  it("keeps pending guests outside private game state", () => {
    const view = buildView(room, room.players[1]);
    expect(view.you.approved).toBe(false);
    expect(view.game).toBeNull();
  });
});
