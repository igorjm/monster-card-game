"use client";

import { useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";
import { CardBack } from "@/components/RoleCard";
import { AppShell } from "@/components/AppShell";

export function VotingPhase({
  view,
  refresh,
}: {
  view: RoomView;
  refresh: () => Promise<void>;
}) {
  const game = view.game!;
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voted = !!game.yourVote;
  const targets = view.players.filter((p) => p.id !== view.you.id);

  async function vote() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/rooms/${view.code}/vote`, {
        token: getPlayerToken(),
        targetId: selected,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell flushTop className="gap-5">
      <header className="text-center">
        <h1 className="font-title text-sm text-blood-bright">HORA DA FORCA</h1>
        <p className="mt-2 text-parchment-dim">
          {voted
            ? "Voto registrado. Aguardando os demais..."
            : "Vote em quem deve morrer. Escolha com sabedoria!"}
        </p>
        <p className="font-title mt-2 text-xs text-parchment">
          {game.votedCount}/{view.players.length} VOTARAM
        </p>
        <p className="mt-2 text-sm text-parchment-dim">
          A carta do Caçador só é revelada no resultado.
        </p>
      </header>

      <div className="scroll-cards flex justify-start gap-3 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
        {targets.map((p) => {
          const isSelected = selected === p.id || game.yourVote === p.id;
          const dimmed = voted && game.yourVote !== p.id;
          return (
            <div
              key={p.id}
              className={`relative ${dimmed ? "opacity-40" : ""}`}
            >
              <CardBack
                size="md"
                label={p.nickname}
                selected={isSelected}
                onClick={voted || busy ? undefined : () => setSelected(p.id)}
              />
              {p.hasVoted && (
                <span className="font-title absolute -right-1 -top-1 rounded-full border-2 border-grave bg-blood px-1.5 text-[0.45rem] text-parchment">
                  VOTOU
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!voted && (
        <button
          className="btn-pixel mt-auto w-full rounded-md"
          disabled={!selected || busy}
          onClick={vote}
        >
          {busy
            ? "Votando..."
            : selected
              ? `Votar em ${targets.find((p) => p.id === selected)?.nickname}`
              : "Escolha alguém"}
        </button>
      )}

      {error && <p className="shake text-center text-blood-bright">{error}</p>}
    </AppShell>
  );
}
