import { describe, expect, it } from "vitest";
import { filterPrivateInfo } from "./views";
import type { PrivateInfo } from "../game/types";

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
