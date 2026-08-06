"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import { useNow } from "@/lib/client/useNow";
import {
  checkNightAudio,
  displayCaption,
  nightAudioSrc,
  speak,
  stopSpeaking,
} from "@/lib/client/narrator";
import {
  NIGHT_TOTAL_SECONDS,
  segmentAt,
  subtitleAt,
} from "@/lib/game/timeline";
import { ROLES } from "@/lib/game/roles";
import type { NightAction, PrivateInfo, Role, SwapTarget } from "@/lib/game/types";
import type { RoomView } from "@/lib/api/views";
import { CardBack, RoleCard } from "@/components/RoleCard";
import { PeekCard } from "@/components/PeekCard";
import { AppShell } from "@/components/AppShell";
import { HostPauseButton, PausedBanner } from "@/components/HostPauseButton";
import { shutdownLiveKitMedia } from "@/lib/client/livekitMedia";

const NIGHT_SOUND_KEY = "monstros:night-sound";

function preferredNightSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(NIGHT_SOUND_KEY);
    if (saved === "0") return false;
    if (saved === "1") return true;
  } catch {
    /* private mode */
  }
  return true;
}

function persistNightSoundOn(on: boolean) {
  try {
    localStorage.setItem(NIGHT_SOUND_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function subscribeNoop() {
  return () => {};
}

export function NightPhase({
  view,
  clockOffsetMs,
  refresh,
}: {
  view: RoomView;
  clockOffsetMs: number;
  refresh: () => Promise<void>;
}) {
  const game = view.game!;
  const now = useNow(clockOffsetMs);
  const effectiveNow = game.pausedAt
    ? new Date(game.pausedAt).getTime()
    : now;
  const elapsed = (effectiveNow - new Date(game.nightStartedAt).getTime()) / 1000;
  const segment = segmentAt(elapsed);
  const subtitle = subtitleAt(elapsed);
  const paused = game.paused;

  const preferredOn = useSyncExternalStore(
    subscribeNoop,
    preferredNightSoundOn,
    () => true,
  );
  const [soundOn, setSoundOn] = useState(preferredOn);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [hasAudioFile, setHasAudioFile] = useState<boolean | null>(null);
  /** Bumps to retry autoplay after toggle-on or a user gesture. */
  const [playToken, setPlayToken] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spokenKeyRef = useRef<string | null>(null);
  const advanceSentRef = useRef(false);
  const wolfPeekSentRef = useRef(false);

  // Night is secret — kill lobby/discussion cams + mics as soon as this phase mounts.
  useEffect(() => {
    void shutdownLiveKitMedia();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void checkNightAudio().then((ok) => {
      if (!cancelled) setHasAudioFile(ok);
    });
    return () => {
      cancelled = true;
      stopSpeaking();
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  // Auto-start narration (default on). Browsers may require one tap — show unlock CTA then.
  useEffect(() => {
    if (hasAudioFile === null) return;

    if (!soundOn) {
      audioRef.current?.pause();
      stopSpeaking();
      return;
    }

    let cancelled = false;

    async function boot() {
      if (hasAudioFile) {
        audioRef.current?.pause();
        const audio = new Audio(nightAudioSrc());
        audio.preload = "auto";
        audio.currentTime = Math.max(0, Math.min(elapsed, NIGHT_TOTAL_SECONDS));
        audioRef.current = audio;
        if (paused) return;
        try {
          await audio.play();
          if (!cancelled) setNeedsGesture(false);
        } catch {
          if (!cancelled) setNeedsGesture(true);
        }
        return;
      }
      if (segment && !paused) {
        spokenKeyRef.current = segment.key;
        speak(segment.narration);
        if (!cancelled) setNeedsGesture(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // Only when audio availability / preference changes — not every clock tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAudioFile, soundOn, playToken]);

  // Werewolves peek the remaining center cards once during their window.
  useEffect(() => {
    if (paused) return;
    if (game.yourRole !== "lobisomem") return;
    if (segment?.key !== "lobisomem") return;
    if (game.hasActed || wolfPeekSentRef.current) return;
    wolfPeekSentRef.current = true;
    void apiPost(`/api/rooms/${view.code}/action`, {
      token: getPlayerToken(),
      action: { type: "lobisomem_peek" },
    }).then(() => refresh());
  }, [
    paused,
    game.yourRole,
    game.hasActed,
    segment?.key,
    view.code,
    refresh,
  ]);

  // Keep the audio playhead aligned with the shared night clock.
  useEffect(() => {
    const audio = audioRef.current;
    if (!soundOn || !hasAudioFile || !audio) return;
    if (paused) {
      audio.pause();
      stopSpeaking();
      return;
    }
    if (audio.paused && !needsGesture) {
      void audio.play().catch(() => setNeedsGesture(true));
    }
    if (Math.abs(audio.currentTime - elapsed) > 0.75) {
      audio.currentTime = Math.max(0, Math.min(elapsed, NIGHT_TOTAL_SECONDS));
    }
  }, [elapsed, soundOn, hasAudioFile, paused, needsGesture]);

  // Narrate each segment once (TTS fallback when no audio file).
  useEffect(() => {
    if (paused || !soundOn || hasAudioFile !== false || !segment || needsGesture) {
      return;
    }
    if (spokenKeyRef.current === segment.key) return;
    spokenKeyRef.current = segment.key;
    speak(segment.narration);
  }, [segment, soundOn, hasAudioFile, paused, needsGesture]);

  // When the night ends, ask the server to advance (idempotent).
  useEffect(() => {
    if (paused) return;
    if (elapsed >= NIGHT_TOTAL_SECONDS && !advanceSentRef.current) {
      advanceSentRef.current = true;
      void apiPost(`/api/rooms/${view.code}/advance`, {
        token: getPlayerToken(),
      }).then(() => refresh());
    }
  }, [elapsed, view.code, refresh, paused]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    persistNightSoundOn(next);
    if (!next) {
      setNeedsGesture(false);
      return;
    }
    setPlayToken((t) => t + 1);
  }

  function unlockWithGesture() {
    setSoundOn(true);
    persistNightSoundOn(true);
    setPlayToken((t) => t + 1);
  }

  const myRole = game.yourRole;
  const chainRole = game.pendingChain;
  // Which role's action UI should be shown right now?
  const activeActionRole: Role | null =
    segment && segment.key === myRole && ROLES[myRole].hasAction && !game.hasActed
      ? myRole
      : segment?.key === "zumbi" && myRole === "zumbi" && chainRole
        ? chainRole
        : null;

  // After the witch peeks, keep the card on screen only for the rest of her
  // night window. Dawn/discussion hide it; results show it again (via filter).
  const showBruxaReveal =
    game.hasActed &&
    !!segment &&
    ((myRole === "bruxa" && segment.key === "bruxa") ||
      (myRole === "zumbi" && segment.key === "zumbi" && !chainRole)) &&
    game.yourInfo.some((i) => i.kind === "viu_jogador");

  const progress = Math.min(1, elapsed / NIGHT_TOTAL_SECONDS);
  const caption = displayCaption(subtitle, segment?.narration);

  return (
    <AppShell className="gap-4">
      <div className="h-2 w-full overflow-hidden rounded-full border-2 border-grave bg-grave">
        <div
          className="h-full bg-ember transition-[width] duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <header className="text-center">
        <h1 className="font-title flicker text-sm text-ember">A NOITE CAIU</h1>
        <div className="panel-pixel mt-3 min-h-16 rounded-lg px-3 py-3">
          <p className="text-parchment leading-snug" aria-live="polite">
            {caption}
          </p>
        </div>
        {segment?.actorPrompt &&
          segment.key === myRole &&
          ROLES[myRole].hasAction &&
          !game.hasActed &&
          !paused && (
            <p className="mt-2 text-sm text-ember">{segment.actorPrompt}</p>
          )}
      </header>

      <PausedBanner paused={paused} />
      <HostPauseButton view={view} refresh={refresh} />

      {needsGesture && soundOn ? (
        <button
          type="button"
          className="btn-pixel btn-pixel--ember w-full rounded-md"
          onClick={unlockWithGesture}
        >
          Toque para ouvir a narração
        </button>
      ) : (
        <button
          type="button"
          className={`btn-pixel w-full rounded-md ${soundOn ? "btn-pixel--ghost" : "btn-pixel--ember"}`}
          onClick={toggleSound}
        >
          {soundOn ? "Som da noite: ligado" : "Som da noite: mudo"}
        </button>
      )}

      <section className="panel-pixel rounded-lg p-3">
        <p className="font-title mb-2 text-center text-[0.55rem] text-parchment-dim">
          CENTRO ({game.centerCount})
        </p>
        <div className="flex min-h-14 justify-center gap-2">
          {game.centerCount === 0 ? (
            <p className="text-sm text-parchment-dim">Nenhuma carta</p>
          ) : (
            Array.from({ length: game.centerCount }, (_, i) => (
              <CardBack key={`c-${i}`} size="sm" label={`${i + 1}`} />
            ))
          )}
        </div>
      </section>

      <section className="flex flex-col items-center gap-2">
        <p className="text-parchment-dim">Sua carta (toque para mostrar/esconder)</p>
        <PeekCard role={myRole} />
      </section>

      {activeActionRole && !paused && (
        <ActionPanel
          view={view}
          actionRole={activeActionRole}
          isChain={activeActionRole !== myRole}
          refresh={refresh}
        />
      )}

      {showBruxaReveal && <BruxaReveal view={view} />}

      <NightInfo
        view={view}
        hideWitchPeek={showBruxaReveal}
        highlight={
          !!segment &&
          segment.key === myRole &&
          !ROLES[myRole].hasAction &&
          game.yourInfo.length === 0
        }
      />

      <p className="mt-auto text-center text-sm text-parchment-dim">
        Não mostre sua tela para ninguém!
      </p>
    </AppShell>
  );
}

/** Full-size peek result — only while the witch's night window is still open. */
function BruxaReveal({ view }: { view: RoomView }) {
  const seen = view.game!.yourInfo.find((i) => i.kind === "viu_jogador");
  if (!seen || seen.kind !== "viu_jogador") return null;
  const name =
    view.players.find((p) => p.id === seen.playerId)?.nickname ?? "???";
  return (
    <section className="panel-pixel flex flex-col items-center gap-3 rounded-lg border-ember p-4">
      <h2 className="font-title text-xs text-ember">VOCÊ ESPIOU</h2>
      <RoleCard role={seen.role} size="md" flip />
      <p className="text-center text-parchment">
        {name} é{" "}
        <span className="text-ember">{ROLES[seen.role].name}</span>
      </p>
      <p className="text-center text-sm text-parchment-dim">
        Memorize agora — a carta some quando sua vez acabar.
      </p>
    </section>
  );
}

/** Renders everything this player learned during the night. */
export function NightInfo({
  view,
  highlight = false,
  hideWitchPeek = false,
}: {
  view: RoomView;
  highlight?: boolean;
  /** Skip bruxa peeks (shown separately during her window / at results). */
  hideWitchPeek?: boolean;
}) {
  const game = view.game!;
  const infos = hideWitchPeek
    ? game.yourInfo.filter((i) => i.kind !== "viu_jogador")
    : game.yourInfo;
  if (infos.length === 0) {
    if (!highlight) return null;
    return (
      <p className="panel-pixel rounded-lg p-4 text-center text-parchment-dim">
        {ROLES[game.yourRole].nightHint}
      </p>
    );
  }
  return (
    <section className="panel-pixel flex flex-col gap-3 rounded-lg p-4">
      <h2 className="font-title text-xs text-parchment">O QUE VOCÊ VIU</h2>
      {infos.map((info, i) => (
        <InfoLine key={i} info={info} view={view} />
      ))}
    </section>
  );
}

function InfoLine({ info, view }: { info: PrivateInfo; view: RoomView }) {
  const nameOf = (id: string) =>
    view.players.find((p) => p.id === id)?.nickname ?? "???";

  switch (info.kind) {
    case "lobisomens": {
      const others = info.wolfIds.filter((id) => id !== view.you.id);
      return (
        <div>
          <p className="text-parchment">
            {others.length > 0
              ? `Lobisomens: ${info.wolfIds.map(nameOf).join(", ")}`
              : "Você é o único lobisomem."}
          </p>
          {info.center && info.center.length > 0 ? (
            <>
              <p className="mb-2 text-parchment-dim">
                Cartas do centro (só agora — memorize!):
              </p>
              <div className="flex gap-2">
                {info.center.map((role, i) => (
                  <RoleCard key={i} role={role} size="sm" flip />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-parchment-dim">
              As cartas do centro só aparecem no turno do lobisomem. Memorize
              quando virá-las.
            </p>
          )}
        </div>
      );
    }
    case "viu_jogador":
      return (
        <div className="flex items-center gap-3">
          <RoleCard role={info.role} size="sm" flip />
          <p className="text-parchment">
            {nameOf(info.playerId)} é{" "}
            <span className="text-ember">{ROLES[info.role].name}</span>
          </p>
        </div>
      );
    case "pegou_centro":
      return (
        <div className="flex items-center gap-3">
          <RoleCard role={info.role} size="sm" flip />
          <p className="text-parchment">
            Você pegou <span className="text-ember">{ROLES[info.role].name}</span>{" "}
            do centro. Agora esse é o seu papel!
          </p>
        </div>
      );
    case "escondeu_centro":
      return (
        <p className="text-parchment">
          Você escondeu a carta do centro {info.index + 1} sem olhar. Ela será
          revelada no fim da discussão!
        </p>
      );
    case "trocou":
      return (
        <div className="flex items-center gap-3">
          <RoleCard role={info.newRole} size="sm" flip />
          <p className="text-parchment">
            Você trocou com{" "}
            {info.target.kind === "player"
              ? nameOf(info.target.playerId)
              : "o centro"}{" "}
            e agora é{" "}
            <span className="text-ember">{ROLES[info.newRole].name}</span>!
          </p>
        </div>
      );
  }
}

function ActionPanel({
  view,
  actionRole,
  isChain,
  refresh,
}: {
  view: RoomView;
  actionRole: Role;
  isChain: boolean;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: NightAction) {
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/api/rooms/${view.code}/action`, {
        token: getPlayerToken(),
        action,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel-pixel flex flex-col gap-3 rounded-lg border-ember p-4">
      <h2 className="font-title pulse-glow text-xs text-ember">
        {isChain
          ? `AGORA VOCÊ É ${ROLES[actionRole].name.toUpperCase()}! AJA!`
          : "SUA VEZ DE AGIR!"}
      </h2>
      <p className="text-parchment-dim">{ROLES[actionRole].nightHint}</p>

      {actionRole === "zumbi" && (
        <CenterPicker
          count={view.game!.centerCount}
          busy={busy}
          onPick={(i) => submit({ type: "zumbi_take", centerIndex: i })}
        />
      )}
      {actionRole === "cacador" && (
        <CenterPicker
          count={view.game!.centerCount}
          busy={busy}
          confirmLabel="Esconder sem olhar"
          onPick={(i) => submit({ type: "cacador_take", centerIndex: i })}
        />
      )}
      {actionRole === "bruxa" && (
        <PlayerPicker
          view={view}
          busy={busy}
          onPick={(id) => submit({ type: "bruxa_look", targetPlayerId: id })}
        />
      )}
      {actionRole === "vampiro" && (
        <VampireTargetPicker
          view={view}
          busy={busy}
          onPick={(target) => submit({ type: "vampiro_swap", target })}
        />
      )}

      {error && <p className="shake text-blood-bright">{error}</p>}
    </section>
  );
}

function CenterPicker({
  count,
  busy,
  onPick,
  confirmLabel = "Confirmar",
}: {
  count: number;
  busy: boolean;
  onPick: (index: number) => void;
  confirmLabel?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex justify-center gap-3">
        {Array.from({ length: count }, (_, i) => (
          <CardBack
            key={i}
            size="md"
            label={`Centro ${i + 1}`}
            selected={selected === i}
            onClick={() => setSelected(i)}
          />
        ))}
      </div>
      <button
        className="btn-pixel btn-pixel--ember w-full rounded-md"
        disabled={selected === null || busy}
        onClick={() => selected !== null && onPick(selected)}
      >
        {busy ? "..." : confirmLabel}
      </button>
    </div>
  );
}

function PlayerPicker({
  view,
  busy,
  onPick,
  confirmLabel = "Confirmar",
}: {
  view: RoomView;
  busy: boolean;
  onPick: (playerId: string) => void;
  confirmLabel?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const targets = view.players.filter((p) => p.id !== view.you.id);
  return (
    <div className="flex flex-col gap-3">
      <div className="scroll-cards flex justify-start gap-3 overflow-x-auto pb-1 sm:justify-center sm:flex-wrap">
        {targets.map((p) => (
          <CardBack
            key={p.id}
            size="md"
            label={p.nickname}
            selected={selected === p.id}
            onClick={() => setSelected(p.id)}
          />
        ))}
      </div>
      <button
        className="btn-pixel btn-pixel--ember w-full rounded-md"
        disabled={!selected || busy}
        onClick={() => selected && onPick(selected)}
      >
        {busy
          ? "..."
          : selected
            ? `${confirmLabel}: ${targets.find((t) => t.id === selected)?.nickname}`
            : confirmLabel}
      </button>
    </div>
  );
}

function VampireTargetPicker({
  view,
  busy,
  onPick,
}: {
  view: RoomView;
  busy: boolean;
  onPick: (target: SwapTarget) => void;
}) {
  const [mode, setMode] = useState<"center" | "player">("player");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          className={`btn-pixel flex-1 rounded-md ${mode === "player" ? "btn-pixel--ember" : "btn-pixel--ghost"}`}
          onClick={() => setMode("player")}
        >
          Jogador
        </button>
        <button
          className={`btn-pixel flex-1 rounded-md ${mode === "center" ? "btn-pixel--ember" : "btn-pixel--ghost"}`}
          onClick={() => setMode("center")}
        >
          Centro
        </button>
      </div>
      {mode === "player" ? (
        <PlayerPicker
          view={view}
          busy={busy}
          onPick={(id) => onPick({ kind: "player", playerId: id })}
        />
      ) : (
        <CenterPicker
          count={view.game!.centerCount}
          busy={busy}
          onPick={(i) => onPick({ kind: "center", index: i })}
        />
      )}
    </div>
  );
}
