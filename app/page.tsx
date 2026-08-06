"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiPost,
  getPlayerToken,
  getSavedNickname,
  saveNickname,
} from "@/lib/client/identity";
import type { RoomView } from "@/lib/api/views";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState(() =>
    typeof window === "undefined" ? "" : getSavedNickname(),
  );
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      <img
        src="/art/logo.png"
        alt="Lobisomem por Uma Noite — Monstros"
        className="pixel-art float-slow w-64 max-w-full"
        draggable={false}
      />
      <h1 className="font-title flicker text-center text-lg leading-relaxed text-ember">
        LOBISOMEM
        <span className="block text-xs text-parchment">POR UMA NOITE</span>
        <span className="block text-sm text-blood-bright">MONSTROS</span>
      </h1>

      <div className="panel-pixel w-full rounded-lg p-5">
        <label className="mb-1 block text-parchment-dim">Seu apelido</label>
        <input
          className="input-pixel rounded-md"
          maxLength={16}
          placeholder="Ex.: Zé do Brejo"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          suppressHydrationWarning
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
    </main>
  );
}
