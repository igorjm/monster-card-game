import type { Role, Team } from "./types";

export interface RoleRule {
  team: Team;
  hasAction: boolean;
}

/**
 * Mechanical role facts. Theme packs may rename and redraw these roles, but
 * they cannot change their team or whether they act during the night.
 */
export const ROLE_RULES: Record<Role, RoleRule> = {
  aldeao: { team: "aliados", hasAction: false },
  lavrador: { team: "aliados", hasAction: false },
  cacador: { team: "aliados", hasAction: true },
  bruxa: { team: "aliados", hasAction: true },
  lobisomem: { team: "lobisomens", hasAction: false },
  mumia: { team: "mortos-vivos", hasAction: false },
  esqueleto: { team: "mortos-vivos", hasAction: false },
  zumbi: { team: "zumbi", hasAction: true },
  vampiro: { team: "aliados", hasAction: true },
};

export function teamOf(role: Role): Team {
  return ROLE_RULES[role].team;
}

