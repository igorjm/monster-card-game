"use client";

import { track } from "@vercel/analytics";

export type FunnelEvent =
  | "room_created"
  | "room_joined"
  | "match_completed"
  | "rematch_clicked"
  | "offer_viewed"
  | "purchase_started";

/** Sends only coarse product events; never room codes, nicknames, age, or player ids. */
export function trackFunnel(event: FunnelEvent, properties: Record<string, string | number | boolean> = {}) {
  track(event, properties);
}
