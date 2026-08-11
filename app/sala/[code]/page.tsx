"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoomView } from "@/lib/client/useRoomView";
import { useLobbyLeave } from "@/lib/client/useLobbyLeave";
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
import { DiscussionVoice } from "@/components/DiscussionVoice";

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { view, error, clockOffsetMs, refresh } = useRoomView(code);
  useLobbyLeave(code, view);

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

  // Keep one A/V session for the whole room visit — mute during night
  // (eyes closed) instead of tearing down, so the browser does not ask
  // for mic/cam permission again at dawn.
  const voiceDormant = view.phase === "noite";
  const voicePaused =
    view.phase === "discussao" && Boolean(view.game?.paused);
  const voiceWide = view.phase === "lobby" || view.phase === "resultado";
  const voiceWidth = voiceWide
    ? "max-w-md md:max-w-lg lg:max-w-xl"
    : "max-w-md md:max-w-lg";

  return (
    <>
      <AmbientMusic active={beforeMatch} />
      <div className="flex min-h-dvh w-full flex-1 flex-col">
        <div
          className={
            voiceDormant
              ? "hidden"
              : `mx-auto w-full min-w-0 shrink-0 ${voiceWidth} pt-[max(1.25rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]`
          }
          aria-hidden={voiceDormant}
        >
          <DiscussionVoice
            view={view}
            paused={voicePaused}
            dormant={voiceDormant}
            variant={view.phase === "lobby" ? "lobby" : "talk"}
          />
        </div>
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
      </div>
    </>
  );
}

/** Shown when the player isn't part of the room yet (e.g. shared link). */
function NotInRoom({ code, error }: { code: string; error: string }) {
  const router = useRouter();
  const { nickname, setNickname } = usePersistedNickname();
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const nickRef = useRef<HTMLInputElement>(null);

  const canJoin = error === "Você não está nesta sala.";
  const hasNick = nickname.trim().length > 0;

  async function join() {
    if (!hasNick) {
      setJoinError("Digite um apelido para entrar.");
      nickRef.current?.focus();
      return;
    }
    setBusy(true);
    setJoinError(null);
    try {
      saveNickname(nickname);
      await apiPost<RoomView>(`/api/rooms/${code.toUpperCase()}/join`, {
        nickname: nickname.trim(),
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
          <label className="mb-1 block text-parchment-dim" htmlFor="join-nick">
            Seu apelido
          </label>
          <input
            id="join-nick"
            ref={nickRef}
            className="input-pixel rounded-md"
            maxLength={16}
            placeholder="Ex.: Zé do Brejo"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setJoinError(null);
            }}
            autoComplete="nickname"
            enterKeyHint="go"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void join();
              }
            }}
          />
          <button
            type="button"
            className="btn-pixel mt-4 w-full rounded-md"
            disabled={!hasNick || busy}
            onClick={join}
          >
            {busy ? "Entrando..." : "Entrar na sala"}
          </button>
          {!hasNick && (
            <p className="mt-2 text-center text-sm text-ember">
              Digite um apelido para liberar o botão
            </p>
          )}
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
        type="button"
        className="btn-pixel btn-pixel--ghost rounded-md"
        onClick={() => router.push("/")}
      >
        Voltar ao início
      </button>
    </AppShell>
  );
}
