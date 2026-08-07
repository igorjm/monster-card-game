"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import { leaveRoom } from "@/lib/client/leaveRoom";
import { shutdownLiveKitMedia } from "@/lib/client/livekitMedia";
import { buildDeck } from "@/lib/game/engine";
import { ROLES } from "@/lib/game/roles";
import { MIN_PLAYERS, type Role } from "@/lib/game/types";
import type { RoomView } from "@/lib/api/views";
import { RoleCard } from "@/components/RoleCard";
import { CardStrip } from "@/components/CardStrip";
import { AppShell } from "@/components/AppShell";

const DISCUSSION_OPTIONS = [
  { seconds: 300, label: "5 min" },
  { seconds: 420, label: "7 min" },
  { seconds: 600, label: "10 min" },
];

export function LobbyPhase({
  view,
  refresh,
}: {
  view: RoomView;
  refresh: () => Promise<void>;
}) {
  const router = useRouter();
  const [discussionSeconds, setDiscussionSeconds] = useState(
    view.settings.discussionSeconds,
  );
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const enoughPlayers = view.players.length >= MIN_PLAYERS;
  // Stable preview (mumia when 3–4 would randomize mumia/esqueleto).
  const previewRng = () => 0;
  const rolesInGame: Role[] = enoughPlayers
    ? buildDeck(view.players.length, previewRng)
    : buildDeck(MIN_PLAYERS, previewRng);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/rooms/${view.code}/start`, {
        token: getPlayerToken(),
        discussionSeconds,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
      setBusy(false);
    }
  }

  async function leave() {
    setLeaving(true);
    setError(null);
    try {
      await shutdownLiveKitMedia();
      await leaveRoom(view.code);
    } catch {
      // Still leave the screen — seat may already be gone.
    }
    router.replace("/");
  }

  async function copyCode() {
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/sala/${view.code}`
          : view.code;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — code is visible on screen anyway
    }
  }

  return (
    <AppShell wide flushTop className="gap-5">
      <header className="text-center">
        <p className="text-parchment-dim">Código da sala</p>
        <button
          onClick={copyCode}
          className="font-title mt-1 rounded-md border-2 border-dashed border-ember px-4 sm:px-6 py-2 text-xl sm:text-2xl tracking-[0.35em] sm:tracking-[0.4em] text-ember active:scale-95"
        >
          {view.code}
        </button>
        <p className="mt-1 text-sm text-parchment-dim">
          {copied
            ? "Link copiado!"
            : "Toque para copiar o link e envie aos amigos"}
        </p>
      </header>

      <section className="panel-pixel rounded-lg p-4">
        <h2 className="font-title mb-3 text-xs text-parchment">
          JOGADORES ({view.players.length}/7)
        </h2>
        <ul className="flex flex-col gap-2">
          {view.players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-md border-2 border-night-card bg-grave px-3 py-2"
            >
              <span className="h-3 w-3 shrink-0 rounded-full bg-swamp-bright" />
              <span className="flex-1 truncate">
                {p.nickname}
                {p.id === view.you.id && (
                  <span className="text-parchment-dim"> (você)</span>
                )}
              </span>
              {p.isHost && (
                <span className="font-title text-[0.5rem] text-ember">
                  ANFITRIÃO
                </span>
              )}
            </li>
          ))}
        </ul>
        {!enoughPlayers && (
          <p className="mt-3 text-center text-parchment-dim">
            Aguardando pelo menos {MIN_PLAYERS} jogadores...
          </p>
        )}
      </section>

      <section className="panel-pixel min-w-0 rounded-lg p-4">
        <h2 className="font-title mb-3 text-xs text-parchment">
          CARTAS NA PARTIDA ({rolesInGame.length})
        </h2>
        <CardStrip>
          {rolesInGame.map((role, i) => (
            <RoleCard key={`${role}-${i}`} role={role} size="sm" />
          ))}
        </CardStrip>
        <p className="mt-2 text-sm text-parchment-dim">
          {view.players.length >= MIN_PLAYERS ? view.players.length : MIN_PLAYERS}{" "}
          jogadores + 3 cartas no centro · arraste para ver todas
        </p>
        <p className="mt-2 text-sm leading-snug text-parchment-dim">
          Baralho oficial: com 3, um lobisomem e múmia ou esqueleto; com 4, dois
          lobisomens; a partir de 5 entram múmia, esqueleto e aldeão(ões).
        </p>
      </section>

      {view.you.isHost ? (
        <section className="panel-pixel rounded-lg p-4">
          <h2 className="font-title mb-3 text-xs text-parchment">
            TEMPO DE DISCUSSÃO
          </h2>
          <div className="flex gap-2">
            {DISCUSSION_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                onClick={() => setDiscussionSeconds(opt.seconds)}
                className={`btn-pixel flex-1 rounded-md ${
                  discussionSeconds === opt.seconds
                    ? "btn-pixel--ember"
                    : "btn-pixel--ghost"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            className="btn-pixel mt-4 w-full rounded-md"
            disabled={!enoughPlayers || busy || leaving}
            onClick={start}
          >
            {busy ? "Distribuindo cartas..." : "Começar a noite"}
          </button>
          {error && (
            <p className="shake mt-3 text-center text-blood-bright">{error}</p>
          )}
        </section>
      ) : (
        <p className="text-center text-parchment-dim">
          Aguardando o anfitrião começar a partida...
        </p>
      )}

      <button
        type="button"
        className="btn-pixel btn-pixel--ghost w-full rounded-md"
        disabled={leaving || busy}
        onClick={leave}
      >
        {leaving ? "Saindo..." : "Sair da sala"}
      </button>

      <details className="panel-pixel rounded-lg p-4">
        <summary className="font-title cursor-pointer text-xs text-parchment">
          COMO JOGAR
        </summary>
        <ul className="mt-3 flex flex-col gap-2 text-parchment-dim">
          <li>1. Cada um recebe uma carta secreta; 3 vão para o centro.</li>
          <li>2. Durante a noite, cada papel age na ordem: Caçador → Bruxa → Lobisomem → Zumbi → Vampiro.</li>
          <li>
            3. O Caçador esconde uma carta do centro sem olhar. O Zumbi remove
            uma carta do centro e assume o papel. Cartas somem do centro.
          </li>
          <li>4. Ao amanhecer, discutam: quem é o quê?</li>
          <li>
            5. No fim da discussão, a carta do Caçador é revelada. Se for
            lobisomem, os aliados vencem na hora. Senão, todos votam.
          </li>
          <li className="text-parchment">
            Aliados vencem se um lobisomem morrer. Lobisomens vencem se
            sobreviverem. Mortos-vivos vencem se um deles for o mais votado!
          </li>
          {Object.values(ROLES).map((r) => (
            <li key={r.id}>
              <span className="text-ember">{r.name}:</span> {r.description}
            </li>
          ))}
        </ul>
      </details>
    </AppShell>
  );
}
