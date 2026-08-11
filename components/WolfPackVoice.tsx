"use client";

import { useEffect, useRef, useState } from "react";
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
import { releaseLiveKitDevices } from "@/lib/client/livekitMedia";
import type { RoomView } from "@/lib/api/views";

type PackStatus = "connecting" | "connected" | "error" | "unavailable";

type PackTile = {
  identity: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
};

/**
 * Private werewolf A/V during the lobisomem night window.
 * Separate LiveKit room — other players never join.
 */
export function WolfPackVoice({
  view,
  paused,
  peerIds,
}: {
  view: RoomView;
  paused: boolean;
  /** Other wolf player ids (excluding self). Empty = solo, don't connect. */
  peerIds: string[];
}) {
  const [status, setStatus] = useState<PackStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [tiles, setTiles] = useState<PackTile[]>([]);
  const [videoById, setVideoById] = useState<Record<string, Track>>({});
  const roomRef = useRef<Room | null>(null);
  const audioEls = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (peerIds.length === 0) return;

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

    function hasLiveVideo(p: Participant): boolean {
      for (const pub of p.videoTrackPublications.values()) {
        if (pub.isSubscribed !== false && !pub.isMuted && pub.track) {
          return true;
        }
      }
      return false;
    }

    function refreshRoster() {
      const next: PackTile[] = [];
      const local = room.localParticipant;
      if (local.identity) {
        next.push({
          identity: local.identity,
          name: local.name || "Você",
          isLocal: true,
          hasVideo: hasLiveVideo(local),
        });
      }
      for (const p of room.remoteParticipants.values()) {
        next.push({
          identity: p.identity,
          name: p.name || p.identity,
          isLocal: false,
          hasVideo: hasLiveVideo(p),
        });
      }
      setTiles(next);
    }

    function attachRemote(
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
        el.muted = paused;
        if (!paused) void el.play().catch(() => {});
      } else if (track.kind === Track.Kind.Video) {
        setVideoTrack(participant.identity, track);
      }
      refreshRoster();
    }

    function detachRemote(
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
      refreshRoster();
    }

    function onLocalPublished(publication: LocalTrackPublication) {
      if (publication.track?.kind === Track.Kind.Video) {
        setVideoTrack(room.localParticipant.identity, publication.track);
      }
      refreshRoster();
    }

    function onLocalUnpublished(publication: LocalTrackPublication) {
      if (publication.kind === Track.Kind.Video) {
        setVideoTrack(room.localParticipant.identity, null);
      }
      refreshRoster();
    }

    function onMuteChanged(
      publication: TrackPublication,
      participant: Participant,
    ) {
      if (publication.kind === Track.Kind.Video) {
        if (publication.isMuted || !publication.track) {
          setVideoTrack(participant.identity, null);
        } else if (publication.track) {
          setVideoTrack(participant.identity, publication.track);
        }
      }
      refreshRoster();
    }

    room
      .on(RoomEvent.TrackSubscribed, attachRemote)
      .on(RoomEvent.TrackUnsubscribed, detachRemote)
      .on(RoomEvent.LocalTrackPublished, onLocalPublished)
      .on(RoomEvent.LocalTrackUnpublished, onLocalUnpublished)
      .on(RoomEvent.TrackMuted, onMuteChanged)
      .on(RoomEvent.TrackUnmuted, onMuteChanged)
      .on(RoomEvent.ParticipantConnected, refreshRoster)
      .on(RoomEvent.ParticipantDisconnected, refreshRoster);

    async function connect() {
      setStatus("connecting");
      setError(null);
      try {
        // Free mic/cam from the muted village room first.
        await releaseLiveKitDevices();
        if (cancelled) return;

        const creds = await apiPost<{ url: string; token: string }>(
          `/api/rooms/${view.code}/voice`,
          { token: getPlayerToken(), channel: "wolves" },
        );
        if (cancelled) return;
        await room.connect(creds.url, creds.token);
        if (cancelled) return;

        // Pack defaults: mic + cam on so wolves can plan face-to-face.
        const live = !pausedRef.current;
        try {
          await room.localParticipant.setMicrophoneEnabled(live);
          setMicOn(live);
        } catch {
          setMicOn(false);
        }
        try {
          await room.localParticipant.setCameraEnabled(live);
          setCamOn(live);
        } catch {
          setCamOn(false);
        }

        if (!cancelled) {
          setStatus("connected");
          refreshRoster();
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erro na alcateia.";
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
      for (const el of els.values()) el.remove();
      els.clear();
      roomRef.current = null;
      void (async () => {
        try {
          await room.localParticipant.setCameraEnabled(false).catch(() => {});
          await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
          for (const pub of room.localParticipant.videoTrackPublications.values()) {
            pub.track?.stop();
          }
          for (const pub of room.localParticipant.audioTrackPublications.values()) {
            pub.track?.stop();
          }
          await room.disconnect();
        } catch {
          /* ignore */
        }
      })();
    };
    // Connect once per pack session — pause handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.code, peerIds.join("|")]);

  // Host pause during night: mute pack A/V; restore both on resume.
  useEffect(() => {
    const room = roomRef.current;
    if (!room || status !== "connected") return;
    for (const el of audioEls.current.values()) {
      el.muted = paused;
      if (paused) el.pause();
      else void el.play().catch(() => {});
    }
    if (paused) {
      void room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      void room.localParticipant.setCameraEnabled(false).catch(() => {});
      return;
    }
    void room.localParticipant.setMicrophoneEnabled(true).then(() => setMicOn(true)).catch(() => setMicOn(false));
    void room.localParticipant.setCameraEnabled(true).then(() => setCamOn(true)).catch(() => setCamOn(false));
  }, [paused, status]);

  async function setMic(next: boolean) {
    const room = roomRef.current;
    if (!room || status !== "connected" || paused) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicOn(next);
    } catch {
      setMicOn(false);
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
    } catch {
      setCamOn(false);
    }
  }

  if (peerIds.length === 0) return null;

  if (status === "unavailable") {
    return (
      <section className="panel-pixel rounded-lg px-3 py-2 text-center text-sm text-parchment-dim">
        Alcateia (voz) ainda não está ligada neste servidor.
      </section>
    );
  }

  return (
    <section className="panel-pixel flex flex-col gap-2 rounded-lg border-ember p-3">
      <div className="flex items-center gap-2">
        <h2 className="font-title flex-1 text-[0.65rem] text-ember">
          ALCATEIA
        </h2>
        {status === "connecting" && (
          <span className="text-sm text-parchment-dim">Conectando…</span>
        )}
        {paused && (
          <span className="text-sm text-parchment-dim">Pausado</span>
        )}
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            className={`btn-pixel rounded-md px-2.5 py-1.5 text-[0.55rem] ${
              micOn ? "btn-pixel--ember" : "btn-pixel--ghost"
            }`}
            disabled={status !== "connected" || paused}
            onClick={() => setMic(!micOn)}
          >
            {micOn ? "Mic" : "Mudo"}
          </button>
          <button
            type="button"
            className={`btn-pixel rounded-md px-2.5 py-1.5 text-[0.55rem] ${
              camOn ? "btn-pixel--ember" : "btn-pixel--ghost"
            }`}
            disabled={status !== "connected" || paused}
            onClick={() => setCam(!camOn)}
          >
            Cam
          </button>
        </div>
      </div>
      <p className="text-center text-sm text-parchment-dim">
        Só vocês se veem e se ouvem — combinem o plano.
      </p>
      {status === "connected" && tiles.length > 0 && (
        <div className="-mx-1 flex flex-wrap justify-center gap-2 px-1">
          {tiles.map((tile) => (
            <PackTileView
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

function PackTileView({
  tile,
  track,
}: {
  tile: PackTile;
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
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border-2 border-ember/60 bg-grave sm:h-28 sm:w-28">
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
