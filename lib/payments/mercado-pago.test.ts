import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { mercadoPagoManifest, paymentAction, verifyMercadoPagoSignature } from "./mercado-pago";

describe("Mercado Pago webhook signature", () => {
  it("accepts a fresh valid digest and rejects tampering or stale delivery", () => {
    const secret = "test-secret";
    const timestamp = "1700000000";
    const manifest = mercadoPagoManifest("ABC123", "request-1", timestamp);
    const digest = createHmac("sha256", secret).update(manifest).digest("hex");
    const base = {
      dataId: "ABC123",
      requestId: "request-1",
      secret,
      nowMs: 1700000000 * 1000,
    };
    expect(verifyMercadoPagoSignature({ ...base, signature: `ts=${timestamp},v1=${digest}` })).toBe(true);
    expect(verifyMercadoPagoSignature({ ...base, dataId: "other", signature: `ts=${timestamp},v1=${digest}` })).toBe(false);
    expect(verifyMercadoPagoSignature({ ...base, nowMs: 1700001000 * 1000, signature: `ts=${timestamp},v1=${digest}` })).toBe(false);
  });
});

describe("Mercado Pago authoritative state", () => {
  it("grants, revokes, or leaves entitlement unchanged from the fetched payment", () => {
    expect(paymentAction("approved")).toBe("grant");
    expect(paymentAction("refunded")).toBe("revoke");
    expect(paymentAction("charged_back")).toBe("revoke");
    expect(paymentAction("rejected")).toBe("ignore");
  });
});
