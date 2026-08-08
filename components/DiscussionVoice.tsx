"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type Participant,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type TrackPublication,
} from "livekit-client";
import { apiPost, getPlayerToken } from "@/lib/client/identity";
import {
  duckAmbientForVoice,
  unduckAmbientForVoice,
} from "@/lib/client/ambientMusic";
import {
  registerLiveKitRoom,
  shutdownLiveKitMedia,
} from "@/lib/client/livekitMedia";
import type { RoomView } from "@/lib/api/views";

type VoiceStatus = "idle" | "connecting" | "connected" | "error" | "unavailable";

type ParticipantTile = {
  identity: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
};

/**
 * LiveKit A/V for talk phases (lobby, discussion, voting, results).
 * Mic on by default; camera opt-in. Kept mounted across day phases; tears
 * down on unmount when night starts.
 */
export function DiscussionVoice({
  view,
  paused = false,
  variant = "talk",
}: {
  view: RoomView;
  paused?: boolean;
  /** Label only — must not remount / reconnect when it changes. */
  variant?: "lobby" | "talk";
}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [needsMicGesture, setNeedsMicGesture] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiles, setTiles] = useState<ParticipantTile[]>([]);
  const [videoById, setVideoById] = useState<Record<string, Track>>({});
  const roomRef = useRef<Room | null>(null);
  const audioEls = useRef<Map<string, HTMLAudioElement>>(new Map());
  /** User preference — stays true unless they mute. Pause does not clear it. */
  const wantMicRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    roomRef.current = room;
    registerLiveKitRoom(room);

    function setVideoTrack(identity: string, track: Track | null) {
      setVideoById((prev) => {
        if (!track) {
          if (!(identity in prev)) return prev;
          const next = { ...prev };
          delete next[identity];
          return next;
        }
        if (prev[identity] === track) return prev;
        return { ...prev, [identity]: track };
      });
    }

    function participantHasLiveVideo(p: Participant): boolean {
      for (const pub of p.videoTrackPublications.values()) {
        if (pub.isSubscribed !== false && !pub.isMuted && pub.track) {
          return true;
        }
      }
      return false;
    }

    function refreshRoster() {
      const next: ParticipantTile[] = [];
      const local = room.localParticipant;
      if (local.identity) {
        next.push({
          identity: local.identity,
          name: local.name || "Você",
          isLocal: true,
          hasVideo: participantHasLiveVideo(local),
        });
      }
      for (const p of room.remoteParticipants.values()) {
        next.push({
          identity: p.identity,
          name: p.name || p.identity,
          isLocal: false,
          hasVideo: participantHasLiveVideo(p),
        });
      }
      setTiles(next);
    }

    function refreshSpeakers() {
      refreshRoster();
    }

    function attachRemoteTrack(
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) {
      if (track.kind === Track.Kind.Audio) {
        const key = `${participant.identity}:${publication.trackSid}`;
        let el = audioEls.current.get(key);
        if (!el) {
          el = track.attach() as HTMLAudioElement;
          el.autoplay = true;
          el.setAttribute("playsinline", "true");
          document.body.appendChild(el);
          audioEls.current.set(key, el);
        }
      } else if (track.kind === Track.Kind.Video) {
        setVideoTrack(participant.identity, track);
      }
      refreshSpeakers();
    }

    function detachRemoteTrack(
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) {
      if (track.kind === Track.Kind.Audio) {
        const key = `${participant.identity}:${publication.trackSid}`;
        const el = audioEls.current.get(key);
        if (el) {
          track.detach(el);
          el.remove();
          audioEls.current.delete(key);
        }
      } else if (track.kind === Track.Kind.Video) {
        setVideoTrack(participant.identity, null);
      }
      refreshSpeakers();
    }

    function onLocalPublished(publication: LocalTrackPublication) {
      const track = publication.track;
      if (track?.kind === Track.Kind.Video) {
        setVideoTrack(room.localParticipant.identity, track);
      }
      refreshSpeakers();
    }

    function onLocalUnpublished(publication: LocalTrackPublication) {
      if (publication.kind === Track.Kind.Video) {
        setVideoTrack(room.localParticipant.identity, null);
      }
      refreshSpeakers();
    }

    function onTrackMuteChanged(publication: TrackPublication, participant: Participant) {
      if (publication.kind === Track.Kind.Video) {
        if (publication.isMuted || !publication.track) {
          setVideoTrack(participant.identity, null);
        } else if (publication.track) {
          setVideoTrack(participant.identity, publication.track);
        }
      }
      refreshSpeakers();
    }

    room
      .on(RoomEvent.TrackSubscribed, attachRemoteTrack)
      .on(RoomEvent.TrackUnsubscribed, detachRemoteTrack)
      .on(RoomEvent.LocalTrackPublished, onLocalPublished)
      .on(RoomEvent.LocalTrackUnpublished, onLocalUnpublished)
      .on(RoomEvent.TrackMuted, onTrackMuteChanged)
      .on(RoomEvent.TrackUnmuted, onTrackMuteChanged)
      .on(RoomEvent.ParticipantConnected, refreshRoster)
      .on(RoomEvent.ParticipantDisconnected, () => {
        refreshSpeakers();
      })
      .on(RoomEvent.Disconnected, () => {
        if (!cancelled) {
          setStatus("idle");
          setTiles([]);
          setVideoById({});
        }
      });

    let duckedAmbient = false;

    async function connect() {
      setStatus("connecting");
      setError(null);
      try {
        const creds = await apiPost<{ url: string; token: string }>(
          `/api/rooms/${view.code}/voice`,
          { token: getPlayerToken() },
        );
        if (cancelled) return;
        await room.connect(creds.url, creds.token);
        if (cancelled) return;

        duckAmbientForVoice();
        duckedAmbient = true;

        // Camera stays off until the player opts in.
        await room.localParticipant.setCameraEnabled(false).catch(() => {});
        setCamOn(false);

        // Mic on by default; browsers may require a tap for permission.
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          if (cancelled) return;
          wantMicRef.current = true;
          setMicOn(true);
          setNeedsMicGesture(false);
        } catch {
          await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
          if (cancelled) return;
          setMicOn(false);
          setNeedsMicGesture(true);
        }

        setStatus("connected");
        refreshSpeakers();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erro ao conectar a voz.";
        if (msg.includes("não configurada") || msg.includes("503")) {
          setStatus("unavailable");
        } else {
          setStatus("error");
          setError(msg);
        }
      }
    }

    void connect();

    const els = audioEls.current;
    return () => {
      cancelled = true;
      if (duckedAmbient) unduckAmbientForVoice();
      for (const el of els.values()) {
        el.remove();
      }
      els.clear();
      roomRef.current = null;
      void shutdownLiveKitMedia();
    };
    // Reconnect only when the game room changes — stay joined across
    // discussion → voting → results → lobby until night unmounts us.
  }, [view.code]);

  // Host pause → mute mic + cam; restore mic only when unpaused (never auto-restore cam).
  useEffect(() => {
    const room = roomRef.current;
    if (!room || status !== "connected") return;

    if (paused) {
      if (micOn) {
        void room.localParticipant.setMicrophoneEnabled(false).then(() => {
          setMicOn(false);
        });
      }
      if (camOn) {
        void room.localParticipant.setCameraEnabled(false).then(() => {
          setCamOn(false);
          setVideoById((prev) => {
            const id = room.localParticipant.identity;
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
          });
        });
      }
      return;
    }

    if (wantMicRef.current && !micOn && !needsMicGesture) {
      void room.localParticipant
        .setMicrophoneEnabled(true)
        .then(() => {
          setMicOn(true);
          setNeedsMicGesture(false);
        })
        .catch(() => {
          setNeedsMicGesture(true);
        });
    }
  }, [paused, micOn, camOn, status, needsMicGesture]);

  async function setMic(next: boolean) {
    const room = roomRef.current;
    if (!room || status !== "connected" || paused) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      wantMicRef.current = next;
      setMicOn(next);
      setNeedsMicGesture(false);
      setError(null);
    } catch (e) {
      setNeedsMicGesture(true);
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível acessar o microfone.",
      );
    }
  }

  async function setCam(next: boolean) {
    const room = roomRef.current;
    if (!room || status !== "connected" || paused) return;
    try {
      await room.localParticipant.setCameraEnabled(next);
      setCamOn(next);
      if (!next) {
        setVideoById((prev) => {
          const id = room.localParticipant.identity;
          if (!(id in prev)) return prev;
          const nextMap = { ...prev };
          delete nextMap[id];
          return nextMap;
        });
      }
      setError(null);
    } catch (e) {
      setCamOn(false);
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível acessar a câmera.",
      );
    }
  }

  if (status === "unavailable") {
    return (
      <section className="panel-pixel rounded-lg px-3 py-2 text-center text-sm text-parchment-dim">
        Voz em grupo ainda não está ligada neste servidor.
      </section>
    );
  }

  const title = variant === "lobby" ? "VOZ" : "VOZ DA VILA";
  const connecting = status === "connecting" || status === "idle";

  return (
    <section className="panel-pixel flex flex-col gap-2 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <h2 className="font-title flex-1 text-[0.65rem] text-ember">{title}</h2>
        {connecting && (
          <span className="text-sm text-parchment-dim">Conectando…</span>
        )}
        {paused && (
          <span className="text-sm text-parchment-dim">Pausado</span>
        )}
        <div className="flex shrink-0 gap-1.5">
          {needsMicGesture && status === "connected" && !paused ? (
            <AvToggle
              active
              label="Ligar mic"
              ariaLabel="Ligar microfone"
              onClick={() => setMic(true)}
              icon={<MicIcon />}
            />
          ) : (
            <AvToggle
              active={micOn}
              disabled={status !== "connected" || paused}
              label={micOn ? "Mic" : "Mudo"}
              ariaLabel={micOn ? "Mutar microfone" : "Ligar microfone"}
              onClick={() => setMic(!micOn)}
              icon={<MicIcon muted={!micOn} />}
            />
          )}
          <AvToggle
            active={camOn}
            disabled={status !== "connected" || paused}
            label={camOn ? "Cam" : "Cam"}
            ariaLabel={camOn ? "Desligar câmera" : "Ligar câmera"}
            onClick={() => setCam(!camOn)}
            icon={<CamIcon off={!camOn} />}
          />
        </div>
      </div>

      {status === "connected" && tiles.length > 0 && (
        <div className="-mx-1 flex flex-wrap justify-center gap-2 px-1 pb-0.5">
          {tiles.map((tile) => (
            <ParticipantVideoTile
              key={tile.identity}
              tile={tile}
              track={videoById[tile.identity] ?? null}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="shake text-center text-sm text-blood-bright">{error}</p>
      )}
    </section>
  );
}

function AvToggle({
  active,
  disabled,
  label,
  ariaLabel,
  onClick,
  icon,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`btn-pixel flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[0.55rem] leading-none ${
        active ? "btn-pixel--ember" : "btn-pixel--ghost"
      }`}
    >
      {icon}
      <span className="font-title">{label}</span>
    </button>
  );
}

function MicIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {muted ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.18" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );
}

function CamIcon({ off = false }: { off?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {off ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A2 2 0 0 1 17 12v4a2 2 0 0 1-2 2H5.18" />
          <path d="M2 8.5V6a2 2 0 0 1 2-2h7.5" />
          <path d="M22 8l-4.5 3v2.5" />
        </>
      ) : (
        <>
          <rect x="2" y="6" width="13" height="12" rx="2" />
          <path d="M22 8l-5 3.5v1L22 16V8z" />
        </>
      )}
    </svg>
  );
}

function ParticipantVideoTile({
  tile,
  track,
}: {
  tile: ParticipantTile;
  track: Track | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const letter = (tile.name.trim()[0] || "?").toUpperCase();

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !track || track.kind !== Track.Kind.Video) return;
    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  const showVideo = Boolean(track) && tile.hasVideo;
  const label = tile.isLocal ? `${tile.name} (você)` : tile.name;

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 border-night-card bg-grave sm:h-24 sm:w-24">
      {showVideo ? (
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${tile.isLocal ? "scale-x-[-1]" : ""}`}
          autoPlay
          playsInline
          muted={tile.isLocal}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-night">
          <span className="font-title flex h-8 w-8 items-center justify-center rounded-full border-2 border-ember/70 bg-night-card text-[0.65rem] text-ember">
            {letter}
          </span>
        </div>
      )}
      <p className="absolute inset-x-0 bottom-0 truncate bg-night/80 px-1 py-0.5 text-center text-[0.65rem] leading-tight text-parchment">
        {label}
      </p>
    </div>
  );
}
