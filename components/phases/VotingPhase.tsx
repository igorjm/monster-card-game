"use client";

import { useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";
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

      <ul className="panel-pixel flex flex-col gap-2 rounded-lg p-3">
        {targets.map((p, i) => {
          const isSelected = selected === p.id || game.yourVote === p.id;
          const dimmed = voted && game.yourVote !== p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={voted || busy}
                onClick={() => setSelected(p.id)}
                className={`flex w-full items-center gap-3 rounded-md border-2 px-3 py-3 text-left transition-transform active:scale-[0.99] ${
                  isSelected
                    ? "border-ember bg-night-card pulse-glow"
                    : "border-night-card bg-grave"
                } ${dimmed ? "opacity-40" : ""} ${
                  voted || busy ? "cursor-default" : ""
                }`}
              >
                <span className="font-title w-5 shrink-0 text-center text-[0.55rem] text-ember">
                  {i + 1}
                </span>
                <span className="font-title flex-1 truncate text-[0.7rem] uppercase text-parchment">
                  {p.nickname}
                </span>
                {p.hasVoted && (
                  <span className="font-title shrink-0 rounded-full border-2 border-grave bg-blood px-1.5 py-0.5 text-[0.45rem] text-parchment">
                    VOTOU
                  </span>
                )}
                {isSelected && (
                  <span className="font-title shrink-0 text-[0.5rem] text-ember">
                    {voted ? "SEU VOTO" : "●"}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

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
