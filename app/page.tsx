"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiPost,
  getPlayerToken,
  saveNickname,
} from "@/lib/client/identity";
import { usePersistedNickname } from "@/lib/client/usePersistedNickname";
import {
  normalizeRoomCode,
  ROOM_CODE_LENGTH,
} from "@/lib/client/roomCode";
import type { RoomView } from "@/lib/api/views";
import { AppShell } from "@/components/AppShell";
import { AmbientMusic } from "@/components/AmbientMusic";

export default function HomePage() {
  const router = useRouter();
  const { nickname, setNickname } = usePersistedNickname();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nickRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const normalizedCode = normalizeRoomCode(code);
  const hasNick = nickname.trim().length > 0;
  const codeReady = normalizedCode.length === ROOM_CODE_LENGTH;
  const canCreate = hasNick && busy === null;
  const canJoin = hasNick && codeReady && busy === null;

  async function createRoom() {
    if (!hasNick) {
      setError("Digite um apelido para criar a sala.");
      nickRef.current?.focus();
      return;
    }
    setBusy("create");
    setError(null);
    try {
      saveNickname(nickname);
      const view = await apiPost<RoomView>("/api/rooms", {
        nickname: nickname.trim(),
        token: getPlayerToken(),
      });
      router.push(`/sala/${view.code}`);
      // Soft nav can stall after a hydration mismatch; unlock the CTA so
      // the user can retry or the page can finish navigating.
      setBusy(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
      setBusy(null);
    }
  }

  async function joinRoom() {
    if (!hasNick) {
      setError("Digite um apelido para entrar na sala.");
      nickRef.current?.focus();
      return;
    }
    if (!codeReady) {
      setError("O código da sala tem 4 letras.");
      codeRef.current?.focus();
      return;
    }
    setBusy("join");
    setError(null);
    try {
      saveNickname(nickname);
      const view = await apiPost<RoomView>(
        `/api/rooms/${normalizedCode}/join`,
        { nickname: nickname.trim(), token: getPlayerToken() },
      );
      router.push(`/sala/${view.code}`);
      setBusy(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
      setBusy(null);
    }
  }

  return (
    <AppShell className="items-center justify-center gap-6 sm:gap-8">
      <AmbientMusic />
      <img
        src="/art/logo.png"
        alt="Lobisomem por Uma Noite — Monstros"
        className="pixel-art float-slow w-48 sm:w-64 max-w-full"
        draggable={false}
      />
      <h1 className="font-title flicker text-center text-base sm:text-lg leading-relaxed text-ember">
        LOBISOMEM
        <span className="block text-[0.65rem] sm:text-xs text-parchment">
          POR UMA NOITE
        </span>
        <span className="block text-sm text-blood-bright">MONSTROS</span>
      </h1>

      <div className="panel-pixel w-full rounded-lg p-4 sm:p-5">
        <label className="mb-1 block text-parchment-dim" htmlFor="home-nick">
          Seu apelido
        </label>
        <input
          id="home-nick"
          ref={nickRef}
          className="input-pixel rounded-md"
          maxLength={16}
          placeholder="Ex.: Zé do Brejo"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError(null);
          }}
          autoComplete="nickname"
          enterKeyHint="next"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              codeRef.current?.focus();
            }
          }}
        />

        <button
          type="button"
          className="btn-pixel mt-4 w-full rounded-md"
          disabled={!canCreate}
          onClick={createRoom}
        >
          {busy === "create" ? "Criando..." : "Criar sala"}
        </button>

        <div className="my-4 flex items-center gap-3 text-parchment-dim">
          <span className="h-[2px] flex-1 bg-night-card" />
          ou
          <span className="h-[2px] flex-1 bg-night-card" />
        </div>

        <label className="mb-1 block text-parchment-dim" htmlFor="home-code">
          Código da sala
        </label>
        <input
          id="home-code"
          ref={codeRef}
          className="input-pixel rounded-md text-center uppercase tracking-[0.35em]"
          maxLength={ROOM_CODE_LENGTH}
          placeholder="ABCD"
          value={normalizedCode}
          onChange={(e) => {
            setCode(normalizeRoomCode(e.target.value));
            setError(null);
          }}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void joinRoom();
            }
          }}
        />
        {codeReady && !hasNick && (
          <p className="mt-2 text-center text-sm text-ember">
            Digite um apelido acima para liberar o botão Entrar
          </p>
        )}
        <button
          type="button"
          className="btn-pixel btn-pixel--swamp mt-4 w-full rounded-md"
          disabled={!canJoin}
          onClick={joinRoom}
        >
          {busy === "join" ? "Entrando..." : "Entrar na sala"}
        </button>

        {error && (
          <p className="shake mt-4 text-center text-blood-bright">{error}</p>
        )}
      </div>

      <p className="text-center text-parchment-dim">
        3 a 7 jogadores · uma noite · um monstro entre vocês
      </p>
    </AppShell>
  );
}
