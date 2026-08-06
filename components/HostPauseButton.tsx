"use client";

import { useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";

/** Host-only control to freeze night audio / discussion countdown for everyone. */
export function HostPauseButton({
  view,
  refresh,
}: {
  view: RoomView;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!view.you.isHost || !view.game) return null;
  if (view.phase !== "noite" && view.phase !== "discussao") return null;

  const paused = view.game.paused;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/rooms/${view.code}/pause`, {
        token: getPlayerToken(),
        paused: !paused,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao pausar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={`btn-pixel w-full rounded-md ${paused ? "btn-pixel--ember" : "btn-pixel--ghost"}`}
        disabled={busy}
        onClick={toggle}
      >
        {busy ? "..." : paused ? "Continuar partida" : "Pausar partida"}
      </button>
      {paused && (
        <p className="text-center text-sm text-ember">
          Pausado — áudio e contagem congelados para todos
        </p>
      )}
      {error && (
        <p className="shake text-center text-sm text-blood-bright">{error}</p>
      )}
    </div>
  );
}

/** Banner shown to every player while the host has paused. */
export function PausedBanner({ paused }: { paused: boolean }) {
  if (!paused) return null;
  return (
    <div className="panel-pixel rounded-lg border-ember px-3 py-2 text-center">
      <p className="font-title text-[0.65rem] text-ember">PAUSADO</p>
      <p className="text-sm text-parchment-dim">
        O anfitrião pausou a partida. Aguarde.
      </p>
    </div>
  );
}
