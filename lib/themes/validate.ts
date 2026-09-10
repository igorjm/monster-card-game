import { NIGHT_TOTAL_SECONDS } from "../game/timeline";
import type { Role, Team } from "../game/types";
import type { ThemePack } from "./types";

const ROLE_IDS: readonly Role[] = [
  "aldeao", "lavrador", "cacador", "bruxa", "lobisomem", "mumia",
  "esqueleto", "zumbi", "vampiro",
];
const TEAM_IDS: readonly Team[] = ["aliados", "lobisomens", "mortos-vivos", "zumbi"];
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateThemePack(pack: ThemePack): string[] {
  const errors: string[] = [];
  if (!SAFE_ID.test(pack.id)) errors.push("id must be a safe lowercase slug");
  if (pack.schemaVersion !== 1) errors.push("unsupported schemaVersion");
  if (!pack.name.trim() || !pack.shortName.trim()) errors.push("missing name");

  for (const role of ROLE_IDS) {
    const meta = pack.roles[role];
    if (!meta) errors.push(`missing role: ${role}`);
    else if (![meta.name, meta.letter, meta.description, meta.nightHint, meta.artAlt].every((value) => value.trim())) {
      errors.push(`incomplete role: ${role}`);
    }
  }
  for (const team of TEAM_IDS) {
    const meta = pack.teams[team];
    if (!meta || ![meta.name, meta.goal, meta.winBlurb].every((value) => value.trim())) {
      errors.push(`incomplete team: ${team}`);
    }
  }

  let previousEnd = 0;
  for (const cue of pack.narration.subtitles) {
    if (cue.start < previousEnd) errors.push("subtitle cues overlap or are unordered");
    if (cue.end <= cue.start || cue.end > NIGHT_TOTAL_SECONDS) errors.push("subtitle cue is outside the shared night");
    previousEnd = cue.end;
  }
  if (pack.ambient.volume < 0 || pack.ambient.volume > 1) errors.push("ambient volume must be between 0 and 1");
  return errors;
}

export function assertValidThemePack(pack: ThemePack): ThemePack {
  const errors = validateThemePack(pack);
  if (errors.length) throw new Error(`Invalid theme pack ${pack.id}: ${errors.join(", ")}`);
  return pack;
}
