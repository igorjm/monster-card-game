import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultThemeId,
  listSelectableThemePacks,
  listThemePacks,
  resolveThemeId,
} from "./registry";
import { validateThemePack } from "./validate";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("theme registry", () => {
  it("contains complete valid packs", () => {
    for (const pack of listThemePacks()) {
      expect(validateThemePack(pack), pack.id).toEqual([]);
      expect(Object.keys(pack.roles)).toHaveLength(9);
      expect(Object.keys(pack.teams)).toHaveLength(4);
      expect(pack.brand.logoSrc, `${pack.id} logo`).toMatch(/^\/.+\.png$/);
    }
  });

  it("gives every theme its own color identity", () => {
    const packs = listThemePacks();

    expect(new Set(packs.map((pack) => pack.palette.background)).size).toBe(
      packs.length,
    );
    expect(new Set(packs.map((pack) => pack.palette.primary)).size).toBe(
      packs.length,
    );
  });

  it("falls back safely for unknown input", () => {
    expect(resolveThemeId("../../secret")).toBe("monstros");
    expect(resolveThemeId(undefined)).toBe("monstros");
  });

  it("keeps preview packs gated in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREVIEW_THEMES", "0");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_THEME_ID", "folclore-br");

    expect(listSelectableThemePacks().map((pack) => pack.id)).toEqual(["monstros"]);
    expect(getDefaultThemeId()).toBe("monstros");

    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREVIEW_THEMES", "1");
    expect(listSelectableThemePacks().map((pack) => pack.id)).toEqual([
      "monstros",
      "folclore-br",
      "rio-satira",
    ]);
    expect(getDefaultThemeId()).toBe("folclore-br");
  });
});
