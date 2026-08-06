"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoomView } from "@/lib/client/useRoomView";
import { apiPost, getPlayerToken, getSavedNickname } from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";
import { LobbyPhase } from "@/components/phases/LobbyPhase";
import { NightPhase } from "@/components/phases/NightPhase";
import { DiscussionPhase } from "@/components/phases/DiscussionPhase";
import { VotingPhase } from "@/components/phases/VotingPhase";
import { ResultsPhase } from "@/components/phases/ResultsPhase";

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { view, error, clockOffsetMs, refresh } = useRoomView(code);

  if (error) return <NotInRoom code={code} error={error} />;

  if (!view) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="font-title flicker text-sm text-parchment-dim">
          Entrando na vila...
        </p>
      </main>
    );
  }

  switch (view.phase) {
    case "lobby":
      return <LobbyPhase view={view} refresh={refresh} />;
    case "noite":
      return <NightPhase view={view} clockOffsetMs={clockOffsetMs} refresh={refresh} />;
    case "discussao":
      return <DiscussionPhase view={view} clockOffsetMs={clockOffsetMs} refresh={refresh} />;
    case "votacao":
      return <VotingPhase view={view} refresh={refresh} />;
    case "resultado":
      return <ResultsPhase view={view} refresh={refresh} />;
  }
}

/** Shown when the player isn't part of the room yet (e.g. shared link). */
function NotInRoom({ code, error }: { code: string; error: string }) {
  const router = useRouter();
  const [nickname, setNickname] = useState(() =>
    typeof window === "undefined" ? "" : getSavedNickname(),
  );
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const canJoin = error === "Você não está nesta sala.";

  async function join() {
    setBusy(true);
    setJoinError(null);
    try {
      await apiPost<RoomView>(`/api/rooms/${code.toUpperCase()}/join`, {
        nickname,
        token: getPlayerToken(),
      });
      window.location.reload();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Erro inesperado.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-6">
      <h1 className="font-title text-sm text-ember">
        SALA {code.toUpperCase()}
      </h1>
      {canJoin ? (
        <div className="panel-pixel w-full rounded-lg p-5">
          <label className="mb-1 block text-parchment-dim">Seu apelido</label>
          <input
            className="input-pixel rounded-md"
            maxLength={16}
            placeholder="Ex.: Zé do Brejo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button
            className="btn-pixel mt-4 w-full rounded-md"
            disabled={!nickname.trim() || busy}
            onClick={join}
          >
            {busy ? "Entrando..." : "Entrar na sala"}
          </button>
          {joinError && (
            <p className="shake mt-4 text-center text-blood-bright">
              {joinError}
            </p>
          )}
        </div>
      ) : (
        <p className="text-center text-blood-bright">{error}</p>
      )}
      <button
        className="btn-pixel btn-pixel--ghost rounded-md"
        onClick={() => router.push("/")}
      >
        Voltar ao início
      </button>
    </main>
  );
}
