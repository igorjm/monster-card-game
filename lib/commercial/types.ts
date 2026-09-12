export const PRODUCT_IDS = [
  "remove-ads",
  "pack-studio-caos",
  "pack-orbita-sabotagem",
  "founders-bundle",
] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];
export type PurchaseSource = "mercado-pago" | "apple" | "google" | "manual";
export type AgeBand = "unknown" | "13-17" | "adult";

export interface Entitlement {
  productId: ProductId;
  source: PurchaseSource;
  externalTransactionId: string;
  grantedAt: string;
  revokedAt: string | null;
}

export interface RoomMediaPolicy {
  microphoneAllowed: boolean;
  cameraAllowed: boolean;
  cameraMaxHeight: 360;
  cameraDisabledDuringNight: true;
  recordingAllowed: false;
}

export interface ThemeRightsRecord {
  themeId: string;
  status: "approved" | "blocked" | "review-required";
  owner: string;
  provenanceDocument: string;
  legalOpinionDate: string | null;
  trademarkClearanceDate: string | null;
  storeClearanceDate: string | null;
  publishable: boolean;
}

export interface HostAccessSummary {
  ageBand: AgeBand;
  adultHost: boolean;
  adsSuppressed: boolean;
  entitledProducts: ProductId[];
}
