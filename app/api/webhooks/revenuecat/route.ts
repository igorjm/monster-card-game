import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { grantEntitlement, revokeTransaction } from "@/lib/commercial/entitlements";
import { isProductId } from "@/lib/commercial/catalog";

export const runtime = "nodejs";

const REVOCATION_EVENTS = new Set(["CANCELLATION", "EXPIRATION", "REFUND", "PRODUCT_CHANGE"]);

export async function POST(req: Request) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION;
  if (!expected || req.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "invalid authorization" }, { status: 401 });
  }
  const payload = (await req.json()) as {
    event?: {
      id?: string;
      type?: string;
      app_user_id?: string;
      product_id?: string;
      transaction_id?: string;
      purchased_at_ms?: number;
      store?: string;
    };
  };
  const event = payload.event;
  if (!event?.id || !event.app_user_id || !event.transaction_id || !isProductId(event.product_id)) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 });
  }
  const { data: inserted, error } = await adminClient().from("payment_events").upsert({
    provider: "revenuecat",
    external_event_id: event.id,
    event_type: event.type ?? "UNKNOWN",
    payload,
  }, { onConflict: "provider,external_event_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "event storage failed" }, { status: 500 });
  if (!inserted) return NextResponse.json({ ok: true, duplicate: true });

  const source = event.store === "APP_STORE" ? "apple" : "google";
  const occurredAt = event.purchased_at_ms ? new Date(event.purchased_at_ms).toISOString() : new Date().toISOString();
  if (REVOCATION_EVENTS.has(event.type ?? "")) {
    await revokeTransaction(source, event.transaction_id, occurredAt);
  } else {
    await grantEntitlement({
      userId: event.app_user_id,
      productId: event.product_id,
      source,
      externalTransactionId: event.transaction_id,
      occurredAt,
    });
  }
  await adminClient().from("payment_events").update({ processed_at: new Date().toISOString() }).eq("id", inserted.id);
  return NextResponse.json({ ok: true });
}
