import { describe, expect, it } from "vitest";
import {
  ActionError,
  applyNightAction,
  buildDeck,
  dealGame,
  elapsedNightSeconds,
  resolveDiscussionEnd,
  resolveVotes,
  setGamePaused,
  shouldRestartDebate,
} from "./engine";
import type { GameState, PlayerInfo, Role } from "./types";

function makePlayers(count: number): PlayerInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    token: `t${i + 1}`,
    nickname: `Jogador ${i + 1}`,
    joinedAt: new Date().toISOString(),
  }));
}

function fixedState(roles: Role[], center: Role[]): GameState {
  const originalRoles: Record<string, Role> = {};
  roles.forEach((r, i) => {
    originalRoles[`p${i + 1}`] = r;
  });
  return {
    nightStartedAt: new Date().toISOString(),
    discussionSeconds: 300,
    originalRoles,
    currentRoles: { ...originalRoles },
    center: [...center],
    centerOriginal: [...center],
    privateInfo: {},
    acted: {},
    pendingChain: {},
    votes: {},
  };
}

function at(state: GameState, seconds: number): number {
  return new Date(state.nightStartedAt).getTime() + seconds * 1000;
}

describe("buildDeck", () => {
  const fixed = () => 0; // always mumia when sleeper is random

  it("uses playerCount + 3 cards", () => {
    for (let n = 3; n <= 7; n++) {
      expect(buildDeck(n, fixed)).toHaveLength(n + 3);
    }
  });

  it("always includes at least one lobisomem", () => {
    for (let n = 3; n <= 7; n++) {
      expect(buildDeck(n, fixed)).toContain("lobisomem");
    }
  });

  it("matches the official Monstros chart", () => {
    const count = (deck: Role[], role: Role) =>
      deck.filter((r) => r === role).length;

    const d3 = buildDeck(3, fixed);
    expect(count(d3, "lobisomem")).toBe(1);
    expect(count(d3, "cacador")).toBe(1);
    expect(count(d3, "bruxa")).toBe(1);
    expect(count(d3, "vampiro")).toBe(1);
    expect(count(d3, "zumbi")).toBe(1);
    expect(count(d3, "aldeao")).toBe(0);
    expect(count(d3, "mumia") + count(d3, "esqueleto")).toBe(1);

    const d4 = buildDeck(4, () => 0.9); // esqueleto
    expect(count(d4, "lobisomem")).toBe(2);
    expect(count(d4, "esqueleto")).toBe(1);
    expect(count(d4, "mumia")).toBe(0);
    expect(count(d4, "aldeao")).toBe(0);

    const d5 = buildDeck(5, fixed);
    expect(count(d5, "lobisomem")).toBe(2);
    expect(count(d5, "mumia")).toBe(1);
    expect(count(d5, "esqueleto")).toBe(1);
    expect(count(d5, "aldeao")).toBe(0);

    expect(count(buildDeck(6, fixed), "lobisomem")).toBe(2);
    expect(count(buildDeck(6, fixed), "aldeao")).toBe(1);
    expect(count(buildDeck(6, fixed), "lavrador")).toBe(0);
    expect(count(buildDeck(7, fixed), "lobisomem")).toBe(2);
    expect(count(buildDeck(7, fixed), "aldeao")).toBe(1);
    expect(count(buildDeck(7, fixed), "lavrador")).toBe(1);
  });
});

describe("dealGame", () => {
  it("assigns one role per player and 3 to the center", () => {
    const players = makePlayers(5);
    const state = dealGame(players, 300);
    expect(Object.keys(state.originalRoles)).toHaveLength(5);
    expect(state.center).toHaveLength(3);
  });

  it("does not give werewolves center vision at deal", () => {
    const players = makePlayers(7);
    const state = dealGame(players, 300);
    const wolves = players.filter(
      (p) => state.originalRoles[p.id] === "lobisomem",
    );
    for (const wolf of wolves) {
      expect(state.privateInfo[wolf.id] ?? []).toEqual([]);
    }
  });
});

describe("applyNightAction", () => {
  it("bruxa sees a player's current card", () => {
    const state = fixedState(
      ["bruxa", "lobisomem", "aldeao"],
      ["mumia", "vampiro", "zumbi"],
    );
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "bruxa_look", targetPlayerId: "p2" },
      at(state, 35),
    );
    expect(info).toEqual([
      { kind: "viu_jogador", playerId: "p2", role: "lobisomem" },
    ]);
    expect(next.acted.p1).toBe(true);
    expect(next.currentRoles).toEqual(state.currentRoles);
  });

  it("cacador hides a center card without looking or swapping", () => {
    const state = fixedState(
      ["cacador", "aldeao", "aldeao"],
      ["lobisomem", "mumia", "bruxa"],
    );
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "cacador_take", centerIndex: 0 },
      at(state, 18),
    );
    expect(next.currentRoles.p1).toBe("cacador");
    expect(next.hunterHidden).toBe("lobisomem");
    expect(next.center).toEqual([null, "mumia", "bruxa"]);
    expect(info[0]).toEqual({ kind: "escondeu_centro", index: 0 });
  });

  it("cacador leaving middle empty keeps left and right seats", () => {
    const state = fixedState(
      ["cacador", "aldeao", "aldeao"],
      ["lobisomem", "mumia", "bruxa"],
    );
    const { state: next } = applyNightAction(
      state,
      "p1",
      { type: "cacador_take", centerIndex: 1 },
      at(state, 18),
    );
    expect(next.hunterHidden).toBe("mumia");
    expect(next.center).toEqual(["lobisomem", null, "bruxa"]);
  });

  it("vampiro swaps with another player", () => {
    const state = fixedState(
      ["vampiro", "lobisomem", "aldeao"],
      ["mumia", "bruxa", "zumbi"],
    );
    const { state: next } = applyNightAction(
      state,
      "p1",
      { type: "vampiro_swap", target: { kind: "player", playerId: "p2" } },
      at(state, 82),
    );
    expect(next.currentRoles.p1).toBe("lobisomem");
    expect(next.currentRoles.p2).toBe("vampiro");
  });

  it("vampiro can swap with a center card", () => {
    const state = fixedState(
      ["vampiro", "lobisomem", "aldeao"],
      ["mumia", "bruxa", "zumbi"],
    );
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "vampiro_swap", target: { kind: "center", index: 1 } },
      at(state, 82),
    );
    expect(next.currentRoles.p1).toBe("bruxa");
    expect(next.center).toEqual(["mumia", "vampiro", "zumbi"]);
    expect(info[0]).toEqual({
      kind: "trocou",
      target: { kind: "center", index: 1 },
      newRole: "bruxa",
    });
  });

  it("vampiro cannot swap with an empty center seat", () => {
    const state = fixedState(
      ["vampiro", "lobisomem", "aldeao"],
      ["mumia", "bruxa", "zumbi"],
    );
    state.center = ["mumia", null, "zumbi"];
    expect(() =>
      applyNightAction(
        state,
        "p1",
        { type: "vampiro_swap", target: { kind: "center", index: 1 } },
        at(state, 82),
      ),
    ).toThrow(ActionError);
  });

  it("zumbi removes a center card and chains into its action", () => {
    const state = fixedState(
      ["zumbi", "aldeao", "aldeao"],
      ["bruxa", "mumia", "esqueleto"],
    );
    const { state: afterTake } = applyNightAction(
      state,
      "p1",
      { type: "zumbi_take", centerIndex: 0 },
      at(state, 68),
    );
    expect(afterTake.currentRoles.p1).toBe("bruxa");
    expect(afterTake.center).toEqual([null, "mumia", "esqueleto"]);
    expect(afterTake.pendingChain.p1).toBe("bruxa");

    const { state: afterChain, info } = applyNightAction(
      afterTake,
      "p1",
      { type: "bruxa_look", targetPlayerId: "p2" },
      at(state, 72),
    );
    expect(afterChain.pendingChain.p1).toBeUndefined();
    expect(info[0]).toEqual({
      kind: "viu_jogador",
      playerId: "p2",
      role: "aldeao",
    });
  });

  it("zumbi becoming lobisomem learns wolves and remaining center", () => {
    const state = fixedState(
      ["zumbi", "lobisomem", "aldeao"],
      ["lobisomem", "mumia", "bruxa"],
    );
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "zumbi_take", centerIndex: 0 },
      at(state, 68),
    );
    expect(next.currentRoles.p1).toBe("lobisomem");
    expect(next.center).toEqual([null, "mumia", "bruxa"]);
    const wolfInfo = info.find((i) => i.kind === "lobisomens");
    expect(wolfInfo).toBeDefined();
    if (wolfInfo?.kind === "lobisomens") {
      expect(wolfInfo.wolfIds.sort()).toEqual(["p1", "p2"]);
      expect(wolfInfo.center).toEqual([null, "mumia", "bruxa"]);
    }
  });

  it("lobisomem peeks remaining center during their window", () => {
    const state = fixedState(
      ["lobisomem", "aldeao", "aldeao"],
      ["mumia", "bruxa", "zumbi"],
    );
    state.center = ["mumia", null, "bruxa"];
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "lobisomem_peek" },
      at(state, 50),
    );
    expect(info[0]).toEqual({
      kind: "lobisomens",
      wolfIds: ["p1"],
      center: ["mumia", null, "bruxa"],
    });
    // Idempotent
    const again = applyNightAction(
      next,
      "p1",
      { type: "lobisomem_peek" },
      at(state, 52),
    );
    expect(again.info).toHaveLength(1);
  });

  it("rejects acting outside the role window", () => {
    const state = fixedState(
      ["bruxa", "aldeao", "aldeao"],
      ["mumia", "vampiro", "zumbi"],
    );
    expect(() =>
      applyNightAction(
        state,
        "p1",
        { type: "bruxa_look", targetPlayerId: "p2" },
        at(state, 5),
      ),
    ).toThrow(ActionError);
  });
});

describe("resolveDiscussionEnd", () => {
  it("always continues to voting without revealing the hunter card", () => {
    const state = fixedState(
      ["cacador", "aldeao", "bruxa"],
      ["mumia", "aldeao"],
    );
    state.hunterHidden = "lobisomem";
    const outcome = resolveDiscussionEnd(state);
    expect(outcome.kind).toBe("continue");
    expect(outcome.state.hunterRevealed).toBeUndefined();
    expect(outcome.state.hunterHidden).toBe("lobisomem");
    expect(outcome.state.result).toBeUndefined();
  });

  it("continues to voting when hunter hid a non-wolf", () => {
    const state = fixedState(
      ["cacador", "aldeao", "bruxa"],
      ["mumia"],
    );
    state.hunterHidden = "aldeao";
    const outcome = resolveDiscussionEnd(state);
    expect(outcome.kind).toBe("continue");
    expect(outcome.state.hunterRevealed).toBeUndefined();
    expect(outcome.state.hunterHidden).toBe("aldeao");
  });
});

describe("shouldRestartDebate", () => {
  it("is true when every player received exactly one vote", () => {
    expect(
      shouldRestartDebate(
        { p1: "p2", p2: "p3", p3: "p1" },
        ["p1", "p2", "p3"],
      ),
    ).toBe(true);
  });

  it("is false when someone has more than one vote", () => {
    expect(
      shouldRestartDebate(
        { p1: "p2", p2: "p1", p3: "p1" },
        ["p1", "p2", "p3"],
      ),
    ).toBe(false);
  });
});

describe("resolveVotes", () => {
  function stateWithVotes(
    roles: Role[],
    votes: Record<string, string>,
  ): GameState {
    const state = fixedState(roles, ["mumia", "aldeao", "aldeao"]);
    state.votes = votes;
    return state;
  }

  it("aliados win when a lobisomem dies", () => {
    const result = resolveVotes(
      stateWithVotes(["lobisomem", "aldeao", "bruxa"], {
        p1: "p2",
        p2: "p1",
        p3: "p1",
      }),
    );
    expect(result.deadIds).toEqual(["p1"]);
    expect(result.winners).toBe("aliados");
  });

  it("mortos-vivos win when an undead dies", () => {
    const result = resolveVotes(
      stateWithVotes(["mumia", "lobisomem", "aldeao"], {
        p1: "p2",
        p2: "p1",
        p3: "p1",
      }),
    );
    expect(result.winners).toBe("mortos-vivos");
  });

  it("mortos-vivos beat hunter-hid-wolf", () => {
    const state = stateWithVotes(["mumia", "cacador", "aldeao"], {
      p1: "p2",
      p2: "p1",
      p3: "p1",
    });
    state.hunterHidden = "lobisomem";
    expect(resolveVotes(state).winners).toBe("mortos-vivos");
  });

  it("aliados win via hunter-hid-wolf when a non-hunter ally dies", () => {
    const state = stateWithVotes(["aldeao", "cacador", "bruxa"], {
      p1: "p2",
      p2: "p1",
      p3: "p1",
    });
    state.hunterHidden = "lobisomem";
    expect(resolveVotes(state).winners).toBe("aliados");
  });

  it("lobisomens win when the caçador dies even if hunter hid a wolf", () => {
    const state = stateWithVotes(["cacador", "aldeao", "bruxa"], {
      p1: "p2",
      p2: "p1",
      p3: "p1",
    });
    state.hunterHidden = "lobisomem";
    expect(resolveVotes(state).winners).toBe("lobisomens");
  });

  it("zumbi death does not trigger mortos-vivos", () => {
    const result = resolveVotes(
      stateWithVotes(["zumbi", "lobisomem", "aldeao"], {
        p1: "p2",
        p2: "p1",
        p3: "p1",
      }),
    );
    expect(result.winners).toBe("lobisomens");
  });

  it("includes hunter reveal on the result", () => {
    const state = stateWithVotes(["cacador", "lobisomem", "aldeao"], {
      p1: "p2",
      p2: "p3",
      p3: "p2",
    });
    state.hunterHidden = "aldeao";
    const result = resolveVotes(state);
    expect(result.hunterHidden).toBe("aldeao");
  });
});

describe("pause / resume", () => {
  it("freezes night elapsed while paused", () => {
    const state = fixedState(
      ["aldeao", "bruxa", "lobisomem"],
      ["mumia", "aldeao", "esqueleto"],
    );
    const t0 = new Date(state.nightStartedAt).getTime();
    const at20 = t0 + 20_000;
    expect(elapsedNightSeconds(state, at20)).toBeCloseTo(20, 5);

    const paused = setGamePaused(state, true, at20);
    expect(paused.pausedAt).toBe(new Date(at20).toISOString());
    expect(elapsedNightSeconds(paused, at20 + 30_000)).toBeCloseTo(20, 5);
  });

  it("shifts nightStartedAt forward on resume", () => {
    const state = fixedState(
      ["aldeao", "bruxa", "lobisomem"],
      ["mumia", "aldeao", "esqueleto"],
    );
    const t0 = new Date(state.nightStartedAt).getTime();
    const paused = setGamePaused(state, true, t0 + 10_000);
    const resumed = setGamePaused(paused, false, t0 + 25_000);
    expect(resumed.pausedAt).toBeUndefined();
    // 15s pause → start moved forward; at t0+40s elapsed is still 25s (40-15)
    expect(elapsedNightSeconds(resumed, t0 + 40_000)).toBeCloseTo(25, 5);
  });

  it("blocks night actions while paused", () => {
    const state = fixedState(
      ["bruxa", "lobisomem", "aldeao"],
      ["mumia", "aldeao", "esqueleto"],
    );
    const paused = setGamePaused(state, true, at(state, 30));
    expect(() =>
      applyNightAction(
        paused,
        "p1",
        { type: "bruxa_look", targetPlayerId: "p2" },
        at(paused, 30),
      ),
    ).toThrow(ActionError);
  });
});
