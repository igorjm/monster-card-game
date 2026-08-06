"use client";

import { getPlayerToken } from "@/lib/client/identity";

/** Fire-and-forget leave so closing the tab drops the lobby seat. */
export function leaveRoomKeepalive(code: string) {
  const token = getPlayerToken();
  const body = JSON.stringify({ token });
  try {
    void fetch(`/api/rooms/${code.toUpperCase()}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* unload — best effort */
  }
}
