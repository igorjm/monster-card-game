import { DECK_PRIORITY, ROLES } from "./roles";
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

export function buildDeck(playerCount: number): Role[] {
  return DECK_PRIORITY.slice(0, playerCount + CENTER_CARDS);
}

function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function dealGame(
  players: PlayerInfo[],
  discussionSeconds: number,
  rng: () => number = Math.random,
): GameState {
  const deck = shuffle(buildDeck(players.length), rng);
  const originalRoles: Record<string, Role> = {};
  players.forEach((p, i) => {
    originalRoles[p.id] = deck[i];
  });
  const center = deck.slice(players.length);

  const state: GameState = {
    nightStartedAt: new Date().toISOString(),
    discussionSeconds,
    originalRoles,
    currentRoles: { ...originalRoles },
    center: [...center],
    centerOriginal: [...center],
    privateInfo: {},
    acted: {},
    pendingChain: {},
    votes: {},
  };

  // Werewolves learn each other and the center cards at night start,
  // before any swap happens (they act first in the timeline).
  const wolfIds = players
    .filter((p) => originalRoles[p.id] === "lobisomem")
    .map((p) => p.id);
  for (const id of wolfIds) {
    pushInfo(state, id, {
      kind: "lobisomens",
      wolfIds,
      center: [...center],
    });
  }

  return state;
}

function pushInfo(state: GameState, playerId: string, info: PrivateInfo) {
  if (!state.privateInfo[playerId]) state.privateInfo[playerId] = [];
  state.privateInfo[playerId].push(info);
}

export function elapsedNightSeconds(state: GameState, now = Date.now()): number {
  return (now - new Date(state.nightStartedAt).getTime()) / 1000;
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
  const actionRole = roleForAction(action);
  const originalRole = next.originalRoles[actorId];
  if (!originalRole) throw new ActionError("Jogador não está na partida.");

  const isChain =
    next.pendingChain[actorId] === actionRole && originalRole === "zumbi";

  if (!isChain && originalRole !== actionRole) {
    throw new ActionError("Esta ação não pertence ao seu papel.");
  }

  // Validate the timeline window. Chained zombie actions happen inside the
  // zombie window, so validate against the zombie segment in that case.
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
      if (idx < 0 || idx >= next.center.length) {
        throw new ActionError("Carta do centro inválida.");
      }
      const taken = next.center[idx];
      next.center[idx] = next.currentRoles[actorId];
      next.currentRoles[actorId] = taken;
      give({ kind: "pegou_centro", index: idx, role: taken });

      // The zombie assumes the new role and performs its action too.
      if (taken === "lobisomem") {
        // No choice needed: immediately learn wolves + center.
        const wolfIds = Object.entries(next.currentRoles)
          .filter(([, r]) => r === "lobisomem")
          .map(([id]) => id);
        give({ kind: "lobisomens", wolfIds, center: [...next.center] });
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
      if (idx < 0 || idx >= next.center.length) {
        throw new ActionError("Carta do centro inválida.");
      }
      const taken = next.center[idx];
      next.center[idx] = next.currentRoles[actorId];
      next.currentRoles[actorId] = taken;
      give({ kind: "pegou_centro", index: idx, role: taken });
      break;
    }
    case "vampiro_swap": {
      const target = action.target;
      let newRole: Role;
      if (target.kind === "center") {
        if (target.index < 0 || target.index >= next.center.length) {
          throw new ActionError("Carta do centro inválida.");
        }
        newRole = next.center[target.index];
        next.center[target.index] = next.currentRoles[actorId];
      } else {
        if (target.playerId === actorId) {
          throw new ActionError("Você não pode trocar consigo mesmo.");
        }
        const targetRole = next.currentRoles[target.playerId];
        if (!targetRole) throw new ActionError("Jogador alvo inválido.");
        newRole = targetRole;
        next.currentRoles[target.playerId] = next.currentRoles[actorId];
      }
      next.currentRoles[actorId] = newRole;
      give({ kind: "trocou", target, newRole });
      break;
    }
  }

  return { state: next, info: produced };
}

export function teamOf(role: Role): Team {
  return ROLES[role].team;
}

/**
 * Resolves the vote. Everyone with the most votes dies (ties: all die).
 * Win priority: mortos-vivos > aliados (wolf died) > lobisomens.
 */
export function resolveVotes(state: GameState): GameResult {
  const tally: Record<string, number> = {};
  for (const target of Object.values(state.votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }
  const max = Math.max(...Object.values(tally));
  const deadIds = Object.keys(tally).filter((id) => tally[id] === max);

  const deadRoles = deadIds.map((id) => state.currentRoles[id]);
  let winners: Team;
  if (deadRoles.some((r) => teamOf(r) === "mortos-vivos")) {
    winners = "mortos-vivos";
  } else if (deadRoles.some((r) => r === "lobisomem")) {
    winners = "aliados";
  } else {
    winners = "lobisomens";
  }

  return {
    deadIds,
    winners,
    finalRoles: { ...state.currentRoles },
    originalRoles: { ...state.originalRoles },
    center: [...state.center],
    centerOriginal: [...state.centerOriginal],
    votes: { ...state.votes },
  };
}
