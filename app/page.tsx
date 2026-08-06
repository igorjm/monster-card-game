"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiPost,
  getPlayerToken,
  saveNickname,
} from "@/lib/client/identity";
import { usePersistedNickname } from "@/lib/client/usePersistedNickname";
import type { RoomView } from "@/lib/api/views";
import { AppShell } from "@/components/AppShell";
import { AmbientMusic } from "@/components/AmbientMusic";

export default function HomePage() {
  const router = useRouter();
  const { nickname, setNickname } = usePersistedNickname();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setBusy("create");
    setError(null);
    try {
      saveNickname(nickname);
      const view = await apiPost<RoomView>("/api/rooms", {
        nickname,
        token: getPlayerToken(),
      });
      router.push(`/sala/${view.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
      setBusy(null);
    }
  }

  async function joinRoom() {
    setBusy("join");
    setError(null);
    try {
      saveNickname(nickname);
      const view = await apiPost<RoomView>(
        `/api/rooms/${code.toUpperCase()}/join`,
        { nickname, token: getPlayerToken() },
      );
      router.push(`/sala/${view.code}`);
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
        <label className="mb-1 block text-parchment-dim">Seu apelido</label>
        <input
          className="input-pixel rounded-md"
          maxLength={16}
          placeholder="Ex.: Zé do Brejo"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoComplete="nickname"
          enterKeyHint="done"
        />

        <button
          className="btn-pixel mt-4 w-full rounded-md"
          disabled={!nickname.trim() || busy !== null}
          onClick={createRoom}
        >
          {busy === "create" ? "Criando..." : "Criar sala"}
        </button>

        <div className="my-4 flex items-center gap-3 text-parchment-dim">
          <span className="h-[2px] flex-1 bg-night-card" />
          ou
          <span className="h-[2px] flex-1 bg-night-card" />
        </div>

        <label className="mb-1 block text-parchment-dim">Código da sala</label>
        <input
          className="input-pixel rounded-md text-center uppercase tracking-[0.5em]"
          maxLength={4}
          placeholder="ABCD"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
        />
        <button
          className="btn-pixel btn-pixel--swamp mt-4 w-full rounded-md"
          disabled={!nickname.trim() || code.length !== 4 || busy !== null}
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
