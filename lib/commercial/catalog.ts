import type { ProductId } from "./types";

export interface ProductDefinition {
  id: ProductId;
  name: string;
  priceCents: number;
  grants: readonly ProductId[];
  themeId?: string;
  availableForSale: boolean;
}

export const PRODUCT_CATALOG: Record<ProductId, ProductDefinition> = {
  "remove-ads": {
    id: "remove-ads",
    name: "Remover anúncios",
    priceCents: 1490,
    grants: ["remove-ads"],
    availableForSale: true,
  },
  "pack-studio-caos": {
    id: "pack-studio-caos",
    name: "Estúdio em Caos",
    priceCents: 1290,
    grants: ["pack-studio-caos"],
    themeId: "studio-caos",
    availableForSale: false,
  },
  "pack-orbita-sabotagem": {
    id: "pack-orbita-sabotagem",
    name: "Órbita de Sabotagem",
    priceCents: 1290,
    grants: ["pack-orbita-sabotagem"],
    themeId: "orbita-sabotagem",
    availableForSale: false,
  },
  "founders-bundle": {
    id: "founders-bundle",
    name: "Pacote Fundadores",
    priceCents: 3490,
    grants: [
      "remove-ads",
      "pack-studio-caos",
      "pack-orbita-sabotagem",
      "founders-bundle",
    ],
    availableForSale: false,
  },
};

export const STARTER_THEME_ID = "vila-criaturas";

export function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && Object.hasOwn(PRODUCT_CATALOG, value);
}

export function productForTheme(themeId: string): ProductId | null {
  return (
    Object.values(PRODUCT_CATALOG).find((product) => product.themeId === themeId)
      ?.id ?? null
  );
}

export function canUseTheme(themeId: string, products: readonly ProductId[]) {
  const required = productForTheme(themeId);
  return required === null || products.includes(required) || products.includes("founders-bundle");
}
