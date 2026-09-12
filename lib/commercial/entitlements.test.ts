import { describe, expect, it } from "vitest";
import type { Entitlement } from "./types";
import { expandGrantedProducts } from "./entitlement-policy";
import { canUseTheme } from "./catalog";

const entitlement = (productId: Entitlement["productId"], revokedAt: string | null = null): Entitlement => ({
  productId,
  source: "mercado-pago",
  externalTransactionId: productId,
  grantedAt: "2026-01-01T00:00:00Z",
  revokedAt,
});

describe("host entitlements", () => {
  it("unlocks every founders grant for the host room", () => {
    expect(expandGrantedProducts([entitlement("founders-bundle")])).toEqual([
      "remove-ads",
      "pack-studio-caos",
      "pack-orbita-sabotagem",
      "founders-bundle",
    ]);
  });
  it("ignores revoked transactions", () => {
    expect(expandGrantedProducts([entitlement("remove-ads", "2026-01-02T00:00:00Z")])).toEqual([]);
  });
  it("blocks an unowned premium world and lets one host entitlement cover the room", () => {
    expect(canUseTheme("studio-caos", [])).toBe(false);
    expect(canUseTheme("studio-caos", ["pack-studio-caos"])).toBe(true);
    expect(canUseTheme("orbita-sabotagem", ["founders-bundle"])).toBe(true);
    expect(canUseTheme("vila-criaturas", [])).toBe(true);
  });
});
