import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRoomCreationTheme } from "./room-creation";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveRoomCreationTheme", () => {
  it("accepts a selectable theme during room creation", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(resolveRoomCreationTheme("vila-criaturas")).toBe("vila-criaturas");
  });

  it("uses the configured safe default when the field is omitted", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREVIEW_THEMES", "0");
    vi.stubEnv("NEXT_PUBLIC_DEFAULT_THEME_ID", "folclore-br");

    expect(resolveRoomCreationTheme(undefined)).toBe("vila-criaturas");
  });

  it("rejects unknown and unavailable themes", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREVIEW_THEMES", "0");

    expect(() => resolveRoomCreationTheme("../../secret")).toThrow(
      "Tema inválido",
    );
    expect(() => resolveRoomCreationTheme("rio-satira")).toThrow(
      "indisponível",
    );
  });
});
