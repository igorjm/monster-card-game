"use client";

import { useEffect, useRef, useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import { formatSeconds, useNow } from "@/lib/client/useNow";
import type { RoomView } from "@/lib/api/views";
import { CardBack } from "@/components/RoleCard";
import { PeekCard } from "@/components/PeekCard";
import { NightInfo } from "./NightPhase";
import { AppShell } from "@/components/AppShell";

export function DiscussionPhase({
  view,
  clockOffsetMs,
  refresh,
}: {
  view: RoomView;
  clockOffsetMs: number;
  refresh: () => Promise<void>;
}) {
  const game = view.game!;
  const now = useNow(clockOffsetMs, 500);
  const endsAt = game.discussionEndsAt
    ? new Date(game.discussionEndsAt).getTime()
    : now;
  const remaining = (endsAt - now) / 1000;
  const advanceSentRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  useEffect(() => {
    if (remaining <= 0 && !advanceSentRef.current) {
      advanceSentRef.current = true;
      void apiPost(`/api/rooms/${view.code}/advance`, {
        token: getPlayerToken(),
      }).then(() => refresh());
    }
  }, [remaining, view.code, refresh]);

  async function endEarly() {
    setBusy(true);
    try {
      await apiPost(`/api/rooms/${view.code}/advance`, {
        token: getPlayerToken(),
        force: true,
      });
      await refresh();
    } finally {
      setBusy(false);
      setConfirmEnd(false);
    }
  }

  const urgent = remaining <= 30;

  return (
    <AppShell className="gap-4">
      <header className="text-center">
        <h1 className="font-title text-sm text-ember">O DIA AMANHECEU</h1>
        <p
          className={`font-title mt-2 text-3xl ${urgent ? "shake text-blood-bright" : "text-parchment"}`}
        >
          {formatSeconds(remaining)}
        </p>
        <p className="mt-1 text-parchment-dim">
          Discutam! Quem fez o quê durante a noite?
        </p>
      </header>

      <section className="panel-pixel rounded-lg p-4">
        <p className="mb-2 text-center text-parchment-dim">
          Cartas do centro
          {game.centerCount < 3 ? " (faltando carta escondida/devorada)" : ""}
        </p>
        <div className="flex justify-center gap-3">
          {game.centerCount === 0 ? (
            <p className="text-parchment-dim">Nenhuma carta no centro</p>
          ) : (
            Array.from({ length: game.centerCount }, (_, i) => (
              <CardBack key={i} size="sm" label={`${i + 1}`} />
            ))
          )}
        </div>
      </section>

      <section className="flex flex-col items-center gap-2">
        <p className="text-parchment-dim">Sua carta (segure para espiar)</p>
        <PeekCard role={game.yourRole} />
        <p className="text-center text-sm text-parchment-dim">
          Lembre-se: seu papel pode ter mudado durante a noite!
        </p>
      </section>

      <NightInfo view={view} />

      {view.you.isHost && (
        <div className="mt-auto flex flex-col gap-2">
          {!confirmEnd ? (
            <button
              className="btn-pixel btn-pixel--ghost rounded-md"
              disabled={busy}
              onClick={() => setConfirmEnd(true)}
            >
              Encerrar discussão (todos concordam)
            </button>
          ) : (
            <div className="panel-pixel flex flex-col gap-3 rounded-lg p-4">
              <p className="text-center text-parchment">
                Todos os jogadores concordam em encerrar a discussão e ir para a
                votação?
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-pixel btn-pixel--ghost flex-1 rounded-md"
                  disabled={busy}
                  onClick={() => setConfirmEnd(false)}
                >
                  Voltar
                </button>
                <button
                  className="btn-pixel flex-1 rounded-md"
                  disabled={busy}
                  onClick={endEarly}
                >
                  {busy ? "..." : "Sim, encerrar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
