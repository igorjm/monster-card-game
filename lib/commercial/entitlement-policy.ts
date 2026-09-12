import { PRODUCT_CATALOG } from "./catalog";
import type { Entitlement, ProductId } from "./types";

export function expandGrantedProducts(entitlements: Entitlement[]): ProductId[] {
  const grants = new Set<ProductId>();
  for (const entitlement of entitlements) {
    if (entitlement.revokedAt) continue;
    for (const grant of PRODUCT_CATALOG[entitlement.productId].grants) grants.add(grant);
  }
  return [...grants];
}
