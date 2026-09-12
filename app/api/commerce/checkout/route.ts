import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";
import { errorResponse } from "@/lib/api/respond";
import { PRODUCT_CATALOG, isProductId } from "@/lib/commercial/catalog";
import { requireAdultHost } from "@/lib/supabase/auth";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (process.env.COMMERCIAL_RELEASE_ENABLED !== "1") {
      throw new ApiError("As compras abrem somente após a liberação jurídica e de ativos.", 503);
    }
    const user = await requireAdultHost(req);
    const { productId } = (await req.json()) as { productId?: unknown };
    if (!isProductId(productId)) throw new ApiError("Produto inválido.");
    const product = PRODUCT_CATALOG[productId];
    if (!product.availableForSale) throw new ApiError("Este produto ainda não foi publicado.", 409);

    const intentId = randomUUID();
    const externalReference = `mesa:${intentId}`;
    const { error } = await adminClient().from("purchase_intents").insert({
      id: intentId,
      user_id: user.id,
      product_id: product.id,
      provider: "mercado-pago",
      expected_amount_cents: product.priceCents,
      currency: "BRL",
      external_reference: externalReference,
    });
    if (error) throw new ApiError("Não foi possível iniciar a compra.", 500);

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!token || !appUrl) throw new ApiError("Checkout ainda não configurado.", 503);
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": intentId,
      },
      body: JSON.stringify({
        items: [{ id: product.id, title: product.name, quantity: 1, currency_id: "BRL", unit_price: product.priceCents / 100 }],
        external_reference: externalReference,
        payer: { email: user.email },
        notification_url: `${appUrl}/api/webhooks/mercado-pago?source_news=webhooks`,
        back_urls: {
          success: `${appUrl}/loja?status=success`,
          pending: `${appUrl}/loja?status=pending`,
          failure: `${appUrl}/loja?status=failure`,
        },
        auto_return: "approved",
      }),
    });
    if (!response.ok) throw new ApiError("O checkout recusou a solicitação.", 502);
    const preference = (await response.json()) as { init_point?: string };
    if (!preference.init_point) throw new ApiError("Checkout sem endereço de pagamento.", 502);
    return NextResponse.json({ checkoutUrl: preference.init_point, intentId });
  } catch (error) {
    return errorResponse(error);
  }
}
