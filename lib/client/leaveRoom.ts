"use client";

import { apiPost, getPlayerToken } from "@/lib/client/identity";

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

/** Awaited leave for the explicit "Sair da sala" action. */
export async function leaveRoom(code: string) {
  await apiPost(`/api/rooms/${code.toUpperCase()}/leave`, {
    token: getPlayerToken(),
  });
}
