"use client";

import { useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
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
      </header>

      <div className="grid grid-cols-2 gap-3">
        {targets.map((p) => {
          const isSelected = selected === p.id || game.yourVote === p.id;
          return (
            <button
              key={p.id}
              disabled={voted || busy}
              onClick={() => setSelected(p.id)}
              className={`panel-pixel rounded-lg p-4 text-center transition-transform active:scale-95 ${
                isSelected ? "border-blood-bright text-blood-bright" : "text-parchment"
              } ${voted && game.yourVote !== p.id ? "opacity-40" : ""}`}
            >
              <span className="font-title block text-2xl">
                {p.hasVoted ? "☠" : "?"}
              </span>
              <span className="mt-2 block truncate">{p.nickname}</span>
              {p.hasVoted && (
                <span className="block text-sm text-parchment-dim">votou</span>
              )}
            </button>
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
    </main>
  );
}
