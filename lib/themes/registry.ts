import { folcloreBrTheme } from "./folclore-br";
import { monstrosTheme } from "./monstros";
import { rioSatiraTheme } from "./rio-satira";
import type { ThemeCssProperties, ThemePack } from "./types";
import { assertValidThemePack } from "./validate";

export const THEME_PACKS = {
  monstros: assertValidThemePack(monstrosTheme),
  "folclore-br": assertValidThemePack(folcloreBrTheme),
  "rio-satira": assertValidThemePack(rioSatiraTheme),
} as const satisfies Record<string, ThemePack>;

export type ThemeId = keyof typeof THEME_PACKS;
export const FALLBACK_THEME_ID: ThemeId = "monstros";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.hasOwn(THEME_PACKS, value);
}

export function resolveThemeId(value: unknown): ThemeId {
  return isThemeId(value) ? value : FALLBACK_THEME_ID;
}

export function getThemePack(value: unknown): ThemePack {
  return THEME_PACKS[resolveThemeId(value)];
}

export function getDefaultThemeId(): ThemeId {
  const configured = resolveThemeId(process.env.NEXT_PUBLIC_DEFAULT_THEME_ID);
  return isThemeSelectable(configured) ? configured : FALLBACK_THEME_ID;
}

export function getDefaultThemePack(): ThemePack {
  return getThemePack(getDefaultThemeId());
}

export function listThemePacks(): ThemePack[] {
  return Object.values(THEME_PACKS);
}

export function arePreviewThemesEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_PREVIEW_THEMES === "1"
  );
}

export function isThemeSelectable(value: unknown): value is ThemeId {
  return (
    isThemeId(value) &&
    (THEME_PACKS[value].status === "published" || arePreviewThemesEnabled())
  );
}

export function listSelectableThemePacks(): ThemePack[] {
  return listThemePacks().filter((pack) => isThemeSelectable(pack.id));
}

/** Maps semantic pack colors onto the existing Tailwind utility token names. */
export function themeCssProperties(pack: ThemePack): ThemeCssProperties {
  return {
    "--color-night": pack.palette.background,
    "--color-night-soft": pack.palette.backgroundSoft,
    "--color-night-glow": pack.palette.backgroundGlow,
    "--color-night-card": pack.palette.surface,
    "--color-card-frame": pack.palette.surfaceStrong,
    "--color-blood": pack.palette.primary,
    "--color-blood-bright": pack.palette.primaryStrong,
    "--color-ember": pack.palette.accent,
    "--color-ember-soft": pack.palette.accentSoft,
    "--color-parchment": pack.palette.text,
    "--color-parchment-dim": pack.palette.textMuted,
    "--color-grave": pack.palette.border,
    "--color-swamp": pack.palette.positive,
    "--color-swamp-bright": pack.palette.positive,
  };
}

export function formatThemeText(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{([a-z]+)\}/gi, (match, key: string) => values[key] ?? match);
}
