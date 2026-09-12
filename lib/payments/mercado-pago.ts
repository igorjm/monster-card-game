import { createHmac, timingSafeEqual } from "node:crypto";

export function parseSignature(value: string | null) {
  const parts = new Map(
    (value ?? "").split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );
  return { timestamp: parts.get("ts") ?? "", digest: parts.get("v1") ?? "" };
}

export function mercadoPagoManifest(dataId: string, requestId: string, timestamp: string) {
  return `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
}

export function verifyMercadoPagoSignature(input: {
  dataId: string;
  requestId: string;
  signature: string | null;
  secret: string;
  nowMs?: number;
  toleranceSeconds?: number;
}) {
  const { timestamp, digest } = parseSignature(input.signature);
  if (!/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(digest)) return false;
  const age = Math.abs((input.nowMs ?? Date.now()) / 1000 - Number(timestamp));
  if (age > (input.toleranceSeconds ?? 300)) return false;
  const expected = createHmac("sha256", input.secret)
    .update(mercadoPagoManifest(input.dataId, input.requestId, timestamp))
    .digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(digest, "hex"));
}

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount: number;
  currency_id: string;
  date_last_updated?: string;
};

export function paymentAction(status: string): "grant" | "revoke" | "ignore" {
  if (status === "approved") return "grant";
  if (["refunded", "charged_back", "cancelled"].includes(status)) return "revoke";
  return "ignore";
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Mercado Pago não confirmou o pagamento.");
  return response.json();
}
