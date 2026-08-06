import type { Role, Team } from "./types";

export interface RoleMeta {
  id: Role;
  name: string;
  letter: string;
  team: Team;
  description: string;
  nightHint: string;
  art: string;
  /** Whether the role performs a real choice during the night. */
  hasAction: boolean;
}

export const ROLES: Record<Role, RoleMeta> = {
  aldeao: {
    id: "aldeao",
    name: "Aldeão",
    letter: "A",
    team: "aliados",
    description:
      "Não faz nada durante a noite. Use sua lábia para descobrir quem é o lobisomem.",
    nightHint: "Você dorme profundamente. Aguarde o amanhecer.",
    art: "/art/aldeao.png",
    hasAction: false,
  },
  cacador: {
    id: "cacador",
    name: "Caçador",
    letter: "C",
    team: "aliados",
    description:
      "Durante a noite, pega uma carta do centro e a esconde, deixando a sua no lugar.",
    nightHint: "Escolha uma carta do centro para pegar e esconder.",
    art: "/art/cacador.png",
    hasAction: true,
  },
  bruxa: {
    id: "bruxa",
    name: "Bruxa",
    letter: "B",
    team: "aliados",
    description: "Durante a noite, pode olhar a carta de um jogador.",
    nightHint: "Escolha um jogador para espiar a carta.",
    art: "/art/bruxa.png",
    hasAction: true,
  },
  lobisomem: {
    id: "lobisomem",
    name: "Lobisomem",
    letter: "L",
    team: "lobisomens",
    description:
      "Reconhece os outros lobisomens e olha as cartas do centro. Sobreviva à votação!",
    nightHint: "Abra os olhos: veja seus aliados e as cartas do centro.",
    art: "/art/lobisomem.png",
    hasAction: false,
  },
  mumia: {
    id: "mumia",
    name: "Múmia",
    letter: "M",
    team: "mortos-vivos",
    description:
      "Morto-vivo. Não faz nada à noite. Convença todos a votarem em você!",
    nightHint: "Você descansa em seu sarcófago. Aguarde o amanhecer.",
    art: "/art/mumia.png",
    hasAction: false,
  },
  esqueleto: {
    id: "esqueleto",
    name: "Esqueleto",
    letter: "E",
    team: "mortos-vivos",
    description:
      "Morto-vivo. Não faz nada à noite. Convença todos a votarem em você!",
    nightHint: "Seus ossos descansam. Aguarde o amanhecer.",
    art: "/art/esqueleto.png",
    hasAction: false,
  },
  zumbi: {
    id: "zumbi",
    name: "Zumbi",
    letter: "Z",
    team: "mortos-vivos",
    description:
      "Morto-vivo. Pega uma carta do centro, assume o papel dela e faz a ação do novo papel.",
    nightHint: "Escolha uma carta do centro para devorar e assumir.",
    art: "/art/zumbi.png",
    hasAction: true,
  },
  vampiro: {
    id: "vampiro",
    name: "Vampiro",
    letter: "V",
    team: "aliados",
    description:
      "Troca sua carta com a de um jogador ou do centro e assume o novo papel.",
    nightHint: "Escolha uma carta do centro ou de um jogador para trocar.",
    art: "/art/vampiro.png",
    hasAction: true,
  },
};

export const TEAMS: Record<Team, { name: string; goal: string }> = {
  aliados: {
    name: "Aliados",
    goal: "Descubram e eliminem um lobisomem na votação.",
  },
  lobisomens: {
    name: "Lobisomens",
    goal: "Sobrevivam! Façam a vila votar em um aliado.",
  },
  "mortos-vivos": {
    name: "Mortos-Vivos",
    goal: "Confundam a todos e façam a vila votar em um morto-vivo.",
  },
};

/**
 * Deck inclusion priority: the first (playerCount + 3) roles enter the game.
 * Guarantees at least one lobisomem for any player count.
 */
export const DECK_PRIORITY: Role[] = [
  "lobisomem",
  "lobisomem",
  "bruxa",
  "zumbi",
  "vampiro",
  "cacador",
  "mumia",
  "aldeao",
  "esqueleto",
  "aldeao",
];
