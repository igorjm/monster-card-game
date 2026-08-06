"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoomView } from "@/lib/client/useRoomView";
import { apiPost, getPlayerToken, saveNickname } from "@/lib/client/identity";
import { usePersistedNickname } from "@/lib/client/usePersistedNickname";
import type { RoomView } from "@/lib/api/views";
import { LobbyPhase } from "@/components/phases/LobbyPhase";
import { NightPhase } from "@/components/phases/NightPhase";
import { DiscussionPhase } from "@/components/phases/DiscussionPhase";
import { VotingPhase } from "@/components/phases/VotingPhase";
import { ResultsPhase } from "@/components/phases/ResultsPhase";
import { AppShell } from "@/components/AppShell";
import { AmbientMusic } from "@/components/AmbientMusic";

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { view, error, clockOffsetMs, refresh } = useRoomView(code);

  const beforeMatch = !view || view.phase === "lobby";

  if (error) {
    return (
      <>
        <AmbientMusic />
        <NotInRoom code={code} error={error} />
      </>
    );
  }

  if (!view) {
    return (
      <AppShell className="items-center justify-center">
        <AmbientMusic />
        <p className="font-title flicker text-sm text-parchment-dim">
          Entrando na vila...
        </p>
      </AppShell>
    );
  }

  return (
    <>
      <AmbientMusic active={beforeMatch} />
      {view.phase === "lobby" && (
        <LobbyPhase view={view} refresh={refresh} />
      )}
      {view.phase === "noite" && (
        <NightPhase
          view={view}
          clockOffsetMs={clockOffsetMs}
          refresh={refresh}
        />
      )}
      {view.phase === "discussao" && (
        <DiscussionPhase
          view={view}
          clockOffsetMs={clockOffsetMs}
          refresh={refresh}
        />
      )}
      {view.phase === "votacao" && (
        <VotingPhase view={view} refresh={refresh} />
      )}
      {view.phase === "resultado" && (
        <ResultsPhase view={view} refresh={refresh} />
      )}
    </>
  );
}

/** Shown when the player isn't part of the room yet (e.g. shared link). */
function NotInRoom({ code, error }: { code: string; error: string }) {
  const router = useRouter();
  const { nickname, setNickname } = usePersistedNickname();
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const canJoin = error === "Você não está nesta sala.";

  async function join() {
    setBusy(true);
    setJoinError(null);
    try {
      saveNickname(nickname);
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
    <AppShell className="items-center justify-center gap-5">
      <h1 className="font-title text-sm text-ember">
        SALA {code.toUpperCase()}
      </h1>
      {canJoin ? (
        <div className="panel-pixel w-full rounded-lg p-4 sm:p-5">
          <label className="mb-1 block text-parchment-dim">Seu apelido</label>
          <input
            className="input-pixel rounded-md"
            maxLength={16}
            placeholder="Ex.: Zé do Brejo"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="nickname"
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
    </AppShell>
  );
}
