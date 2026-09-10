import type { Role } from "./types";

/** The fixed deck shared by every presentation theme. */
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
        "lobisomem", "lobisomem", "cacador", "bruxa", "vampiro", sleeper,
        "zumbi",
      ];
    case 5:
      return [
        "lobisomem", "lobisomem", "cacador", "bruxa", "vampiro", "mumia",
        "esqueleto", "zumbi",
      ];
    case 6:
      return [
        "lobisomem", "lobisomem", "cacador", "bruxa", "vampiro", "mumia",
        "esqueleto", "zumbi", "aldeao",
      ];
    case 7:
      return [
        "lobisomem", "lobisomem", "cacador", "bruxa", "vampiro", "mumia",
        "esqueleto", "zumbi", "aldeao", "lavrador",
      ];
    default:
      throw new Error(`Jogadores deve ser entre 3 e 7 (recebido ${playerCount}).`);
  }
}
