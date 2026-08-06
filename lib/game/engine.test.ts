import { describe, expect, it } from "vitest";
import {
  ActionError,
  applyNightAction,
  buildDeck,
  dealGame,
  resolveVotes,
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

/** Deterministic state for action tests, bypassing the shuffle. */
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

// Actions are validated against timeline windows; tests pass an explicit
// "now" inside the right window relative to nightStartedAt.
function at(state: GameState, seconds: number): number {
  return new Date(state.nightStartedAt).getTime() + seconds * 1000;
}

describe("buildDeck", () => {
  it("uses playerCount + 3 cards", () => {
    for (let n = 3; n <= 7; n++) {
      expect(buildDeck(n)).toHaveLength(n + 3);
    }
  });

  it("always includes at least one lobisomem", () => {
    for (let n = 3; n <= 7; n++) {
      expect(buildDeck(n)).toContain("lobisomem");
    }
  });

  it("uses the full 10-card deck for 7 players", () => {
    const deck = buildDeck(7);
    expect(deck.filter((r) => r === "lobisomem")).toHaveLength(2);
    expect(deck.filter((r) => r === "aldeao")).toHaveLength(2);
    expect(deck).toContain("bruxa");
    expect(deck).toContain("zumbi");
    expect(deck).toContain("vampiro");
    expect(deck).toContain("cacador");
    expect(deck).toContain("mumia");
    expect(deck).toContain("esqueleto");
  });
});

describe("dealGame", () => {
  it("assigns one role per player and 3 to the center", () => {
    const players = makePlayers(5);
    const state = dealGame(players, 300);
    expect(Object.keys(state.originalRoles)).toHaveLength(5);
    expect(state.center).toHaveLength(3);
  });

  it("gives werewolves their allies and the center cards", () => {
    const players = makePlayers(7);
    const state = dealGame(players, 300);
    const wolves = players.filter(
      (p) => state.originalRoles[p.id] === "lobisomem",
    );
    for (const wolf of wolves) {
      const info = state.privateInfo[wolf.id];
      expect(info).toBeDefined();
      expect(info[0].kind).toBe("lobisomens");
      if (info[0].kind === "lobisomens") {
        expect(info[0].wolfIds).toEqual(wolves.map((w) => w.id));
        expect(info[0].center).toEqual(state.center);
      }
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
      at(state, 65),
    );
    expect(info).toEqual([
      { kind: "viu_jogador", playerId: "p2", role: "lobisomem" },
    ]);
    expect(next.acted.p1).toBe(true);
    // Looking does not change any cards.
    expect(next.currentRoles).toEqual(state.currentRoles);
  });

  it("cacador swaps with a center card and sees it", () => {
    const state = fixedState(
      ["cacador", "aldeao", "aldeao"],
      ["lobisomem", "mumia", "bruxa"],
    );
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "cacador_take", centerIndex: 0 },
      at(state, 80),
    );
    expect(next.currentRoles.p1).toBe("lobisomem");
    expect(next.center[0]).toBe("cacador");
    expect(info[0]).toEqual({ kind: "pegou_centro", index: 0, role: "lobisomem" });
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
      at(state, 50),
    );
    expect(next.currentRoles.p1).toBe("lobisomem");
    expect(next.currentRoles.p2).toBe("vampiro");
  });

  it("zumbi takes a center card and chains into its action", () => {
    const state = fixedState(
      ["zumbi", "aldeao", "aldeao"],
      ["bruxa", "mumia", "esqueleto"],
    );
    const { state: afterTake } = applyNightAction(
      state,
      "p1",
      { type: "zumbi_take", centerIndex: 0 },
      at(state, 30),
    );
    expect(afterTake.currentRoles.p1).toBe("bruxa");
    expect(afterTake.center[0]).toBe("zumbi");
    expect(afterTake.pendingChain.p1).toBe("bruxa");

    // Chained bruxa action still happens inside the zombie window.
    const { state: afterChain, info } = applyNightAction(
      afterTake,
      "p1",
      { type: "bruxa_look", targetPlayerId: "p2" },
      at(state, 40),
    );
    expect(afterChain.pendingChain.p1).toBeUndefined();
    expect(info[0]).toEqual({
      kind: "viu_jogador",
      playerId: "p2",
      role: "aldeao",
    });
  });

  it("zumbi becoming lobisomem immediately learns wolves and center", () => {
    const state = fixedState(
      ["zumbi", "lobisomem", "aldeao"],
      ["lobisomem", "mumia", "bruxa"],
    );
    const { state: next, info } = applyNightAction(
      state,
      "p1",
      { type: "zumbi_take", centerIndex: 0 },
      at(state, 30),
    );
    expect(next.currentRoles.p1).toBe("lobisomem");
    expect(next.pendingChain.p1).toBeUndefined();
    const wolfInfo = info.find((i) => i.kind === "lobisomens");
    expect(wolfInfo).toBeDefined();
    if (wolfInfo?.kind === "lobisomens") {
      expect(wolfInfo.wolfIds.sort()).toEqual(["p1", "p2"]);
    }
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

  it("rejects acting twice", () => {
    const state = fixedState(
      ["bruxa", "aldeao", "aldeao"],
      ["mumia", "vampiro", "zumbi"],
    );
    const { state: next } = applyNightAction(
      state,
      "p1",
      { type: "bruxa_look", targetPlayerId: "p2" },
      at(state, 65),
    );
    expect(() =>
      applyNightAction(
        next,
        "p1",
        { type: "bruxa_look", targetPlayerId: "p3" },
        at(state, 66),
      ),
    ).toThrow(ActionError);
  });

  it("rejects an action from another role", () => {
    const state = fixedState(
      ["aldeao", "bruxa", "aldeao"],
      ["mumia", "vampiro", "zumbi"],
    );
    expect(() =>
      applyNightAction(
        state,
        "p1",
        { type: "bruxa_look", targetPlayerId: "p2" },
        at(state, 65),
      ),
    ).toThrow(ActionError);
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

  it("lobisomens win when only allies die", () => {
    const result = resolveVotes(
      stateWithVotes(["aldeao", "lobisomem", "bruxa"], {
        p1: "p3",
        p2: "p3",
        p3: "p1",
      }),
    );
    expect(result.deadIds).toEqual(["p3"]);
    expect(result.winners).toBe("lobisomens");
  });

  it("ties kill everyone tied, undead take priority", () => {
    const result = resolveVotes(
      stateWithVotes(["mumia", "lobisomem", "aldeao", "aldeao"], {
        p1: "p2",
        p2: "p1",
        p3: "p1",
        p4: "p2",
      }),
    );
    expect(result.deadIds.sort()).toEqual(["p1", "p2"]);
    expect(result.winners).toBe("mortos-vivos");
  });

  it("uses final roles after swaps, not original ones", () => {
    const state = stateWithVotes(["vampiro", "lobisomem", "aldeao"], {
      p1: "p2",
      p2: "p1",
      p3: "p1",
    });
    // Vampire stole the werewolf card during the night.
    state.currentRoles = {
      p1: "lobisomem",
      p2: "vampiro",
      p3: "aldeao",
    };
    const result = resolveVotes(state);
    expect(result.deadIds).toEqual(["p1"]);
    expect(result.winners).toBe("aliados");
  });
});
