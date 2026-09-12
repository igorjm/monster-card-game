import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { grantEntitlement, revokeTransaction } from "@/lib/commercial/entitlements";
import { fetchMercadoPagoPayment, paymentAction, verifyMercadoPagoSignature } from "@/lib/payments/mercado-pago";
import type { ProductId } from "@/lib/commercial/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "";
  if (!dataId || !requestId || !secret || !verifyMercadoPagoSignature({
    dataId,
    requestId,
    signature: req.headers.get("x-signature"),
    secret,
  })) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const eventId = `${requestId}:${dataId}`;
  const { data: inserted, error: eventError } = await adminClient()
    .from("payment_events")
    .upsert({ provider: "mercado-pago", external_event_id: eventId, event_type: "payment", payload: body }, { onConflict: "provider,external_event_id", ignoreDuplicates: true })
    .select("id")
    .maybeSingle();
  if (eventError) return NextResponse.json({ error: "event storage failed" }, { status: 500 });
  if (!inserted) return NextResponse.json({ ok: true, duplicate: true });

  try {
    const payment = await fetchMercadoPagoPayment(dataId);
    const reference = payment.external_reference ?? "";
    const { data: intent } = await adminClient()
      .from("purchase_intents")
      .select("id,user_id,product_id,expected_amount_cents,currency")
      .eq("external_reference", reference)
      .maybeSingle();
    if (!intent) throw new Error("purchase intent not found");
    if (Math.round(payment.transaction_amount * 100) !== intent.expected_amount_cents || payment.currency_id !== intent.currency) {
      throw new Error("payment amount or currency mismatch");
    }
    const transactionId = String(payment.id);
    const action = paymentAction(payment.status);
    if (action === "grant") {
      await grantEntitlement({ userId: intent.user_id, productId: intent.product_id as ProductId, source: "mercado-pago", externalTransactionId: transactionId, occurredAt: payment.date_last_updated });
    } else if (action === "revoke") {
      await revokeTransaction("mercado-pago", transactionId, payment.date_last_updated);
    }
    await adminClient().from("purchase_intents").update({
      status: payment.status,
      provider_payment_id: transactionId,
      provider_updated_at: payment.date_last_updated ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", intent.id);
    await adminClient().from("payment_events").update({ processed_at: new Date().toISOString() }).eq("id", inserted.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    await adminClient().from("payment_events").update({ error: error instanceof Error ? error.message : "unknown" }).eq("id", inserted.id);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
