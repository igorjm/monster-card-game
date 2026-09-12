"use client";

import { useState } from "react";
import type { PublicPlayer, RoomView } from "@/lib/api/views";
import { apiPost, getPlayerToken } from "@/lib/client/identity";

export function HostPlayerControls({ view, player, refresh }: { view: RoomView; player: PublicPlayer; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function act(action: string, enabled?: boolean) {
    setBusy(true);
    try {
      await apiPost(`/api/rooms/${view.code}/players`, {
        token: getPlayerToken(),
        playerId: player.id,
        action,
        enabled,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  if (player.isHost) return null;
  if (player.approval === "pending") {
    return (
      <span className="flex gap-1">
        <button type="button" className="btn-pixel btn-pixel--swamp rounded px-2 py-1 text-[0.5rem]" disabled={busy} onClick={() => act("approve")}>ACEITAR</button>
        <button type="button" className="btn-pixel btn-pixel--ghost rounded px-2 py-1 text-[0.5rem]" disabled={busy} onClick={() => act("reject")}>RECUSAR</button>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap justify-end gap-1">
      <button type="button" className="btn-pixel btn-pixel--ghost rounded px-2 py-1 text-[0.45rem]" disabled={busy} onClick={() => act("mute", !player.microphoneBlocked)}>{player.microphoneBlocked ? "LIBERAR MIC" : "MUTAR"}</button>
      <button type="button" className="btn-pixel btn-pixel--ghost rounded px-2 py-1 text-[0.45rem]" disabled={busy} onClick={() => act("disable-camera", !player.cameraBlocked)}>{player.cameraBlocked ? "LIBERAR CAM" : "SEM CAM"}</button>
      <button type="button" className="btn-pixel btn-pixel--ghost rounded px-2 py-1 text-[0.45rem]" disabled={busy} onClick={() => act("block")}>BLOQUEAR</button>
    </span>
  );
}
