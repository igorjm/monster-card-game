import { adminClient } from "@/lib/supabase/admin";
import { canUseTheme, productForTheme } from "./catalog";
import type { Entitlement, HostAccessSummary, ProductId, PurchaseSource } from "./types";
import { expandGrantedProducts } from "./entitlement-policy";

export { expandGrantedProducts } from "./entitlement-policy";

export async function listActiveEntitlements(userId: string): Promise<Entitlement[]> {
  const { data, error } = await adminClient()
    .from("entitlements")
    .select("product_id,purchase_source,external_transaction_id,granted_at,revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) throw new Error("Não foi possível consultar as compras.");
  return (data ?? []).map((row) => ({
    productId: row.product_id as ProductId,
    source: row.purchase_source as PurchaseSource,
    externalTransactionId: row.external_transaction_id as string,
    grantedAt: row.granted_at as string,
    revokedAt: row.revoked_at as string | null,
  }));
}

export async function hostAccessSummary(userId: string): Promise<HostAccessSummary> {
  const [{ data: profile }, entitlements] = await Promise.all([
    adminClient().from("host_profiles").select("age_band").eq("user_id", userId).maybeSingle(),
    listActiveEntitlements(userId),
  ]);
  const entitledProducts = expandGrantedProducts(entitlements);
  return {
    ageBand: profile?.age_band ?? "unknown",
    adultHost: profile?.age_band === "adult",
    adsSuppressed: entitledProducts.includes("remove-ads"),
    entitledProducts,
  };
}

export async function assertThemeOwned(userId: string, themeId: string): Promise<void> {
  const required = productForTheme(themeId);
  if (!required) return;
  const access = await hostAccessSummary(userId);
  if (!canUseTheme(themeId, access.entitledProducts)) {
    throw new Error("Este mundo ainda não pertence à conta anfitriã.");
  }
}

export async function grantEntitlement(input: {
  userId: string;
  productId: ProductId;
  source: PurchaseSource;
  externalTransactionId: string;
  occurredAt?: string;
}) {
  const { error } = await adminClient().from("entitlements").upsert(
    {
      user_id: input.userId,
      product_id: input.productId,
      purchase_source: input.source,
      external_transaction_id: input.externalTransactionId,
      granted_at: input.occurredAt ?? new Date().toISOString(),
      revoked_at: null,
    },
    { onConflict: "purchase_source,external_transaction_id,product_id" },
  );
  if (error) throw new Error("Falha ao registrar a compra.");
}

export async function revokeTransaction(
  source: PurchaseSource,
  externalTransactionId: string,
  occurredAt = new Date().toISOString(),
) {
  const { error } = await adminClient()
    .from("entitlements")
    .update({ revoked_at: occurredAt })
    .eq("purchase_source", source)
    .eq("external_transaction_id", externalTransactionId);
  if (error) throw new Error("Falha ao revogar a compra.");
}
