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
  lavrador: {
    id: "lavrador",
    name: "Aldeão",
    letter: "A",
    team: "aliados",
    description:
      "Não faz nada durante a noite. Use sua lábia para descobrir quem é o lobisomem. A arte (roupa preta e arado) distingue este aldeão do de roupa verde.",
    nightHint: "Você dorme profundamente. Aguarde o amanhecer.",
    art: "/art/lavrador.png",
    hasAction: false,
  },
  cacador: {
    id: "cacador",
    name: "Caçador",
    letter: "C",
    team: "aliados",
    description:
      "Durante a noite, esconde uma carta do centro sem olhar. Se for lobisomem, isso só ajuda os aliados depois da votação (e não se a vila executar o próprio Caçador ou um morto-vivo).",
    nightHint: "Escolha uma carta do centro para esconder — você não pode olhar!",
    art: "/art/cacador.png",
    hasAction: true,
  },
  bruxa: {
    id: "bruxa",
    name: "Bruxa",
    letter: "B",
    team: "aliados",
    description:
      "Durante a noite, pode olhar a carta de um jogador. Também vê o cemitério (só o verso) — um espaço vazio indica que o Caçador já escondeu uma carta.",
    nightHint: "Espie um jogador. Observe também o cemitério (versos).",
    art: "/art/bruxa.png",
    hasAction: true,
  },
  lobisomem: {
    id: "lobisomem",
    name: "Lobisomem",
    letter: "L",
    team: "lobisomens",
    description:
      "Reconhece os outros lobisomens e olha as cartas do centro só no seu turno. Com 2 lobisomens jogadores, usam cam/mic em privado na alcateia. Memorize — depois elas viram de novo!",
    nightHint:
      "Veja a alcateia, o cemitério e combinem o plano. Memorize!",
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
    team: "zumbi",
    description:
      "Zumbi. Remove uma carta do centro, assume o papel dela e faz a ação do novo papel. A carta some do centro. O Zumbi em si nunca vence — só o papel que ele assume.",
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
      "Troca sua carta com a de outro jogador ou com uma do cemitério, em segredo. O alvo não sabe que foi trocado.",
    nightHint:
      "Escolha um jogador ou uma carta do cemitério para trocar — o alvo não saberá.",
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
    goal: "Confundam a todos e façam a vila votar em um morto-vivo (múmia ou esqueleto).",
  },
  zumbi: {
    name: "Zumbi",
    goal: "Assuma outro papel à noite — o Zumbi em si não vence.",
  },
};

/**
 * Official Monstros deck by player count (n players + 3 center).
 * For 3–4 players, mumia vs esqueleto is chosen by `rng`.
 */
export function buildDeck(
  playerCount: number,
  rng: () => number = Math.random,
): Role[] {
  const sleeper: Role = rng() < 0.5 ? "mumia" : "esqueleto";
  switch (playerCount) {
    case 3:
      return ["lobisomem", "cacador", "bruxa", "vampiro", sleeper, "zumbi"];
    case 4:
      return [
        "lobisomem",
        "lobisomem",
        "cacador",
        "bruxa",
        "vampiro",
        sleeper,
        "zumbi",
      ];
    case 5:
      // 5 + 3 centro: two wolves, both undeads, no aldeão.
      return [
        "lobisomem",
        "lobisomem",
        "cacador",
        "bruxa",
        "vampiro",
        "mumia",
        "esqueleto",
        "zumbi",
      ];
    case 6:
      // Official chart: 2 wolves, both undeads, 1 aldeão.
      return [
        "lobisomem",
        "lobisomem",
        "cacador",
        "bruxa",
        "vampiro",
        "mumia",
        "esqueleto",
        "zumbi",
        "aldeao",
      ];
    case 7:
      // Official chart: 2 wolves, both undeads, 2 aldeões (distinct arts).
      return [
        "lobisomem",
        "lobisomem",
        "cacador",
        "bruxa",
        "vampiro",
        "mumia",
        "esqueleto",
        "zumbi",
        "aldeao",
        "lavrador",
      ];
    default:
      throw new Error(`Jogadores deve ser entre 3 e 7 (recebido ${playerCount}).`);
  }
}
