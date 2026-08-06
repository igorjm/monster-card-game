"use client";

import { useEffect, useRef, useState } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import { formatSeconds, useNow } from "@/lib/client/useNow";
import type { RoomView } from "@/lib/api/views";
import { CardBack } from "@/components/RoleCard";
import { PeekCard } from "@/components/PeekCard";
import { NightInfo } from "./NightPhase";

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
    }
  }

  const urgent = remaining <= 30;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-6">
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
        <p className="mb-2 text-center text-parchment-dim">Cartas do centro</p>
        <div className="flex justify-center gap-3">
          {Array.from({ length: game.centerCount }, (_, i) => (
            <CardBack key={i} size="sm" label={`${i + 1}`} />
          ))}
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
        <button
          className="btn-pixel btn-pixel--ghost mt-auto rounded-md"
          disabled={busy}
          onClick={endEarly}
        >
          Encerrar discussão e votar
        </button>
      )}
    </main>
  );
}
