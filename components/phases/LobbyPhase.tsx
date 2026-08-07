"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import { leaveRoom } from "@/lib/client/leaveRoom";
import { shutdownLiveKitMedia } from "@/lib/client/livekitMedia";
import { buildDeck } from "@/lib/game/engine";
import { ROLES, TEAMS } from "@/lib/game/roles";
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

function useFineHover(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return fine;
}

export function LobbyPhase({
  view,
  refresh,
}: {
  view: RoomView;
  refresh: () => Promise<void>;
}) {
  const router = useRouter();
  const fineHover = useFineHover();
  const [discussionSeconds, setDiscussionSeconds] = useState(
    view.settings.discussionSeconds,
  );
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inspected, setInspected] = useState<{
    role: Role;
    index: number;
  } | null>(null);

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
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — code is visible on screen anyway
    }
  }

  function shareUrl() {
    if (typeof window === "undefined") return view.code;
    return `${window.location.origin}/sala/${view.code}`;
  }

  function shareWhatsApp() {
    const text = `Vem jogar Lobisomem por Uma Noite — Monstros!\nSala ${view.code}: ${shareUrl()}`;
    const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <AppShell wide flushTop className="gap-5">
      <header className="text-center">
        <p className="text-parchment-dim">Código da sala</p>
        <div className="mt-2 flex items-stretch justify-center gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="font-title min-w-0 rounded-md border-2 border-dashed border-ember px-4 sm:px-6 py-2 text-xl sm:text-2xl tracking-[0.35em] sm:tracking-[0.4em] text-ember active:scale-95"
          >
            {view.code}
          </button>
          {view.you.isHost && (
            <button
              type="button"
              onClick={shareWhatsApp}
              className="btn-pixel btn-pixel--swamp shrink-0 rounded-md px-3"
              aria-label="Compartilhar no WhatsApp"
              title="WhatsApp"
            >
              <WhatsAppIcon />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-parchment-dim">
          {copied
            ? "Link copiado!"
            : view.you.isHost
              ? "Toque no código para copiar, ou envie pelo WhatsApp"
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

      <section className="panel-pixel min-w-0 rounded-lg p-4 sm:p-5">
        <h2 className="font-title mb-4 text-xs text-parchment">
          CARTAS NA PARTIDA ({rolesInGame.length})
        </h2>
        <div
          onMouseLeave={() => {
            if (fineHover) setInspected(null);
          }}
        >
          <CardStrip>
            {rolesInGame.map((role, i) => {
              const selected = inspected?.index === i;
              return (
                <button
                  key={`${role}-${i}`}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${ROLES[role].name}. ${fineHover ? "Passe o mouse para ver a ação." : "Toque para ver a ação."}`}
                  className={`shrink-0 rounded-lg p-0.5 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ember ${
                    selected ? "scale-[1.04]" : "active:scale-95"
                  }`}
                  onMouseEnter={() => {
                    if (fineHover) setInspected({ role, index: i });
                  }}
                  onFocus={() => setInspected({ role, index: i })}
                  onClick={() => {
                    if (fineHover) {
                      setInspected({ role, index: i });
                      return;
                    }
                    setInspected((cur) =>
                      cur?.index === i ? null : { role, index: i },
                    );
                  }}
                >
                  <div
                    className={
                      selected
                        ? "rounded-lg ring-2 ring-ember ring-offset-2 ring-offset-grave"
                        : undefined
                    }
                  >
                    <RoleCard role={role} size="sm" />
                  </div>
                </button>
              );
            })}
          </CardStrip>
          {inspected ? (
            <RoleActionPanel
              role={inspected.role}
              dismissible={!fineHover}
              onClose={() => setInspected(null)}
            />
          ) : (
            <p className="mt-4 text-center text-sm leading-snug text-parchment-dim">
              {fineHover
                ? "Passe o mouse numa carta para ver a ação"
                : "Toque numa carta para ver a ação"}
            </p>
          )}
        </div>
        <p className="mt-4 text-sm leading-snug text-parchment-dim">
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
            5. Todos votam. A carta do Caçador só é revelada no resultado.
          </li>
          <li className="text-parchment">
            Mortos-vivos (múmia/esqueleto) vencem se um deles for o mais votado.
            Aliados vencem se um lobisomem morrer, ou se o Caçador escondeu um
            lobisomem e a vila não executou o próprio Caçador. Caso contrário,
            lobisomens vencem. O Zumbi assume outro papel e em si não vence.
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

/** Pixel panel under the deck strip — hover on desktop, tap on mobile. */
function RoleActionPanel({
  role,
  dismissible,
  onClose,
}: {
  role: Role;
  dismissible: boolean;
  onClose: () => void;
}) {
  const meta = ROLES[role];
  const team = TEAMS[meta.team];
  return (
    <div
      className="panel-pixel mt-4 rounded-lg border-ember px-4 py-4 animate-[card-flip-in_0.28s_steps(4)_both]"
      role="region"
      aria-label={`Ação de ${meta.name}`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <RoleCard role={role} size="sm" />
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-title text-[0.7rem] leading-tight text-ember">
                {meta.name.toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-parchment-dim">{team.name}</p>
            </div>
            {dismissible && (
              <button
                type="button"
                className="font-title shrink-0 rounded border-2 border-night-card px-2.5 py-1 text-[0.45rem] text-parchment-dim active:scale-95"
                onClick={onClose}
                aria-label="Fechar"
              >
                FECHAR
              </button>
            )}
          </div>
          <p className="text-sm leading-relaxed text-parchment">
            {meta.description}
          </p>
          <p className="border-t-2 border-night-card pt-2.5 text-sm leading-relaxed text-parchment-dim">
            <span className="font-title text-[0.5rem] tracking-wide text-ember">
              À NOITE
            </span>
            <span className="mt-1 block">{meta.nightHint}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.47 14.38c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.18.27-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.92-.16-.27-.02-.42.12-.56.13-.12.28-.32.42-.48.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3s.99 2.66 1.12 2.85c.14.18 1.95 2.98 4.72 4.18 1.76.76 2.12.83 2.88.7.44-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32zM12.05 21.8h-.01a9.8 9.8 0 0 1-4.98-1.36l-.36-.21-3.7.97 1-3.61-.24-.37a9.78 9.78 0 0 1-1.5-5.22 9.82 9.82 0 0 1 9.8-9.8 9.75 9.75 0 0 1 6.95 2.88 9.76 9.76 0 0 1 2.87 6.94 9.82 9.82 0 0 1-9.83 9.78zm8.3-18.08A11.7 11.7 0 0 0 12.04 0C5.45 0 .1 5.34.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.26-1.64a11.9 11.9 0 0 0 5.78 1.47h.01c6.59 0 11.94-5.35 11.94-11.93 0-3.19-1.24-6.18-3.5-8.43z" />
    </svg>
  );
}
