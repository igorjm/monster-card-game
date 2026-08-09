import { ROLES, buildDeck } from "./roles";
import {
  CENTER_CARDS,
  type GameResult,
  type GameState,
  type NightAction,
  type PlayerInfo,
  type PrivateInfo,
  type Role,
  type Team,
} from "./types";
import { segmentForRole, WINDOW_GRACE_SECONDS } from "./timeline";

export { buildDeck };

function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function occupiedCenter(center: (Role | null)[]): Role[] {
  return center.filter((r): r is Role => r != null);
}

export function dealGame(
  players: PlayerInfo[],
  discussionSeconds: number,
  rng: () => number = Math.random,
): GameState {
  const deck = shuffle(buildDeck(players.length, rng), rng);
  const originalRoles: Record<string, Role> = {};
  players.forEach((p, i) => {
    originalRoles[p.id] = deck[i];
  });
  const centerSlice = deck.slice(players.length);
  if (centerSlice.length !== CENTER_CARDS) {
    throw new Error(
      `Baralho inválido: esperado ${CENTER_CARDS} no centro, veio ${centerSlice.length}.`,
    );
  }
  const center: (Role | null)[] = [...centerSlice];

  // Werewolves only learn each other at deal; center cards are peeked
  // during their night window (after hunter may have removed one).
  return {
    nightStartedAt: new Date().toISOString(),
    discussionSeconds,
    originalRoles,
    currentRoles: { ...originalRoles },
    center,
    centerOriginal: [...centerSlice],
    privateInfo: {},
    acted: {},
    pendingChain: {},
    votes: {},
  };
}

function pushInfo(state: GameState, playerId: string, info: PrivateInfo) {
  if (!state.privateInfo[playerId]) state.privateInfo[playerId] = [];
  state.privateInfo[playerId].push(info);
}

export function elapsedNightSeconds(state: GameState, now = Date.now()): number {
  const effectiveNow = state.pausedAt
    ? new Date(state.pausedAt).getTime()
    : now;
  return (effectiveNow - new Date(state.nightStartedAt).getTime()) / 1000;
}

export function isGamePaused(state: GameState): boolean {
  return Boolean(state.pausedAt);
}

/**
 * Freeze or unfreeze the shared night/discussion clock.
 * On resume, timestamps are shifted forward by the pause duration so timers
 * and audio stay aligned for every client.
 */
export function setGamePaused(
  state: GameState,
  paused: boolean,
  now = Date.now(),
): GameState {
  const next = structuredClone(state);
  if (paused) {
    if (next.pausedAt) return next;
    next.pausedAt = new Date(now).toISOString();
    return next;
  }
  if (!next.pausedAt) return next;
  const pauseMs = now - new Date(next.pausedAt).getTime();
  next.nightStartedAt = new Date(
    new Date(next.nightStartedAt).getTime() + pauseMs,
  ).toISOString();
  if (next.discussionEndsAt) {
    next.discussionEndsAt = new Date(
      new Date(next.discussionEndsAt).getTime() + pauseMs,
    ).toISOString();
  }
  delete next.pausedAt;
  return next;
}

function wolfIdsFrom(state: GameState): string[] {
  return Object.entries(state.currentRoles)
    .filter(([, r]) => r === "lobisomem")
    .map(([id]) => id);
}

/** Which role is the action for? Used to validate the timeline window. */
function roleForAction(action: NightAction): Role {
  switch (action.type) {
    case "zumbi_take":
      return "zumbi";
    case "bruxa_look":
      return "bruxa";
    case "cacador_take":
      return "cacador";
    case "vampiro_swap":
      return "vampiro";
    case "lobisomem_peek":
      return "lobisomem";
  }
}

export class ActionError extends Error {}

/**
 * Applies a night action, mutating a copy of the state.
 * Returns the new state and the private info produced for the actor.
 */
export function applyNightAction(
  state: GameState,
  actorId: string,
  action: NightAction,
  now = Date.now(),
): { state: GameState; info: PrivateInfo[] } {
  const next: GameState = structuredClone(state);
  if (next.pausedAt) {
    throw new ActionError("A partida está pausada pelo anfitrião.");
  }
  const actionRole = roleForAction(action);
  const originalRole = next.originalRoles[actorId];
  if (!originalRole) throw new ActionError("Jogador não está na partida.");

  const isChain =
    next.pendingChain[actorId] === actionRole && originalRole === "zumbi";

  if (!isChain && originalRole !== actionRole) {
    throw new ActionError("Esta ação não pertence ao seu papel.");
  }

  const windowRole: Role = isChain ? "zumbi" : actionRole;
  const segment = segmentForRole(windowRole);
  if (segment) {
    const elapsed = elapsedNightSeconds(next, now);
    if (
      elapsed < segment.start - WINDOW_GRACE_SECONDS ||
      elapsed > segment.end + WINDOW_GRACE_SECONDS
    ) {
      throw new ActionError("Fora da janela de ação do seu papel.");
    }
  }

  // Werewolf peek is idempotent and does not consume a "choice" slot the
  // same way — but still marks acted so we only snapshot once.
  if (action.type === "lobisomem_peek") {
    if (next.acted[actorId]) {
      const existing = (next.privateInfo[actorId] ?? []).filter(
        (i) => i.kind === "lobisomens",
      );
      return { state: next, info: existing };
    }
    next.acted[actorId] = true;
    const info: PrivateInfo = {
      kind: "lobisomens",
      wolfIds: wolfIdsFrom(next),
      center: [...next.center],
    };
    pushInfo(next, actorId, info);
    return { state: next, info: [info] };
  }

  if (isChain) {
    delete next.pendingChain[actorId];
  } else {
    if (next.acted[actorId]) throw new ActionError("Você já agiu esta noite.");
    next.acted[actorId] = true;
  }

  const produced: PrivateInfo[] = [];
  const give = (info: PrivateInfo) => {
    produced.push(info);
    pushInfo(next, actorId, info);
  };

  switch (action.type) {
    case "zumbi_take": {
      const idx = action.centerIndex;
      if (idx < 0 || idx >= next.center.length || next.center[idx] == null) {
        throw new ActionError("Carta do centro inválida.");
      }
      const taken = next.center[idx]!;
      next.center[idx] = null;
      next.currentRoles[actorId] = taken;
      give({ kind: "pegou_centro", index: idx, role: taken });

      if (taken === "lobisomem") {
        give({
          kind: "lobisomens",
          wolfIds: wolfIdsFrom(next),
          center: [...next.center],
        });
      } else if (ROLES[taken].hasAction && taken !== "zumbi") {
        next.pendingChain[actorId] = taken;
      }
      break;
    }
    case "bruxa_look": {
      const targetRole = next.currentRoles[action.targetPlayerId];
      if (!targetRole) throw new ActionError("Jogador alvo inválido.");
      if (action.targetPlayerId === actorId) {
        throw new ActionError("Você não pode olhar a própria carta.");
      }
      give({
        kind: "viu_jogador",
        playerId: action.targetPlayerId,
        role: targetRole,
      });
      break;
    }
    case "cacador_take": {
      const idx = action.centerIndex;
      if (idx < 0 || idx >= next.center.length || next.center[idx] == null) {
        throw new ActionError("Carta do centro inválida.");
      }
      if (next.hunterHidden) {
        throw new ActionError("Você já escondeu uma carta.");
      }
      const taken = next.center[idx]!;
      next.center[idx] = null;
      next.hunterHidden = taken;
      // Hunter keeps their role; they do not see the card.
      give({ kind: "escondeu_centro", index: idx });
      break;
    }
    case "vampiro_swap": {
      const target = action.target;
      if (target.kind === "center") {
        throw new ActionError(
          "O vampiro só troca com outro jogador (não com o centro).",
        );
      }
      if (target.playerId === actorId) {
        throw new ActionError("Você não pode trocar consigo mesmo.");
      }
      const targetRole = next.currentRoles[target.playerId];
      if (!targetRole) throw new ActionError("Jogador alvo inválido.");
      const newRole = targetRole;
      next.currentRoles[target.playerId] = next.currentRoles[actorId];
      next.currentRoles[actorId] = newRole;
      // Only the vampire learns the swap — the target stays unaware.
      give({ kind: "trocou", target, newRole });
      break;
    }
  }

  return { state: next, info: produced };
}

export function teamOf(role: Role): Team {
  return ROLES[role].team;
}

function baseResult(state: GameState): Omit<GameResult, "deadIds" | "winners"> {
  return {
    finalRoles: { ...state.currentRoles },
    originalRoles: { ...state.originalRoles },
    center: [...state.center],
    centerOriginal: [...state.centerOriginal],
    votes: { ...state.votes },
    hunterHidden: state.hunterHidden,
  };
}

/**
 * Called when discussion ends. Always continue to voting — the hunter's
 * hidden card stays secret until after the vote (results).
 */
export function resolveDiscussionEnd(
  state: GameState,
): { kind: "continue"; state: GameState } {
  return { kind: "continue", state: structuredClone(state) };
}

/**
 * True when every seated player received exactly one vote (total votes ==
 * player count and every tally is 1). Rule sheet: restart the debate.
 */
export function shouldRestartDebate(
  votes: Record<string, string>,
  playerIds: string[],
): boolean {
  if (playerIds.length === 0) return false;
  if (Object.keys(votes).length !== playerIds.length) return false;
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  if (Object.keys(tally).length !== playerIds.length) return false;
  return playerIds.every((id) => tally[id] === 1);
}

/**
 * Resolves the vote. Everyone with the most votes dies (ties: all die).
 * Win priority (option C):
 * 1. Dead mumia/esqueleto → mortos-vivos (beats hunter-hid-wolf)
 * 2. Dead lobisomem → aliados
 * 3. Hunter hid lobisomem and no dead cacador → aliados
 * 4. Else → lobisomens (incl. voted the caçador)
 * Zumbi never triggers a win team.
 */
export function resolveVotes(state: GameState): GameResult {
  const tally: Record<string, number> = {};
  for (const target of Object.values(state.votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  const max = Math.max(0, ...Object.values(tally));
  const deadIds =
    max === 0 ? [] : Object.keys(tally).filter((id) => tally[id] === max);

  const deadRoles = deadIds.map((id) => state.currentRoles[id]);
  const hunterHidWolf = state.hunterHidden === "lobisomem";
  const deadHunter = deadRoles.some((r) => r === "cacador");

  let winners: Team;
  if (deadRoles.some((r) => teamOf(r) === "mortos-vivos")) {
    winners = "mortos-vivos";
  } else if (deadRoles.some((r) => r === "lobisomem")) {
    winners = "aliados";
  } else if (hunterHidWolf && !deadHunter) {
    winners = "aliados";
  } else {
    winners = "lobisomens";
  }

  return {
    ...baseResult(state),
    deadIds,
    winners,
    hunterHidden: state.hunterHidden,
  };
}
