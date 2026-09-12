"use client";

import type { RoomView } from "@/lib/api/views";
import { HostPlayerControls } from "./HostPlayerControls";

export function HostModerationPanel({ view, refresh }: { view: RoomView; refresh: () => Promise<void> }) {
  if (!view.you.isHost || view.phase === "lobby") return null;
  return (
    <details className="panel-pixel mx-auto mb-4 w-full max-w-md rounded-lg p-3">
      <summary className="cursor-pointer text-center text-sm text-parchment-dim">Controles do anfitrião</summary>
      <ul className="mt-3 space-y-2">
        {view.players.filter((player) => !player.isHost).map((player) => (
          <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-night-card p-2">
            <span>{player.nickname}</span>
            <HostPlayerControls view={view} player={player} refresh={refresh} />
          </li>
        ))}
      </ul>
    </details>
  );
}
